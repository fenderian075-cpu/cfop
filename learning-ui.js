/* Browser adapter for the pure ES modules compiled into CFOPLearning. */
const LEARNING_KEY='cfop-learning-v1';
const learningCases=CFOPLearning.createCatalog({F2L,OLL,OLL2E,PLL,F2LSIMPLE,PLL2,OLLG,PLLG,CHUNKS});
const learningKnownIds=new Set([...learningCases.map(c=>c.id),'SOLVE']);
let learningState=CFOPLearning.emptyState(),learningProtected=false,learningStorageError=false,learningRaw=null;
const learningText=(key,args={})=>CFOPLearning.text(key,LANG,args);
function learningLoad(){
  try{
    learningRaw=localStorage.getItem(LEARNING_KEY);
    if(learningRaw!==null)learningState=CFOPLearning.validateState(JSON.parse(learningRaw),learningKnownIds);
    const legacy=localStorage.getItem('cfop-prog');
    if(legacy!==null&&localStorage.getItem('cfop-prog-backup-v102')===null)localStorage.setItem('cfop-prog-backup-v102',legacy);
    if(learningRaw===null)localStorage.setItem(LEARNING_KEY,JSON.stringify(learningState));
  }catch(e){
    if(e instanceof SyntaxError||/schema|Invalid learning|Invalid seen|Invalid resume/.test(e.message))learningProtected=true;else learningStorageError=true;
  }
}
learningLoad();
function learningPersist(){
  if(learningProtected)return false;
  try{localStorage.setItem(LEARNING_KEY,JSON.stringify(learningState));learningStorageError=false;return true;}
  catch(e){learningStorageError=true;return false;}
}
function learningSaveAttempt(data){
  if(learningProtected){learningRefresh();return false;}
  const attempt={...data,id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2),at:Date.now()};
  const candidate=CFOPLearning.addAttempt(learningState,attempt);
  CFOPLearning.validateState(candidate,learningKnownIds);
  learningState=candidate;learningPersist();learningRefresh();return true;
}
function learningSeen(id){
  if(!learningKnownIds.has(id)||learningProtected)return;
  learningState={...learningState,seen:{...learningState.seen,[id]:Date.now()}};learningPersist();learningRefreshDashboard();
}
function learningRememberPage(page){
  if(learningProtected||!['basic','cross','f2l','oll','pll'].includes(page))return;
  learningState={...learningState,resume:{page,at:Date.now()}};learningPersist();learningRefreshDashboard();
}
function learningRememberPractice(){
  if(!practiceCurrent||learningProtected)return;
  learningState={...learningState,resume:{page:'practice',caseId:practiceCurrent.id,mode:practiceMode,task:practiceTask,at:Date.now()}};
  learningPersist();learningRefreshDashboard();
}
function learningExport(){
  if(learningProtected)return 'CFOP-RAW:'+btoa(unescape(encodeURIComponent(JSON.stringify({legacy:localStorage.getItem('cfop-prog'),raw:learningRaw}))));
  return 'CFOP2:'+btoa(JSON.stringify({schemaVersion:2,learnedIds:[...prog],learning:learningState}));
}
function learningImport(code){
  if(typeof code!=='string'||code.length>5000000)throw new Error('Oversize backup');
  if(learningProtected)throw new Error('Protected storage');
  let learned,next=learningState;
  if(code.startsWith('CFOP:'))learned=atob(code.slice(5)).split(',').filter(Boolean);
  else if(code.startsWith('CFOP2:')){
    const value=JSON.parse(atob(code.slice(6)));
    if(value.schemaVersion!==2||!Array.isArray(value.learnedIds))throw new Error('Unsupported backup schema');
    learned=value.learnedIds;next=CFOPLearning.mergeStates(learningState,CFOPLearning.validateState(value.learning,learningKnownIds));
    CFOPLearning.validateState(next,learningKnownIds);
  }else throw new Error('Unknown backup');
  if(learned.some(id=>typeof id!=='string'||!isKnownProgressId(id)))throw new Error('Unknown progress ID');
  // Validate the entire import before changing either the checked IDs or history.
  // The single history write is performed first; a failed quota write changes nothing in memory.
  const merged=new Set([...prog,...learned]);
  const before=localStorage.getItem(LEARNING_KEY);
  localStorage.setItem(LEARNING_KEY,JSON.stringify(next));
  try{localStorage.setItem('cfop-prog',[...merged].join(','));}
  catch(e){if(before===null)localStorage.removeItem(LEARNING_KEY);else localStorage.setItem(LEARNING_KEY,before);throw e;}
  learningState=next;prog.clear();merged.forEach(id=>prog.add(id));
  document.querySelectorAll('[data-progress-id]').forEach(el=>{el.classList.toggle('done',prog.has(el.dataset.progressId));syncProgressControl(el,el.dataset.progressId);});
  refreshCounts();learningRefresh();
}
function learningActiveCases(){return learningCases.filter(c=>mode==='a'?c.kind!=='olledge':c.simple);}
function activeProgressIds(){return [...learningActiveCases().map(c=>c.id),...(mode==='s'?['XS1','XS2','XS3']:['XA1','XA2','XA3'])];}
function learningRefreshDashboard(){
  const due=CFOPLearning.reviewQueue(learningState,learningActiveCases(),prog,Date.now());
  $('#learningDue').textContent=due.length?learningText('due',{count:due.length}):learningText('emptyDue');
  $('#continueLearning').disabled=!learningState.resume;
  const status=$('#learningStorageStatus');status.hidden=!learningStorageError&&!learningProtected;
  status.textContent=learningProtected?learningText('protected'):learningText('storageError');
}
function learningLocalize(){
  document.querySelectorAll('[data-l10n]').forEach(el=>{el.textContent=learningText(el.dataset.l10n);});
  $('#learningVersion').textContent=learningText('version',{app:document.documentElement.dataset.appVersion||'103',catalog:CFOPLearning.CATALOG_VERSION});
  for(const id of ['btnGen','btnCopy','btnLoad'])$('#'+id).textContent=LANG==='en'?{btnGen:'Export backup',btnCopy:'Copy',btnLoad:'Import and merge'}[id]:{btnGen:'コードを書き出す',btnCopy:'コピー',btnLoad:'読み込んで追加'}[id];
  $('#codeBox').setAttribute('aria-label',learningText('backupLabel'));
  $('#codeBox').placeholder=LANG==='en'?'Paste a CFOP: or CFOP2: code':'CFOP: または CFOP2: コードを入力';
  if(!$('#learningUpdate').hidden)$('#learningUpdate').textContent=learningText('update');
  document.querySelectorAll('[data-l10n-aria]').forEach(el=>{el.setAttribute('aria-label',learningText(el.dataset.l10nAria));el.title=learningText(el.dataset.l10nAria);});
}
function learningRecordsRender(){
  const filter=$('#recordCase'),selected=filter.value;filter.replaceChildren();
  const all=document.createElement('option');all.value='';all.textContent=learningText('allCases');filter.appendChild(all);
  for(const c of learningCases){const o=document.createElement('option');o.value=c.id;o.textContent=c.name[LANG];filter.appendChild(o);}filter.value=selected;
  const caseId=filter.value||null;
  $('#learningHistoryEmpty').hidden=learningState.attempts.length>0;
  const metrics=$('#learningMetrics');metrics.replaceChildren();
  for(const task of CFOPLearning.TASKS){
    const m=CFOPLearning.caseMetrics(learningState,caseId,task),article=document.createElement('article');
    const h=document.createElement('h3');h.textContent=learningText(task);article.appendChild(h);
    const dl=document.createElement('dl');
    for(const [key,value] of [['attempts',m.attempts],['accuracy',m.correct+' / '+m.attempts],['delayed',m.delayedSuccesses],['average',m.averageMs===null?'—':(m.averageMs/1000).toFixed(1)+' s']]){
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=learningText(key);dd.textContent=value;dl.append(dt,dd);
    }
    article.appendChild(dl);metrics.appendChild(article);
  }
  const list=$('#learningRecent');list.replaceChildren();
  for(const a of learningState.attempts.filter(a=>!caseId||a.caseId===caseId).slice(-10).reverse()){
    const item=document.createElement('li'),c=learningCases.find(c=>c.id===a.caseId);
    item.textContent=[new Date(a.at).toLocaleDateString(LANG==='en'?'en-GB':'ja-JP'),c?c.name[LANG]:learningText('solve'),learningText(a.task),learningText(a.result==='correct'?'correct':'incorrect'),learningText(a.source==='self'?'selfLabel':'autoLabel'),a.hintUsed?learningText('hint'):null,(a.responseMs/1000).toFixed(1)+' s'].filter(Boolean).join(' · ');
    const due=CFOPLearning.dueAt(learningState,a.caseId,a.task),small=document.createElement('small');small.textContent=learningText('dueNext')+': '+new Date(due).toLocaleString(LANG==='en'?'en-GB':'ja-JP');item.appendChild(small);list.appendChild(item);
  }
  const caseRows=$('#learningCaseRows');caseRows.replaceChildren();
  for(const c of learningCases.filter(c=>learningState.seen[c.id]||prog.has(c.id)||learningState.attempts.some(a=>a.caseId===c.id))){
    const item=document.createElement('li'),button=document.createElement('button'),detail=document.createElement('span');button.className='btn';button.textContent=c.name[LANG];button.addEventListener('click',()=>{practiceMode='mixed';practiceBegin(c.id);});
    const attempts=learningState.attempts.filter(a=>a.caseId===c.id);
    const due=CFOPLearning.dueAt(learningState,c.id,'recognition');
    detail.textContent=attempts.length?learningText('attempts')+' '+attempts.length+' · '+learningText('dueNext')+': '+(due?new Date(due).toLocaleDateString(LANG==='en'?'en-GB':'ja-JP'):learningText('dueNow')):learningText(prog.has(c.id)?'checkedOnly':'seenOnly');
    item.append(button,detail);caseRows.appendChild(item);
  }
  $('#performanceSamples').textContent=JSON.stringify(learningPerformance,null,2);
}
function learningRefresh(){learningLocalize();learningRefreshDashboard();if(!$('#learningRecords').hidden)learningRecordsRender();if(practiceCurrent&&!$('#practiceSession').hidden)practiceRender();if(typeof n3PracticeRefresh==='function')n3PracticeRefresh();}
function learningScroll(id){requestAnimationFrame(()=>{$('#'+id).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});$('#'+id).querySelector('h2')?.focus({preventScroll:true});});}
function learningOpenRecords(){goCore('home');$('#learningRecords').hidden=false;$('#practiceSession').hidden=true;learningRecordsRender();learningScroll('learningRecords');}
let practiceCurrent=null,practiceMode='learn',practiceTask='recognition',practiceOrientation=0,practiceStarted=0,practiceAnswered=false,practiceHinted=false,practiceRevealed=false,practiceComparing=false,practiceResult=null;
let practiceTimerStarted=null,practiceTimerElapsed=null,practiceTimerInterval=null,practiceReview=false,practiceReviewDone=new Set();
function practicePair(c){
  const pairs={PT:'PY',PY:'PT',PUa:'PUb',PUb:'PUa',PH:'PZ',PZ:'PH',O26:'O27',O27:'O26',OE1:'OE2',OE2:'OE3',OE3:'OE1'};
  return learningCases.find(x=>x.id===pairs[c.id])||learningActiveCases().find(x=>x.kind===c.kind&&x.id!==c.id)||c;
}
function practiceCaseOptions(){
  const select=$('#practiceCase'),selected=practiceCurrent?.id||select.value||'PT';select.replaceChildren();
  const cases=learningActiveCases();
  // A restored advanced case stays selectable even if the global course is Simple.
  if(practiceCurrent?.alg&&!cases.some(c=>c.id===practiceCurrent.id))cases.push(practiceCurrent);
  for(const c of cases){const o=document.createElement('option');o.value=c.id;o.textContent=c.name[LANG];select.appendChild(o);}
  select.value=selected;
}
function practiceBegin(id='PT',{review=false,resume=false}={}){
  goCore('home');$('#learningRecords').hidden=true;$('#practiceSession').hidden=false;
  practiceReview=review;if(!resume)practiceReviewDone=new Set();
  practiceCurrent=learningCases.find(c=>c.id===id)||learningCases.find(c=>c.id==='PT');
  if(review)practiceMode='mixed';
  if(resume&&learningState.resume?.page==='practice'){
    practiceMode=learningState.resume.mode||'learn';practiceTask=learningState.resume.task||'recognition';
  }
  practiceNew(practiceCurrent);learningScroll('practiceSession');
}
function practiceNew(c){
  clearInterval(practiceTimerInterval);practiceTimerInterval=null;practiceTimerStarted=null;practiceTimerElapsed=null;
  practiceCurrent=c;practiceOrientation=practiceMode==='mixed'?Math.floor(Math.random()*4):0;
  practiceStarted=performance.now();practiceAnswered=false;practiceHinted=false;practiceRevealed=false;practiceResult=null;practiceComparing=practiceMode==='compare';
  $('#practiceInput').value='';$('#practiceClock').textContent='0.0 s';$('#practiceFeedback').textContent='';
  learningSeen(c.id);learningRememberPractice();practiceRender();
}
function practiceDiagram(c,orientation=0){
  let state=caseState(c.alg);for(let i=0;i<orientation;i++)state=ap(state,M.U);
  return c.kind==='f2l'?isoSVG(state):llSVG(state,c.kind==='pll'?'pll':'oll',c.kind==='olledge');
}
function practiceRender(){
  if(!practiceCurrent)return;
  practiceCaseOptions();$('#practiceMode').value=practiceMode;$('#practiceTask').value=practiceTask;
  const c=practiceCurrent,physical=['execution','solve'].includes(practiceTask),example=practiceMode==='learn'&&!physical,comparison=practiceMode==='compare'&&practiceComparing&&!physical;
  $('#practiceLesson').replaceChildren();
  if(example||comparison){
    const cases=comparison?[c,practicePair(c)]:[c];
    for(const item of cases){const article=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),figure=document.createElement('div');h.textContent=item.name[LANG];p.textContent=item.concept[LANG];figure.innerHTML=practiceDiagram(item);article.append(h,figure,p);if(example){const alg=document.createElement('p');alg.className='mono';alg.textContent=item.alg;article.appendChild(alg);}$('#practiceLesson').appendChild(article);}
  }
  $('#practiceDiagram').innerHTML=practiceTask==='solve'||example||comparison?'':practiceDiagram(c,practiceOrientation);
  $('#practicePrompt').textContent=practiceTask==='solve'?learningText('solve'):example||comparison?'':learningText(practiceTask);
  const choices=$('#practiceChoices');choices.replaceChildren();
  if((example||comparison)&&!physical){
    const button=document.createElement('button');button.className='btn pri';button.textContent=learningText(comparison?'try':'advance');button.addEventListener('click',()=>{if(example)practiceMode='compare';practiceComparing=false;practiceStarted=performance.now();learningRememberPractice();practiceRender();});choices.appendChild(button);
  }else if(practiceTask==='recognition'){
    const pair=practicePair(c),third=learningActiveCases().find(x=>x.kind===c.kind&&x.id!==c.id&&x.id!==pair.id);
    const options=(practiceMode==='compare'?[c,pair]:[c,pair,...(third?[third]:[])]).filter((x,i,list)=>list.findIndex(y=>y.id===x.id)===i).sort((a,b)=>a.id.localeCompare(b.id));
    for(const option of options){const b=document.createElement('button');b.className='btn';b.textContent=option.name[LANG];b.disabled=practiceAnswered;b.addEventListener('click',()=>practiceAnswer(option.id));choices.appendChild(b);}
  }
  $('#practiceRecall').hidden=practiceTask!=='recall'||example||comparison;
  $('#practiceInput').disabled=practiceAnswered;$('#practiceSubmit').disabled=practiceAnswered;
  $('#practicePhysical').hidden=!physical;$('#practiceSuccess').disabled=practiceAnswered||practiceTimerElapsed===null||practiceTimerStarted!==null;$('#practiceFailure').disabled=$('#practiceSuccess').disabled;
  $('#practiceTimer').disabled=practiceAnswered;$('#practiceTimer').textContent=learningText(practiceTimerStarted===null?'startTimer':'stopTimer');
  $('#practiceNext').disabled=practiceTimerStarted!==null;
  for(const id of ['practiceMode','practiceTask','practiceCase'])$('#'+id).disabled=practiceTimerStarted!==null;
  $('#practiceHint').disabled=practiceTask==='solve';$('#practiceReveal').disabled=practiceTask==='solve';$('#practice3D').disabled=practiceTask==='solve';
  if(practiceHinted&&!example&&!comparison){const p=document.createElement('p');p.textContent=c.concept[LANG];$('#practiceLesson').appendChild(p);}
  if(practiceRevealed&&!example&&!comparison){const p=document.createElement('p');p.className='mono';p.textContent=c.alg;$('#practiceLesson').appendChild(p);}
  if(practiceResult)$('#practiceFeedback').textContent=learningText(practiceResult==='correct'?'correct':'incorrect')+' · '+learningText('recorded');
  // Reapply keyed messages only. No text matching or observer-driven translation.
  document.querySelectorAll('#practiceSession [data-l10n]').forEach(el=>{if(el.id!=='practiceTimer')el.textContent=learningText(el.dataset.l10n);});
}
function practiceRecord(result,source){
  if(practiceAnswered||!practiceCurrent)return;
  const saved=learningSaveAttempt({caseId:practiceTask==='solve'?'SOLVE':practiceCurrent.id,task:practiceTask,result,source,hintUsed:practiceHinted||practiceRevealed,responseMs:practiceTimerElapsed??Math.max(0,performance.now()-practiceStarted),orientation:practiceOrientation});
  if(!saved){$('#practiceFeedback').textContent=learningText('protected');return;}
  practiceAnswered=true;practiceResult=result;practiceReviewDone.add(practiceCurrent.id);practiceRender();
}
function practiceAnswer(id){practiceRecord(id===practiceCurrent?.id?'correct':'incorrect','automatic');}
function practiceRecallSubmit(){
  if(practiceAnswered)return;
  const parsed=parseAlg($('#practiceInput').value);if(parsed.invalid.length||!parsed.valid.length){$('#practiceFeedback').textContent=learningText('inputInvalid');return;}
  let state=caseState(practiceCurrent.alg);for(let i=0;i<practiceOrientation;i++)state=ap(state,M.U);state=run(state,parsed.valid.join(' '));
  const sameColor=(s,i)=>Math.floor(s[i]/9)===Math.floor(i/9);
  const lower=state.every((_,i)=>!((i>=27&&i<36)||(i>=9&&i%9>=3))||sameColor(state,i));
  let correct;
  if(practiceCurrent.kind==='pll'){
    correct=false;for(let i=0;i<4;i++){if(state.every((_,j)=>sameColor(state,j)))correct=true;state=ap(state,M.U);}
  }else if(practiceCurrent.kind==='f2l')correct=lower;
  else if(practiceCurrent.kind==='olledge')correct=lower&&[1,3,5,7].every(i=>Math.floor(state[i]/9)===0);
  else correct=lower&&state.slice(0,9).every(v=>Math.floor(v/9)===0);
  practiceRecord(correct?'correct':'incorrect','automatic');
}
function practiceNext(){
  if(practiceTimerStarted!==null)return;
  let next;
  if(practiceReview){next=CFOPLearning.reviewQueue(learningState,learningActiveCases(),prog,Date.now(),practiceTask).find(c=>!practiceReviewDone.has(c.id));if(!next){$('#practiceFeedback').textContent=learningText('emptyDue');return;}}
  else if(practiceMode==='compare'){const pair=practicePair(practiceCurrent);next=Math.random()<.5?practiceCurrent:pair;}
  else{const cases=learningActiveCases().filter(c=>c.id!==practiceCurrent.id);next=practiceMode==='learn'?practicePair(practiceCurrent):cases[Math.floor(Math.random()*cases.length)];}
  practiceNew(next||practiceCurrent);
}
function practiceTimerToggle(){
  if(practiceTimerStarted===null){
    practiceTimerElapsed=null;practiceTimerStarted=performance.now();
    practiceTimerInterval=setInterval(()=>{$('#practiceClock').textContent=((performance.now()-practiceTimerStarted)/1000).toFixed(1)+' s';},100);
  }else{
    practiceTimerElapsed=Math.max(0,performance.now()-practiceTimerStarted);practiceTimerStarted=null;clearInterval(practiceTimerInterval);practiceTimerInterval=null;$('#practiceClock').textContent=(practiceTimerElapsed/1000).toFixed(1)+' s';
  }
  practiceRender();
}
const learningPerformance={actions:[],longTasks:[]};
function learningMeasure(name,action){
  const started=performance.now();const result=action();const handlerMs=performance.now()-started;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{learningPerformance.actions.push({name,handlerMs:Math.round(handlerMs),actionToPaintMs:Math.round(performance.now()-started)});if(learningPerformance.actions.length>30)learningPerformance.actions.shift();}));return result;
}
try{if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask'))new PerformanceObserver(list=>{for(const e of list.getEntries())learningPerformance.longTasks.push(Math.round(e.duration));if(learningPerformance.longTasks.length>30)learningPerformance.longTasks.splice(0,learningPerformance.longTasks.length-30);}).observe({type:'longtask',buffered:true});}catch(e){}
$('#startPractice').addEventListener('click',()=>practiceBegin());
$('#startReview').addEventListener('click',()=>{const due=CFOPLearning.reviewQueue(learningState,learningActiveCases(),prog,Date.now());practiceBegin(due[0]?.id||'PT',{review:due.length>0});if(!due.length)$('#practiceFeedback').textContent=learningText('emptyDue');});
$('#continueLearning').addEventListener('click',()=>{const r=learningState.resume;if(!r)return;if(r.page==='practice')practiceBegin(r.caseId,{resume:true});else go(r.page);});
$('#learnNotation').addEventListener('click',()=>go('basic'));$('#learnCFOP').addEventListener('click',()=>go('cross'));$('#showRecords').addEventListener('click',learningOpenRecords);
$('#closePractice').addEventListener('click',()=>{if(practiceTimerStarted!==null)practiceTimerToggle();$('#practiceSession').hidden=true;$('#startPractice').focus();});$('#closeRecords').addEventListener('click',()=>{$('#learningRecords').hidden=true;$('#showRecords').focus();});
$('#practiceMode').addEventListener('change',e=>{practiceMode=e.target.value;practiceReview=false;practiceNew(practiceCurrent);});
$('#practiceTask').addEventListener('change',e=>{practiceTask=e.target.value;practiceReview=false;practiceNew(practiceCurrent);});
$('#practiceCase').addEventListener('change',e=>{practiceReview=false;practiceNew(learningCases.find(c=>c.id===e.target.value));});
$('#practiceNext').addEventListener('click',practiceNext);$('#practiceSubmit').addEventListener('click',practiceRecallSubmit);$('#practiceInput').addEventListener('keydown',e=>{if(e.key==='Enter')practiceRecallSubmit();});
$('#practiceHint').addEventListener('click',()=>{practiceHinted=true;practiceRender();});$('#practiceReveal').addEventListener('click',()=>{practiceHinted=true;practiceRevealed=true;practiceRender();});
$('#practice3D').addEventListener('click',()=>{practiceHinted=true;practiceRender();n3loadAlg(practiceCurrent.alg,practiceCurrent.name[LANG],false,false,'case',practiceCurrent.kind);openPP();});
$('#practiceTimer').addEventListener('click',practiceTimerToggle);$('#practiceSuccess').addEventListener('click',()=>practiceRecord('correct','self'));$('#practiceFailure').addEventListener('click',()=>practiceRecord('incorrect','self'));
$('#recordCase').addEventListener('change',learningRecordsRender);
window.addEventListener('storage',event=>{
  if(event.key!==LEARNING_KEY||!event.newValue||learningProtected)return;
  try{const remote=CFOPLearning.validateState(JSON.parse(event.newValue),learningKnownIds),merged=CFOPLearning.mergeStates(learningState,remote);learningState=merged;if(JSON.stringify(merged)!==event.newValue)learningPersist();learningRefresh();}catch(e){learningStorageError=true;learningRefreshDashboard();}
});
window.addEventListener('pagehide',()=>learningPersist());
learningLocalize();learningRefreshDashboard();
function learningViewControls(stageId,view){
  const stage=$('#'+stageId),controls=document.createElement('div');controls.className='view-controls';controls.dataset.learningRoot='';controls.setAttribute('role','group');controls.dataset.l10nAria='viewControls';controls.setAttribute('aria-label',learningText('viewControls'));
  for(const [key,symbol,dx,dy] of [['left','←',-30,0],['right','→',30,0],['up','↑',0,-20],['down','↓',0,20],['back','↶',180,0]]){
    const button=document.createElement('button');button.className='btn';button.type='button';button.textContent=symbol;button.dataset.l10nAria=key;button.setAttribute('aria-label',learningText(key));
    button.addEventListener('click',()=>{const state=stageId==='n3stage'?N3:FP;state.yaw+=dx;state.pitch=Math.max(-85,Math.min(85,state.pitch+dy));view();});controls.appendChild(button);
  }
  if(stageId==='fpStage')stage.parentNode.parentNode.insertBefore(controls,stage.parentNode.nextSibling);
  else stage.parentNode.insertBefore(controls,stage.nextSibling);
}
learningViewControls('n3stage',()=>n3view());learningViewControls('fpStage',()=>fpView());
