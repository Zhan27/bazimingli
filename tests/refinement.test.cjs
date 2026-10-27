const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine({ui:true});
test('neutral food command uses wealth to carry output and exposes position evidence',()=>{
  const n=e.json('selectNeutralUseGod([[4,0],[3,5],[0,0],[2,6]])');
  assert.equal(n.monthGod,2);assert.equal(n.element,2);assert.match(n.path,/食神生财/);
  assert.ok(n.evidence.some(x=>x.pillar===0&&x.lane==='gan'));
});
test('neutral food with exposed owl selects wealth rescue with only a hidden wealth root',()=>{
  const n=e.json('selectNeutralUseGod([[8,0],[3,5],[0,0],[2,6]])');
  assert.equal(n.element,2);assert.match(n.path,/财制枭/);assert.equal(n.available,true);assert.ok(n.evidence.every(x=>x.lane==='zhi'));
  assert.ok(n.triggers.some(x=>x.pillar===0));
});
test('neutral kill chooses the available rooted route rather than an unconditional resource',()=>{
  const n=e.json('selectNeutralUseGod([[2,2],[6,8],[0,2],[4,4]])');
  assert.equal(n.monthGod,6);assert.equal(n.element,1);assert.match(n.path,/食神制杀/);
});
test('an exposed hurt-officer is not counted as an exposed food-god in a kill route',()=>{
  const n=e.json('selectNeutralUseGod([[3,3],[6,8],[0,0],[8,0]])');
  const food=n.candidates.find(x=>x.path==='食神制杀');
  assert.equal(food.available,false);assert.equal(n.path,'杀印相生');
});
test('one exposed rooted helper and three main-qi helpers no longer max out score items',()=>{
  const z=e.run("zhCompute(new Date(2024,1,10),6,1,'')");e.context.z=z;
  const a=e.json("buildStructureScore({...z,dg:0,strengthType:'身强',pillars:[[2,2],[0,2],[0,2],[0,2]],yongShen:1,tiaoHouWX:-1})");
  assert.ok(a.basis.find(x=>x.id==='support').v<25);
  const b=e.json("buildStructureScore({...z,dg:0,strengthType:'身强',pillars:[[2,0],[4,0],[0,0],[6,0]],yongShen:1,tiaoHouWX:-1})");
  assert.ok(b.basis.find(x=>x.id==='balance').v<30);
  assert.ok(b.basis.find(x=>x.id==='balance').evidence.some(x=>x.pillar===1));
});
test('same helper at month main qi scores above surplus hidden qi without day-stem self credit',()=>{
  const a=e.json('structurePresence([[2,0],[0,2],[0,0],[0,0]],[1])');
  const b=e.json('structurePresence([[2,0],[0,0],[0,0],[0,2]],[1])');
  assert.equal(a.roots,.75);assert.equal(b.roots,.5);assert.equal(a.exposed,1);assert.equal(a.coverage,1);assert.ok(a.roots>b.roots);assert.ok(a.entries.every(x=>!(x.pillar===2&&x.lane==='gan')));
});
test('domain readings preserve separate positions and use only day-palace relationships',()=>{
  const out=e.json("(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');return buildDomainReadings({...z,dg:0,pillars:[[4,0],[4,2],[0,0],[6,6]],gender:1});})()");
  assert.ok(out.wealth.evidence.some(x=>x.pillar===0));assert.ok(out.wealth.evidence.some(x=>x.pillar===1));
  assert.ok(out.relationship.relations.every(x=>x.positions.includes(2)));
  assert.match(out.relationship.text,/日支子/);assert.ok(out.career.sources.includes('pattern'));
  assert.ok(out.wealth.notes.some(n=>n.includes('四库支')));assert.ok(out.relationship.notes.some(n=>n.includes('桃花')));assert.equal(out.career.transits.length,1);
});
test('old-rule archive retains accepted dimensions and partial followups without applying them',()=>{
  const text=e.run(`aiArchivedDraftText({accepted:{1:{format:'markdown',text:'旧报告保留'}},attempt:{text:'最后原文'},followup:{turns:[{question:'旧问题',answer:'部分回答',status:'interrupted'}]}})`);
  for(const s of ['旧报告保留','最后原文','旧问题','部分回答'])assert.ok(text.includes(s));
});
test('captured non-neutral charts preserve use-god and strength across all five schools',()=>{
  const fixture=require('./fixtures/non-neutral-v5.30.json');assert.ok(fixture.cases.length>=15);
  for(const row of fixture.cases){e.context.sample=row.input;const actual=e.json(`(()=>{const {year,m,hour,schoolId}=sample,z=zhCompute(new Date(year,m,15),hour,1,'',{schoolId});return {pillars:z.pillars,strengthScore:z.strengthScore,strengthType:z.strengthType,yongShen:z.yongShen};})()`);const {input,...expected}=row;assert.deepEqual(actual,expected,JSON.stringify(input));}
});
test('neutral selection covers every day stem and month branch with deterministic bounded evidence',()=>{
  assert.equal(e.run(`(()=>{for(let dg=0;dg<10;dg++)for(let z=0;z<12;z++){
    const pillars=[[4,4],[z%2,z],[dg,dg%2],[8,0]],before=JSON.stringify(pillars),n=selectNeutralUseGod(pillars);
    if(!Number.isInteger(n.element)||n.element<0||n.element>4||n.monthGod!==tenGod(dg,ZHI_HIDDEN[z][0])||!n.path||before!==JSON.stringify(pillars)||JSON.stringify(n)!==JSON.stringify(selectNeutralUseGod(pillars)))return false;
    if(n.evidence.some(x=>x.pillar===2&&x.lane==='gan'))return false;
  }return true;})()`),true);
});
test('annual prose does not reclassify a neutral peer decade as weak-chart help',()=>{
  const text=e.run(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');z.dy.dyList[0]={...z.dy.dyList[0],g:0,z:2};return zhLiuNianDetail(z);})()`);
  assert.match(text,/首运甲寅（比肩运）干支取向平/);
});
