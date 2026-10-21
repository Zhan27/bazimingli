/* Partition an unknown birth day at every actual calculation boundary, rather
 * than pretending a single default hour is known. Intervals are [from,to).
 * Includes early/late Zi, exact solar terms and solar-time hour/day crossings. */
function unknownBirthCandidates(date,place='',options={}){
  assertSolarDate(date);
  const profile=getRuleProfile(options.schoolId===undefined?0:options.schoolId);
  const opts={...options,preciseTime:true,dayBoundary:options.dayBoundary||profile.dayBoundary};
  const start=civilDay(date),end=start+86400000;
  const offset=opts.utcOffsetMinutes===undefined?480:Number(opts.utcOffsetMinutes),dst=Number(opts.dstMinutes||0);
  // Validate the offset even if the first/last effective dates fall out of range.
  normalizeBirthTime(civilFromMillis(start+12*3600000),opts);
  const shift=(480-offset-dst)*60000,longitude=opts.trueSolar?resolveLongitude(place):null;
  const corrected=t=>{
    const civil=civilFromMillis(t+shift);
    return t+shift+(longitude===null?0:Math.round(((longitude-120)*4+equationOfTime(civil))*60000));
  };
  const points=new Set([start,end]);
  const add=t=>{if(t>start&&t<end)points.add(t);};
  const firstYear=civilFromMillis(start+shift).getFullYear(),lastYear=civilFromMillis(end+shift).getFullYear();
  for(let y=firstYear;y<=lastYear;y++)solarTerms(y).forEach(t=>add(t-shift));
  // UTC+8 midnight is an input to the fractional-year approximation and lunar
  // date conversion, independent of the chosen day-pillar boundary.
  for(let t=Math.floor((start+shift)/86400000)*86400000;t<=end+shift;t+=86400000)add(t-shift);
  const lower=corrected(start),upper=corrected(end-1);
  for(let day=Math.floor(lower/86400000)*86400000;day<=upper;day+=86400000){
    for(const hour of [0,1,3,5,7,9,11,13,15,17,19,21,23]){
      const target=day+hour*3600000;
      if(target<=lower||target>upper)continue;
      let lo=start,hi=end;
      // Millisecond axis is deterministic; this resolution is not an accuracy claim.
      while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(corrected(mid)>=target)hi=mid;else lo=mid;}
      add(hi);
    }
  }
  const edges=[...points].sort((a,b)=>a-b),candidates=[],excluded=[];
  for(let i=0;i<edges.length-1;i++){
    const from=edges[i],to=edges[i+1];if(to<=from)continue;
    const sample=civilFromMillis(Math.floor((from+to-1)/2));
    try{
      const temporal=calculateBirth(sample,hourIndexAt(sample),place,opts),lunar=solar2lunar(temporal.effectiveDate);
      candidates.push({from,to,temporal,lunar,pillars:[temporal.yearGZ,temporal.monthGZ,temporal.dayGZ,temporal.hourGZ]});
    }catch(e){excluded.push({from,to,reason:e.message});}
  }
  if(!candidates.length)throw new RangeError('候选时段均超出历法支持范围');
  const stablePillars=[0,1,2,3].map(i=>{const values=[...new Set(candidates.map(c=>GAN[c.pillars[i][0]]+ZHI[c.pillars[i][1]]))];return {pillar:['年','月','日','时'][i],stable:values.length===1,values};});
  return {kind:'unknown-time',inputDate:civilFromMillis(start),profile,options:opts,place,candidates,excluded,stablePillars,
    precision:'时辰未知：列出全天候选区间，不生成默认确定命盘；区间中点仅供内部求值，临界分秒受近似太阳时和坐标精度影响'};
}
