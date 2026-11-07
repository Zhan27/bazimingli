// Offline checks over explicitly supplied responses. No provider client is loaded.
const path=require('node:path'),vm=require('node:vm');
const {sources,sourceText}=require('../scripts/source-list.cjs');
const root=path.resolve(__dirname,'..'),context=vm.createContext({Date});
for(const file of sources.filter(f=>!f.startsWith('src/ui/')&&!f.startsWith('src/storage/')&&(!f.startsWith('src/ai/')||['src/ai/dimensions.js','src/ai/contracts.js'].includes(f)))){
  vm.runInContext(sourceText(root,file),context,{filename:file});
}
const calculate=vm.runInContext('calculateChart',context),evaluate=vm.runInContext('evaluateAiResponse',context);
const factId=vm.runInContext('chartFactId',context),promptVersion=vm.runInContext('aiPromptVersion',context);
const ruleVersion=vm.runInContext('RULE_VERSION',context),contractVersion=vm.runInContext('AI_CONTRACT_VERSION',context);
const knowledgeVersion=vm.runInContext('KNOWLEDGE_VERSION',context),applicationVersion=require('../package.json').version;
const INPUT_VERSION='ai-offline-evaluation-v1',MAX_BYTES=20*1024*1024;
const allIds=Array.from({length:18},(_,i)=>i+1);
const plain=value=>JSON.parse(JSON.stringify(value));
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const label=(value,max)=>typeof value==='string'&&value.trim()&&value.length<=max?value:null;

function metrics(rows){
  const latency=rows.map(r=>r.reportedLatencyMs).filter(x=>x!==null),costs=rows.map(r=>r.reportedCost).filter(Boolean),currencies=new Map();
  for(const cost of costs)currencies.set(cost.currency,(currencies.get(cost.currency)||0)+cost.amount);
  return {
    latency:{reportedCount:latency.length,missingCount:rows.length-latency.length,meanMs:latency.length?latency.reduce((a,b)=>a+b,0)/latency.length:null},
    cost:{reportedCount:costs.length,missingCount:rows.length-costs.length,totals:[...currencies].sort(([a],[b])=>a.localeCompare(b)).map(([currency,amount])=>({currency,amount:Number(amount.toPrecision(15))}))}
  };
}
function summarize(rows){
  const checked=rows.filter(r=>r.status==='evaluated'),passed=checked.filter(r=>r.result.pass).length,errorCounts={};
  for(const row of checked)for(const [type,count] of Object.entries(row.result.errorCounts))errorCounts[type]=(errorCounts[type]||0)+count;
  return {total:rows.length,evaluated:checked.length,passed,failed:checked.length-passed,notEvaluated:rows.length-checked.length,contractPassRate:checked.length?passed/checked.length:null,errorCounts,metrics:metrics(rows)};
}
function metadata(row){
  const ids=row.dimensionIds===undefined?allIds:row.dimensionIds;
  const validIds=Array.isArray(ids)&&ids.length>0&&ids.length<=18&&new Set(ids).size===ids.length&&ids.every(i=>Number.isInteger(i)&&i>=1&&i<=18);
  const format=row.format===undefined?'json':row.format;
  return {model:label(row.model,120),promptVersion:label(row.promptVersion,120),ruleVersion:label(row.ruleVersion,40),knowledgeVersion:row.knowledgeVersion===undefined?null:label(row.knowledgeVersion,40),format:['json','markdown'].includes(format)?format:null,dimensionIds:validIds?[...ids].sort((a,b)=>a-b):null};
}
function validMetadata(meta){
  return meta.model&&meta.promptVersion&&meta.ruleVersion&&['json','markdown'].includes(meta.format)&&Array.isArray(meta.dimensionIds)&&meta.dimensionIds.length>0&&meta.dimensionIds.length<=18&&new Set(meta.dimensionIds).size===meta.dimensionIds.length&&meta.dimensionIds.every(i=>Number.isInteger(i)&&i>=1&&i<=18);
}
function validMetrics(row){
  if(row.reportedLatencyMs!==undefined&&(!Number.isFinite(row.reportedLatencyMs)||row.reportedLatencyMs<0||row.reportedLatencyMs>86400000))return false;
  const c=row.reportedCost;
  return c===undefined||(record(c)&&Number.isFinite(c.amount)&&c.amount>=0&&c.amount<=1000000&&typeof c.currency==='string'&&/^[A-Z]{3}$/.test(c.currency));
}
function safeResult(result){
  const {errors,...rest}=result,value=plain(rest);
  value.errors=Array.from(errors.slice(0,100),e=>({type:e.type,path:/^(?:root|schemaVersion|chartId|pillars|dimensions(?:\.(?:[1-9]|1[0-8])(?:\.(?:title|conclusion|explanation|uncertainty|facts|rules|alternatives))?)?)$/.test(e.path)?e.path:'root',message:e.message}));
  value.errorDetailsTruncated=errors.length-value.errors.length;
  return value;
}
function evaluateCase(row){
  const meta=metadata(row),base={id:row.id,...meta,reportedLatencyMs:null,reportedCost:null};
  const fail=code=>({...base,status:'not-evaluated',code});
  if(!validMetadata(meta)||(row.knowledgeVersion!==undefined&&!meta.knowledgeVersion)||!validMetrics(row)||typeof row.text!=='string'||row.text.length>1000000)return fail('INVALID_CASE');
  base.reportedLatencyMs=row.reportedLatencyMs??null;
  base.reportedCost=row.reportedCost===undefined?null:{amount:row.reportedCost.amount,currency:row.reportedCost.currency};
  if(meta.ruleVersion!==ruleVersion)return fail('RULE_VERSION_MISMATCH');
  if(meta.knowledgeVersion!==null&&meta.knowledgeVersion!==knowledgeVersion)return fail('KNOWLEDGE_VERSION_MISMATCH');
  let chart;
  try{chart=calculate(row.input);}catch{return fail('INVALID_CHART_INPUT');}
  if(chart.kind!=='chart')return fail('UNKNOWN_BIRTH_TIME');
  base.chartId=factId(chart);
  if(meta.format==='markdown')return {...base,status:'unverified',code:'MARKDOWN_UNVERIFIED'};
  return {...base,status:'evaluated',result:safeResult(evaluate(row.text,chart,{dimensionIds:meta.dimensionIds}))};
}
function evaluateResponses(data){
  if(!record(data)||data.schemaVersion!==INPUT_VERSION||!['synthetic','recorded-model-responses'].includes(data.inputKind)||!Array.isArray(data.cases)||data.cases.length<1||data.cases.length>200)throw new TypeError('Invalid evaluation dataset, version, origin or case count (1..200)');
  if(Buffer.byteLength(JSON.stringify(data),'utf8')>MAX_BYTES)throw new RangeError('Evaluation dataset exceeds 20 MiB');
  const ids=new Set();
  for(const row of data.cases){
    if(!record(row)||typeof row.id!=='string'||!/^[-\w]{1,80}$/.test(row.id)||ids.has(row.id))throw new TypeError('Evaluation case IDs must be present, valid and unique');
    ids.add(row.id);
  }
  const cases=data.cases.map(evaluateCase),groups=new Map();
  for(const row of cases){
    const {model,promptVersion,ruleVersion,knowledgeVersion,format,dimensionIds}=row;
    const key=JSON.stringify([model,promptVersion,ruleVersion,knowledgeVersion,format,dimensionIds]);
    if(!groups.has(key))groups.set(key,{model,promptVersion,ruleVersion,knowledgeVersion,format,dimensionIds,cases:[]});
    groups.get(key).cases.push(row);
  }
  return {schemaVersion:'ai-offline-evaluation-report-v1',inputKind:data.inputKind,generatedAt:new Date().toISOString(),versions:{applicationVersion,ruleVersion,contractVersion,knowledgeVersion},scope:'Contract and explicit chart-reference checks. Model names, prompt versions, latency and costs are operator-reported. Prose accuracy and predictive validity are not measured.',paidRequests:0,cases,summary:summarize(cases),groups:[...groups.values()].map(({cases,...meta})=>({...meta,caseIds:cases.map(r=>r.id),chartIds:[...new Set(cases.map(r=>r.chartId).filter(Boolean))],summary:summarize(cases)}))};
}
function createExample(){
  const input={date:'2024-02-10',time:'12:00',gender:1},chart=calculate(input);
  const titles=plain(vm.runInContext('AI_DIM_CONTRACTS',context));
  const text=JSON.stringify({schemaVersion:contractVersion,chartId:factId(chart),pillars:plain(chart.pillars.map(p=>p.text)),dimensions:titles.map(d=>({id:d.id,title:d.title,conclusion:'合成协议示例',facts:['pillar.day'],rules:['rule.strength'],explanation:'用于契约检查。',uncertainty:'high',alternatives:['其他解释需核对']}))});
  const base={model:'synthetic/example',promptVersion:promptVersion(0),ruleVersion,knowledgeVersion,format:'json',input};
  return plain({schemaVersion:INPUT_VERSION,inputKind:'synthetic',cases:[{id:'valid',...base,text},{id:'truncated',...base,text:'{'}]});
}
module.exports={evaluateResponses,createExample,MAX_BYTES};
