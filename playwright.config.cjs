const {defineConfig}=require('@playwright/test');
const fs=require('node:fs');
const localChrome=process.platform==='win32'&&fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe');
module.exports=defineConfig({
  testDir:'./tests/e2e',timeout:30000,workers:1,fullyParallel:false,
  reporter:[['list'],['json',{outputFile:'test-results/e2e.json'}]],
  use:{baseURL:'http://127.0.0.1:8766',headless:true,channel:localChrome?'chrome':undefined,locale:'zh-CN',timezoneId:'Asia/Shanghai',screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:8766',reuseExistingServer:false,timeout:15000},
});
