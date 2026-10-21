const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');
const e=loadEngine();
const fixtures=require('./fixtures/calendar.json');
test('HKO solar/lunar benchmarks and labeled legacy epoch in both directions',()=>{
  for(const f of fixtures){
    const expected={year:f.lunar[0],month:f.lunar[1],day:f.lunar[2],isLeap:f.lunar[3]};
    assert.deepEqual(e.json(`solar2lunar(parseCivilDate('${f.solar}'))`),expected,f.solar);
    assert.equal(e.run(`civilDay(lunar2solar(${f.lunar.join(',')}))`),Date.parse(f.solar+'T00:00:00Z'));
  }
});
test('seeded random Gregorian/lunar round trips, including endpoints (2002 cases)',()=>{
  let seed=271828;
  const first=Date.UTC(1900,0,31),last=Date.UTC(2099,11,31),span=(last-first)/86400000;
  const times=[first,last];
  for(let i=0;i<2000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;times.push(first+(seed%(span+1))*86400000);}
  for(const t of times){
    e.context.sample=new Date(t);
    // Construct civil date from UTC explicitly, independent of host zone.
    assert.equal(e.run(`(()=>{const d=civilFromMillis(sample.getTime()),l=solar2lunar(d);return civilDay(lunar2solar(l.year,l.month,l.day,l.isLeap));})()`),t);
  }
});
test('every lunar month start/end and leap boundary for all 200 supported lunar years',()=>{
  const result=e.json(`(()=>{
    let count=0,leaps=0;
    for(let y=1900;y<=2099;y++){
      const leap=leapMonth(y);if(leap)leaps++;
      for(let m=1;m<=12;m++) for(const isLeap of (leap===m?[false,true]:[false])){
        const max=isLeap?leapDays(y):monthDays(y,m);
        for(const d of [1,max]){
          // Lunar 2099 ends in Gregorian 2100, outside the advertised range.
          const raw=Lunar.fromYmd(y,isLeap?-m:m,d).getSolar();
          if(raw.getYear()>2099)continue;
          const s=lunar2solar(y,m,d,isLeap),l=solar2lunar(s);
          if(l.year!==y||l.month!==m||l.day!==d||l.isLeap!==isLeap)throw new Error([y,m,d,isLeap]);
          count++;
        }
      }
    }
    return {count,leaps};
  })()`);
  assert.equal(result.leaps,74);assert.ok(result.count>4900);
});
test('invalid lunar dates/leap months and out-of-range solar dates are rejected',()=>{
  for(const expression of ["solar2lunar(new Date(1899,11,31))","solar2lunar(new Date(1900,0,30))","solar2lunar(new Date(2100,0,1))","solar2lunar(new Date(NaN))","parseCivilDate('2023-02-29')","parseCivilDate('2024-02-30')","lunar2solar(2024,2,1,true)","lunar2solar(2023,2,30,true)","lunar2solar(2023,0,1)","lunar2solar(2023,13,1)","lunar2solar(2023,1,1.5)","lunar2solar(1899,1,1)","lunar2solar(2099,12,30)"])
    assert.throws(()=>e.run(expression),undefined,expression);
  assert.deepEqual(e.json('solar2lunar(new Date(2099,11,31,23,59))'),e.json('solar2lunar(new Date(2099,11,31))'));
});
test('sexagenary cycles wrap in both directions; all 60 pairs invert',()=>{
  for(let i=-180;i<=180;i++){
    const [g,z]=e.json(`indexToGZ(${i})`);
    assert.equal(e.run(`gzIndex(${g},${z})`),((i%60)+60)%60);
  }
  assert.equal(e.run(`GAN[getDayGZ(new Date(2024,1,10))[0]]+ZHI[getDayGZ(new Date(2024,1,10))[1]]`),'甲辰');
  for(let i=0;i<121;i++) assert.equal(e.run(`gzIndex(...getDayGZ(new Date(2024,1,10+${i})))`),i%60+40>=60?(i%60+40)%60:i%60+40);
});
test('all 24 solar terms for all supported years: before/at/after, year/month invariants',()=>{
  const result=e.run(`(()=>{
    let n=0;
    for(let y=1900;y<=2099;y++)for(let i=0;i<24;i++){
      const t=solarTerms(y)[i];
      const before=civilFromMillis(t-1000),at=civilFromMillis(t),after=civilFromMillis(t+1000);
      if(getTermIndex(before)!==(i+23)%24||getTermIndex(at)!==i||getTermIndex(after)!==i)throw new Error('term '+y+'/'+i);
      const mb=gzIndex(...getMonthGZ(before)),ma=gzIndex(...getMonthGZ(at));
      if(ma!==(mb+(i%2===0?1:0))%60)throw new Error('month '+y+'/'+i);
      const yb=gzIndex(...getYearGZ(before)),ya=gzIndex(...getYearGZ(at));
      if(ya!==(yb+(i===2?1:0))%60)throw new Error('year '+y+'/'+i);
      n++;
    }
    return n;
  })()`);
  assert.equal(result,4800);
});
test('2026 major solar terms agree with HKO minute-resolution independent data within 60 seconds',()=>{
  const hko=['01-20 09:45','02-18 23:52','03-20 22:46','04-20 09:39','05-21 08:37','06-21 16:25','07-23 03:13','08-23 10:19','09-23 08:05','10-23 17:38','11-22 15:23','12-22 04:50'];
  hko.forEach((value,i)=>assert.ok(Math.abs(e.run(`solarTerms(2026)[${i*2+1}]`)-Date.parse('2026-'+value.replace(' ','T')+':00Z'))<60000,value));
});
test('four pillars fixed benchmark plus early/late Zi and exact Jie instant',()=>{
  const gz=(h,m,rule)=>e.json(`(()=>{const t=calculateBirth(new Date(2024,1,10,${h},${m}),0,'',{preciseTime:true,dayBoundary:'${rule}'});return [t.yearGZ,t.monthGZ,t.dayGZ,t.hourGZ].map(p=>GAN[p[0]]+ZHI[p[1]]);})()`);
  assert.deepEqual(gz(12,0,'zi-chu'),['甲辰','丙寅','甲辰','庚午']);
  assert.deepEqual(gz(0,30,'zi-chu'),['甲辰','丙寅','甲辰','甲子']);
  assert.deepEqual(gz(23,30,'zi-chu'),['甲辰','丙寅','乙巳','丙子']);
  assert.deepEqual(gz(23,30,'zi-zheng'),['甲辰','丙寅','甲辰','甲子']);
  assert.equal(e.run(`(()=>{const before=calculateBirth(new Date(2026,1,4,4,2,7),2,'',{preciseTime:true}),at=calculateBirth(new Date(2026,1,4,4,2,8),2,'',{preciseTime:true});return gzIndex(...at.yearGZ)-gzIndex(...before.yearGZ);})()`),1);
});
test('NOAA equation of time, longitude sign, hour/day crossing and civil Jie separation',()=>{
  assert.ok(Math.abs(e.run('equationOfTime(new Date(2024,1,11,12))')-(-14.2))<0.3);
  assert.ok(Math.abs(e.run('equationOfTime(new Date(2024,10,3,12))')-16.4)<0.3);
  assert.equal(e.run(`trueSolarTime(new Date(2024,5,1,0,30),87.6).dayOffset`),-1);
  assert.equal(e.run(`trueSolarTime(new Date(2024,5,1,23,50),150).dayOffset`),1);
  assert.ok(Math.abs(e.run(`trueSolarTime(new Date(2024,5,1,12),87.6).longitudeMin`)+129.6)<1e-10);
  assert.equal(e.run(`(()=>{const a=calculateBirth(new Date(2026,1,4,4,3),2,'乌鲁木齐',{preciseTime:true,trueSolar:true});return a.yearGZ[0]===getYearGZ(a.civilDate)[0]&&a.effectiveDate.getHours()<4;})()`),true);
  for(const place of ['','不存在的地点','181°','-181°'])assert.throws(()=>e.run(`resolveLongitude(${JSON.stringify(place)})`));
  assert.equal(e.run(`resolveLongitude('乌鲁木齐 90°')`),90);
});
test('January DaYun uses previous December Jie and continuous fractional-day interval',()=>{
  const days=e.run(`getDaYun(new Date(2024,0,1,12),1,getYearGZ(new Date(2024,0,1,12)),1).days`);
  assert.ok(days>20&&days<30,days);
});
