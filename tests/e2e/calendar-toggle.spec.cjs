const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('mingli_view_mode','professional'));
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
});

test('Gregorian and lunar toggles retain the selected historical birthday and leap month',async({page})=>{
  for(const [date,year,month,day,leap] of [['1988-08-08','1988','6','26','0'],['2023-03-25','2023','2','4','1']]){
    await page.locator('#zh-cal').selectOption('0');
    await page.locator('#zh-solar').fill(date);
    await page.locator('#zh-time').fill('12:00');
    await page.locator('#zh-cal').selectOption('1');
    await expect(page.locator('#zh-ly')).toHaveValue(year);
    await expect(page.locator('#zh-lm')).toHaveValue(month);
    await expect(page.locator('#zh-ld')).toHaveValue(day);
    await expect(page.locator('#zh-ll')).toHaveValue(leap);
    await page.evaluate(()=>zhCast());
    await expect.poll(()=>page.evaluate(()=>fmtLocalDate(lastZh.inputDate))).toBe(date);
    await page.locator('#zh-cal').selectOption('0');
    await expect(page.locator('#zh-solar')).toHaveValue(date);
  }
});

test('switching back to Gregorian commits the selected lunar birthday',async({page})=>{
  await page.locator('#zh-cal').selectOption('1');
  await page.locator('#zh-ly').selectOption('2023');
  await page.locator('#zh-lm').selectOption('2');
  await page.locator('#zh-ll').selectOption('1');
  await page.locator('#zh-ld').selectOption('4');
  await page.locator('#zh-cal').selectOption('0');
  await expect(page.locator('#zh-solar')).toHaveValue('2023-03-25');
  await page.evaluate(()=>zhCast());
  await expect.poll(()=>page.evaluate(()=>fmtLocalDate(lastZh.inputDate))).toBe('2023-03-25');
});
