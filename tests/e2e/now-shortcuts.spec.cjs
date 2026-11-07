const {test,expect}=require('@playwright/test');
test.use({timezoneId:'America/New_York'});
const instant='2024-02-10T00:34:56.789Z',currentMinute='2024-02-10T00:34:00.000Z';

test.beforeEach(async({page})=>{
  await page.addInitScript(ms=>{Date.now=()=>ms;},Date.parse(instant));
  await page.addInitScript(()=>localStorage.setItem('mingli_view_mode','professional'));
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
});

test('Qimen now replaces an old precise time in specified-time mode',async({page})=>{
  await page.locator('.tab[data-tab="qimen"]').click();
  await page.locator('#qm-mode').selectOption('1');
  await page.locator('#qm-date').fill('2020-01-01');
  await page.locator('#qm-time').fill('03:15');
  await page.getByRole('button',{name:'此刻',exact:true}).click();
  await expect(page.locator('#qm-date')).toHaveValue('2024-02-10');
  await expect(page.locator('#qm-time')).toHaveValue('08:34');
  await expect(page.locator('#qm-hour')).toHaveValue('4');
  const row=await page.evaluate(()=>readStoredRecords('qm_records')[0]);
  expect(row).toMatchObject({dateStr:'2024-02-10',hourHH:8,minute:34,hourIdx:4});
});

test('Qimen current-time casting refreshes the displayed date as well as its actual result',async({page})=>{
  await page.locator('.tab[data-tab="qimen"]').click();
  await page.locator('#qm-mode').selectOption('0');
  await page.locator('#qm-date').fill('2020-01-01');
  await page.locator('#panel-qimen .btn-primary').click();
  await expect(page.locator('#qm-date')).toHaveValue('2024-02-10');
  await expect(page.locator('#qm-time')).toHaveValue('08:34');
  expect(await page.evaluate(()=>readStoredRecords('qm_records')[0].dateStr)).toBe('2024-02-10');
});

for(const prefix of ['zh','bz'])test(prefix+' now uses the selected clock offset and DST for the same real minute',async({page})=>{
  await page.locator('.tab[data-tab="'+(prefix==='zh'?'zonghe':'bazi')+'"]').click();
  for(const [offset,dst,date,time,hour] of [[-720,0,'2024-02-09','12:34','6'],[345,0,'2024-02-10','06:19','3'],[0,60,'2024-02-10','01:34','1']]){
    await page.locator('#'+prefix+'-utc-offset').selectOption(String(offset));
    await page.locator('#'+prefix+'-dst').selectOption(String(dst));
    await page.getByRole('button',{name:'此刻',exact:true}).click();
    await expect(page.locator('#'+prefix+(prefix==='zh'?'-solar':'-date'))).toHaveValue(date);
    await expect(page.locator('#'+prefix+'-time')).toHaveValue(time);
    await expect(page.locator('#'+prefix+'-hour')).toHaveValue(hour);
    await expect(page.locator('#'+prefix+'-utc-offset')).toHaveValue(String(offset));
    await expect(page.locator('#'+prefix+'-dst')).toHaveValue(String(dst));
    if(prefix==='zh'){
      await expect(page.locator('#zh-minute')).toHaveValue(time.slice(-2).replace(/^0/,''));
      await expect.poll(()=>page.evaluate(()=>lastZh.temporal.instantUtc)).toBe(currentMinute);
    }
    else await expect(page.locator('#bz-result .info-bar')).toContainText('统一东八区 2024-02-10 08:34');
  }
});

test('comprehensive now changes an unknown-time form to the known current time',async({page})=>{
  await page.locator('#zh-unknow-hour').selectOption('1');
  await page.getByRole('button',{name:'此刻',exact:true}).click();
  await expect(page.locator('#zh-unknow-hour')).toHaveValue('0');
  await expect(page.locator('#zh-time')).toBeEnabled();
  await expect(page.locator('#zh-time')).toHaveValue('08:34');
  await expect.poll(()=>page.evaluate(()=>lastZh?.temporal.instantUtc)).toBe(currentMinute);
  await expect(page.locator('#unknown-candidates')).toHaveCount(0);
});
