const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine,memoryStorage}=require('./helpers.cjs');

test('a stale delete action does not overwrite unreadable history',()=>{
  const engine=loadEngine({ui:true});
  const store=memoryStorage({ml_records:'{broken'});
  const notices=[];
  engine.context.localStorage=store;
  engine.context.workbenchToast=message=>notices.push(message);
  engine.run("recordDelete('old-record')");
  assert.equal(store.getItem('ml_records'),'{broken');
  assert.match(notices[0],/删除失败/);
});

test('comprehensive clear restores history when legacy removal fails',()=>{
  const engine=loadEngine({ui:true});
  const original=JSON.stringify([{id:'original',dateStr:'2024-02-10',hourIdx:5}]);
  const store=memoryStorage({ml_records:original,mingli_records:'[]'});
  const notices=[];
  const remove=store.removeItem;
  store.removeItem=key=>{
    if(key==='mingli_records')throw new Error('blocked');
    remove(key);
  };
  engine.context.localStorage=store;
  engine.context.confirm=()=>true;
  engine.context.workbenchToast=message=>notices.push(message);
  engine.run('clearRecords()');
  assert.equal(store.getItem('ml_records'),original);
  assert.equal(store.getItem('mingli_records'),'[]');
  assert.match(notices[0],/清空失败/);
});
