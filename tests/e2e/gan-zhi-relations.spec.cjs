const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const dense={yearGZ:[0,5],monthGZ:[5,8],dayGZ:[6,2],hourGZ:[1,11]};
async function showFixture(page,chart=dense){
  await page.goto('/');await expect(page.locator('.gz-summary')).toBeVisible();
  const before=await page.evaluate(chart=>{const before=JSON.stringify(zhGanZhiMap(chart));document.querySelector('.gz-summary').outerHTML=renderGanZhiRelations(chart);mountGanZhiRelations(document.getElementById('zh-result'));return before;},chart);
  await page.locator('.gz-summary [data-gz-open="all"]').click();return before;
}
test('opened graph filters, selects exact groups, restores focus and preserves calculation results',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));const before=await showFixture(page),root=page.locator('.gz-explorer');
  await expect(root.locator('[data-gz-relation]')).toHaveCount(13);await expect(root.locator('[data-gz-node]')).toHaveCount(8);
  await root.locator('[data-gz-type="anhe"]').click();await expect(root.locator('.gz-graph-edge')).toHaveCount(1);
  await root.locator('[data-gz-node="zhi-3"]').click();await expect(root.locator('[data-gz-status]')).toHaveText('当前筛选没有匹配关系');
  await root.locator('[data-gz-reset]').click();await expect(root.locator('.gz-graph-edge')).toHaveCount(13);
  const selected=root.locator('[data-gz-kind="xing"]');await selected.focus();await page.keyboard.press('Enter');await expect(selected).toHaveAttribute('aria-pressed','true');await expect(root.locator('.gz-pillar.is-related')).toHaveCount(3);await expect(root.locator('[data-gz-status]')).toContainText('年支巳');await expect(root.locator('[data-gz-status]')).toContainText('月支申');await expect(root.locator('[data-gz-status]')).toContainText('日支寅');
  await root.locator('.gz-citations summary').click();await expect(root.locator('.gz-citation a')).toBeVisible();
  await root.locator('[data-gz-type="chong"]').click();await expect(selected).toHaveAttribute('aria-pressed','false');await expect(root.locator('.gz-pillar.is-related')).toHaveCount(0);
  expect(await page.evaluate(chart=>JSON.stringify(zhGanZhiMap(chart)),dense)).toBe(before);
  await page.keyboard.press('Escape');await expect(page.locator('.gz-workspace-overlay')).toBeHidden();await expect(page.locator('.gz-summary [data-gz-open="all"]')).toBeFocused();
  await page.locator('#workspace-example').click();await expect(page.locator('.compact-chart-name')).toHaveText('学习示例');await page.locator('.gz-summary [data-gz-open="all"]').click();await expect(root.locator('[data-gz-type="all"]')).toHaveAttribute('aria-pressed','true');
  await root.locator('[data-gz-glossary]').click();await page.getByRole('searchbox',{name:'搜索术语'}).fill('三合');await expect(page.locator('.glossary-results')).toContainText('三合');await page.keyboard.press('Escape');await expect(root.locator('[data-gz-glossary]')).toBeFocused();expect(errors).toEqual([]);
});
for(const width of [1440,1024,390,320])test(`graph labels and arrow endpoints fit ${width}px, including repeated branches and dark theme`,async({page})=>{
  await page.setViewportSize({width,height:width>900?1000:844});await showFixture(page);const root=page.locator('.gz-explorer');
  const geometry=await root.evaluate(el=>{const board=el.querySelector('.gz-board'),r=board.getBoundingClientRect();return {page:document.documentElement.scrollWidth,viewport:innerWidth,scroll:el.scrollWidth,width:el.clientWidth,opacity:getComputedStyle(el.querySelector('.gz-graph-edge')).opacity,nodes:[...el.querySelectorAll('.gz-pillar')].map(n=>{const a=n.getBoundingClientRect(),label=n.querySelector('span').getBoundingClientRect();return {inside:a.left>=r.left&&a.right<=r.right&&a.top>=r.top&&a.bottom<=r.bottom,labelInside:label.left>=a.left&&label.right<=a.right&&label.top>=a.top&&label.bottom<=a.bottom};}),endpoints:[...el.querySelectorAll('[data-gz-endpoint]')].map(p=>{const point=p.getPointAtLength(p.getTotalLength()),ctm=p.getScreenCTM(),end=new DOMPoint(point.x,point.y).matrixTransform(ctm),node=el.querySelector('[data-gz-node="'+p.dataset.gzEndpoint+'"]').getBoundingClientRect();return Math.min(Math.abs(end.y-node.top),Math.abs(end.y-node.bottom));})};});
  expect(geometry.page).toBeLessThanOrEqual(width);expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);expect(geometry.nodes.every(n=>n.inside&&n.labelInside)).toBe(true);expect(geometry.endpoints.every(gap=>gap>=3)).toBe(true);expect(Number(geometry.opacity)).toBe(.56);
  fs.mkdirSync('verification/screenshots',{recursive:true});await page.locator('.gz-workspace-card').screenshot({path:`verification/screenshots/relations-${width}.png`,animations:'disabled'});
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'切换到玄墨青暗色主题'}).click();await page.locator('.gz-summary [data-gz-open="all"]').click();await page.locator('.gz-workspace-card').screenshot({path:`verification/screenshots/relations-dark-${width}.png`,animations:'disabled'});await page.keyboard.press('Escape');
  await page.evaluate(()=>showGanZhiWorkspace({yearGZ:[0,6],monthGZ:[0,6],dayGZ:[5,6],hourGZ:[5,6]}));const self=root.locator('[data-gz-kind="xing"]');await self.click();await expect(root.locator('.gz-pillar.is-related')).toHaveCount(4);await expect(root.locator('.gz-graph-edge.is-selected [data-gz-endpoint]')).toHaveCount(4);
  await page.keyboard.press('Escape');await page.evaluate(()=>showGanZhiWorkspace({yearGZ:[0,0],monthGZ:[0,0],dayGZ:[0,0],hourGZ:[0,0]}));await expect(root.locator('.gz-empty')).toBeVisible();await expect(root.locator('[data-gz-node]')).toHaveCount(8);
});
