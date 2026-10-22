/** Additive learning views; the original chart schema, rule version and AI identity stay unchanged. */
const STUDY_SCHEMA_VERSION='1.0.0';
function assertStudyChart(chart){
  if(chart?.kind!=='chart'||!Array.isArray(chart.pillars)||chart.pillars.length!==4)throw new TypeError('请先选择具体时辰并排出完整四柱');
  chart.pillars.forEach((p,i)=>{if(p.id!==['year','month','day','hour'][i]||!Number.isInteger(p.ganIndex)||!Number.isInteger(p.zhiIndex)||p.ganIndex<0||p.ganIndex>9||p.zhiIndex<0||p.zhiIndex>11||p.ganIndex%2!==p.zhiIndex%2||p.text!==GAN[p.ganIndex]+ZHI[p.zhiIndex])throw new TypeError('四柱字段不一致');});
}
function studyPillar(g,z,dayGan,kong){
  return {text:GAN[g]+ZHI[z],gan:GAN[g],zhi:ZHI[z],tenGod:SHISHEN_NAME[tenGod(dayGan,g)],branchTenGod:SHISHEN_NAME[tenGod(dayGan,ZHI_HIDDEN[z][0])],
    hidden:ZHI_HIDDEN[z].map((h,i)=>({gan:GAN[h],tenGod:SHISHEN_NAME[tenGod(dayGan,h)],isMainQi:i===0})),nayin:nayinOf(g,z),diShi:getChangSheng(dayGan,z),isKong:kong.includes(z)};
}
function chartStudyFacts(chart){
  assertStudyChart(chart);
  const day=chart.pillars[2],kong=kongwang([day.ganIndex,day.zhiIndex]),xun=indexToGZ(Math.floor(gzIndex(day.ganIndex,day.zhiIndex)/10)*10);
  const pillars=chart.pillars.map(p=>({id:p.id,...studyPillar(p.ganIndex,p.zhiIndex,day.ganIndex,kong)}));
  const raw=Object.fromEntries(chart.pillars.map(p=>[p.id+'GZ',[p.ganIndex,p.zhiIndex]]));
  const relations=gzRelationModel(raw).rows.map(r=>({id:'relation.'+r.id,type:r.t,name:r.name,kind:r.cls,lane:r.lane,positions:r.members.map(n=>({pillar:['year','month','day','hour'][n.column],char:n.char}))}));
  const birthYear=Number(chart.time.effectiveClock.slice(0,4));
  const periods=chart.dayun.dyList.map((d,index)=>({index,...studyPillar(d.g,d.z,day.ganIndex,kong),startAge:d.age,endAge:d.endAge,
    years:Array.from({length:d.endAge-d.age+1},(_,i)=>{
      const year=birthYear+d.age+i,[g,z]=indexToGZ(year-4);
      return {year,age:d.age+i,...studyPillar(g,z,day.ganIndex,kong)};
    })}));
  return {schemaVersion:STUDY_SCHEMA_VERSION,pillars,kongWang:{basis:'day-pillar-xun',xun:GAN[xun[0]]+ZHI[xun[1]]+'旬',branches:kong.map(z=>ZHI[z])},relations,
    dayun:{startAge:chart.dayun.startAge,startYears:chart.dayun.startYears,startMonths:chart.dayun.startMonths,forward:chart.dayun.forward,periods},
    timeOptions:{utcOffsetMinutes:Number(chart.input.options?.utcOffsetMinutes??480),dstMinutes:Number(chart.input.options?.dstMinutes??0),dayBoundary:chart.rules.dayBoundary,trueSolar:!!chart.time.correction},
    conventions:{hiddenStems:'Existing table order; only the first stem is marked main qi. Secondary qi labels and weights are not inferred from ordering.',age:'year minus effective birth year; same convention as the existing timeline',annualPillar:'The year label represents the pillar after LiChun, not every instant of that Gregorian year.',void:'All per-pillar and transit flags refer to the natal day-pillar xun.',scope:'Traditional table annotations; no predictive validity claim'},rules:{...chart.rules}};
}
function chartStudyMonths(chart,year){
  assertStudyChart(chart);
  if(!Number.isInteger(year)||year<1900||year>2099)throw new RangeError('流月年份支持1900至2099');
  const day=chart.pillars[2],kong=kongwang([day.ganIndex,day.zhiIndex]);
  const boundaries=Array.from({length:13},(_,i)=>{const n=(i+1)*2;return {term:TERM_NAMES[n%24],ms:solarTerms(year+Math.floor(n/24))[n%24]};});
  const months=getLiuYue(indexToGZ(year-4)[0],12).map((m,i)=>({number:i+1,jieQi:boundaries[i].term,startClock:unknownClock(boundaries[i].ms),endClock:unknownClock(boundaries[i+1].ms),...studyPillar(m.g,m.z,day.ganIndex,kong)}));
  return {schemaVersion:STUDY_SCHEMA_VERSION,year,clockBasis:'Asia/Shanghai (UTC+08:00), half-open [startClock,endClock)',months};
}
function createStudySnapshot(chart){
  assertStudyChart(chart);
  return {format:'bazimingli-study',formatVersion:1,chart:JSON.parse(JSON.stringify(chart)),facts:chartStudyFacts(chart)};
}
