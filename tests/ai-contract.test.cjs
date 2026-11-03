const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {loadEngine,root}=require('./helpers.cjs'),e=loadEngine();
e.run(`var contractChart=calculateChart({date:'2024-02-10',time:'12:00'});var validAi={schemaVersion:AI_CONTRACT_VERSION,chartId:chartFactId(contractChart),pillars:contractChart.pillars.map(p=>p.text),dimensions:AI_DIM_CONTRACTS.map(d=>({id:d.id,title:d.title,conclusion:'传统解释参考，需结合实际情况',facts:['pillar.day'],rules:['rule.strength'],explanation:'依据日柱与当前流派的公开规则，存在多种解释。',uncertainty:'high',alternatives:['扶抑与调候两条路径均需核对']}))};`);
test('structured output validates 18 dimensions and preserves all computed facts',()=>{
  const before=e.run('JSON.stringify(contractChart)');assert.equal(e.run('validateAiResult(validAi,contractChart).ok'),true);assert.equal(e.run('aiOutputSchema().additionalProperties'),false);assert.equal(e.run('JSON.stringify(contractChart)'),before);
});
test('fact errors, rules, missing evidence and unclear expression are distinguished',()=>{
  for(const [mutation,type] of [[`x.pillars[2]='乙丑'`,'FACT_ERROR'],[`x.dimensions[0].rules=['made-up-book']`,'RULE_INCONSISTENCY'],[`x.dimensions[0].facts=[]`,'REASONING_GAP'],[`x.dimensions[0].explanation=''`,'EXPRESSION_ERROR']]){
    const result=e.json(`(()=>{const x=JSON.parse(JSON.stringify(validAi));${mutation};return validateAiResult(x,contractChart)})()`);assert.ok(result.errors.some(x=>x.type===type));
  }
  assert.equal(e.run(`parseStructuredAi('{"schemaVersion":',contractChart,{partial:true}).pending`),true);
  assert.equal(e.run(`parseStructuredAi('{',contractChart).ok`),false);
});
test('versioned knowledge has explicit verification status and independent school prompts',()=>{
  assert.equal(e.run(`searchKnowledge('比肩')[0].status`),'text-verified');assert.match(e.run(`searchKnowledge('比肩')[0].source`),/^https:/);
  const versions=e.json(`RULE_PROFILES.map(p=>buildEvidencePrompt(contractChart,p.id).version)`);assert.equal(new Set(versions).size,5);
  assert.equal(e.run(`evaluateAiResponse(JSON.stringify(validAi),contractChart).pass`),true);
});
test('SSE parser handles Unicode chunks, final frame without newline, malformed/error frames and length limits',()=>{
  assert.equal(e.run(`(()=>{const p=createAiSseParser(()=>{});const s='data: '+JSON.stringify({choices:[{delta:{content:'甲辰'}}]});for(const c of s)p.feed(c);return p.finish()})()`),'甲辰');
  for(const frame of ['data: {bad}','data: {"error":{"message":"private"}}']){e.context.frame=frame;assert.throws(()=>e.run(`createAiSseParser(()=>{}).feed(frame+'\n')`));}
  assert.throws(()=>e.run(`createAiSseParser(()=>{},{maxCharacters:1}).feed('data: {"choices":[{"delta":{"content":"长文本"}}]}\n')`));
});
test('shared request layer streams a mocked provider and supports explicit cancellation without retry',async()=>{
  let calls=0;const context=vm.createContext({AbortController,TextDecoder,setTimeout,clearTimeout,fetch:async()=>{calls++;return new Response('data: {"choices":[{"delta":{"content":"完成"}}]}\n\ndata: [DONE]',{headers:{'content-type':'text/event-stream'}});}});
  vm.runInContext(fs.readFileSync(path.join(root,'src/ai/request.js'),'utf8'),context);
  const text=await new Promise((resolve,reject)=>{context.finish=resolve;context.fail=reject;vm.runInContext(`aiStreamChat('https://mock.invalid',{}, {onDone:finish,onError:fail})`,context);});assert.equal(text,'完成');assert.equal(calls,1);
  context.fetch=()=>new Promise(()=>{});const error=await new Promise(resolve=>{context.fail=resolve;vm.runInContext(`aiStreamChat('https://mock.invalid',{}, {onError:fail}).abort()`,context);});assert.equal(error.code,'CANCELED');
});

test('SSE completion releases a provider connection that stays open after DONE',async()=>{
  let canceled=0;
  const payload='data: {"choices":[{"delta":{"content":"已完成"}}]}\n\ndata: [DONE]\n\n';
  const body=new ReadableStream({
    start(controller){controller.enqueue(new TextEncoder().encode(payload));},
    cancel(){canceled++;}
  });
  const context=vm.createContext({
    AbortController,TextDecoder,setTimeout,clearTimeout,
    fetch:async()=>new Response(body,{headers:{'content-type':'text/event-stream'}})
  });
  vm.runInContext(fs.readFileSync(path.join(root,'src/ai/request.js'),'utf8'),context);
  const text=await new Promise((resolve,reject)=>{
    context.finish=resolve;
    context.fail=reject;
    vm.runInContext("aiStreamChat('https://mock.invalid',{}, {onDone:finish,onError:fail,idleMs:500})",context);
  });
  assert.equal(text,'已完成');
  assert.equal(canceled,1);
  assert.equal(vm.runInContext('AI_REQUESTS.size',context),0);
});

test('JSON responses recognize case-insensitive media types and report invalid payloads',async()=>{
  const context=vm.createContext({AbortController,TextDecoder,setTimeout,clearTimeout});
  vm.runInContext(fs.readFileSync(path.join(root,'src/ai/request.js'),'utf8'),context);
  const request=body=>new Promise((resolve,reject)=>{
    context.fetch=async()=>new Response(body,{headers:{'content-type':'Application/JSON; charset=utf-8'}});
    context.finish=resolve;
    context.fail=reject;
    vm.runInContext("aiStreamChat('https://mock.invalid',{}, {onDone:finish,onError:fail})",context);
  });
  assert.equal(await request('{"choices":[{"message":{"content":"完成"}}]}'),'完成');
  for(const body of ['null','{broken','[]']){
    await assert.rejects(request(body),{code:'INVALID_RESPONSE'});
  }
});

test('SSE frames with non-object JSON return a stream format error',()=>{
  for(const frame of ['data: null','data: []','data: 1']){
    e.context.frame=frame;
    assert.throws(()=>e.run('createAiSseParser(()=>{}).feed(frame+"\\n")'),{code:'INVALID_STREAM'});
  }
});
