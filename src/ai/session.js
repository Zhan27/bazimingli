/** Pure attempt state. A transport failure never deletes previously accepted dimensions. */
const AI_SESSION_VERSION=1;
function aiSafeOrigin(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.origin:'';}catch(e){return '';}}
function aiDimensionIds(ids){
  if(!Array.isArray(ids)||!ids.length||ids.length>18||new Set(ids).size!==ids.length||ids.some(x=>!Number.isInteger(x)||x<1||x>18))throw new TypeError('请求维度无效');
  return [...ids];
}
function createAiSession(chart,schoolId,now=new Date().toISOString()){
  aiFacts(chart);
  if(getRuleProfile(schoolId).key!==chart.rules.profile)throw new TypeError('流派与计算规则不一致，请重新排盘');
  return {version:AI_SESSION_VERSION,chartId:chartFactId(chart),input:JSON.parse(JSON.stringify(chart.input)),schoolId:getRuleProfile(schoolId).id,ruleVersion:chart.rules.version,accepted:{},history:[],attempt:null,updatedAt:now};
}
function beginAiAttempt(session,{ids,model,base,format='json',now=new Date().toISOString()}){
  aiDimensionIds(ids);if(!['json','markdown'].includes(format))throw new TypeError('输出格式无效');
  const next=JSON.parse(JSON.stringify(session));
  if(next.attempt){const a=next.attempt;next.history.push({ids:a.ids,status:a.status,meta:a.meta});next.history=next.history.slice(-10);}
  next.attempt={ids:[...ids],format,status:'running',text:'',errors:[],meta:{model:String(model||'').slice(0,120),provider:aiSafeOrigin(base),promptVersion:aiPromptVersion(next.schoolId),ruleVersion:next.ruleVersion,knowledgeVersion:KNOWLEDGE_VERSION,contractVersion:AI_CONTRACT_VERSION,startedAt:now,finishedAt:null}};
  next.updatedAt=now;return next;
}
function updateAiAttempt(session,text,status='running',now=new Date().toISOString()){
  if(typeof text!=='string'||text.length>1000000)throw new RangeError('回复超过长度上限');
  if(!['running','canceled','failed'].includes(status)||!session.attempt)throw new TypeError('草稿状态无效');
  const next=JSON.parse(JSON.stringify(session));next.attempt.text=text;next.attempt.status=status;next.updatedAt=now;
  if(status!=='running')next.attempt.meta.finishedAt=now;return next;
}
function finishAiAttempt(session,chart,text,now=new Date().toISOString()){
  if(session.chartId!==chartFactId(chart)||!session.attempt)throw new TypeError('回复不属于当前命盘');
  const next=updateAiAttempt(session,text,'running',now),a=next.attempt;
  if(a.format==='json'){
    const checked=parseStructuredAi(text,chart,{dimensionIds:a.ids});a.errors=checked.errors;
    const rootErrors=checked.errors.some(e=>!e.path.startsWith('dimensions.'));
    if(!rootErrors)for(const d of checked.dimensions){
      if(!a.ids.includes(d.id)||checked.errors.some(e=>e.path==='dimensions.'+d.id||e.path.startsWith('dimensions.'+d.id+'.')))continue;
      next.accepted[d.id]={format:'json',dimension:JSON.parse(JSON.stringify(d)),meta:{...a.meta,finishedAt:now}};
    }
  }else{
    const parsed=parseAiDimensions(text);a.errors=[];
    for(const id of a.ids){const content=parsed.sections[id];
      if(content&&!parsed.duplicates.includes(id))next.accepted[id]={format:'markdown',text:content,meta:{...a.meta,finishedAt:now}};
      else a.errors.push({type:'REASONING_GAP',path:'dimensions.'+id,message:'Markdown缺失或重复维度'});
    }
  }
  a.status=a.errors.length?'incomplete':'complete';a.meta.finishedAt=now;return next;
}
function missingAiDimensions(session){return AI_DIM_CONTRACTS.map(d=>d.id).filter(id=>!Object.hasOwn(session.accepted,id));}
/** Rebuild known fields; stored replies are untrusted, not executable UI or credentials. */
function restoreAiSession(raw,chart){
  if(typeof raw!=='string'||raw.length>1800000)throw new RangeError('草稿过大');
  const saved=JSON.parse(raw);
  if(saved.version!==AI_SESSION_VERSION||saved.chartId!==chartFactId(chart)||saved.ruleVersion!==chart.rules.version)throw new TypeError('草稿命盘或规则版本不匹配');
  const restored=createAiSession(chart,saved.schoolId);
  const cleanMeta=meta=>({model:String(meta?.model||'').slice(0,120),provider:aiSafeOrigin(meta?.provider),promptVersion:String(meta?.promptVersion||'').slice(0,100),ruleVersion:chart.rules.version,knowledgeVersion:String(meta?.knowledgeVersion||'').slice(0,40),contractVersion:String(meta?.contractVersion||'').slice(0,40),startedAt:String(meta?.startedAt||'').slice(0,40),finishedAt:meta?.finishedAt?String(meta.finishedAt).slice(0,40):null});
  for(const id of AI_DIM_CONTRACTS.map(d=>d.id)){
    const item=saved.accepted?.[id];if(!item)continue;
    if(item.format==='json'){
      const v={schemaVersion:AI_CONTRACT_VERSION,chartId:restored.chartId,pillars:chart.pillars.map(p=>p.text),dimensions:[item.dimension]};
      if(item.dimension?.id===id&&validateAiResult(v,chart,{dimensionIds:[id]}).ok)restored.accepted[id]={format:'json',dimension:JSON.parse(JSON.stringify(item.dimension)),meta:cleanMeta(item.meta)};
    }else if(item.format==='markdown'&&typeof item.text==='string'&&item.text.length<=1000000)restored.accepted[id]={format:'markdown',text:item.text,meta:cleanMeta(item.meta)};
  }
  const a=saved.attempt;
  if(a){aiDimensionIds(a.ids);if(!['json','markdown'].includes(a.format)||typeof a.text!=='string'||a.text.length>1000000)throw new TypeError('草稿内容无效');restored.attempt={ids:a.ids,format:a.format,text:a.text,status:a.status==='running'?'interrupted':String(a.status).slice(0,30),errors:[],meta:cleanMeta(a.meta)};}
  if(Array.isArray(saved.history))restored.history=saved.history.slice(-10).map(h=>({ids:aiDimensionIds(h.ids),status:String(h.status).slice(0,30),meta:cleanMeta(h.meta)}));
  restored.updatedAt=String(saved.updatedAt||'').slice(0,40);return restored;
}
