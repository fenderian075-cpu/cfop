const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./app-helper.cjs');
const core = () => import('../lib/learning.mjs');

test('learning migration preserves every legacy check and retains an untouched backup', () => {
  const original='F0,OE1,PT,XS1,O27';const a=app({storage:{'cfop-prog':original}});
  try {
    assert.equal(a.w.localStorage.getItem('cfop-prog'),original);
    assert.equal(a.w.localStorage.getItem('cfop-prog-backup-v102'),original);
    assert.equal(a.value('prog.has("PT")'),true);
    assert.equal(a.value('learningState.attempts.length'),0);
    a.doc.querySelector('#modeIco').click();
    a.doc.querySelector('#lgIco').click();
    assert.equal(a.value('prog.has("OE1")'),true);
    assert.equal(a.doc.querySelector('[data-progress-id="PT"] .chk').getAttribute('aria-pressed'),'true');
  } finally {a.close();}
});

test('recognition and physical execution have separate schedules; hinted answers do not certify retention',async()=>{
  const c=await core();let s=c.emptyState();const day=86400000,now=1000000;
  const attempt={id:'a',caseId:'PT',task:'recognition',at:now,result:'correct',hintUsed:false,responseMs:1200,source:'automatic',orientation:0};
  s=c.addAttempt(s,attempt);
  assert.equal(c.dueAt(s,'PT','recognition'),now+day);
  assert.equal(c.dueAt(s,'PT','execution'),0);
  s=c.addAttempt(s,{...attempt,id:'b',at:now+day,hintUsed:true});
  assert.equal(c.caseMetrics(s,'PT','recognition').delayedSuccesses,0);
  s=c.addAttempt(s,{...attempt,id:'c',at:now+3*day});
  assert.equal(c.caseMetrics(s,'PT','recognition').delayedSuccesses,1);
  assert.equal(c.caseMetrics(s,'PT','execution').attempts,0);
});

test('backup merge deduplicates events, validates before mutation and rejects unknown schema',async()=>{
  const c=await core();const a=c.addAttempt(c.emptyState(),{id:'a',caseId:'PT',task:'recall',at:100,result:'incorrect',hintUsed:false,responseMs:50,source:'self',orientation:0});
  assert.equal(c.mergeStates(a,a).attempts.length,1);
  assert.throws(()=>c.validateState({...a,schemaVersion:90},new Set(['PT'])),/schema/);
  assert.throws(()=>c.validateState({...a,attempts:[{...a.attempts[0],responseMs:-1}]},new Set(['PT'])),/attempt/);
  assert.equal(a.attempts.length,1);
});

test('legacy and history backup import add records without deleting current progress',()=>{
  const a=app({storage:{'cfop-prog':'PT'}});
  try {
    a.doc.querySelector('#codeBox').value='CFOP:'+a.w.btoa('OE1,F0');a.doc.querySelector('#btnLoad').click();
    assert.equal(a.value('prog.has("PT")&&prog.has("OE1")&&prog.has("F0")'),true);
    a.value('learningSaveAttempt({caseId:"PT",task:"execution",result:"correct",hintUsed:false,responseMs:2000,source:"self",orientation:0})');
    a.doc.querySelector('#btnGen').click();const backup=a.doc.querySelector('#codeBox').value;
    assert.ok(backup.startsWith('CFOP2:'));
    a.doc.querySelector('#btnLoad').click();
    assert.equal(a.value('learningState.attempts.length'),1);
    a.doc.querySelector('#codeBox').value='CFOP2:'+a.w.btoa('{"schemaVersion":900}');a.doc.querySelector('#btnLoad').click();
    assert.equal(a.value('learningState.attempts.length'),1);
    assert.equal(a.value('prog.has("PT")'),true);
  } finally {a.close();}
});

test('learn, compare and mixed practice record an actual answer once; 3D completion records no skill',()=>{
  const a=app();
  try {
    a.doc.querySelector('#startPractice').click();
    a.doc.querySelector('#practiceMode').value='mixed';a.doc.querySelector('#practiceMode').dispatchEvent(new a.w.Event('change'));
    a.value('practiceAnswer(practiceCurrent.id)');
    assert.equal(a.value('learningState.attempts.length'),1);
    a.value('practiceAnswer(practiceCurrent.id)');
    assert.equal(a.value('learningState.attempts.length'),1);
    a.value('n3loadAlg(PLL.T,"T",false,false,"case","pll");n3setStep(14)');
    assert.equal(a.value('learningState.attempts.length'),1);
  } finally {a.close();}
});

test('mode switching preserves a Freeplay cube and does not add another input handler',()=>{
  const a=app();try{
    a.value('fpDo("R")');a.tick();const state=a.value('JSON.stringify(FP.state)');
    a.doc.querySelector('#modeIco').click();a.doc.querySelector('#modeIco').click();
    assert.equal(a.value('JSON.stringify(FP.state)'),state);
    a.value('fpDo("U")');a.tick();assert.equal(a.value('FP.moves'),2);
  }finally{a.close();}
});

test('future stored schema is retained verbatim and cannot be overwritten by a practice result',()=>{
  const original=JSON.stringify({schemaVersion:500,important:'元データ'}),a=app({storage:{'cfop-prog':'PT','cfop-learning-v1':original}});
  try{
    assert.equal(a.value('learningProtected'),true);
    a.doc.querySelector('#startPractice').click();a.value('practiceAnswer("PT")');
    assert.equal(a.w.localStorage.getItem('cfop-learning-v1'),original);
    assert.equal(a.w.localStorage.getItem('cfop-prog'),'PT');
    a.doc.querySelector('#btnGen').click();assert.ok(a.doc.querySelector('#codeBox').value.startsWith('CFOP-RAW:'));
  }finally{a.close();}
});

test('failed import persistence leaves progress and history unchanged',()=>{
  const a=app({storage:{'cfop-prog':'PT'}});try{
    const before=a.w.localStorage.getItem('cfop-learning-v1');
    a.value('Storage.prototype.setItem=function(){throw new Error("quota")};');
    assert.throws(()=>a.value('learningImport("CFOP:UEg=")'),/quota/);
    assert.equal(a.value('prog.has("PH")'),false);assert.equal(a.value('prog.has("PT")'),true);
    assert.equal(a.w.localStorage.getItem('cfop-learning-v1'),before);
  }finally{a.close();}
});

test('recall checks the resulting cube and accepts a final AUF, while invalid tokens are not recorded',()=>{
  const a=app();try{
    a.doc.querySelector('#startPractice').click();a.value('practiceMode="mixed";practiceTask="recall";practiceNew(learningCases.find(c=>c.id==="PT"));practiceOrientation=0');
    a.doc.querySelector('#practiceInput').value=a.value('PLL.T+" U"');a.doc.querySelector('#practiceSubmit').click();
    assert.equal(a.value('learningState.attempts[0].result'),'correct');
    a.value('practiceNew(learningCases.find(c=>c.id==="F0"));practiceOrientation=0');
    a.doc.querySelector('#practiceInput').value='toString';a.doc.querySelector('#practiceSubmit').click();assert.equal(a.value('learningState.attempts.length'),1);
    a.doc.querySelector('#practiceInput').value="F' U' F";a.doc.querySelector('#practiceSubmit').click();assert.equal(a.value('learningState.attempts[1].result'),'correct');
  }finally{a.close();}
});

test('prediction pauses after the first T-perm trigger; reset cancels repeating animation',()=>{
  const a=app();try{
    a.value('n3loadAlg(PLL.T,"T",false,false,"case","pll")');
    a.doc.querySelector('#apPracticeMode').value='predict';a.doc.querySelector('#apPracticeMode').dispatchEvent(new a.w.Event('change'));
    assert.equal(a.value('N3.practiceMode'),'predict');a.value('n3start()');
    for(let i=0;i<6;i++)a.tick();assert.equal(a.value('N3.step'),4);assert.equal(a.value('N3.playing'),false);assert.equal(a.doc.querySelector('#apPrediction').hidden,false);
    a.value('n3PlaySegment(true)');a.tick();a.doc.querySelector('#apreset').click();a.tick();
    assert.equal(a.value('N3.step'),0);assert.equal(a.value('N3.repeat'),false);assert.equal(a.value('N3.playing'),false);
    const yaw=a.value('N3.yaw');a.doc.querySelector('#n3stage + .view-controls [data-l10n-aria="right"]').click();assert.equal(a.value('N3.yaw'),yaw+30);
    a.doc.querySelector('#apSegment').value='2';a.doc.querySelector('#apSegment').dispatchEvent(new a.w.Event('change'));assert.equal(a.value('N3.step'),7);
  }finally{a.close();}
});

test('Home defers hidden lesson grids; first navigation materializes the current language and level',()=>{
  const a=app({materialize:false,language:'en'});try{
    assert.equal(a.doc.querySelectorAll('#ollList .acard').length,0);
    assert.equal(a.doc.querySelectorAll('#f2lList .acard').length,0);
    a.value('goCore("oll")');assert.equal(a.doc.querySelectorAll('#ollList .acard').length,10);
    assert.ok(a.doc.querySelector('#ollSub').textContent.includes('2-Look'));
    a.doc.querySelector('#modeIco').click();assert.equal(a.doc.querySelectorAll('#ollList .acard').length,57);
    assert.equal(a.doc.querySelectorAll('#f2lList .acard').length,0);
    assert.ok(a.doc.querySelector('#hcount').textContent.includes('/119'));
  }finally{a.close();}
});

test('mixed practice stays within known cases and an unsupported concurrent writer is protected',()=>{
  const a=app();try{
    a.doc.querySelector('#startPractice').click();a.value('practiceMode="mixed";practiceNew(learningCases.find(c=>c.id==="PT"));practiceNext()');
    assert.equal(a.value('practiceCurrent.id'),'PT');
    const raw=JSON.stringify({schemaVersion:70,retained:true});a.w.localStorage.setItem('cfop-learning-v1',raw);
    a.value('practiceAnswer(practiceCurrent.id)');assert.equal(a.value('learningProtected'),true);
    assert.equal(a.w.localStorage.getItem('cfop-learning-v1'),raw);
    assert.equal(a.doc.querySelector('#saveLearningBackup').hidden,false);
  }finally{a.close();}
});
