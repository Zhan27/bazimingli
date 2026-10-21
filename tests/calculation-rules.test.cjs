const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Astronomy=require('astronomy-engine');
const {loadEngine,root}=require('./helpers.cjs');
const e=loadEngine({ui:true});
test('all 100 ten-god mappings agree with the independent published lookup table',()=>{
  const fixture=require('./fixtures/ten-gods.json');
  assert.equal(fixture.mapping.length,10);
  for(let day=0;day<10;day++){
    const names=[];
    for(let target=0;target<10;target++){const name=e.run(`SHISHEN_NAME[tenGod(${day},${target})]`);assert.equal(name,fixture.mapping[day][target],`${day}/${target}`);names.push(name);}
    assert.equal(new Set(names).size,10);
  }
  for(const pair of ['-1,0','10,0','0,10','0,0.1','NaN,0','undefined,0'])assert.throws(()=>e.run('tenGod('+pair+')'));
});
test('three wuxing count conventions give hand-counted totals without changing core facts',()=>{
  const pillars='[[0,0],[2,2],[4,4],[6,6]]';
  assert.deepEqual(e.json(`countWuXing(${pillars},'stems-only').counts`),[1,1,1,1,0]);
  assert.deepEqual(e.json(`countWuXing(${pillars},'stems-main-qi').counts`),[2,2,2,1,1]);
  assert.deepEqual(e.json(`countWuXing(${pillars},'stems-all-hidden').counts`),[3,3,4,1,2]);
  assert.equal(e.run(`countWuXing(${pillars},'stems-all-hidden').total`),13);
  const outputs=e.json(`Object.keys(WX_MODES).map(wxMode=>{const z=zhCompute(parseCivilDate('2024-02-10'),6,1,'',{wxMode});return [z.pillars,z.strengthScore,z.yongShen]})`);
  outputs.forEach(x=>assert.deepEqual(x,outputs[0]));
  assert.throws(()=>e.run(`countWuXing(${pillars},'wrong')`));
});
test('strength command, root, and momentum components have independent hand-counted cases',()=>{
  const examples=[{p:[[0,2],[0,2],[0,2],[0,2]],month:3,roots:7.1,momentum:3,total:13.1},
    {p:[[0,0],[0,0],[0,0],[0,0]],month:2.5,roots:5.1,momentum:1.5,total:9.1},
    {p:[[0,8],[0,8],[0,8],[0,8]],month:-2.5,roots:2.3,momentum:1.5,total:1.3}];
  for(const x of examples){e.context.p=x.p;const r=e.json('computeStrength(p)');assert.ok(Math.abs(r.parts.month.value-x.month)<1e-9);assert.ok(Math.abs(r.parts.roots.value-x.roots)<1e-9);assert.ok(Math.abs(r.parts.momentum.value-x.momentum)<1e-9);assert.equal(r.score,x.total);}
  // All five classifications at and on both sides of every threshold.
  assert.deepEqual(e.json('[1.499999,1.5,1.500001,5.999999,6,9.999999,10,13.999999,14].map(classifyStrength)'),['从弱','从弱','身弱','身弱','中和','中和','身强','身强','身极强']);
});
test('five immutable school configurations share pillars but apply explicit use-god strategies',()=>{
  const results=e.json(`RULE_PROFILES.map(p=>{const z=zhCompute(parseCivilDate('2024-01-04'),0,1,'北京',{schoolId:p.id});return {id:z.profile.id,version:z.ruleVersion,pillars:z.pillars,score:z.strengthScore,yong:z.yongShen,reason:z.useGod.reason,prompt:aiBuildSchool(p.id).role};})`);
  assert.equal(new Set(results.map(r=>r.reason)).size>=4,true);
  results.forEach((r,i)=>{assert.equal(r.id,i);assert.equal(r.version,'5.19.2');assert.deepEqual(r.pillars,results[0].pillars);assert.equal(r.score,results[0].score);assert.ok(r.prompt.includes('5.19.2'));});
  assert.equal(e.run('Object.isFrozen(RULE_PROFILES[0])&&Object.isFrozen(STRENGTH_RULES.root.same)'),true);
  assert.throws(()=>e.run('getRuleProfile(5)'));
  // Mutating a returned prompt must not modify the source rules for later calls.
  assert.equal(e.run(`(()=>{const p=aiBuildSchool(0);p.dimGuide[0]='changed';return aiBuildSchool(0).dimGuide[0]!=='changed';})()`),true);
});
test('fixed UTC offsets, manual DST, fractional offsets and midnight/year crossing preserve one instant',()=>{
  const examples=[['2024-02-10', '00:30',480,0,'2024-02-09T16:30:00.000Z'],['2024-02-09','16:30',0,0,'2024-02-09T16:30:00.000Z'],['2024-02-09','11:30',-300,0,'2024-02-09T16:30:00.000Z'],['2024-02-09','12:30',-300,60,'2024-02-09T16:30:00.000Z'],['2024-02-09','22:15',345,0,'2024-02-09T16:30:00.000Z']];
  const outputs=[];
  for(const [date,time,offset,dst,instant] of examples){const r=e.json(`calculateBirth(withBirthTime(parseCivilDate('${date}'),0,'${time}'),0,'',{preciseTime:true,utcOffsetMinutes:${offset},dstMinutes:${dst}})`);assert.equal(r.instantUtc,instant);outputs.push([r.yearGZ,r.monthGZ,r.dayGZ,r.hourGZ]);}
  outputs.forEach(x=>assert.deepEqual(x,outputs[0]));
  assert.equal(e.run(`normalizeBirthTime(withBirthTime(parseCivilDate('2024-01-01'),0,'00:30'),{utcOffsetMinutes:840}).civilDate.getFullYear()`),2023);
  for(const options of ['{utcOffsetMinutes:841}','{utcOffsetMinutes:-721}','{dstMinutes:30}'])assert.throws(()=>e.run(`normalizeBirthTime(parseCivilDate('2024-01-01'),${options})`));
});
test('NOAA solar-time components agree with independent Astronomy Engine hour-angle reference',()=>{
  const inputs=[];
  for(const y of [1900,1950,2000,2024,2026,2050,2099])for(let m=0;m<12;m++)inputs.push([y,m,15]);
  for(let day=0;day<366;day++){const d=new Date(Date.UTC(2024,0,1+day));inputs.push([d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()]);}
  let maxError=0;const cases=[];
  for(const [y,m,d] of inputs){
    const instant=new Date(Date.UTC(y,m,d,4)),ha=Astronomy.HourAngle(Astronomy.Body.Sun,instant,new Astronomy.Observer(0,0,0));
    const apparent=((ha+12)%24)*60,reference=((apparent-240+720)%1440+1440)%1440-720;
    const noaa=e.run(`equationOfTime(civilFromMillis(Date.UTC(${y},${m},${d},12)))`),error=Math.abs(reference-noaa);maxError=Math.max(maxError,error);
    assert.ok(error<1,`${instant.toISOString()} error ${error} min`);cases.push({instant:instant.toISOString(),reference,noaa,error});
  }
  const data={source:'astronomy-engine 2.1.19: Greenwich topocentric Sun HourAngle; apparent solar time=(HA+12)%24, equation=apparent-minus-mean UTC time, wrapped to [-720,720). This is independent software cross-checking, not observational validation.',cases:cases.length,toleranceMinutes:1,maxErrorMinutes:maxError,samples:cases};
  fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/solar-reference.json'),JSON.stringify(data,null,2)+'\n');
  const correction=e.json(`trueSolarTime(withBirthTime(parseCivilDate('2024-06-01'),0,'00:30'),87.6)`);
  assert.ok(Math.abs(correction.offsetMin-correction.longitudeMin-correction.equationMin)<1e-10);assert.equal(correction.dayOffset,-1);
});
test('city database uses sourced WGS84 stable IDs, exact aliases and explicit ambiguity',()=>{
  assert.ok(e.run('CITY_DATA.cities.length')>2500);assert.equal(e.run('CITY_DATA.crs'),'WGS84');
  assert.equal(e.run('new Set(CITY_DATA.cities.map(c=>c.id)).size'),e.run('CITY_DATA.cities.length'));
  assert.equal(e.run(`resolveLocation('北京').id`),'geonames:1816670');assert.equal(e.run(`resolveLocation('新疆 库尔勒').id`),'geonames:1529376');
  assert.equal(e.run(`resolveLongitude('乌鲁木齐 90°')`),90);
  assert.throws(()=>e.run(`resolveLongitude('我住北京旁边')`),/标准城市/);assert.throws(()=>e.run(`resolveLocation('朝阳')`),/不唯一/);
  assert.equal(e.run(`CITY_DATA.cities.every(c=>Math.abs(c.longitude)<=180&&Math.abs(c.latitude)<=90&&resolveLocation(locationLabel(c)).id===c.id)`),true);
});
test('unknown hour partitions all day, early/late Zi, exact Jie, solar crossing and unsupported edges',()=>{
  const regular=e.json(`unknownBirthCandidates(parseCivilDate('2024-02-10'))`);
  assert.equal(regular.kind,'unknown-time');assert.equal(regular.candidates.length,13);assert.equal(regular.stablePillars[2].stable,false);
  for(let i=1;i<regular.candidates.length;i++)assert.equal(regular.candidates[i-1].to,regular.candidates[i].from);
  const zeroRule=e.json(`unknownBirthCandidates(parseCivilDate('2024-02-10'),'',{dayBoundary:'zi-zheng'})`);assert.equal(zeroRule.stablePillars[2].stable,true);
  const jie=e.json(`unknownBirthCandidates(parseCivilDate('2026-02-04'))`);assert.equal(jie.stablePillars[0].stable,false);assert.equal(jie.stablePillars[1].stable,false);
  assert.ok(jie.candidates.some(c=>c.from===Date.UTC(2026,1,4,4,2,8)));
  const solar=e.json(`unknownBirthCandidates(parseCivilDate('2024-02-10'),'87.6°',{trueSolar:true})`);assert.ok(solar.candidates.some(c=>c.temporal.correction.dayOffset===-1));
  const edge=e.json(`unknownBirthCandidates(parseCivilDate('1900-01-31'),'87.6°',{trueSolar:true})`);assert.ok(edge.excluded.length>0);assert.ok(edge.candidates.length>0);
});
