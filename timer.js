/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。scramble.js / app.js の後に読み込む */
/* ================= solve timer ================= */
const TIMER_KEY='cfop-timer-v1',TIMER_MAX=500,TIMER_HOLD_MS=300,TIMER_SHOWN=12;
const TM={solves:[],state:'idle',start:0,raf:0,holdTimer:0,scramble:'',queued:'',locked:false,saveFailed:false,clearArmed:0};
function tmValidSolve(s){
  return !!s&&Number.isFinite(s.t)&&s.t>0&&s.t<36e5&&[0,2,-1].includes(s.p)&&typeof s.s==='string'&&s.s.length<=400&&Number.isFinite(s.d);
}
function tmLoad(){
  try{
    const stored=localStorage.getItem(TIMER_KEY);if(stored===null)return;
    const raw=JSON.parse(stored);
    // 未対応の保存形式は上書きしない(新しい版で保存した記録を古い版が消さないため)
    if(!raw||raw.v!==1||!Array.isArray(raw.solves)){TM.locked=true;return;}
    TM.solves=raw.solves.filter(tmValidSolve).slice(-TIMER_MAX).map(s=>({t:Math.round(s.t),p:s.p,s:s.s,d:s.d}));
  }catch(_){TM.locked=true;}
}
function tmSave(){
  if(TM.locked)return false;
  try{localStorage.setItem(TIMER_KEY,JSON.stringify({v:1,solves:TM.solves}));TM.saveFailed=false;return true;}
  catch(_){TM.saveFailed=true;return false;}
}
function tmFormat(ms,tenths=false){
  if(ms===null||ms===undefined)return '—';
  if(ms===Infinity)return 'DNF';
  const cs=Math.floor(ms/10),min=Math.floor(cs/6000),sec=Math.floor(cs/100)%60,c=cs%100;
  const frac=tenths?String(Math.floor(c/10)):String(c).padStart(2,'0');
  return min?`${min}:${String(sec).padStart(2,'0')}.${frac}`:`${sec}.${frac}`;
}
function tmValue(s){return s.p===-1?Infinity:s.t+(s.p===2?2000:0);}
function tmSolveText(s){return s.p===-1?`DNF (${tmFormat(s.t)})`:tmFormat(tmValue(s))+(s.p===2?'+':'');}
/* WCA式の平均: 直近n回から最速と最遅を1回ずつ除く。DNFが2回以上ならDNF */
function tmAverage(n,solves=TM.solves){
  if(solves.length<n)return null;
  const kept=solves.slice(-n).map(tmValue).sort((a,b)=>a-b).slice(1,-1);
  if(kept.includes(Infinity))return Infinity;
  return kept.reduce((sum,v)=>sum+v,0)/kept.length;
}
function tmStats(solves=TM.solves){
  const done=solves.map(tmValue).filter(Number.isFinite);
  return {count:solves.length,best:done.length?Math.min(...done):null,mean:done.length?done.reduce((sum,v)=>sum+v,0)/done.length:null,ao5:tmAverage(5,solves),ao12:tmAverage(12,solves)};
}
function tmElement(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function tmHasKeyboard(){return typeof matchMedia==='function'&&matchMedia('(hover:hover) and (pointer:fine)').matches;}
function tmRenderPad(){
  const pad=$('#tmPad');if(!pad)return;
  for(const name of ['holding','ready','running'])pad.classList.toggle(name,TM.state===name);
  document.body.classList.toggle('tm-running',TM.state==='running');
  const last=TM.solves[TM.solves.length-1];
  if(TM.state!=='running')$('#tmTime').textContent=TM.state==='idle'?(last?tmSolveText(last):'0.00'):'0.00';
  $('#tmHint').textContent={
    idle:tmHasKeyboard()?tj('長押しして、離すとスタート(Spaceキーでも可)','Hold, then release to start (Space also works)'):tj('長押しして、離すとスタート','Hold, then release to start'),
    holding:tj('そのまま押し続ける…','Keep holding…'),
    ready:tj('離すとスタート','Release to start'),
    running:tj('画面のどこでもタップでストップ','Tap anywhere to stop'),
  }[TM.state];
}
function tmRender(){
  if(!$('#tmPad'))return;
  $('#tmScramble').textContent=TM.scramble;
  tmRenderPad();
  const stats=tmStats(),box=$('#tmStats');box.textContent='';
  for(const [label,value] of [
    [tj('回数','Solves'),String(stats.count)],[tj('ベスト','Best'),tmFormat(stats.best)],
    ['ao5',tmFormat(stats.ao5)],['ao12',tmFormat(stats.ao12)],[tj('平均','Mean'),tmFormat(stats.mean)],
  ]){
    const cell=tmElement('div','tmstat');cell.append(tmElement('small','',label),tmElement('b','mono',value));box.appendChild(cell);
  }
  const list=$('#tmList');list.textContent='';
  const from=Math.max(0,TM.solves.length-TIMER_SHOWN);
  for(let i=TM.solves.length-1;i>=from;i--){
    const s=TM.solves[i],li=tmElement('li','tmrow');
    const head=tmElement('div','tmrowhead');
    head.append(tmElement('span','tmno',String(i+1)),tmElement('b','mono',tmSolveText(s)));
    const tools=tmElement('span','tmtools');
    for(const [action,label,name,on] of [
      ['plus2','+2',tj('+2秒のペナルティ','+2 second penalty'),s.p===2],
      ['dnf','DNF',tj('DNF(未完了)にする','Mark as DNF (did not finish)'),s.p===-1],
      ['del','×',tj('この記録を削除','Delete this solve'),null],
    ]){
      const b=tmElement('button','btn tmtool',label);b.type='button';b.dataset.tm=action;b.dataset.i=String(i);b.setAttribute('aria-label',`${name} (${i+1})`);
      if(on!==null){b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on);}
      tools.appendChild(b);
    }
    head.appendChild(tools);li.append(head,tmElement('small','mono tmrowscr',s.s));list.appendChild(li);
  }
  $('#tmMore').hidden=from===0;
  if(from>0)$('#tmMore').textContent=tj(`ほか${from}件(統計には含まれます)`,`${from} older solves (still counted in the statistics)`);
  const clear=$('#tmClear');clear.hidden=!TM.solves.length;
  clear.textContent=TM.clearArmed?tj('もう一度押すとすべて消去','Press again to erase everything'):tj('記録をすべて消去','Erase all solves');
  const status=$('#tmStatus');status.hidden=!TM.locked&&!TM.saveFailed;
  status.textContent=TM.locked?tj('保存済みのタイマー記録を読み込めませんでした。上書きを防ぐため、今回の記録は保存されません。','Saved timer records could not be read. New solves are not saved, to avoid overwriting them.')
    :TM.saveFailed?tj('この端末に記録を保存できませんでした。','Solves could not be saved on this device.'):'';
}
function tmNext(prefetch=true){
  TM.scramble=TM.queued||scrRandom();TM.queued='';
  // 次の1本を裏で用意する。Worker不調時はscramble.js側がランダムムーブへ切り替える
  if(prefetch)requestScramble(alg=>{TM.queued=alg;});
  tmRender();
}
function tmTick(){
  if(TM.state!=='running')return;
  $('#tmTime').textContent=tmFormat(performance.now()-TM.start,true);
  TM.raf=requestAnimationFrame(tmTick);
}
function tmStart(){
  TM.state='running';TM.start=performance.now();tmRenderPad();
  $('#tmTime').textContent='0.0';
  TM.raf=requestAnimationFrame(tmTick);
}
function tmStop(){
  const elapsed=Math.max(10,Math.round(performance.now()-TM.start));
  cancelAnimationFrame(TM.raf);TM.state='idle';
  TM.solves.push({t:elapsed,p:0,s:TM.scramble,d:Date.now()});
  if(TM.solves.length>TIMER_MAX)TM.solves.splice(0,TM.solves.length-TIMER_MAX);
  tmSave();
  showToast(tj(`記録 ${tmFormat(elapsed)}`,`Time ${tmFormat(elapsed)}`));
  tmNext();
}
function tmCancelHold(){
  clearTimeout(TM.holdTimer);
  if(TM.state==='holding'||TM.state==='ready'){TM.state='idle';tmRenderPad();}
}
function tmPress(){
  if(TM.state==='running'){tmStop();return;}
  if(TM.state!=='idle')return;
  TM.state='holding';tmRenderPad();
  clearTimeout(TM.holdTimer);
  TM.holdTimer=setTimeout(()=>{if(TM.state==='holding'){TM.state='ready';tmRenderPad();}},TIMER_HOLD_MS);
}
function tmRelease(){
  clearTimeout(TM.holdTimer);
  if(TM.state==='ready')tmStart();
  else if(TM.state==='holding'){TM.state='idle';tmRenderPad();}
}
function tmKeyTarget(e){
  if(TM.state==='running'||TM.state==='holding'||TM.state==='ready')return true;
  const pad=$('#tmPad');
  if(e.target===pad)return true;
  // フォーカスが無い時は、タイマーが画面内に見えている場合だけSpaceを受け取る(通常のスクロールを奪わない)
  if(e.target!==document.body||document.body.dataset.page!=='home')return false;
  if((typeof PP!=='undefined'&&PP.open)||!$('#cmdk')?.hidden)return false;
  const r=pad.getBoundingClientRect();
  return r.height>0&&r.top>=0&&r.bottom<=innerHeight;
}
function tmInit(){
  const pad=$('#tmPad');if(!pad||tmInit._done)return;tmInit._done=true;
  tmLoad();
  pad.addEventListener('pointerdown',e=>{if(e.button)return;tmPress();});
  pad.addEventListener('pointerup',tmRelease);
  pad.addEventListener('pointercancel',tmCancelHold);
  pad.addEventListener('pointerleave',tmCancelHold);
  pad.addEventListener('contextmenu',e=>e.preventDefault());
  // キーボード: Space / Enter を押し続けて離すと開始、計測中はどのキーでも停止
  addEventListener('keydown',e=>{
    if(e.isComposing||e.metaKey||e.ctrlKey||e.altKey)return;
    if(TM.state==='running'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)tmStop();return;}
    if(e.key!==' '&&e.key!=='Enter')return;
    if(!tmKeyTarget(e))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!e.repeat)tmPress();
  },true);
  addEventListener('keyup',e=>{
    if(e.key!==' '&&e.key!=='Enter')return;
    if(TM.state!=='holding'&&TM.state!=='ready')return;
    e.preventDefault();e.stopImmediatePropagation();tmRelease();
  },true);
  addEventListener('blur',tmCancelHold);
  $('#tmNext').addEventListener('click',()=>{if(TM.state==='idle')tmNext();});
  $('#tmShow').addEventListener('click',()=>{
    if(!TM.scramble)return;
    n3loadAlg(TM.scramble,tj('スクランブル','Scramble'),false,false,'solved');openPP();
  });
  $('#tmList').addEventListener('click',e=>{
    const b=e.target.closest('button[data-tm]');if(!b)return;
    const i=Number(b.dataset.i),s=TM.solves[i];if(!s)return;
    if(b.dataset.tm==='del')TM.solves.splice(i,1);
    else if(b.dataset.tm==='plus2')s.p=s.p===2?0:2;
    else if(b.dataset.tm==='dnf')s.p=s.p===-1?0:-1;
    tmSave();tmRender();
    // 再描画でボタンが作り直されるため、同じ操作へフォーカスを戻す
    ($(`#tmList button[data-tm="${b.dataset.tm}"][data-i="${Math.min(i,TM.solves.length-1)}"]`)||$('#tmPad')).focus();
  });
  $('#tmClear').addEventListener('click',()=>{
    if(!TM.clearArmed){
      TM.clearArmed=setTimeout(()=>{TM.clearArmed=0;tmRender();},4000);tmRender();return;
    }
    clearTimeout(TM.clearArmed);TM.clearArmed=0;TM.solves=[];tmSave();tmRender();$('#tmPad').focus();
  });
  tmNext(false);
}
tmInit();
