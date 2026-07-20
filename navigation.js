/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= nav & mode ================= */
const PAGE_IDS=new Set(['home','basic','cross','f2l','oll','pll']);
function go(p,historyMode='push'){
  const vt=document.startViewTransition
    &&matchMedia('(min-width:761px)').matches
    &&!matchMedia('(prefers-reduced-motion:reduce)').matches
    &&document.body.dataset.page!==p;
  if(vt)document.startViewTransition(()=>goCore(p,historyMode));
  else goCore(p,historyMode);
}
function goCore(p,historyMode='push'){
  if(!PAGE_IDS.has(p))p='home';
  if(typeof PP!=='undefined'&&PP.open&&p==='basic')closePP();
  document.querySelectorAll('.page').forEach(e=>e.classList.remove('on'));
  $('#pg-'+p).classList.add('on');
  document.body.dataset.page=p;
  document.querySelectorAll('.navmain').forEach(b=>{const on=b.dataset.p===p;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  document.querySelectorAll('#tabbar button').forEach(b=>{const on=b.dataset.p===p;b.classList.toggle('on',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  document.querySelectorAll('.navitem').forEach(n=>n.classList.toggle('current',n.dataset.nav===p));
  const main=document.querySelector(`.navmain[data-p="${p}"]`);
  $('#where b').textContent=main?main.textContent:p;
  const hash='#'+p;if(historyMode!=='none'&&location.hash!==hash)history[historyMode==='replace'?'replaceState':'pushState']({page:p},'',hash);
  window.scrollTo(0,0);
  requestAnimationFrame(updateTocLocation);
}
function tocLabel(h){
  const c=h.cloneNode(true);c.querySelectorAll('.hint,.cnt').forEach(x=>x.remove());return c.textContent.trim();
}
function buildSubnav(){
  document.querySelectorAll('.page').forEach(page=>{
    const p=page.id.replace('pg-',''),box=document.querySelector(`.navitem[data-nav="${p}"] .subnav`);
    if(!box)return;box.innerHTML='';
    page.querySelectorAll('h2.sec').forEach((h,i)=>{
      h.id=`toc-${p}-${i}`;
      const b=document.createElement('button');b.className='toclink';b.textContent=tocLabel(h);b.dataset.target=h.id;
      b.addEventListener('click',()=>{go(p);requestAnimationFrame(()=>h.scrollIntoView({behavior:'smooth',block:'start'}));});
      box.appendChild(b);
    });
  });
  updateTocLocation();
}
function updateTocLocation(){
  const p=document.body.dataset.page,page=$('#pg-'+p);if(!page)return;
  const hs=[...page.querySelectorAll('h2.sec')];let active=hs[0]||null;
  hs.forEach(h=>{if(h.getBoundingClientRect().top<=88)active=h;});
  document.querySelectorAll('.toclink').forEach(b=>b.classList.toggle('on',active&&b.dataset.target===active.id));
  const label=active?tocLabel(active):(page.querySelector('.pgttl')?.textContent||'');
  $('.whereSection').textContent=label;
}
document.querySelectorAll('.navmain').forEach(b=>b.addEventListener('click',()=>{
  go(b.dataset.p);
  if(innerWidth<=760){$('#nav').classList.remove('open');$('#navToggle').setAttribute('aria-expanded','false');}
}));
$('#navToggle').addEventListener('click',e=>{e.stopPropagation();const open=$('#nav').classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open));});
window.addEventListener('scroll',updateTocLocation,{passive:true});
function syncModeControls(){
  document.querySelectorAll('#modeSeg button').forEach(x=>{const on=x.dataset.m===mode;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});
  const mi=$('#modeIco');if(!mi)return;
  const toAdvanced=mode==='s';
  mi.textContent=mode==='s'?tj('簡易','Simple'):tj('本格','Advanced');
  const label=(typeof LANG!=='undefined'&&LANG==='en')?(toAdvanced?'Switch to Advanced':'Switch to Simple'):(toAdvanced?'本格モードへ切替':'簡易モードへ切替');
  mi.setAttribute('aria-label',label);mi.title=label;
}
function setMode(m){
  mode=m;
  try{localStorage.setItem('cfop-mode',mode);}catch(e){}
  rebuild();
}
document.querySelectorAll('#modeSeg button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
$('#modeIco').addEventListener('click',()=>setMode(mode==='s'?'a':'s'));
function rebuild(){
  allIds.length=0;
  buildTasks();buildCross();buildF2L();buildOLL();buildPLL();buildBasics();
  syncModeControls();
  refreshCounts();qNext();scrInit();buildStruct();fpInit();buildSubnav();
}
// mobile nav auto-hide (scroll down = hide / up or top = show)
(()=>{
  let lastY=0,tick=false;
  window.addEventListener('scroll',()=>{
    if(tick)return;tick=true;
    requestAnimationFrame(()=>{
      tick=false;
      const y=window.scrollY;
      document.body.classList.toggle('scrolled',y>4);
      if(!window.matchMedia('(max-width:760px)').matches){document.body.classList.remove('navhide');return;}
      const nav=document.querySelector('nav');
      if((nav&&nav.classList.contains('open'))||y<60){document.body.classList.remove('navhide');}
      else if(y-lastY>6){document.body.classList.add('navhide');}
      else if(lastY-y>6){document.body.classList.remove('navhide');}
      lastY=y;
    });
  },{passive:true});
})();
/* ===== 基礎編: 3D/展開図ドックを上スワイプで隠す ===== */
(()=>{
  const dock=$('.n3wrap'),handle=$('#n3DockHandle'),restore=$('#n3DockRestore');
  if(!dock||!handle||!restore)return;
  const mq=matchMedia('(max-width:760px)');
  let active=false,pid=null,startY=0,dy=0;
  const clearDrag=()=>{
    active=false;pid=null;dy=0;dock.classList.remove('dock-dragging');
    dock.style.transform='';dock.style.opacity='';
  };
  const hideDock=()=>{
    if(!mq.matches||dock.classList.contains('dock-collapsed'))return;
    active=false;dock.classList.remove('dock-dragging');
    dock.style.transform='translateY(-28px) scale(.985)';dock.style.opacity='0';
    setTimeout(()=>{
      dock.classList.add('dock-collapsed');dock.style.transform='';dock.style.opacity='';
      restore.hidden=false;
    },180);
  };
  const showDock=(animate=true)=>{
    dock.classList.remove('dock-collapsed');restore.hidden=true;
    if(!animate){clearDrag();return;}
    dock.style.transition='none';dock.style.transform='translateY(-22px) scale(.985)';dock.style.opacity='0';
    void dock.offsetWidth;
    dock.style.transition='';requestAnimationFrame(()=>{dock.style.transform='';dock.style.opacity='';});
  };
  handle.addEventListener('pointerdown',e=>{
    if(!mq.matches)return;
    active=true;pid=e.pointerId;startY=e.clientY;dy=0;dock.classList.add('dock-dragging');
    try{handle.setPointerCapture(pid);}catch(_){}
  });
  handle.addEventListener('pointermove',e=>{
    if(!active||e.pointerId!==pid)return;
    dy=e.clientY-startY;
    const y=Math.max(-72,Math.min(0,dy));
    dock.style.transform=`translateY(${y}px)`;dock.style.opacity=String(1-Math.min(1,Math.abs(y)/110));
  });
  const end=e=>{
    if(!active||(e&&e.pointerId!==pid))return;
    const commit=dy<-36;clearDrag();if(commit)hideDock();
  };
  handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
  handle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hideDock();}});
  restore.addEventListener('click',()=>showDock(true));
  const resetWide=e=>{if(!e.matches)showDock(false);};
  if(mq.addEventListener)mq.addEventListener('change',resetWide);else mq.addListener(resetWide);
})();
$('#ppmin').addEventListener('click',minPP);
$('#ppclose').addEventListener('click',closePP);
$('#pprestore').addEventListener('click',restorePP);
window.addEventListener('popstate',()=>go(location.hash.slice(1)||'home','none'));
rebuild();
buildNet();
buildNamed();
n3init();
go(location.hash.slice(1)||'home','replace');

document.querySelectorAll('#langSeg button').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
document.getElementById('lgIco').addEventListener('click',()=>setLanguage(LANG==='ja'?'en':'ja'));
document.getElementById('thIco').addEventListener('click',()=>setTheme(THEME==='dark'?'light':'dark'));
document.querySelectorAll('#tabbar button').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.p===document.body.dataset.page&&typeof window.__tocToggle==='function')window.__tocToggle();
  else go(b.dataset.p);
}));
/* ===== フローティングピル: ジェスチャー & Liquid Glass風挙動 ===== */
(function(){
  const bar=document.getElementById('tabbar');
  const sheet=document.getElementById('tocSheet'),list=document.getElementById('tocList');
  if(!bar||!sheet)return;
  const mq=matchMedia('(max-width:760px)');
  const PAGES=[...bar.querySelectorAll('button[data-p]')].map(b=>b.dataset.p);
  const closeToc=()=>{
    if(sheet.hidden)return;
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){sheet.hidden=true;return;}
    sheet.classList.add('closing');
    setTimeout(()=>{sheet.hidden=true;sheet.classList.remove('closing');},150);
  };
  function openToc(){
    const pg=document.querySelector('.page.on');if(!pg)return;
    const hs=[...pg.querySelectorAll('h2.sec')].filter(h=>h.offsetParent);
    if(!hs.length){closeToc();return;}
    list.innerHTML='';
    const top=document.createElement('button');
    top.textContent='⤒ ページ先頭';
    top.addEventListener('click',()=>{closeToc();window.scrollTo({top:0,behavior:'smooth'});});
    list.appendChild(top);
    hs.forEach(h=>{
      const b=document.createElement('button');
      b.textContent=(h.firstChild&&h.firstChild.textContent||'').trim()||h.textContent.trim();
      b.addEventListener('click',()=>{closeToc();h.scrollIntoView({behavior:'smooth',block:'start'});});
      list.appendChild(b);
    });
    sheet.hidden=false;
  }
  document.addEventListener('pointerdown',e=>{
    if(!sheet.hidden&&!sheet.contains(e.target)&&!bar.contains(e.target))closeToc();
  },true);
  // iOS Safari: ピル上で始まったタッチのラバーバンドスクロールを確実に抑止
  bar.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  // 現在ページのタブ再タップ=目次(システムジェスチャーと衝突しない)
  window.__tocToggle=()=>{sheet.hidden?openToc():closeToc();};
  // スワイプ: 下部ナビを左右へ。10pxで方向を確定し、距離+速度で前後ページを決める。
  let g=null,swiped=false,barX=0,pageX=0;
  const reduceMotion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  // §9 rubberband: 操作対象は指へ即応しつつ、移動量は徐々に抵抗を増す。
  const rubber=(x,dim=110,c=.55)=>(x*dim*c)/(dim+c*Math.abs(x));
  const velocity=(samples,key)=>{
    if(samples.length<2)return 0;
    const last=samples[samples.length-1];
    let first=samples[0];
    for(let i=samples.length-2;i>=0;i--){if(last.t-samples[i].t>80)break;first=samples[i];}
    const dt=Math.max(1,last.t-first.t);
    return (last[key]-first[key])*1000/dt;
  };
  const resetDraggedPage=pg=>{
    if(!pg)return;
    pg.style.transform='';pg.style.opacity='';pg.style.willChange='';
  };
  const liveOffset=el=>{
    if(!el)return{x:0,y:0,opacity:1};
    const cs=getComputedStyle(el),tr=cs.transform;
    let x=0,y=0;
    if(tr&&tr!=='none'){
      try{const Matrix=window.DOMMatrixReadOnly||window.WebKitCSSMatrix;if(Matrix){const m=new Matrix(tr);x=m.m41||0;y=m.m42||0;}}catch(_){ }
    }
    return{x,y,opacity:Number.parseFloat(cs.opacity)||1};
  };
  // 進行中アニメーションを見た目の現在値で凍結し、そこから次の指操作を始める。
  const freezePresentation=el=>{
    const live=liveOffset(el);if(!el)return live;
    el.getAnimations().forEach(a=>{
      const frames=a.effect&&typeof a.effect.getKeyframes==='function'?a.effect.getKeyframes():[];
      if(frames.some(f=>Object.prototype.hasOwnProperty.call(f,'transform')))a.cancel();
    });
    el.style.transform=(live.x||live.y)?`translate(${live.x}px,${live.y}px)`:'';
    el.style.opacity=String(live.opacity);
    return live;
  };
  const settleDraggedPage=(pg,axis,offset)=>{
    if(!pg)return;
    const startOpacity=Number.parseFloat(getComputedStyle(pg).opacity)||1;
    resetDraggedPage(pg);
    if(!offset||reduceMotion())return;
    const from=axis==='x'?`translateX(${offset}px)`:`translateY(${offset}px)`;
    pg.animate([{transform:from,opacity:startOpacity},{transform:'translate(0,0)',opacity:1}],
      {duration:220,easing:'cubic-bezier(.2,.9,.3,1)'});
  };
  const settleBar=from=>{
    bar.style.transform='';barX=0;
    if(!from||reduceMotion())return;
    bar.animate([{transform:`translateX(${from}px)`},{transform:'translateX(0)'}],
      {duration:210,easing:'cubic-bezier(.2,.9,.3,1)'});
  };
  function slideGo(p,dir,releaseVelocity=0,axis='x'){
    go(p);
    const pg=document.querySelector('.page.on');
    if(!pg||reduceMotion())return;
    pg.getAnimations().forEach(a=>a.cancel());
    const speed=Math.abs(releaseVelocity);
    const amount=axis==='x'?Math.min(54,28+speed*.018):Math.min(44,22+speed*.014);
    const from=axis==='x'?(dir==='l'?amount:-amount):amount;
    const transform=axis==='x'?`translateX(${from}px)`:`translateY(${from}px)`;
    const duration=Math.max(150,Math.min(250,235-speed*.055));
    pg.animate([{transform,opacity:.72},{transform:'translate(0,0)',opacity:1}],
      {duration,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  const setGestureX=dx=>{
    if(!g)return;
    if(reduceMotion()){barX=0;pageX=dx;return;}
    barX=g.baseBarX+rubber(dx);pageX=g.basePageX+dx;
    bar.style.transform=`translateX(${barX.toFixed(1)}px)`;
    if(g.page){
      g.page.style.willChange='transform,opacity';
      g.page.style.transform=`translateX(${dx.toFixed(1)}px)`;
      g.page.style.opacity=String(Math.max(.65,g.baseOpacity-Math.abs(dx)/900));
    }
  };
  const gMove=e=>{
    if(!g)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    const now=performance.now();g.samples.push({x:e.clientX,t:now});
    if(g.samples.length>8)g.samples.shift();
    if(!g.axis&&Math.hypot(dx,dy)>=10)g.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
    if(g.axis!=='x')return;
    swiped=true;setGestureX(dx);
  };
  const gEnd=e=>{
    if(!g)return;
    const state=g;g=null;
    const dx=Number.isFinite(e.clientX)?e.clientX-state.x:state.lastX;
    if(Number.isFinite(e.clientX))state.samples.push({x:e.clientX,t:performance.now()});
    const vx=velocity(state.samples,'x');
    const commit=e.type==='pointerup'&&state.axis==='x'&&(Math.abs(dx)>=56||(Math.abs(vx)>=550&&Math.abs(dx)>=18));
    const direction=(Math.abs(vx)>=550?Math.sign(vx):Math.sign(dx))||1;
    const oldPage=state.page,oldPageX=pageX,oldBarX=barX;
    settleBar(oldBarX);
    pageX=0;
    if(commit){
      resetDraggedPage(oldPage);
      const i=PAGES.indexOf(document.body.dataset.page);
      const ni=(i+(direction<0?1:-1)+PAGES.length)%PAGES.length;
      slideGo(PAGES[ni],direction<0?'l':'r',vx,'x');
    }else settleDraggedPage(oldPage,'x',oldPageX);
    setTimeout(()=>{swiped=false;},90);
  };
  bar.addEventListener('pointerdown',e=>{
    if(bar.classList.contains('mini')){setMini(false);return;}
    const pg=document.querySelector('.page.on');
    const barLive=freezePresentation(bar),pageLive=freezePresentation(pg);
    if(bar.setPointerCapture)bar.setPointerCapture(e.pointerId);
    g={x:e.clientX,y:e.clientY,lastX:0,axis:null,page:pg,baseBarX:barLive.x,basePageX:pageLive.x,baseOpacity:pageLive.opacity,samples:[{x:e.clientX,t:performance.now()}]};
    barX=barLive.x;pageX=pageLive.x;swiped=false;
  });
  bar.addEventListener('pointermove',e=>{if(g){g.lastX=e.clientX-g.x;gMove(e);}});
  bar.addEventListener('pointerup',gEnd);
  bar.addEventListener('pointercancel',gEnd);
  bar.addEventListener('click',e=>{if(swiped){e.stopPropagation();e.preventDefault();}},true);
  // 下スクロールでミニピル化、上スクロールで復帰
  let lastY=scrollY,acc=0;
  addEventListener('scroll',()=>{
    if(!mq.matches)return;
    const y=scrollY,dy=y-lastY;lastY=y;
    if(!sheet.hidden)return;
    acc=(dy>0)===(acc>0)?acc+dy:dy;
    if(y>150&&acc>26)setMini(true);
    else if(acc<-20||y<90)setMini(false);
  },{passive:true});
  const fab=document.getElementById('pillFab');
  const setMini=on=>{
    bar.classList.toggle('mini',on);
    if(fab){fab.setAttribute('aria-expanded',String(!on));fab.tabIndex=on?0:-1;}
  };
  if(fab)fab.addEventListener('click',e=>{e.stopPropagation();setMini(false);});

  /* ===== 最下部から引き上げて次ページへ(全教材を循環、モバイル) ===== */
  const LEARN=['home','basic','cross','f2l','oll','pll'];
  const PLABEL={home:'Home',basic:'Basic',cross:'Cross',f2l:'F2L',oll:'OLL',pll:'PLL'};
  const pull=document.getElementById('pullNav'),pFill=document.getElementById('pullFill'),
        pText=document.getElementById('pullText'),pArrow=document.getElementById('pullArrow');
  if(pull){
    const THRESH=72,FLICK_V=-650,MIN_FLICK_DIST=24;
    // 除外領域: これらの中で始まったタッチはページ送りにしない
    const EXCLUDE='#tabbar,.pullnav,#n3stage,.n3wrap,#netbox,.netwrap,#fpSwipe,.fpstage,input,textarea,select,.cmdk,.tocsheet,.pp,[data-hscroll]';
    let pg=null,startY=0,dist=0,visual=0,baseY=0,armed=false,active=false,page=null,samples=[];
    const atBottom=()=>window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2;
    const nextOf=p=>{const i=LEARN.indexOf(p);return i<0?null:LEARN[(i+1)%LEARN.length];};
    const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const resetPullPage=()=>{if(page)resetDraggedPage(page);visual=0;};
    addEventListener('touchstart',e=>{
      if(!mq.matches)return;
      const p=document.body.dataset.page;
      if(LEARN.indexOf(p)<0){active=false;return;}
      if(e.target.closest(EXCLUDE)){active=false;return;}
      if(!atBottom()){active=false;return;}
      // タッチ開始点の実要素でも除外判定(重なり対策)
      const t0=e.touches[0];
      const el0=document.elementFromPoint(t0.clientX,t0.clientY);
      if(el0&&el0.closest(EXCLUDE)){active=false;return;}
      page=document.querySelector('.page.on');baseY=freezePresentation(page).y;
      active=true;pg=nextOf(p);startY=t0.clientY;dist=0;visual=0;armed=false;
      samples=[{y:t0.clientY,t:performance.now()}];
      pArrow.textContent='↑';
      pText.textContent=(LANG==='en'?'Next: ':'次へ: ')+PLABEL[pg];
    },{passive:true});
    addEventListener('touchmove',e=>{
      if(!active)return;
      const y=e.touches[0].clientY,dy=startY-y; // 上へ引く量
      if(dy<=0){
        dist=0;armed=false;pull.classList.remove('show','armed');pull.hidden=true;pull.setAttribute('aria-hidden','true');
        resetPullPage();baseY=0;
        return;
      }
      // standalone PWAではSafariのラバーバンド表示に隠されないよう、
      // 端からのページ送り開始後だけネイティブのオーバースクロールを止める。
      if(e.cancelable)e.preventDefault();
      dist=dy;samples.push({y,t:performance.now()});if(samples.length>8)samples.shift();
      visual=Math.abs(rubber(-dist,110,.55));
      if(page&&!reduce){
        page.style.willChange='transform,opacity';
        page.style.transform=`translateY(${(baseY-visual).toFixed(1)}px)`;
        page.style.opacity=String(Math.max(.86,1-dist/900));
      }
      if(pull.hidden){pull.hidden=false;pull.setAttribute('aria-hidden','false');requestAnimationFrame(()=>pull.classList.add('show'));}
      const pct=Math.min(1,dist/THRESH);
      pFill.style.width=(pct*100).toFixed(0)+'%';
      const vy=velocity(samples,'y');
      const nowArmed=dist>=THRESH||(vy<=FLICK_V&&dist>=MIN_FLICK_DIST);
      if(nowArmed!==armed){
        armed=nowArmed;pull.classList.toggle('armed',armed);
        if(armed&&navigator.vibrate)navigator.vibrate(8); // 閾値到達の触覚
      }
    },{passive:false});
    const endPull=(commit=true)=>{
      if(!active){return;}
      active=false;
      const vy=velocity(samples,'y');
      const go2=commit&&pg&&(dist>=THRESH||(vy<=FLICK_V&&dist>=MIN_FLICK_DIST));
      pull.classList.remove('show','armed');
      setTimeout(()=>{pull.hidden=true;pull.setAttribute('aria-hidden','true');pFill.style.width='0';},reduce?0:130);
      if(go2){
        resetPullPage();
        if(reduce)go(pg);else slideGo(pg,'l',vy,'y');
      }else{
        const oldPage=page,oldOffset=baseY-visual;
        if(!reduce)settleDraggedPage(oldPage,'y',oldOffset);else resetPullPage();
      }
      pg=null;page=null;samples=[];dist=0;visual=0;baseY=0;armed=false;
    };
    addEventListener('touchend',()=>endPull(true));
    addEventListener('touchcancel',()=>endPull(false));
  }
  bar.addEventListener('click',()=>setMini(false));
  // ナビゲーション時、目次が開いていれば新ページの内容に動的更新
  const _go=go;
  window.go=(p,h)=>{const keep=!sheet.hidden;_go(p,h);if(keep)openToc();};
})();
/* ===== デスクトップ: ⌘K コマンドパレット & キーボードショートカット ===== */
(function(){
  const PAGE_ORDER=['home','basic','cross','f2l','oll','pll'];
  const PAGE_LABEL={home:'Home',basic:'Basic',cross:'Cross',f2l:'F2L',oll:'OLL',pll:'PLL'};
  const STICKER={home:'#FFFF55',oll:'#FFFF55',basic:'#449751',cross:'#FFFFFF',f2l:'#EB632B',pll:'#1B45A6'};
  const box=$('#cmdk'),inp=$('#cmdkInput'),list=$('#cmdkList');
  if(!box)return;
  let items=[],sel=0;
  const isTyping=e=>/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
  function flash(el){
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.animate([{outline:'2px solid var(--yl)',outlineOffset:'3px'},{outline:'2px solid transparent',outlineOffset:'3px'}],{duration:1400,easing:'ease-out'});
  }
  function buildIndex(){
    const ix=[];
    PAGE_ORDER.forEach(p=>ix.push({l:PAGE_LABEL[p],s:tj('ページ','Page'),p,run:()=>go(p)}));
    document.querySelectorAll('.page').forEach(pg=>{
      const p=pg.id.replace('pg-','');
      pg.querySelectorAll('h2.sec').forEach(h=>{
        ix.push({l:tocLabel(h),s:PAGE_LABEL[p],p,
          run:()=>{go(p);requestAnimationFrame(()=>h.scrollIntoView({behavior:'smooth',block:'start'}));}});
      });
      // 手順カード(OLL/PLL/F2L/トリガー)へ直接ジャンプ
      pg.querySelectorAll('.nm').forEach(nm=>{
        const card=nm.closest('[data-alg],.acard,.algcard,.trg')||nm;
        const label=nm.textContent.trim();
        if(label)ix.push({l:label,s:tj('手順','Alg'),p,run:()=>{go(p);requestAnimationFrame(()=>flash(card));}});
      });
    });
    ix.push({l:tj('テーマ切替','Toggle theme'),s:tj('操作','Action'),p:'home',run:()=>setTheme(THEME==='dark'?'light':'dark')});
    ix.push({l:tj('言語切替 / Language','Language / 言語切替'),s:tj('操作','Action'),p:'home',run:()=>setLanguage(LANG==='ja'?'en':'ja')});
    return ix;
  }
  function render(){
    const q=inp.value.trim().toLowerCase();
    const toksQ=q.split(/\s+/).filter(Boolean);
    items=buildIndex().filter(it=>{
      if(!toksQ.length)return it.s===tj('ページ','Page')||it.s===tj('操作','Action');
      const hay=(it.l+' '+it.s+' '+PAGE_LABEL[it.p]).toLowerCase();
      return toksQ.every(t=>hay.includes(t));
    }).slice(0,14);
    sel=0;
    list.innerHTML='';
    if(!items.length){const d=document.createElement('div');d.className='cmdkEmpty';d.textContent=tj('該当なし','No results');list.appendChild(d);return;}
    items.forEach((it,i2)=>{
      const d=document.createElement('div');
      d.className='cmdkItem'+(i2===sel?' sel':'');
      d.style.setProperty('--ci',STICKER[it.p]||'var(--dOff)');
      d.innerHTML='<i></i>';
      const sp=document.createElement('span');sp.textContent=it.l;d.appendChild(sp);
      const sm=document.createElement('small');sm.textContent=it.s;d.appendChild(sm);
      d.addEventListener('click',()=>exec(it));
      d.addEventListener('pointermove',()=>{sel=i2;paintSel();});
      list.appendChild(d);
    });
  }
  function paintSel(){[...list.children].forEach((c,i2)=>c.classList.toggle('sel',i2===sel));}
  function exec(it){close();it.run();}
  function open(){box.hidden=false;inp.value='';render();inp.focus();}
  function close(){box.hidden=true;inp.blur();}
  inp.addEventListener('input',render);
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();if(items.length){sel=(sel+1)%items.length;paintSel();list.children[sel]?.scrollIntoView({block:'nearest'});}}
    else if(e.key==='ArrowUp'){e.preventDefault();if(items.length){sel=(sel-1+items.length)%items.length;paintSel();list.children[sel]?.scrollIntoView({block:'nearest'});}}
    else if(e.key==='Enter'){e.preventDefault();if(items[sel])exec(items[sel]);}
  });
  box.addEventListener('pointerdown',e=>{if(!e.target.closest('.cmdkPanel'))close();});
  addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();box.hidden?open():close();return;}
    if(!box.hidden){if(e.key==='Escape'){e.preventDefault();close();}return;}
    if(isTyping(e)||e.metaKey||e.ctrlKey||e.altKey)return;
    // ←/→単独は3Dプレイヤーのステップ操作に使われているため、ページ移動はShift併用
    if(e.shiftKey&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){
      const i2=PAGE_ORDER.indexOf(document.body.dataset.page);
      const ni=(i2+(e.key==='ArrowRight'?1:-1)+PAGE_ORDER.length)%PAGE_ORDER.length;
      e.preventDefault();go(PAGE_ORDER[ni]);
      return;
    }
    if(e.shiftKey)return;
    if(e.key==='/'){e.preventDefault();open();}
    else if(/^[1-6]$/.test(e.key)){go(PAGE_ORDER[+e.key-1]);}
    else if(e.key.toLowerCase()==='t'){setTheme(THEME==='dark'?'light':'dark');}
  });
})();
document.querySelectorAll('#themeSeg button').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
new MutationObserver(queueLanguage).observe(document.body,{subtree:true,childList:true,characterData:true});
applyTheme();
applyLanguage();

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',async()=>{
    try{const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});await registration.update();}catch(e){}
  });
}
