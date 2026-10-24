const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine({ui:true});
test('strength leads preference; climate selection never turns a strong peer into a helper',()=>{
  const p=e.json(`buildUsePreferences({dg:0,strengthType:'身强',strong:true,congGe:false,yongShen:1,tiaoHouWX:1,wxCount:[4,1,1,1,1]})`);
  assert.deepEqual(p.favorable,[1,2,3]);assert.deepEqual(p.adverse,[0,4]);
  assert.equal(e.run(`elementPreference({dg:0,strengthType:'身强',strong:true},0)`),-1);
  assert.equal(p.favorable.includes((p.yong+4)%5),false);
  const weak=e.json(`buildUsePreferences({dg:0,strengthType:'身弱',strong:false,profile:{climatePriority:true},useGod:{alternatives:[4]},yongShen:1,tiaoHouWX:1,wxCount:[1,2,2,2,1]})`);
  assert.deepEqual(weak.favorable,[4,0]);assert.deepEqual(weak.adverse,[1,2,3]);assert.equal(weak.selectedIsClimate,true);
  const neutral=e.json(`buildUsePreferences({dg:0,strengthType:'中和',yongShen:4,tiaoHouWX:-1,wxCount:[2,2,2,1,1]})`);
  assert.deepEqual(neutral.favorable,[]);assert.deepEqual(neutral.adverse,[]);
});
test('structure score is an exact bounded ledger independent of future decades and display counts',()=>{
  const rows=e.json(`Array.from({length:12},(_,m)=>{const z=zhCompute(new Date(2024,m,15),6,1,'');const before=JSON.stringify(z),a=buildStructureScore(z);const b=buildStructureScore({...z,dy:{dyList:[]},wxStatistics:{counts:[100,0,0,0,0]}});return {a,b,unchanged:before===JSON.stringify(z)};})`);
  for(const {a,b,unchanged} of rows){assert.equal(a.score,a.basis.reduce((n,x)=>n+x.v,0));assert.equal(a.basis.reduce((n,x)=>n+x.max,0),100);assert.ok(a.score>=0&&a.score<=100);assert.deepEqual(a,b);assert.equal(unchanged,true);}
});
test('rooting a strong peer does not earn the favorable-root score',()=>{
  const out=e.json(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');Object.assign(z,{dg:1,strengthType:'身强',strong:true,congGe:false,pillars:[[1,3],[1,3],[1,3],[1,3]],yearGZ:[1,3],monthGZ:[1,3],dayGZ:[1,3],hourGZ:[1,3],wxCount:[8,0,0,0,0],yongShen:1,tiaoHouWX:-1});return buildStructureScore(z)})()`);
  assert.equal(out.basis.find(x=>x.id==='support').v,0);
});
test('a rooted but constrained remedy retains partial credit instead of being treated as absent',()=>{
  const out=e.json(`(()=>{const z=zhCompute(new Date(2024,1,10),6,1,'');Object.assign(z,{pillars:[[4,4],[8,8],[0,0],[6,4]],yearGZ:[4,4],monthGZ:[8,8],dayGZ:[0,0],hourGZ:[6,4],dg:0,strengthType:'身弱',strong:false,congGe:false});return {obstacle:buildMingGeSummary(z).obstacles[0],rescue:buildStructureScore(z).basis.find(x=>x.id==='rescue')};})()`);
  assert.equal(out.obstacle.resolution,'救应受牵');assert.equal(out.rescue.v,8);
});
test('formatted term days keep two decimals and directional flow edges stop outside nodes',()=>{
  assert.equal(e.run('formatTermDays(14.244502314814815)'),'14.24');assert.equal(e.run('formatTermDays(0)'),'0.00');
  const model=e.json('buildWuXingFlow([4,1,1,1,1])');assert.equal(model.edges.length,10);
  for(const edge of model.edges){const a=model.nodes[edge.from],b=model.nodes[edge.to];assert.ok(Math.hypot(edge.x1-a.x,edge.y1-a.y)>a.r);assert.ok(Math.hypot(edge.x2-b.x,edge.y2-b.y)>b.r);assert.equal(edge.to,(edge.from+(edge.kind==='sheng'?1:2))%5);}
  const html=e.run(`wxFlowSvg({wxCount:[4,1,1,1,1]})`);assert.equal((html.match(/marker-end=/g)||[]).length,10);assert.match(html,/相生/);assert.match(html,/相克/);
});
test('all day elements and five states classify mixed transits without counting climate as automatic support',()=>{
  for(let dg=0;dg<10;dg++)for(const state of ['从弱','身弱','中和','身强','身极强']){
    e.context.sample={dg,strengthType:state,yongShen:1,tiaoHouWX:1};
    const p=e.json('buildUsePreferences(sample)');
    assert.equal(p.favorable.some(w=>p.adverse.includes(w)),false);
    assert.equal(p.favorable.length+p.adverse.length,state==='中和'?0:5);
  }
  const mixed=e.json(`transitPreference({dg:0,strengthType:'身强'},0,6)`);
  assert.equal(mixed.kind,'喜忌交杂');assert.equal(mixed.value,0);
  assert.equal(e.run(`transitPreference({dg:0,strengthType:'中和'},0,6).kind`),'平');
});
test('every eight-count composition keeps arrowheads outside circles and inside the flow viewBox',()=>{
  assert.equal(e.run(`(()=>{for(let a=0;a<=8;a++)for(let b=0;b<=8-a;b++)for(let c=0;c<=8-a-b;c++)for(let d=0;d<=8-a-b-c;d++){
    const m=buildWuXingFlow([a,b,c,d,8-a-b-c-d]);for(const e of m.edges){const x=m.nodes[e.from],y=m.nodes[e.to];
      if(Math.hypot(e.x1-x.x,e.y1-x.y)<=x.r||Math.hypot(e.x2-y.x,e.y2-y.y)<=y.r||e.x1<120||e.x1>440||e.x2<120||e.x2>440)return false;
    }}return true;})()`),true);
});
