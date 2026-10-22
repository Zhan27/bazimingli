const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
async function openStudy(page){
  await page.goto('/');await expect(page.locator('#study-open')).toBeVisible();
  await page.evaluate(()=>{const d=withBirthTime(parseCivilDate('1990-05-20'),0,'10:30');lastZh=zhCompute(d,hourIndexAt(d),1,'',{preciseTime:true,utcOffsetMinutes:480,dstMinutes:0,dayBoundary:'zi-chu',trueSolar:false});renderZongHe(lastZh,'学习样本');});
  await page.locator('#study-open').click();await expect(page.getByRole('dialog',{name:'四柱学习与核验'})).toBeVisible();
}
async function readDownload(download){return JSON.parse(fs.readFileSync(await download.path(),'utf8'));}
test('learning facts and exact monthly drill-down preserve the chart and export a credential-free snapshot',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1440,height:1050});await openStudy(page);
  const identity=await page.evaluate(()=>JSON.stringify(serializeChart(lastZh)));await page.evaluate(()=>sessionStorage.setItem('study-test-private-setting','synthetic-secret-for-export-check'));
  await expect(page.locator('.study-pillar')).toHaveCount(4);await expect(page.locator('.study-pillar').first()).toContainText('落空亡');await expect(page.locator('.study-pillar').nth(2)).toContainText('井泉水');
  fs.mkdirSync('verification/screenshots',{recursive:true});await page.locator('.study-workspace-card').screenshot({path:'verification/screenshots/study-desktop.png',animations:'disabled'});
  await page.locator('#study-tab-timeline').click();await page.locator('#study-period').selectOption('0');await expect(page.locator('.study-years button')).toHaveCount(10);
  await page.locator('.study-years button').first().click();await expect(page.locator('.study-months article')).toHaveCount(12);await expect(page.locator('.study-months')).toContainText('起');
  await page.locator('.study-workspace-card').screenshot({path:'verification/screenshots/study-timeline.png',animations:'disabled'});
  const pending=page.waitForEvent('download');await page.locator('#study-export').click();const data=await readDownload(await pending);
  expect(data.format).toBe('bazimingli-study');expect(data.facts.pillars.map(p=>p.text)).toEqual(['庚午','辛巳','乙酉','辛巳']);expect(JSON.stringify(data)).not.toContain('synthetic-secret-for-export-check');
  expect(await page.evaluate(()=>JSON.stringify(serializeChart(lastZh)))).toBe(identity);await page.keyboard.press('Escape');await expect(page.locator('#study-open')).toBeFocused();expect(errors).toEqual([]);
});
test('reference files stay local, omissions remain visible and malformed or oversized files clear old reports',async({page})=>{
  await openStudy(page);await page.getByRole('tab',{name:'离线对照',exact:true}).click();
  const before=await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));const network=[];page.on('request',r=>network.push(r.url()));
  const data=await page.evaluate(()=>createStudySnapshot(serializeChart(lastZh)));
  data.facts.pillars[2].nayin='泉中水';delete data.facts.pillars[2].tenGod;
  await page.locator('#study-reference-file').setInputFiles({name:'本地样本.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.locator('#study-compare-status')).toContainText('对照已完成');await expect(page.locator('[data-study-compare-status="not-provided"]')).toHaveCount(1);await expect(page.locator('#study-comparison-result')).toContainText('未提供');
  await page.getByLabel('仅看差异和未提供项').uncheck();await expect(page.locator('#study-comparison-result')).toContainText('一致（异名）');
  const pending=page.waitForEvent('download');await page.locator('#study-report-export').click();const report=await readDownload(await pending);expect(report.summary.different).toBe(0);expect(report.summary['not-provided']).toBe(1);
  await page.locator('#study-reference-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await expect(page.locator('#study-compare-status')).toContainText('无法对照');await expect(page.locator('#study-report-export')).toBeDisabled();await expect(page.locator('#study-comparison-result')).toBeEmpty();
  await page.locator('#study-reference-file').setInputFiles({name:'oversize.json',mimeType:'application/json',buffer:Buffer.alloc(2*1024*1024+1)});await expect(page.locator('#study-compare-status')).toContainText('文件超过2MB');
  await page.locator('#study-reference-file').setInputFiles({name:'<img onerror=alert(1)>.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({pillars:['甲子','辛巳','乙酉','辛巳'],extra:'<svg onload=alert(1)>'}))});await expect(page.locator('#study-compare-status')).toContainText('对照已完成');await expect(page.locator('[data-study-compare-status="different"]')).toHaveCount(1);await expect(page.locator('.study-workspace-card svg,.study-workspace-card img')).toHaveCount(0);
  expect(network).toEqual([]);expect(await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}))).toBe(before);
});
test('mobile/dark learning dialog fits the viewport and its tabs and focus trap work by keyboard',async({page})=>{
  await page.setViewportSize({width:390,height:844});await openStudy(page);
  await page.locator('.study-workspace-card').screenshot({path:'verification/screenshots/study-mobile.png',animations:'disabled'});
  await page.getByRole('tab',{name:'四柱细读',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#study-tab-timeline')).toBeFocused();await page.keyboard.press('End');await expect(page.getByRole('tab',{name:'离线对照',exact:true})).toBeFocused();
  await page.evaluate(()=>setTheme('xuanmo'));await page.locator('.study-workspace-card').screenshot({path:'verification/screenshots/study-dark.png',animations:'disabled'});
  await page.locator('#study-export').focus();await page.keyboard.press('Tab');await expect(page.locator('#study-close')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('#study-export')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');await expect(page.locator('#study-open')).toBeFocused();
});
