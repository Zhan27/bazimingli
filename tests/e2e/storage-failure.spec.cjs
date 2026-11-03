const {test,expect}=require('@playwright/test');

test('storage denial at startup still allows local charts',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    Storage.prototype.getItem=()=>{throw new DOMException('Test storage denial','SecurityError');};
    Storage.prototype.setItem=()=>{throw new DOMException('Test storage denial','SecurityError');};
  });
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
  await expect(page.locator('.ui-toast')).toContainText('记录未保存');
  expect(errors).toEqual([]);
});

test('quota failures render fresh definite and candidate charts without replacing history',async({page})=>{
  const dialogs=[];page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.dismiss();});
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
  const before=await page.evaluate(()=>localStorage.getItem('ml_records'));
  await page.evaluate(()=>{
    Storage.prototype.setItem=()=>{throw new DOMException('Test quota','QuotaExceededError');};
    document.getElementById('zh-solar').value='2024-02-10';
    document.getElementById('zh-name').value='确定盘存储测试';
    zhCast();
  });
  await expect(page.locator('#zh-result')).toContainText('确定盘存储测试');
  await expect(page.locator('.ui-toast')).toContainText('记录未保存');
  await page.evaluate(()=>{
    document.getElementById('zh-name').value='候选盘存储测试';
    document.getElementById('zh-unknow-hour').value='1';
    zhCast();
  });
  await expect(page.locator('#unknown-candidates')).toContainText('候选盘存储测试');
  await expect(page.locator('.ui-toast')).toContainText('记录未保存');
  expect(await page.evaluate(()=>({history:localStorage.getItem('ml_records'),definite:lastZh!==null}))).toEqual({history:before,definite:false});
  expect(dialogs).toEqual([]);
});
