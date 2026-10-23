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
  const geometry=e.json("gzRelationGeometry(gzRelationModel(chart).rows)");
  assert.deepEqual(geometry.routes.find(r=>r.id===row.id).endpoints.map(n=>n.id),['zhi-0','zhi-1','zhi-2','zhi-3']);
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

test('dense and empty presentations preserve rule results, bounded routes and escaped labels',()=>{
  e.context.chart={yearGZ:[0,5],monthGZ:[5,8],dayGZ:[6,2],hourGZ:[1,11]};
  const before=e.json('zhGanZhiMap(chart)'),html=e.run('renderGanZhiRelations(chart)');
  assert.equal(before.length,13);
  assert.ok(html.includes('全部13组'));
  const geometry=e.json('gzRelationGeometry(gzRelationModel(chart).rows)');
  assert.equal(geometry.routes.length,13);
  for(const route of geometry.routes)for(const endpoint of route.endpoints){assert.ok(endpoint.x>=0&&endpoint.x<=640);assert.ok(endpoint.y>=0&&endpoint.y<=geometry.height);assert.ok(route.lane>=0&&route.lane<=geometry.height);const nodeY=endpoint.id.startsWith('gan')?geometry.ganY:geometry.zhiY;assert.equal(Math.abs(nodeY-endpoint.y),33);}
  assert.deepEqual(e.json('zhGanZhiMap(chart)'),before);
  assert.equal(e.run('gzRelEscape(\'<script>"&\')'),'&lt;script&gt;&quot;&amp;');
  e.context.chart={yearGZ:[0,0],monthGZ:[0,0],dayGZ:[0,0],hourGZ:[0,0]};
  assert.equal(e.json('gzRelationModel(chart).rows').length,0);
  assert.ok(e.run('renderGanZhiRelations(chart)').includes('本盘暂无'));
});

test('relationship explanations use the active day stem, actual members and cited sources',()=>{
  e.context.chart={yearGZ:[0,4],monthGZ:[2,2],dayGZ:[0,4],hourGZ:[6,6]};
  const note=e.json("gzRelationNote(chart,gzRelationModel(chart).rows.find(r=>r.cls==='sanhe'))");
  assert.match(note.summary,/缺戌/);assert.match(note.focus,/月支寅 · 比肩/);assert.match(note.image,/食伤/);assert.deepEqual(note.sources,['trine','food','talent']);
  e.context.chart={yearGZ:[0,2],monthGZ:[2,10],dayGZ:[0,2],hourGZ:[6,10]};
  assert.doesNotMatch(e.json("gzRelationNote(chart,gzRelationModel(chart).rows.find(r=>r.cls==='sanhe'))").summary,/寅木与午火/);
  for(const source of Object.values(e.json('GZ_NOTE_SOURCES')))assert.match(source.url,/^https:\/\//);
});
