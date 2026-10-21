const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const screenshots=path.resolve('verification/screenshots');
test('privacy disclosure is available offline and key persistence is opt-in',async({page})=>{
  await page.goto('/');await page.locator('#footer-privacy').click();
  await expect(page.getByRole('dialog')).toContainText('中转运营者和上游模型服务商');await expect(page.getByRole('dialog')).toContainText('备份不包含 API 设置');
  await page.keyboard.press('Escape');await expect(page.locator('#footer-privacy')).toBeFocused();
  await page.getByRole('button',{name:'AI 解读设置',exact:true}).click();await expect(page.locator('#ai-session-only')).toBeChecked();
  await page.locator('#ai-key').fill('synthetic-test-key');await page.getByRole('button',{name:'保存',exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem('mingli_ai_cfg'))).toBeNull();
  await page.reload();await page.getByRole('button',{name:'AI 解读设置',exact:true}).click();await expect(page.locator('#ai-key')).toHaveValue('');await expect(page.locator('#ai-key-state')).toContainText('标签页会话保存');
});
test('study layout shows four pillars first, retains hidden options and switches reader views',async({page})=>{
  await page.setViewportSize({width:1440,height:1050});await page.goto('/');await expect(page.locator('.primary-pillars')).toBeVisible();
  await expect(page.locator('#advanced-options')).not.toHaveAttribute('open','');await expect(page.locator('.reader-extra').first()).toBeHidden();
  await page.locator('#workspace-example').click();await expect(page.locator('#zh-result')).toContainText('学习示例');
  const original=await page.evaluate(()=>JSON.stringify(lastZh.pillars));
  await page.getByRole('button',{name:'专业',exact:true}).click();await expect(page.locator('#advanced-options')).toHaveAttribute('open','');await expect(page.locator('.reader-extra').first()).toBeVisible();
  expect(await page.evaluate(()=>JSON.stringify(lastZh.pillars))).toBe(original);
  await page.getByRole('button',{name:'学习',exact:true}).click();await page.reload();await expect(page.locator('.primary-pillars')).toBeVisible();await expect(page.locator('#advanced-options')).not.toHaveAttribute('open','');
  await page.locator('#workspace-example').click();await expect(page.locator('#zh-result')).toContainText('学习示例');await expect(page.locator('#cast-loading')).not.toHaveClass(/show/);
  fs.mkdirSync(screenshots,{recursive:true});await page.screenshot({path:path.join(screenshots,'workbench-desktop.png'),fullPage:false});
});
test('guide and source-aware glossary are keyboard reachable, trap focus, and restore it',async({page})=>{
  await page.goto('/');await page.locator('#workspace-help').click();await expect(page.getByRole('dialog')).toContainText('先核对计算事实');await page.keyboard.press('Escape');await expect(page.locator('#workspace-help')).toBeFocused();
  await page.getByRole('button',{name:'术语小辞典',exact:true}).click();await page.getByRole('searchbox',{name:'搜索术语'}).fill('比肩');await expect(page.locator('.glossary-results')).toContainText('出处待核验');await expect(page.locator('.glossary-results')).toContainText('比肩');await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'返回排盘'})).toBeFocused();await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:/八字排盘/}).focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#panel-ziwei')).toBeVisible();await expect(page.locator('#workspace-title')).toHaveText('紫微斗数');
});
test('mobile form, tabs, chart and dialogs fit a 390px screen, including dark theme',async({page})=>{
  await page.setViewportSize({width:390,height:844});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('.primary-pillars')).toBeVisible();
  await page.locator('#workspace-example').click();await expect(page.locator('#zh-result')).toContainText('学习示例');
  const overflow=()=>page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));let size=await overflow();expect(size.page).toBeLessThanOrEqual(size.viewport+1);
  await page.locator('#advanced-options summary').click();await expect(page.locator('#zh-day-boundary')).toBeVisible();await page.locator('#zh-day-boundary').selectOption('zi-zheng');await page.locator('#advanced-options summary').click();
  fs.mkdirSync(screenshots,{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(screenshots,'workbench-mobile.png'),fullPage:false});
  await page.locator('.primary-pillars').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'workbench-mobile-chart.png'),fullPage:false});
  await page.getByRole('button',{name:'切换到玄墨青暗色主题'}).click();await expect(page.locator('body')).toHaveAttribute('data-theme','xuanmo');await page.locator('.primary-pillars').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'workbench-dark.png'),fullPage:false});
  await page.getByRole('tab',{name:/合婚配对/}).click();await page.evaluate(()=>hhCast());await expect(page.locator('#hh-result')).not.toBeEmpty();size=await overflow();expect(size.page).toBeLessThanOrEqual(size.viewport+1);expect(errors).toEqual([]);
});
test('local records can be searched without changing or deleting saved data',async({page})=>{
  await page.goto('/');await page.locator('#workspace-example').click();await expect(page.locator('#zh-records')).toContainText('学习示例');const before=await page.evaluate(()=>localStorage.getItem('ml_records'));
  await page.getByRole('searchbox',{name:'搜索本地排盘记录'}).fill('does-not-exist');await expect(page.locator('#zh-records .rec-item:visible')).toHaveCount(0);
  await page.getByRole('searchbox',{name:'搜索本地排盘记录'}).fill('学习示例');await expect(page.locator('#zh-records .rec-item:visible')).toHaveCount(1);expect(await page.evaluate(()=>localStorage.getItem('ml_records'))).toBe(before);
});
