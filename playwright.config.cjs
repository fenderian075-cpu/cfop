const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/e2e',timeout:60000,expect:{timeout:12000},fullyParallel:true,
  workers:process.env.CI?2:undefined,retries:0,
  reporter:[['list'],['html',{open:'never'}],['json',{outputFile:'test-results/results.json'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',serviceWorkers:'allow'},
  projects:[
    {name:'chromium-touch',use:{...devices['Pixel 7'],browserName:'chromium'}},
    {name:'webkit-touch',use:{...devices['iPhone 13'],browserName:'webkit'}},
  ],
  webServer:{command:'node scripts/serve.cjs',url:'http://127.0.0.1:4173/cfop/',reuseExistingServer:!process.env.CI,env:{CFOP_E2E:'1'}},
});
