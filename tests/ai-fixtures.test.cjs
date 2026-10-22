const {test}=require('node:test'),assert=require('node:assert/strict');
test('versioned synthetic AI contract fixtures emit a bounded report and reject injected faults',()=>{
  const r=require('../scripts/check-ai-fixtures.cjs').evaluateFixtures();assert.equal(r.summary.cases,6);assert.equal(r.summary.expectationsMatched,6);assert.equal(r.summary.syntheticFaultCasesRejected,5);assert.equal(r.cases.find(c=>c.id==='truncated-json').complete,false);assert.equal(r.summary.paidRequests,0);assert.equal(r.promptVersions.length,5);
});
