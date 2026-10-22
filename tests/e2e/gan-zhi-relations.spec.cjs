const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const dense={yearGZ:[0,5],monthGZ:[5,8],dayGZ:[6,2],hourGZ:[1,11]};
async function showFixture(page,chart=dense){
  await page.goto('/');await expect(page.locator('.gz-explorer')).toBeVisible();
  return page.evaluate(chart=>{
    const before=JSON.stringify(zhGanZhiMap(chart));
    document.querySelector('.gz-explorer').outerHTML=renderGanZhiRelations(chart);
    mountGanZhiRelations(document.getElementById('zh-result'));
    return before;
  },chart);
}

test('dense diagram filters by type and pillar, highlights exact endpoints and resets without changing calculations',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const before=await showFixture(page);
  const root=page.locator('.gz-explorer'),rows=root.locator('[data-gz-relation]');
  await expect(rows).toHaveCount(13);
  await root.locator('[data-gz-type="anhe"]').click();await expect(root.locator('[data-gz-relation]:visible')).toHaveCount(1);
  await root.locator('[data-gz-node="zhi-3"]').click();await expect(root.locator('[data-gz-relation]:visible')).toHaveCount(0);await expect(root.locator('[data-gz-status]')).toHaveText('显示0 / 13组关系');
  await root.locator('[data-gz-reset]').click();await expect(root.locator('[data-gz-relation]:visible')).toHaveCount(13);
  const selected=root.locator('[data-gz-kind="xing"]');await selected.focus();await page.keyboard.press('Enter');await expect(selected).toHaveAttribute('aria-pressed','true');
  await expect(root.locator('.gz-pillar.is-related')).toHaveCount(3);
  await expect(root.locator('[data-gz-status]')).toContainText('年支巳、月支申、日支寅');
  await rows.first().hover();await expect(root.locator('.gz-pillar.is-related')).toHaveCount(3);await expect(root.locator('[data-gz-status]')).toContainText('年支巳、月支申、日支寅');
  await root.locator('[data-gz-type="chong"]').click();await expect(selected).toHaveAttribute('aria-pressed','false');await expect(root.locator('.gz-pillar.is-related')).toHaveCount(0);
  await root.locator('[data-gz-reset]').click();await root.locator('[data-gz-node="zhi-0"]').click();
  expect(await root.locator('[data-gz-relation]:visible').evaluateAll(items=>items.every(r=>r.dataset.gzMembers.split(',').includes('zhi-0')))).toBe(true);
  await root.locator('[data-gz-reset]').click();await selected.focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');await expect(selected).toHaveAttribute('aria-pressed','false');await expect(selected).toBeFocused();
  expect(await page.evaluate(chart=>JSON.stringify(zhGanZhiMap(chart)),dense)).toBe(before);expect(errors).toEqual([]);
  await page.setViewportSize({width:1440,height:1050});fs.mkdirSync(path.resolve('verification/screenshots'),{recursive:true});
  await page.mouse.move(0,0);await selected.blur();await root.screenshot({path:'verification/screenshots/relations-desktop.png',animations:'disabled'});
  // A real recalculation remounts a clean component with filters reset.
  await page.locator('#workspace-example').click();await expect(root.locator('[data-gz-type="all"]')).toHaveAttribute('aria-pressed','true');
  await root.locator('[data-gz-glossary]').click();await page.getByRole('searchbox',{name:'搜索术语'}).fill('三合');await expect(page.locator('.glossary-results')).toContainText('三合');await page.keyboard.press('Escape');await expect(root.locator('[data-gz-glossary]')).toBeFocused();
});

test('mobile and dark rails fit the viewport; repeated branches remain four separate nodes',async({page})=>{
  await page.setViewportSize({width:390,height:844});await showFixture(page);
  const root=page.locator('.gz-explorer');await root.screenshot({path:'verification/screenshots/relations-mobile.png',animations:'disabled'});
  await page.getByRole('button',{name:'切换到玄墨青暗色主题'}).click();await page.mouse.move(0,0);await root.screenshot({path:'verification/screenshots/relations-dark.png',animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const geometry=await root.locator('.gz-rail').evaluateAll(items=>items.map(svg=>{const box=svg.getBoundingClientRect();return {width:box.width,right:box.right,paths:[...svg.querySelectorAll('path')].map(p=>{const b=p.getBBox();return {x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};})};}));
  expect(geometry.every(g=>g.width>200&&g.right<=390&&g.paths.every(p=>p.x>=0&&p.y>=0&&p.right<=396&&p.bottom<=60))).toBe(true);
  await showFixture(page,{yearGZ:[0,6],monthGZ:[0,6],dayGZ:[5,6],hourGZ:[5,6]});
  const self=root.locator('[data-gz-relation]').filter({hasText:'地支自刑'});await self.click();await expect(self.locator('[data-gz-endpoint]')).toHaveCount(4);await expect(root.locator('.gz-pillar.is-related')).toHaveCount(4);
  await root.screenshot({path:'verification/screenshots/relations-repeated.png',animations:'disabled'});
});
