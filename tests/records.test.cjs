const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine,memoryStorage}=require('./helpers.cjs');
const e=loadEngine();
const rec={id:'12345',name:'样本',dateStr:'2024-02-10',hourIdx:6,gender:1,bazi:'甲辰 丙寅 甲辰 庚午',time:'12:34',dayBoundary:'zi-chu',place:'乌鲁木齐',trueSun:true};
function restore(data,storage=memoryStorage()){
  e.context.input=data;e.context.storage=storage;
  return e.run('restoreRecordBackup(input,storage)');
}
test('backup uses ml_records; round trip restores all five categories and excludes secrets',()=>{
  const store=memoryStorage({ml_records:JSON.stringify([{...rec,key:'old',apiKey:'secret-nested-field'}]),mingli_ai_config:JSON.stringify({key:'secret-setting-value'})});
  e.context.storage=store;
  const data=e.json('createRecordBackup(storage)');
  assert.equal(data.version,'v5');assert.equal(data.ml_records[0].name,'样本');
  assert.equal(JSON.stringify(data).includes('secret'),false);
  assert.equal(Object.hasOwn(data,'mingli_records'),false);
  store.clear();assert.equal(restore(data,store),5);
  assert.deepEqual(JSON.parse(store.getItem('ml_records'))[0],{...rec,key:'old'});
});
test('v4 mingli_records backups migrate, both keys merge without duplicate IDs',()=>{
  const store=memoryStorage();
  restore({version:'v4',mingli_records:[rec]},store);
  assert.equal(JSON.parse(store.getItem('ml_records')).length,1);
  assert.equal(store.getItem('mingli_records'),null);
  restore({version:'v4',ml_records:[rec],mingli_records:[rec,{...rec,id:'54321'}]},store);
  assert.equal(JSON.parse(store.getItem('ml_records')).length,2);
});
test('local legacy key migrates once and cannot resurrect after clearing',()=>{
  const store=memoryStorage({mingli_records:JSON.stringify([rec])});e.context.storage=store;
  e.run('migrateLegacyRecords(storage)');assert.equal(store.getItem('mingli_records'),null);
  store.removeItem('ml_records');e.run('migrateLegacyRecords(storage)');assert.equal(store.getItem('ml_records'),null);
});
test('malformed imports fail before any storage mutation',()=>{
  for(const data of [null,[],{}, {version:'v99',ml_records:[]},{version:'v5',ml_records:{}},{version:'v5',ml_records:Array.from({length:51},(_,i)=>({...rec,id:String(i)}))},
    ...["x');alert(1);//",'<img src=x onerror=alert(1)>','',{}].map(id=>({version:'v5',ml_records:[{...rec,id}]})),
    ...[{hourIdx:12},{dateStr:'1800-01-01'},{dateStr:'2024-02-30'},{time:'24:01'},{name:'x'.repeat(101)},{gender:'1'},{dayBoundary:'anything'}].map(fields=>({version:'v5',ml_records:[{...rec,...fields}]})),
    {version:'v5',ml_records:[rec],bz_records:[{...rec,hourIdx:NaN}]},{version:'v5',ml_records:[rec,rec]}]){
    const store=memoryStorage({ml_records:'[]'});assert.throws(()=>restore(data,store));assert.equal(store.getItem('ml_records'),'[]');
  }
});
test('storage quota failure rolls back preceding category writes',()=>{
  const store=memoryStorage({ml_records:'[]',bz_records:'[]'}),set=store.setItem;
  let failed=false;
  store.setItem=(k,v)=>{if(k==='bz_records'&&!failed){failed=true;throw new Error('quota');}set(k,v);};
  assert.throws(()=>restore({version:'v5',ml_records:[rec],bz_records:[rec]},store),/已还原/);
  assert.equal(store.getItem('ml_records'),'[]');assert.equal(store.getItem('bz_records'),'[]');
});
