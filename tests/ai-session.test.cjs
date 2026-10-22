const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
function setup(){const e=loadEngine();e.run(`var chart=calculateChart({date:'2024-02-10',time:'12:00'});var session=createAiSession(chart,0);var response={schemaVersion:AI_CONTRACT_VERSION,chartId:chartFactId(chart),pillars:chart.pillars.map(p=>p.text),dimensions:AI_DIM_CONTRACTS.map(d=>({id:d.id,title:d.title,conclusion:'传统参考',facts:['pillar.day'],rules:['rule.strength'],explanation:'基于计算规则，解释存在不确定性',uncertainty:'high',alternatives:['保留其他解释']}))};`);return e;}
test('attempts accept valid dimensions independently and reject root fact changes without touching the chart',()=>{
  const e=setup(),before=e.run('JSON.stringify(chart)');
  e.run(`session=beginAiAttempt(session,{ids:[1,2],model:'mock',base:'https://user:synthetic@mock.test/v1?key=synthetic'});response.dimensions=response.dimensions.slice(0,2);response.dimensions[1].facts=['fake'];session=finishAiAttempt(session,chart,JSON.stringify(response));`);
  assert.deepEqual(Object.keys(e.json('session.accepted')),['1']);assert.equal(e.run('session.attempt.meta.provider'),'https://mock.test');assert.equal(e.run('JSON.stringify(chart)'),before);
  e.run(`session=beginAiAttempt(session,{ids:[2],model:'mock'});response.pillars[0]='wrong';response.dimensions=response.dimensions.slice(1);session=finishAiAttempt(session,chart,JSON.stringify(response));`);assert.deepEqual(Object.keys(e.json('session.accepted')),['1']);assert.ok(e.json('session.attempt.errors').some(x=>x.type==='FACT_ERROR'));
});
test('cancel/failure preserves accepted cards, partial text and metadata; restored running attempts are interrupted',()=>{
  const e=setup();e.run(`session=beginAiAttempt(session,{ids:[1],model:'mock'});response.dimensions=response.dimensions.slice(0,1);session=finishAiAttempt(session,chart,JSON.stringify(response));session=beginAiAttempt(session,{ids:[2],model:'other'});session=updateAiAttempt(session,'{"schemaVersion":','canceled');`);
  assert.equal(e.run('session.accepted[1].meta.model'),'mock');assert.equal(e.run('session.attempt.status'),'canceled');assert.equal(e.run('session.attempt.text'),'{"schemaVersion":');
  e.run(`session=updateAiAttempt(session,'partial','running');var restored=restoreAiSession(JSON.stringify({...session,key:'SYNTHETIC_SECRET'}),chart)`);
  assert.equal(e.run('restored.attempt.status'),'interrupted');assert.equal(e.run('JSON.stringify(restored).includes("SYNTHETIC_SECRET")'),false);assert.equal(e.run('restored.accepted[1].meta.model'),'mock');
  assert.throws(()=>e.run(`restoreAiSession(JSON.stringify({...session,chartId:'other'}),chart)`),/不匹配/);
});
test('Markdown compatibility is explicitly unverified and does not replace unrelated completed dimensions',()=>{
  const e=setup();e.context.text='【2】兼容文本\n【3】未请求内容';e.run(`session=beginAiAttempt(session,{ids:[2],model:'mock',format:'markdown'});session=finishAiAttempt(session,chart,text);`);
  assert.equal(e.run('session.accepted[2].format'),'markdown');assert.equal(e.run('session.accepted[3]'),undefined);assert.equal(e.json('missingAiDimensions(session)').length,17);
});
test('malformed dimensions, extra properties, duplicates and uncalibrated prediction fields cannot be accepted',()=>{
  for(const mutation of [`d.score=99`,`d.alternatives=['财富千万级']`,`d.conclusion='命局定分99'`,`d.facts=['unknown']`,`d.uncertainty='certain'`]){
    const e=setup();e.run(`session=beginAiAttempt(session,{ids:[1],model:'mock'});response.dimensions=response.dimensions.slice(0,1);var d=response.dimensions[0];${mutation};session=finishAiAttempt(session,chart,JSON.stringify(response));`);assert.equal(e.run('Object.keys(session.accepted).length'),0);
  }
  const e=setup();assert.throws(()=>e.run('createAiSession(chart,1)'),/流派/);assert.throws(()=>e.run(`beginAiAttempt(session,{ids:[1,1]})`),/维度/);
});
