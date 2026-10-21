const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('mingli_view_mode','professional'));await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');});
test('offset and DST controls convert the input, restore history, and retain the same instant',async({page})=>{
  const errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.locator('#zh-name').fill('时区验收');await page.locator('#zh-solar').fill('2024-02-09');await page.locator('#zh-time').fill('12:30');
  await page.locator('#zh-utc-offset').selectOption('-300');await page.locator('#zh-dst').selectOption('60');await page.evaluate(()=>zhCast());
  await expect.poll(()=>page.evaluate(()=>lastZh.temporal.instantUtc)).toBe('2024-02-09T16:30:00.000Z');await expect(page.locator('#zh-result')).toContainText('统一东八区 2024-02-10 00:30');
  const before=await page.evaluate(()=>lastZh.pillars);
  await page.reload();await expect(page.locator('#zh-records')).toContainText('时区验收');await page.locator('#zh-records .rec-item').filter({hasText:'时区验收'}).click();
  await expect(page.locator('#zh-utc-offset')).toHaveValue('-300');await expect(page.locator('#zh-dst')).toHaveValue('60');
  await expect.poll(()=>page.evaluate(()=>lastZh.temporal.instantUtc)).toBe('2024-02-09T16:30:00.000Z');expect(await page.evaluate(()=>lastZh.pillars)).toEqual(before);
  expect(errors).toEqual([]);expect(dialogs).toEqual([]);
});
test('standard city picker selects an attributed coordinate instead of substring matching',async({page})=>{
  await page.evaluate(()=>zhOpenPicker('zh-place'));
  await page.locator('#pp-prov').getByRole('button',{name:'新疆',exact:true}).click();await page.locator('#pp-city').getByRole('button',{name:'库尔勒市',exact:true}).click();
  await expect(page.locator('#zh-place')).toHaveValue(/新疆\/库尔勒市/);
  await page.locator('#zh-true-sun').selectOption('1');await page.evaluate(()=>zhCast());
  await expect.poll(()=>page.evaluate(()=>lastZh.temporal.correction?.longitude)).toBe(86.15231);
  expect(await page.evaluate(()=>resolveLocation(document.getElementById('zh-place').value).id)).toBe('geonames:1529376');
  await expect(page.locator('#place-picker a[href="https://www.geonames.org/"]')).toHaveCount(1);
});
test('Bazi hour-only history retains the original clock hour after timezone conversion',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.locator('.tab[data-tab="bazi"]').click();
  await page.locator('#bz-name').fill('八字原时辰');await page.locator('#bz-date').fill('2024-02-10');await page.locator('#bz-hour').selectOption('6');await page.locator('#bz-time').fill('');
  await page.locator('#bz-utc-offset').selectOption('120');await page.evaluate(()=>bzCast());
  const before=await page.evaluate(()=>({pillars:lastZh.pillars,instant:lastZh.temporal.instantUtc}));
  expect(before.instant).toBe('2024-02-10T10:00:00.000Z');
  await page.reload();await expect(page.locator('#zh-result')).toContainText('命格总断');await page.locator('.tab[data-tab="bazi"]').click();await page.locator('#bz-records .rec-item').filter({hasText:'2024-02-10'}).click();
  await expect(page.locator('#bz-hour')).toHaveValue('6');await expect(page.locator('#bz-time')).toHaveValue('');await expect(page.locator('#bz-utc-offset')).toHaveValue('120');
  expect(await page.evaluate(()=>({pillars:lastZh.pillars,instant:lastZh.temporal.instantUtc}))).toEqual(before);
  // A valid imported historical minute offset must survive a select restoration.
  expect(await page.evaluate(()=>{restoreUtcOffset('bz-utc-offset',483);return document.getElementById('bz-utc-offset').value;})).toBe('483');
  expect(errors).toEqual([]);
});
test('all five school selections drive the displayed rule, calculation and serialized prompt',async({page})=>{
  await page.locator('#zh-solar').fill('2024-01-04');await page.locator('#zh-time').fill('00:00');
  let common;
  for(let i=0;i<5;i++){
    await page.locator('#zh-school2').selectOption(String(i));await page.evaluate(()=>zhCast());
    await expect.poll(()=>page.evaluate(()=>[lastZh.profile.id,fmtLocalDate(lastZh.inputDate)])).toEqual([i,'2024-01-04']);
    const data=await page.evaluate(()=>({pillars:lastZh.pillars,profile:lastZh.profile,chart:JSON.parse(aiBuildChart(lastZh)),prompt:aiBuildSchool(lastSchool).role}));
    if(!common)common=data.pillars;expect(data.pillars).toEqual(common);expect(data.chart.rules.profile).toBe(data.profile.key);expect(data.prompt).toContain(data.profile.useStrategy);
    await expect(page.locator('#zh-result [data-calculation-basis]')).toContainText(data.profile.name);
  }
});
test('wuxing display changes convention without changing pillars or the scoring model',async({page})=>{
  await page.locator('#zh-solar').fill('2024-02-10');await page.locator('#zh-time').fill('12:00');await page.evaluate(()=>zhCast());
  await expect.poll(()=>page.evaluate(()=>lastZh.temporal.civilDate.getFullYear())).toBe(2024);
  const before=await page.evaluate(()=>({pillars:lastZh.pillars,score:lastZh.strengthScore}));
  await page.locator('#zh-wx-mode').selectOption('stems-all-hidden');await page.evaluate(()=>zhCast());await expect.poll(()=>page.evaluate(()=>lastZh.wxStatistics.mode)).toBe('stems-all-hidden');
  await expect(page.locator('#zh-result [data-calculation-basis]')).toContainText('天干＋全部藏干');
  expect(await page.evaluate(()=>({pillars:lastZh.pillars,score:lastZh.strengthScore}))).toEqual(before);
  await page.locator('#zh-result [data-calculation-basis] summary').click();await expect(page.locator('#zh-result [data-calculation-basis]')).toContainText('月支');
});
test('unknown-time history reloads as candidates, and both Zi conventions change only their defined facts',async({page})=>{
  await page.locator('#zh-name').fill('未知时辰验收');await page.locator('#zh-solar').fill('2024-02-10');await page.locator('#zh-unknow-hour').selectOption('1');await page.evaluate(()=>zhCast());
  await expect(page.locator('#unknown-candidates')).toContainText('日柱随时段变化');expect(await page.evaluate(()=>lastZh)).toBeNull();
  await page.locator('#zh-day-boundary').selectOption('zi-zheng');await page.evaluate(()=>zhCast());await expect(page.locator('#unknown-candidates')).toContainText('日柱稳定');
  await page.reload();await expect(page.locator('#zh-records')).toContainText('未知时辰验收');await page.locator('#zh-records .rec-item').filter({hasText:'未知时辰验收'}).click();
  await expect(page.locator('#unknown-candidates')).toContainText('日柱稳定');expect(await page.evaluate(()=>lastZh)).toBeNull();await expect(page.locator('#zh-time')).toBeDisabled();
});
