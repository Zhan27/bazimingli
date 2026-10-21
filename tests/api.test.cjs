const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const api=require('../lib/index.cjs'),{loadEngine}=require('./helpers.cjs');
test('public engine calculates without a DOM or storage and keeps its JSON input immutable',()=>{
  const input={date:'2024-02-10',time:'12:00'},before=JSON.stringify(input),r=api.calculateChart(input);
  assert.deepEqual(Array.from(r.pillars,p=>p.text),['甲辰','丙寅','甲辰','庚午']);assert.equal(JSON.stringify(input),before);assert.equal(JSON.parse(JSON.stringify(r)).schemaVersion,'1.0.0');
  const e=loadEngine();assert.equal(e.run('typeof document'), 'undefined');assert.equal(e.run('typeof localStorage'),'undefined');
});
test('three separated modules share independent inputs/outputs and deterministic reference years',()=>{
  for(const module of ['ziwei','qimen','liuyao']){
    const x=api.calculateModule(module,{date:'2024-02-10',time:'12:00',referenceYear:2024});
    assert.equal(JSON.stringify(x),JSON.stringify(api.calculateModule(module,{date:'2024-02-10',time:'12:00',referenceYear:2024})));
    assert.equal(x.module,module);assert.ok(Object.keys(x.result).length>5);
  }
  const z=api.calculateModule('ziwei',{date:'2024-02-10',referenceYear:2024}).result;assert.equal(Object.keys(z.stars).length,14);assert.equal(z.daLim.list.length,12);
  assert.throws(()=>api.calculateModule('missing',{date:'2024-02-10'}));
});
test('JSON chart differences, debug facts, school conflicts, evidence graph and bounded batch are usable',()=>{
  const a={date:'2024-02-10',time:'22:59'},b={...a,time:'23:00'};
  const diff=api.compareChartFacts(api.calculateChart(a),api.calculateChart(b));assert.ok(diff.differences.some(d=>d.path.includes('pillars.2')));
  assert.equal(api.compareSchools(a).length,5);assert.ok(api.calendarDebug(a).nextTerm.clock);assert.ok(api.chartEvidenceGraph(api.calculateChart(a)).edges.length>0);
  assert.equal(api.batchCalculate([a,{date:'1800-01-01'}])[1].status,'fail');assert.throws(()=>api.batchCalculate(Array(1001).fill(a)));
  assert.equal(api.calculateChart({...a,unknownTime:true}).kind,'unknown-time');
});
test('custom declarative scoring packs are validated, isolated and identify changed results',()=>{
  const e=loadEngine(),strength=e.json('STRENGTH_RULES'),input={date:'2024-02-10'};
  const pack={id:'example-custom',version:'1',strength};pack.strength.month.same=10;pack.strength.month.resource=10;
  const result=api.calculateChart(input,{rulePack:pack});assert.equal(result.strength.rule,'example-custom@1');assert.notEqual(result.strength.score,api.calculateChart(input).strength.score);
  assert.equal(api.calculateChart(input).strength.rule,'legacy-strength-v1');
  assert.throws(()=>api.validateRulePack({...pack,strength:{}}));assert.throws(()=>api.validateRulePack({id:'../bad',version:'1'}));
});
