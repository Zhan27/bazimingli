const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
const e=loadEngine({ui:true});

test('self-punishment connects each named pillar instead of looping back to the first repeated branch',()=>{
  e.context.chart={yearGZ:[0,6],monthGZ:[0,6],dayGZ:[5,6],hourGZ:[5,6]};
  const before=e.json('zhGanZhiMap(chart)');
  const row=e.json("gzRelationModel(chart).rows.find(r=>r.t==='地支自刑')");
  assert.deepEqual(row.members.map(n=>n.id),['zhi-0','zhi-1','zhi-2','zhi-3']);
  assert.deepEqual(row.members.map(n=>n.char),['午','午','午','午']);
  const rail=e.run("gzRelationRail(gzRelationModel(chart).rows.find(r=>r.t==='地支自刑'))");
  assert.equal((rail.match(/data-gz-endpoint=/g)||[]).length,4);
  assert.equal((rail.match(/class="gz-rail-link"/g)||[]).length,3);
  assert.deepEqual(e.json('zhGanZhiMap(chart)'),before);
});

test('group relations include repeated participants and binary relations retain exact pillar identities',()=>{
  e.context.chart={yearGZ:[0,0],monthGZ:[5,8],dayGZ:[0,4],hourGZ:[5,0]};
  const rows=e.json('gzRelationModel(chart).rows');
  const group=rows.find(r=>r.cls==='sanhe');
  assert.deepEqual(group.members.map(n=>n.id),['zhi-0','zhi-1','zhi-2','zhi-3']);
  assert.equal(group.name,'申子辰合水（三合全）');
  const stems=rows.filter(r=>r.t==='天干五合');
  assert.deepEqual(stems.map(r=>r.members.map(n=>n.id)),[['gan-0','gan-1'],['gan-0','gan-3'],['gan-1','gan-2'],['gan-2','gan-3']]);
});

test('dense and empty presentations preserve rule results, bounded SVGs and escaped labels',()=>{
  e.context.chart={yearGZ:[0,5],monthGZ:[5,8],dayGZ:[6,2],hourGZ:[1,11]};
  const before=e.json('zhGanZhiMap(chart)'),html=e.run('renderGanZhiRelations(chart)');
  assert.equal(before.length,13);
  assert.equal((html.match(/data-gz-relation=/g)||[]).length,13);
  assert.equal((html.match(/viewBox="0 0 396 60"/g)||[]).length,13);
  assert.ok(!html.includes('<marker'));
  assert.deepEqual(e.json('zhGanZhiMap(chart)'),before);
  assert.equal(e.run('gzRelEscape(\'<script>"&\')'),'&lt;script&gt;&quot;&amp;');
  e.context.chart={yearGZ:[0,0],monthGZ:[0,0],dayGZ:[0,0],hourGZ:[0,0]};
  assert.equal(e.json('gzRelationModel(chart).rows').length,0);
  assert.ok(e.run('renderGanZhiRelations(chart)').includes('本盘未检出地支关系'));
});
