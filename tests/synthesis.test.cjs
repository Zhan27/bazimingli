const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine({ui:true});
function summary(pillars,extra={}){e.context.fixture={pillars,...extra};return e.json(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');Object.assign(z,fixture);z.dg=z.pillars[2][0];[z.yearGZ,z.monthGZ,z.dayGZ,z.hourGZ]=z.pillars;return buildMingGeSummary(z)})()`);}
test('month premise uses ten-god identity, never a score tier; day self is excluded from helpers',()=>{
  const s=summary([[3,3],[7,9],[0,0],[9,11]]);
  assert.equal(s.month.god,'正官');assert.equal(s.pattern,'正官提纲');
  assert.equal(s.visible.some(n=>n.pillar===2),false);
  assert.equal(s.month.exposed,true);assert.ok(s.obstacles.some(x=>x.id==='officer-output'));
  assert.ok(s.obstacles.find(x=>x.id==='officer-output').remedies.some(x=>x.state==='透干有根'));
});
test('hidden and floating remedies are distinct; generic use-god exposure cannot certify a pattern',()=>{
  const hidden=summary([[3,3],[7,9],[0,0],[3,5]]);
  const floating=summary([[3,3],[7,9],[0,6],[9,5]]);
  assert.equal(hidden.obstacles.find(x=>x.id==='officer-output').resolution,'藏干待引');
  assert.equal(floating.obstacles.find(x=>x.id==='officer-output').resolution,'透干待根');
  assert.notEqual(hidden.state,'成格');assert.notEqual(floating.state,'成格');
});
test('food and wealth premises select different paths; root and stem evidence retain pillar positions',()=>{
  const a=summary([[4,4],[2,6],[0,2],[6,8]]),b=summary([[4,4],[2,10],[0,2],[6,8]]);
  assert.equal(a.month.god,'伤官');assert.equal(b.month.god,'偏财');
  assert.notDeepEqual(a.paths.map(x=>x.id),b.paths.map(x=>x.id));
  for(const x of [...a.paths,...a.obstacles])assert.ok(x.evidence.length);
  assert.equal(new Set(a.visible.map(x=>x.id)).size,3);
});
test('neutral and following states, multiple month candidates and missing transit retain explicit branches',()=>{
  const s=summary([[2,2],[4,4],[0,0],[8,8]],{strengthType:'中和',dy:{dyList:[]}});
  assert.equal(s.strength,'中和');assert.ok(s.month.candidates.length>1);assert.equal(s.transits.length,0);
  const f=summary([[2,2],[4,4],[0,0],[8,8]],{strengthType:'从弱',congGe:true});
  assert.equal(f.state,'从势另论');assert.match(f.focus,/顺势/);
});
test('synthesis is deterministic, does not mutate charts or alter existing calculation identity',()=>{
  assert.equal(e.run(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');const before=JSON.stringify(z);const a=buildMingGeSummary(z),b=buildMingGeSummary(z);return JSON.stringify(a)===JSON.stringify(b)&&before===JSON.stringify(z)})()`),true);
  const card=e.run(`zhMingGeCard(zhCompute(new Date(2024,1,10),6,1,''))`);
  assert.match(card,/总断依据/);assert.match(card,/典籍与规则出处/);assert.doesNotMatch(card,/质地断|根基完整、中正平和/);
});
test('integrated structure score equals its complete ledger across twelve months',()=>{
  const rows=e.json(`Array.from({length:12},(_,m)=>{const z=zhCompute(new Date(2024,m,15),6,1,'');const d=zhDingDang(z);return {score:d.score,sum:d.basis.reduce((a,b)=>a+b.v,0)};})`);
  for(const row of rows)assert.equal(row.sum,row.score);
});
test('counterforces stay explicit and transits cannot turn a natal hidden remedy into a rooted one',()=>{
  const s=summary([[4,4],[8,8],[0,0],[6,4]]);
  const obstacle=s.obstacles.find(o=>o.id==='wealth-kill');
  assert.ok(obstacle.remedies.some(r=>r.state==='救应受牵'));
  const a=summary([[3,3],[7,9],[0,0],[3,5]],{dy:{dyList:[]}});
  const b=summary([[3,3],[7,9],[0,0],[3,5]],{dy:{dyList:[{g:9,z:11,age:18,endAge:27}]}});
  assert.deepEqual(a.obstacles,b.obstacles);assert.notDeepEqual(a.transits,b.transits);
});
