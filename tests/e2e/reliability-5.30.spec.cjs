const {test,expect}=require('@playwright/test');
async function prepare(page){
  await page.goto('/');await expect(page.locator('#zh-result')).not.toBeEmpty();
  await page.evaluate(()=>{document.getElementById('zh-solar').value='2024-02-10';document.getElementById('zh-time').value='12:00';zhCast();});await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date+' '+aiEvidenceChart().input.time)).toBe('2024-02-10 12:00');
  await page.evaluate(()=>{aiSaveConfig({...AI_DEF,base:'https://follow.mock.test/v1',key:'synthetic-key',model:'mock'});aiEvidenceApplyText('【1】原始学习报告');zhSecGo(4);});
}
async function reloadDraft(page){
  await page.reload();await expect(page.locator('#zh-result')).not.toBeEmpty();await page.evaluate(()=>zhSecGo(4));await page.locator('#ai-restore-draft').click();await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date)).toBe('2024-02-10');await page.evaluate(()=>zhSecGo(4));
}
async function reply(route,text){await route.fulfill({contentType:'application/json',body:JSON.stringify({choices:[{message:{content:text}}]})});}
for(const width of [1440,1024,390,320])test(`fixed annual relations, marriage preference and dialogue at ${width}px`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await prepare(page);
  const requests=[];await page.route('https://follow.mock.test/**',async route=>{requests.push(route.request().postDataJSON());await reply(route,requests.length===1?'第一答：分月令与根气。':'第二答：承接刚才根气。');});
  await page.locator('#ai-follow-input').fill('第一问');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-follow-box')).toContainText('第一答');
  await page.locator('#ai-follow-input').fill('展开刚才第二点');await page.locator('#ai-follow-btn').click();await expect(page.locator('.ai-follow-turn')).toHaveCount(2);
  expect(requests[1].messages.map(x=>x.content)).toEqual(expect.arrayContaining(['第一问','第一答：分月令与根气。','展开刚才第二点']));
  await page.locator('#ai-follow-box').screenshot({path:`verification/screenshots/followup-${width}.png`,animations:'disabled'});
  await reloadDraft(page);await expect(page.locator('#ai-follow-box')).toContainText('第二答');expect(requests).toHaveLength(2);
  await page.locator('#ai-follow-clear').click();await expect(page.locator('#ai-follow-box')).toBeHidden();expect(await page.evaluate(()=>aiEvidenceSession.accepted[1].text)).toBe('原始学习报告');
  await page.evaluate(()=>{document.getElementById('zh-solar').value='1999-04-01';document.getElementById('zh-time').value='12:00';zhCast();});await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date)).toBe('1999-04-01');
  const rels=await page.evaluate(()=>zhLiuNianTimeline(lastZh).find(x=>x.y===2023).rels);expect(rels.some(r=>r.pillar==='年'&&['自刑','三刑'].includes(r.type))).toBe(false);
  await page.locator('.tab[data-tab="hehun"]').click();await page.locator('#hh1-date').fill('1990-05-15');await page.locator('#hh2-date').fill('1992-02-15');await page.locator('#hh1-time').fill('12:00');await page.locator('#hh2-time').fill('12:00');await page.locator('#hh-reference-year').fill('2026');await page.evaluate(()=>{document.getElementById('hh1-school').value='4';document.getElementById('hh2-school').value='4';hhCast();});
  await expect(page.locator('#hh-result')).toContainText('扶抑互补');await expect(page.locator('#hh-result')).toContainText('寒暖分看');await page.locator('.hh-evidence summary').filter({hasText:'扶抑互补'}).click();
  await page.locator('#hh-result').screenshot({path:`verification/screenshots/marriage-preference-${width}.png`,animations:'disabled'});
  await page.evaluate(()=>setTheme('xuanmo'));await page.locator('#hh-result').screenshot({path:`verification/screenshots/marriage-preference-dark-${width}.png`,animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);expect(errors).toEqual([]);
});
test('followup cancellation, HTTP errors and hostile text preserve the original report without extra requests',async({page})=>{
  await prepare(page);let count=0;await page.route('https://follow.mock.test/**',async route=>{count++;await new Promise(r=>setTimeout(r,900));try{await reply(route,'late');}catch{}});
  await page.locator('#ai-follow-input').fill('停止用例');await page.locator('#ai-follow-btn').click();await expect.poll(()=>count).toBe(1);await page.locator('#ai-cancel').click();await expect(page.locator('#ai-follow-box')).toContainText('已停止');await expect(page.locator('#ai-follow-btn')).toBeEnabled();
  await reloadDraft(page);await expect(page.locator('#ai-follow-box')).toContainText('停止用例');expect(count).toBe(1);
  await page.unroute('https://follow.mock.test/**');await page.route('https://follow.mock.test/**',async route=>{count++;await route.fulfill({status:500,body:'private-upstream'});});
  await page.locator('#ai-follow-input').fill('错误用例');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-follow-box')).toContainText('请求中断');expect(count).toBe(2);await expect(page.locator('#ai-workflow-status')).not.toContainText('private-upstream');
  await page.unroute('https://follow.mock.test/**');await page.route('https://follow.mock.test/**',async route=>{count++;await reply(route,'<img src=x onerror="window.followInjected=1">');});
  await page.locator('#ai-follow-input').fill('<svg onload="window.followInjected=2">');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-follow-box')).toContainText('<img');expect(await page.locator('#ai-follow-box img,#ai-follow-box svg').count()).toBe(0);expect(await page.evaluate(()=>window.followInjected)).toBeUndefined();
  expect(await page.evaluate(()=>aiEvidenceSession.accepted[1].text)).toBe('原始学习报告');
});
test('late same-chart replies cannot repopulate cleared followup history or unlock a newer run',async({page})=>{
  await prepare(page);await page.evaluate(()=>{window.followHandlers=[];aiStreamChat=(url,options,handlers)=>{window.followHandlers.push(handlers);return {abort(){}};};});
  await page.locator('#ai-follow-input').fill('旧请求');await page.locator('#ai-follow-btn').click();await page.locator('#ai-follow-clear').click();await page.locator('#ai-follow-input').fill('新请求');await page.locator('#ai-follow-btn').click();
  await page.evaluate(()=>{followHandlers[0].onDelta('旧内容','旧内容');followHandlers[0].onDone('旧内容');followHandlers[0].onError(new Error('旧错误'));});
  await expect(page.locator('#ai-follow-btn')).toBeDisabled();await expect(page.locator('#ai-follow-box')).not.toContainText('旧内容');
  await page.evaluate(()=>followHandlers[1].onDone('当前内容'));await expect(page.locator('#ai-follow-box')).toContainText('当前内容');await expect(page.locator('#ai-follow-btn')).toBeEnabled();
});
test('a real partial stream remains recoverable after cancel and never resumes automatically',async({page})=>{
  await prepare(page);await page.evaluate(()=>{
    const original=window.fetch;window.partialRequests=0;
    window.fetch=(url,options)=>{if(!String(url).startsWith('https://follow.mock.test/'))return original(url,options);window.partialRequests++;
      return Promise.resolve(new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:'已经收到的部分回复'}}]})+'\n\n'));}}),{headers:{'Content-Type':'text/event-stream'}}));};
  });
  await page.locator('#ai-follow-input').fill('部分回复用例');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-follow-box')).toContainText('已经收到的部分回复');await page.locator('#ai-cancel').click();await expect(page.locator('#ai-follow-box')).toContainText('已停止');
  await reloadDraft(page);await expect(page.locator('#ai-follow-box')).toContainText('已经收到的部分回复');await expect(page.locator('#ai-follow-btn')).toBeEnabled();expect(await page.evaluate(()=>aiEvidenceSession.followup.draft.status)).toBe('canceled');
});
test('empty replies fail visibly and switching charts rejects the previous followup callbacks',async({page})=>{
  await prepare(page);await page.route('https://follow.mock.test/**',route=>reply(route,''));await page.locator('#ai-follow-input').fill('空回复用例');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-workflow-status')).toContainText('未返回正文');expect(await page.evaluate(()=>aiEvidenceSession.followup.turns.length)).toBe(0);
  await page.evaluate(()=>{window.oldFollow=null;aiStreamChat=(u,o,h)=>{window.oldFollow=h;return {abort(){}};};});await page.locator('#ai-follow-input').fill('旧命盘追问');await page.locator('#ai-follow-btn').click();
  await page.evaluate(()=>{document.getElementById('zh-solar').value='1990-05-17';zhCast();});await expect.poll(()=>page.evaluate(()=>aiEvidenceChart().input.date)).toBe('1990-05-17');await page.evaluate(()=>{oldFollow.onDelta('旧盘内容','旧盘内容');oldFollow.onDone('旧盘内容');});
  expect(await page.evaluate(()=>aiEvidenceSession.followup.turns.length)).toBe(0);expect(await page.evaluate(()=>aiFollowActive)).toBeNull();await expect(page.locator('#ai-follow-box')).not.toContainText('旧盘内容');
});
test('reloading an active stream cancels and saves the latest partial text despite save throttling',async({page})=>{
  await prepare(page);await page.evaluate(()=>{
    const original=window.fetch;window.fetch=(url,options)=>{if(!String(url).startsWith('https://follow.mock.test/'))return original(url,options);
      sessionStorage.setItem('synthetic_follow_calls',String(Number(sessionStorage.getItem('synthetic_follow_calls')||0)+1));
      return Promise.resolve(new Response(new ReadableStream({start(controller){aiDraftSavedAt=Date.now()+60000;controller.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:'刷新前最后一段'}}]})+'\n\n'));}}),{headers:{'Content-Type':'text/event-stream'}}));};
  });
  await page.locator('#ai-follow-input').fill('刷新中断用例');await page.locator('#ai-follow-btn').click();await expect(page.locator('#ai-follow-box')).toContainText('刷新前最后一段');await reloadDraft(page);
  await expect(page.locator('#ai-follow-box')).toContainText('刷新前最后一段');await expect(page.locator('#ai-follow-box')).toContainText('已停止');expect(await page.evaluate(()=>sessionStorage.getItem('synthetic_follow_calls'))).toBe('1');
});
