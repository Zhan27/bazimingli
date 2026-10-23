const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine,memoryStorage}=require('./helpers.cjs');
const left={name:'合成甲',date:'1990-05-17',time:'23:30',gender:1,place:'北京',options:{dayBoundary:'zi-zheng',schoolId:4,utcOffsetMinutes:330,dstMinutes:60,trueSolar:true,wxMode:'stems-all-hidden',apiKey:'NEVER_EXPORT'}},right={name:'合成乙',date:'1992-01-15',time:'08:15',gender:0,options:{}};
function setup(){const e=loadEngine(),storage=memoryStorage({mingli_ai_cfg:'SECRET_SETTING'});e.context.storage=storage;e.context.left=left;e.context.right=right;return {e,storage};}
test('paired history sanitizes nested inputs, retains exact options, deduplicates and backs up with v7',()=>{
  const {e,storage}=setup();
  // Use a published display mode; unknown modes must fail rather than drift silently.
  e.context.left={...left,options:{...left.options,wxMode:'stems-main-qi'}};
  const r=e.json('savePairRecord(left,right,2034,storage)');assert.equal(r.left.time,'23:30');assert.equal(r.left.options.utcOffsetMinutes,330);assert.equal(r.referenceYear,2034);
  e.run('savePairRecord(left,right,2034,storage)');assert.equal(JSON.parse(storage.getItem('hh_records')).length,1);
  e.context.record=r;e.run("updateRecordNote('hh_records',record.id,'两盘备注',storage);savePairRecord(left,right,2034,storage)");assert.equal(e.json("readStoredRecords('hh_records',storage)")[0].note,'两盘备注');
  const backup=e.json('createRecordBackup(storage)');assert.equal(backup.version,'v7');assert.equal(Object.keys(backup).filter(k=>k.endsWith('_records')).length,6);assert.ok(!JSON.stringify(backup).includes('NEVER_EXPORT'));assert.ok(!JSON.stringify(backup).includes('SECRET_SETTING'));
  e.context.backup=backup;e.run('clearAllRecordEntries(storage);restoreRecordBackup(backup,storage)');assert.equal(e.json("readStoredRecords('hh_records',storage)")[0].left.options.schoolId,4);
  const selected=e.json("createSelectedRecordBackup([{key:'hh_records',id:record.id}],storage)");assert.equal(selected.version,'v7-selection');
  e.context.selected=selected;e.run('restoreRecordBackup(selected,storage)');assert.equal(e.json("readStoredRecords('hh_records',storage)").length,1);
  e.run("restoreRecordBackup({version:'v5',ml_records:[]},storage)");assert.equal(e.json("readStoredRecords('hh_records',storage)").length,1);assert.equal(storage.getItem('mingli_ai_cfg'),'SECRET_SETTING');
});
test('nested pair failures validate before writes and multi-store quota failures roll back atomically',()=>{
  const {e,storage}=setup();e.context.left={...left,options:{...left.options,wxMode:'stems-main-qi'}};const record=e.json('savePairRecord(left,right,2024,storage)'),before=storage.getItem('hh_records');
  for(const changes of [{referenceYear:2100},{left:{...record.left,time:'24:00'}},{right:{...record.right,options:{dayBoundary:'wrong'}}},{left:{...record.left,options:{utcOffsetMinutes:900}}}]){
    e.context.bad={version:'v7',ml_records:[],hh_records:[{...record,...changes}]};assert.throws(()=>e.run('restoreRecordBackup(bad,storage)'));assert.equal(storage.getItem('hh_records'),before);assert.equal(storage.getItem('ml_records'),null);
  }
  e.context.bad={version:'v5',hh_records:[record]};assert.throws(()=>e.run('restoreRecordBackup(bad,storage)'),/v7/);
  const set=storage.setItem;let failed=false;storage.setItem=(k,v)=>{if(k==='hh_records'&&!failed){failed=true;throw Error('quota');}set(k,v);};e.context.backup={version:'v7',ml_records:[],hh_records:[]};assert.throws(()=>e.run('restoreRecordBackup(backup,storage)'),/已还原/);assert.equal(storage.getItem('ml_records'),null);assert.equal(storage.getItem('hh_records'),before);
});
