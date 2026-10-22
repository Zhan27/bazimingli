/** UI adapter: computed facts remain read-only; only accepted interpretation cards change. */
const AI_DRAFT_NS='mingli_ai_draft_v1';
let aiEvidenceSession=null,aiEvidenceActive=null,aiFollowActive=null,aiDraftWarning='',aiDraftSavedAt=0;
function aiEvidenceChart(){if(!lastZh)throw new TypeError('请先确定出生时刻并排盘');return serializeChart(lastZh);}
function aiEvidenceNotice(text){const el=document.getElementById('ai-workflow-status');if(el)el.textContent=text;}
function aiEvidenceSave(force=false){
  if(!aiEvidenceSession||(!force&&Date.now()-aiDraftSavedAt<500))return;
  try{const raw=JSON.stringify(aiEvidenceSession);if(raw.length>1800000)throw new Error('size');sessionStorage.setItem(AI_DRAFT_NS,raw);aiDraftSavedAt=Date.now();aiDraftWarning='';}
  catch(e){aiDraftWarning='草稿无法写入会话存储，仅当前页面保留。';}
}
function aiEvidenceCancel(){
  if(aiFollowActive){const follow=aiFollowActive;aiFollowActive=null;follow.abort();}
  const run=aiEvidenceActive;if(!run)return;aiEvidenceActive=null;run.handle?.abort();
  if(aiEvidenceSession?.attempt){aiEvidenceSession=updateAiAttempt(aiEvidenceSession,aiEvidenceSession.attempt.text,'canceled');aiEvidenceSave(true);}
  if(lastZh&&chartFactId(aiEvidenceChart())===run.chartId)aiEvidencePaint();
}
function aiEvidenceLeave(){aiEvidenceCancel();lastAIReply='';}
function aiEvidenceMissing(){return aiEvidenceSession?missingAiDimensions(aiEvidenceSession):AI_DIM_CONTRACTS.map(d=>d.id);}
function aiEvidenceSummary(){
  return Object.entries(aiEvidenceSession?.accepted||{}).map(([id,item])=>'【'+id+'】'+(item.format==='json'?JSON.stringify(item.dimension):item.text)).join('\n');
}
function aiEvidenceCardData(id){
  aiDimensionIds([id]);const item=aiEvidenceSession?.accepted[id];if(!item||aiEvidenceSession.chartId!==chartFactId(aiEvidenceChart()))throw new TypeError('本维尚无可复制或导出的AI内容');
  const facts=aiFacts(aiEvidenceChart());return {schemaVersion:1,kind:'ai-dimension',chartId:aiEvidenceSession.chartId,dimensionId:id,validation:item.format==='json'?'structure-and-reference-only':'unverified-markdown',referencedFacts:item.format==='json'?Object.fromEntries(item.dimension.facts.map(f=>[f,facts[f]])):{},sources:item.format==='json'?item.dimension.rules.map(knowledgeCitation):[],...JSON.parse(JSON.stringify(item))};
}
async function aiEvidenceCopyCard(id){
  try{const text=JSON.stringify(aiEvidenceCardData(id),null,2);if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else{shareFallback2(text,'单卡内容已复制（含校验状态与依据）');return;}workbenchToast('单卡内容已复制（含校验状态与依据）');}catch(e){workbenchToast('复制失败：'+e.message);}
}
function aiEvidenceExportCard(id){
  try{const data=aiEvidenceCardData(id),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AI维度_'+id+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){workbenchToast(e.message);}
}
function aiEvidencePaint(){
  const session=aiEvidenceSession;if(!session||!lastZh||session.chartId!==chartFactId(aiEvidenceChart()))return;
  const active=!!(aiEvidenceActive||aiFollowActive);
  for(const id of ['ai-deep-btn','ai-retry-missing','ai-restore-draft','ai-clear-draft','ai-output-format']){const el=document.getElementById(id);if(el)el.disabled=active;}
  const cancel=document.getElementById('ai-cancel');if(cancel)cancel.disabled=!active;
  document.querySelectorAll('[data-ai-retry]').forEach(b=>{b.disabled=active;});
  document.querySelectorAll('[data-ai-card-action]').forEach(b=>{b.disabled=!session.accepted[b.dataset.dimensionId];});
  const preview=document.getElementById('ai-draft-text');if(preview)preview.textContent=session.attempt?.text||'尚无回复文本。';
  const errors=document.getElementById('ai-evidence-errors');if(errors){errors.replaceChildren();for(const e of (session.attempt?.errors||[]).slice(0,30)){const li=document.createElement('li');li.textContent=e.type+' · '+e.path+'：'+e.message;errors.appendChild(li);}}
  const status={running:'正在接收；完整JSON结束后校验',complete:'请求维度已收到',incomplete:'部分维度待修复',canceled:'已取消，草稿已保留',failed:'请求中断，草稿已保留',interrupted:'上次请求已中断，可校验草稿或手动重试'}[session.attempt?.status]||'等待生成或回填';
  aiEvidenceNotice(status+' · 已接收 '+Object.keys(session.accepted).length+'/18 维 · 缺失 '+aiEvidenceMissing().join('、')+(aiDraftWarning?' · '+aiDraftWarning:''));
  const facts=aiFacts(aiEvidenceChart());
  for(const [id,item] of Object.entries(session.accepted)){
    const card=document.getElementById('ai-dim-'+(Number(id)-1));if(!card)continue;
    let target=card.querySelector('.ai-evidence-result');if(!target){target=document.createElement('div');target.className='ai-evidence-result';card.appendChild(target);}target.replaceChildren();target.hidden=card.dataset.aiCollapsed==='1';
    const label=document.createElement('p');label.className='ai-evidence-label';label.textContent=item.format==='json'?'JSON结构与引用检查通过 · 断语正确性未验证':'Markdown兼容内容 · 事实与引用未校验';target.appendChild(label);
    const field=(name,value)=>{const p=document.createElement('p'),b=document.createElement('b');b.textContent=name+'：';p.append(b,document.createTextNode(value));target.appendChild(p);};
    if(item.format==='json'){
      const d=item.dimension;field('结论（传统解释）',d.conclusion);field('盘面事实',d.facts.map(f=>f+' = '+JSON.stringify(facts[f])).join('；'));field('规则与出处',d.rules.map(r=>{const k=knowledgeCitation(r);return r+' · '+k.book+' · '+k.status;}).join('；'));field('解释',d.explanation);field('不确定性',{high:'高',medium:'中',low:'低'}[d.uncertainty]);field('竞争解释',d.alternatives.join('；')||'未提出其他解释，不代表唯一结论');
    }else field('兼容文本',item.text);
    const details=document.createElement('details'),summary=document.createElement('summary'),meta=document.createElement('p');summary.textContent='生成记录';meta.textContent=JSON.stringify(item.meta,null,2);details.append(summary,meta);target.appendChild(details);
    const badge=card.querySelector('.ai-dim-badge');if(badge){badge.style.display='inline-block';badge.textContent=item.format==='json'?'结构已校验':'未校验';}
  }
}
function aiEvidenceMount(){
  const chart=aiEvidenceChart();aiEvidenceSession=createAiSession(chart,lastSchool);aiDraftWarning='';
  const host=document.getElementById('ai-workflow-controls');if(!host)return;
  host.innerHTML='<label for="ai-output-format">输出格式</label> <select id="ai-output-format"><option value="json">JSON（兼容模式）</option><option value="schema">JSON Schema（接口需支持）</option><option value="markdown">Markdown（不校验事实）</option></select> <button type="button" id="ai-cancel" class="btn btn-ghost" disabled>停止生成</button> <button type="button" id="ai-retry-missing" class="btn btn-ghost">仅重试缺失维度（调用API）</button> <button type="button" id="ai-restore-draft" class="btn btn-ghost">恢复最近草稿</button> <button type="button" id="ai-clear-draft" class="btn btn-ghost">清除AI草稿</button><p class="note">仅保留最近一盘的标签页会话草稿（含出生资料和回复，不含API设置）；浏览器恢复会话可能保留。取消或失败不会自动重发收费请求。JSON Schema不支持时请主动改选兼容格式后重试。</p><p id="ai-workflow-status" role="status" aria-live="polite"></p><ul id="ai-evidence-errors"></ul><details><summary>查看回复草稿（未经校验的原文）</summary><pre id="ai-draft-text"></pre><button type="button" id="ai-validate-draft" class="btn btn-ghost">重新校验草稿（不调用API）</button></details>';
  document.getElementById('ai-cancel').onclick=aiEvidenceCancel;
  document.getElementById('ai-retry-missing').onclick=()=>aiEvidenceStart(aiEvidenceMissing());
  document.getElementById('ai-restore-draft').onclick=aiEvidenceRestore;
  document.getElementById('ai-clear-draft').onclick=aiEvidenceClear;
  document.getElementById('ai-validate-draft').onclick=()=>{if(aiEvidenceSession.attempt&&!aiEvidenceActive&&!aiFollowActive){aiEvidenceSession=finishAiAttempt(aiEvidenceSession,aiEvidenceChart(),aiEvidenceSession.attempt.text);aiEvidenceSave(true);lastAIReply=aiEvidenceSummary();aiEvidencePaint();}};
  for(const {id} of AI_DIM_CONTRACTS){const card=document.getElementById('ai-dim-'+(id-1));if(card){const actions=document.createElement('div');actions.className='ai-card-actions';const b=document.createElement('button');b.type='button';b.className='btn btn-ghost ai-dimension-retry';b.dataset.aiRetry=String(id);b.textContent='重生成本维（调用API）';b.onclick=()=>aiEvidenceStart([id]);actions.appendChild(b);
    for(const [action,title] of [['collapse','折叠AI内容'],['copy','复制单卡'],['export','导出单卡']]){const button=document.createElement('button');button.type='button';button.className='btn btn-ghost ai-dimension-retry';button.dataset.aiCardAction=action;button.dataset.dimensionId=String(id);button.textContent=title;button.onclick=()=>{if(action==='copy')aiEvidenceCopyCard(id);else if(action==='export')aiEvidenceExportCard(id);else{const target=card.querySelector('.ai-evidence-result');if(target){target.hidden=!target.hidden;card.dataset.aiCollapsed=target.hidden?'1':'0';button.textContent=target.hidden?'展开AI内容':'折叠AI内容';button.setAttribute('aria-expanded',String(!target.hidden));}}};if(action==='collapse')button.setAttribute('aria-expanded','true');actions.appendChild(button);}card.appendChild(actions);}}
  try{const raw=sessionStorage.getItem(AI_DRAFT_NS);if(raw){const saved=JSON.parse(raw);if(saved.chartId===chartFactId(chart))aiEvidenceSession=restoreAiSession(raw,chart);}}catch(e){aiDraftWarning='已有草稿无法校验；可清除或使用原始备份。';}
  lastAIReply=aiEvidenceSummary();aiEvidencePaint();
}
function aiEvidenceClear(){
  if(aiEvidenceActive||aiFollowActive)return;
  try{sessionStorage.removeItem(AI_DRAFT_NS);}catch(e){aiEvidenceNotice('浏览器拒绝删除存储，请清除站点数据。');return;}
  aiEvidenceSession=createAiSession(aiEvidenceChart(),lastSchool);lastAIReply='';document.querySelectorAll('.ai-evidence-result').forEach(el=>el.remove());document.querySelectorAll('[id^="ai-dim-"] .ai-dim-badge').forEach(el=>{el.style.display='none';});aiEvidencePaint();aiEvidenceNotice('已清除AI草稿；排盘记录和API设置各自保留。');
}
function aiEvidenceRestore(){
  if(aiEvidenceActive||aiFollowActive)return;
  try{
    const raw=sessionStorage.getItem(AI_DRAFT_NS);if(!raw){aiEvidenceNotice('未找到标签页草稿。');return;}if(raw.length>1800000)throw new Error('草稿过大');
    const saved=JSON.parse(raw),input=validateChartInput(saved.input),o=input.options;
    if(saved.ruleVersion!==aiEvidenceChart().rules.version){document.getElementById('ai-draft-text').textContent=typeof saved.attempt?.text==='string'?saved.attempt.text.slice(0,1000000):'无原文';aiEvidenceNotice('草稿属于旧规则版本，仅供查看和复制原文，不自动套用到当前命盘。');return;}
    if(saved.chartId===chartFactId(aiEvidenceChart())){aiEvidenceSession=restoreAiSession(raw,aiEvidenceChart());lastAIReply=aiEvidenceSummary();aiEvidencePaint();return;}
    // Restoring a different chart only recalculates locally; it never calls a provider.
    const hour=hourIndexAt(withBirthTime(parseCivilDate(input.date),input.hourIdx,input.time));
    const values={'zh-cal':'0','zh-solar':input.date,'zh-time':input.time,'zh-minute':String(Number(input.time.split(':')[1])||0),'zh-hour':String(hour),'zh-gender':String(input.gender),'zh-place':input.place,'zh-name':'','zh-unknow-hour':'0','zh-school2':String(saved.schoolId),'zh-day-boundary':o.dayBoundary||'zi-chu','zh-dst':String(o.dstMinutes||0),'zh-true-sun':o.trueSolar?'1':'0','zh-wx-mode':o.wxMode||'stems-main-qi'};
    for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(el)el.value=value;}
    restoreUtcOffset('zh-utc-offset',o.utcOffsetMinutes??480);document.getElementById('zh-unknow-hour').dispatchEvent(new Event('change'));zhToggleCal();zhSyncFromSolar();zhCast();
  }catch(e){aiEvidenceNotice('草稿无法恢复：'+e.message);}
}
function aiEvidenceApplyText(text){
  if(aiEvidenceActive||aiFollowActive){aiEvidenceNotice('请先停止生成再回填。');return;}
  try{
    const chart=aiEvidenceChart(),format=/^(?:```(?:json)?\s*)?[\[{]/i.test(text.trim())?'json':'markdown';
    aiEvidenceSession=beginAiAttempt(aiEvidenceSession||createAiSession(chart,lastSchool),{ids:AI_DIM_CONTRACTS.map(d=>d.id),model:'手动回填',format});
    aiEvidenceSession=finishAiAttempt(aiEvidenceSession,chart,text);aiEvidenceSave(true);lastAIReply=aiEvidenceSummary();aiEvidencePaint();
  }catch(e){aiEvidenceNotice('回填失败：'+e.message);}
}
function aiEvidenceStart(ids=AI_DIM_CONTRACTS.map(d=>d.id)){
  if(aiEvidenceActive||aiFollowActive)return;
  if(!ids.length){aiEvidenceNotice('没有缺失维度；可在卡片上单独重生成。');return;}
  const c=aiGetConfig(),selection=document.getElementById('ai-output-format')?.value||'json',format=selection==='markdown'?'markdown':'json';
  if(!c.key){aiEvidenceNotice('请先配置API Key，或使用提取Prompt与手动回填。');return;}
  if(c.divine&&format==='json'){aiEvidenceNotice('服务端Prompt模板当前使用Markdown。请主动选择Markdown兼容模式，或关闭服务端Prompt使用JSON；不会自动付费重试。');return;}
  if(c.divine&&ids.length<18){aiEvidenceNotice('旧版服务端Prompt不支持逐维请求。请关闭服务端Prompt后再局部重试；不会悄悄改为全量收费生成。');return;}
  try{
    const chart=aiEvidenceChart(),sp=buildEvidencePrompt(chart,lastSchool,{dimensionIds:ids,mode:format});
    aiEvidenceSession=beginAiAttempt(aiEvidenceSession||createAiSession(chart,lastSchool),{ids,model:c.model,base:c.base,format});
    let payload,url;
    if(c.divine){url=aiDivineEndpoint(c);payload={...aiDivinePayload(lastSchool),model:c.model,stream:true};}
    else{url=aiEndpoint(c);payload={model:c.model,messages:[{role:'system',content:sp.system},{role:'user',content:sp.user}],stream:true,temperature:0.4};if(selection==='schema')payload.response_format={type:'json_schema',json_schema:{name:'chart_interpretation',strict:false,schema:aiOutputSchema()}};}
    if(c.maxTok>0)payload.max_tokens=c.maxTok;
    const run={chartId:chartFactId(chart),handle:null};aiEvidenceActive=run;aiEvidenceSave(true);aiEvidencePaint();
    const current=()=>aiEvidenceActive===run&&lastZh&&chartFactId(aiEvidenceChart())===run.chartId;
    run.handle=aiStreamChat(url,{method:'POST',headers:aiHeaders(c),body:JSON.stringify(payload)},{
      onDelta:(delta,all)=>{if(!current())return;aiEvidenceSession=updateAiAttempt(aiEvidenceSession,all);aiEvidenceSave();const preview=document.getElementById('ai-draft-text');if(preview)preview.textContent=all;},
      onDone:full=>{if(!current())return;aiEvidenceSession=finishAiAttempt(aiEvidenceSession,chart,full);aiEvidenceActive=null;aiEvidenceSave(true);lastAIReply=aiEvidenceSummary();aiEvidencePaint();},
      onError:error=>{if(!current())return;aiEvidenceSession=updateAiAttempt(aiEvidenceSession,aiEvidenceSession.attempt.text,error.code==='CANCELED'?'canceled':'failed');aiEvidenceActive=null;aiEvidenceSave(true);aiEvidencePaint();aiEvidenceNotice((error.code==='CANCELED'?'已取消':'请求失败，请检查接口/格式后手动重试')+'；已收到文本和已有维度保留。'+(aiDraftWarning?' '+aiDraftWarning:''));}
    });
  }catch(e){aiEvidenceActive=null;aiEvidenceNotice('无法生成：'+e.message);}
}
