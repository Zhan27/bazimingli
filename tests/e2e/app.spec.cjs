const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{try{localStorage.setItem('mingli_view_mode','professional');}catch(e){}});});
test('single HTML starts and all chart modules calculate without script errors',async({page})=>{
  const errors=[],dialogs=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
  for(const [tab,fn,result] of [['bazi','bzCast','bz-result'],['ziwei','zwCast','zw-result'],['qimen','qmCast','qm-result'],['liuyao','lyCast','ly-result'],['hehun','hhCast','hh-result']]){
    await page.locator('.tab[data-tab="'+tab+'"]').click();
    await page.evaluate(name=>window[name](),fn);
    await expect(page.locator('#'+result)).not.toBeEmpty();
  }
  expect(dialogs).toEqual([]);expect(errors).toEqual([]);
});
test('backup download, clear, v5 import, reload and exact input restoration',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  await page.locator('#zh-name').fill('备份验收样本');
  await page.locator('#zh-solar').fill('2024-02-10');
  await page.locator('#zh-time').fill('23:30');
  await page.locator('#zh-day-boundary').selectOption('zi-zheng');
  await page.locator('#zh-place').fill('乌鲁木齐');
  await page.locator('#zh-true-sun').selectOption('1');
  await page.evaluate(()=>zhCast());await expect(page.locator('#zh-result')).toContainText('备份验收样本');
  // A stored config is deliberately seeded; backups must exclude it.
  await page.evaluate(()=>localStorage.setItem('mingli_ai_config',JSON.stringify({key:'TEST_SETTING_SECRET'})));
  const download=page.waitForEvent('download');await page.evaluate(()=>exportRecords());
  const file=await download;const dest=testInfo.outputPath('backup.json');await file.saveAs(dest);
  const data=require('node:fs').readFileSync(dest,'utf8');expect(data).not.toContain('TEST_SETTING_SECRET');expect(JSON.parse(data).ml_records.some(r=>r.name==='备份验收样本')).toBe(true);
  await page.evaluate(()=>clearRecords());await expect(page.locator('#zh-records-wrap')).toBeHidden();
  await page.locator('#import-records-file').setInputFiles(dest);
  await expect(page.locator('#zh-records')).toContainText('备份验收样本');
  await page.reload();await expect(page.locator('#zh-records')).toContainText('备份验收样本');
  await page.locator('#zh-records .rec-item').filter({hasText:'备份验收样本'}).click();
  await expect(page.locator('#zh-time')).toHaveValue('23:30');await expect(page.locator('#zh-day-boundary')).toHaveValue('zi-zheng');await expect(page.locator('#zh-true-sun')).toHaveValue('1');await expect(page.locator('#zh-place')).toHaveValue('乌鲁木齐');
  expect(errors).toEqual([]);
});
test('user names, places, legacy records and AI HTML cannot create executable elements',async({page})=>{
  const errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  const payload='<img src=x onerror="window.__xss=1">';
  await page.locator('#zh-name').fill(payload);await page.locator('#zh-place').fill('北京'+payload);await page.evaluate(()=>zhCast());
  await expect(page.locator('#zh-result .info-bar')).toContainText(payload);
  await page.evaluate(p=>{
    const raw={id:'987654',name:p,dateStr:'2024-02-10',hourIdx:6,gender:1,lunarText:p,bazi:p};
    restoreRecordBackup({version:'v4',mingli_records:[raw]});renderRecords();
    aiRenderDims('【1】'+p+'<svg onload="window.__xss=2"></svg>\n【18】安全');
  },payload);
  expect(await page.locator('#zh-result img,#zh-result svg[onload],#zh-records img').count()).toBe(0);
  expect(await page.evaluate(()=>window.__xss)).toBeUndefined();
  await page.locator('.tab[data-tab="hehun"]').click();await page.locator('#hh1-name').fill(payload);await page.locator('#hh2-name').fill(payload);await page.locator('#hh1-place').fill(payload);await page.evaluate(()=>hhCast());
  await expect(page.locator('#hh-result')).toContainText(payload);expect(await page.locator('#hh-result img').count()).toBe(0);expect(await page.evaluate(()=>window.__xss)).toBeUndefined();
  expect(errors).toEqual([]);expect(dialogs).toEqual([]);
});
test('invalid imported data and unsupported dates show errors without changing history',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  const before=await page.evaluate(()=>localStorage.getItem('ml_records'));
  await page.locator('#import-records-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:'v5',ml_records:[{id:"x');alert(1);//",dateStr:'2024-02-10',hourIdx:6}]}))});
  await expect.poll(()=>dialogs.length).toBe(1);expect(dialogs[0]).toContain('记录ID无效');
  expect(await page.evaluate(()=>localStorage.getItem('ml_records'))).toBe(before);
  await page.locator('#zh-solar').fill('1899-12-31');await page.evaluate(()=>zhCast());
  await expect.poll(()=>dialogs.length).toBe(2);expect(dialogs[1]).toContain('支持的公历范围');
  expect(await page.evaluate(()=>localStorage.getItem('ml_records'))).toBe(before);
});
test('exact time drives Jie transition and both Zi rules through real form controls',async({page})=>{
  page.on('dialog',d=>d.dismiss());await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  await page.locator('#zh-solar').fill('2026-02-04');
  async function cast(time){await page.locator('#zh-time').fill(time);await page.evaluate(()=>zhCast());await expect.poll(()=>page.evaluate(()=>lastZh.temporal.civilDate.getHours()*60+lastZh.temporal.civilDate.getMinutes())).toBe(Number(time.slice(0,2))*60+Number(time.slice(3)));return page.evaluate(()=>lastZh.pillars.map(p=>GAN[p[0]]+ZHI[p[1]]));}
  const before=await cast('04:02'),after=await cast('04:03');expect(before[0]).toBe('乙巳');expect(after[0]).toBe('丙午');expect(after[1]).not.toBe(before[1]);
  await page.locator('#zh-solar').fill('2024-02-10');await page.locator('#zh-day-boundary').selectOption('zi-chu');const late=await cast('23:30');expect(late[2]).toBe('乙巳');
  await page.locator('#zh-day-boundary').selectOption('zi-zheng');await page.evaluate(()=>zhCast());await expect.poll(()=>page.evaluate(()=>GAN[lastZh.dayGZ[0]]+ZHI[lastZh.dayGZ[1]])).toBe('甲辰');
});
test('all five computed states match UI, prompts, summaries and actual PNG canvas text',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  const cases=[['从弱',2024,1,4,0],['身弱',2024,1,3,0],['中和',2024,1,1,4],['身强',2024,1,1,0],['身极强',1907,7,19,4]];
  await page.evaluate(()=>{
    const fill=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){(window.__canvasText||=[]).push(String(text));return fill.call(this,text,...args);};
  });
  for(const [state,y,m,d,h] of cases){
    const download=page.waitForEvent('download');
    const values=await page.evaluate(([y,m,d,h])=>{
      const z=zhCompute(new Date(y,m-1,d),h,1,'');lastZh=z;lastName='状态验收';renderZongHe(z,lastName);window.__canvasText=[];exportChartPng();
      return {state:z.strengthType,summary:buildShareText(z,lastName),prompt:aiBasicInfo(z),canvas:window.__canvasText.join('\n')};
    },[y,m,d,h]);
    const file=await download;await file.saveAs(testInfo.outputPath(state+'.png'));
    for(const value of Object.values(values))expect(value).toContain(state);
    await expect(page.locator('#zh-result')).toContainText(state);
    if(state==='中和')expect(values.canvas+values.summary+values.prompt).not.toContain('身弱（中和）');
  }
  expect(errors).toEqual([]);
});
test('real cards accept all 18 Markdown dimensions and incremental streaming prefixes',async({page})=>{
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  const text=Array.from({length:18},(_,i)=>'### **【'+(i+1)+'】**\n第'+(i+1)+'维测试正文').join('\n');
  for(const end of [20,100,text.length])await page.evaluate(s=>aiRenderDims(s),text.slice(0,end));
  for(let i=0;i<18;i++)await expect(page.locator('#ai-dim-'+i)).toContainText('第'+(i+1)+'维测试正文');
});
test('release opens directly as a local file with network disabled',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);
  const {pathToFileURL}=require('node:url');const {resolve}=require('node:path');
  await page.goto(pathToFileURL(resolve('命理排盘.html')).href);await expect(page.locator('#zh-result')).toContainText('命格总断');
  expect(errors).toEqual([]);
});
test('Beijing form inputs remain identical in UTC, Shanghai, New York and Sydney browsers',async({browser})=>{
  const outputs=[];
  for(const timezoneId of ['UTC','Asia/Shanghai','America/New_York','Australia/Sydney']){
    const context=await browser.newContext({timezoneId});
    try{
      const page=await context.newPage();await page.goto('http://127.0.0.1:8766/');await expect(page.locator('#zh-result')).toContainText('命格总断');
      outputs.push(await page.evaluate(()=>['2024-03-10','2024-10-06','1988-04-17'].map(ds=>{
        const date=withBirthTime(parseCivilDate(ds),1,'02:30');
        const t=calculateBirth(date,1,'',{preciseTime:true});
        const z=zhCompute(date,1,1,'',{preciseTime:true});
        return {hour:date.getHours(),minute:date.getMinutes(),pillars:[t.yearGZ,t.monthGZ,t.dayGZ,t.hourGZ],lunar:solar2lunar(date),promptChart:aiBuildChart(z)};
      })));
    }finally{await context.close();}
  }
  outputs.forEach(o=>expect(o).toEqual(outputs[0]));outputs[0].forEach(o=>{expect(o.hour).toBe(2);expect(o.minute).toBe(30);});
});
test('lunar leap month controls refresh actual day counts and synchronize Gregorian date',async({page})=>{
  const errors=[],dialogs=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  await page.locator('#zh-cal').selectOption('1');await page.locator('#zh-ly').selectOption('2023');await page.locator('#zh-lm').selectOption('2');
  expect(await page.locator('#zh-ld option').count()).toBe(30);
  await page.locator('#zh-ll').selectOption('1');expect(await page.locator('#zh-ld option').count()).toBe(29);
  await page.locator('#zh-ld').selectOption('29');await expect(page.locator('#zh-solar')).toHaveValue('2023-04-19');
  await page.evaluate(()=>zhCast());await expect.poll(()=>page.evaluate(()=>lastZh.lunar.isLeap)).toBe(true);
  await page.locator('#zh-ly').selectOption('2024');expect(await page.locator('#zh-ll option').count()).toBe(1);await expect(page.locator('#zh-ll')).toHaveValue('0');
  expect(errors).toEqual([]);expect(dialogs).toEqual([]);
});
test('unknown time shows candidates, disables exact input and never fabricates a default chart',async({page})=>{
  const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
  await page.goto('/');await expect(page.locator('#zh-result')).toContainText('命格总断');
  await page.locator('#zh-solar').fill('2026-02-04');await page.locator('#zh-unknow-hour').selectOption('1');await page.locator('#zh-gender').selectOption('2');await page.evaluate(()=>zhCast());
  await expect(page.locator('#unknown-candidates')).toContainText('时辰未知');await expect(page.locator('#unknown-candidates')).toContainText('年柱随时段变化');await expect(page.locator('#unknown-candidates')).toContainText('性别未提供');
  expect(await page.evaluate(()=>lastZh)).toBeNull();expect(await page.evaluate(()=>lastCandidates.candidates.length)).toBeGreaterThan(13);
  await expect(page.locator('#zh-time')).toBeDisabled();expect(await page.locator('#zh-result #dd-score-num').count()).toBe(0);
  await page.locator('#zh-true-sun').selectOption('1');await page.locator('#zh-place').fill('乌鲁木齐');await page.evaluate(()=>zhCast());
  await expect.poll(()=>page.evaluate(()=>lastCandidates.options.trueSolar)).toBe(true);
  await page.evaluate(()=>exportChartPng());await expect.poll(()=>dialogs.length).toBe(1);expect(dialogs[0]).toContain('时辰未知');
  await page.locator('#zh-unknow-hour').selectOption('0');await page.locator('#zh-place').fill('无法识别的地点');await page.evaluate(()=>zhCast());await expect.poll(()=>dialogs.length).toBe(2);expect(dialogs[1]).toContain('真太阳时需要');
});
