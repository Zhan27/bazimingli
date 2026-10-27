const {test,expect}=require('@playwright/test');
for(const width of [1440,1024,390,320])test(`neutral route, weighted evidence and positional readings at ${width}px`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});
  await page.goto('/');await expect(page.locator('#zh-result')).not.toBeEmpty();
  await page.evaluate(()=>{document.getElementById('zh-solar').value='2024-02-10';document.getElementById('zh-time').value='12:00';zhCast();});
  await expect.poll(()=>page.evaluate(()=>lastZh.useGod.neutral?.path)).toBe('食伤泄秀');
  const prose=await page.evaluate(()=>{const z={...lastZh,dy:{...lastZh.dy,dyList:lastZh.dy.dyList.map((d,i)=>i?d:{...d,g:0,z:2})}};return {annual:zhLiuNianDetail(z),dayun:aDayun(z,'')};});
  expect(prose.annual).toMatch(/首运甲寅（比肩运）干支取向平/);expect(prose.dayun).toMatch(/甲寅<\/b>（比肩运[^<]+干支取向平/);
  await page.evaluate(()=>{zhSecGo(1);document.querySelector('.compact-original').open=true;});
  const camp=page.locator('#zh-result .use-preferences');await expect(camp).toContainText('提纲取用');await expect(camp).toContainText('火·食伤');
  await camp.locator('.neutral-evidence>summary').click();await expect(camp.locator('[data-mingge-node="gan-1"]')).toContainText('月干丙');
  await camp.screenshot({animations:'disabled',path:`verification/screenshots/refinement-use-${width}.png`});
  await page.evaluate(()=>zhSecGo(3));const score=page.locator('#ai-dim-16 .structure-score');await expect(score).toHaveAttribute('data-score-version','2.0.0');
  await score.locator('.score-basis>summary').click();await expect(score).toContainText('日干不自加分');await expect(score).toContainText('每支取最深一根');
  const evidence=score.locator('[data-mingge-node]').first(),node=await evidence.getAttribute('data-mingge-node');await evidence.click();
  await expect(page.locator(`.gz-explorer [data-gz-node="${node}"]`)).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');await expect(evidence).toBeFocused();
  for(const domain of ['wealth','career','relationship']){
    const reading=page.locator(`[data-reading-domain="${domain}"]`);await expect(reading).toBeVisible();await reading.locator('.domain-evidence>summary').click();
    expect(await reading.locator('[data-mingge-node]').count()).toBeGreaterThan(0);
    const first=reading.locator('[data-mingge-node]').first(),id=await first.getAttribute('data-mingge-node');await first.click();await expect(page.locator(`.gz-explorer [data-gz-node="${id}"]`)).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');await expect(first).toBeFocused();
    await reading.locator('.reading-citations>summary').click();expect(await reading.locator('a').count()).toBeGreaterThan(2);
    await reading.screenshot({animations:'disabled',path:`verification/screenshots/refinement-${domain}-${width}.png`});
  }
  const extras=page.locator('[data-reading-domain="wealth"] .domain-extras');await extras.locator('summary').click();await expect(extras).toContainText('四库支');
  const period=extras.locator('[data-mingge-period]').first();await period.click();await expect(page.locator('.study-workspace-card')).toBeVisible();await page.keyboard.press('Escape');await expect(period).toBeFocused();
  await expect(page.locator('#ai-dim-9')).toContainText('前往合婚配对');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  for(const theme of ['xuanmo','yubai']){await page.evaluate(theme=>setTheme(theme),theme);await score.screenshot({animations:'disabled',path:`verification/screenshots/refinement-score-${theme}-${width}.png`});}
  expect(errors).toEqual([]);
});
test('old-rule draft opens all original report and followup text without a provider request',async({page})=>{
  const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto('/');await expect(page.locator('#zh-result')).not.toBeEmpty();
  await page.evaluate(()=>{const old=createAiSession(aiEvidenceChart(),lastSchool);old.ruleVersion='5.20.0';old.accepted={1:{format:'markdown',text:'旧规则报告原文'}};old.attempt={text:'最后原文'};old.followup={version:1,turns:[{question:'旧追问',answer:'<img src=x onerror=alert(1)>旧回复',status:'complete'}],draft:{question:'中断问题',answer:'部分答案',status:'canceled'}};sessionStorage.setItem(AI_DRAFT_NS,JSON.stringify(old));zhSecGo(4);});
  await page.locator('#ai-restore-draft').click();await expect(page.locator('#ai-workflow-status')).toContainText('旧规则版本');
  const text=page.locator('#ai-draft-text');await expect(text).toBeVisible();for(const s of ['旧规则报告原文','旧追问','旧回复','中断问题','部分答案'])await expect(text).toContainText(s);
  await expect(text.locator('img')).toHaveCount(0);expect(await page.evaluate(()=>aiEvidenceSession?.ruleVersion)).not.toBe('5.20.0');
  expect(posts).toEqual([]);
});
