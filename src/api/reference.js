/** Offline adapters written for documented JSON shapes. No service URLs, credentials or remote requests. */
function normalizeReferenceChart(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('对照文件须为JSON对象');
  let data=value,input;
  if(value.format==='bazimingli-study'){
    if(value.formatVersion!==1)throw new TypeError('不支持此学习快照版本');
    assertStudyChart(value.chart);input={...value.chart.input,options:chartStudyFacts(value.chart).timeOptions};data=value.facts;
    if(!data||JSON.stringify(data.pillars?.map(p=>p.text))!==JSON.stringify(value.chart.pillars.map(p=>p.text)))throw new TypeError('快照盘面与四柱不一致');
  }else if(value.action==='chart'&&value.data&&typeof value.data==='object')data=value.data;
  input=input||data.input||{};
  const ids=['year','month','day','hour'],source=data.pillars;
  if(!source||typeof source!=='object')throw new TypeError('未找到四柱字段pillars');
  const small=value=>typeof value==='string'&&value.length<=60?value:undefined;
  const pillars=ids.map((id,i)=>{
    const p=Array.isArray(source)?source[i]:source[id],text=small(typeof p==='string'?p:p?.text??p?.ganZhi);
    if(!text||text.length!==2||!GAN.includes(text[0])||!ZHI.includes(text[1])||GAN.indexOf(text[0])%2!==ZHI.indexOf(text[1])%2)throw new TypeError('四柱干支缺失或格式无效：'+id);
    const hidden=typeof p==='object'?(p.hidden??p.hiddenStems):undefined;
    if(hidden!==undefined&&(!Array.isArray(hidden)||hidden.length>3||hidden.some(h=>!GAN.includes(h?.gan??h?.stem))))throw new TypeError('藏干字段无效：'+id);
    return {id,text,hidden:hidden?.map(h=>h.gan??h.stem).sort(),tenGod:small(p?.tenGod),branchTenGod:small(p?.branchTenGod),nayin:small(p?.nayin??p?.naYin),diShi:small(p?.diShi),isKong:typeof p?.isKong==='boolean'?p.isKong:undefined};
  });
  const periodSource=data.dayun?.periods??data.dayun?.dyList??data.dayun?.list;
  if(periodSource!==undefined&&(!Array.isArray(periodSource)||periodSource.length>20))throw new TypeError('大运列表无效');
  const dayun=periodSource?.map(p=>{
    const text=small(p.text??p.ganZhi)??(Number.isInteger(p.g)&&Number.isInteger(p.z)?GAN[p.g]+ZHI[p.z]:undefined);
    if(!text||text.length!==2||!GAN.includes(text[0])||!ZHI.includes(text[1])||GAN.indexOf(text[0])%2!==ZHI.indexOf(text[1])%2)throw new TypeError('大运干支无效');return text;
  });
  const date=small(input.date)??((!input.calendarType||input.calendarType==='solar')&&[input.birthYear,input.birthMonth,input.birthDay].every(Number.isInteger)?String(input.birthYear)+'-'+String(input.birthMonth).padStart(2,'0')+'-'+String(input.birthDay).padStart(2,'0'):undefined);
  const time=small(input.time)??([input.birthHour,input.birthMinute].every(Number.isInteger)?String(input.birthHour).padStart(2,'0')+':'+String(input.birthMinute).padStart(2,'0'):undefined);
  return {pillars,dayun,startAge:Number.isFinite(data.dayun?.startAge)?data.dayun.startAge:undefined,input:{date,time,gender:input.gender==='male'?1:input.gender==='female'?0:[0,1].includes(input.gender)?input.gender:undefined},
    conventions:Object.fromEntries(['utcOffsetMinutes','dstMinutes','dayBoundary','trueSolar'].map(k=>[k,input.options?.[k]]))};
}
function compareReferenceChart(chart,reference){
  const local=normalizeReferenceChart(createStudySnapshot(chart)),other=normalizeReferenceChart(reference),fields=[],warnings=[];
  const aliases={'泉中水':'井泉水','城头土':'城墙土','砂中金':'沙中金','砂中土':'沙中土','佛灯火':'覆灯火'};
  const add=(path,label,a,b,normalize=x=>x)=>{
    const status=a===undefined||b===undefined?'not-provided':JSON.stringify(normalize(a))===JSON.stringify(normalize(b))?'same':'different';
    fields.push({path,label,status,local:a??null,reference:b??null,normalizedAlias:status==='same'&&JSON.stringify(a)!==JSON.stringify(b)});
  };
  for(const key of ['date','time','gender'])add('input.'+key,{date:'出生日期',time:'钟表时分',gender:'性别参数'}[key],local.input[key],other.input[key]);
  for(const key of ['utcOffsetMinutes','dstMinutes','dayBoundary','trueSolar']){
    const a=local.conventions[key],b=other.conventions[key];
    if(a===undefined||b===undefined)warnings.push('口径尚未同时提供：'+key);else if(a!==b)warnings.push('口径不同：'+key);
  }
  for(let i=0;i<4;i++)for(const key of ['text','hidden','tenGod','branchTenGod','nayin','diShi','isKong']){
    add('pillars.'+local.pillars[i].id+'.'+key,['年','月','日','时'][i]+'柱 · '+({text:'干支',hidden:'藏干集合',tenGod:'干十神',branchTenGod:'支本气十神',nayin:'纳音',diShi:'十二长生',isKong:'日旬空亡'}[key]),local.pillars[i][key],other.pillars[i][key],key==='nayin'?x=>aliases[x]||x:x=>x);
  }
  if(other.dayun){
    const n=Math.min(local.dayun.length,other.dayun.length);
    for(let i=0;i<n;i++)add('dayun.'+i,'第'+(i+1)+'步大运',local.dayun[i],other.dayun[i]);
    if(local.dayun.length!==other.dayun.length)warnings.push('大运步数不同：仅比较共有的'+n+'步（本盘'+local.dayun.length+'步，对照'+other.dayun.length+'步）');
  }else add('dayun','大运序列',local.dayun,undefined);
  if(other.startAge!==undefined&&local.startAge!==other.startAge)warnings.push('起运年龄不同：本盘'+local.startAge+'，对照'+other.startAge+'；先核对周岁/虚岁、交运时刻与舍入口径');
  const summary=Object.fromEntries(['same','different','not-provided'].map(s=>[s,fields.filter(f=>f.status===s).length]));
  return {schemaVersion:'1.0.0',verdict:summary.different?'differences':warnings.length||summary['not-provided']?'aligned-with-gaps':'aligned',summary,fields,warnings,
    scope:'仅比较已提供的计算/传统表项，不认定任一实现为标准答案。藏干仅比较集合；空亡依据日柱旬。',excluded:['强弱分数与分档','喜忌用神','格局','神煞集合','AI解释','藏干中气/余气次序和权重'],rules:{...chart.rules}};
}
