const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runRegression}=require('../scripts/regression.cjs');
test('every frozen v5.16 baseline recalculates unchanged and emits an inspectable report',()=>{
  const report=runRegression();assert.ok(report.total>=12);assert.equal(report.failed,0,JSON.stringify(report.cases.filter(c=>c.status==='fail'),null,2));
});
