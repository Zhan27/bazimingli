const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine,memoryStorage}=require('./helpers.cjs');
const rec={id:'same-id',name:'样本',dateStr:'2024-02-10',hourIdx:6,note:'原备注',ts:1};
function setup(){const e=loadEngine(),storage=memoryStorage({ml_records:JSON.stringify([rec,{...rec,id:'other',dateStr:'2023-01-01',name:'甲',ts:2}]),zw_records:JSON.stringify([{...rec,name:'紫微样本'}]),mingli_ai_cfg:'SYNTHETIC_KEY_CONFIG'});e.context.storage=storage;return {e,storage};}
test('unified listing searches notes/places, filters categories and applies deterministic sorting',()=>{
  const {e}=setup();assert.equal(e.json('listRecordEntries({},storage)').length,3);assert.equal(e.json(`listRecordEntries({query:'原备注',category:'zw_records'},storage)`).length,1);assert.equal(e.json(`listRecordEntries({sort:'date-asc'},storage)`)[0].record.id,'other');assert.equal(e.json(`listRecordEntries({sort:'updated-desc'},storage)`)[0].record.id,'other');assert.throws(()=>e.run(`listRecordEntries({category:'mingli_ai_cfg'},storage)`),/筛选/);
});
test('batch deletion identifies records by category and ID, and never touches API settings',()=>{
  const {e,storage}=setup();e.run(`deleteRecordEntries([{key:'ml_records',id:'same-id'}],storage)`);assert.equal(JSON.parse(storage.getItem('ml_records')).length,1);assert.equal(JSON.parse(storage.getItem('zw_records')).length,1);assert.equal(storage.getItem('mingli_ai_cfg'),'SYNTHETIC_KEY_CONFIG');
  assert.throws(()=>e.run(`deleteRecordEntries([{key:'zw_records',id:'same-id'},{key:'zw_records',id:'same-id'}],storage)`),/重复/);assert.equal(JSON.parse(storage.getItem('zw_records')).length,1);
});
test('selected backup format merges safely, retains notes, and refuses category overflow before writes',()=>{
  const {e,storage}=setup();const backup=e.json(`createSelectedRecordBackup([{key:'ml_records',id:'same-id'}],storage)`);assert.equal(backup.version,'v6-selection');assert.equal(JSON.stringify(backup).includes('SYNTHETIC_KEY_CONFIG'),false);assert.equal(backup.ml_records[0].note,'原备注');
  e.context.backup=backup;e.run(`updateRecordNote('ml_records','same-id','新备注',storage);restoreRecordBackup(backup,storage)`);assert.equal(JSON.parse(storage.getItem('ml_records')).length,2);assert.equal(JSON.parse(storage.getItem('ml_records'))[0].note,'原备注');
  const full=Array.from({length:50},(_,i)=>({...rec,id:'id'+i}));storage.setItem('ml_records',JSON.stringify(full));assert.throws(()=>e.run('restoreRecordBackup(backup,storage)'),/50/);assert.equal(JSON.parse(storage.getItem('ml_records')).length,50);
});
test('failed batch writes roll back preceding categories, and clear removes legacy resurrection without touching settings',()=>{
  const {e,storage}=setup(),before=storage.getItem('ml_records'),set=storage.setItem;let failed=false;storage.setItem=(key,value)=>{if(key==='zw_records'&&!failed){failed=true;throw Error('quota');}set(key,value);};
  assert.throws(()=>e.run(`deleteRecordEntries([{key:'ml_records',id:'same-id'},{key:'zw_records',id:'same-id'}],storage)`),/已还原/);assert.equal(storage.getItem('ml_records'),before);
  storage.setItem=set;storage.setItem('mingli_records',JSON.stringify([{...rec,id:'legacy'}]));e.run('clearAllRecordEntries(storage);migrateLegacyRecords(storage)');assert.equal(storage.getItem('mingli_records'),null);assert.equal(e.json('listRecordEntries({},storage)').length,0);assert.equal(storage.getItem('mingli_ai_cfg'),'SYNTHETIC_KEY_CONFIG');
});
