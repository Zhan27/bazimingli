/** Shared transport. Paid retries are explicit; no automatic duplicate requests. */
const AI_REQUESTS=new Set();
function aiEndpoint(c){const base=String(c.base||'https://api.deepseek.com/v1').trim().replace(/\/+$/,'');return /\/chat\/completions$/.test(base)?base:base+'/chat/completions';}
function aiDivineEndpoint(c){return aiEndpoint(c).replace(/\/chat\/completions$/,'/divine');}
function aiHeaders(c){const h={'Content-Type':'application/json'};if(c.key)h.Authorization='Bearer '+String(c.key).trim();return h;}
function aiTransportError(code,message){const e=new Error(message);e.code=code;return e;}
async function aiErrMsg(r){return ({400:'请求参数或模型不兼容',401:'鉴权失败，请检查Key',402:'额度不足',403:'服务拒绝访问',404:'接口地址不存在',413:'请求过大',429:'调用频率已达上限',500:'上游内部错误',502:'上游网关错误',503:'上游暂不可用',504:'上游响应超时'})[r.status]||('请求失败 HTTP '+r.status);}
async function aiFetch(url,opts={},timeoutMs=60000){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeoutMs),external=()=>ctrl.abort();opts.signal?.addEventListener('abort',external,{once:true});
  try{return await fetch(url,{...opts,signal:ctrl.signal});}
  catch(e){throw aiTransportError(e.name==='AbortError'?'TIMEOUT':'NETWORK',e.name==='AbortError'?'请求已取消或超时':'网络连接失败，请检查服务地址后重试');}
  finally{clearTimeout(timer);opts.signal?.removeEventListener('abort',external);}
}
function createAiSseParser(onText,{maxCharacters=1000000}={}){
  let buffer='',acc='',ended=false;
  const dataLine=raw=>{
    if(!raw||raw.startsWith(':')||!raw.startsWith('data:'))return;
    const data=raw.slice(5).trim();if(data==='[DONE]'){ended=true;return;}if(ended||!data)return;
    let value;try{value=JSON.parse(data);}catch(e){throw aiTransportError('INVALID_STREAM','流式响应含无效JSON帧，已保留草稿');}
    if(value.error)throw aiTransportError('UPSTREAM_ERROR','上游返回流式错误，已保留草稿');
    const text=value.choices?.[0]?.delta?.content??value.choices?.[0]?.message?.content??'';
    if(typeof text!=='string')throw aiTransportError('INVALID_STREAM','流式内容类型不兼容');
    acc+=text;if(acc.length>maxCharacters)throw aiTransportError('RESPONSE_TOO_LARGE','回复超过长度上限');if(text)onText(text,acc);
  };
  return {feed(chunk){buffer+=chunk;if(buffer.length>maxCharacters*2)throw aiTransportError('RESPONSE_TOO_LARGE','流式帧超过上限');const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const line of lines)dataLine(line);},finish(){if(buffer.trim())dataLine(buffer);buffer='';return acc;},get text(){return acc;},get ended(){return ended;}};
}
function aiStreamChat(url,opts,handlers={}){
  const ctrl=new AbortController();let done=false,idle,total,reader;
  const clear=()=>{clearTimeout(idle);clearTimeout(total);AI_REQUESTS.delete(handle);};
  const fail=e=>{if(done)return;done=true;clear();ctrl.abort();if(reader)reader.cancel().catch(()=>{});handlers.onError?.(e);};
  const handle={abort(){fail(aiTransportError('CANCELED','已取消；已收到的结果保留为草稿'));}};AI_REQUESTS.add(handle);
  const arm=()=>{clearTimeout(idle);idle=setTimeout(()=>fail(aiTransportError('IDLE_TIMEOUT','连接静默超时，可从缺失维度重新生成')),handlers.idleMs??90000);};
  total=setTimeout(()=>fail(aiTransportError('TOTAL_TIMEOUT','请求超过总时限')),handlers.totalMs??420000);
  (async()=>{
    try{
      arm();const r=await fetch(url,{...opts,signal:ctrl.signal});if(!r.ok)throw aiTransportError('HTTP_'+r.status,await aiErrMsg(r));
      if(!r.body)throw aiTransportError('NO_STREAM','浏览器不支持响应流');reader=r.body.getReader();
      const decoder=new TextDecoder(),parser=createAiSseParser((d,all)=>{if(!done)handlers.onDelta?.(d,all);},{maxCharacters:handlers.maxCharacters});
      const isJson=(r.headers.get('content-type')||'').includes('application/json');let jsonText='';
      while(!done){const {done:finished,value}=await reader.read();if(finished)break;arm();const chunk=decoder.decode(value,{stream:true});if(isJson){jsonText+=chunk;if(jsonText.length>1000000)throw aiTransportError('RESPONSE_TOO_LARGE','回复超过长度上限');}else parser.feed(chunk);}
      if(done)return;let all;
      if(isJson){jsonText+=decoder.decode();const j=JSON.parse(jsonText);if(j.error)throw aiTransportError('UPSTREAM_ERROR','上游返回错误');all=j.choices?.[0]?.message?.content;if(typeof all!=='string')throw aiTransportError('INVALID_RESPONSE','响应缺少文本');handlers.onDelta?.(all,all);}
      else {parser.feed(decoder.decode());all=parser.finish();}
      done=true;clear();handlers.onDone?.(all);
    }catch(e){fail(e.name==='AbortError'?aiTransportError('CANCELED','连接已中断；草稿已保留'):e);}
  })();return handle;
}
function cancelAiRequests(){for(const request of [...AI_REQUESTS])request.abort();}
