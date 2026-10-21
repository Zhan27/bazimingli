/**
 * 玄机命理排盘 · 中转服务（Cloudflare Worker）
 * ------------------------------------------------------------
 * 作用：把大模型 API Key 放在服务端，浏览器永不接触 Key。
 *      前端 BaseURL 填本 Worker 的 /v1，Key 栏填「访问码」即可。
 *
 * 部署（免费额度足够个人使用）：
 *   1) npm i -g wrangler && wrangler login
 *   2) powershell -File worker\extract-prompt.ps1   # 先抽取 Prompt 模板（生成 secrets/ 之外的本地文件）
 *   3) cd worker && wrangler deploy
 *   4) 配密钥（不要写进代码 / 不要提交）：
 *        wrangler secret put API_KEY          # 真实上游 Key，如 sk-xxx
 *        wrangler secret put ACCESS_CODES     # 自己定，逗号分隔多个，如 code-a,code-b
 *   5) wrangler tail 看日志
 *
 * 前端设置：
 *   BaseURL = https://<你的子域>.workers.dev/v1
 *   API Key = <你设的访问码>
 *   模型名   = deepseek-chat（或 ALLOWED_MODELS 里的任意一个）
 *   勾选「🎭 使用服务端 Prompt」后，18 维研判准则不再从浏览器发出
 */

import PROMPT_TEMPLATE from './prompt-template.json';


const rl = new Map();
const MAX_RATE_BUCKETS = 4096;
function positive(value, fallback, max) {
  const n=Number(value);return Number.isSafeInteger(n)&&n>0?Math.min(n,max):fallback;
}
function config(env) {
  return {
    models:String(env.ALLOWED_MODELS||'deepseek-chat').split(',').map(s=>s.trim()).filter(Boolean),
    origins:String(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),
    bytes:positive(env.MAX_BODY_BYTES,131072,1048576),
    tokens:positive(env.MAX_TOKENS_CAP,8192,32768),
    daily:positive(env.DAILY_LIMIT,80,10000),
    timeout:positive(env.UPSTREAM_TIMEOUT_MS,120000,300000)
  };
}
function cors(request, cfg) {
  const origin=request.headers.get('Origin');
  if(origin&&!cfg.origins.includes(origin))return null;
  const headers={'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(origin)headers['Access-Control-Allow-Origin']=origin;
  return {...headers,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,X-Access-Code','Access-Control-Max-Age':'600'};
}
function json(body,status=200,headers={}) {
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...headers}});
}
function oaiError(message,status,type,headers) {
  return json({error:{message,type,code:status}},status,headers);
}
function authCode(env,request) {
  const codes=String(env.ACCESS_CODES||'').split(',').map(s=>s.trim()).filter(Boolean);
  const token=(request.headers.get('X-Access-Code')||(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')).trim();
  return token?codes.indexOf(token):-1;
}
// Best-effort isolate-local quotas: one code bucket shared across IPs plus one IP bucket.
// Cloudflare rate-limiting/Durable Objects are required for a global deployment limit.
function rateLimit(cfg,code,ip,now=Date.now()) {
  const expires=(Math.floor(now/86400000)+1)*86400000;
  for(const [key,bucket] of rl)if(bucket.expires<=now)rl.delete(key);
  const keys=['code:'+code,'ip:'+ip];
  const needed=keys.filter(k=>!rl.has(k)).length;
  if(rl.size+needed>MAX_RATE_BUCKETS)return false;
  if(keys.some(k=>(rl.get(k)?.count||0)>=cfg.daily))return false;
  for(const key of keys)rl.set(key,{count:(rl.get(key)?.count||0)+1,expires});
  return true;
}
async function readBody(request,cap) {
  const declared=request.headers.get('Content-Length');
  if(declared&&(Number(declared)>cap||!/^\d+$/.test(declared)))throw Object.assign(Error('请求体过大'),{status:413});
  if(!(request.headers.get('Content-Type')||'').toLowerCase().split(';')[0].trim().endsWith('/json'))throw Object.assign(Error('请求须使用 application/json'),{status:415});
  const reader=request.body?.getReader();if(!reader)throw Error('缺少请求体');
  const chunks=[];let size=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>cap){await reader.cancel();throw Object.assign(Error('请求体过大'),{status:413});}chunks.push(value);}
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('请求体不是合法 UTF-8 JSON');}
}
function sanitizeChat(body,cfg) {
  if(!body||typeof body!=='object'||Array.isArray(body)||!Array.isArray(body.messages)||!body.messages.length||body.messages.length>40)throw Error('messages 必须包含1至40条消息');
  const model=body.model||cfg.models[0];if(typeof model!=='string'||!cfg.models.includes(model))throw Error('模型不在白名单内');
  const messages=body.messages.map(m=>{
    if(!m||!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>120000)throw Error('消息角色或内容不合法');
    return {role:m.role,content:m.content};
  });
  if(body.stream!==undefined&&typeof body.stream!=='boolean')throw Error('stream 必须是布尔值');
  const out={model,messages,stream:!!body.stream,max_tokens:cfg.tokens};
  if(body.temperature!==undefined){if(typeof body.temperature!=='number'||!Number.isFinite(body.temperature)||body.temperature<0||body.temperature>2)throw Error('temperature 必须在0至2之间');out.temperature=body.temperature;}
  if(body.max_tokens!==undefined){if(!Number.isSafeInteger(body.max_tokens)||body.max_tokens<1)throw Error('max_tokens 必须是正整数');out.max_tokens=Math.min(body.max_tokens,cfg.tokens);}
  return out;
}
function upstreamBase(env) {
  const url=new URL(env.UPSTREAM_BASE||'https://api.deepseek.com/v1');
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('上游地址配置无效');
  return url.href.replace(/\/+$/,'');
}
async function forward(env,payload,request,cfg,headers) {
  let base;try{base=upstreamBase(env);}catch{return oaiError('上游地址配置无效',500,'config_error',headers);}
  const controller=new AbortController();let timedOut=false;
  const abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});
  const timeout=setTimeout(()=>{timedOut=true;controller.abort();},cfg.timeout);
  const cleanup=()=>{clearTimeout(timeout);request.signal.removeEventListener('abort',abort);};
  if(request.signal.aborted)controller.abort();
  try {
    const upstream=await fetch(base+'/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.API_KEY,'Accept':payload.stream?'text/event-stream':'application/json'},
      body:JSON.stringify(payload),signal:controller.signal,redirect:'error',cf:{cacheTtl:0}
    });
    if(!upstream.ok){await upstream.body?.cancel();cleanup();return oaiError('上游服务暂时不可用',upstream.status===429?429:502,'upstream_error',{...headers,...(upstream.status===429?{'Retry-After':'60'}:{})});}
    const type=upstream.headers.get('Content-Type')||'';
    if(!upstream.body||!(payload.stream?/^(text\/event-stream|application\/json)/i:/^application\/json/i).test(type)){await upstream.body?.cancel();cleanup();return oaiError('上游响应格式不兼容',502,'upstream_error',headers);}
    const reader=upstream.body.getReader();let bytes=0;
    // Bound even streaming responses; never echo raw upstream error bodies or exception messages.
    const stream=new ReadableStream({
      async pull(target){try{const {done,value}=await reader.read();if(done){cleanup();target.close();return;}bytes+=value.byteLength;if(bytes>4194304){cleanup();controller.abort();await reader.cancel();target.error(Error('上游响应过长'));return;}target.enqueue(value);}catch{cleanup();target.error(Error(timedOut?'上游响应超时':'上游响应中断'));}},
      async cancel(){cleanup();controller.abort();await reader.cancel();}
    });
    return new Response(stream,{headers:{...headers,'Content-Type':type,'X-Accel-Buffering':'no'}});
  }catch{
    cleanup();return oaiError(timedOut?'上游请求超时':'无法连接上游服务',timedOut?504:502,timedOut?'upstream_timeout':'proxy_exception',headers);
  }
}

/* Server-side prompt assembly; template extraction tests use this exact function. */
function buildDivine(body) {
  const root = PROMPT_TEMPLATE;
  if (!root || !root.schools || !Object.keys(root.schools).length) {
    throw new Error('服务端未载入 Prompt 模板（请先运行 worker/extract-prompt.ps1 后重新部署）');
  }
  const n = parseInt(body.school, 10);
  const idx = (isFinite(n) && n >= 0 && n <= 4) ? n : 0;
  const sch = root.schools[String(idx)];
  if (!sch || !sch.template) throw new Error('模板缺少该流派：' + body.school);

  const knowledge = String(body.knowledge || '');
  if (knowledge.length < 50) throw new Error('knowledge 过短，拒绝生成（前端可能未完成排盘）');

  const withZiwei = !!body.withZiwei;
  let system = sch.template.split('{{KNOWLEDGE}}').join(knowledge.slice(0, 60000));
  system = system.split('{{ZW_BLOCK}}').join(withZiwei ? String(root.zwBlock || '') : '');

  const basic = String(body.basic || '').slice(0, 4000);
  const chart = typeof body.chart === 'string' ? body.chart : JSON.stringify(body.chart || {});
  let user = '【基础信息（确认本盘身份，勿与它盘混淆）】\n' + basic +
             '\n\n【命盘数据】\n' + chart.slice(0, 60000);
  if (withZiwei) {
    const zwRef = String(body.zwRef || '');
    const zwGuide = String(body.zwGuide || '');
    if (zwRef) user += '\n\n' + zwRef.slice(0, 8000) + '\n\n' + zwGuide.slice(0, 8000);
  }

  body.messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
  body.stream = true;
  return body;
}


export default {
  async fetch(request,env) {
    const cfg=config(env),headers=cors(request,cfg);
    if(!headers)return oaiError('来源未获允许',403,'origin_denied');
    const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
    const isChat=['/v1/chat/completions','/chat/completions'].includes(path),isDivine=path==='/v1/divine',isModels=path==='/v1/models';
    if(!isChat&&!isDivine&&!isModels&&path!=='/health')return oaiError('未知路径',404,'not_found',headers);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const method=(isChat||isDivine)?'POST':'GET';
    if(request.method!==method)return oaiError('该路径仅支持 '+method,405,'method_not_allowed',{...headers,Allow:method+', OPTIONS'});
    if(path==='/health')return json({ok:true,service:'xuanji-mingli-proxy'},200,headers);
    const code=authCode(env,request);if(code<0)return oaiError('访问码无效或未配置',401,'auth_error',headers);
    if(!env.API_KEY)return oaiError('服务端未配置 API_KEY',500,'config_error',headers);
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    if(!rateLimit(cfg,code,ip))return oaiError('已达服务请求额度',429,'rate_limited',{...headers,'Retry-After':String(Math.ceil(((Math.floor(Date.now()/86400000)+1)*86400000-Date.now())/1000))});
    // Return only configured models; never expose a provider-wide model list.
    if(isModels)return json({object:'list',data:cfg.models.map(id=>({id,object:'model'}))},200,headers);
    let body;
    try{body=await readBody(request,cfg.bytes);}catch(e){return oaiError(e.status===413?'请求体过大':e.status===415?'请求须使用 application/json':'请求体不是合法 UTF-8 JSON',e.status||400,'invalid_request',headers);}
    if(isDivine){try{body=buildDivine(body);}catch{return oaiError('命盘或服务端模板不完整',400,'template_error',headers);}}
    let payload;try{payload=sanitizeChat(body,cfg);}catch(e){return oaiError(e.message,400,'invalid_request',headers);}
    return forward(env,payload,request,cfg,headers);
  }
};
