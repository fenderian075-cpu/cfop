const {test,expect}=require('@playwright/test');
const {version}=require('../../release.json');
const legacy='PT,OE1,F0,XS1,O27';
test.beforeEach(async({page})=>{page.testErrors=[];page.on('pageerror',e=>page.testErrors.push(e.message));});
test.afterEach(async({page})=>{expect(page.testErrors).toEqual([]);});
async function open(page){
  await page.addInitScript(original=>{if(!localStorage.getItem('test-seeded')){localStorage.setItem('cfop-prog',original);localStorage.setItem('test-seeded','1');}},legacy);
  await page.goto('/cfop/');await expect(page.locator('#learningTitle')).toBeVisible();
}
async function tab(page,id){
  const fab=page.locator('#pillFab');
  if(await page.locator('#tabbar').evaluate(el=>el.classList.contains('mini')))await fab.tap();
  await page.locator('#tabbar button[data-p="'+id+'"]').tap();await expect(page.locator('body')).toHaveAttribute('data-page',id);
}
async function backup(page){await page.locator('#learningBackup summary').click();await page.locator('#btnGen').click();return page.locator('#codeBox').inputValue();}
async function startMixed(page){await page.locator('#startPractice').tap();await page.locator('#practiceCase').selectOption('PT');await page.locator('#practiceMode').selectOption('mixed');}

test('legacy checks survive reload, mode/language changes and all six mobile routes',async({page},info)=>{
  await open(page);
  expect(await page.evaluate(()=>localStorage.getItem('cfop-prog-backup-v102'))).toBe(legacy);
  for(const viewport of [{width:320,height:568},{width:375,height:667},{width:740,height:390}]){
    await page.setViewportSize(viewport);
    for(const id of ['basic','cross','f2l','oll','pll','home']){
      await tab(page,id);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  await page.locator('#modeIco').tap();await page.locator('#lgIco').tap();await tab(page,'pll');
  await expect(page.locator('[data-progress-id="PT"] .chk')).toHaveAttribute('aria-pressed','true');
  await page.locator('#modeIco').tap();await tab(page,'oll');
  await expect(page.locator('[data-progress-id="OE1"] .chk')).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('[data-progress-id="OE1"] .chk')).toHaveAttribute('aria-pressed','true');
  await info.attach('responsive.png',{body:await page.screenshot(),contentType:'image/png'});
});

test('learn → compare → mixed; actual answers, physical timer and backup round-trip',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.75;});
  await open(page);await page.locator('#startPractice').tap();
  await expect(page.locator('#practiceLesson')).toContainText('Tパーム');
  await page.locator('#practiceChoices button').click();await expect(page.locator('#practiceLesson article')).toHaveCount(2);await page.locator('#practiceChoices button').click();await expect(page.locator('#practiceCase')).toBeHidden();await page.locator('#practiceChoices').getByRole('button',{name:'Tパーム',exact:true}).click();
  await expect(page.locator('#practiceFeedback')).toContainText('保存');
  await page.locator('#practiceCase').selectOption('PT');await page.locator('#practiceMode').selectOption('mixed');
  await page.locator('#practiceChoices').getByRole('button',{name:'Tパーム',exact:true}).click();
  await page.locator('#practiceTask').selectOption('execution');
  await expect(page.locator('#practiceSuccess')).toBeDisabled();
  await page.locator('#practiceTimer').click();await expect(page.locator('#practiceClock')).not.toHaveText('0.0 s');
  await page.locator('#practiceTimer').click();await page.locator('#practiceSuccess').click();
  const exported=await backup(page);expect(exported.startsWith('CFOP2:')).toBe(true);
  const decoded=JSON.parse(Buffer.from(exported.slice(6),'base64').toString());
  expect(decoded.learning.attempts).toHaveLength(3);
  expect(decoded.learning.attempts.filter(a=>a.task==='execution'&&a.source==='self')).toHaveLength(1);
  await page.locator('#btnLoad').click();await page.locator('#btnGen').click();
  expect(JSON.parse(Buffer.from((await page.locator('#codeBox').inputValue()).slice(6),'base64')).learning.attempts).toHaveLength(3);
  await page.locator('#codeBox').fill('CFOP:'+Buffer.from('PH').toString('base64'));await page.locator('#btnLoad').click();
  expect(await page.evaluate(()=>localStorage.getItem('cfop-prog'))).toContain('PT');
  expect(await page.evaluate(()=>localStorage.getItem('cfop-prog'))).toContain('PH');
  await page.reload();await expect(page.locator('#continueLearning')).toBeEnabled();
});

test('T-perm continuous playback, prediction, repetition, reset, and tap-only orbit',async({page})=>{
  await open(page);await startMixed(page);await page.locator('#practice3D').click();await expect(page.locator('#pp')).toHaveClass(/open/);
  await page.locator('#apPracticeSettings summary').click();
  await page.locator('#apSpeed').selectOption('2');await page.locator('#applay').click();
  await expect(page.locator('#apslider')).toHaveValue('14');await expect(page.locator('#n3stepcount')).toContainText('14 / 14');
  await page.locator('#apreset').click();await expect(page.locator('#apslider')).toHaveValue('0');
  await page.locator('#apPracticeMode').selectOption('predict');await page.locator('#applay').click();
  await expect(page.locator('#apPrediction')).toBeVisible();await expect(page.locator('#apslider')).toHaveValue('4');
  const before=await page.locator('#n3orbit').getAttribute('style');
  await page.locator('#pp .view-controls button[data-l10n-aria="right"]').click();expect(await page.locator('#n3orbit').getAttribute('style')).not.toBe(before);
  await page.locator('#apRepeat').click();await expect(page.locator('#apRepeat')).toHaveAttribute('aria-pressed','true');
  await page.locator('#apreset').click();await expect(page.locator('#apRepeat')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#apslider')).toHaveValue('0');
  await page.locator('#ppmin').click();await page.locator('#pprestore').click();await expect(page.locator('#pp')).toHaveClass(/open/);await page.locator('#ppclose').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('cfop-learning-v1')).attempts.length)).toBe(0);
});

test('swipe navigation and Freeplay remain functional after mode switches',async({page})=>{
  await open(page);const box=await page.locator('#tabbar').boundingBox();
  await page.mouse.move(box.x+box.width*.65,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.3,box.y+box.height/2,{steps:8});await page.mouse.up();
  await expect(page.locator('body')).toHaveAttribute('data-page','basic');await tab(page,'home');
  // Real pointer clicks remain available in the button control mode.
  if(await page.locator('#fpSwipe').isVisible())await page.locator('#fpCtlMode').click();
  await page.locator('#fpBtns button[data-tok="R"]').click();await expect(page.locator('#fpCount')).toHaveText('1手');
  await page.locator('#modeIco').click();await page.locator('#modeIco').click();
  await expect(page.locator('#fpCount')).toHaveText('1手');await page.locator('#fpSolve').click();await page.locator('#fsGo').click();
  await expect(page.locator('#fpSolveBox')).toContainText('ソルブ完了');
});

test('two tabs merge distinct practice events without losing learned checks',async({page,context})=>{
  await open(page);await startMixed(page);
  const second=await context.newPage();await second.goto('/cfop/');await startMixed(second);
  await page.locator('#practiceChoices').getByRole('button',{name:'Tパーム',exact:true}).click();
  await second.locator('#practiceChoices').getByRole('button',{name:'Tパーム',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cfop-learning-v1')).attempts.length)).toBe(2);
  await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('cfop-learning-v1')).attempts.length)).toBe(2);
});

test('old cached shell upgrades after both tabs close; progress and unrelated caches survive',async({context})=>{
  let first=await context.newPage();await first.goto('/cfop/__upgrade.html');await first.locator('#installOld').click();await expect(first.locator('#upgradeStatus')).toHaveText('old-ready');
  await first.reload();await expect(first.locator('#oldShell')).toBeVisible();
  let second=await context.newPage();await second.goto('/cfop/');await expect(second.locator('#oldShell')).toBeVisible();
  await first.locator('#installNew').click();await expect(first.locator('#upgradeStatus')).toHaveText('new-waiting');
  await first.close();await second.close();
  const fresh=await context.newPage();await fresh.goto('/__upgrade-status.html');
  await expect.poll(()=>fresh.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration('/cfop/');return !!r&&!r.waiting&&r.active?.scriptURL.endsWith('/sw.js');})).toBe(true);
  await fresh.goto('/cfop/');await expect(fresh.locator('#learningTitle')).toBeVisible();await expect(fresh.locator('html')).toHaveAttribute('data-app-version',String(version));
  expect(await fresh.evaluate(()=>localStorage.getItem('cfop-prog'))).toContain('PT');
  expect(await fresh.evaluate(()=>caches.keys())).toContain('unrelated-test-app');
  await context.setOffline(true);await fresh.reload();await expect(fresh.locator('#learningTitle')).toBeVisible();await context.setOffline(false);
});

test('action-to-paint measurements on throttled Chromium are stored locally',async({page,browserName},info)=>{
  await open(page);
  if(browserName==='chromium'){const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  await page.locator('#modeIco').tap();await page.locator('#lgIco').tap();await tab(page,'f2l');await tab(page,'home');await page.locator('#showRecords').click();
  await page.locator('#learningRecords summary[data-l10n="performance"]').click();await expect(page.locator('#performanceSamples')).toContainText('mode-change');
  await info.attach('action-to-paint.json',{body:Buffer.from(await page.locator('#performanceSamples').textContent()),contentType:'application/json'});
});


test('recall draft and paused physical timer restore after reload; backup restores in a fresh browser context',async({page,browser},info)=>{
  await open(page);await startMixed(page);await page.locator('#practiceTask').selectOption('recall');
  await page.locator('#practiceHint').click();await page.locator('#practiceInput').fill("R U R'");
  const orientation=await page.locator('#practiceDiagram').innerHTML();
  await page.reload();await page.locator('#continueLearning').click();
  await expect(page.locator('#practiceInput')).toHaveValue("R U R'");expect(await page.locator('#practiceDiagram').innerHTML()).toBe(orientation);
  await expect(page.locator('#practiceLesson')).toContainText('ヘッドライト');
  await page.locator('#practiceTask').selectOption('execution');await page.locator('#practiceTimer').click();await expect(page.locator('#practiceClock')).not.toHaveText('0.0 s');
  await page.locator('#showRecords').click();await page.locator('#continueLearning').click();
  const paused=await page.locator('#practiceClock').textContent();await expect(page.locator('#practiceSuccess')).toBeEnabled();
  await page.reload();await page.locator('#continueLearning').click();await expect(page.locator('#practiceClock')).toHaveText(paused);
  await page.locator('#practiceSetup summary').click();await page.locator('#practiceSuccess').click();
  await page.locator('#showRecords').click();await page.locator('#recordsBackup').click();
  const exported=await page.locator('#codeBox').inputValue();
  const expected=JSON.parse(Buffer.from(exported.slice(6),'base64').toString('utf8'));
  expect(expected.learning.attempts).toHaveLength(1);expect(expected.learning.attempts[0].hintUsed).toBe(true);
  const clean=await browser.newContext({...info.project.use,baseURL:'http://127.0.0.1:4173'});
  try{
    const restored=await clean.newPage();await restored.goto('/cfop/');await expect(restored.locator('#continueLearning')).toBeDisabled();
    await restored.locator('#learningBackup summary').click();await restored.locator('#codeBox').fill(exported);await restored.locator('#btnLoad').click();
    await restored.locator('#btnGen').click();const actual=JSON.parse(Buffer.from((await restored.locator('#codeBox').inputValue()).slice(6),'base64').toString('utf8'));
    expect(actual.learnedIds.sort()).toEqual(expected.learnedIds.sort());expect(actual.learning).toEqual(expected.learning);
    await restored.locator('#continueLearning').click();await expect(restored.locator('#practiceClock')).toHaveText(paused);await expect(restored.locator('#practiceSuccess')).toBeDisabled();
    await info.attach('fresh-restoration.png',{body:await restored.screenshot(),contentType:'image/png'});
  }finally{await clean.close();}
});

test('manual checks synchronize between tabs, including unchecking',async({page,context})=>{
  await open(page);await tab(page,'pll');const second=await context.newPage();await second.goto('/cfop/#pll');
  await page.locator('[data-progress-id="PH"] .chk').click();await expect(second.locator('[data-progress-id="PH"] .chk')).toHaveAttribute('aria-pressed','true');
  await second.locator('[data-progress-id="PY"] .chk').click();await expect(page.locator('[data-progress-id="PY"] .chk')).toHaveAttribute('aria-pressed','true');
  await second.locator('[data-progress-id="PT"] .chk').click();await expect(page.locator('[data-progress-id="PT"] .chk')).toHaveAttribute('aria-pressed','false');
});
