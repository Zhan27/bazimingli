const {test}=require('node:test'),assert=require('node:assert/strict'),{loadEngine}=require('./helpers.cjs');
const e=loadEngine();
test('Ziwei reading is deterministic, position-specific and leaves all placements unchanged',()=>{
  e.run('var readingChart=calculateZiwei({date:parseCivilDate("2024-02-10"),hourIdx:6,gender:1,referenceYear:2034})');
  const before=e.json('readingChart'),r=e.json('buildZiweiReading(readingChart)');assert.deepEqual(e.json('readingChart'),before);assert.deepEqual(r,e.json('buildZiweiReading(readingChart)'));
  for(const frame of r.frames){assert.equal(frame.name,['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'][(before.mingGong-frame.position+12)%12]);assert.equal(frame.cross.length,4);for(const s of frame.resident)assert.equal(before.stars[s.key],frame.position);}
  assert.equal(r.rows.length,3);assert.ok(r.annual.every(x=>x.year===2034&&x.scope==='annual'));assert.ok(r.natal.every(x=>x.year===null&&x.scope==='natal'));
});
test('empty palaces reference the opposite without moving stars or their transformations',()=>{
  e.context.sample={mingGong:0,shenGong:0,stars:{ziwei:6,tianfu:4},siHua:['紫微','天府','文昌','文曲'],minorStars:{wenchang:9,wenqu:3}};
  const r=e.json('buildZiweiReading(sample)');assert.equal(r.ming.resident.length,0);assert.equal(r.ming.borrowed[0].position,6);assert.match(r.ming.fact,/空宫，参看对宫迁移午/);assert.equal(r.natal[0].palace,'迁移');assert.equal(r.natal[2].position,9);assert.equal(r.natal[2].palace,'子女');assert.equal(r.combinations.length,0);assert.match(r.rows[0].text,/命身同宫/);
  e.context.sample.stars.tianfu=6;const r2=e.json('buildZiweiReading(sample)');assert.equal(r2.combinations[0].name,'紫府同宫');assert.equal(r2.combinations[0].palace,'迁移');assert.ok(!r2.combinations.some(x=>x.palace==='命宫'));
});
test('unknown transformed stars stay unlocated and reading HTML safely escapes text',()=>{
  e.context.sample={mingGong:0,shenGong:2,stars:{ziwei:0},siHua:['<img src=x onerror=alert(1)>','未知','文昌','紫微']};const r=e.json('buildZiweiReading(sample)');assert.equal(r.natal[0].position,null);assert.equal(r.natal[1].palace,null);assert.match(r.rows[0].text,/身宫落福德寅/);
  const html=e.run('renderZiweiReading(buildZiweiReading(sample))');assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!/必定|注定|离婚|疾病/.test(e.run('ziweiReadingText(buildZiweiReading(sample))')));
});
