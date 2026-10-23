const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine({ui:true});
e.run(`var adoptionChart=calculateChart({date:'2024-02-10',time:'12:00'});`);
test('knowledge subsets cover their requested topics, retain bounded deterministic IDs and select different evidence',()=>{
  const rows=e.json(`[2,3,12,17].map(id=>({id,...JSON.parse(buildEvidencePrompt(adoptionChart,0,{dimensionIds:[id]}).user)}))`);
  assert.equal(new Set(rows.map(r=>r.knowledge.map(k=>k.id).join(','))).size,4);
  for(const r of rows){
    assert.ok(r.knowledge.length<=20);assert.equal(new Set(r.knowledge.map(k=>k.id)).size,r.knowledge.length);
    assert.ok(r.knowledge.some(k=>k.selection.dimensionIds.includes(r.id)));assert.ok(r.knowledge.every(k=>k.selection.reasons.length));
    for(const k of r.knowledge)for(const id of k.selection.factIds)assert.ok(Object.hasOwn(r.facts,id));
  }
  assert.ok(rows[0].knowledge.some(k=>k.title==='格局'));assert.ok(rows[1].knowledge.some(k=>k.title==='调候'));
  assert.equal(e.run(`JSON.stringify(selectEvidenceKnowledge(adoptionChart,0))===JSON.stringify(selectEvidenceKnowledge(adoptionChart,0))`),true);
});
test('selection uses actual month/ten-god signals, honours school filters and cannot certify a missing pattern',()=>{
  const selected=e.json(`selectEvidenceKnowledge(adoptionChart,1,{dimensionIds:[2,3]})`);
  assert.ok(selected.every(k=>k.schools.includes('all')||k.schools.includes('balance')));
  assert.ok(!selected.some(k=>['正官格','七杀格','食神格','伤官格','正印格','从格'].includes(k.title)));
  assert.ok(selected.some(k=>k.selection.factIds.length));
  assert.throws(()=>e.run(`selectEvidenceKnowledge(adoptionChart,0,{dimensionIds:[2,2]})`));
  assert.throws(()=>e.run(`selectEvidenceKnowledge(adoptionChart,0,{limit:41})`));
  assert.equal(e.run(`(()=>{const before=JSON.stringify(adoptionChart);selectEvidenceKnowledge(adoptionChart,0);return before===JSON.stringify(adoptionChart)})()`),true);
});
test('full requests have topic coverage with stable citations and no fabricated verification upgrade',()=>{
  const result=e.json(`JSON.parse(buildEvidencePrompt(adoptionChart,0).user)`),topics=new Set(result.knowledge.flatMap(k=>k.selection.dimensionIds));
  for(let id=1;id<=18;id++)assert.ok(topics.has(id),'topic '+id);
  for(const k of result.knowledge)assert.equal(k.status,e.run(`knowledgeCitation(${JSON.stringify(k.id)}).status`));
  assert.equal(result.schemaVersion,'1.0.0');assert.equal(result.rules.version,'5.20.0');
});
test('old knowledge/prompt draft metadata remains readable, while new attempts carry updated versions',()=>{
  const result=e.json(`(()=>{let s=beginAiAttempt(createAiSession(adoptionChart,0),{ids:[2],model:'synthetic',base:'https://mock.invalid'});s.attempt.meta.promptVersion='evidence-combined-1.1.0';s.attempt.meta.knowledgeVersion='1.1.0';const value={schemaVersion:AI_CONTRACT_VERSION,chartId:chartFactId(adoptionChart),pillars:adoptionChart.pillars.map(p=>p.text),dimensions:[{id:2,title:'子平格局',conclusion:'合成参考',facts:['pillar.month'],rules:['rule.hidden-stems'],explanation:'提纲与透藏分列',uncertainty:'high',alternatives:[]}]};s=finishAiAttempt(s,adoptionChart,JSON.stringify(value));const old=restoreAiSession(JSON.stringify(s),adoptionChart);return {old:old.accepted[2].meta,next:beginAiAttempt(old,{ids:[3],model:'synthetic',base:'https://mock.invalid'}).attempt.meta}})()`);
  assert.equal(result.old.promptVersion,'evidence-combined-1.1.0');assert.equal(result.old.knowledgeVersion,'1.1.0');
  assert.equal(result.next.promptVersion,'evidence-combined-1.2.0');assert.equal(result.next.knowledgeVersion,'1.2.0');
});
test('unmatched synthesis candidates expose necessary missing conditions separately from pending force review',()=>{
  const s=e.json(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');z.pillars=[[3,3],[7,9],[0,6],[3,5]];return buildMingGeSummary(z)})()`),p=s.candidates.find(c=>c.id==='officer-resource');
  assert.ok(p.missing.includes('偏印／正印出现'));assert.equal(p.state,'条件未齐');assert.ok(!s.paths.some(c=>c.id===p.id));
  assert.ok(p.checks.some(c=>c.kind==='required'&&c.status==='missing'));assert.ok(p.checks.some(c=>c.status==='met'));assert.ok(p.checks.some(c=>c.status==='pending'));
  assert.ok(p.sourceIds.length);assert.equal(p.ruleVersion,'1.1.0');
});
test('layered transit events identify actual characters, preserve natal remedy states and do not mutate input',()=>{
  const result=e.json(`(()=>{const obstacles=[{title:'伤官与官并透',remedies:[{gods:[9],state:'藏干待引',evidence:[]}]}],before=JSON.stringify(obstacles);return {dayun:mingGeLayerEvents(0,obstacles,9,11,'dayun'),annual:mingGeLayerEvents(0,obstacles,9,11,'annual'),same:before===JSON.stringify(obstacles)}})()`);
  assert.equal(result.dayun[0].participant,'运干癸');assert.equal(result.annual[0].participant,'年干癸');assert.equal(result.annual[0].natalState,'藏干待引');assert.equal(result.same,true);
});
