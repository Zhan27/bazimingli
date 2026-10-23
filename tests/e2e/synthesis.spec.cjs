const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
for(const width of [1440,1024,390,320])test(`evidence-led synthesis and sourced glossary at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('mingli_view_mode','professional'));
  await page.goto('/');await page.locator('#workspace-example').click();await expect(page.locator('.compact-chart-name')).toHaveText('学习示例');await expect(page.locator('.mingge-summary')).toBeVisible();
  const before=await page.evaluate(()=>({chart:JSON.stringify(serializeChart(lastZh)),records:localStorage.getItem('ml_records')}));
  const summary=page.locator('.mingge-summary');await expect(summary).toContainText('比劫月令');await expect(summary).toContainText('中和');
  await expect(summary).not.toContainText('质地断');await summary.locator('.mingge-evidence summary').click();await expect(summary.locator('.mingge-evidence')).toHaveAttribute('open','');await expect(summary).toContainText('月令');
  await summary.locator('.mingge-transits summary').click();await expect(summary.locator('.mingge-transits')).toContainText('岁');
  await summary.locator('.reading-citations summary').click();expect(await summary.locator('a[target="_blank"]').count()).toBe(4);
  for(const link of await summary.locator('a').all())expect(await link.getAttribute('href')).toMatch(/^https:\/\//);
  // A different section must read the exact same model, without changing IDs or AI containers.
  expect(await page.evaluate(()=>{const s=buildMingGeSummary(lastZh);return zhAnalysis(lastZh).total.includes(s.headline)&&zhGeJu(lastZh).includes(s.headline);})).toBe(true);
  await page.evaluate(()=>termTip('通关'));const term=page.getByRole('dialog',{name:'通关释义'});await expect(term).toContainText('木生火、火生土');await term.locator('summary').click();await expect(term.locator('a')).toHaveAttribute('href',/通隔/);await page.keyboard.press('Escape');await expect(term).toHaveCount(0);
  await page.locator('.compact-more>summary').click();await page.locator('#chart-glossary').click();await page.getByRole('searchbox',{name:'搜索术语'}).fill('三刑');await expect(page.locator('.glossary-results')).toContainText('无恩');await expect(page.locator('.glossary-results')).toContainText('核对范围');await page.keyboard.press('Escape');await expect(page.locator('.compact-more>summary')).toBeFocused();
  expect(await page.evaluate(()=>({chart:JSON.stringify(serializeChart(lastZh)),records:localStorage.getItem('ml_records')}))).toEqual(before);
  if(width===320)await page.getByRole('button',{name:'切换到玄墨青暗色主题'}).click();
  await expect(page.locator('.ui-toast')).toHaveCount(0);await summary.locator('details[open]>summary').evaluateAll(nodes=>nodes.forEach(n=>n.parentElement.open=false));await summary.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  fs.mkdirSync(path.resolve('verification/screenshots'),{recursive:true});await page.screenshot({path:`verification/screenshots/synthesis-${width}.png`});
  expect(errors).toEqual([]);
});
