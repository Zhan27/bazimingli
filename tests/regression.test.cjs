const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runRegression}=require('../scripts/regression.cjs');
test('frozen calendar and strength facts plus explicit neutral amendments emit an inspectable report',()=>{
  const report=runRegression();assert.ok(report.total>=12);assert.equal(report.failed,0,JSON.stringify(report.cases.filter(c=>c.status==='fail'),null,2));
});
test('only the three reviewed neutral use-god facts depart from the retained historical fixture',()=>{
  const report=runRegression(false),amended=report.cases.filter(c=>c.amendment);
  assert.deepEqual(amended.map(c=>c.id),['legacy-01','legacy-03','legacy-04']);
  for(const c of amended){assert.equal(c.actual.strengthType,'中和');const {yongShen:old,...previous}=c.previousExpected,{yongShen:now,...actual}=c.actual;assert.deepEqual(actual,previous);assert.equal(old,c.amendment.previous);assert.equal(now,c.amendment.expected);assert.ok(c.amendment.reason.length>20);}
});
