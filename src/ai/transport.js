/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
function aiEndpoint(c){
  let base=String(c.base||AI_DEF.base).trim().replace(/\/+$/,'');
  if(/\/chat\/completions$/.test(base)) return base;      // 用户直接填了完整路径
  return base+'/chat/completions';
}

function aiHeaders(c){
  const h={'Content-Type':'application/json'};
  const k=String(c.key||'').trim();
  if(k) h['Authorization']='Bearer '+k;
  return h;
}

function aiDivineEndpoint(c){
  let base=String(c.base||AI_DEF.base).trim().replace(/\/+$/,'');
  base=base.replace(/\/chat\/completions$/,'');
  return base+'/divine';
}

function aiFetch(url,opts,timeoutMs){
  const ctrl=new AbortController();
  const ms=timeoutMs||60000;
  const timer=setTimeout(()=>{ try{ctrl.abort();}catch(e){} },ms);
  return fetch(url,Object.assign({},opts,{signal:ctrl.signal}))
    .then(r=>{ clearTimeout(timer); return r; },
          err=>{ clearTimeout(timer);
            if(err&&err.name==='AbortError') throw new Error('请求超时（'+Math.round(ms/1000)+'秒无响应），请检查网络或 BaseURL');
            throw new Error('网络异常：'+(err&&err.message||'无法连接')+'（可能是 BaseURL 写错、被 CORS/代理拦截，或离线）');
          });
}

async function aiErrMsg(r){
  let detail='';
  try{ const t=await r.text(); if(t) detail=t.replace(/\s+/g,' ').slice(0,180); }catch(e){}
  const map={
    400:'请求被拒绝（400）：多为模型名不存在、参数不合法或 max_tokens 超限',
    401:'鉴权失败（401）：API Key 错误、过期或未填写',
    402:'余额不足（402）：账户额度已用尽',
    403:'无权限（403）：Key 无权访问该模型，或所在地区被限制',
    404:'地址不存在（404）：BaseURL 应形如 https://api.deepseek.com/v1，勿带 /chat/completions',
    413:'请求体过大（413）：命盘数据或 max_tokens 过大',
    429:'请求过频（429）：已触发限流，请等待几秒后重试',
    500:'服务端内部错误（500）',502:'网关错误（502）',503:'服务暂不可用（503）',504:'网关超时（504）'
  };
  const base=map[r.status]||('请求失败（HTTP '+r.status+'）');
  return detail ? base+' · '+detail : base;
}

function aiStreamChat(url,opts,handlers){
  handlers=handlers||{};
  const idleMs=handlers.idleMs||90000;
  const totalMs=handlers.totalMs||420000;
  const ctrl=new AbortController();
  let idleT=null,totalT=null,done=false;
  const stop=()=>{ done=true; clearTimeout(idleT); clearTimeout(totalT); try{ctrl.abort();}catch(e){} };
  const armIdle=()=>{
    clearTimeout(idleT);
    idleT=setTimeout(()=>{ if(!done){ stop(); handlers.onError&&handlers.onError(new Error('接口静默超过 '+Math.round(idleMs/1000)+' 秒，已中断（可重试）')); } },idleMs);
  };
  totalT=setTimeout(()=>{ if(!done){ stop(); handlers.onError&&handlers.onError(new Error('总时长超过 '+Math.round(totalMs/1000)+' 秒，已中断')); } },totalMs);
  (async()=>{
    try{
      armIdle();
      const r=await fetch(url,Object.assign({},opts,{signal:ctrl.signal}));
      if(!r.ok) throw new Error(await aiErrMsg(r));
      if(!r.body) throw new Error('当前浏览器不支持流式响应（请升级浏览器或改用非流式）');
      const reader=r.body.getReader();const dec=new TextDecoder();
      let acc='',buf='';
      while(true){
        const {done:fin,value}=await reader.read();
        if(fin) break;
        armIdle();
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split(/\r?\n/);buf=lines.pop();
        for(const line of lines){
          const t=line.trim();
          if(!t.startsWith('data:'))continue;
          const data=t.slice(5).trim();
          if(data==='[DONE]')continue;
          try{
            const j=JSON.parse(data);
            const d=j.choices&&j.choices[0]&&j.choices[0].delta&&j.choices[0].delta.content;
            if(d){ acc+=d; handlers.onDelta&&handlers.onDelta(d,acc); }
          }catch(e){}
        }
      }
      if(done)return;
      done=true;clearTimeout(idleT);clearTimeout(totalT);
      handlers.onDone&&handlers.onDone(acc);
    }catch(e){
      if(done)return;
      done=true;clearTimeout(idleT);clearTimeout(totalT);
      if(e&&e.name==='AbortError') e=new Error('已中断');
      handlers.onError&&handlers.onError(e);
    }
  })();
  return {abort:stop};
}
