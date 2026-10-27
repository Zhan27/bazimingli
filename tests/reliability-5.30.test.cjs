const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs'),e=loadEngine({ui:true});
test('annual repeated branches never invent pair punishments and use the canonical four self branches',()=>{
  const rows=e.json(`Array.from({length:12},(_,z)=>{const chart={yearGZ:[z%2,z],monthGZ:[0,0],dayGZ:[0,0],hourGZ:[0,0]};return liuNianRel(chart,z%2,z).filter(r=>r.pillar==='年'&&['三刑','自刑'].includes(r.type));})`);
  rows.forEach((row,z)=>{assert.equal(row.length,[4,6,9,11].includes(z)?1:0,'branch '+z);if(row.length)assert.equal(row[0].type,'自刑');});
});
test('all annual branch pairs and pairwise marriage punishment use the same shared table',()=>{
  for(let a=0;a<12;a++)for(let b=0;b<12;b++){
    const expected=a===b?([4,6,9,11].includes(a)?'self':null):[[2,5,8],[1,7,10],[0,3]].some(g=>g.includes(a)&&g.includes(b))?'pair':null;
    const actual=e.json(`branchPunishment(${a},${b})`);assert.equal(actual?.kind||null,expected);
  }
});
test('two-member and complete three-member punishments preserve actual natal participants',()=>{
  const r=e.json(`(()=>{const a={yearGZ:[0,2],monthGZ:[1,5],dayGZ:[0,0],hourGZ:[0,0]},b={...a,hourGZ:[0,8]};return {a:zhGanZhiMap(a).find(x=>x.t==='地支相刑'),b:zhGanZhiMap(b).find(x=>x.t==='地支相刑')};})()`);
  assert.equal(r.a.complete,false);assert.match(r.a.name,/寅巳相刑/);assert.equal(r.a.from.includes('申'),false);assert.equal(r.b.complete,true);assert.match(r.b.name,/寅巳申三刑/);
});
test('local interpretations agree with the cited no-grace and relying-on-power punishment names',()=>{
  const r=e.json(`['a','b'].map((_,i)=>{const p=i?[[1,1],[0,10],[1,7],[0,0]]:[[0,2],[1,5],[0,8],[0,0]];return zhHeChongXiang({yearGZ:p[0],monthGZ:p[1],dayGZ:p[2],hourGZ:p[3]});})`);
  assert.match(r[0],/寅巳申三刑[^；]*无恩之刑/);assert.match(r[1],/丑戌未三刑[^；]*恃势之刑/);
});
test('marriage complementary scoring separates climate from strength and does not reward adverse missing elements',()=>{
  const result=e.json(`(()=>{const a=zhCompute(new Date(1990,4,15),6,1,'',{schoolId:4}),b=zhCompute(new Date(1992,1,15),6,0,'',{schoolId:4});return {p:buildUsePreferences(a),r:heHunCompute(a,b,'甲','乙',2026)};})()`);
  assert.ok(result.p.adverse.includes(result.p.yong));
  const direction=result.r.preferences.directions[0];
  assert.equal(direction.help.some(x=>x.element===result.p.yong),false);
  assert.ok(result.r.preferences.climate.some(x=>x.element===result.p.yong));
  for(const x of result.r.preferences.missing)assert.equal(x.rewarded,x.preference===1);
  assert.equal(result.r.rawScore,60+result.r.aspects.reduce((a,b)=>a+b.score,0));
});
test('neutral and mixed marriage transits never become weak or two adverse stems by default',()=>{
  const r=e.json(`(()=>{const a=zhCompute(new Date(1990,4,15),6,1,''),b=zhCompute(new Date(1992,1,15),6,0,'');Object.assign(a,{strengthType:'中和',strong:false});Object.assign(b,{dg:0,strengthType:'身强',strong:true});a.dy.dyList=[{g:0,z:6,age:0,endAge:100}];b.dy.dyList=[{g:0,z:6,age:0,endAge:100}];return heHunCompute(a,b,'甲','乙',2026);})()`);
  assert.equal(r.preferences.dayun[0].kind,'平');assert.equal(r.preferences.dayun[1].kind,'喜忌交杂');
  assert.equal(r.aspects.find(x=>x.k.includes('行运同步')).score,0);
});
e.run(`var followChart=serializeChart(zhCompute(new Date(2024,1,10),6,1,''));`);
test('followup context contains completed rounds in order and clearing does not erase the report',()=>{
  const result=e.json(`(()=>{let s=createAiSession(followChart,0);s=beginAiAttempt(s,{ids:[1],format:'markdown',model:'test',base:'https://mock.test'});s=finishAiAttempt(s,followChart,'【1】原始报告');const before=JSON.stringify(s.accepted);s=beginAiFollowup(s,'第一问');s=updateAiFollowup(s,'第一答','complete');s=beginAiFollowup(s,'展开刚才第二点');return {messages:aiFollowupMessages(s,'原始报告'),cleared:clearAiFollowup(s),before};})()`);
  assert.deepEqual(result.messages.map(x=>x.content),['原始报告','第一问','第一答','展开刚才第二点']);
  assert.equal(JSON.stringify(result.cleared.accepted),result.before);assert.deepEqual(result.cleared.followup.turns,[]);assert.equal(result.cleared.followup.draft,null);
});
test('followup interrupted drafts survive reload, old sessions restore, and injected settings are dropped',()=>{
  const r=e.json(`(()=>{let s=beginAiFollowup(createAiSession(followChart,0),'问题');s=updateAiFollowup(s,'部分回复','running');s.followup.secret='must-not-survive';const restored=restoreAiSession(JSON.stringify(s),followChart);delete s.followup;return {restored,old:restoreAiSession(JSON.stringify(s),followChart)};})()`);
  assert.equal(r.restored.followup.draft.status,'interrupted');assert.equal(r.restored.followup.draft.answer,'部分回复');assert.equal(r.restored.followup.secret,undefined);assert.deepEqual(r.old.followup.turns,[]);
});
test('followup history and transmitted context have explicit size bounds',()=>{
  const r=e.json(`(()=>{let s=createAiSession(followChart,0);for(let i=0;i<12;i++){s=beginAiFollowup(s,'问题'+i);s=updateAiFollowup(s,'答'.repeat(30000),'complete');}s=beginAiFollowup(s,'最后一问');return {turns:s.followup.turns.length,length:aiFollowupMessages(s,'报'.repeat(50000)).reduce((n,x)=>n+x.content.length,0),stored:JSON.stringify(s.followup).length};})()`);
  assert.ok(r.turns<=10);assert.ok(r.length<=48000);assert.ok(r.stored<200000);
  assert.throws(()=>e.run(`beginAiFollowup(createAiSession(followChart,0),'问'.repeat(4001))`));
});
test('followup cancellation remains visible but cannot masquerade as a completed context round',()=>{
  const r=e.json(`(()=>{const s=beginAiFollowup(createAiSession(followChart,0),'旧问'),before=JSON.stringify(s),partial=updateAiFollowup(s,'部分内容','canceled'),next=beginAiFollowup(partial,'重新解释');return {unchanged:before===JSON.stringify(s),turns:next.followup.turns,messages:aiFollowupMessages(next,'报告')};})()`);
  assert.equal(r.unchanged,true);assert.equal(r.turns[0].status,'canceled');assert.equal(r.turns[0].answer,'部分内容');assert.deepEqual(r.messages.map(x=>x.content),['报告','重新解释']);
});
test('malformed followup drafts are rejected atomically, not executed or restored with foreign settings',()=>{
  for(const change of ["s.followup.turns=[{question:'q',answer:'a',status:'running'}]","s.followup.draft={question:'q',answer:'a'.repeat(60001),status:'failed'}","s.followup.version=999"]){
    e.context.change=change;assert.throws(()=>e.run(`(()=>{const s=createAiSession(followChart,0);${change};return restoreAiSession(JSON.stringify(s),followChart);})()`));
  }
});
