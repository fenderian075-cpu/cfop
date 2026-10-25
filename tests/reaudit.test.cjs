const test=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./app-helper.cjs');
const change=(a,id,value)=>{const el=a.doc.querySelector('#'+id);el.value=value;el.dispatchEvent(new a.w.Event('change'));};
const attempt={id:'remote',caseId:'PT',task:'recognition',result:'correct',source:'automatic',hintUsed:false,responseMs:10,at:100,orientation:0};

test('guided learning shows the comparison before a question and conceals the answer selector',()=>{
 const a=app();try{
  a.doc.querySelector('#startPractice').click();a.doc.querySelector('#practiceChoices button').click();
  assert.equal(a.doc.querySelectorAll('#practiceLesson article').length,2);
  a.doc.querySelector('#practiceChoices button').click();
  assert.equal(a.doc.querySelector('.learning-case-field').hidden,true);
  const wrong=[...a.doc.querySelectorAll('#practiceChoices button')].find(b=>b.textContent!==a.value('practiceCurrent.name[LANG]'));wrong.click();
  assert.ok(a.doc.querySelector('#practiceFeedback').textContent.includes(a.value('practiceCurrent.name[LANG]')));
  assert.equal(a.doc.querySelector('.learning-case-field').hidden,false);
 }finally{a.close();}
});
test('records pause a physical timer and Continue restores it without counting time away',()=>{
 const a=app();try{
  a.doc.querySelector('#startPractice').click();change(a,'practiceTask','execution');a.doc.querySelector('#practiceTimer').click();a.tick(1500);
  a.doc.querySelector('#showRecords').click();assert.equal(a.value('practiceTimerStarted'),null);
  a.tick(10000);a.doc.querySelector('#continueLearning').click();
  assert.equal(a.doc.querySelector('#practiceClock').textContent,'1.5 s');assert.equal(a.doc.querySelector('#practiceSuccess').disabled,false);
  const stored=a.w.localStorage.getItem('cfop-learning-v1'),b=app({storage:{'cfop-learning-v1':stored}});
  try{b.doc.querySelector('#continueLearning').click();assert.equal(b.doc.querySelector('#practiceClock').textContent,'1.5 s');assert.equal(b.value('practiceTimerStarted'),null);}finally{b.close();}
 }finally{a.close();}
});
test('partially entered recall and hints survive reload with the same orientation',()=>{
 const a=app();try{
  a.doc.querySelector('#startPractice').click();change(a,'practiceMode','mixed');change(a,'practiceTask','recall');
  a.doc.querySelector('#practiceHint').click();const input=a.doc.querySelector('#practiceInput');input.value="R U R'";input.dispatchEvent(new a.w.Event('input'));
  a.w.dispatchEvent(new a.w.Event('pagehide'));
  const b=app({storage:{'cfop-learning-v1':a.w.localStorage.getItem('cfop-learning-v1')}});
  try{b.doc.querySelector('#continueLearning').click();assert.equal(b.doc.querySelector('#practiceInput').value,"R U R'");assert.equal(b.value('practiceHinted'),true);assert.equal(b.value('practiceOrientation'),a.value('practiceOrientation'));}finally{b.close();}
 }finally{a.close();}
});
test('import and export include disk events and checks before a delayed storage event',()=>{
 const a=app({storage:{'cfop-prog':'PT'}});try{
  const remote=JSON.parse(a.w.localStorage.getItem('cfop-learning-v1'));remote.attempts=[attempt];a.w.localStorage.setItem('cfop-learning-v1',JSON.stringify(remote));a.w.localStorage.setItem('cfop-prog','PT,PH');
  a.value('learningImport("CFOP:UFo=")');
  assert.equal(JSON.parse(a.w.localStorage.getItem('cfop-learning-v1')).attempts.length,1);assert.equal(a.value('prog.has("PH")'),true);
  const newer={...remote,attempts:[attempt,{...attempt,id:'second'}]};a.w.localStorage.setItem('cfop-learning-v1',JSON.stringify(newer));
  const exported=JSON.parse(Buffer.from(a.value('learningExport()').slice(6),'base64').toString('utf8'));assert.equal(exported.learning.attempts.length,2);
 }finally{a.close();}
});
test('checking a card preserves another tab’s latest checks and propagates unchecking',()=>{
 const a=app({storage:{'cfop-prog':'PT'}});try{
  a.w.localStorage.setItem('cfop-prog','PT,PH');a.doc.querySelector('[data-progress-id="PY"] .chk').click();
  assert.deepEqual(new Set(a.w.localStorage.getItem('cfop-prog').split(',')),new Set(['PT','PH','PY']));
  a.w.localStorage.setItem('cfop-prog','PH,PY');a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:'cfop-prog',newValue:'PH,PY'}));
  assert.equal(a.doc.querySelector('[data-progress-id="PT"] .chk').getAttribute('aria-pressed'),'false');
 }finally{a.close();}
});
test('UTF-8 backup round-trip works in a fresh installation and equivalent key order does not conflict',async()=>{
 const c=await import('../lib/learning.mjs');const reordered=Object.fromEntries(Object.entries(attempt).reverse());assert.equal(c.mergeStates({...c.emptyState(),attempts:[attempt]},{...c.emptyState(),attempts:[reordered]}).attempts.length,1);
 const state={...c.emptyState(),attempts:[{...attempt,id:'記録-🧩'}]};const code='CFOP2:'+Buffer.from(JSON.stringify({schemaVersion:2,learnedIds:['PT'],learning:state})).toString('base64');
 const a=app();try{a.value('learningImport('+JSON.stringify(code)+')');const backup=a.value('learningExport()'),b=app();try{b.value('learningImport('+JSON.stringify(backup)+')');assert.equal(b.value('learningState.attempts[0].id'),'記録-🧩');}finally{b.close();}}finally{a.close();}
});
test('two successes two minutes across UTC midnight do not count as spaced days',async()=>{
 const c=await import('../lib/learning.mjs'),day=86400000,t=Date.UTC(2026,9,24,23,59),last=t+120000;
 const state={...c.emptyState(),attempts:[{...attempt,at:t},{...attempt,id:'b',at:last}]};assert.equal(c.dueAt(state,'PT'),last+day);
});
test('opening physical setup immediately before grading counts as a hint',()=>{
 const a=app();try{a.doc.querySelector('#startPractice').click();change(a,'practiceTask','execution');a.doc.querySelector('#practiceTimer').click();a.tick(1000);a.doc.querySelector('#practiceTimer').click();a.doc.querySelector('#practiceSetup').open=true;a.doc.querySelector('#practiceSuccess').click();assert.equal(a.value('learningState.attempts[0].hintUsed'),true);}finally{a.close();}
});

test('invalid draft protects the original stored data, and blocked storage can export in-memory records',()=>{
 const original=JSON.stringify({schemaVersion:1,catalogVersion:'test',attempts:[],seen:{},resume:{page:'practice',caseId:'PT',mode:'mixed',task:'recognition',at:1,draft:null}}),a=app({storage:{'cfop-learning-v1':original}});
 try{assert.equal(a.value('learningProtected'),true);a.doc.querySelector('#startPractice').click();assert.equal(a.w.localStorage.getItem('cfop-learning-v1'),original);}finally{a.close();}
 const b=app();try{
  b.value('learningSaveAttempt({caseId:"PT",task:"recognition",result:"correct",source:"automatic",hintUsed:false,responseMs:10,orientation:0})');
  b.value('Storage.prototype.getItem=function(){throw new Error("Storage access denied")};');
  const backup=b.value('learningExport()');assert.equal(JSON.parse(Buffer.from(backup.slice(6),'base64').toString()).learning.attempts.length,1);
 }finally{b.close();}
});
test('export respects a different tab unchecking a case before the storage event arrives',()=>{
 const a=app({storage:{'cfop-prog':'PT,PH'}});try{a.w.localStorage.setItem('cfop-prog','PH');const data=JSON.parse(Buffer.from(a.value('learningExport()').slice(6),'base64').toString());assert.deepEqual(data.learnedIds,['PH']);}finally{a.close();}
});
