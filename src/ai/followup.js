/* Bounded, chart-bound dialogue state; additive to v1 interpretation drafts. */
function emptyAiFollowup(){return {version:1,turns:[],draft:null};}
function trimAiFollowup(turns){
  const rows=turns.slice(-10);
  while(rows.length&&rows.reduce((n,t)=>n+t.question.length+t.answer.length,0)>180000)rows.shift();
  return rows;
}
function beginAiFollowup(session,question,now=new Date().toISOString()){
  if(typeof question!=='string'||!question.trim()||question.length>4000)throw new RangeError('追问限1至4000字');
  const f=session.followup||emptyAiFollowup();if(f.draft?.status==='running')throw new TypeError('请先停止当前追问');
  const turns=f.draft?trimAiFollowup([...f.turns,f.draft]):f.turns;
  return {...session,followup:{version:1,turns,draft:{question:question.trim(),answer:'',status:'running',createdAt:now}},updatedAt:now};
}
function updateAiFollowup(session,answer,status='running',now=new Date().toISOString()){
  if(!session.followup?.draft)throw new TypeError('没有当前追问');
  if(typeof answer!=='string'||answer.length>60000)throw new RangeError('追问回复超过6万字上限');
  if(!['running','complete','canceled','failed'].includes(status))throw new TypeError('追问状态无效');
  const f=session.followup,draft={...f.draft,answer,status,updatedAt:now};
  return {...session,followup:{version:1,turns:status==='complete'?trimAiFollowup([...f.turns,draft]):f.turns,draft:status==='complete'?null:draft},updatedAt:now};
}
function clearAiFollowup(session){return {...session,followup:emptyAiFollowup()};}
function aiFollowupMessages(session,report){
  const f=session.followup;if(!f?.draft)throw new TypeError('没有当前追问');
  const history=[];let remaining=32000;
  for(const turn of [...f.turns].reverse()){
    if(turn.status!=='complete')continue;
    const q=turn.question;if(remaining<=q.length)break;
    const a=turn.answer.slice(-(remaining-q.length));
    history.unshift({role:'user',content:q},{role:'assistant',content:a});remaining-=q.length+a.length;
  }
  return [{role:'assistant',content:String(report||'').slice(-12000)},...history,{role:'user',content:f.draft.question}];
}
function restoreAiFollowup(value){
  if(value===undefined)return emptyAiFollowup();
  if(!value||value.version!==1||!Array.isArray(value.turns)||value.turns.length>10)throw new TypeError('追问草稿无效');
  const clean=(t,isDraft)=>{
    if(!t||typeof t.question!=='string'||!t.question.trim()||t.question.length>4000||typeof t.answer!=='string'||t.answer.length>60000||!['complete','running','canceled','failed','interrupted'].includes(t.status)||(!isDraft&&t.status==='running'))throw new TypeError('追问记录无效');
    return {question:t.question,answer:t.answer,status:t.status==='running'?'interrupted':t.status,createdAt:String(t.createdAt||'').slice(0,40),updatedAt:String(t.updatedAt||'').slice(0,40)};
  };
  return {version:1,turns:trimAiFollowup(value.turns.map(t=>clean(t,false))),draft:value.draft?clean(value.draft,true):null};
}
