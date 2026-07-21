/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= build pages ================= */
let mode='s'; // s=簡易 a=本格
try{mode=localStorage.getItem('cfop-mode')||'s';}catch(e){}
const $=q=>document.querySelector(q);

function algCard(id,name,alg,svg,extraCls,kind){
  const d=document.createElement('div');
  d.className='acard'+(extraCls?' '+extraCls:'');
  const setup=inv(alg);
  d.innerHTML=`<div class="chk">✓</div>${svg}<div class="algbody"><div class="nm" data-setup="${setup}" title="長押しで作り方を表示">${name}<span class="mv">${hm(alg)}手</span></div><div class="setuprow" hidden><span class="setuplbl">作り方</span><span class="setupseq mono">${chunk(setup)}</span></div><div class="alg mono">${chunk(alg)}</div><div class="algmeta"><span class="cycle">${cycleText(alg)}</span><button class="playmini">3Dで再生</button></div></div>`;
  attach3DButton(d,alg,name,kind);
  bindSetupToggle(d);
  bindCard(d,id);
  return d;
}

/* タイトル長押しで「作り方(完成状態から現在パターンを作る手順=解法の逆)」をトグル表示 */
function bindSetupToggle(card){
  const nm=card.querySelector('.nm[data-setup]');
  const row=card.querySelector('.setuprow');
  if(!nm||!row)return;
  let timer=null,fired=false;
  const show=()=>{fired=true;row.hidden=!row.hidden;if(navigator.vibrate)navigator.vibrate(8);};
  nm.addEventListener('pointerdown',e=>{
    fired=false;timer=setTimeout(show,450);
  });
  const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}};
  nm.addEventListener('pointerup',cancel);
  nm.addEventListener('pointerleave',cancel);
  nm.addEventListener('pointercancel',cancel);
  // 長押しで開いた直後のクリックを無効化(誤操作防止)
  nm.addEventListener('click',e=>{if(fired){e.preventDefault();e.stopPropagation();fired=false;}});
  // 右クリック長押しメニュー抑止
  nm.addEventListener('contextmenu',e=>e.preventDefault());
}
function pllCard(id,name,alg){
  const st=caseState(alg);
  return algCard(id,name,alg,llSVG(st,'pll',false,true),null,'pll');
}
function buildOLL(){
  const w=$('#ollList');w.innerHTML='';allPurge('O');
  if(mode==='s'){
    $('#ollSub').textContent='2-Look OLL:10手順。①エッジで十字 → ②コーナーの向き';
    const h1=secEl('① エッジの向き(3)','角のマスは無視');w.appendChild(h1);
    let g=document.createElement('div');g.className='grid2';
    OLL2E.forEach(([nm,alg],i)=>g.appendChild(algCard('OE'+(i+1),nm,alg,llSVG(caseState(alg),'oll',true),null,'olledge')));
    w.appendChild(g);
    const h2=secEl('② コーナーの向き(7)','十字グループと共通');w.appendChild(h2);
    g=document.createElement('div');g.className='grid2';
    [21,22,23,24,25,26,27].forEach(n=>g.appendChild(algCard('O'+n,'OLL '+n,OLL[n],llSVG(caseState(OLL[n]),'oll',false),null,'oll')));
    w.appendChild(g);
  }else{
    $('#ollSub').textContent='フルOLL:57手順。形のグループごとに攻略する';
    OLLG.forEach(([nm,ids,hint])=>{
      w.appendChild(secEl(`${nm}(${ids.length})`,hint));
      const g=document.createElement('div');g.className='grid2';
      ids.forEach(n=>g.appendChild(algCard('O'+n,'OLL '+n,OLL[n],llSVG(caseState(OLL[n]),'oll',false),null,'oll')));
      w.appendChild(g);
    });
  }
}
const PLLFLOW_A=[
 ["4組(全面)","エッジのみ残り",["Ua","H"],"角は完成。矢印のないエッジ交換: Ua/Ub/H/Z","エッジのみ"],
 ["1組","隣接系 or 3点系",["T","Ga"],"ブロックの有無で細分: T/F/J/R(隣接交換)・G(角も辺も3点)","隣接交換"],
 ["0組","対角系",["Y","E"],"角が対角に入れ替わっている: V/Y/N/E","対角交換"],
];
const PLLFLOW_S=[
 ["あり","Tパーム",["T"],"ヘッドライトを左に向けて T","① コーナーの位置(2)"],
 ["なし","Yパーム",["Y"],"対角交換。向きはどこでも Y","① コーナーの位置(2)"],
 ["角完成後","エッジ4種",["Ua","H"],"3点=Ua/Ub(回す向きで判別)・対面=H・隣接=Z","② エッジの位置(4)"],
];
function buildPLLFlow(w){
  const box=document.createElement('div');box.className='pllflowbox';
  const data=mode==='s'?PLLFLOW_S:PLLFLOW_A;
  const ttl=mode==='s'?'判別: まずヘッドライト(同色の角2つ)':'判別: 4側面のうちヘッドライトは何組?';
  box.innerHTML=`<div class="pfttl">${ttl}</div>`+data.map(([badge,name,reps,desc,anchor],i)=>{
    const svgs=reps.map(k=>`<span class="pfsvg">${llSVG(caseState(PLL[k]),'pll',false)}</span>`).join('');
    return `<button type="button" class="pfrow" data-anchor="${anchor}"><span class="pfbadge">${badge}</span><span class="pfbd"><b>${name}</b><span class="pfd">${desc}</span></span>${svgs}</button>`;
  }).join('');
  box.querySelectorAll('.pfrow').forEach(r=>r.addEventListener('click',()=>{
    const t=[...document.querySelectorAll('#pllList h2.sec')].find(h=>h.textContent.includes(r.dataset.anchor));
    if(t&&t.scrollIntoView)try{t.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
  }));
  w.appendChild(box);
}
function buildPLL(){
  const w=$('#pllList');w.innerHTML='';
  buildPLLFlow(w);allPurge('P');allPurge('OE')/*no-op safe*/;
  if(mode==='s'){
    $('#pllSub').textContent='2-Look PLL:6手順。①コーナー位置 → ②エッジ位置';
    const secs=[["① コーナーの位置(2)",["T","Y"],"ヘッドライトあり=T/なし=Y"],["② エッジの位置(4)",["Ua","Ub","H","Z"],""]];
    secs.forEach(([nm,ids,hint])=>{
      w.appendChild(secEl(nm,hint));
      const g=document.createElement('div');g.className='grid2';
      ids.forEach(n=>g.appendChild(pllCard('P'+n,n+' perm',PLL[n])));
      w.appendChild(g);
    });
  }else{
    $('#pllSub').textContent='フルPLL:21手順。側面の色パターンで判別する';
    PLLG.forEach(([nm,ids,hint])=>{
      w.appendChild(secEl(`${nm}(${ids.length})`,hint));
      const g=document.createElement('div');g.className='grid2';
      ids.forEach(n=>g.appendChild(pllCard('P'+n,n+' perm',PLL[n])));
      w.appendChild(g);
    });
  }
}
/* ===== F2L 左スロット(FL)ミラー ===== */
const MIRP=(()=>{const m=new Array(54);
  const put=(f,g)=>{for(let k=0;k<9;k++){const r=Math.floor(k/3),c=k%3;m[f*9+k]=g*9+r*3+(2-c);}};
  put(0,0);put(3,3);put(2,2);put(5,5);put(1,4);put(4,1);return m;})();
function mirState(st){const r=new Array(54);for(let p=0;p<54;p++)r[MIRP[p]]=MIRP[st[p]];return r;}
function mirAlg(alg){
  const map={R:'L',L:'R',r:'l',l:'r',U:'U',D:'D',F:'F',B:'B',u:'u',d:'d',f:'f',b:'b',M:'M',E:'E',S:'S',x:'x',y:'y',z:'z'};
  return toks(alg).map(t=>{
    const base=map[t[0]]||t[0],suf=t.slice(1);
    if(suf==='2')return base+'2';
    return suf==="'"?base:base+"'";
  }).join(' ');
}
let f2lMirror=false;
function buildF2L(){
  const w=$('#f2lList');w.innerHTML='';
  const segw=document.createElement('div');
  segw.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:12px';
  segw.innerHTML=`<div class="seg" id="f2lSlotSeg"><button data-sl="r" class="${f2lMirror?'':'on'}">FR(右)</button><button data-sl="l" class="${f2lMirror?'on':''}">FL(左・ミラー)</button></div><span style="font-size:.66rem;color:var(--tx3)">${f2lMirror?'鏡像手順。図は左スロット視点':'標準の右前スロット'}</span>`;
  w.appendChild(segw);
  segw.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{f2lMirror=b.dataset.sl==='l';buildF2L();}));allPurge('F');
  const list = mode==='s' ? F2L.filter((c,i)=>F2LSIMPLE.includes(i)) : F2L;
  $('#f2lSub').textContent = mode==='s'
    ? '基本4形+代表的な応用4。まずペアを作る→差し込む、の二段で考える'
    : '全41ケース。スロットはFR(右前)。灰色=無視してよいピース';
  F2LG.forEach(([nm,key,hint])=>{
    const items=list.map((c,gi)=>({c,gi:F2L.indexOf(c)})).filter(o=>o.c.g===key);
    if(!items.length)return;
    w.appendChild(secEl(`${nm}(${items.length})`,hint));
    const g=document.createElement('div');g.className='fgrid';
    items.forEach(({c,gi})=>{
      const d=document.createElement('div');d.className='acard fcard';
      const useAlg=f2lMirror?mirAlg(c.a):c.a;
      const svg=f2lMirror?isoSVG(mirState(caseState(useAlg)),true):isoSVG(caseState(c.a));
      d.innerHTML=`<div class="chk">✓</div>${svg}<div class="bd algbody"><div class="nm">F2L #${gi+1}${f2lMirror?' <span style="color:var(--tx3)">FL</span>':''}<span class="mv">${hm(useAlg)}手</span></div><div class="alg mono">${chunk(useAlg)}</div><div class="algmeta"><span class="cycle">${cycleText(useAlg)}</span><button class="playmini">3Dで再生</button></div></div>`;
      attach3DButton(d,useAlg,`F2L #${gi+1}${f2lMirror?'(FL)':''}`,'f2l');
      bindCard(d,'F'+gi);
      g.appendChild(d);
    });
    w.appendChild(g);
  });
}
function secEl(t,hint){const h=document.createElement('h2');h.className='sec';h.innerHTML=t+(hint?` <span class="hint">${hint}</span>`:'');return h;}
function allPurge(prefix){for(let i=allIds.length-1;i>=0;i--){if(allIds[i].startsWith(prefix))allIds.splice(i,1);}}

/* cross tasks */
function buildTasks(){
  document.querySelectorAll('.tasks[data-tasks]').forEach(box=>{
    box.innerHTML='';
    box.dataset.tasks.split('|').forEach(def=>{
      const [id,label]=def.split(':');
      const d=document.createElement('div');d.className='task';
      d.innerHTML=`<div class="chk">✓</div><div>${label}</div>`;
      bindCard(d,id);
      box.appendChild(d);
    });
  });
}
function buildCross(){
  $('#crossSimple').classList.toggle('hide',mode!=='s');
  $('#crossAdv').classList.toggle('hide',mode==='s');
  $('#crossSub').textContent = mode==='s' ? 'デイジー法:手順の暗記ゼロで確実に作る' : '直接クロス:8手以内・計画してから回す';
  buildCrossPatterns();
}

/* ================= alg chunking (trigger visualization) ================= */
const CHUNKS=[
 ["スーン","sune",["R","U","R'","U","R","U2","R'"]],
 ["アンチスーン","anti",["R","U2","R'","U'","R","U'","R'"]],
 ["セクシー","sexy",["R","U","R'","U'"]],
 ["逆セクシー","isexy",["U","R","U'","R'"]],
 ["スレッジ","sledge",["R'","F","R","F'"]],
 ["ヘッジ","hedge",["F","R'","F'","R"]],
];
function chunkMoves(seq,step){
  const tk=(t,i)=>`<span class="apmove ${i<step?'done':''} ${i===step?'now':''}" data-i="${i}">${t}</span>`;
  let out='',i=0;
  while(i<seq.length){
    let hit=null;
    for(const [nm,cls,pat] of CHUNKS){
      if(i+pat.length<=seq.length&&pat.every((x,k)=>seq[i+k]===x)){hit=[cls,pat.length,nm];break;}
    }
    if(hit){
      const inner=seq.slice(i,i+hit[1]).map((t,k)=>tk(t,i+k)).join('');
      out+=`<span class="ckg ck-${hit[0]}"><span class="cklabel">${hit[2]}</span><span class="ckwrap">${inner}</span></span>`;
      i+=hit[1];
    }else{
      out+=`<span class="cksingle"><span class="cklabel" aria-hidden="true">・</span><span class="ckwrap">${tk(seq[i],i)}</span></span>`;
      i++;
    }
  }
  return out;
}
function chunk(alg){
  const t=toks(alg);let out=[],i=0;
  while(i<t.length){
    let hit=null;
    for(const [nm,cls,pat] of CHUNKS){
      if(i+pat.length<=t.length&&pat.every((x,k)=>t[i+k]===x)){hit=[cls,pat.length,nm];break;}
    }
    if(hit){out.push(`<ruby class="ck ck-${hit[0]}">(${t.slice(i,i+hit[1]).join(' ')})<rt>${hit[2]}</rt></ruby>`);i+=hit[1];}
    else{out.push(t[i]);i++;}
  }
  return out.join(' ');
}
// 実行中ハイライト用: 各手にdata-mi(手番号)を付与。チャンクは中の各手にspanを敷く
function chunkLive(alg){
  const t=toks(alg);let out=[],i=0;
  const mv1=(tok,mi)=>`<span class="mv1" data-mi="${mi}">${tok}</span>`;
  while(i<t.length){
    let hit=null;
    for(const [nm,cls,pat] of CHUNKS){
      if(i+pat.length<=t.length&&pat.every((x,k)=>t[i+k]===x)){hit=[cls,pat.length,nm];break;}
    }
    if(hit){
      const inner=t.slice(i,i+hit[1]).map((tk,k)=>mv1(tk,i+k)).join(' ');
      out.push(`<ruby class="ck ck-${hit[0]}">(${inner})<rt>${hit[2]}</rt></ruby>`);i+=hit[1];
    }
    else{out.push(mv1(t[i],i));i++;}
  }
  return out.join(' ');
}
/* ================= net (unfolded cube) ================= */
let netCells=null,netFaceplates=null;
function cubeNetSVG(state,{interactive=false,labels=false}={}){
  const C=15,G=1.65,FP=5.2;
  const FW=3*C+2*G;
  const facePos={0:[1,0],4:[0,1],2:[1,1],1:[2,1],5:[3,1],3:[1,2]}; // U L F R B D
  const LBL={0:'U',1:'R',2:'F',3:'D',4:'L',5:'B'};
  let s='';
  for(const [f,[gc,gr]] of Object.entries(facePos)){
    const ox=gc*(FW+FP), oy=gr*(FW+FP);
    s+=`<rect class="net-faceplate" data-f="${f}" x="${(ox-2.25).toFixed(2)}" y="${(oy-2.25).toFixed(2)}" width="${(FW+4.5).toFixed(2)}" height="${(FW+4.5).toFixed(2)}" rx="5.2" fill="${FC[f]}" fill-opacity=".055"/>`;
    for(let k=0;k<9;k++){
      const r=Math.floor(k/3),c=k%3,p=f*9+k;
      const color=FC[Math.floor((state?.[p]??p)/9)];
      s+=`<rect class="net-cell"${interactive?` data-p="${p}"`:''} x="${(ox+c*(C+G)).toFixed(2)}" y="${(oy+r*(C+G)).toFixed(2)}" width="${C}" height="${C}" rx="2.65" fill="${color}"/>`;
    }
    if(labels){
      const tc=(f==3||f==0)?'rgba(30,35,45,.72)':'rgba(255,255,255,.82)';
      s+=`<text class="net-label" x="${ox+FW/2}" y="${oy+FW/2+3.15}" text-anchor="middle" fill="${tc}">${LBL[f]}</text>`;
    }
  }
  const W=4*FW+3*FP, H=3*FW+2*FP;
    // 折り目コネクタ: 隣接する面の境界にヒンジを描き、立体への折り畳みを示唆する
  {
    const ent=Object.entries(facePos);
    for(let i=0;i<ent.length;i++)for(let j=i+1;j<ent.length;j++){
      const [f1,[c1,r1]]=ent[i],[f2,[c2,r2]]=ent[j];
      const dc=c2-c1,dr=r2-r1;
      if(Math.abs(dc)+Math.abs(dr)!==1)continue;
      const oxa=Math.min(c1,c2)*(FW+FP),oya=Math.min(r1,r2)*(FW+FP);
      if(dr===0){ // 横並び: 縦の境界にヒンジ2本
        const bx=oxa+FW+FP/2, oy=r1*(FW+FP);
        for(const q of [1/3,2/3])s+=`<line class="net-fold" x1="${(bx-3.4).toFixed(2)}" y1="${(oy+FW*q).toFixed(2)}" x2="${(bx+3.4).toFixed(2)}" y2="${(oy+FW*q).toFixed(2)}"/>`;
      }else{ // 縦並び: 横の境界にヒンジ2本
        const by=oya+FW+FP/2, ox=c1*(FW+FP);
        for(const q of [1/3,2/3])s+=`<line class="net-fold" x1="${(ox+FW*q).toFixed(2)}" y1="${(by-3.4).toFixed(2)}" x2="${(ox+FW*q).toFixed(2)}" y2="${(by+3.4).toFixed(2)}"/>`;
      }
    }
  }
  return `<svg class="cube-net${interactive?' cube-net--interactive':''}" viewBox="-3 -3 ${W+6} ${H+6}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cube net">${s}</svg>`;
}
function buildNet(){
  $('#netbox').innerHTML=cubeNetSVG(SOLVED,{interactive:true,labels:true});
  netCells=[...document.querySelectorAll('#netbox .net-cell')];
  netFaceplates=[...document.querySelectorAll('#netbox .net-faceplate')];
}
function netPaint(state,colorizer){
  if(!state||!netCells)return;
  netCells.forEach(r=>{
    const p=+r.dataset.p,content=state[p];
    r.setAttribute('fill',colorizer?colorizer(content):FC[Math.floor(content/9)]);
  });
  netFaceplates?.forEach(r=>{
    const f=+r.dataset.f,content=state[f*9+4];
    r.setAttribute('fill',colorizer?colorizer(content):FC[Math.floor(content/9)]);
  });
}
function netSync(moveKey){
  if(!netCells)return;
  const p=M[moveKey];
  const on=new Set();
  for(let i=0;i<54;i++) if(p[i]!==i) on.add(i);
  for(let f=0;f<6;f++){ // face spins in place -> center belongs to the layer
    let full=true;
    for(let k=0;k<9;k++){ if(k===4)continue; if(p[f*9+k]===f*9+k){full=false;break;} }
    if(full) on.add(f*9+4);
  }
  const svg=$('#netbox .cube-net');
  svg?.classList.toggle('has-highlight',on.size>0);
  netCells.forEach(r=>r.classList.toggle('is-moving',on.has(+r.dataset.p)));
}
/* ================= named algorithms ================= */
const NAMED=[
 ["スーン","R U R' U R U2 R'","OLL 27。最頻出。逆回し=アンチスーン"],
 ["アンチスーン","R U2 R' U' R U' R'","OLL 26。スーンの逆"],
 ["Uパーム(Ua)","R U' R U R U R U' R' U' R2","PLL。エッジ3点交換"],
 ["Uパーム(Ub)","R2 U R U R' U' R' U' R' U R'","PLL。Uaの逆回し"],
 ["Tパーム","R U R' U' R' F R2 U' R' U' R U R' F'","PLL。セクシーで始まる代表格"],
 ["Yパーム","F R U' R' U' R U R' F' R U R' U' R' F R F'","PLL。後半=セクシー+スレッジ"],
];
function buildNamed(){
  $('#ckLegend').innerHTML=CHUNKS.map(([nm,cls])=>`<span class="cklegend-item ck-${cls}"><span class="ckmark mono" aria-hidden="true">( )</span><b>${nm}</b></span>`).join('');
  $('#namedAlgs').innerHTML=NAMED.map(([n,a,d])=>
    `<div class="trg" data-alg="${a}" data-name="${n}"><div class="algbody"><b class="nm">${n}<span class="mv">${hm(a)}手</span></b><span class="alg mono">${chunk(a)}</span><span class="carddesc">${d}</span><div class="algmeta"><span class="cycle">${cycleText(a)}</span><button class="playmini">3Dで再生</button></div></div></div>`).join('');
  document.querySelectorAll('#namedAlgs [data-alg]').forEach(d=>attach3DButton(d,d.dataset.alg,d.dataset.name,d.dataset.name.includes('パーム')?'pll':'oll'));
}
/* ================= cross insertion patterns ================= */
const CROSSP=[
 ["中段にある","F","側面の1手で落とす。左右版(R'・Lなど)も同じ理屈"],
 ["上面・白が上向き","F2","目的地の真上へ運んで180°"],
 ["上面・白が横向き","R' F R","隣の面に引っかけて差し込む"],
 ["その場で反転している","F D' L D","一度追い出して入れ直す。最悪ケース"],
];
const CROSSORIG=new Set([28,25,32,16,30,43,34,52,4,13,22,31,40,49]);
const CROSSTGT=new Set([28,25]);
function isoCrossSVG(st){
  const s=15.5,TX=49,TY=6;
  const d1=[Math.sqrt(3)/2*s,.5*s],d2=[-Math.sqrt(3)/2*s,.5*s],v=[0,s];
  const P=a=>a[0].toFixed(2)+','+a[1].toFixed(2);
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k];
  function quad(o,e1,e2,fill,hl){
    const p1=o,p2=add(o,e1),p3=add(add(o,e1),e2),p4=add(o,e2);
    return `<polygon points="${P(p1)} ${P(p2)} ${P(p3)} ${P(p4)}" fill="${fill}" stroke="${hl?'var(--hl)':'var(--dline)'}" stroke-width="${hl?1.6:1}"${hl?' stroke-linejoin="round"':''}/>`;
  }
  const colOf=c=>CROSSORIG.has(c)?FC[Math.floor(c/9)]:GRAY;
  let base='',hls='';
  const T=[TX,TY];
  const draw=(idx0,orig,e1,e2)=>{for(let k=0;k<9;k++){const r=Math.floor(k/3),c=k%3;
    const o=add(add(orig,mul(e1,c)),mul(e2,r));
    const ct=st[idx0+k],q=quad(o,e1,e2,colOf(ct),CROSSTGT.has(ct));
    CROSSTGT.has(ct)?hls+=q:base+=q;}};
  draw(0,T,d1,d2);
  draw(18,add(T,mul(d2,3)),d1,v);
  draw(9,add(add(T,mul(d1,3)),mul(d2,3)),[-d2[0],-d2[1]],v);
  return `<svg viewBox="0 0 98 102" xmlns="http://www.w3.org/2000/svg">${base}${hls}</svg>`;
}
function buildCrossPatterns(){
  $('#crossPatterns').innerHTML=CROSSP.map(([t,a,d])=>
    `<div class="acard fcard" style="cursor:default" data-alg="${a}" data-name="${t}">${isoCrossSVG(caseState(a))}<div class="bd algbody"><div class="nm">${t}<span class="mv">${hm(a)}手</span></div><div class="alg mono">${chunk(a)}</div><div class="carddesc">${d}</div><div class="algmeta"><button class="playmini">3Dで再生</button></div></div></div>`).join('');
  document.querySelectorAll('#crossPatterns [data-alg]').forEach(d=>attach3DButton(d,d.dataset.alg,d.dataset.name,'cross'));
}

/* basics */
function buildBasics(){
  const T=[["セクシームーブ","R U R' U'"],["逆セクシー","U R U' R'"],["スレッジハンマー","R' F R F'"],["ヘッジスラマー","F R' F' R"]];
  $('#triggers').innerHTML=T.map(([n,a])=>`<div class="trg" data-alg="${a}" data-name="${n}"><div class="algbody"><b class="nm">${n}<span class="mv">${hm(a)}手</span></b><span class="alg mono">${chunk(a)}</span><div class="algmeta"><span class="cycle">${cycleText(a)}</span><button class="playmini">3Dで再生</button></div></div></div>`).join('');
  document.querySelectorAll('#triggers [data-alg]').forEach(d=>attach3DButton(d,d.dataset.alg,d.dataset.name,'trigger'));
}
