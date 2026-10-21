const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
const e=loadEngine({ui:true});
function parse(s){e.context.input=s;return e.json('parseAiDimensions(input)');}
test('18 dimensions parse standard, Markdown, numbered and fullwidth heading variants',()=>{
  const formats=[n=>`【${n}】 标题\n内容${n}`,n=>`### **【${n}】** 标题\n内容${n}`,n=>`## ${n}. 标题\n内容${n}`,n=>`**${n}、标题**\n内容${n}`,n=>`${n}） 标题\n内容${n}`,n=>`[${n}] 标题\n内容${n}`];
  for(const fmt of formats){const r=parse(Array.from({length:18},(_,i)=>fmt(i+1)).join('\r\n'));assert.equal(Object.keys(r.sections).length,18);assert.deepEqual(r.missing,[]);assert.ok(r.sections[1].includes('内容1'));}
});
test('missing, reordered, duplicate, incomplete streaming headings and supplementary sections',()=>{
  let r=parse('【18】风险\n【1】基础\n【1】补充\n【15】流年\n【2026年】年内容\n【流1】流派内容');
  assert.deepEqual(r.duplicates,[1]);assert.equal(Object.keys(r.sections).length,3);assert.ok(r.sections[1].includes('补充'));assert.ok(r.sections[15].includes('2026年'));assert.equal(r.sections[15].includes('流派内容'),false);
  for(const text of ['','普通正文','【','【1','【1】'])assert.equal(Object.keys(parse(text).sections).length,0);
  assert.equal(parse('【1】已有内容\n【2').sections[1],'已有内容\n【2');
  assert.equal(Object.keys(parse('【0】无效\n【19】无效\n【1】有效').sections).length,1);
  assert.equal(parse('【1】正文\n1. 子列表\n2. 子列表\n【2】另段').sections[1].includes('2. 子列表'),true);
});
test('long replies retain content without truncation; oversized replies fail clearly',()=>{
  const text='【1】'+('内容'.repeat(100000))+'\n【18】末段';
  assert.equal(parse(text).sections[1].length,200000);
  assert.throws(()=>parse('x'.repeat(1000001)),/过长/);
});
test('AI HTML rendering keeps script, SVG, handlers, entities and markdown links inert',()=>{
  const payload='<img src=x onerror="alert(1)"><script>alert(2)</script><svg onload=alert(3)>&lt;img src=x onerror=alert(4)&gt;\n[x](javascript:alert(5))\n**加粗**';
  e.context.input=payload;const html=e.run('aiMd2Html(input)');
  assert.equal(/<(img|script|svg)\b/i.test(html),false);assert.equal(/href\s*=/i.test(html),false);assert.ok(html.includes('&lt;img'));assert.ok(html.includes('<b'));
});
