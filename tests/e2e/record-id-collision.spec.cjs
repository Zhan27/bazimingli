const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('repeated clock and randomness keep distinct records visible, exportable and replayable',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    Date.now=()=>1707525240000;
    Math.random=()=>0.5;
    localStorage.setItem('mingli_view_mode','professional');
  });
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
  for(const name of ['碰撞样本甲','碰撞样本乙']){
    await page.locator('#zh-name').fill(name);
    await page.evaluate(()=>zhCast());
    await expect(page.locator('#zh-result')).toContainText(name);
    await expect(page.locator('#zh-records .rec-item').filter({hasText:name})).toHaveCount(1);
  }
  await page.locator('#zh-result .compact-more > summary').click();
  const download=page.waitForEvent('download');
  await page.locator('#zh-result').getByRole('button',{name:'导出备份',exact:false}).click();
  const file=await download,dest=testInfo.outputPath('collision-backup.json');
  await file.saveAs(dest);
  const rows=JSON.parse(fs.readFileSync(dest,'utf8')).ml_records;
  expect(new Set(rows.map(r=>r.id)).size).toBe(rows.length);
  expect(rows.map(r=>r.name)).toEqual(expect.arrayContaining(['碰撞样本甲','碰撞样本乙']));
  await page.reload();
  await expect(page.locator('#zh-records .rec-item').filter({hasText:'碰撞样本甲'})).toHaveCount(1);
  await page.locator('#zh-records .rec-item').filter({hasText:'碰撞样本甲'}).click();
  await expect(page.locator('#zh-result')).toContainText('碰撞样本甲');
  await expect(page.locator('#zh-records .rec-item').filter({hasText:'碰撞样本乙'})).toHaveCount(1);
});
