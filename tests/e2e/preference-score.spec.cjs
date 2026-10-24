const {test,expect}=require('@playwright/test');
for(const width of [1440,1024,390,320])test(`strength, score, arrows and natural text at ${width}px`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('#zh-result .use-preferences')).toHaveCount(1);
  await page.evaluate(()=>{zhSecGo(1);document.querySelector('.compact-original').open=true;});
  const camp=page.locator('#zh-result .use-preferences');await expect(camp).toContainText('先辨旺衰');await expect(camp).toContainText('扶抑喜向');await expect(camp).not.toContainText('生用');
  const flow=page.locator('#zh-result .wx-flow');await expect(flow.locator('line[marker-end]')).toHaveCount(10);
  expect(await flow.evaluate(svg=>[...svg.querySelectorAll('line')].every(line=>svg.querySelector(line.getAttribute('marker-end').slice(4,-1))))).toBe(true);
  await flow.screenshot({path:`verification/screenshots/preference-flow-${width}.png`});await camp.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollBy(0,150));await camp.screenshot({path:`verification/screenshots/preference-camp-${width}.png`});
  await page.evaluate(()=>zhSecGo(2));const interval=await page.locator('#zh-sec-2').textContent();expect(interval).toMatch(/出生距换月节气\s*\d+\.\d{2} 天/);expect(interval).not.toMatch(/出生距换月节气\s*\d+\.\d{3}/);
  await page.evaluate(()=>zhSecGo(3));const score=page.locator('#ai-dim-16 .structure-score');await expect(score).toBeVisible();await score.locator('.score-basis>summary').click();await expect(score.locator('.score-basis')).toContainText('分项合计');
  expect(await score.locator('progress').evaluateAll(nodes=>nodes.reduce((sum,n)=>sum+n.value,0))).toBe(Number(await score.locator('#dd-score-num').textContent()));
  await score.screenshot({path:`verification/screenshots/preference-score-${width}.png`});
  // Synthetic prose exercises mixed scripts, explicit newlines and long unbroken API text without a paid request.
  const body=page.locator('#ai-dim-0 .ai-dim-body');await body.evaluate(el=>{el.style.whiteSpace='pre-line';el.textContent='先观月令\n印比生扶。\nAPI '+('referenceIdentifier'.repeat(12))+'\n甲木 · 食伤 · 财官';});
  const typography=await body.evaluate(el=>({align:getComputedStyle(el).textAlign,spacing:getComputedStyle(el).letterSpacing,overflow:el.scrollWidth-el.clientWidth}));expect(typography.align).toBe('start');expect(typography.spacing).toBe('normal');expect(typography.overflow).toBeLessThanOrEqual(1);
  await body.screenshot({path:`verification/screenshots/preference-type-${width}.png`});
  await page.evaluate(()=>setTheme('xuanmo'));await score.screenshot({path:`verification/screenshots/preference-score-dark-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
  expect(await page.locator('body').textContent()).not.toMatch(/这些数字为计数，不代表|展开旧规则演示|主帅·|总免责声明/);
});
