const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine();
const reference=require('./fixtures/open-source-tables.json');
test('MIT reference tables cross-check 12 hidden stem sets and 120 growth positions',()=>{
  for(const [zhi,stems] of Object.entries(reference.hidden)){
    const actual=e.json(`ZHI_HIDDEN[${reference.branches.indexOf(zhi)}].map(i=>GAN[i])`);
    assert.deepEqual(actual.sort(),[...stems].sort(),zhi);
  }
  for(const [stage,branches] of Object.entries(reference.growth))branches.forEach((zhi,gan)=>assert.equal(e.run(`getChangSheng(${gan},${reference.branches.indexOf(zhi)})`),stage,reference.stems[gan]+zhi));
});
test('located entries have stable IDs, HTTPS sources and bounded verification scope',()=>{
  const entries=e.json('searchKnowledge()');
  for(const entry of entries.filter(x=>x.status==='text-verified')){
    assert.ok(entry.sources.length);assert.ok(entry.verificationScope);
    for(const source of entry.sources){assert.match(source.url,/^https:\/\//);assert.ok(source.scope);assert.ok(source.chapter);}
    assert.equal(e.json(`knowledgeCitation('${entry.id}')`).status,'text-verified');
  }
  assert.equal(entries.filter(x=>x.status==='text-verified').length,63);
  assert.ok(entries.some(x=>x.status==='citation-pending'));
  assert.match(e.run(`termKnowledge('通关').explanation`),/木生火、火生土/);
  assert.match(e.run(`termKnowledge('三刑').explanation`),/寅巳申为无恩/);
  assert.match(e.run(`termKnowledge('五行').explanation`),/火克金/);
  assert.match(e.run(`termKnowledge('羊刃').explanation`),/不同取法/);
});
