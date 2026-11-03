const {test,expect}=require('@playwright/test');

test('clipboard denial reports the real result of the fallback',async({page})=>{
  const messages=[],errors=[];
  page.on('dialog',async dialog=>{messages.push(dialog.message());await dialog.dismiss();});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#zh-result')).toContainText('命格总断');
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
      writeText:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))
    }});
    document.execCommand=()=>false;
    shareCopy();
  });
  await expect.poll(()=>messages[0]).toContain('复制失败');
  await page.evaluate(()=>{
    document.getElementById('ai-prompt-text').value='合成单盘提示词';
    document.getElementById('hh-prompt-text').value='合成合婚提示词';
    aiCopyPrompt();
    hhCopyPrompt();
  });
  await expect(page.locator('#ai-prompt-msg')).toContainText('复制失败');
  await expect(page.locator('#hh-prompt-msg')).toContainText('复制失败');
  await page.evaluate(()=>{
    document.execCommand=()=>true;
    aiCopyPrompt();
    hhCopyPrompt();
  });
  await expect(page.locator('#ai-prompt-msg')).toContainText('已复制');
  await expect(page.locator('#hh-prompt-msg')).toContainText('已复制');
  expect(errors).toEqual([]);
});
