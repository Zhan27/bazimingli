function aiFollowPaint(){
  const box=document.getElementById('ai-follow-box'),input=document.getElementById('ai-follow-input'),button=document.getElementById('ai-follow-btn');
  if(!box||!aiEvidenceSession)return;
  const active=!!(aiEvidenceActive||aiFollowActive),f=aiEvidenceSession.followup||emptyAiFollowup();
  if(input)input.disabled=active;if(button)button.disabled=active;
  const clear=document.getElementById('ai-follow-clear');if(clear)clear.disabled=!!aiEvidenceActive;
  box.replaceChildren();box.style.display=f.turns.length||f.draft?'block':'none';
  const labels={complete:'已完成',running:'正在回复',canceled:'已停止',failed:'请求中断',interrupted:'上次已中断'};
  for(const t of [...f.turns,...(f.draft?[f.draft]:[])]){
    const article=document.createElement('article');article.className='ai-follow-turn';
    const q=document.createElement('p'),a=document.createElement('p'),status=document.createElement('small');
    q.className='ai-follow-question';q.textContent='问：'+t.question;a.className='ai-follow-answer';a.textContent=t.answer||(t.status==='running'?'正在生成追问回复…':'尚未收到回复，可修改问题后重新发送');status.textContent=labels[t.status]||t.status;article.append(q,a,status);box.appendChild(article);
  }
  if(!active&&f.draft&&input&&!input.value)input.value=f.draft.question;
}
function aiFollowClear(){
  if(!aiEvidenceSession||aiEvidenceActive)return;
  if(aiFollowActive)aiEvidenceCancel();
  aiEvidenceSession=clearAiFollowup(aiEvidenceSession);const input=document.getElementById('ai-follow-input');if(input)input.value='';
  aiEvidenceSave(true);aiEvidencePaint();aiEvidenceNotice('已清空追问；原始解读和排盘记录保留。');
}
function aiFollowUp(){
  const c=aiGetConfig(),input=document.getElementById('ai-follow-input'),q=input?.value.trim();
  if(!q||!lastZh||!c.key||!lastAIReply){aiEvidenceNotice('追问需要当前命盘、API设置及已接收的解读。');return;}
  if(aiEvidenceActive||aiFollowActive)return;
  const chart=aiEvidenceChart(),id=chartFactId(chart);
  try{aiEvidenceSession=beginAiFollowup(aiEvidenceSession,q);}catch(e){aiEvidenceNotice(e.message);return;}
  const run={chartId:id,handle:null};aiFollowActive=run;
  const current=()=>aiFollowActive===run&&lastZh&&aiEvidenceSession?.chartId===id&&chartFactId(aiEvidenceChart())===id;
  const system='你是传统文化学习助手。计算事实只读，不得改写四柱或应用评分。不得给财富金额、学历上下限、医学诊断或命运必然结论。区分传统解释与事实，说明条件和不确定性，未核验原文不得当成已核对引文。针对追问用简洁文字回答。当前计算事实：'+JSON.stringify({chartId:id,pillars:chart.pillars,facts:aiFacts(chart),rules:chart.rules});
  const payload={model:c.model,messages:[{role:'system',content:system},...aiFollowupMessages(aiEvidenceSession,lastAIReply)],stream:true,temperature:0.4};
  aiEvidenceSave(true);aiEvidencePaint();
  run.handle=aiStreamChat(aiEndpoint(c),{method:'POST',headers:aiHeaders(c),body:JSON.stringify(payload)},{
    idleMs:90000,totalMs:180000,maxCharacters:60000,
    onDelta:(d,all)=>{if(current()){aiEvidenceSession=updateAiFollowup(aiEvidenceSession,all);aiEvidenceSave();aiFollowPaint();}},
    onDone:full=>{if(!current())return;if(!full.trim()){aiEvidenceSession=updateAiFollowup(aiEvidenceSession,'','failed');aiFollowActive=null;aiEvidenceSave(true);aiEvidencePaint();aiEvidenceNotice('上游未返回正文，追问草稿已保留。');return;}aiEvidenceSession=updateAiFollowup(aiEvidenceSession,full,'complete');aiFollowActive=null;if(input)input.value='';aiEvidenceSave(true);aiEvidencePaint();},
    onError:e=>{if(!current())return;aiEvidenceSession=updateAiFollowup(aiEvidenceSession,aiEvidenceSession.followup.draft.answer,e?.code==='CANCELED'?'canceled':'failed');aiFollowActive=null;aiEvidenceSave(true);aiEvidencePaint();aiEvidenceNotice(e?.message||'请求中断，追问草稿已保留。');}
  });
}
