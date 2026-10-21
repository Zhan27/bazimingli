const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function loadWorker(fetchImpl=async()=>new Response('{"choices":[]}',{headers:{'Content-Type':'application/json'}})){
  const source=fs.readFileSync(path.resolve(__dirname,'../worker/worker.js'),'utf8').replace("import PROMPT_TEMPLATE from './prompt-template.json';",'const PROMPT_TEMPLATE={schools:{}};').replace('export default {','globalThis.worker = {');
  const context=vm.createContext({Response,Request,URL,TextDecoder,Uint8Array,ReadableStream,AbortController,setTimeout,clearTimeout,fetch:fetchImpl});vm.runInContext(source,context);return context;
}
const env={API_KEY:'synthetic-upstream',ACCESS_CODES:'synthetic-access',ALLOWED_ORIGINS:'https://example.test',ALLOWED_MODELS:'deepseek-chat',DAILY_LIMIT:'80'};
const payload={model:'deepseek-chat',messages:[{role:'user',content:'synthetic chart'}],stream:false};
function req(body=payload,{path='/v1/chat/completions',method='POST',origin='https://example.test',auth=true,headers={}}={}){
  return new Request('https://proxy.test'+path,{method,headers:{...(origin?{Origin:origin}:{}),...(auth?{Authorization:'Bearer synthetic-access'}:{}),'Content-Type':'application/json',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
}
test('Worker rejects unlisted/null origins, unknown routes, wrong methods and invalid credentials before upstream',async()=>{
  let calls=0;const w=loadWorker(async()=>{calls++;throw Error('should not connect');}).worker;
  for(const origin of ['https://evil.test','null']){const r=await w.fetch(req(payload,{origin}),env);assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);}
  assert.equal((await w.fetch(req(payload),{...env,ALLOWED_ORIGINS:''})).status,403);
  const preflight=await w.fetch(req(null,{method:'OPTIONS'}),env);assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://example.test');assert.equal(preflight.headers.get('Vary'),'Origin');
  for(const [options,status] of [[{auth:false},401],[{path:'/unknown'},404],[{method:'GET'},405],[{path:'/v1/models',method:'POST'},405]])assert.equal((await w.fetch(req(payload,options),env)).status,status);
  assert.equal((await w.fetch(req(null,{method:'GET',path:'/health',origin:null,auth:false}),env)).status,200);assert.equal(calls,0);
});
test('Worker bounds both declared and chunked UTF-8 bodies and rejects malformed requests without forwarding',async()=>{
  let calls=0;const w=loadWorker(async()=>{calls++;return new Response('{}');}).worker;
  const cases=[['{',{},400],[payload,{headers:{'Content-Type':'text/plain'}},415],[{...payload,model:'unexpected'}, {},400],[{...payload,max_tokens:1.5},{},400],[{...payload,temperature:'1'},{},400],[{...payload,messages:[{role:'tool',content:'x'}]},{},400],[{...payload,messages:Array(41).fill(payload.messages[0])},{},400],[payload,{headers:{'Content-Length':'900000'}},413]];
  for(const [body,options,status] of cases)assert.equal((await w.fetch(req(body,options),env)).status,status);
  assert.equal((await w.fetch(req({...payload,messages:[{role:'user',content:'字'.repeat(100)}]}),{...env,MAX_BODY_BYTES:'128'})).status,413);
  const chunks=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(80)));c.enqueue(new TextEncoder().encode('字'.repeat(80)));c.close();}});
  const chunked=new Request('https://proxy.test/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer synthetic-access','Content-Type':'application/json'},body:chunks,duplex:'half'});
  assert.equal((await w.fetch(chunked,{...env,MAX_BODY_BYTES:'128'})).status,413);assert.equal(calls,0);
});
test('Worker sanitizes payloads, caps tokens, publishes only allowed models and keeps responses uncached',async()=>{
  let forwarded;const w=loadWorker(async(url,options)=>{forwarded={url,options};return new Response('{"choices":[]}',{headers:{'Content-Type':'application/json'}});}).worker;
  const models=await w.fetch(req(null,{method:'GET',path:'/v1/models'}),env);assert.deepEqual((await models.json()).data.map(x=>x.id),['deepseek-chat']);assert.equal(forwarded,undefined);
  const r=await w.fetch(req({...payload,max_tokens:99999,untrusted:'drop'}),env);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');await r.text();
  assert.equal(forwarded.url,'https://api.deepseek.com/v1/chat/completions');assert.equal(forwarded.options.redirect,'error');
  const clean=JSON.parse(forwarded.options.body);assert.equal(clean.max_tokens,8192);assert.equal(clean.untrusted,undefined);assert.equal(forwarded.options.headers.Authorization,'Bearer synthetic-upstream');
});
test('Worker quota follows access code across IP changes, expires daily, and memory stays bounded',async()=>{
  const c=loadWorker(),w=c.worker,limited={...env,DAILY_LIMIT:'1'};
  const r=await w.fetch(req(),limited);await r.text();const denied=await w.fetch(req(payload,{headers:{'CF-Connecting-IP':'different'}}),limited);assert.equal(denied.status,429);assert.ok(Number(denied.headers.get('Retry-After'))>0);
  c.limitCfg={daily:10000};assert.equal(vm.runInContext("rl.clear();rateLimit(limitCfg,0,'first',0)",c),true);assert.equal(vm.runInContext("rateLimit(limitCfg,0,'first',86400000)",c),true);
  vm.runInContext("rl.clear();for(let i=0;i<5000;i++)rateLimit(limitCfg,0,'ip'+i,0)",c);assert.ok(vm.runInContext('rl.size',c)<=4096);
});
test('Worker suppresses upstream secrets/errors, rejects insecure upstream config, and cancels on timeout',async()=>{
  const sentinel='SYNTHETIC_PRIVATE_RESPONSE';
  for(const fetcher of [async()=>new Response(sentinel,{status:401}),async()=>{throw Error(sentinel);}]){
    const w=loadWorker(fetcher).worker;const r=await w.fetch(req(),env);assert.equal(r.status,502);assert.equal((await r.text()).includes(sentinel),false);
  }
  assert.equal((await loadWorker().worker.fetch(req(),{...env,UPSTREAM_BASE:'http://unsafe.test'})).status,500);
  const w=loadWorker(async(url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error(sentinel)),{once:true}))).worker;
  const timeout=await w.fetch(req(),{...env,UPSTREAM_TIMEOUT_MS:'10'});assert.equal(timeout.status,504);assert.equal((await timeout.json()).error.type,'upstream_timeout');
});
test('Worker preserves SSE bytes, rejects incompatible content and caps streaming output',async()=>{
  const frames='data: {"choices":[{"delta":{"content":"学习"}}]}\n\ndata: [DONE]\n\n';
  const r=await loadWorker(async()=>new Response(frames,{headers:{'Content-Type':'text/event-stream'}})).worker.fetch(req({...payload,stream:true}),env);assert.equal(await r.text(),frames);
  const wrong=await loadWorker(async()=>new Response('<html>bad</html>',{headers:{'Content-Type':'text/html'}})).worker.fetch(req(),env);assert.equal(wrong.status,502);
  const large=await loadWorker(async()=>new Response('x'.repeat(4194305),{headers:{'Content-Type':'application/json'}})).worker.fetch(req(),env);await assert.rejects(()=>large.text(),/响应过长/);
});
