const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../lib/index.cjs'),{loadEngine}=require('./helpers.cjs');
const input={date:'1990-05-20',time:'10:30',gender:1,options:{utcOffsetMinutes:480,dstMinutes:0,dayBoundary:'zi-chu',trueSolar:false}};
const json=x=>JSON.parse(JSON.stringify(x));
test('study facts resolve per-pillar day-xun void, hidden ten-gods, na-yin and periods without mutating chart identity',()=>{
  const chart=api.calculateChart(input),before=JSON.stringify(chart),facts=api.chartStudyFacts(chart);
  assert.equal(facts.kongWang.xun,'甲申旬');assert.deepEqual(Array.from(facts.kongWang.branches),['午','未']);
  assert.deepEqual(Array.from(facts.pillars,p=>p.isKong),[true,false,false,false]);
  assert.equal(facts.pillars[2].nayin,'井泉水');assert.equal(facts.pillars[2].diShi,'绝');
  assert.deepEqual(json(facts.pillars[1].hidden),[{gan:'丙',tenGod:'伤官',isMainQi:true},{gan:'戊',tenGod:'正财',isMainQi:false},{gan:'庚',tenGod:'正官',isMainQi:false}]);
  assert.equal(facts.dayun.periods.length,8);for(const p of facts.dayun.periods){assert.equal(p.years.length,10);assert.equal(p.years[0].age,p.startAge);assert.equal(p.years[9].age,p.endAge);assert.equal(p.years[0].year,1990+p.startAge);}
  assert.equal(JSON.stringify(chart),before);assert.throws(()=>api.chartStudyFacts(api.calculateChart({...input,unknownTime:true})));
});
test('exact monthly intervals bracket actual Jie transitions, cross January and remain timezone-independent',()=>{
  const chart=api.calculateChart(input),months=api.chartStudyMonths(chart,2026).months;
  assert.equal(months.length,12);assert.equal(months[0].text,'庚寅');assert.equal(months[11].text,'辛丑');assert.equal(months[11].startClock,'2027-01-05T22:09:58');
  const e=loadEngine();for(let i=0;i<12;i++){
    if(i)assert.equal(months[i-1].endClock,months[i].startClock);
    const ms=Date.parse(months[i].startClock+'Z');e.context.ms=ms;
    assert.equal(e.run('(()=>{const p=getMonthGZ(civilFromMillis(ms));return GAN[p[0]]+ZHI[p[1]];})()'),months[i].text);
    const before=e.run('(()=>{const p=getMonthGZ(civilFromMillis(ms-1000));return GAN[p[0]]+ZHI[p[1]];})()');assert.notEqual(before,months[i].text);
  }
  assert.equal(api.chartStudyMonths(chart,2099).months[11].endClock.slice(0,4),'2100');
  for(const y of [1899,2100,2026.5,NaN])assert.throws(()=>api.chartStudyMonths(chart,y));
});
test('structured relations preserve duplicate pillar endpoints in the DOM-free API',()=>{
  const chart=api.calculateChart(input),facts=api.chartStudyFacts(chart);
  const groups=facts.relations.filter(r=>r.name.includes('巳酉丑'));
  assert.ok(groups.length);assert.deepEqual(Array.from(groups[0].positions,p=>p.pillar),['month','day','hour']);
  assert.equal(new Set(groups[0].positions.map(p=>p.pillar)).size,3);
});
test('offline adapters compare sets and explicit spelling aliases, preserve omissions and disclose different scopes',()=>{
  const chart=api.calculateChart(input),snapshot=api.createStudySnapshot(chart),reference=json(snapshot);
  let report=api.compareReferenceChart(chart,reference);assert.equal(report.verdict,'aligned');
  reference.facts.pillars[1].hidden.reverse();reference.facts.pillars[2].nayin='泉中水';delete reference.facts.pillars[2].tenGod;
  reference.facts.dayun.periods.push({...reference.facts.dayun.periods.at(-1),text:'甲子'});
  report=api.compareReferenceChart(chart,reference);
  assert.equal(report.summary.different,0);assert.equal(report.summary['not-provided'],1);assert.equal(report.verdict,'aligned-with-gaps');
  assert.ok(report.fields.some(f=>f.normalizedAlias));assert.ok(report.warnings.some(w=>w.includes('共有的8步')));
  reference.facts.pillars[0].text='甲子';assert.throws(()=>api.compareReferenceChart(chart,reference));
  const minimal={pillars:['甲子','乙丑','丙寅','丁卯']};report=api.compareReferenceChart(chart,minimal);assert.equal(report.verdict,'differences');assert.ok(report.summary['not-provided']>0);assert.ok(report.warnings.some(w=>w.includes('dayBoundary')));
  assert.throws(()=>api.normalizeReferenceChart({pillars:['甲丑','乙丑','丙寅','丁卯']}));
  assert.throws(()=>api.normalizeReferenceChart({action:'chart',data:{pillars:{}}}));
});
test('equal start-age numbers do not hide different period start years',()=>{
  const chart=api.calculateChart(input),reference=json(api.createStudySnapshot(chart));
  reference.facts.dayun.periods.forEach(p=>{p.startYear=p.years[0].year-1;});
  const report=api.compareReferenceChart(chart,reference);
  assert.equal(report.summary.different,0);assert.equal(report.verdict,'aligned-with-gaps');
  assert.ok(report.warnings.some(w=>w.includes('有8步不同')&&w.includes('本盘1996、对照1995')));
});
test('named external responses remain reference claims; missing clock conventions never become a full pass',()=>{
  const chart=api.calculateChart(input),facts=api.chartStudyFacts(chart);
  const external={action:'chart',data:{input:{calendarType:'solar',birthYear:1990,birthMonth:5,birthDay:20,birthHour:10,birthMinute:30,gender:'male'},pillars:Object.fromEntries(facts.pillars.map(p=>[p.id,{ganZhi:p.text,tenGod:p.tenGod,branchTenGod:p.branchTenGod,hiddenStems:p.hidden.map(h=>({stem:h.gan})),naYin:p.nayin,diShi:p.diShi,isKong:p.isKong}])),dayun:{startAge:facts.dayun.startAge,list:facts.dayun.periods.map(p=>({ganZhi:p.text}))}}};
  let report=api.compareReferenceChart(chart,external);assert.equal(report.summary.different,0);assert.equal(report.verdict,'aligned-with-gaps');assert.equal(report.warnings.length,4);
  external.data.input.calendarType='lunar';report=api.compareReferenceChart(chart,external);assert.equal(report.fields.find(f=>f.path==='input.date').status,'not-provided');
});
