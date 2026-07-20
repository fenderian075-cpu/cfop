/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= nav & mode ================= */
const PAGE_IDS=new Set(['home','basic','cross','f2l','oll','pll','quiz']);
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
      if(!window.matchMedia('(max-width:760px)').matches){document.body.classList.remove('navhide');return;}
      const nav=document.querySelector('nav');
      const y=window.scrollY;
      if((nav&&nav.classList.contains('open'))||y<60){document.body.classList.remove('navhide');}
      else if(y-lastY>6){document.body.classList.add('navhide');}
      else if(lastY-y>6){document.body.classList.remove('navhide');}
      lastY=y;
    });
  },{passive:true});
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
  const PAGES=[...bar.querySelectorAll('button')].map(b=>b.dataset.p);
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
  // スワイプ: 横=前後ページ。閾値でラッチ→指を離した瞬間に遷移(タッチ中scrollTo起因のバウンス防止)
  let g=null,swiped=false,pending=null,barX=0;
  // §9 rubberband(apple-design skill): 端に近づくほど追従を弱める
  const rubber=(x,dim=90,c=.55)=>(x*dim*c)/(dim+c*Math.abs(x));
  const setBarX=v=>{barX=v;bar.style.transform=v?`translateX(${v.toFixed(1)}px)`:'';};
  const gMove=e=>{
    if(!g)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!swiped&&Math.abs(dx)>44&&Math.abs(dx)>Math.abs(dy)*1.4){
      swiped=true;
      const i=PAGES.indexOf(document.body.dataset.page);
      const ni=dx<0?i+1:i-1;
      if(ni>=0&&ni<PAGES.length)pending={p:PAGES[ni],dir:dx<0?'l':'r'};
    }
    // §2 1:1追従(ラバーバンド)。端ページ方向はpendingが立たず抵抗だけ伝わる
    if(Math.abs(dx)>Math.abs(dy))setBarX(rubber(dx));
  };
  const gEnd=e=>{
    g=null;setTimeout(()=>{swiped=false;},80);
    removeEventListener('pointermove',gMove);
    removeEventListener('pointerup',gEnd);removeEventListener('pointercancel',gEnd);
    // §3 現在の表示値から復帰(WAAPI)。次のpointerdownで中断可能
    if(barX&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      const from=barX;setBarX(0);
      bar.animate([{transform:`translateX(${from}px)`},{transform:'translateX(0)'}],
        {duration:200,easing:'cubic-bezier(.2,.9,.3,1)'});
    }else setBarX(0);
    if(pending&&e&&e.type==='pointerup'){const t=pending;pending=null;slideGo(t.p,t.dir);}
    else pending=null;
  };
  bar.addEventListener('pointerdown',e=>{
    bar.getAnimations().forEach(a=>a.cancel()); // §3 中断: 復帰アニメを掴んで止める
    g={x:e.clientX,y:e.clientY};swiped=false;
    addEventListener('pointermove',gMove);
    addEventListener('pointerup',gEnd);addEventListener('pointercancel',gEnd);
  });
  bar.addEventListener('click',e=>{if(swiped){e.stopPropagation();e.preventDefault();}},true);
  function slideGo(p,dir){
    go(p);
    const pg=document.querySelector('.page.on');
    if(pg&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
      pg.classList.remove('slide-l','slide-r');void pg.offsetWidth;
      pg.classList.add(dir==='l'?'slide-l':'slide-r');
      setTimeout(()=>pg.classList.remove('slide-l','slide-r'),240);
    }
  }
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
  bar.addEventListener('click',()=>setMini(false));
  // ナビゲーション時、目次が開いていれば新ページの内容に動的更新
  const _go=go;
  window.go=(p,h)=>{const keep=!sheet.hidden;_go(p,h);if(keep)openToc();};
})();
/* ===== デスクトップ: 展開図を3Dプレイヤーの横に並列配置 ===== */
(function(){
  const nw=document.querySelector('.netwrap'),n3w=document.querySelector('.n3wrap'),h2=document.querySelector('h2[data-netsec]');
  if(!nw||!n3w||!h2)return;
  const mq=matchMedia('(min-width:761px)');
  function place(){
    if(mq.matches){n3w.appendChild(nw);h2.hidden=true;}
    else{h2.hidden=false;h2.after(nw);}
  }
  place();
  if(mq.addEventListener)mq.addEventListener('change',place);else mq.addListener(place);
})();
/* ===== デスクトップ: ⌘K コマンドパレット & キーボードショートカット ===== */
(function(){
  const PAGE_ORDER=['home','basic','cross','f2l','oll','pll','quiz'];
  const PAGE_LABEL={home:'Home',basic:'Basic',cross:'Cross',f2l:'F2L',oll:'OLL',pll:'PLL',quiz:'Quiz'};
  const STICKER={home:'#FFFF55',oll:'#FFFF55',basic:'#449751',cross:'#FFFFFF',f2l:'#EB632B',pll:'#1B45A6',quiz:'#D92E20'};
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
      const ni=e.key==='ArrowRight'?i2+1:i2-1;
      if(ni>=0&&ni<PAGE_ORDER.length){e.preventDefault();go(PAGE_ORDER[ni]);}
      return;
    }
    if(e.shiftKey)return;
    if(e.key==='/'){e.preventDefault();open();}
    else if(/^[1-7]$/.test(e.key)&&document.body.dataset.page!=='quiz'){go(PAGE_ORDER[+e.key-1]);}
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


/* ===== プルアップページ送り(教材ページ最下部で上に引いて次へ) ===== */
(function(){
  const COURSE=['basic','cross','f2l','oll','pll'];
  const NAME={basic:'Basic',cross:'Cross',f2l:'F2L',oll:'OLL',pll:'PLL',home:'Home'};
  const mq=matchMedia('(max-width:760px)');
  const TH=92; // 発動閾値(px)
  const panel=document.createElement('div');
  panel.className='pullnav';panel.hidden=true;
  panel.innerHTML='<div class="pnArrow">↑</div><div class="pnLabel"></div><div class="pnBar"><i></i></div>';
  document.body.appendChild(panel);
  const label=panel.querySelector('.pnLabel'),fill=panel.querySelector('.pnBar i');
  // これらの上で始まったスワイプは対象外(3D・展開図・パッド・横スクロール・入力・モーダル・フリープレイ)
  const EXCLUDE='.n3stage,.fpstage,#fpSwipe,.cube-net,.netwrap,.apmoves,.nchips,input,textarea,select,.pp,.cmdk,.fpwrap';
  const atBottom=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-2;
  let st=null;
  addEventListener('touchstart',e=>{
    st=null;
    if(!mq.matches)return;
    const p=document.body.dataset.page,i=COURSE.indexOf(p);
    if(i<0)return;
    if(e.target.closest(EXCLUDE))return;
    if(!atBottom())return;
    st={y0:e.touches[0].clientY,pull:0,nx:i<COURSE.length-1?COURSE[i+1]:'home',buzzed:false};
  },{passive:true});
  addEventListener('touchmove',e=>{
    if(!st)return;
    const dy=st.y0-e.touches[0].clientY; // 上へ引く=正
    if(dy<=0){if(st.pull>0){st.pull=0;render();}return;}
    st.pull=dy;
    e.preventDefault(); // iOSのラバーバンドと競合させない
    render();
  },{passive:false});
  function render(){
    const p=st?st.pull:0;
    if(p<6){panel.hidden=true;return;}
    panel.hidden=false;
    panel.style.height=Math.min(96,16+p*.62)+'px';
    const pct=Math.min(1,p/TH);
    fill.style.transform=`scaleX(${pct.toFixed(3)})`;
    panel.classList.toggle('ready',pct>=1);
    label.textContent=st.nx==='home'?tj('ホームへ戻る','Back to Home'):tj('次へ: ','Next: ')+NAME[st.nx];
    if(pct>=1&&!st.buzzed){st.buzzed=true;try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}}
    if(pct<1)st.buzzed=false;
  }
  function finish(commit){
    const nx=st&&st.nx,past=st&&st.pull>=TH;
    st=null;
    panel.classList.remove('ready');panel.style.height='';panel.hidden=true;
    if(commit&&past&&nx){
      go(nx);
      const pg=document.querySelector('.page.on');
      if(pg&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
        pg.classList.remove('slide-up');void pg.offsetWidth;
        pg.classList.add('slide-up');
        setTimeout(()=>pg.classList.remove('slide-up'),300);
      }
    }
  }
  addEventListener('touchend',()=>finish(true),{passive:true});
  addEventListener('touchcancel',()=>finish(false),{passive:true});
})();
