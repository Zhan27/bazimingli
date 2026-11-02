const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../lib/index.cjs');
const input={date:'2024-02-10',time:'12:00',gender:1,place:'120°',options:{trueSolar:true,utcOffsetMinutes:480,dstMinutes:0,dayBoundary:'zi-chu'}};
const chart=api.calculateChart(input),snapshot=()=>JSON.parse(JSON.stringify(api.createStudySnapshot(chart)));

test('JSON comparison distinguishes arrays from objects even when their enumerable keys match',()=>{
  for(const [a,b] of [[[],{}],[[1],{0:1}],[{nested:[]},{nested:{}}]]){
    const diff=api.compareChartFacts(a,b);assert.equal(diff.count,1);assert.equal(diff.differences[0].path,a.nested?'nested':'');
    assert.equal(api.compareChartFacts(b,a).count,1);
  }
});

test('JSON comparison discloses absent keys instead of presenting two identical null values',()=>{
  for(const [a,b,hasBefore,hasAfter] of [[{x:null},{},true,false],[{},{x:null},false,true]]){
    const diff=api.compareChartFacts(a,b);assert.equal(diff.count,1);
    assert.equal(diff.differences[0].beforePresent,hasBefore);assert.equal(diff.differences[0].afterPresent,hasAfter);
  }
  assert.equal(api.compareChartFacts([null],[]).differences.find(d=>d.path==='length').before,1);
  assert.equal(api.compareChartFacts({x:[]},{x:[]}).count,0);
});

test('solar-time reference comparisons disclose missing and changed longitude without altering field agreement',()=>{
  const reference=snapshot();assert.equal(api.compareReferenceChart(chart,reference).verdict,'aligned');
  reference.chart.time.correction.longitude=121;
  let report=api.compareReferenceChart(chart,reference);assert.equal(report.verdict,'aligned-with-gaps');assert.equal(report.summary.different,0);
  assert.ok(report.warnings.some(w=>w.includes('经度不同')&&w.includes('120')&&w.includes('121')));
  delete reference.chart.time.correction.longitude;
  report=api.compareReferenceChart(chart,reference);assert.equal(report.verdict,'aligned-with-gaps');assert.ok(report.warnings.some(w=>w.includes('经度未提供')));
});

test('explicit lunar reference dates are not compared as Gregorian clock dates',()=>{
  const reference=snapshot();reference.chart.input.calendarType='lunar';
  const report=api.compareReferenceChart(chart,reference);
  assert.equal(report.fields.find(f=>f.path==='input.date').status,'not-provided');assert.equal(report.verdict,'aligned-with-gaps');
  const named={action:'chart',data:{...reference.facts,input:{date:input.date,calendarType:'lunar',time:input.time,options:input.options}}};
  assert.equal(api.compareReferenceChart(chart,named).fields.find(f=>f.path==='input.date').status,'not-provided');
});

test('reference convention types are normalized or rejected rather than treated as unchecked metadata',()=>{
  const reference=snapshot();reference.chart.input.options.utcOffsetMinutes='480';reference.chart.input.options.dstMinutes='0';
  assert.equal(api.compareReferenceChart(chart,reference).verdict,'aligned');
  const raw={...reference.facts,input:{...input,options:{...input.options,utcOffsetMinutes:'480',dstMinutes:'0'}},time:chart.time};
  assert.equal(api.compareReferenceChart(chart,raw).verdict,'aligned');
  for(const [key,value] of [['utcOffsetMinutes',900],['dstMinutes',30],['trueSolar','false'],['dayBoundary','invalid']]){
    const malformed={...raw,input:{...input,options:{...input.options,[key]:value}}};
    assert.throws(()=>api.normalizeReferenceChart(malformed),/时区|夏令时|太阳时|换日/);
  }
});

test('invalid period objects and out-of-range solar longitude produce actionable errors',()=>{
  const reference=snapshot();reference.facts.dayun.periods[0]=null;
  assert.throws(()=>api.normalizeReferenceChart(reference),/大运条目无效/);
  const other=snapshot();other.chart.time.correction.longitude=181;
  assert.throws(()=>api.normalizeReferenceChart(other),/经度无效/);
});
