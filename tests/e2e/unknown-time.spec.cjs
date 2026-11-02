const {test,expect}=require('@playwright/test');
const path=require('node:path');

for(const width of [1440,1024,390,320])test('unknown-time range exclusions, copying and replay at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>localStorage.setItem('mingli_view_mode','professional'));
  const errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  if(width<768)await page.locator('#compact-edit').click();
  await page.locator('#zh-name').fill('候选边界验收');await page.locator('#zh-solar').fill('2099-12-31');
  await page.locator('#zh-unknow-hour').selectOption('1');await page.locator('#zh-utc-offset').selectOption('-720');
  await page.evaluate(()=>zhCast());
  const result=page.locator('#unknown-candidates');await expect(result).toContainText('有效候选时段');
  await expect(page.locator('#compact-input-summary')).toHaveText('2099-12-31 · 时辰未知');
  expect(await page.evaluate(()=>lastZh)).toBeNull();await expect(result).toContainText('2099-12-31 04:00:00');
  const excluded=result.locator('[data-unknown-excluded]');await excluded.locator('summary').click();
  await expect(excluded).toContainText('2100-01-01 00:00:00');
  await page.evaluate(()=>{window.__copied='';copyText=text=>{window.__copied=text;};});
  await result.getByRole('button',{name:'复制候选对比'}).click();
  const copied=await page.evaluate(()=>window.__copied);expect(copied).toContain('排除时段');expect(copied).toContain('2100-01-01 00:00:00');
  expect(await page.evaluate(()=>{const all=[...lastCandidates.candidates,...lastCandidates.excluded];return all.reduce((n,c)=>n+c.to-c.from,0);})).toBe(86400000);
  if(width===1440||width===320){
    if(width===320)await page.getByRole('button',{name:'切换到玄墨青暗色主题'}).click();
    await result.scrollIntoViewIfNeeded();await page.screenshot({path:path.resolve('verification/screenshots/unknown-time-'+width+'.png'),fullPage:true,animations:'disabled'});
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();await expect(page.locator('#zh-records')).toContainText('候选边界验收');
  if(width<768){
    await page.locator('#compact-records').click();
    await page.locator('#record-manager-search').fill('候选边界验收');
    await page.locator('.record-manager-row').getByRole('button',{name:'重新排盘',exact:true}).click();
  }else await page.locator('#zh-records .rec-item').filter({hasText:'候选边界验收'}).click();
  await expect(result).toContainText('2099-12-31 04:00:00');await expect(page.locator('#zh-time')).toBeDisabled();
  expect(await page.evaluate(()=>lastZh)).toBeNull();expect(dialogs).toEqual([]);expect(errors).toEqual([]);
});
