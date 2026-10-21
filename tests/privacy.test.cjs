const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
test('keys default to session storage; explicit persistence remains opt-in and can be cleared',()=>{
  const e=loadEngine({ui:true});assert.equal(e.json('aiGetConfig()').sessionOnly,true);
  e.run("aiSaveConfig({...AI_DEF,key:'synthetic-key'});");
  assert.equal(e.context.localStorage.getItem('mingli_ai_cfg'),null);
  assert.equal(JSON.parse(e.context.sessionStorage.getItem('mingli_ai_cfg')).key,'synthetic-key');
  e.run("aiSaveConfig({...AI_DEF,key:'synthetic-key',sessionOnly:false});");
  assert.equal(e.context.sessionStorage.getItem('mingli_ai_cfg'),null);
  assert.equal(JSON.parse(e.context.localStorage.getItem('mingli_ai_cfg')).sessionOnly,false);
  e.run('aiClearStoredKey()');assert.equal(e.json('aiGetConfig()').key,'');assert.equal(e.context.localStorage.getItem('mingli_ai_cfg'),null);
});
test('unmarked legacy keys migrate; explicit saved choices survive reload',()=>{
  const e=loadEngine({ui:true});e.context.localStorage.setItem('mingli_ai_cfg',JSON.stringify({key:'legacy-synthetic'}));
  assert.equal(e.json('aiGetConfig()').sessionOnly,true);assert.equal(e.context.localStorage.getItem('mingli_ai_cfg'),null);
  assert.equal(JSON.parse(e.context.sessionStorage.getItem('mingli_ai_cfg')).key,'legacy-synthetic');
  const old=loadEngine({ui:true});old.context.localStorage.setItem('mingli_ai_cfg',JSON.stringify({key:'chosen-synthetic',sessionOnly:false}));assert.equal(old.json('aiGetConfig()').sessionOnly,false);
});
test('denied browser storage retains keys in page memory and reports the actual mode',()=>{
  const e=loadEngine({ui:true});const deny={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  e.context.localStorage=deny;e.context.sessionStorage=deny;
  e.run("aiSaveConfig({...AI_DEF,key:'memory-synthetic',sessionOnly:false})");
  assert.equal(e.json('aiGetConfig()').key,'memory-synthetic');assert.equal(e.run('aiKeyStorage'),'memory');assert.equal(e.json('aiGetConfig()').sessionOnly,true);
  e.run('aiClearStoredKey()');assert.equal(e.json('aiGetConfig()').key,'');
});
