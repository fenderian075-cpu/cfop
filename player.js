/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ===== 3D notation viewer =====
   CSS coords: X=右, Y=下, Z=手前。rotateX(+90)=上端が奥へ倒れる。
   各回転は「その面の外側から見て時計回り」を基準に軸と符号を定義 */
const N3B=[
 {k:'U',g:'base', jp:'上面(Up)',       ax:'Y',sg:-1,ly:c=>c.y===-1},
 {k:'F',g:'base', jp:'正面(Front)',    ax:'Z',sg: 1,ly:c=>c.z===1},
 {k:'R',g:'base', jp:'右面(Right)',    ax:'X',sg: 1,ly:c=>c.x===1},
 {k:'D',g:'base', jp:'底面(Down)',     ax:'Y',sg: 1,ly:c=>c.y===1},
 {k:'B',g:'base', jp:'背面(Back)',     ax:'Z',sg:-1,ly:c=>c.z===-1},
 {k:'L',g:'base', jp:'左面(Left)',     ax:'X',sg:-1,ly:c=>c.x===-1},
 {k:'u',g:'wide', jp:'上2層(Uw)',      ax:'Y',sg:-1,ly:c=>c.y<=0},
 {k:'f',g:'wide', jp:'前2層(Fw)',      ax:'Z',sg: 1,ly:c=>c.z>=0},
 {k:'r',g:'wide', jp:'右2層(Rw)',      ax:'X',sg: 1,ly:c=>c.x>=0},
 {k:'d',g:'wide', jp:'下2層(Dw)',      ax:'Y',sg: 1,ly:c=>c.y>=0},
 {k:'b',g:'wide', jp:'後2層(Bw)',      ax:'Z',sg:-1,ly:c=>c.z<=0},
 {k:'l',g:'wide', jp:'左2層(Lw)',      ax:'X',sg:-1,ly:c=>c.x<=0},
 {k:'M',g:'slice',jp:'中層 Middle・Lと同方向', ax:'X',sg:-1,ly:c=>c.x===0},
 {k:'E',g:'slice',jp:'中層 Equator・Dと同方向',ax:'Y',sg: 1,ly:c=>c.y===0},
 {k:'S',g:'slice',jp:'中層 Standing・Fと同方向',ax:'Z',sg: 1,ly:c=>c.z===0},
 {k:'x',g:'rot',  jp:'全体をRと同方向に',  ax:'X',sg: 1,ly:c=>true},
 {k:'y',g:'rot',  jp:'全体をUと同方向に',  ax:'Y',sg:-1,ly:c=>true},
 {k:'z',g:'rot',  jp:'全体をFと同方向に',  ax:'Z',sg: 1,ly:c=>true},
];
const N3={cur:'R',mod:'',yaw:-35,pitch:-25,cubies:[],raf:null,state:SOLVED.slice(),seq:[],step:0,playing:false,animating:false,algName:''};
let n3SetNetVisible=null;
function n3init(){
  const orbit=$('#n3orbit');
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    const el=document.createElement('div');el.className='cubie';
    let h='';
    h+=`<div class="cf cf-f${z===1?' outer':''}"></div>`;
    h+=`<div class="cf cf-b${z===-1?' outer':''}"></div>`;
    h+=`<div class="cf cf-r${x===1?' outer':''}"></div>`;
    h+=`<div class="cf cf-l${x===-1?' outer':''}"></div>`;
    h+=`<div class="cf cf-u${y===-1?' outer':''}"></div>`;
    h+=`<div class="cf cf-d${y===1?' outer':''}"></div>`;
    el.innerHTML=h;
    const c={x,y,z,el,faces:{}};
    ['f','b','r','l','u','d'].forEach(f=>c.faces[f]=el.querySelector('.cf-'+f));
    el.style.transform=n3pos(c);
    N3.cubies.push(c);
    orbit.appendChild(el);
  }
  n3view();
  // tribox式静止画カード(タップで3D再生)
  document.querySelectorAll('.nchips[data-n3g]').forEach(box=>{
    box.classList.add('ngrid');
    N3B.filter(b=>b.g===box.dataset.n3g).forEach(b=>{
      const variants=box.dataset.n3g==='base'?[b.k,b.k+"'",b.k+'2']:(box.dataset.n3g==='wide'?[b.k]:[b.k,b.k+"'"]);
      const group=document.createElement('div');
      group.className=`nmovegroup variants-${variants.length}${box.dataset.n3g==='rot'?' axisgroup':''}`;
      group.dataset.move=b.k;
      group.innerHTML=`<div class="nmovegrouptitle"><b class="mono">${b.k.toUpperCase()}</b><span>${b.jp}</span></div>`;
      variants.forEach(tok=>{
        const bt=document.createElement('button');bt.className='ncard';bt.dataset.tok=tok;
        const wAlias=box.dataset.n3g==='wide'?` <i class="walias">(${tok[0].toUpperCase()}w)</i>`:'';
        bt.innerHTML=triboxSVG(tok)+`<b class="mono">${tok}${wAlias}</b>`;
        bt.addEventListener('click',()=>{
          document.querySelectorAll('.ncard.on').forEach(x=>x.classList.remove('on'));
          bt.classList.add('on');
          N3.cur=b.k;N3.mod=tok.replace(b.k,'');
          ncardAnimate(bt,tok);
          n3loadAlg(tok,`${b.jp} ${tok}`,true,false);
        });
        group.appendChild(bt);
      });
      box.appendChild(group);
    });
  });
  // 持ち替えのアニメーションはタップ操作時のみ再生する(自動デモは行わない)
  $('#n3view').addEventListener('click',()=>{N3.yaw=-35;N3.pitch=-25;n3view();});
  // drag orbit
  const st=$('#n3stage');let drag=null;
  st.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    drag=[e.clientX,e.clientY];st.setPointerCapture(e.pointerId);
  });
  st.addEventListener('pointermove',e=>{
    if(!drag)return;
    N3.yaw+=(e.clientX-drag[0])*.45; N3.pitch-=(e.clientY-drag[1])*.45;
    N3.pitch=Math.max(-85,Math.min(85,N3.pitch));
    drag=[e.clientX,e.clientY];n3view();
  });
  st.addEventListener('pointerup',()=>drag=null);
  st.addEventListener('pointercancel',()=>drag=null);
  const netToggle=$('#apNetToggle'),n3wrap=st.closest('.n3wrap');
  const setNetVisible=on=>{
    n3wrap.classList.toggle('net-visible',on);
    netToggle.classList.toggle('on',on);
    netToggle.setAttribute('aria-pressed',String(on));
    netToggle.setAttribute('aria-label',on?tj('展開図を隠す','Hide net'):tj('展開図を表示','Show net'));
    if(on){
      n3wrap.classList.remove('dock-collapsed');
      const restore=$('#n3DockRestore');if(restore)restore.hidden=true;
    }
    requestAnimationFrame(()=>n3view());
  };
  n3SetNetVisible=setNetVisible;
  netToggle.addEventListener('click',()=>setNetVisible(!n3wrap.classList.contains('net-visible')));
  setNetVisible(false);
  const preset=$('#appreset');
  NAMED.forEach(([n,a])=>{const o=document.createElement('option');o.value=a;o.textContent=n;o.dataset.kind=n.includes('パーム')?'pll':'oll';preset.appendChild(o);});
  preset.addEventListener('change',()=>{if(preset.value){const o=preset.options[preset.selectedIndex];n3loadAlg(preset.value,o.text,false,false,'case',o.dataset.kind||'trigger');}});
  N3.focus=true;
  document.querySelectorAll('#apfocus button').forEach(b=>b.addEventListener('click',()=>{
    N3.focus=b.dataset.f==='1';
    document.querySelectorAll('#apfocus button').forEach(x=>x.classList.toggle('on',x===b));
    n3paint();
  }));
  document.querySelectorAll('#apstart button').forEach(b=>b.addEventListener('click',()=>{
    n3loadAlg($('#apinput').value,N3.algName,false,false,b.dataset.st);
  }));
  $('#apmoves').addEventListener('click',e=>{
    const t=e.target.closest('.apmove');
    if(!t||t.dataset.i===undefined)return;
    n3pause();n3setStep(+t.dataset.i);
  });
  $('#apinput').addEventListener('change',()=>n3loadAlg($('#apinput').value,N3.algName||'入力した手順',false,false,N3.startMode||'solved'));
  $('#apinput').addEventListener('keydown',e=>{if(e.key==='Enter')n3loadAlg(e.currentTarget.value,N3.algName||'入力した手順',true,false,N3.startMode||'solved');});
  $('#applay').addEventListener('click',()=>{if(N3.playing)n3pause();else n3start();});
  $('#apreset').addEventListener('click',()=>{n3pause();n3setStep(0);});
  $('#apend').addEventListener('click',()=>{n3pause();n3setStep(N3.seq.length);});
  $('#apprev').addEventListener('click',()=>{n3pause();n3stepBack();});
  $('#apnext').addEventListener('click',()=>{n3pause();n3stepForward();});
  $('#apslider').addEventListener('input',e=>{n3pause();n3setStep(+e.target.value);});
  n3paint();n3sync();n3loadAlg($('#apinput').value,'セクシームーブ',false,false);
}
function n3pos(c){return `translate3d(${c.x*53}px,${c.y*53}px,${c.z*53}px)`;}
function n3view(){
  const st=$('#n3stage');
  const base=parseFloat(getComputedStyle(st).getPropertyValue('--cs'))||1;
  /* 回転時の最大投影(約240px)がステージに必ず収まるよう自動フィット */
  const fit=Math.min(1.4, st.clientHeight/242, st.clientWidth/242);
  const cs=Math.min(base, fit>0?fit:base);
  $('#n3orbit').style.transform=`scale(${cs}) rotateX(${N3.pitch}deg) rotateY(${N3.yaw}deg)`;
}
window.addEventListener('resize',()=>{try{n3view();}catch(e){}});
function n3base(){return N3B.find(b=>b.k===N3.cur);}
function n3facelet(c,f){
  if(f==='u'&&c.y===-1)return (c.z+1)*3+(c.x+1);
  if(f==='r'&&c.x===1)return 9+(c.y+1)*3+(1-c.z);
  if(f==='f'&&c.z===1)return 18+(c.y+1)*3+(c.x+1);
  if(f==='d'&&c.y===1)return 27+(1-c.z)*3+(c.x+1);
  if(f==='l'&&c.x===-1)return 36+(c.y+1)*3+(c.z+1);
  if(f==='b'&&c.z===-1)return 45+(c.y+1)*3+(1-c.x);
  return null;
}
const FOCUS_LL=new Set([0,1,2,3,4,5,6,7,8,18,19,20,9,10,11,36,37,38,45,46,47]);
const FOCUS_CROSS=new Set([28,25,32,16,30,43,34,52,4,13,22,31,40,49]);
function n3color(content){
  const full=FC[Math.floor(content/9)];
  if(N3.focus===false||N3.startMode!=='case')return full;
  const k=N3.caseKind, G='var(--g3d,#2a2b31)';
  if(k==='oll')return content<9?FC[0]:G;
  if(k==='olledge')return (content===1||content===3||content===5||content===7||content===4)?FC[0]:G;
  if(k==='pll')return FOCUS_LL.has(content)?full:G;
  if(k==='f2l')return FOCUS_LL.has(content)?G:full;
  if(k==='cross')return FOCUS_CROSS.has(content)?full:G;
  return full;
}
function n3paint(){
  N3.cubies.forEach(c=>Object.entries(c.faces).forEach(([f,el])=>{
    const i=n3facelet(c,f);if(i!==null)el.style.background=n3color(N3.state[i]);
  }));
  netPaint(N3.state,n3color);
}
/* ===== 3D方向矢印(層の上に配置・回転と一緒に動く) ===== */
const ARROWS={
 U:{pl:'U',k:'h',ln:[53],d:-1}, u:{pl:'F',k:'h',ln:[-53,0],d:-1},
 D:{pl:'F',k:'h',ln:[53],d:1},  d:{pl:'F',k:'h',ln:[53,0],d:1},
 E:{pl:'F',k:'h',ln:[0],d:1},
 R:{pl:'F',k:'v',ln:[53],d:-1}, r:{pl:'F',k:'v',ln:[53,0],d:-1},
 L:{pl:'F',k:'v',ln:[-53],d:1}, l:{pl:'F',k:'v',ln:[-53,0],d:1},
 M:{pl:'F',k:'v',ln:[0],d:1},
 F:{pl:'F',k:'arc',d:1}, f:{pl:'F',k:'arc',d:1}, S:{pl:'F',k:'arc',d:1},
 B:{pl:'B',k:'arc',d:1}, b:{pl:'B',k:'arc',d:1},
 x:{pl:'F',k:'v',ln:[-53,0,53],d:-1}, y:{pl:'F',k:'h',ln:[-53,0,53],d:-1}, z:{pl:'F',k:'arc',d:1},
};
function arrowSVG(spec,mod){
  const flip=mod.includes("'")?-1:1;
  let body='';
  const head=(x,y,ang)=>`<polygon points="0,-9 16,0 0,9" transform="translate(${x},${y}) rotate(${ang})" fill="#fff" stroke="#111" stroke-width="2"/>`;
  const lineS='stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"';
  if(spec.k==='arc'){
    const cw=spec.d*flip>0;
    const R=56,a0=cw?140:40,a1=cw?-70:250;
    const p=a=>[R*Math.cos(a*Math.PI/180),-R*Math.sin(a*Math.PI/180)];
    const [x0,y0]=p(a0),[x1,y1]=p(a1);
    body+=`<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 1 ${cw?1:0} ${x1.toFixed(1)} ${y1.toFixed(1)}" ${lineS}/>`;
    body+=head(x1,y1,cw?(-a1-90):(-a1+90));
  }else if(spec.k==='h'){
    for(const o of spec.ln){
      const dd=spec.d*flip;
      body+=`<line x1="${-dd*58}" y1="${o}" x2="${dd*52}" y2="${o}" ${lineS}/>`;
      body+=head(dd*58,o,dd>0?0:180);
    }
  }else{
    for(const o of spec.ln){
      const dd=spec.d*flip;
      body+=`<line x1="${o}" y1="${-dd*58}" x2="${o}" y2="${dd*52}" ${lineS}/>`;
      body+=head(o,dd*58,dd>0?90:-90);
    }
  }
  if(mod.includes('2')) body+=`<text x="0" y="6" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" stroke="#111" stroke-width="3.5" paint-order="stroke" font-family="ui-monospace,Menlo,monospace">180°</text>`;
  return `<svg viewBox="-78 -78 156 156">${body}</svg>`;
}
function n3arrow(token){
  let el=document.getElementById('n3arrow3d');
  if(!el){el=document.createElement('div');el.id='n3arrow3d';$('#n3orbit').appendChild(el);}
  const spec=ARROWS[token[0]];
  if(!spec){el.innerHTML='';el.dataset.base='';return;}
  const base={F:'translateZ(84px)',U:'rotateX(90deg) translateZ(84px)',B:'rotateY(180deg) translateZ(84px)'}[spec.pl];
  el.dataset.base=base;
  el.style.transform=base;
  el.innerHTML=arrowSVG(spec,token.slice(1));
}
function n3showToken(token,detail){
  const b=N3B.find(x=>x.k===token[0]);if(!b)return null;
  N3.cur=b.k;N3.mod=token.slice(1);
  document.querySelectorAll('.nchip').forEach(x=>x.classList.toggle('on',x.dataset.k===b.k));
  const label=$('#n3label');
  if(label.textContent!==token){
    label.textContent=token;label.classList.remove('step-in');void label.offsetWidth;label.classList.add('step-in');
  }
  const dir=N3.mod==="'"?'反時計回りに90°':N3.mod==='2'?'180°':'時計回りに90°';
  $('#n3desc').textContent=detail||`${b.jp}を${dir} — ${b.g==='rot'?'持ち替え(手数に数えない)':'その面の外側から見て'}`;
  N3.cubies.forEach(c=>c.el.classList.toggle('lit',b.ly(c)));
  netSync(token);n3arrow(token);return b;
}
function n3previewNext(index){
  const box=$('#n3next'),slots=[...box.querySelectorAll('b')],next=N3.seq.slice(index,index+3);
  const before=slots.map(x=>x.textContent).join('|'),after=next.join('|');
  slots.forEach((slot,i)=>{slot.textContent=next[i]||'';slot.hidden=!next[i];});
  box.hidden=!next.length;
  if(next.length&&before!==after){box.classList.remove('step-in');void box.offsetWidth;box.classList.add('step-in');}
}
function n3showStepCount(step=N3.step){
  const el=$('#n3stepcount');if(!el)return;
  el.textContent=N3.seq.length?`${Math.max(0,Math.min(step,N3.seq.length))} / ${N3.seq.length}手`:'';
  el.hidden=!N3.seq.length;
}
function n3sync(){
  const b=n3base();
  n3showToken(b.k+N3.mod);
}
function n3play(){
  if(N3.playing){n3pause();return;}
  n3start(); // 終端なら開始状態(ケース/スクランブル時点)へ自動リセットして再生
}
function invTok(t){return t.endsWith('2')?t:(t.endsWith("'")?t.slice(0,-1):t+"'");}
function n3animate(token,done,dir=1){
  if(N3.animating)return;
  const shown=dir>0?token:invTok(token);
  const lbl=dir>0?`${N3.algName} — ${N3.step+1}手目 / ${N3.seq.length}手`:`${N3.algName} — ${N3.step}手目を戻す`;
  const b=n3showToken(shown,lbl);if(!b){done&&done();return;}
  n3previewNext(dir>0?N3.step+1:N3.step);
  n3showStepCount(dir>0?N3.step+1:N3.step-1);
  N3.animating=true;
  const mod=shown.slice(1),target=90*b.sg*(mod==="'"?-1:1)*(mod==='2'?2:1);
  const movers=N3.cubies.filter(b.ly);
  N3.cubies.forEach(c=>c.el.style.transform=n3pos(c));
  const D=mod==='2'?680:480,t0=performance.now();
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const ar=document.getElementById('n3arrow3d');
  function frame(now){
    const t=Math.min(1,(now-t0)/D), deg=target*ease(t);
    movers.forEach(c=>c.el.style.transform=`rotate${b.ax}(${deg}deg) ${n3pos(c)}`);
    if(ar&&ar.dataset.base)ar.style.transform=`rotate${b.ax}(${deg}deg) ${ar.dataset.base}`;
    if(t<1){N3.raf=requestAnimationFrame(frame);}
    else{
      if(ar&&ar.dataset.base)ar.style.transform=ar.dataset.base;
      N3.state=ap(N3.state,M[shown]);N3.step+=dir;
      N3.cubies.forEach(c=>c.el.style.transform=n3pos(c));n3paint();N3.animating=false;n3updatePlayer();
      if(!N3.playing&&N3.step<N3.seq.length){
        n3showToken(N3.seq[N3.step],`${N3.algName} — ${N3.step}手まで / ${N3.seq.length}手`);
        n3previewNext(N3.step+1);
      }
      done&&done();
    }
  }
  N3.raf=requestAnimationFrame(frame);
}
function n3updatePlayer(){
  const s=$('#apslider');s.max=N3.seq.length;s.value=N3.step;
  s.style.setProperty('--ap-pct',`${N3.seq.length?N3.step/N3.seq.length*100:0}%`);
  n3showStepCount();
  const t=(ja,en)=>(typeof LANG!=='undefined'&&LANG==='en')?en:ja;
  const lbl=N3.playing?t('Ⅱ 一時停止','Ⅱ Pause')
    :(N3.seq.length&&N3.step>=N3.seq.length)?t('↻ もう一度再生','↻ Replay')
    :t('▶ 再生','▶ Play');
  $('#applay').textContent=lbl;
  $('#apmoves').innerHTML=chunkMoves(N3.seq,N3.step);
  if(!N3.animating)n3previewNext(N3.step+1);
  const now=$('#apmoves .now');
  if(now){
    const c=$('#apmoves'),cr=c.getBoundingClientRect(),nr=now.getBoundingClientRect();
    const target=Math.max(0,c.scrollTop+(nr.top-cr.top)-c.clientHeight/2+nr.height/2);
    const behavior=matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
    if(c.scrollTo)try{c.scrollTo({top:target,behavior});}catch(e){c.scrollTop=target;}else c.scrollTop=target;
  }
}
function n3setStep(step){
  N3.step=Math.max(0,Math.min(N3.seq.length,step));N3.state=(N3.start||SOLVED).slice();
  for(let i=0;i<N3.step;i++)N3.state=ap(N3.state,M[N3.seq[i]]);
  N3.cubies.forEach(c=>c.el.style.transform=n3pos(c));n3paint();
  const i=Math.min(N3.step,N3.seq.length-1);if(i>=0)n3showToken(N3.seq[i],`${N3.algName} — ${N3.step}手まで / ${N3.seq.length}手`);
  n3previewNext(i>=0?i+1:-1);
  n3updatePlayer();
}
function n3stepForward(){if(N3.step<N3.seq.length)n3animate(N3.seq[N3.step]);}
function n3stepBack(){if(N3.step>0)n3animate(N3.seq[N3.step-1],null,-1);}
function n3start(){
  if(!N3.seq.length)return;if(N3.step>=N3.seq.length)n3setStep(0);N3.playing=true;n3updatePlayer();
  const loop=()=>{if(!N3.playing)return;if(N3.step>=N3.seq.length){N3.playing=false;n3updatePlayer();return;}n3animate(N3.seq[N3.step],loop);};loop();
}
function n3pause(){N3.playing=false;n3updatePlayer();}
function n3resetBasic(){
  n3pause();N3.yaw=-35;N3.pitch=-25;N3.focus=true;
  const preset=$('#appreset');if(preset)preset.selectedIndex=0;
  const wrap=$('#n3stage')?.closest('.n3wrap');
  if(wrap){wrap.classList.remove('dock-collapsed','dock-dragging');wrap.style.transform='';wrap.style.opacity='';}
  const restore=$('#n3DockRestore');if(restore)restore.hidden=true;
  if(n3SetNetVisible)n3SetNetVisible(true);
  document.querySelectorAll('#apfocus button').forEach(b=>b.classList.toggle('on',b.dataset.f==='1'));
  n3loadAlg('R','基本回転 R',false,false,'solved','trigger');
  n3showToken('R');n3view();
}
/* そのステージ「完了直後」の現実的な状態を生成する。
   OLL再生後はPLLが残り、F2L再生後はLL全体が残る。完全に揃うのはPLL(最終局面)のみ */
function randPick(a){return a[Math.floor(Math.random()*a.length)];}
function randAUF(st){const k=Math.floor(Math.random()*4);for(let i=0;i<k;i++)st=ap(st,M.U);return st;}
function realisticEnd(kind){
  if(kind==='pll'||kind==='trigger'||!kind)return SOLVED.slice();
  const PK=Object.keys(PLL),OC=[21,22,23,24,25,26,27],OK=Object.keys(OLL);
  if(kind==='oll')return randAUF(caseState(PLL[randPick(PK)]));
  if(kind==='olledge'){
    let st=randAUF(caseState(PLL[randPick(PK)]));
    return randAUF(run(st,inv(OLL[randPick(OC)])));
  }
  if(kind==='f2l'){
    let st=randAUF(caseState(PLL[randPick(PK)]));
    return randAUF(run(st,inv(OLL[randPick(OK)])));
  }
  if(kind==='cross'){
    const blocks=['U',"U'",'U2'];
    for(const f of ['R','L','F','B'])for(const u of ['U',"U'",'U2'])blocks.push(`${f} ${u} ${f}'`);
    const seq=[];for(let i=0;i<9;i++)seq.push(randPick(blocks));
    return run(SOLVED,seq.join(' '));
  }
  return SOLVED.slice();
}
function n3loadAlg(alg,name,autoplay,navigate=true,startMode='solved',kind){
  const seq=toks(alg).filter(t=>M[t]);N3.playing=false;N3.seq=seq;N3.algName=name||'手順';
  N3.startMode=startMode;
  if(kind!==undefined)N3.caseKind=kind;
  if(startMode==='case'&&seq.length){
    N3.caseEnd=realisticEnd(N3.caseKind);
    N3.start=run(N3.caseEnd,inv(seq.join(' ')));
  }else{
    N3.start=SOLVED.slice();
  }
  document.querySelectorAll('#apstart button').forEach(b=>b.classList.toggle('on',b.dataset.st===startMode));
  $('#apinput').value=seq.join(' ');n3setStep(0);
  if(navigate&&!$('#pg-basic').classList.contains('on')){go('basic');requestAnimationFrame(()=>{const st=$('#n3stage');if(st&&st.scrollIntoView)try{st.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}});}
  if(autoplay)n3start();
}

/* ================= tribox-style static notation diagrams ================= */
function ncardAnimate(bt,tok){
  if(bt._raf)cancelAnimationFrame(bt._raf);
  if(bt._settle)clearTimeout(bt._settle);
  const total=tok.includes('2')?180:90, D=tok.includes('2')?950:620, t0=performance.now();
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const put=svg=>{const el=bt.querySelector('svg');if(el)el.outerHTML=svg;};
  const step=now=>{
    const t=Math.min(1,(now-t0)/D);
    put(triboxSVG(tok,total*ease(t)));
    if(t<1){bt._raf=requestAnimationFrame(step);}
    else{bt._raf=null;bt._settle=setTimeout(()=>put(triboxSVG(tok)),420);}
  };
  bt._raf=requestAnimationFrame(step);
}

function triboxSVG(token,prog){
  const base=token.replace(/['2]/g,''),mod=token.replace(base,'');
  const def=N3B.find(b=>b.k===base);if(!def)return '';
  if(def.g==='rot')return axisRotationSVG(token,prog);
  const total=mod.includes('2')?180:90;
  if(prog===undefined)prog=36;
  const lift=0.19*Math.sin(Math.PI*Math.min(prog,total)/total); // 完了時に層が収まる
  const S=15.5;
  const d1=[Math.sqrt(3)/2*S,.5*S],d2=[-Math.sqrt(3)/2*S,.5*S],vv=[0,S];
  const C0=[49,52.5];
  const proj=p=>[C0[0]+p[0]*d1[0]+p[1]*vv[0]+p[2]*d2[0], C0[1]+p[0]*d1[1]+p[1]*vv[1]+p[2]*d2[1]];
  const prime=mod.includes("'");
  const th=(prog*Math.PI/180)*def.sg*(prime?-1:1);
  const rot=p=>{const [x,y,z]=p,c=Math.cos(th),si=Math.sin(th);
    if(def.ax==='X')return [x, y*c-z*si, y*si+z*c];
    if(def.ax==='Y')return [x*c+z*si, y, -x*si+z*c];
    return [x*c-y*si, x*si+y*c, z];};
  const V=[1,-1,1];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const axI={X:0,Y:1,Z:2}[def.ax];
  const movingLv=[-1,0,1].filter(L=>{const c={x:0,y:0,z:0};c[def.ax.toLowerCase()]=L;return def.ly(c);});
  const MOV='#FFFF55',STA='#FFFFFF',BODY='var(--panel2)';
  // スラブを奥→手前の順に描く(凸体×分離平面なので順序は厳密に正しい)
  const slabs=[-1,0,1].map(L=>{
    const mv=movingLv.includes(L);
    const off=mv&&L!==0?L*lift:0;
    const ctr=[0,0,0];ctr[axI]=L+off;
    const c2=mv?rot(ctr):ctr;
    return {L,mv,off,depth:dot(c2,V)};
  }).sort((a,b)=>a.depth-b.depth);
  let out='';
  const seen=new Set();
  for(const sl of slabs){
    const {L,mv,off}=sl;
    const tf=p=>{const q=p.slice();q[axI]+=off;return mv?rot(q):q;};
    const lo=L-0.5,hi=L+0.5;
    const range=i=>i===axI?[lo,hi]:[-1.5,1.5];
    // 6面: (fixI,fixV)
    const faceDefs=[];
    for(const fi of [0,1,2]){
      const [a,b]=range(fi);
      faceDefs.push([fi,a,-1],[fi,b,1]); // sgn=法線向き
    }
    const bodyQ=[],stkQ=[];
    for(const [fi,fv,sg] of faceDefs){
      const ui=(fi+1)%3, wi=(fi+2)%3;
      const [u0,u1]=range(ui),[w0,w1]=range(wi);
      const mkp=(u,w)=>{const q=[0,0,0];q[fi]=fv;q[ui]=u;q[wi]=w;return q;};
      // 外向き法線が+sgn*fiになる巻き順を構成的に決定
      let pts=[mkp(u0,w0),mkp(u1,w0),mkp(u1,w1),mkp(u0,w1)];
      const e1=[pts[1][0]-pts[0][0],pts[1][1]-pts[0][1],pts[1][2]-pts[0][2]];
      const e2=[pts[3][0]-pts[0][0],pts[3][1]-pts[0][1],pts[3][2]-pts[0][2]];
      const n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
      if(n[fi]*sg<0)pts=[pts[0],pts[3],pts[2],pts[1]];
      // 回転後の法線で可視判定
      const nref=[0,0,0];nref[fi]=sg;
      const nr=mv?rot(nref):nref;
      if(dot(nr,V)<=0.02)continue;
      bodyQ.push(pts.map(tf));
      if(Math.abs(fv)!==1.5)continue; // ステッカーは外表面のみ
      const cu=ui===axI?[L]:[-1,0,1], cw=wi===axI?[L]:[-1,0,1];
      for(const a of cu)for(const b of cw){
        const m=0.40,e=0.05,fv2=fv+sg*e;
        let sp=[[a-m,b-m],[a+m,b-m],[a+m,b+m],[a-m,b+m]].map(([u,w])=>{const q=[0,0,0];q[fi]=fv2;q[ui]=u;q[wi]=w;return q;});
        if(n[fi]*sg<0)sp=[sp[0],sp[3],sp[2],sp[1]];
        stkQ.push(sp.map(tf));
      }
    }
    for(const q of bodyQ)out+=`<polygon points="${q.map(p=>{const s2=proj(p);return s2[0].toFixed(1)+','+s2[1].toFixed(1);}).join(' ')}" fill="${BODY}" fill-opacity=".76" stroke="var(--tx2)" stroke-opacity=".62" stroke-width="0.46" stroke-linejoin="round"/>`;
    for(const q of stkQ)out+=`<polygon points="${q.map(p=>{const s2=proj(p);return s2[0].toFixed(1)+','+s2[1].toFixed(1);}).join(' ')}" fill="${mv?MOV:STA}" stroke="var(--dline)" stroke-opacity=".9" stroke-width="0.52" stroke-linejoin="round"/>`;
  }
  /* ---- 直線矢印のみ(層と一緒に回した位置に描く) ---- */
  const head=(x,y,ang)=>`<polygon points="-1,-3.4 5.8,0 -1,3.4" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${ang.toFixed(1)})" fill="var(--tx)" stroke="var(--bg)" stroke-width="0.7" stroke-linejoin="round"/>`;
  const line3=(a,b)=>{const A=proj(a),B=proj(b);
    return `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="var(--bg)" stroke-opacity=".88" stroke-width="3" stroke-linecap="round"/>`
      +`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="var(--tx)" stroke-width="1.55" stroke-linecap="round"/>`
      +head(B[0],B[1],Math.atan2(B[1]-A[1],B[0]-A[0])*180/Math.PI);};
  const dir=Math.sign(th);
  const tfA=(p,L)=>{const q=p.slice();q[axI]+=(L!==0?L*lift:0);return rot(q);};
  if(def.ax==='Y'){
    // 前面の行: dx/dθ = +z·θ̇ → 終点は +x·dir 側…実符号: x'=x c + z s ⇒ 前面(z>0)は dirと同じ向きへ動く
    for(const L of movingLv)out+=line3(tfA([-1.15*dir,L,1.68],L),tfA([1.15*dir,L,1.68],L));
  }else if(def.ax==='X'){
    // 前面の列: y'=y c − z s ⇒ 前面は −dir(上=負y)方向へ
    for(const L of movingLv)out+=line3(tfA([L,1.15*dir,1.68],L),tfA([L,-1.15*dir,1.68],L));
  }else{
    // Z軸系: 上面ストリップに水平矢印。x'=x c − y s ⇒ 上面(y<0)は +dir 方向へ
    for(const L of movingLv)out+=line3(tfA([-1.15*dir,-1.72,L],L),tfA([1.15*dir,-1.72,L],L));
  }
  if(mod.includes('2'))out+=`<text x="26" y="18" text-anchor="middle" font-size="15" font-weight="900" fill="var(--tx)" stroke="var(--bg)" stroke-width="2" paint-order="stroke" font-family="ui-monospace,Menlo,monospace">180°</text>`;
  return `<svg class="turnnotation" viewBox="-6 -8 112 120" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

function axisRotationSVG(token,prog){
  const base=token[0],prime=token.includes("'"),active=base.toLowerCase();
  const colors={x:'#ff453a',y:'#30d158',z:'#0a84ff'};
  // 実際の投影軸方向に沿って描く(面センターで出入りする)
  const AXV={x:[1,0,0],y:[0,-1,0],z:[0,0,1]}; // 画面上の「上向き」が自然になるようyは-向きを正に描く
  const markerId=`axis-${active}-${prime?'p':'n'}`;
  const arrow=(x,y,ang,color,opacity)=>`<polygon points="-1,-4 7,0 -1,4" transform="translate(${x} ${y}) rotate(${ang})" fill="${color}" opacity="${opacity}"/>`;
  const C0=[60,55],S0=12.2,ax1=[Math.sqrt(3)/2*S0,.5*S0],ax2=[-Math.sqrt(3)/2*S0,.5*S0],axv=[0,S0];
  const proj0=p=>[C0[0]+p[0]*ax1[0]+p[1]*axv[0]+p[2]*ax2[0],C0[1]+p[0]*ax1[1]+p[1]*axv[1]+p[2]*ax2[1]];
  const V0=[1,-1,1];
  let bgAxes='',fgAxis='';
  const axGeo={};
  for(const k of ['x','y','z']){
    const e=AXV[k];
    const front=(e[0]*V0[0]+e[1]*V0[1]+e[2]*V0[2])>=0?1:-1; // 視点側に出る向き
    const Pf=proj0(e.map(v=>v*1.5*front));   // 手前の面センター(実線の終端)
    const Pb=proj0(e.map(v=>v*-1.5*front));  // 奥の面センター
    const B=proj0(e.map(v=>v*3.0*front));    // 矢印先端
    const A=proj0(e.map(v=>v*-2.6*front));   // 反対側の端
    const ang=Math.atan2(B[1]-Pf[1],B[0]-Pf[0])*180/Math.PI;
    axGeo[k]={A,B,Pf,ang};
    const color=colors[k],on=k===active;
    if(on){
      // 奥側〜内部: 背面レイヤ(半透明キューブ越しに透ける)
      bgAxes+=`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${Pf[0].toFixed(1)}" y2="${Pf[1].toFixed(1)}" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity=".34"/>`;
      // 手前の面センター〜矢印: 実線(キューブ表面から生えて見える)
      fgAxis+=`<line x1="${Pf[0].toFixed(1)}" y1="${Pf[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`;
      fgAxis+=`<circle cx="${Pf[0].toFixed(1)}" cy="${Pf[1].toFixed(1)}" r="2.1" fill="${color}"/>`;
      fgAxis+=arrow(B[0],B[1],ang,color,1);
      fgAxis+=`<text x="${(B[0]+(B[0]-C0[0])*.22).toFixed(1)}" y="${(B[1]+(B[1]-C0[1])*.22).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${color}" stroke="var(--panel)" stroke-width="3.2" paint-order="stroke" font-size="14" font-weight="900" font-family="ui-monospace,Menlo,monospace">${k}</text>`;
    }else{
      bgAxes+=`<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}" stroke="${color}" stroke-width="1.1" stroke-linecap="round" opacity=".15"/>`;
      bgAxes+=arrow(B[0],B[1],ang,color,.2);
      bgAxes+=`<text x="${(B[0]+(B[0]-C0[0])*.22).toFixed(1)}" y="${(B[1]+(B[1]-C0[1])*.22).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${color}" opacity=".35" font-size="9" font-weight="800" font-family="ui-monospace,Menlo,monospace">${k}</text>`;
    }
  }
    const sweep=prime?0:1;
  const start=prime?'82 52':'39 35',end=prime?'39 35':'82 52';
  const RINGROT={x:-28,y:90,z:28};
  const ring=`<path class="axis-turn-path" d="M ${start} A 27 18 ${RINGROT[active]} 1 ${sweep} ${end}" fill="none" stroke="${colors[active]}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="8 5" marker-end="url(#${markerId})"/>`;

  // 色つき半透明キューブを実際にxyz軸まわりへ回す。見えている面だけを描画する。
  const def=N3B.find(b=>b.k===base);
  const angle=(prog===undefined?0:Math.min(prog,90))*Math.PI/180*def.sg*(prime?-1:1);
  const c=Math.cos(angle),s=Math.sin(angle);
  const rot=p=>{
    const [x,y,z]=p;
    if(def.ax==='X')return [x,y*c-z*s,y*s+z*c];
    if(def.ax==='Y')return [x*c+z*s,y,-x*s+z*c];
    return [x*c-y*s,x*s+y*c,z];
  };
  const C=[60,55],S=12.2,d1=[Math.sqrt(3)/2*S,.5*S],d2=[-Math.sqrt(3)/2*S,.5*S],vv=[0,S];
  const project=p=>[C[0]+p[0]*d1[0]+p[1]*vv[0]+p[2]*d2[0],C[1]+p[0]*d1[1]+p[1]*vv[1]+p[2]*d2[1]];
  const V=[1,-1,1],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const faceColors={xp:FC[1],xn:FC[4],yp:FC[3],yn:FC[0],zp:FC[2],zn:FC[5]};
  const faces=[];
  for(const fi of [0,1,2])for(const sg of [-1,1]){
    const normal=[0,0,0];normal[fi]=sg;
    const nr=rot(normal),visibility=dot(nr,V);
    if(visibility<=.025)continue;
    const ui=(fi+1)%3,wi=(fi+2)%3,fv=sg*1.5;
    const point=(u,w)=>{const p=[0,0,0];p[fi]=fv;p[ui]=u;p[wi]=w;return rot(p);};
    const points=[point(-1.5,-1.5),point(1.5,-1.5),point(1.5,1.5),point(-1.5,1.5)];
    const key=`${['x','y','z'][fi]}${sg>0?'p':'n'}`;
    const lines=[];
    for(const q of [-.5,.5]){
      lines.push([point(q,-1.5),point(q,1.5)]);
      lines.push([point(-1.5,q),point(1.5,q)]);
    }
    faces.push({points,lines,color:faceColors[key],depth:dot(rot(normal.map(v=>v*1.5)),V),visibility});
  }
  faces.sort((a,b)=>a.depth-b.depth);
  const cubeFaces=faces.map(face=>{
    const pts=face.points.map(p=>project(p).map(v=>v.toFixed(1)).join(',')).join(' ');
    const alpha=Math.min(.9,.7+face.visibility*.1).toFixed(2);
    const grid=face.lines.map(([a,b])=>{const A=project(a),B=project(b);return `<line x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}"/>`;}).join('');
    return `<g class="axis-face"><polygon points="${pts}" fill="${face.color}" fill-opacity="${alpha}" stroke="var(--tx)" stroke-opacity=".68" stroke-width="1.1"/>${grid}</g>`;
  }).join('');
  const pulse=prog===undefined?1:.8+.2*Math.sin(Math.min(prog,90)*Math.PI/180);
  return `<svg class="axisrotation axis-${active}${prog===undefined?'':' axis-playing'}" viewBox="0 0 124 110" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="${colors[active]}"/></marker></defs>
    ${bgAxes}<g class="axis-cube-shape">${cubeFaces}</g>
    ${fgAxis}<g opacity="${pulse.toFixed(2)}">${ring}</g>
    <rect x="8" y="8" width="28" height="22" rx="8" fill="${colors[active]}" fill-opacity=".18" stroke="${colors[active]}" stroke-opacity=".62"/>
    <text x="22" y="19" text-anchor="middle" dominant-baseline="middle" fill="${colors[active]}" font-size="13" font-weight="900" font-family="ui-monospace,Menlo,monospace">${token}</text>
  </svg>`;
}

/* ================= cube structure (home) ================= */
function buildStruct(){
  const w=$('#structRow');if(!w)return;
  const U=[0,1,2,3,4,5,6,7,8],F=i=>18+i,R=i=>9+i;
  const CENTERS=new Set([4,F(4),R(4)]);
  const EDGES=new Set([1,3,5,7,F(1),F(3),F(5),F(7),R(1),R(3),R(5),R(7)]);
  const CORNERS=new Set([0,2,6,8,F(0),F(2),F(6),F(8),R(0),R(2),R(6),R(8)]);
  const data=[
    ['センター ×6',CENTERS,'軸に固定され動かない。面の色はセンターが決める'],
    ['エッジ ×12',EDGES,'ステッカー2枚。辺の位置だけを移動する'],
    ['コーナー ×8',CORNERS,'ステッカー3枚。角の位置だけを移動する'],
  ];
  w.innerHTML=data.map(([t,keep,d])=>`<div class="stcard">${isoSVG(SOLVED,false,keep)}<b>${t}</b><span>${d}</span></div>`).join('');
}

const PERFECT=["U F' L' U' R2 F' R2 B' U' R F' U F D' L2 F2 L2 U'","U' F R U L2 F L2 B U L' F U' F' D R2 F2 R2 U"];
