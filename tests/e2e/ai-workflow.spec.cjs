const {test,expect}=require('@playwright/test');
async function prepare(page){
  await page.goto('/');await expect(page.locator('#zh-result')).not.toBeEmpty();
  await page.evaluate(()=>{aiSaveConfig({...AI_DEF,base:'https://ai.mock.test/v1',key:'synthetic-test',model:'mock-model'});zhSecGo(4);});
  return page.evaluate(()=>({chart:aiEvidenceChart(),id:chartFactId(aiEvidenceChart()),version:AI_CONTRACT_VERSION}));
}
function response(info,ids=Array.from({length:18},(_,i)=>i+1)){
  return {schemaVersion:info.version,chartId:info.id,pillars:info.chart.pillars.map(p=>p.text),dimensions:ids.map(id=>({id,title:'维度'+id,conclusion:'传统学习参考',facts:['pillar.day'],rules:['rule.strength'],explanation:'依据日柱和当前规则，不确定性较高。',uncertainty:'high',alternatives:['其他路径需要核对']}))};
}
async function send(route,value){await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:typeof value==='string'?value:JSON.stringify(value)}}]})});}
test('JSON cards expose facts/rules/uncertainty and metadata without changing computed facts or executing HTML',async({page})=>{
  const info=await prepare(page),before=JSON.stringify(info.chart);let sent;
  const value=response(info);value.dimensions[0].conclusion='<img src=x onerror=alert(1)>传统解释';
  await page.route('https://ai.mock.test/**',async route=>{sent=route.request().postDataJSON();await send(route,value);});
  await page.locator('#ai-output-format').selectOption('schema');await page.locator('#ai-deep-btn').click();await expect(page.locator('#ai-workflow-status')).toContainText('18/18');
  expect(sent.response_format.type).toBe('json_schema');expect(JSON.parse(sent.messages[1].content).requestedDimensionIds).toHaveLength(18);
  await page.evaluate(()=>zhSecGo(3));const card=page.locator('#ai-dim-0 .ai-evidence-result');await expect(card).toContainText('盘面事实');await expect(card).toContainText('不确定性：高');await expect(card).toContainText('mock-model');await expect(card.locator('img')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify(aiEvidenceChart()))).toBe(before);
  const draft=await page.evaluate(()=>sessionStorage.getItem(AI_DRAFT_NS));expect(draft).not.toContain('synthetic-test');expect(draft).not.toContain('Authorization');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>zhSecGo(4));expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
test('invalid dimensions stay missing, retry requests only missing IDs, and bad regeneration preserves accepted content',async({page})=>{
  const info=await prepare(page);let calls=0;const idsSent=[];
  await page.route('https://ai.mock.test/**',async route=>{
    calls++;const ids=JSON.parse(route.request().postDataJSON().messages[1].content).requestedDimensionIds;idsSent.push(ids);
    const value=response(info,calls===1?[1,2]:ids);if(calls===1)value.dimensions[1].facts=['made-up'];if(calls===3)value.pillars[0]='错误';await send(route,value);
  });
  await page.locator('#ai-deep-btn').click();await expect(page.locator('#ai-workflow-status')).toContainText('1/18');await expect(page.locator('#ai-evidence-errors')).toContainText('FACT_ERROR');
  const accepted=await page.evaluate(()=>JSON.stringify(aiEvidenceSession.accepted[1]));
  await page.locator('#ai-retry-missing').click();await expect(page.locator('#ai-workflow-status')).toContainText('18/18');expect(idsSent[1]).toEqual(Array.from({length:17},(_,i)=>i+2));
  await page.evaluate(()=>zhSecGo(3));await page.locator('[data-ai-retry="1"]').click();await expect(page.locator('#ai-deep-btn')).toBeEnabled();
  expect(idsSent[2]).toEqual([1]);expect(await page.evaluate(()=>JSON.stringify(aiEvidenceSession.accepted[1]))).toBe(accepted);expect(calls).toBe(3);
});
test('cancel retains partial text and reload/restore never automatically sends another API request',async({page})=>{
  await prepare(page);
  await page.evaluate(()=>{window.mockCalls=0;window.fetch=async()=>{window.mockCalls++;return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:'{"schemaVersion":'}}]})+'\n\n'));},cancel(){window.mockCanceled=true;}}),{headers:{'Content-Type':'text/event-stream'}});};});
  await page.locator('#ai-deep-btn').click();await expect(page.locator('#ai-draft-text')).toContainText('schemaVersion');await page.locator('#ai-cancel').click();await expect(page.locator('#ai-workflow-status')).toContainText('已取消');expect(await page.evaluate(()=>window.mockCalls)).toBe(1);expect(await page.evaluate(()=>window.mockCanceled)).toBe(true);
  let calls=0;await page.route('https://ai.mock.test/**',async route=>{calls++;await send(route,'unused');});await page.reload();await expect(page.locator('#zh-result')).not.toBeEmpty();await page.evaluate(()=>zhSecGo(4));await page.locator('#ai-restore-draft').click();await expect(page.locator('#ai-draft-text')).toContainText('schemaVersion');expect(calls).toBe(0);
  await page.locator('#ai-clear-draft').click();expect(await page.evaluate(()=>sessionStorage.getItem(AI_DRAFT_NS))).toBeNull();
});
test('late old-chart responses cannot fill a new chart and storage denial leaves an actionable memory-only state',async({page})=>{
  const info=await prepare(page);await page.evaluate(()=>{window.fetch=()=>new Promise(resolve=>{window.resolveOld=resolve;});});await page.locator('#ai-deep-btn').click();
  await page.evaluate(()=>{document.getElementById('zh-solar').value='2024-03-12';zhCast();});await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date)).toBe('2024-03-12');
  await page.evaluate(content=>window.resolveOld(new Response(JSON.stringify({choices:[{message:{content}}]}),{headers:{'Content-Type':'application/json'}})),JSON.stringify(response(info)));
  expect(await page.evaluate(()=>Object.keys(aiEvidenceSession.accepted).length)).toBe(0);expect(await page.evaluate(()=>aiEvidenceActive)).toBeNull();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===AI_DRAFT_NS)throw new Error('quota');return original.call(this,key,value);};aiEvidenceApplyText('【1】兼容文本');zhSecGo(4);});await expect(page.locator('#ai-workflow-status')).toContainText('仅当前页面保留');
});
test('Markdown is explicitly unverified; schema errors do not trigger automatic paid fallback or score mutation',async({page})=>{
  await prepare(page);let calls=0;await page.route('https://ai.mock.test/**',async route=>{calls++;await route.fulfill({status:400,body:'synthetic-private-error'});});
  await page.locator('#ai-output-format').selectOption('schema');await page.locator('#ai-deep-btn').click();await expect(page.locator('#ai-workflow-status')).toContainText('请求失败');expect(calls).toBe(1);await expect(page.locator('#ai-workflow-status')).not.toContainText('synthetic-private-error');
  const before=await page.evaluate(()=>document.getElementById('dd-score-num')?.textContent);await page.evaluate(()=>{aiEvidenceApplyText('【17】命局定分99/100\n【18】传统参考');zhSecGo(3);});await expect(page.locator('#ai-dim-16 .ai-evidence-result')).toContainText('事实与引用未校验');expect(await page.evaluate(()=>document.getElementById('dd-score-num')?.textContent)).toBe(before);
});
test('a draft restores a different chart with its exact time and offset without calling the provider',async({page})=>{
  await prepare(page);await page.evaluate(()=>{document.getElementById('zh-solar').value='2012-07-21';document.getElementById('zh-time').value='23:47';restoreUtcOffset('zh-utc-offset',345);zhCast();});
  await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date)).toBe('2012-07-21');
  const original=await page.evaluate(()=>{aiEvidenceApplyText('【1】合成学习草稿');return chartFactId(aiEvidenceChart());});
  await page.reload();await expect(page.locator('#zh-result')).not.toBeEmpty();await page.evaluate(()=>zhSecGo(4));await page.locator('#ai-restore-draft').click();await expect.poll(()=>page.evaluate(()=>chartFactId(aiEvidenceChart()))).toBe(original);
  expect(await page.evaluate(()=>aiEvidenceSession.accepted[1].text)).toBe('合成学习草稿');expect(await page.locator('#zh-time').inputValue()).toBe('23:47');expect(await page.locator('#zh-utc-offset').inputValue()).toBe('345');
});
test('legacy server-template mode blocks unsupported JSON and partial generation before any paid request',async({page})=>{
  await prepare(page);let calls=0;await page.route('https://ai.mock.test/**',async route=>{calls++;await send(route,'unexpected');});
  await page.evaluate(()=>aiSaveConfig({...aiGetConfig(),divine:true}));await page.locator('#ai-deep-btn').click();await expect(page.locator('#ai-workflow-status')).toContainText('服务端Prompt模板当前使用Markdown');
  await page.locator('#ai-output-format').selectOption('markdown');await page.evaluate(()=>aiEvidenceStart([1]));await expect(page.locator('#ai-workflow-status')).toContainText('不支持逐维请求');expect(calls).toBe(0);
});
