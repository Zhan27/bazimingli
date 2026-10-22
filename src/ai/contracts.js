/** Versioned model output contract; the engine chart remains immutable. */
const AI_CONTRACT_VERSION='1.0.0';
const AI_DIM_TITLES=['旺衰平衡','子平格局','穷通调候','盲派做功','神煞辅助','纳音意象','性格特质','财富运势','事业学业','婚姻感情','六亲缘分','健康提示','人际贵人','大运总览','流年应期','开运建议','综合参考','风险提示'];
const AI_DIM_CONTRACTS=freezeRules(AI_DIM_TITLES.map((title,i)=>({id:i+1,title,inputFields:i===13?['pillars','dayun','rules']:i===2?['pillars','useGod','time','rules']:['pillars','wuxing','strength','rules'],requiredOutput:['conclusion','facts','rules','explanation','uncertainty','alternatives'],quality:'引用存在的事实ID和规则ID；区分计算与传统解释；说明条件和不确定性；不作确定的健康、财富或学历预测'})));
function chartFactId(chart){
  const text=JSON.stringify([chart.schemaVersion,chart.input,chart.rules,chart.pillars?.map(p=>p.text)]);let h=2166136261;
  for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);
  return 'chart-'+(h>>>0).toString(16); // Correlation identifier, never authentication.
}
function aiFacts(chart){
  if(chart.kind!=='chart')throw new TypeError('未知时辰须先核对候选时段');
  const facts=Object.fromEntries(chart.pillars.map(p=>['pillar.'+p.id,p.text]));
  for(const p of chart.pillars)facts['hidden.'+p.id]=p.hidden;
  for(const [i,w] of WUXING.entries())facts['wuxing.'+w]=chart.wuxing.counts[i];
  return {...facts,'strength.score':chart.strength.score,'strength.type':chart.strength.type,'useGod.current':chart.useGod.element,'useGod.alternatives':chart.useGod.alternatives.map(i=>WUXING[i]),'rule.profile':chart.rules.profile,'dayun.startAge':chart.dayun.startAge};
}
function aiOutputSchema(){
  const text={type:'string',maxLength:8000};
  return {type:'object',additionalProperties:false,required:['schemaVersion','chartId','pillars','dimensions'],properties:{schemaVersion:{type:'string',enum:[AI_CONTRACT_VERSION]},chartId:{type:'string'},pillars:{type:'array',minItems:4,maxItems:4,items:{type:'string'}},dimensions:{type:'array',minItems:1,maxItems:18,items:{type:'object',additionalProperties:false,required:['id','title','conclusion','facts','rules','explanation','uncertainty','alternatives'],properties:{id:{type:'integer',minimum:1,maximum:18},title:text,conclusion:text,facts:{type:'array',minItems:1,maxItems:30,items:{type:'string'}},rules:{type:'array',minItems:1,maxItems:20,items:{type:'string'}},explanation:text,uncertainty:{type:'string',enum:['high','medium','low']},alternatives:{type:'array',maxItems:5,items:{type:'string',maxLength:2000}}}}}}};
}
function validateAiResult(value,chart,{dimensionIds=AI_DIM_CONTRACTS.map(d=>d.id)}={}){
  const errors=[],add=(type,path,message)=>errors.push({type,path,message}),facts=aiFacts(chart);
  if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,errors:[{type:'EXPRESSION_ERROR',path:'root',message:'输出须为JSON对象'}],dimensions:[],missing:dimensionIds};
  for(const k of Object.keys(value))if(!['schemaVersion','chartId','pillars','dimensions'].includes(k))add('RULE_INCONSISTENCY',k,'存在契约外字段');
  if(value.schemaVersion!==AI_CONTRACT_VERSION)add('RULE_INCONSISTENCY','schemaVersion','输出契约版本不匹配');
  if(value.chartId!==chartFactId(chart))add('FACT_ERROR','chartId','命盘标识不匹配');
  if(JSON.stringify(value.pillars)!==JSON.stringify(chart.pillars.map(p=>p.text)))add('FACT_ERROR','pillars','AI四柱与计算事实不同，禁止覆盖');
  const dims=Array.isArray(value.dimensions)?value.dimensions:[],seen=new Set();
  if(!Array.isArray(value.dimensions)||dims.length>18)add('EXPRESSION_ERROR','dimensions','维度数组无效');
  for(const d of dims.slice(0,18)){
    const p='dimensions.'+d?.id;
    if(!d||typeof d!=='object'||!Number.isInteger(d.id)||!dimensionIds.includes(d.id)||seen.has(d.id)){add('RULE_INCONSISTENCY',p,'维度ID无效、重复或不属于请求范围');continue;}seen.add(d.id);
    for(const k of Object.keys(d))if(!['id','title','conclusion','facts','rules','explanation','uncertainty','alternatives'].includes(k))add('RULE_INCONSISTENCY',p+'.'+k,'存在契约外字段');
    for(const field of ['title','conclusion','explanation'])if(typeof d[field]!=='string'||!d[field].trim()||d[field].length>8000)add('EXPRESSION_ERROR',p+'.'+field,'文字缺失或过长');
    if(!['high','medium','low'].includes(d.uncertainty))add('RULE_INCONSISTENCY',p+'.uncertainty','须说明high/medium/low不确定性');
    if(!Array.isArray(d.facts)||!d.facts.length||d.facts.length>30)add('REASONING_GAP',p+'.facts','结论缺少盘面依据');
    else for(const f of d.facts)if(typeof f!=='string'||!Object.hasOwn(facts,f))add('FACT_ERROR',p+'.facts','引用了不存在的盘面事实ID');
    if(!Array.isArray(d.rules)||!d.rules.length||d.rules.length>20)add('REASONING_GAP',p+'.rules','结论缺少规则出处');
    else for(const r of d.rules)if(!KNOWLEDGE_ENTRIES.some(k=>k.id===r))add('RULE_INCONSISTENCY',p+'.rules','规则ID不在版本化来源目录');
    if(!Array.isArray(d.alternatives)||d.alternatives.length>5||d.alternatives.some(x=>typeof x!=='string'||x.length>2000))add('EXPRESSION_ERROR',p+'.alternatives','竞争解释须为有界文本数组');
    if(chart.useGod.conflict&&d.id===3&&(!Array.isArray(d.alternatives)||!d.alternatives.length))add('REASONING_GAP',p+'.alternatives','调候与扶抑存在分歧，须保留竞争解释');
    if(/必(?:死|灾|离婚|破财)|注定|(?:财富|资产|年薪).{0,10}(?:\d+\s*万|[百万千亿]+级)|学历(?:上限|下限|必达).{0,8}(博士|硕士|本科)|命局定分\s*\d+/.test(JSON.stringify([d.title,d.conclusion,d.explanation,d.alternatives])))add('RULE_INCONSISTENCY',p,'禁止宿命或未校准的量化预测');
  }
  const missing=dimensionIds.filter(id=>!seen.has(id));
  for(const id of missing)add('REASONING_GAP','dimensions.'+id,'缺失维度');
  return {ok:!errors.length,errors,missing,dimensions:dims.slice(0,18),facts};
}
function parseStructuredAi(text,chart,options={}){
  const raw=String(text||'').trim();if(raw.length>1000000)throw new RangeError('AI回复最多100万字符');
  try{return {...validateAiResult(JSON.parse(raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')),chart,options),format:'json'};}
  catch(e){if(options.partial)return {format:'json',pending:true,dimensions:[],errors:[]};return {format:'json',ok:false,dimensions:[],errors:[{type:'EXPRESSION_ERROR',path:'root',message:'JSON未完整结束或格式无效'}]};}
}
function aiPromptVersion(schoolId){const p=getRuleProfile(schoolId);return 'evidence-'+p.key+'-1.1.0';}
function buildEvidencePrompt(chart,schoolId,{dimensionIds=AI_DIM_CONTRACTS.map(d=>d.id),mode='json'}={}){
  const profile=getRuleProfile(schoolId),facts=aiFacts(chart);
  const system='你是传统文化学习助手。计算事实只读，不得改写四柱或应用评分。每项按结论、盘面事实ID、规则ID、解释、不确定性、竞争解释输出。high表示不确定性高，不是高置信度。未核验的典籍引文只作待核验线索，不可说成已核对原文，不强制古籍原文。不得给命运必然结论、医学诊断、财富金额、学历上下限或看似精确的预测分数。仅输出请求的维度，不重复其余维度。\n流派独立配置：'+JSON.stringify(profile)+'\n本流派Prompt版本：'+aiPromptVersion(schoolId)+'\n流派任务：'+profile.focus+'\n输出维度契约：'+JSON.stringify(AI_DIM_CONTRACTS.filter(d=>dimensionIds.includes(d.id)))+'\n'+(mode==='markdown'?'兼容Markdown：每项以【维度ID】开头，保留全部依据字段。此格式不会被程序宣称完成事实与引用校验。':'仅输出符合此JSON Schema的JSON：'+JSON.stringify(aiOutputSchema()));
  const user=JSON.stringify({schemaVersion:AI_CONTRACT_VERSION,chartId:chartFactId(chart),pillars:chart.pillars.map(p=>p.text),facts,rules:chart.rules,requestedDimensionIds:dimensionIds,knowledge:searchKnowledge('',profile.key).slice(0,20)});
  return {system,user,version:aiPromptVersion(schoolId),knowledgeVersion:KNOWLEDGE_VERSION};
}
function evaluateAiResponse(text,chart,options={}){
  const result=parseStructuredAi(text,chart,options),counts=Object.fromEntries(['FACT_ERROR','RULE_INCONSISTENCY','REASONING_GAP','EXPRESSION_ERROR'].map(k=>[k,result.errors.filter(e=>e.type===k).length]));
  return {contractVersion:AI_CONTRACT_VERSION,chartId:chartFactId(chart),complete:result.dimensions?.length===(options.dimensionIds?.length||18)&&!result.missing?.length,pass:result.ok===true,errorCounts:counts,dimensionCount:result.dimensions?.length||0,errors:result.errors,scope:'Contract/explicit fact-reference checks only; prose factual accuracy and predictive validity are not established'};
}
