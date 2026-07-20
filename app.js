/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= solve flow (decision guide) ================= */
const FLOWD=[
 {k:'inspect',c:'var(--tx3)',t:'インスペクション',look:'開始前の15秒。白エッジ4枚の位置',
  s:'デイジーに集める段取りを決める',
  a:'クロスを最後まで計画し切る。余裕があれば最初のF2Lペアの行き先まで見る',
  page:null,pre:null,done:'持ち替えずに回し始められる状態'},
 {k:'cross',c:'var(--wh)',t:'Cross',look:'白エッジと側面の色',
  s:'黄面の周りにデイジー → 花びらの側面色をセンターに合わせて180°ずつ落とす',
  a:'白面を下にしたまま8手以内で直接。エッジ2枚を同時に運ぶ手を優先',
  page:'cross',pre:'XS|XA',done:'底面に白十字+側面色がセンターと一致'},
 {k:'f2l',c:'var(--or)',t:'F2L ×4',look:'白コーナーと相方エッジの位置関係',
  s:'基本4形に持ち込む。両方U面なら白の向きを見て「分離」か「直結」かを判断',
  a:'ケースを見た瞬間に41分類から即断。スロット内にあるなら引き出しから',
  page:'f2l',pre:'F',done:'下2段(クロス+4スロット)が完成'},
 {k:'oll',c:'var(--yl)',t:'OLL',look:'上面の黄色パターン(側面は見ない)',
  s:'十字ができているか? → なければエッジ手順(点/L字/一文字) → できていればコーナー7種から選ぶ',
  a:'形グループ(点・稲妻・魚・L字・十字…)で分類 → 57ケースを即断',
  page:'oll',pre:'O',done:'上面が全部黄色(側面はまだズレていてよい)'},
 {k:'pll',c:'var(--bl)',t:'PLL',look:'側面上段の色配置(ヘッドライト)',
  s:'2段階: まずコーナー位置(ヘッドライトあり=T / なし=Y) → 次にエッジ位置(Ua/Ub/H/Z)',
  a:'ヘッドライトの組数で分岐: 4組=エッジのみ / 1組=隣接系 / 0組=対角系 / 角も辺も3点=G系',
  page:'pll',pre:'P',done:'AUF(上面調整)して全面一致 = 完成'},
];
function buildFlow(){
  const w=$('#flowBox');if(!w)return;
  w.innerHTML='';
  FLOWD.forEach((n,i)=>{
    const d=document.createElement('div');
    d.className='fnode'+(i===0?'':'');
    d.style.setProperty('--fc',n.c);
    let prog='';
    if(n.pre){
      const ids=idsFor(n.pre);
      const done=ids.filter(x=>prog2().has(x)).length;
      prog=`<span class="fprog">習得 ${done}/${ids.length}</span>`;
    }
    d.innerHTML=`<div class="fdot"></div>
      <button type="button" class="fhead" aria-expanded="false"><b>${n.t}</b><span class="lk">${n.look}</span><span class="arw">▶</span></button>
      <div class="fbody">
        <div class="frow"><span class="tag">見る</span><span>${n.look}</span></div>
        <div class="frow"><span class="tag jd">判断</span><span>${mode==='s'?n.s:n.a}</span></div>
        <div class="frow"><span class="tag">完了</span><span>${n.done}</span></div>
        <div class="fmeta">${n.page?`<button class="btn" data-go="${n.page}">ページへ</button>`:''}${prog}</div>
      </div>`;
    d.querySelector('.fhead').addEventListener('click',e=>{const open=d.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open));});
    const gb=d.querySelector('[data-go]');
    if(gb)gb.addEventListener('click',e=>{e.stopPropagation();go(gb.dataset.go);});
    w.appendChild(d);
  });
}
function prog2(){return prog;}

function idsFor(prefix){
  if(prefix==='XS|XA')return allIds.filter(i=>i.startsWith(mode==='s'?'XS':'XA'));
  if(prefix==='O')return allIds.filter(i=>i.startsWith('O'));
  return allIds.filter(i=>i.startsWith(prefix)&&!(prefix==='F'&&false));
}
function refreshCounts(){
  try{buildFlow();}catch(e){}
  const done=allIds.filter(i=>prog.has(i)).length;
  $('#hcount').innerHTML=`習得 <b>${done}</b>/${allIds.length}`;
}

/* ================= quiz ================= */
let qCur=null;
let qLastAUF=0;
function qrot(st){
  const on=document.querySelector('#qFilters .fchip[data-qopt="auf"]');
  if(!on||!on.classList.contains('on'))return st;
  const k=1+Math.floor(Math.random()*3);
  for(let i=0;i<k;i++)st=ap(st,M.U);
  qLastAUF=k;return st;
}
function qPool(){
  const on=[...document.querySelectorAll('#qFilters .fchip.on')].map(b=>b.dataset.q);
  const pool=[];
  if(on.includes('F2L')){
    const list=mode==='s'?F2LSIMPLE.map(i=>F2L[i]):F2L;
    list.forEach(c=>pool.push({t:'F2L',n:'F2L #'+(F2L.indexOf(c)+1),a:c.a,svg:()=>isoSVG(qrot(caseState(c.a)))}));
  }
  if(on.includes('OLL')){
    const ids=mode==='s'?[21,22,23,24,25,26,27]:Object.keys(OLL).map(Number);
    ids.forEach(n=>pool.push({t:'OLL',n:'OLL '+n,a:OLL[n],svg:()=>llSVG(qrot(caseState(OLL[n])),'oll',false)}));
    if(mode==='s')OLL2E.forEach(([nm,alg])=>pool.push({t:'OLL',n:nm,a:alg,svg:()=>llSVG(qrot(caseState(alg)),'oll',true)}));
  }
  if(on.includes('PLL')){
    const ids=mode==='s'?PLL2:Object.keys(PLL);
    ids.forEach(n=>pool.push({t:'PLL',n:n+' perm',a:PLL[n],svg:()=>llSVG(qrot(caseState(PLL[n])),'pll',false)}));
  }
  return pool;
}
function qNext(){
  const pool=qPool();
  if(!pool.length){$('#qMeta').textContent='出題範囲を選択';$('#qFig').innerHTML='';$('#qAns').innerHTML='';return;}
  qLastAUF=0;
  qCur=pool[Math.floor(Math.random()*pool.length)];
  $('#qMeta').textContent=qCur.t;
  $('#qFig').innerHTML=qCur.svg();
  $('#qAns').innerHTML='<div style="color:var(--tx3);font-size:.75rem">この手順は?</div>';
}
$('#qNext').addEventListener('click',qNext);
$('#qReveal').addEventListener('click',()=>{
  if(!qCur)return;
  const aufNote=qLastAUF?`<div style="font-size:.66rem;color:var(--tx3);margin-top:3px">※向きランダム中:U調整(AUF)してから実行</div>`:'';
  $('#qAns').innerHTML=`<div class="nm">${qCur.n}</div><div class="alg mono">${chunk(qCur.a)}</div>${aufNote}<button class="playmini" id="qPlay">3Dで再生</button>`;
  const km={F2L:'f2l',OLL:'oll',PLL:'pll'};
  $('#qPlay').addEventListener('click',()=>{n3loadAlg(qCur.a,qCur.n,false,false,'case',km[qCur.t]||'trigger');openPP();});
});
document.querySelectorAll('#qFilters .fchip').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.classList.contains('on')));
  b.addEventListener('click',()=>{const on=b.classList.toggle('on');b.setAttribute('aria-pressed',String(on));qNext();});
});

/* ================= cross figures ================= */
function miniFace(cells){ // 3x3, cells = array of 9 colors
  let s='';const S=28,G=3;
  for(let k=0;k<9;k++){const r=Math.floor(k/3),c=k%3;s+=rect(3+c*(S+G),3+r*(S+G),S,S,cells[k]);}
  return s;
}
document.getElementById('figDaisy').innerHTML=miniFace([DARK,'#FFFFFF',DARK,'#FFFFFF','#FFFF55','#FFFFFF',DARK,'#FFFFFF',DARK]);
document.getElementById('figCross').innerHTML=miniFace([DARK,'#FFFFFF',DARK,'#FFFFFF','#FFFFFF','#FFFFFF',DARK,'#FFFFFF',DARK]);

/* ================= progress code ================= */
let toastTimer=null;
function showToast(message,error=false){
  const el=$('#toast');if(!el)return;clearTimeout(toastTimer);el.textContent=message;el.classList.toggle('err',error);el.classList.add('show');
  toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}
function isKnownProgressId(id){
  let m;if(/^X[SA][1-3]$/.test(id)||/^OE[1-3]$/.test(id))return true;
  if((m=id.match(/^F(\d+)$/)))return +m[1]>=0&&+m[1]<F2L.length;
  if((m=id.match(/^O(\d+)$/)))return Object.hasOwn(OLL,+m[1]);
  if(id.startsWith('P'))return Object.hasOwn(PLL,id.slice(1));
  return false;
}
$('#btnGen').addEventListener('click',()=>{$('#codeBox').value='CFOP:'+btoa([...prog].join(','));showToast('進捗コードを発行しました');});
$('#btnCopy').addEventListener('click',async()=>{
  const box=$('#codeBox'),value=box.value.trim();if(!value){showToast('先に進捗コードを発行してください',true);return;}
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
    else{box.select();if(!document.execCommand('copy'))throw new Error('copy failed');}
    showToast('進捗コードをコピーしました');
  }catch(e){showToast('コピーできませんでした。コードを選択して手動でコピーしてください',true);}
});
$('#btnLoad').addEventListener('click',()=>{
  const v=$('#codeBox').value.trim();
  if(!v.startsWith('CFOP:')){showToast('CFOP: で始まる進捗コードを入力してください',true);return;}
  try{
    const ids=atob(v.slice(5)).split(',').filter(Boolean);
    if(ids.some(id=>!isKnownProgressId(id)))throw new Error('unknown progress id');
    const restored=new Set(ids);prog.clear();restored.forEach(id=>prog.add(id));
    saveProg();rebuild();
    showToast('進捗を復元しました');
  }catch(e){showToast('進捗コードが壊れているか、対応していない形式です',true);}
});

