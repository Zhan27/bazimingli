/** @typedef {{date:string,time?:string,hourIdx?:number,gender?:0|1,place?:string,unknownTime?:boolean,options?:object}} ChartInput */
/** Stable, JSON-only public contract. Dates are named clock fields or actual UTC instants. */
const CHART_SCHEMA_VERSION='1.0.0';
function validateChartInput(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('命盘输入须为对象');
  if(typeof input.date!=='string')throw new TypeError('date须为YYYY-MM-DD');
  if(input.time!==undefined&&typeof input.time!=='string')throw new TypeError('time须为HH:mm');
  if(input.hourIdx!==undefined&&(!Number.isInteger(input.hourIdx)||input.hourIdx<0||input.hourIdx>11))throw new RangeError('hourIdx须为0至11');
  if(input.gender!==undefined&&![0,1].includes(input.gender))throw new RangeError('gender须为0或1');
  if(input.place!==undefined&&(typeof input.place!=='string'||input.place.length>200))throw new TypeError('place无效');
  if(input.unknownTime!==undefined&&typeof input.unknownTime!=='boolean')throw new TypeError('unknownTime须为布尔值');
  const options=input.options||{};
  if(typeof options!=='object'||Array.isArray(options))throw new TypeError('options无效');
  return {date:input.date,time:input.time??(input.hourIdx===undefined?'12:00':''),hourIdx:input.hourIdx??6,gender:input.gender??1,place:input.place||'',unknownTime:!!input.unknownTime,options:{...options,preciseTime:true}};
}
function chartInputFromCalculation(z){
  const d=z.inputDate||z.temporal.inputDate;
  return {date:fmtLocalDate(d),time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),gender:z.gender,place:z.place||'',options:{schoolId:z.profile.id,dayBoundary:z.temporal.dayBoundary,trueSolar:!!z.temporal.correction,utcOffsetMinutes:z.temporal.utcOffsetMinutes,dstMinutes:z.temporal.dstMinutes,wxMode:z.wxStatistics.mode}};
}
function serializeChart(z,input){
  const t=z.temporal;
  return {schemaVersion:CHART_SCHEMA_VERSION,kind:'chart',input:input||chartInputFromCalculation(z),rules:{version:RULE_VERSION,profile:z.profile.key,strength:z.strength.rule,dayBoundary:t.dayBoundary},
    time:{instantUtc:t.instantUtc,inputClock:fmtLocalDate(t.inputDate)+'T'+String(t.inputDate.getHours()).padStart(2,'0')+':'+String(t.inputDate.getMinutes()).padStart(2,'0'),beijingClock:fmtLocalDate(t.civilDate)+'T'+String(t.civilDate.getHours()).padStart(2,'0')+':'+String(t.civilDate.getMinutes()).padStart(2,'0'),effectiveClock:fmtLocalDate(t.effectiveDate)+'T'+String(t.effectiveDate.getHours()).padStart(2,'0')+':'+String(t.effectiveDate.getMinutes()).padStart(2,'0'),correction:t.correction?{longitude:t.correction.longitude,longitudeMinutes:t.correction.longitudeMin,equationMinutes:t.correction.equationMin,dayOffset:t.correction.dayOffset}:null},
    pillars:z.pillars.map(([g,b],i)=>({id:['year','month','day','hour'][i],ganIndex:g,zhiIndex:b,gan:GAN[g],zhi:ZHI[b],text:GAN[g]+ZHI[b],tenGod:SHISHEN_NAME[tenGod(z.dg,g)],hidden:ZHI_HIDDEN[b].map(h=>({gan:GAN[h],tenGod:SHISHEN_NAME[tenGod(z.dg,h)]}))})),
    lunar:{...z.lunar},wuxing:z.wxStatistics,strength:z.strength,useGod:{...z.useGod,element:WUXING[z.yongShen],climate: z.tiaoHouWX<0?null:WUXING[z.tiaoHouWX]},dayun:z.dy,
    provenance:{calendar:'lunar-javascript@1.7.7',solar:'NOAA approximation',coordinates:CITY_DATA.version,predictionValidation:'not-established'}};
}
function validateRulePack(pack){
  if(!pack||typeof pack!=='object'||!/^[a-z][a-z0-9-]{1,60}$/.test(pack.id||''))throw new TypeError('规则包id无效');
  const copy=JSON.parse(JSON.stringify(pack));
  if(typeof copy.version!=='string'||copy.version.length>40)throw new TypeError('规则包须有版本');
  const r=copy.strength;
  if(r){
    for(const key of Object.keys(STRENGTH_RULES.month))if(!Number.isFinite(r.month?.[key])||Math.abs(r.month[key])>100)throw new RangeError('月令权重无效');
    for(const key of ['same','resource'])if(!Array.isArray(r.root?.[key])||r.root[key].length!==3||r.root[key].some(x=>!Number.isFinite(x)||Math.abs(x)>100))throw new RangeError('通根权重无效');
    for(const x of [r.root.dayBonus,r.root.monthBonus,r.momentum?.rooted,r.momentum?.floating])if(!Number.isFinite(x)||Math.abs(x)>100)throw new RangeError('评分权重无效');
    const t=r.thresholds,values=t&&['following','weak','balanced','strong'].map(k=>t[k]);
    if(!values||values.some((x,i)=>!Number.isFinite(x)||(i&&x<=values[i-1])))throw new RangeError('分类阈值必须递增');
    r.id=copy.id+'@'+copy.version;
  }
  return freezeRules(copy);
}
/** Calculate without DOM, storage, network, or modifying the caller's input. */
function calculateChart(input,{rulePack}={}){
  const i=validateChartInput(input),d=withBirthTime(parseCivilDate(i.date),i.hourIdx,i.time);
  if(i.unknownTime){const r=unknownBirthCandidates(d,i.place,i.options);return {schemaVersion:CHART_SCHEMA_VERSION,kind:r.kind,input:i,rules:{version:RULE_VERSION,profile:r.profile.key},stablePillars:r.stablePillars,candidates:r.candidates.map(c=>({fromClock:unknownClock(c.from),toClock:unknownClock(c.to),pillars:c.pillars.map(([g,z])=>GAN[g]+ZHI[z])})),excluded:r.excluded};}
  const pack=rulePack?validateRulePack(rulePack):null;
  return serializeChart(zhCompute(d,hourIndexAt(d),i.gender,i.place,{...i.options,strengthRules:pack?.strength}),i);
}
function unknownClock(ms){const d=civilFromMillis(ms);return fmtLocalDate(d)+'T'+[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');}
function compareChartFacts(a,b){
  const differences=[];
  const visit=(x,y,path)=>{
    if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))visit(x[k],y[k],path?path+'.'+k:k);}
    else if(x!==y)differences.push({path,before:x??null,after:y??null});
  };visit(a,b,'');return {schemaVersion:CHART_SCHEMA_VERSION,differences,count:differences.length};
}
function compareSchools(input){return RULE_PROFILES.map(p=>calculateChart({...input,options:{...input.options,schoolId:p.id}}));}
function batchCalculate(inputs,options={}){
  if(!Array.isArray(inputs)||inputs.length>1000)throw new RangeError('每批最多1000条');
  return inputs.map((input,index)=>{try{return {index,status:'pass',result:calculateChart(input,options)};}catch(e){return {index,status:'fail',error:{code:'INVALID_INPUT',message:e.message}};}});
}
function calendarDebug(input){
  const i=validateChartInput(input),d=withBirthTime(parseCivilDate(i.date),i.hourIdx,i.time),t=calculateBirth(d,hourIndexAt(d),i.place,i.options),ms=civilMillis(t.civilDate),year=t.civilDate.getFullYear();
  const terms=[year-1,year,year+1].flatMap(y=>solarTerms(y).map((v,n)=>({name:TERM_NAMES[n],clock:unknownClock(v),ms:v,boundary:n%2===0?'jie':'qi'})));
  return {input:i,time:serializeChart(zhCompute(d,hourIndexAt(d),i.gender,i.place,i.options),i).time,previousTerm:terms.filter(x=>x.ms<=ms).at(-1),nextTerm:terms.find(x=>x.ms>ms),dayBoundary:dayBoundaryLabel(t.dayBoundary),calendarRange:[CALENDAR_MIN,CALENDAR_MAX]};
}
function chartEvidenceGraph(chart){
  if(chart.kind!=='chart')throw new TypeError('候选盘请先选择具体时段');
  const nodes=chart.pillars.map(p=>({id:'pillar.'+p.id,label:p.text,type:'computed-pillar'})),edges=[];
  for(const p of chart.pillars){for(const h of p.hidden){const id='hidden.'+p.id+'.'+h.gan;nodes.push({id,label:h.gan+' '+h.tenGod,type:'hidden-stem'});edges.push({from:'pillar.'+p.id,to:id,rule:'hidden-stems-table',source:'rule.hidden-stems'});}}
  const pairs=[[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){
    const x=chart.pillars[a],y=chart.pillars[b];
    if((x.zhiIndex+6)%12===y.zhiIndex)edges.push({from:'pillar.'+x.id,to:'pillar.'+y.id,rule:'branch-opposition',source:'rule.branch-relations'});
    if(pairs.some(([u,v])=>(u===x.zhiIndex&&v===y.zhiIndex)||(v===x.zhiIndex&&u===y.zhiIndex)))edges.push({from:'pillar.'+x.id,to:'pillar.'+y.id,rule:'branch-six-union',source:'rule.branch-relations'});
  }
  return {nodes,edges,meaning:'Traditional rule relationships; no predictive validity claim'};
}
function calculateModule(module,input){
  const i=validateChartInput(input),date=withBirthTime(parseCivilDate(i.date),i.hourIdx,i.time);
  const args={date,hourIdx:hourIndexAt(date),gender:i.gender,referenceYear:input.referenceYear??date.getFullYear()};
  let result;
  if(module==='ziwei')result=calculateZiwei({...args,referenceDate:input.referenceDate});
  else if(module==='qimen')result=calculateQimen({...args,school:input.school??1,dayBoundary:i.options.dayBoundary??'zi-chu'});
  else if(module==='liuyao')result=calculateLiuyao({dateStr:i.date,hourIdx:args.hourIdx,time:i.time,dayBoundary:i.options.dayBoundary??'zi-chu',ruleMode:input.ruleMode??'standard',mode:input.mode??0,numStr:input.numStr??'',yaoSeq:input.yaoSeq??[]});
  else throw new RangeError('未知计算模块');
  return JSON.parse(JSON.stringify({schemaVersion:CHART_SCHEMA_VERSION,module,input,result}));
}
function comparePair(a,b,referenceYear){
  const raw=i=>{const x=validateChartInput(i),d=withBirthTime(parseCivilDate(x.date),x.hourIdx,x.time);return zhCompute(d,hourIndexAt(d),x.gender,x.place,x.options);};
  return {left:calculateChart(a),right:calculateChart(b),comparison:heHunCompute(raw(a),raw(b),'甲方','乙方',referenceYear),scoreMeaning:'传统规则的主观分档，未经现实关系预测校准'};
}
