/* ================= progress ================= */
const prog=new Set();
const allIds=[];
function saveProg(){try{localStorage.setItem('cfop-prog',[...prog].join(','));}catch(e){}}
function syncProgressControl(el,id){
  const control=el.querySelector('.chk');if(!control)return;
  const done=prog.has(id);control.setAttribute('aria-pressed',String(done));
  const name=(el.querySelector('.nm')?.textContent||el.textContent||id).replace(/\s+/g,' ').trim();
  control.setAttribute('aria-label',LANG==='en'?(done?`Mark ${name} as not learned`:`Mark ${name} as learned`):(done?`${name}を未習得に戻す`:`${name}を習得済みにする`));
}
function toggleId(id,el){
  if(prog.has(id))prog.delete(id);else prog.add(id);
  el.classList.toggle('done',prog.has(id));
  syncProgressControl(el,id);
  refreshCounts();saveProg();
}
try{const v=localStorage.getItem('cfop-prog');if(v)v.split(',').filter(Boolean).forEach(id=>prog.add(id));}catch(e){}
function bindCard(el,id){
  allIds.push(id);
  el.dataset.progressId=id;
  const old=el.querySelector('.chk');
  if(old&&old.tagName!=='BUTTON'){
    const b=document.createElement('button');b.type='button';b.className=old.className;b.innerHTML=old.innerHTML;old.replaceWith(b);
  }
  const control=el.querySelector('.chk');
  if(control)control.addEventListener('click',e=>{e.stopPropagation();toggleId(id,el);});
  el.addEventListener('click',e=>{if(e.target.closest('button,a,input,select,textarea'))return;toggleId(id,el);});
  if(prog.has(id))el.classList.add('done');
  syncProgressControl(el,id);
}

/* ================= build pages ================= */
let mode='s'; // s=簡易 a=本格
try{mode=localStorage.getItem('cfop-mode')||'s';}catch(e){}
const $=q=>document.querySelector(q);

function algCard(id,name,alg,svg,extraCls,kind){
  const d=document.createElement('div');
  d.className='acard'+(extraCls?' '+extraCls:'');
  d.innerHTML=`<div class="chk">✓</div>${svg}<div class="algbody"><div class="nm">${name}</div><div class="alg mono">${chunk(alg)}</div><div class="algmeta"><span class="mv">${hm(alg)}手</span><span class="cycle">${cycleText(alg)}</span><button class="playmini">3Dで再生</button></div></div>`;
  attach3DButton(d,alg,name,kind);
  bindCard(d,id);
  return d;
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
      d.innerHTML=`<div class="chk">✓</div>${svg}<div class="bd algbody"><div class="nm">F2L #${gi+1}${f2lMirror?' <span style="color:var(--tx3)">FL</span>':''}</div><div class="alg mono">${chunk(useAlg)}</div><div class="algmeta"><span class="mv">${hm(useAlg)}手</span><span class="cycle">${cycleText(useAlg)}</span><button class="playmini">3Dで再生</button></div></div>`;
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
    }else{out+=tk(seq[i],i);i++;}
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
let netCells=null;
function cubeNetSVG(state,{interactive=false,labels=false}={}){
  const C=15,G=1.65,FP=5.2;
  const FW=3*C+2*G;
  const facePos={0:[1,0],4:[0,1],2:[1,1],1:[2,1],5:[3,1],3:[1,2]}; // U L F R B D
  const LBL={0:'U',1:'R',2:'F',3:'D',4:'L',5:'B'};
  let s='';
  for(const [f,[gc,gr]] of Object.entries(facePos)){
    const ox=gc*(FW+FP), oy=gr*(FW+FP);
    s+=`<rect class="net-faceplate" x="${(ox-2.25).toFixed(2)}" y="${(oy-2.25).toFixed(2)}" width="${(FW+4.5).toFixed(2)}" height="${(FW+4.5).toFixed(2)}" rx="4.6"/>`;
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
  return `<svg class="cube-net${interactive?' cube-net--interactive':''}" viewBox="-3 -3 ${W+6} ${H+6}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cube net">${s}</svg>`;
}
function buildNet(){
  $('#netbox').innerHTML=cubeNetSVG(SOLVED,{interactive:true,labels:true});
  netCells=[...document.querySelectorAll('#netbox .net-cell')];
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
    `<div class="trg" data-alg="${a}" data-name="${n}"><div class="algbody"><b class="nm">${n}</b><span class="alg mono">${chunk(a)}</span><span class="carddesc">${d}</span><div class="algmeta"><span class="mv">${hm(a)}手</span><span class="cycle">${cycleText(a)}</span><button class="playmini">3Dで再生</button></div></div></div>`).join('');
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
    `<div class="acard fcard" style="cursor:default" data-alg="${a}" data-name="${t}">${isoCrossSVG(caseState(a))}<div class="bd algbody"><div class="nm">${t}</div><div class="alg mono">${chunk(a)}</div><div class="carddesc">${d}</div><div class="algmeta"><span class="mv">${hm(a)}手</span><button class="playmini">3Dで再生</button></div></div></div>`).join('');
  document.querySelectorAll('#crossPatterns [data-alg]').forEach(d=>attach3DButton(d,d.dataset.alg,d.dataset.name,'cross'));
}

/* basics */
function buildBasics(){
  const T=[["セクシームーブ","R U R' U'"],["逆セクシー","U R U' R'"],["スレッジハンマー","R' F R F'"],["ヘッジスラマー","F R' F' R"]];
  $('#triggers').innerHTML=T.map(([n,a])=>`<div class="trg" data-alg="${a}" data-name="${n}"><div class="algbody"><b class="nm">${n}</b><span class="alg mono">${chunk(a)}</span><div class="algmeta"><span class="mv">${hm(a)}手</span><span class="cycle">${cycleText(a)}</span><button class="playmini">3Dで再生</button></div></div></div>`).join('');
  document.querySelectorAll('#triggers [data-alg]').forEach(d=>attach3DButton(d,d.dataset.alg,d.dataset.name,'trigger'));
}

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
        bt.innerHTML=triboxSVG(tok)+`<b class="mono">${tok}</b>`;
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
  // 持ち替えは、表示領域に入った時だけ一度ずつ実回転して方向を伝える。
  // 常時回し続けず、タップ時のアニメーションはいつでも割り込めるようにする。
  const axisGrid=document.querySelector('.nchips[data-n3g="rot"]');
  if(axisGrid&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const axisObserver=new IntersectionObserver(entries=>{
      if(!entries.some(e=>e.isIntersecting))return;
      const cards=[...axisGrid.querySelectorAll('.ncard')];
      cards.forEach((card,i)=>setTimeout(()=>ncardAnimate(card,card.dataset.tok),140+i*110));
      axisObserver.unobserve(axisGrid);
    },{threshold:.34});
    axisObserver.observe(axisGrid);
  }
  $('#n3view').addEventListener('click',()=>{N3.yaw=-35;N3.pitch=-25;n3view();});
  // drag orbit
  const st=$('#n3stage');let drag=null;
  st.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];st.setPointerCapture(e.pointerId);});
  st.addEventListener('pointermove',e=>{
    if(!drag)return;
    N3.yaw+=(e.clientX-drag[0])*.45; N3.pitch-=(e.clientY-drag[1])*.45;
    N3.pitch=Math.max(-85,Math.min(85,N3.pitch));
    drag=[e.clientX,e.clientY];n3view();
  });
  st.addEventListener('pointerup',()=>drag=null);
  st.addEventListener('pointercancel',()=>drag=null);
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
  const fit=Math.min(1, st.clientHeight/242, st.clientWidth/242);
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
  $('#n3label').textContent=token;
  const dir=N3.mod==="'"?'反時計回りに90°':N3.mod==='2'?'180°':'時計回りに90°';
  $('#n3desc').textContent=detail||`${b.jp}を${dir} — ${b.g==='rot'?'持ち替え(手数に数えない)':'その面の外側から見て'}`;
  N3.cubies.forEach(c=>c.el.classList.toggle('lit',b.ly(c)));
  netSync(token);n3arrow(token);return b;
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
      done&&done();
    }
  }
  N3.raf=requestAnimationFrame(frame);
}
function n3updatePlayer(){
  const s=$('#apslider');s.max=N3.seq.length;s.value=N3.step;
  $('#apcount').textContent=`${N3.step} / ${N3.seq.length}手`;
  const t=(ja,en)=>(typeof LANG!=='undefined'&&LANG==='en')?en:ja;
  const lbl=N3.playing?t('Ⅱ 一時停止','Ⅱ Pause')
    :(N3.seq.length&&N3.step>=N3.seq.length)?t('↻ もう一度再生','↻ Replay')
    :t('▶ 再生','▶ Play');
  $('#applay').textContent=lbl;
  $('#apmoves').innerHTML=chunkMoves(N3.seq,N3.step);
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
  n3updatePlayer();
}
function n3stepForward(){if(N3.step<N3.seq.length)n3animate(N3.seq[N3.step]);}
function n3stepBack(){if(N3.step>0)n3animate(N3.seq[N3.step-1],null,-1);}
function n3start(){
  if(!N3.seq.length)return;if(N3.step>=N3.seq.length)n3setStep(0);N3.playing=true;n3updatePlayer();
  const loop=()=>{if(!N3.playing)return;if(N3.step>=N3.seq.length){N3.playing=false;n3updatePlayer();return;}n3animate(N3.seq[N3.step],loop);};loop();
}
function n3pause(){N3.playing=false;n3updatePlayer();}
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
  const axes={
    x:{a:[16,82],b:[101,34],label:[114,17],ring:-28},
    y:{a:[60,102],b:[60,9],label:[47,9],ring:90},
    z:{a:[14,30],b:[101,79],label:[112,95],ring:28},
  };
  const markerId=`axis-${active}-${prime?'p':'n'}`;
  const arrow=(x,y,ang,color,opacity)=>`<polygon points="-1,-4 7,0 -1,4" transform="translate(${x} ${y}) rotate(${ang})" fill="${color}" opacity="${opacity}"/>`;
  let axisLines='';
  for(const k of ['x','y','z']){
    const a=axes[k],on=k===active,color=colors[k],opacity=on?1:.34,width=on?3:1.35;
    const ang=Math.atan2(a.b[1]-a.a[1],a.b[0]-a.a[0])*180/Math.PI;
    axisLines+=`<line x1="${a.a[0]}" y1="${a.a[1]}" x2="${a.b[0]}" y2="${a.b[1]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
    axisLines+=arrow(a.b[0],a.b[1],ang,color,opacity);
    axisLines+=`<text x="${a.label[0]}" y="${a.label[1]}" text-anchor="middle" dominant-baseline="middle" fill="${color}" stroke="var(--panel)" stroke-width="3" paint-order="stroke" opacity="${on?1:.58}" font-size="${on?13:10}" font-weight="900" font-family="ui-monospace,Menlo,monospace">${k}</text>`;
  }
  const sweep=prime?0:1;
  const start=prime?'82 52':'39 35',end=prime?'39 35':'82 52';
  const ring=`<path class="axis-turn-path" d="M ${start} A 27 18 ${axes[active].ring} 1 ${sweep} ${end}" fill="none" stroke="${colors[active]}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="8 5" marker-end="url(#${markerId})"/>`;

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
    <g class="axis-cube-shape">${cubeFaces}</g>
    ${axisLines}<g opacity="${pulse.toFixed(2)}">${ring}</g>
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
/* ================= free-play cube (home) ================= */
const FP={state:null,cubies:[],pitch:-25,yaw:-35,anim:false,queue:[],hist:[],moves:0};
function fpPos(c){return `translate3d(${c.x*53}px,${c.y*53}px,${c.z*53}px)`;}
function fpViewTween(p,y){
  if(FP._vt)cancelAnimationFrame(FP._vt);
  const p0=FP.pitch,y0=FP.yaw;
  // yawは最短経路で
  let dy=((y-y0)%360+540)%360-180;
  const dp=p-p0,t0=performance.now(),D=460;
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const step=now=>{
    const t=Math.min(1,(now-t0)/D),e=ease(t);
    FP.pitch=p0+dp*e;FP.yaw=y0+dy*e;
    fpView();
    if(t<1)FP._vt=requestAnimationFrame(step);else FP._vt=null;
  };
  FP._vt=requestAnimationFrame(step);
}
function fpView(){
  const st=$('#fpStage');if(!st)return;
  const fit=Math.min(1, st.clientHeight/242, st.clientWidth/242);
  $('#fpOrbit').style.transform=`scale(${fit}) rotateX(${FP.pitch}deg) rotateY(${FP.yaw}deg)`;
}
function fpPaint(){
  const orbit=$('#fpOrbit');
  if(orbit)orbit.classList.toggle('xray',!!FP.xray);
  FP.cubies.forEach(c=>{
    c.el.style.opacity='';
    Object.entries(c.faces).forEach(([f,el])=>{
      const i=n3facelet(c,f);if(i===null)return;
      const ct=FP.state[i];
      const col=Math.floor(ct/9);
      const isCenter=(i%9===4);
      // 白(3)・黄(0)センターは自明なので透過時に強調しない
      const refCenter=(isCenter && col!==3 && col!==0);
      const focused=(FP.hi&&FP.hi.has(ct));
      const grayed=(FP.hi&&!focused&&!refCenter);
      el.style.background=grayed?'var(--g3d,#2a2b31)':FC[col];
      if(!grayed&&col===3)el.setAttribute('data-white','1');else el.removeAttribute('data-white');
      if(focused)el.setAttribute('data-focus','1');else el.removeAttribute('data-focus');
      if(refCenter&&!focused)el.setAttribute('data-center','1');else el.removeAttribute('data-center');
    });
  });
  const net=$('#fpNet2');if(net&&!net.hidden)net.innerHTML=netStateSVG(FP.state);
  $('#fpCount').textContent=FP.moves+((typeof LANG!=='undefined'&&LANG==='en')?' moves':'手');
  const solved=FP.state.every((v,i)=>v===i);
  $('#fpSolved').hidden=!(solved&&FP.moves>0);
}
function fpAnimate(token,fast,done){
  const b=N3B.find(x=>x.k===token[0]);if(!b||!M[token]){done&&done();return;}
  FP.anim=true;
  const mod=token.slice(1),target=90*b.sg*(mod==="'"?-1:1)*(mod==='2'?2:1);
  const movers=FP.cubies.filter(b.ly);
  const D=fast?130:200,t0=performance.now();
  const ease=t=>fast?t:(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2);
  const frame=now=>{
    const t=Math.min(1,(now-t0)/D),deg=target*ease(t);
    movers.forEach(c=>c.el.style.transform=`rotate${b.ax}(${deg}deg) ${fpPos(c)}`);
    if(t<1)requestAnimationFrame(frame);
    else{
      FP.state=ap(FP.state,M[token]);
      FP.cubies.forEach(c=>c.el.style.transform=fpPos(c));
      fpPaint();FP.anim=false;
      done&&done();
      // 完成したら手数を自動リセット(ソルブ実行中を除く)
      if(!FP.solving&&FP.moves>0&&FP.state.every((v,i)=>v===i)){
        if(FP._resetT)clearTimeout(FP._resetT);
        FP._resetT=setTimeout(()=>{
          if(FP.state.every((v,i)=>v===i)){
            FP.moves=0;FP.hist=[];
            $('#fpCount').textContent=(typeof LANG!=='undefined'&&LANG==='en')?'0 moves':'0手';
            const sb=$('#fpSolved');if(sb)sb.hidden=true;
          }
        },1500);
      }
    }
  };
  requestAnimationFrame(frame);
}
function fpDo(token,fast){
  if(FP.solving)return;
  if(FP.anim){FP.queue.push(token);return;}
  FP.hist.push(token);FP.moves++;
  fpAnimate(token,fast,()=>{const q=FP.queue.shift();if(q)fpDo(q,true);});
}

/* ================= CFOP solver (フリープレイ用・段階実行) ================= */
const SV={conj:null,slotPos:null,f2lSig:null,ollSig:null,oll2eSig:null,ocllSig:null};
const tj=(ja,en)=>(typeof LANG!=='undefined'&&LANG==='en')?en:ja;
function svAuf(k){return ['','U','U2',"U'"][k];}
function svJoin(...parts){return parts.filter(Boolean).join(' ').trim();}
function svInit(){
  if(SV.conj)return;
  // y共役の文字写像を実測で導出
  const eff=a=>JSON.stringify(run(SOLVED,a));
  const m={U:'U',D:'D',E:'E',u:'u',d:'d',y:'y',x:null,z:null};
  for(const X of ['R','F','L','B','M','S','r','f','l','b']){
    for(const Z of ['R','F','L','B','M',"M'",'S',"S'",'r','f','l','b']){
      if(eff("y "+X+" y'")===eff(Z)){m[X]=Z;break;}
    }
  }
  SV.conj=m;
  // 視点回転の完全共役: 位置適用(ap y)+ID再ラベル
  const Y1=run(SOLVED.slice(),'y');
  SV.yrel=new Array(54);
  for(let p=0;p<54;p++)SV.yrel[Y1[p]]=p;
  // 各フレームjでFR位置に来るスロットのピースID
  SV.slotPos=[];
  for(let j=0;j<4;j++){
    let f=SOLVED.slice();for(let i=0;i<j;i++)f=ap(f,M.y);
    SV.slotPos.push([29,26,15,23,12].map(p=>f[p]));
  }
  // F2L 41 シグネチャ
  SV.f2lSig={};
  F2L.forEach((c,idx)=>{
    const st=caseState(c.a);
    SV.f2lSig[svSigPair(st)]=idx;
  });
  // OLL 57 / OCLL / エッジ
  const LLPOS=[0,1,2,3,5,6,7,8,9,10,11,18,19,20,36,37,38,45,46,47];
  SV.llpos=LLPOS;
  SV.ollSig={};
  for(const n of Object.keys(OLL))SV.ollSig[svSigOri(caseState(OLL[n]))]=n;
  SV.ocllSig={};
  for(const n of [21,22,23,24,25,26,27])SV.ocllSig[svSigOri(caseState(OLL[n]))]=n;
  SV.oll2eSig={};
  OLL2E.forEach(([nm,alg],i)=>{SV.oll2eSig[svSigEdge(caseState(alg))]=i;});
}
function svConjTok(t,j){
  let base=t.replace(/['2]/g,''),suf=t.slice(base.length);
  for(let i=0;i<j;i++){
    const z=SV.conj[base];if(!z)return null;
    if(z.length>1){ // M→M' など符号反転を含む写像
      base=z[0];
      suf=suf==="'"?'':(suf==='2'?'2':"'");
    }else base=z;
  }
  return base+suf;
}
function svConj(alg,j){return toks(alg).map(t=>svConjTok(t,j)).join(' ');}
function svFrame(st,j){ // 実キューブ状態を「y^j回した視点」の状態へ(ID再ラベル込み)
  let s2=st;
  for(let i=0;i<j;i++){s2=ap(s2,M.y);s2=s2.map(c=>SV.yrel[c]);}
  return s2;
}
function svSigPair(st){
  const P=[29,26,15,23,12],pos={};
  for(let p=0;p<54;p++)if(P.includes(st[p]))pos[st[p]]=p;
  return P.map(i=>pos[i]).join(',');
}
function svSigOri(st){return SV.llpos.map(p=>st[p]<9?1:0).join('');}
function svSigEdge(st){return [1,3,5,7].map(p=>st[p]<9?1:0).join('');}
function svSolvedUpToAuf(st){
  for(let m=0;m<4;m++){let s2=st;for(let i=0;i<m;i++)s2=ap(s2,M.U);
    if(s2.every((v,i)=>v===i))return (4-m)%4?['U',"U'",'U2'][0]&&m:m;}
  return -1;
}
const FACE_JA=['黄','赤','青','白','橙','緑'],FACE_EN=['yellow','red','blue','white','orange','green'];
function svWhere(p){
  const f=Math.floor(p/9),r=Math.floor((p%9)/3);
  const fj=['上面','右面','正面','底面','左面','背面'][f],fe=['top','right','front','bottom','left','back'][f];
  const rj=f===0||f===3?'':['上段','中段','下段'][r],re=f===0||f===3?'':[' top',' middle',' bottom'][r];
  return tj(fj+rj,fe+re);
}
/* --- クロス: 1エッジずつIDDFS --- */
const CROSSE=[[28,25],[32,16],[34,52],[30,43]];
function svCross(st){
  const steps=[];let cur=st;
  const MOVES=['U',"U'",'U2','R',"R'",'R2','F',"F'",'F2','D',"D'",'D2','L',"L'",'L2','B',"B'",'B2'];
  const done=[];
  for(const [a,b] of CROSSE){
    if(cur[a]===a&&cur[b]===b){done.push([a,b]);continue;}
    const posA=cur.indexOf(a);
    let found=null;
    for(let depth=1;depth<=5&&!found;depth++){
      const path=[];
      const dfs=(s2,d,lastFace)=>{
        if(found)return;
        if(s2[a]===a&&s2[b]===b&&done.every(([x,y])=>s2[x]===x&&s2[y]===y)){found=path.slice();return;}
        if(d===0)return;
        for(const mv of MOVES){
          if(mv[0]===lastFace)continue;
          path.push(mv);
          dfs(ap(s2,M[mv]),d-1,mv[0]);
          path.pop();
          if(found)return;
        }
      };
      dfs(cur,depth,'');
    }
    if(!found)return null;
    const colB=tj(FACE_JA[Math.floor(b/9)],FACE_EN[Math.floor(b/9)]);
    steps.push({
      stage:'CROSS',
      t:tj(`クロス: 白×${colB}エッジ`,`Cross: white-${colB} edge`),
      j:tj(`このエッジは今 ${svWhere(posA)} にある → ${found.length}手で底面の定位置へ`,
           `This edge sits at the ${svWhere(posA)} → ${found.length} move(s) to place it`),
      // 底面の白センターは向きの基準として自明なので、クロスの強調対象から外す
      alg:found.join(' '),mv:found.slice(),hi:new Set([a,b,Math.floor(b/9)*9+4]),
      view:[[-65,-35],[-18,-120],[-18,-30],[62,-35],[-18,60],[-18,150]][Math.floor(posA/9)]
    });
    for(const mv of found)cur=ap(cur,M[mv]);
    done.push([a,b]);
  }
  return {steps,st:cur};
}
/* --- F2L: フレーム変換+シグネチャ照合 --- */
const SLOTVIEW=[[-15,-35],[-15,-125],[-15,145],[-15,55]];
const SLOTNAME=[['右前(FR)','FR (front-right)'],['左前(FL)','FL (front-left)'],['左奥(BL)','BL (back-left)'],['右奥(BR)','BR (back-right)']];
const F2LGN={basic:['基本形','basic insert'],['both-up']:['両方U面','both on top'],['edge-in']:['エッジがスロット内','edge trapped in slot'],['corner-in']:['コーナーがスロット内','corner trapped in slot'],['both-in']:['両方スロット内','both trapped in slot']};
function svSlotJ(st,ids){ // このピース群がFR位置に来るフレームj
  for(let j=0;j<4;j++)if(SV.slotPos[j].every((v,i)=>v===ids[i]))return j;
  return -1;
}
function svF2L(st){
  const steps=[];let cur=st;
  let guard=0;
  const unsolved=()=>[0,1,2,3].filter(j=>!SV.slotPos[j].every(id=>cur[id]===id));
  while(unsolved().length&&guard++<12){
    const j=unsolved()[0];
    const ids=SV.slotPos[j];
    // フレーム変換(完全共役)
    const fr=svFrame(cur,j);
    // AUF付き照合
    let hit=null;
    for(let k=0;k<4&&!hit;k++){
      let s2=fr;for(let i=0;i<k;i++)s2=ap(s2,M.U);
      const idx=SV.f2lSig[svSigPair(s2)];
      if(idx!==undefined)hit={k,idx};
    }
    if(hit){
      const c=F2L[hit.idx];
      const real=svJoin(svAuf(hit.k),svConj(c.a,j)?svConj(c.a,j):c.a);
      const realAlg=svJoin(hit.k?svAuf(hit.k):'',svConj(svJoin(c.a),j));
      const gn=F2LGN[c.g]||['',''];
      const mv=toks(svJoin(hit.k?svAuf(hit.k):'',svConj(c.a,j)));
      steps.push({stage:'F2L',
        t:tj(`F2L: ${SLOTNAME[j][0]}スロット`,`F2L: ${SLOTNAME[j][1]} slot`),
        j:tj(`ペアの配置=「${gn[0]}」→ F2L #${hit.idx+1} ${hit.k?`(まずAUF ${svAuf(hit.k)})`:''}`,
             `Pair pattern = "${gn[1]}" → case F2L #${hit.idx+1}${hit.k?` (AUF ${svAuf(hit.k)} first)`:''}`),
        alg:mv.join(' '),mv,hi:new Set(ids),view:SLOTVIEW[j]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
      if(!ids.every(id=>cur[id]===id))return null; // スロット未解決=共役方向バグの即時検出
    }else{
      // 別スロットに埋没 → 引き出し
      let fj=-1;
      outer:for(let jj=1;jj<4;jj++){
        const posSet=SV.slotPos[jj];
        for(const id of [29,26,15,23,12]){
          const p=fr.indexOf(id);
          if(posSet.includes(p)){fj=jj;break outer;}
        }
      }
      if(fj<0)return null;
      const mv=toks(svConj("R U R'",(j+fj)%4));
      steps.push({stage:'F2L',
        t:tj(`F2L: ${SLOTNAME[j][0]}の準備`,`F2L: prep for ${SLOTNAME[j][1]}`),
        j:tj(`ペースが${SLOTNAME[(j+fj)%4][0]}スロットに埋まっている → 引き出してU面へ`,
             `A piece is trapped in the ${SLOTNAME[(j+fj)%4][1]} slot → extract it to the top`),
        alg:mv.join(' '),mv,hi:new Set(ids),view:SLOTVIEW[j]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
  }
  if(unsolved().length)return null;
  return {steps,st:cur};
}
/* --- OLL --- */
const LLIDS=new Set([0,1,2,3,4,5,6,7,8,18,19,20,9,10,11,36,37,38,45,46,47]);
function svOLL(st,simple){
  const steps=[];let cur=st;
  const oriented=s2=>[0,1,2,3,4,5,6,7,8].every(p=>s2[p]<9);
  if(oriented(cur))return {steps,st:cur};
  if(simple){
    // ① エッジ向き
    if(![1,3,5,7].every(p=>cur[p]<9)){
      let hit=null;
      for(let k=0;k<4&&!hit;k++){
        let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
        const idx=SV.oll2eSig[svSigEdge(s2)];
        if(idx!==undefined)hit={k,idx};
      }
      if(!hit)return null;
      const [nm,alg]=OLL2E[hit.idx];
      const mv=toks(svJoin(hit.k?svAuf(hit.k):'',alg));
      steps.push({stage:'OLL',t:tj(`OLL①: エッジの向き`,`OLL 1: edge orientation`),
        j:tj(`黄エッジの形=「${nm.split('→')[0]}」→ ${nm}の手順`,`Yellow-edge shape matches "${nm}" case`),
        alg:mv.join(' '),mv,hi:new Set([1,3,5,7,4]),view:[-58,-35]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
    // ② コーナー向き
    if(!oriented(cur)){
      let hit=null;
      for(let k=0;k<4&&!hit;k++){
        let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
        const n=SV.ocllSig[svSigOri(s2)];
        if(n!==undefined)hit={k,n};
      }
      if(!hit)return null;
      const mv=toks(svJoin(hit.k?svAuf(hit.k):'',OLL[hit.n]));
      steps.push({stage:'OLL',t:tj(`OLL②: コーナーの向き`,`OLL 2: corner orientation`),
        j:tj(`コーナーの黄パターン → OLL ${hit.n}${hit.k?`(AUF ${svAuf(hit.k)})`:''}`,`Corner pattern → OLL ${hit.n}${hit.k?` (AUF ${svAuf(hit.k)})`:''}`),
        alg:mv.join(' '),mv,hi:new Set([...LLIDS].filter(i=>i<9||true)),view:[-58,-35]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
  }else{
    let hit=null,grp='';
    for(let k=0;k<4&&!hit;k++){
      let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
      const n=SV.ollSig[svSigOri(s2)];
      if(n!==undefined)hit={k,n};
    }
    if(!hit)return null;
    const g=OLLG.find(([nm,ids])=>ids.includes(+hit.n));
    const gname=g?g[0]:'',gnameEn=g?(typeof toEnglish==='function'?toEnglish(g[0]):g[0]):'';
    const mv=toks(svJoin(hit.k?svAuf(hit.k):'',OLL[hit.n]));
    steps.push({stage:'OLL',t:tj(`OLL ${hit.n}`,`OLL ${hit.n}`),
      j:tj(`黄パターンの形グループ=「${gname}」→ OLL ${hit.n}${hit.k?`(まずAUF ${svAuf(hit.k)})`:''}`,
           `Shape group = "${gnameEn}" → OLL ${hit.n}${hit.k?` (AUF ${svAuf(hit.k)} first)`:''}`),
      alg:mv.join(' '),mv,hi:new Set(LLIDS),view:[-58,-35]});
    for(const m2 of mv)cur=ap(cur,M[m2]);
  }
  if(!oriented(cur))return null;
  return {steps,st:cur};
}
/* --- PLL --- */
function svHeadlights(st){
  let n=0;
  for(const [a,b] of [[18,20],[9,11],[45,47],[36,38]])
    if(Math.floor(st[a]/9)===Math.floor(st[b]/9))n++;
  return n;
}
function svSolvedAuf(st){
  for(let m=0;m<4;m++){let s2=st;for(let i=0;i<m;i++)s2=ap(s2,M.U);
    if(s2.every((v,i)=>v===i))return m;}
  return -1;
}
function svPLL(st,simple){
  const steps=[];let cur=st;
  const finishAuf=()=>{
    const m=svSolvedAuf(cur);
    if(m>0){
      const mv=toks(svAuf(m));
      steps.push({stage:'PLL',t:tj('AUF','AUF'),j:tj('上面を回して全面一致=完成','Rotate the top to align everything'),
        alg:mv.join(' '),mv,hi:new Set(LLIDS),view:[-26,-35]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
  };
  if(svSolvedAuf(cur)>=0){finishAuf();return {steps,st:cur};}
  const hl=svHeadlights(cur);
  const hlJ=hl===4?'4組=エッジのみ':hl===1?'1組=隣接・3点系':hl===0?'0組=対角系':hl+'組';
  const hlE=hl===4?'4 = edges only':hl===1?'1 = adjacent/3-cycle':hl===0?'0 = diagonal':hl+' pairs';
  if(simple){
    // ① コーナー(T/Y)
    const cornersOK=s2=>{for(let m=0;m<4;m++){let s3=s2;for(let i=0;i<m;i++)s3=ap(s3,M.U);
      if([0,2,6,8,18,20,9,11,36,38,45,47].every(p=>s3[p]===p))return true;}return false;};
    let g2=0;
    while(!cornersOK(cur)&&g2++<3){
      let hit=null;
      for(let k=0;k<4&&!hit;k++)for(const [nm,alg] of [['Tパーム',PLL.T],['Yパーム',PLL.Y]]){
        let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
        s2=run(s2,alg);
        if(cornersOK(s2)){hit={k,nm,alg};break;}
      }
      if(!hit){hit={k:0,nm:'Tパーム',alg:PLL.T};}
      const mv=toks(svJoin(hit.k?svAuf(hit.k):'',hit.alg));
      steps.push({stage:'PLL',t:tj(`PLL①: コーナー位置`,`PLL 1: corner permutation`),
        j:tj(`ヘッドライト ${hlJ} → ${hit.nm}${hit.k?`(AUF ${svAuf(hit.k)})`:''}`,`Headlights: ${hlE} → ${hit.nm==='Tパーム'?'T perm':'Y perm'}`),
        alg:mv.join(' '),mv,hi:new Set(LLIDS),view:[-26,-35]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
    if(!cornersOK(cur))return null;
    // ② エッジ
    if(svSolvedAuf(cur)<0){
      let hit=null;
      for(let k=0;k<4&&!hit;k++)for(const nm of ['Ua','Ub','H','Z']){
        let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
        s2=run(s2,PLL[nm]);
        if(svSolvedAuf(s2)>=0){hit={k,nm};break;}
      }
      if(!hit)return null;
      const mv=toks(svJoin(hit.k?svAuf(hit.k):'',PLL[hit.nm]));
      steps.push({stage:'PLL',t:tj(`PLL②: エッジ位置`,`PLL 2: edge permutation`),
        j:tj(`エッジの入れ替えパターン → ${hit.nm}パーム`,`Edge cycle pattern → ${hit.nm} perm`),
        alg:mv.join(' '),mv,hi:new Set(LLIDS),view:[-26,-35]});
      for(const m2 of mv)cur=ap(cur,M[m2]);
    }
  }else{
    let hit=null;
    for(let k=0;k<4&&!hit;k++)for(const [nm,alg] of Object.entries(PLL)){
      let s2=cur;for(let i=0;i<k;i++)s2=ap(s2,M.U);
      s2=run(s2,alg);
      if(svSolvedAuf(s2)>=0){hit={k,nm,alg};break;}
    }
    if(!hit)return null;
    const mv=toks(svJoin(hit.k?svAuf(hit.k):'',hit.alg));
    steps.push({stage:'PLL',t:tj(`PLL: ${hit.nm}パーム`,`PLL: ${hit.nm} perm`),
      j:tj(`ヘッドライト ${hlJ} → ${hit.nm}と判定${hit.k?`(まずAUF ${svAuf(hit.k)})`:''}`,
           `Headlights: ${hlE} → identified as ${hit.nm}${hit.k?` (AUF ${svAuf(hit.k)} first)`:''}`),
      alg:mv.join(' '),mv,hi:new Set(LLIDS),view:[-26,-35]});
    for(const m2 of mv)cur=ap(cur,M[m2]);
  }
  finishAuf();
  if(svSolvedAuf(cur)!==0&&!cur.every((v,i)=>v===i))return null;
  return {steps,st:cur};
}
function fpSolvePlan(){
  svInit();
  const simple=(typeof mode!=='undefined'&&mode==='s');
  let cur=FP.state.slice();
  const all=[];
  const c=svCross(cur);if(!c)return null;all.push(...c.steps);cur=c.st;
  const f=svF2L(cur);if(!f)return null;all.push(...f.steps);cur=f.st;
  const o=svOLL(cur,simple);if(!o)return null;all.push(...o.steps);cur=o.st;
  const p=svPLL(cur,simple);if(!p)return null;all.push(...p.steps);cur=p.st;
  if(!cur.every((v,i)=>v===i))return null;
  return all;
}

function fpInit(){
  const orbit=$('#fpOrbit');if(!orbit||FP.cubies.length)return;
  try{FP.autoView=localStorage.getItem('cfop-autoview')!=='0';}catch(e){FP.autoView=true;}
  try{FP.autoFocus=localStorage.getItem('cfop-autofocus')!=='0';}catch(e){FP.autoFocus=true;}
  FP.state=SOLVED.slice();
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
    el.style.transform=fpPos(c);
    FP.cubies.push(c);orbit.appendChild(el);
  }
  fpView();fpPaint();
  // コマンド: 回転量セグ + 面15種(基本6/中層3/2層6)
  const mkFixed=(box,tok)=>{
    const b=document.createElement('button');b.textContent=tok;b.dataset.tok=tok;
    b.addEventListener('click',()=>{if(FP.solving)return;fpDo(tok);});
    box.appendChild(b);
  };
  ['U','R','F','D','L','B'].forEach(k=>mkFixed($('#fpBtns'),k));
  ['U','R','F','D','L','B'].forEach(k=>mkFixed($('#fpBtnsPrime'),k+"'"));
  ['M','E','S'].forEach(k=>mkFixed($('#fpBtnsMid'),k));
  ['u','r','f','d','l','b'].forEach(k=>mkFixed($('#fpBtnsWide'),k));
  // 操作ボタン
  $('#fpUndo').addEventListener('click',()=>{
    if(FP.anim||FP.solving||!FP.hist.length)return;
    const t=FP.hist.pop();FP.moves=Math.max(0,FP.moves-1);
    fpAnimate(invTok(t),false,()=>{});
  });
  function fpFlashCmd(token){
    const base=token[0],prime=token.includes("'");
    // スクランブルは基本回転のみ(WCA/perfect)。無印列とプライム列から対応ボタンを選ぶ
    const boxId=prime?'#fpBtnsPrime':'#fpBtns';
    const btn=[...document.querySelectorAll(boxId+' button')].find(b=>b.textContent[0]===base);
    if(btn){btn.classList.add('flash');setTimeout(()=>btn.classList.remove('flash'),240);}
  }
  function fpApplySeq(seq){
    let i=0;
    const next=()=>{
      if(i<seq.length){fpFlashCmd(seq[i]);fpAnimate(seq[i++],true,next);}
      else{ // スクランブルは崩す操作なので手数・履歴に含めない
        FP.moves=0;FP.hist=[];
        $('#fpCount').textContent=(typeof LANG!=='undefined'&&LANG==='en')?'0 moves':'0手';
      }
    };
    next();
  }
  $('#fpScramble').addEventListener('click',()=>{
    if(FP.anim||FP.solving)return;
    if(WCA.ready&&!WCA.failed){WCA.cb=s2=>fpApplySeq(toks(s2));WCA.cbSent=true;WCA.worker.postMessage('scramble');}
    else if(!WCA.failed&&typeof Worker!=='undefined'){WCA.cb=s2=>fpApplySeq(toks(s2));WCA.cbSent=false;wcaInit();}
    else fpApplySeq(toks(scrRandom(18)));
  });
  $('#fpPerfect').addEventListener('click',()=>{
    if(FP.anim||FP.solving)return;
    fpApplySeq(toks(PERFECT[Math.floor(Math.random()*2)]));
  });
  $('#fpReset').addEventListener('click',()=>{
    if(FP.anim)return;
    FP.solving=false;FP.hi=null;FP.xray=false;FP.plan=null;$('#fpSolveBox').hidden=true;
    document.querySelector('.fpwrap')?.classList.remove('solving');
    const hdr=$('#fsHdr');if(hdr)hdr.hidden=true;
    FP.state=SOLVED.slice();FP.hist=[];FP.moves=0;fpPaint();
  });
  $('#fpNet').addEventListener('click',()=>{
    const n=$('#fpNet2');n.hidden=!n.hidden;
    if(!n.hidden)n.innerHTML=netStateSVG(FP.state);
    $('#fpNet').classList.toggle('pri',!n.hidden);
  });
  // ソルブ(段階実行)
  const box=$('#fpSolveBox');
  function fsExit(msg){
    if(FP._dwell){clearTimeout(FP._dwell);FP._dwell=null;}
    FP.solving=false;FP.hi=null;FP.xray=false;FP.plan=null;fpPaint();
    $('#fpOrbit')?.classList.remove('recog');
    document.querySelector('.fpwrap')?.classList.remove('solving');
    const hdr=$('#fsHdr');if(hdr)hdr.hidden=true;
    if(msg){box.hidden=false;box.innerHTML=`<div class="fsj">${msg}</div>`;setTimeout(()=>{if(!FP.solving)box.hidden=true;},2200);}
    else box.hidden=true;
  }
  function fpRefreshSolve(){
    if(!FP.solving||!FP.plan)return;
    // 言語切替時: 現在の盤面(認識停止=このステップ実行前)からプランを再生成して言語を反映
    if(!FP.anim){
      const fresh=fpSolvePlan();
      if(fresh&&fresh.length){FP.plan=fresh;FP.planI=0;}
    }
    const st=FP.plan[FP.planI];if(!st)return;
    const sb=$('#fsStageBadge'),mbg=$('#fsModeBadge'),ttl=$('#fsTitle');
    if(sb)sb.textContent=st.stage;
    if(mbg)mbg.textContent=(typeof mode!=='undefined'&&mode==='s')?tj('簡易','Simple'):tj('本格','Advanced');
    if(ttl)ttl.textContent=st.t;
    const prg=$('#fsHdrProg');if(prg)prg.textContent=`${FP.planI+1} / ${FP.plan.length}`;
    const jEl=$('#fpSolveBox .fsj');if(jEl)jEl.textContent=st.j;
    const aEl=$('#fpSolveBox .fsa');if(aEl)aEl.innerHTML=chunkLive(st.alg);
  }
  window.fpRefreshSolve=fpRefreshSolve;
  function fsStageDone(stage){
    const el=$('#fsStageDone');if(!el)return;
    el.textContent='✓ '+stage+' '+tj('完了','done');
    el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
    clearTimeout(FP._sdT);FP._sdT=setTimeout(()=>{el.hidden=true;},1200);
  }
  function fsShow(auto){
    if(FP._dwell){clearTimeout(FP._dwell);FP._dwell=null;}
    const i=FP.planI,st=FP.plan?FP.plan[i]:null;
    // C: ステージが切り替わった瞬間に前ステージの完了演出
    const prev=(i>0&&FP.plan)?FP.plan[i-1]:null;
    if(prev&&(!st||st.stage!==prev.stage))fsStageDone(prev.stage);
    if(!st){ // 完了
      fsExit(tj('✨ ソルブ完了!','✨ Solved!'));
      return;
    }
    FP.hi=(FP.autoFocus!==false)?st.hi:null;
    FP.xray=((st.stage==='CROSS'||st.stage==='F2L')&&FP.autoFocus!==false);
    fpPaint();
    // A: 認識中は注目ピースをパルスさせ「どこを見るか」を示す
    const orb=$('#fpOrbit');
    if(orb){orb.classList.remove('recog');if(FP.hi&&FP.hi.size){void orb.offsetWidth;orb.classList.add('recog');}}
    if(FP.autoView!==false&&st.view)fpViewTween(st.view[0],st.view[1]);
    box.hidden=false;
    const sb=$('#fsStageBadge'),mbg=$('#fsModeBadge'),hdr=$('#fsHdr');
    if(sb)sb.textContent=st.stage;
    if(mbg)mbg.textContent=(typeof mode!=='undefined'&&mode==='s')?tj('簡易','Simple'):tj('本格','Advanced');
    const ttl=$('#fsTitle');if(ttl)ttl.textContent=st.t;
    const prg=$('#fsHdrProg');if(prg)prg.textContent=`${i+1} / ${FP.plan.length}`;
    if(hdr)hdr.hidden=false;
    const tgl=`<button class="btn" id="fsView">👁 ${tj('視点','View')}: ${FP.autoView!==false?'ON':'OFF'}</button>
        <button class="btn" id="fsFocus">◧ ${tj('フォーカス','Focus')}: ${FP.autoFocus!==false?'ON':'OFF'}</button>`;
    box.innerHTML=`
      <div class="fsrow">
        <div class="fsmain">
          <div class="fsj">${st.j}</div>
          <div class="fsa mono">${chunkLive(st.alg)}</div>
        </div>
        ${(st.stage==='OLL'||st.stage==='PLL')?`<div class="fs2d">${llSVG(FP.state,st.stage==='OLL'?'oll':'pll',false)}<span>${tj('上から見た図','top view')}</span></div>`:''}
      </div>
      <div class="fsbtns">${auto
        ?`<button class="btn pri" id="fsPause">⏸ ${tj('手動へ','Manual')}</button>
          <button class="btn" id="fsQuit">✕ ${tj('中断','Stop')}</button>${tgl}`
        :`<button class="btn" id="fsBack" ${i===0?'disabled':''}>◀ ${tj('戻る','Back')}</button>
          <button class="btn pri" id="fsGo">▶ ${tj('実行','Run')}</button>
          <button class="btn" id="fsAll">⏩ ${tj('最後まで','Run all')}</button>
          <button class="btn" id="fsQuit">✕ ${tj('中断','Stop')}</button>${tgl}`}
      </div>`;
    if(auto){
      $('#fsPause').addEventListener('click',()=>fsShow(false));
      FP._dwell=setTimeout(()=>fsRun(true),2400); // 認識のための停止
    }else{
      $('#fsGo').addEventListener('click',()=>fsRun(false));
      $('#fsAll').addEventListener('click',()=>fsRun(true));
      const bk=$('#fsBack');
      if(bk)bk.addEventListener('click',()=>{
        if(FP.anim||FP.planI<=0)return;
        const pv=FP.plan[FP.planI-1];if(!pv)return;
        const rev=pv.mv.slice().reverse().map(invTok);
        box.querySelectorAll('button').forEach(b=>b.disabled=true);
        let k=0;
        const back=()=>{
          if(k<rev.length){FP.moves=Math.max(0,FP.moves-1);if(FP.hist.length)FP.hist.pop();fpAnimate(rev[k++],true,back);}
          else{FP.planI--;fsShow(false);}
        };
        back();
      });
    }
    $('#fsQuit').addEventListener('click',()=>fsExit());
    $('#fsView').addEventListener('click',()=>{
      FP.autoView=FP.autoView===false?true:false;
      $('#fsView').textContent=`👁 ${tj('視点','View')}: ${FP.autoView?'ON':'OFF'}`;
      try{localStorage.setItem('cfop-autoview',FP.autoView?'1':'0');}catch(e){}
      if(FP.autoView&&st.view)fpViewTween(st.view[0],st.view[1]);
    });
    $('#fsFocus').addEventListener('click',()=>{
      FP.autoFocus=FP.autoFocus===false?true:false;
      $('#fsFocus').textContent=`◧ ${tj('フォーカス','Focus')}: ${FP.autoFocus?'ON':'OFF'}`;
      try{localStorage.setItem('cfop-autofocus',FP.autoFocus?'1':'0');}catch(e){}
      FP.hi=FP.autoFocus?st.hi:null;
      FP.xray=((st.stage==='CROSS'||st.stage==='F2L')&&FP.autoFocus);
      fpPaint();
    });
  }
  function fsRun(chain){
    if(FP._dwell){clearTimeout(FP._dwell);FP._dwell=null;}
    const st=FP.plan?FP.plan[FP.planI]:null;
    if(!st)return;
    // 実行中もフォーカス(注目色のみ)と透過を維持して集中できるように
    FP.hi=(FP.autoFocus!==false)?st.hi:null;
    FP.xray=((st.stage==='CROSS'||st.stage==='F2L')&&FP.autoFocus!==false);
    fpPaint();
    $('#fpOrbit')?.classList.remove('recog'); // 実行中はパルス停止
    box.querySelectorAll('button').forEach(b=>b.disabled=true);
    const hlMoves=aEl=>{
      const a=$('#fpSolveBox .fsa');if(!a)return;
      a.querySelectorAll('.mv1').forEach(el=>{
        const mi=+el.dataset.mi;
        el.classList.toggle('done',mi<i);
        el.classList.toggle('active',mi===i);
      });
    };
    let i=0;
    const next=()=>{
      if(!FP.solving)return;
      if(i<st.mv.length){hlMoves();FP.moves++;FP.hist.push(st.mv[i]);fpFlashCmd(st.mv[i]);fpAnimate(st.mv[i++],true,next);}
      else{
        hlMoves(); // 全手done表示
        FP.planI++;
        fsShow(chain&&!!FP.plan[FP.planI]); // 連続時も毎回 認識停止→自動実行
      }
    };
    next();
  }
  $('#fpSolve').addEventListener('click',()=>{
    if(FP.anim||FP.solving)return;
    if(FP.state.every((v,i)=>v===i)){fsExit(tj('もう完成しています。スクランブルしてから試してください','Already solved — scramble first'));return;}
    const plan=fpSolvePlan();
    if(!plan){fsExit(tj('プランを作れませんでした','Could not build a plan'));return;}
    FP.solving=true;FP.plan=plan;FP.planI=0;
    document.querySelector('.fpwrap')?.classList.add('solving');
    fsShow();
  });

  // ===== スワイプ操作パッド(押してスワイプで回転) =====
  const swipeBox=$('#fpSwipe');
  function setCtl(mode){
    FP.ctl=mode;
    try{localStorage.setItem('cfop-fpctl',mode);}catch(e){}
    const sw=mode==='swipe';
    swipeBox.hidden=!sw;
    document.querySelector('.fpplay').classList.toggle('swipemode',sw);
    $('#fpSubRow').style.display=sw?'none':'';
    $('#fpCtlMode').textContent=sw?tj('ボタン操作へ','Button controls'):tj('スワイプ操作へ','Swipe controls');
    fpView(); // レイアウト変更後にスケール再計算
  }
  $('#fpCtlMode').addEventListener('click',()=>setCtl(FP.ctl==='swipe'?'btn':'swipe'));
  {let ctl='swipe';try{ctl=localStorage.getItem('cfop-fpctl')||'swipe';}catch(e){}setCtl(ctl);}
  // iOS Safariはtouch-action:noneだけではスクロールを止められないことがあるため明示的に抑止
  swipeBox.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  swipeBox.querySelectorAll('.fpsBtn').forEach(btn=>{
    const horiz=btn.dataset.axis==='h';
    let sw=null;
    btn.addEventListener('pointerdown',e=>{
      sw={o:horiz?e.clientX:e.clientY,th:24};
      btn.setPointerCapture(e.pointerId);
      btn.classList.add('swiping');e.preventDefault();
    });
    btn.addEventListener('pointermove',e=>{
      if(!sw)return;
      const d=(horiz?e.clientX:e.clientY)-sw.o;
      if(Math.abs(d)>=sw.th){
        if(!FP.solving)fpDo(btn.dataset[d<0?'neg':'pos']);
        sw.o=horiz?e.clientX:e.clientY;sw.th=90; // 同一ジェスチャー内の連続回転は大きめの移動で
      }
    });
    const swEnd=()=>{sw=null;btn.classList.remove('swiping');};
    btn.addEventListener('pointerup',swEnd);
    btn.addEventListener('pointercancel',swEnd);
  });
  // iOS Safariはtouch-action:noneでもラバーバンドでページが動くことがあるため明示的に抑止
  swipeBox.addEventListener('touchmove',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  $('#fpViewReset').addEventListener('click',()=>fpViewTween(-25,-35));
  // ドラッグで視点
  let drag=null;
  const st=$('#fpStage');
  st.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,p:FP.pitch,w:FP.yaw};st.setPointerCapture(e.pointerId);});
  st.addEventListener('pointermove',e=>{
    if(!drag)return;
    FP.yaw=drag.w+(e.clientX-drag.x)*.45;
    FP.pitch=Math.max(-85,Math.min(85,drag.p-(e.clientY-drag.y)*.45));
    fpView();
  });
  st.addEventListener('pointerup',()=>drag=null);
  window.addEventListener('resize',()=>{try{fpView();}catch(e){}});
}

/* ================= scramble editor ================= */
function netStateSVG(state){
  return cubeNetSVG(state);
}

/* ===== WCA準拠 random-state スクランブル(cubejs MIT https://github.com/ldez/cubejs をWorker内で実行) ===== */
const CUBEJS_B64='KCgpPT57dmFyIHplPShlZSxPKT0+KCk9Pnt0cnl7cmV0dXJuIE98fGVlKChPPXtleHBvcnRzOnt9fSkuZXhwb3J0cyxPKSxPLmV4cG9ydHN9Y2F0Y2goSil7dGhyb3cgTz0wLEp9fTt2YXIgcWU9emUoKFdlLEllKT0+eyhmdW5jdGlvbigpe3ZhciBlZSxPLEosY2UsTCx0ZSxyZSxuZSwkLGllLG9lLFEsc2UsdmUsdWUsbGUsYWUsaGUsbWUsVyxYLGoseCxULFksWixHLERlLE9lLGdlLHdlLHBlLEZlO1ttZSxoZSx2ZSxMLGFlLGVlXT1bMCwxLDIsMyw0LDVdLFtHLHgsWSxYLCQsb2UscmUsc2VdPVswLDEsMiwzLDQsNSw2LDddLFtaLGosVCxXLFEsbmUsaWUsdGUsbGUsdWUsTyxKXT1bMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMV0sW09lLHdlLEZlXT0oZnVuY3Rpb24oKXt2YXIgSCxxLEksZyxTLGY7cmV0dXJuIGY9ZnVuY3Rpb24oaCl7cmV0dXJuIGgtMX0sUz1mdW5jdGlvbihoKXtyZXR1cm4gZig5KStofSxJPWZ1bmN0aW9uKGgpe3JldHVybiBTKDkpK2h9LHE9ZnVuY3Rpb24oaCl7cmV0dXJuIEkoOSkraH0sZz1mdW5jdGlvbihoKXtyZXR1cm4gcSg5KStofSxIPWZ1bmN0aW9uKGgpe3JldHVybiBnKDkpK2h9LFtbNCwxMywyMiwzMSw0MCw0OV0sW1tmKDkpLFMoMSksSSgzKV0sW2YoNyksSSgxKSxnKDMpXSxbZigxKSxnKDEpLEgoMyldLFtmKDMpLEgoMSksUygzKV0sW3EoMyksSSg5KSxTKDcpXSxbcSgxKSxnKDkpLEkoNyldLFtxKDcpLEgoOSksZyg3KV0sW3EoOSksUyg5KSxIKDcpXV0sW1tmKDYpLFMoMildLFtmKDgpLEkoMildLFtmKDQpLGcoMildLFtmKDIpLEgoMildLFtxKDYpLFMoOCldLFtxKDIpLEkoOCldLFtxKDQpLGcoOCldLFtxKDgpLEgoOCldLFtJKDYpLFMoNCldLFtJKDQpLGcoNildLFtIKDYpLGcoNCldLFtIKDQpLFMoNildXV19KSgpLERlPVsiVSIsIlIiLCJGIiwiRCIsIkwiLCJCIl0sZ2U9W1siVSIsIlIiLCJGIl0sWyJVIiwiRiIsIkwiXSxbIlUiLCJMIiwiQiJdLFsiVSIsIkIiLCJSIl0sWyJEIiwiRiIsIlIiXSxbIkQiLCJMIiwiRiJdLFsiRCIsIkIiLCJMIl0sWyJEIiwiUiIsIkIiXV0scGU9W1siVSIsIlIiXSxbIlUiLCJGIl0sWyJVIiwiTCJdLFsiVSIsIkIiXSxbIkQiLCJSIl0sWyJEIiwiRiJdLFsiRCIsIkwiXSxbIkQiLCJCIl0sWyJGIiwiUiJdLFsiRiIsIkwiXSxbIkIiLCJMIl0sWyJCIiwiUiJdXSxjZT0oZnVuY3Rpb24oKXt2YXIgSCxxLEk7Y2xhc3MgZ3tjb25zdHJ1Y3RvcihmKXt2YXIgaDtmIT1udWxsP3RoaXMuaW5pdChmKTp0aGlzLmlkZW50aXR5KCksdGhpcy5uZXdDZW50ZXI9KGZ1bmN0aW9uKCl7dmFyIG4sbztmb3Iobz1bXSxoPW49MDtuPD01O2g9KytuKW8ucHVzaCgwKTtyZXR1cm4gb30pKCksdGhpcy5uZXdDcD0oZnVuY3Rpb24oKXt2YXIgbixvO2ZvcihvPVtdLGg9bj0wO248PTc7aD0rK24pby5wdXNoKDApO3JldHVybiBvfSkoKSx0aGlzLm5ld0VwPShmdW5jdGlvbigpe3ZhciBuLG87Zm9yKG89W10saD1uPTA7bjw9MTE7aD0rK24pby5wdXNoKDApO3JldHVybiBvfSkoKSx0aGlzLm5ld0NvPShmdW5jdGlvbigpe3ZhciBuLG87Zm9yKG89W10saD1uPTA7bjw9NztoPSsrbilvLnB1c2goMCk7cmV0dXJuIG99KSgpLHRoaXMubmV3RW89KGZ1bmN0aW9uKCl7dmFyIG4sbztmb3Iobz1bXSxoPW49MDtuPD0xMTtoPSsrbilvLnB1c2goMCk7cmV0dXJuIG99KSgpfWluaXQoZil7cmV0dXJuIHRoaXMuY2VudGVyPWYuY2VudGVyLnNsaWNlKDApLHRoaXMuY289Zi5jby5zbGljZSgwKSx0aGlzLmVwPWYuZXAuc2xpY2UoMCksdGhpcy5jcD1mLmNwLnNsaWNlKDApLHRoaXMuZW89Zi5lby5zbGljZSgwKX1pZGVudGl0eSgpe3ZhciBmO3JldHVybiB0aGlzLmNlbnRlcj1bMCwxLDIsMyw0LDVdLHRoaXMuY3A9WzAsMSwyLDMsNCw1LDYsN10sdGhpcy5jbz0oZnVuY3Rpb24oKXt2YXIgaCxuO2ZvcihuPVtdLGY9aD0wO2g8PTc7Zj0rK2gpbi5wdXNoKDApO3JldHVybiBufSkoKSx0aGlzLmVwPVswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExXSx0aGlzLmVvPShmdW5jdGlvbigpe3ZhciBoLG47Zm9yKG49W10sZj1oPTA7aDw9MTE7Zj0rK2gpbi5wdXNoKDApO3JldHVybiBufSkoKX10b0pTT04oKXtyZXR1cm57Y2VudGVyOnRoaXMuY2VudGVyLGNwOnRoaXMuY3AsY286dGhpcy5jbyxlcDp0aGlzLmVwLGVvOnRoaXMuZW99fWFzU3RyaW5nKCl7dmFyIGYsaCxuLG8sUixtLEIsTSxVLEQsZDtmb3IoZD1bXSxuPW89MDtvPD01O249KytvKWRbOSpuKzRdPURlW3RoaXMuY2VudGVyW25dXTtmb3Iobj1SPTA7Ujw9NztuPSsrUilmb3IoZj10aGlzLmNwW25dLFU9dGhpcy5jb1tuXSxCPW09MDttPD0yO0I9KyttKWRbd2Vbbl1bKEIrVSklM11dPWdlW2ZdW0JdO2ZvcihuPU09MDtNPD0xMTtuPSsrTSlmb3IoaD10aGlzLmVwW25dLFU9dGhpcy5lb1tuXSxCPUQ9MDtEPD0xO0I9KytEKWRbRmVbbl1bKEIrVSklMl1dPXBlW2hdW0JdO3JldHVybiBkLmpvaW4oIiIpfXN0YXRpYyBmcm9tU3RyaW5nKGYpe3ZhciBoLG4sbyxSLG0sQixNLFUsRCxkLGssVix6LEE7Zm9yKG89bmV3IGcsUj1CPTA7Qjw9NTtSPSsrQilmb3IobT1NPTA7TTw9NTttPSsrTSlmWzkqUis0XT09PURlW21dJiYoby5jZW50ZXJbUl09bSk7Zm9yKFI9VT0wO1U8PTc7Uj0rK1Upe2ZvcihkPUQ9MDtEPD0yJiYhKChBPWZbd2VbUl1bZF1dKT09PSJVInx8QT09PSJEIik7ZD0rK0QpO2ZvcihoPWZbd2VbUl1bKGQrMSklM11dLG49Zlt3ZVtSXVsoZCsyKSUzXV0sbT1rPTA7azw9NzttPSsrayloPT09Z2VbbV1bMV0mJm49PT1nZVttXVsyXSYmKG8uY3BbUl09bSxvLmNvW1JdPWQlMyl9Zm9yKFI9Vj0wO1Y8PTExO1I9KytWKWZvcihtPXo9MDt6PD0xMTttPSsreil7aWYoZltGZVtSXVswXV09PT1wZVttXVswXSYmZltGZVtSXVsxXV09PT1wZVttXVsxXSl7by5lcFtSXT1tLG8uZW9bUl09MDticmVha31pZihmW0ZlW1JdWzBdXT09PXBlW21dWzFdJiZmW0ZlW1JdWzFdXT09PXBlW21dWzBdKXtvLmVwW1JdPW0sby5lb1tSXT0xO2JyZWFrfX1yZXR1cm4gb31jbG9uZSgpe3JldHVybiBuZXcgZyh0aGlzLnRvSlNPTigpKX1zdGF0aWMgcmFuZG9tKCl7cmV0dXJuIG5ldyBnKCkucmFuZG9taXplKCl9aXNTb2x2ZWQoKXt2YXIgZixoLG4sbyxSLG0sQjtmb3Iobj10aGlzLmNsb25lKCksbi5tb3ZlKG4udXByaWdodCgpKSxoPVI9MDtSPD01O2g9KytSKWlmKG4uY2VudGVyW2hdIT09aClyZXR1cm4hMTtmb3IoZj1tPTA7bTw9NztmPSsrbSlpZihuLmNwW2ZdIT09Znx8bi5jb1tmXSE9PTApcmV0dXJuITE7Zm9yKG89Qj0wO0I8PTExO289KytCKWlmKG4uZXBbb10hPT1vfHxuLmVvW29dIT09MClyZXR1cm4hMTtyZXR1cm4hMH1jZW50ZXJNdWx0aXBseShmKXt2YXIgaCxuLG87Zm9yKG89bj0wO248PTU7bz0rK24paD1mLmNlbnRlcltvXSx0aGlzLm5ld0NlbnRlcltvXT10aGlzLmNlbnRlcltoXTtyZXR1cm5bdGhpcy5jZW50ZXIsdGhpcy5uZXdDZW50ZXJdPVt0aGlzLm5ld0NlbnRlcix0aGlzLmNlbnRlcl0sdGhpc31jb3JuZXJNdWx0aXBseShmKXt2YXIgaCxuLG87Zm9yKG89bj0wO248PTc7bz0rK24paD1mLmNwW29dLHRoaXMubmV3Q3Bbb109dGhpcy5jcFtoXSx0aGlzLm5ld0NvW29dPSh0aGlzLmNvW2hdK2YuY29bb10pJTM7cmV0dXJuW3RoaXMuY3AsdGhpcy5uZXdDcF09W3RoaXMubmV3Q3AsdGhpcy5jcF0sW3RoaXMuY28sdGhpcy5uZXdDb109W3RoaXMubmV3Q28sdGhpcy5jb10sdGhpc31lZGdlTXVsdGlwbHkoZil7dmFyIGgsbixvO2ZvcihvPW49MDtuPD0xMTtvPSsrbiloPWYuZXBbb10sdGhpcy5uZXdFcFtvXT10aGlzLmVwW2hdLHRoaXMubmV3RW9bb109KHRoaXMuZW9baF0rZi5lb1tvXSklMjtyZXR1cm5bdGhpcy5lcCx0aGlzLm5ld0VwXT1bdGhpcy5uZXdFcCx0aGlzLmVwXSxbdGhpcy5lbyx0aGlzLm5ld0VvXT1bdGhpcy5uZXdFbyx0aGlzLmVvXSx0aGlzfW11bHRpcGx5KGYpe3JldHVybiB0aGlzLmNlbnRlck11bHRpcGx5KGYpLHRoaXMuY29ybmVyTXVsdGlwbHkoZiksdGhpcy5lZGdlTXVsdGlwbHkoZiksdGhpc31tb3ZlKGYpe3ZhciBoLG4sbyxSLG0sQixNLFUsRDtmb3IoTT1JKGYpLG49MCxSPU0ubGVuZ3RoO248UjtuKyspZm9yKG09TVtuXSxoPW0vM3wwLEI9bSUzLEQ9bz0wLFU9QjswPD1VP288PVU6bz49VTtEPTA8PVU/KytvOi0tbyl0aGlzLm11bHRpcGx5KGcubW92ZXNbaF0pO3JldHVybiB0aGlzfXVwcmlnaHQoKXt2YXIgZixoLG4sbyxSLG07Zm9yKGY9dGhpcy5jbG9uZSgpLG09W10saD1vPTA7bzw9NSYmZi5jZW50ZXJbaF0hPT12ZTtoPSsrbyk7c3dpdGNoKGgpe2Nhc2UgTDptLnB1c2goIngiKTticmVhaztjYXNlIG1lOm0ucHVzaCgieCciKTticmVhaztjYXNlIGVlOm0ucHVzaCgieDIiKTticmVhaztjYXNlIGhlOm0ucHVzaCgieSIpO2JyZWFrO2Nhc2UgYWU6bS5wdXNoKCJ5JyIpfWZvcihtLmxlbmd0aCYmZi5tb3ZlKG1bMF0pLG49Uj0wO1I8PTUmJmYuY2VudGVyW25dIT09bWU7bj0rK1IpO3N3aXRjaChuKXtjYXNlIGFlOm0ucHVzaCgieiIpO2JyZWFrO2Nhc2UgaGU6bS5wdXNoKCJ6JyIpO2JyZWFrO2Nhc2UgTDptLnB1c2goInoyIil9cmV0dXJuIG0uam9pbigiICIpfXN0YXRpYyBpbnZlcnNlKGYpe3ZhciBoLG4sbyxSLG0sQixNO2lmKEI9KGZ1bmN0aW9uKCl7dmFyIFUsRCxkLGs7Zm9yKGQ9SShmKSxrPVtdLFU9MCxEPWQubGVuZ3RoO1U8RDtVKyspUj1kW1VdLGg9Ui8zfDAsbT1SJTMsay5wdXNoKGgqMystKG0tMSkrMSk7cmV0dXJuIGt9KSgpLEIucmV2ZXJzZSgpLHR5cGVvZiBmPT0ic3RyaW5nIil7Zm9yKE09IiIsbj0wLG89Qi5sZW5ndGg7bjxvO24rKylSPUJbbl0saD1SLzN8MCxtPVIlMyxNKz1IW2hdLG09PT0xP00rPSIyIjptPT09MiYmKE0rPSInIiksTSs9IiAiO3JldHVybiBNLnN1YnN0cmluZygwLE0ubGVuZ3RoLTEpfWVsc2UgcmV0dXJuIGYubGVuZ3RoIT1udWxsP0I6QlswXX19cmV0dXJuIGcucHJvdG90eXBlLnJhbmRvbWl6ZT0oZnVuY3Rpb24oKXt2YXIgUyxmLGgsbixvLFIsbSxCLE07cmV0dXJuIFI9ZnVuY3Rpb24oVSxEKXtyZXR1cm4gVStNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKEQtVSsxKSl9LE09ZnVuY3Rpb24oVSl7dmFyIEQsZCxrO2ZvcihEPVUubGVuZ3RoO0QhPT0wOylkPVIoMCxELTEpLEQtPTEsaz1VW0RdLFtVW0RdLFVbZF1dPVtVW2RdLFVbRF1dfSxuPWZ1bmN0aW9uKFUpe3ZhciBELGQsayxWLHosQSxmZSxMZTtmb3Ioej0wLGZlPShmdW5jdGlvbigpe3ZhciBSZSxVZSxCZTtmb3IoQmU9W10sTGU9UmU9MCxVZT1VLmxlbmd0aC0xOzA8PVVlP1JlPD1VZTpSZT49VWU7TGU9MDw9VWU/KytSZTotLVJlKUJlLnB1c2goITEpO3JldHVybiBCZX0pKCk7Oyl7Zm9yKEQ9LTEsaz1WPTAsQT1VLmxlbmd0aC0xOzA8PUE/Vjw9QTpWPj1BO2s9MDw9QT8rK1Y6LS1WKWlmKCFmZVtrXSl7RD1rO2JyZWFrfWlmKEQ9PT0tMSlicmVhaztmb3IoZD0wOyFmZVtEXTspZmVbRF09ITAsZCsrLEQ9VVtEXTt6Kz1kKzF9cmV0dXJuIHp9LFM9ZnVuY3Rpb24oVSxEKXt2YXIgZDtyZXR1cm4gZD1uKEQpK24oVSksZCUyPT09MH0saD1mdW5jdGlvbihVLEQpe2ZvcihNKEQpLE0oVSk7IVMoVSxEKTspTShEKSxNKFUpfSxtPWZ1bmN0aW9uKFUsRCl7dmFyIGQsayxWLHo7Zm9yKFY9MCxkPWs9MCx6PVUubGVuZ3RoLTE7MDw9ej9rPD16Oms+PXo7ZD0wPD16PysrazotLWspVis9VVtkXT1SKDAsRC0xKX0sbz1mdW5jdGlvbihVLEQpe3JldHVybiBVLnJlZHVjZShmdW5jdGlvbihkLGspe3JldHVybiBkK2t9KSVEPT09MH0sZj1mdW5jdGlvbihVLEQpe2ZvcihtKFUsMyk7IW8oVSwzKTspbShVLDMpO2ZvcihtKEQsMik7IW8oRCwyKTspbShELDIpfSxCPWZ1bmN0aW9uKCl7cmV0dXJuIGgodGhpcy5jcCx0aGlzLmVwKSxmKHRoaXMuY28sdGhpcy5lbyksdGhpc30sQn0pKCksZy5tb3Zlcz1be2NlbnRlcjpbMCwxLDIsMyw0LDVdLGNwOltYLEcseCxZLCQsb2UscmUsc2VdLGNvOlswLDAsMCwwLDAsMCwwLDBdLGVwOltXLFosaixULFEsbmUsaWUsdGUsbGUsdWUsTyxKXSxlbzpbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdfSx7Y2VudGVyOlswLDEsMiwzLDQsNV0sY3A6WyQseCxZLEcsc2Usb2UscmUsWF0sY286WzIsMCwwLDEsMSwwLDAsMl0sZXA6W2xlLGosVCxXLEosbmUsaWUsdGUsUSx1ZSxPLFpdLGVvOlswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF19LHtjZW50ZXI6WzAsMSwyLDMsNCw1XSxjcDpbeCxvZSxZLFgsRywkLHJlLHNlXSxjbzpbMSwyLDAsMCwyLDEsMCwwXSxlcDpbWix1ZSxULFcsUSxsZSxpZSx0ZSxqLG5lLE8sSl0sZW86WzAsMSwwLDAsMCwxLDAsMCwxLDEsMCwwXX0se2NlbnRlcjpbMCwxLDIsMyw0LDVdLGNwOltHLHgsWSxYLG9lLHJlLHNlLCRdLGNvOlswLDAsMCwwLDAsMCwwLDBdLGVwOltaLGosVCxXLG5lLGllLHRlLFEsbGUsdWUsTyxKXSxlbzpbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDBdfSx7Y2VudGVyOlswLDEsMiwzLDQsNV0sY3A6W0csWSxyZSxYLCQseCxvZSxzZV0sY286WzAsMSwyLDAsMCwyLDEsMF0sZXA6W1osaixPLFcsUSxuZSx1ZSx0ZSxsZSxULGllLEpdLGVvOlswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF19LHtjZW50ZXI6WzAsMSwyLDMsNCw1XSxjcDpbRyx4LFgsc2UsJCxvZSxZLHJlXSxjbzpbMCwwLDEsMiwwLDAsMiwxXSxlcDpbWixqLFQsSixRLG5lLGllLE8sbGUsdWUsVyx0ZV0sZW86WzAsMCwwLDEsMCwwLDAsMSwwLDAsMSwxXX0se2NlbnRlcjpbbWUsdmUsYWUsTCxlZSxoZV0sY3A6W0cseCxZLFgsJCxvZSxyZSxzZV0sY286WzAsMCwwLDAsMCwwLDAsMF0sZXA6W1osaixULFcsUSxuZSxpZSx0ZSx1ZSxPLEosbGVdLGVvOlswLDAsMCwwLDAsMCwwLDAsMSwxLDEsMV19LHtjZW50ZXI6W2VlLGhlLG1lLHZlLGFlLExdLGNwOltHLHgsWSxYLCQsb2UscmUsc2VdLGNvOlswLDAsMCwwLDAsMCwwLDBdLGVwOltaLFcsVCx0ZSxRLGosaWUsbmUsbGUsdWUsTyxKXSxlbzpbMCwxLDAsMSwwLDEsMCwxLDAsMCwwLDBdfSx7Y2VudGVyOlthZSxtZSx2ZSxoZSxMLGVlXSxjcDpbRyx4LFksWCwkLG9lLHJlLHNlXSxjbzpbMCwwLDAsMCwwLDAsMCwwXSxlcDpbVCxqLGllLFcsWixuZSxRLHRlLGxlLHVlLE8sSl0sZW86WzEsMCwxLDAsMSwwLDEsMCwwLDAsMCwwXX1dLHE9e1U6MCxSOjEsRjoyLEQ6MyxMOjQsQjo1LEU6NixNOjcsUzo4LHg6OSx5OjEwLHo6MTEsdToxMixyOjEzLGY6MTQsZDoxNSxsOjE2LGI6MTd9LEg9ezA6IlUiLDE6IlIiLDI6IkYiLDM6IkQiLDQ6IkwiLDU6IkIiLDY6IkUiLDc6Ik0iLDg6IlMiLDk6IngiLDEwOiJ5IiwxMToieiIsMTI6InUiLDEzOiJyIiwxNDoiZiIsMTU6ImQiLDE2OiJsIiwxNzoiYiJ9LEk9ZnVuY3Rpb24oUyl7dmFyIGYsaCxuLG8sUixtLEI7aWYodHlwZW9mIFM9PSJzdHJpbmciKXtmb3IobT1TLnNwbGl0KC9ccysvKSxCPVtdLGY9MCxoPW0ubGVuZ3RoO2Y8aDtmKyspaWYobz1tW2ZdLG8ubGVuZ3RoIT09MCl7aWYoby5sZW5ndGg+Mil0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbW92ZTogJHtvfWApO2lmKG49cVtvWzBdXSxuPT09dm9pZCAwKXRocm93IG5ldyBFcnJvcihgSW52YWxpZCBtb3ZlOiAke299YCk7aWYoby5sZW5ndGg9PT0xKVI9MDtlbHNlIGlmKG9bMV09PT0iMiIpUj0xO2Vsc2UgaWYob1sxXT09PSInIilSPTI7ZWxzZSB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgbW92ZTogJHtvfWApO0IucHVzaChuKjMrUil9cmV0dXJuIEJ9ZWxzZSByZXR1cm4gUy5sZW5ndGghPW51bGw/UzpbU119LGcubW92ZXMucHVzaChuZXcgZygpLm1vdmUoIlIgTScgTCciKS50b0pTT04oKSksZy5tb3Zlcy5wdXNoKG5ldyBnKCkubW92ZSgiVSBFJyBEJyIpLnRvSlNPTigpKSxnLm1vdmVzLnB1c2gobmV3IGcoKS5tb3ZlKCJGIFMgQiciKS50b0pTT04oKSksZy5tb3Zlcy5wdXNoKG5ldyBnKCkubW92ZSgiVSBFJyIpLnRvSlNPTigpKSxnLm1vdmVzLnB1c2gobmV3IGcoKS5tb3ZlKCJSIE0nIikudG9KU09OKCkpLGcubW92ZXMucHVzaChuZXcgZygpLm1vdmUoIkYgUyIpLnRvSlNPTigpKSxnLm1vdmVzLnB1c2gobmV3IGcoKS5tb3ZlKCJEIEUiKS50b0pTT04oKSksZy5tb3Zlcy5wdXNoKG5ldyBnKCkubW92ZSgiTCBNIikudG9KU09OKCkpLGcubW92ZXMucHVzaChuZXcgZygpLm1vdmUoIkIgUyciKS50b0pTT04oKSksZ30pLmNhbGwodGhpcyksdHlwZW9mIEllPCJ1IiYmSWUhPT1udWxsP0llLmV4cG9ydHM9Y2U6dGhpcy5DdWJlPWNlfSkuY2FsbChXZSl9KTt2YXIgR2U9emUoWWU9PnsoZnVuY3Rpb24oKXt2YXIgZWUsTyxKLGNlLEwsdGUscmUsbmUsJCxpZSxvZSxRLHNlLHZlLHVlLGxlLGFlLGhlLG1lLFcsWCxqLHgsVCxZLFosRyxEZSxPZSxnZSx3ZSxwZSxGZSxILHEsSSxnLFMsZixoLG4sbyxSLG0sQixNLFUsRCxkLGssVix6LEEsZmUsTGUsUmUsVWUsQmUsUWU9W10uaW5kZXhPZjtMPXRoaXMuQ3ViZXx8cWUoKSxbd2UsZ2UsdWUsdGUsbWUsZWVdPVswLDEsMiwzLDQsNV0sW2YscSxnLEZlLGllLFEsbmUsdmVdPVswLDEsMiwzLDQsNSw2LDddLFtTLEgsSSxwZSxzZSwkLG9lLHJlLGFlLGxlLE8sSl09WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTFdLGNlPWZ1bmN0aW9uKHQscil7dmFyIHUsbCxlO2lmKHQ8cilyZXR1cm4gMDtmb3Iocj50LzImJihyPXQtciksZT0xLHU9dCxsPTE7dSE9PXQtcjspZSo9dSxlLz1sLHUtLSxsKys7cmV0dXJuIGV9LE09ZnVuY3Rpb24odCl7dmFyIHIsdSxsLGU7Zm9yKHI9MSx1PWw9MixlPXQ7Mjw9ZT9sPD1lOmw+PWU7dT0yPD1lPysrbDotLWwpcio9dTtyZXR1cm4gcn0sRD1mdW5jdGlvbih0LHIpe3JldHVybiB0PnI/dDpyfSxSZT1mdW5jdGlvbih0LHIsdSl7dmFyIGwsZSxpLGMsdjtmb3Iodj10W3JdLGw9ZT1pPXIsYz11LTE7aTw9Yz9lPD1jOmU+PWM7bD1pPD1jPysrZTotLWUpdFtsXT10W2wrMV07cmV0dXJuIHRbdV09dn0sVWU9ZnVuY3Rpb24odCxyLHUpe3ZhciBsLGUsaSxjLHY7Zm9yKHY9dFt1XSxsPWU9aT11LGM9cisxO2k8PWM/ZTw9YzplPj1jO2w9aTw9Yz8rK2U6LS1lKXRbbF09dFtsLTFdO3JldHVybiB0W3JdPXZ9LEE9ZnVuY3Rpb24odCxyLHUsbD0hMSl7dmFyIGUsaSxjLHYsdyx5O3JldHVybiB2PXUtcixjPU0odisxKSx0PT09ImNvcm5lcnMiPyhpPTcseT0iY3AiKTooaT0xMSx5PSJlcCIpLHc9KGZ1bmN0aW9uKCl7dmFyIE4sRixzO2ZvcihzPVtdLGU9Tj0wLEY9djswPD1GP048PUY6Tj49RjtlPTA8PUY/KytOOi0tTilzLnB1c2goMCk7cmV0dXJuIHN9KSgpLGZ1bmN0aW9uKE4pe3ZhciBGLHMsYSxwLGIsUCxDLEUsXyxkZSxiZSx5ZSxfZSxNZSxrZSxKZSxTZSxqZSxBZSxUZSwkZSxOZSx4ZSxDZSxLLFBlLEVlO2lmKE4hPW51bGwpe2ZvcihlPVA9MCxiZT12OzA8PWJlP1A8PWJlOlA+PWJlO2U9MDw9YmU/KytQOi0tUCl3W2VdPWUrcjtmb3Iocz1OJWMsRj1OL2N8MCxfPXRoaXNbeV0sZT1DPTAseWU9aTswPD15ZT9DPD15ZTpDPj15ZTtlPTA8PXllPysrQzotLUMpX1tlXT0tMTtmb3IocD1FPTEsTWU9djsxPD1NZT9FPD1NZTpFPj1NZTtwPTE8PU1lPysrRTotLUUpZm9yKGI9cyUocCsxKSxzPXMvKHArMSl8MDtiPjA7KVVlKHcsMCxwKSxiLS07aWYoSz12LGwpZm9yKHA9ZGU9MCxrZT1pOzA8PWtlP2RlPD1rZTpkZT49a2U7cD0wPD1rZT8rK2RlOi0tZGUpYT1jZShpLXAsSysxKSxGLWE+PTAmJihfW3BdPXdbdi1LXSxGLT1hLEstLSk7ZWxzZSBmb3IocD1OZT1KZT1pO0plPD0wP05lPD0wOk5lPj0wO3A9SmU8PTA/KytOZTotLU5lKWE9Y2UocCxLKzEpLEYtYT49MCYmKF9bcF09d1tLXSxGLT1hLEstLSk7cmV0dXJuIHRoaXN9ZWxzZXtmb3IoXz10aGlzW3ldLGU9eGU9MCxTZT12OzA8PVNlP3hlPD1TZTp4ZT49U2U7ZT0wPD1TZT8rK3hlOi0teGUpd1tlXT0tMTtpZihGPXM9Sz0wLGwpZm9yKHA9Q2U9amU9aTtqZTw9MD9DZTw9MDpDZT49MDtwPWplPD0wPysrQ2U6LS1DZSlyPD0oQWU9X1twXSkmJkFlPD11JiYoRis9Y2UoaS1wLEsrMSksd1t2LUtdPV9bcF0sSysrKTtlbHNlIGZvcihwPVBlPTAsVGU9aTswPD1UZT9QZTw9VGU6UGU+PVRlO3A9MDw9VGU/KytQZTotLVBlKXI8PSgkZT1fW3BdKSYmJGU8PXUmJihGKz1jZShwLEsrMSksd1tLXT1fW3BdLEsrKyk7Zm9yKHA9RWU9X2U9djtfZTw9MD9FZTw9MDpFZT49MDtwPV9lPD0wPysrRWU6LS1FZSl7Zm9yKGI9MDt3W3BdIT09citwOylSZSh3LDAscCksYisrO3M9KHArMSkqcytifXJldHVybiBGKmMrc319fSxoZT17dHdpc3Q6ZnVuY3Rpb24odCl7dmFyIHIsdSxsLGUsaSxjO2lmKHQhPW51bGwpe2ZvcihpPTAscj11PTY7dT49MDtyPS0tdSllPXQlMyx0PXQvM3wwLHRoaXMuY29bcl09ZSxpKz1lO3JldHVybiB0aGlzLmNvWzddPSgzLWklMyklMyx0aGlzfWVsc2V7Zm9yKGM9MCxyPWw9MDtsPD02O3I9KytsKWM9MypjK3RoaXMuY29bcl07cmV0dXJuIGN9fSxmbGlwOmZ1bmN0aW9uKHQpe3ZhciByLHUsbCxlLGksYztpZih0IT1udWxsKXtmb3IoaT0wLHI9dT0xMDt1Pj0wO3I9LS11KWU9dCUyLHQ9dC8yfDAsdGhpcy5lb1tyXT1lLGkrPWU7cmV0dXJuIHRoaXMuZW9bMTFdPSgyLWklMiklMix0aGlzfWVsc2V7Zm9yKGM9MCxyPWw9MDtsPD0xMDtyPSsrbCljPTIqYyt0aGlzLmVvW3JdO3JldHVybiBjfX0sY29ybmVyUGFyaXR5OmZ1bmN0aW9uKCl7dmFyIHQscix1LGwsZSxpLGMsdix3O2Zvcih3PTAsdD11PWU9dmUsaT1mKzE7ZTw9aT91PD1pOnU+PWk7dD1lPD1pPysrdTotLXUpZm9yKHI9bD1jPXQtMSx2PWY7Yzw9dj9sPD12Omw+PXY7cj1jPD12PysrbDotLWwpdGhpcy5jcFtyXT50aGlzLmNwW3RdJiZ3Kys7cmV0dXJuIHclMn0sZWRnZVBhcml0eTpmdW5jdGlvbigpe3ZhciB0LHIsdSxsLGUsaSxjLHYsdztmb3Iodz0wLHQ9dT1lPUosaT1TKzE7ZTw9aT91PD1pOnU+PWk7dD1lPD1pPysrdTotLXUpZm9yKHI9bD1jPXQtMSx2PVM7Yzw9dj9sPD12Omw+PXY7cj1jPD12PysrbDotLWwpdGhpcy5lcFtyXT50aGlzLmVwW3RdJiZ3Kys7cmV0dXJuIHclMn0sVVJGdG9ETEY6QSgiY29ybmVycyIsZixRKSxVUnRvVUw6QSgiZWRnZXMiLFMsSSksVUJ0b0RGOkEoImVkZ2VzIixwZSwkKSxVUnRvREY6QSgiZWRnZXMiLFMsJCksRlJ0b0JSOkEoImVkZ2VzIixhZSxKLCEwKX07Zm9yKFUgaW4gaGUpQmU9aGVbVV0sTC5wcm90b3R5cGVbVV09QmU7bz1mdW5jdGlvbih0LHIsdSl7dmFyIGwsZSxpLGMsdix3LHksTixGLHMsYSxwO2ZvcihsPXQ9PT0iY29ybmVycyI/ImNvcm5lck11bHRpcGx5IjoiZWRnZU11bHRpcGx5IixlPW5ldyBMLHA9W10saT15PTAsYT11LTE7MDw9YT95PD1hOnk+PWE7aT0wPD1hPysreTotLXkpe2ZvcihlW3JdKGkpLGM9W10sdj1GPTA7Rjw9NTt2PSsrRil7Zm9yKE49TC5tb3Zlc1t2XSx3PXM9MDtzPD0yO3c9KytzKWVbbF0oTiksYy5wdXNoKGVbcl0oKSk7ZVtsXShOKX1wLnB1c2goYyl9cmV0dXJuIHB9LGQ9KGZ1bmN0aW9uKCl7dmFyIHQscjtyZXR1cm4gdD1uZXcgTCxyPW5ldyBMLGZ1bmN0aW9uKHUsbCl7dmFyIGUsaTtmb3IodC5VUnRvVUwodSksci5VQnRvREYobCksZT1pPTA7aTw9NztlPSsraSlpZih0LmVwW2VdIT09LTEpe2lmKHIuZXBbZV0hPT0tMSlyZXR1cm4tMTtyLmVwW2VdPXQuZXBbZV19cmV0dXJuIHIuVVJ0b0RGKCl9fSkoKSxZPTIxODcsVz0yMDQ4LGo9MixYPTExODgwLHg9NDk1LFQ9MjQsRz0yMDE2MCxEZT0yMDE2MCxPZT0xMzIwLFo9MTMyMCxMLm1vdmVUYWJsZXM9e3Bhcml0eTpbWzEsMCwxLDEsMCwxLDEsMCwxLDEsMCwxLDEsMCwxLDEsMCwxXSxbMCwxLDAsMCwxLDAsMCwxLDAsMCwxLDAsMCwxLDAsMCwxLDBdXSx0d2lzdDpudWxsLGZsaXA6bnVsbCxGUnRvQlI6bnVsbCxVUkZ0b0RMRjpudWxsLFVSdG9ERjpudWxsLFVSdG9VTDpudWxsLFVCdG9ERjpudWxsLG1lcmdlVVJ0b0RGOm51bGx9LGs9e3R3aXN0OlsiY29ybmVycyIsWV0sZmxpcDpbImVkZ2VzIixXXSxGUnRvQlI6WyJlZGdlcyIsWF0sVVJGdG9ETEY6WyJjb3JuZXJzIixHXSxVUnRvREY6WyJlZGdlcyIsRGVdLFVSdG9VTDpbImVkZ2VzIixPZV0sVUJ0b0RGOlsiZWRnZXMiLFpdLG1lcmdlVVJ0b0RGOltdfSxMLmNvbXB1dGVNb3ZlVGFibGVzPWZ1bmN0aW9uKC4uLnQpe3ZhciByLHUsbCxlLGksYztmb3IodC5sZW5ndGg9PT0wJiYodD0oZnVuY3Rpb24oKXt2YXIgdjt2PVtdO2ZvcihsIGluIGspdi5wdXNoKGwpO3JldHVybiB2fSkoKSksdT0wLHI9dC5sZW5ndGg7dTxyO3UrKyljPXRbdV0sdGhpcy5tb3ZlVGFibGVzW2NdPT09bnVsbCYmKGM9PT0ibWVyZ2VVUnRvREYiP3RoaXMubW92ZVRhYmxlcy5tZXJnZVVSdG9ERj0oZnVuY3Rpb24oKXt2YXIgdix3LHksTjtmb3IoTj1bXSx3PXk9MDt5PD0zMzU7dz0rK3kpTi5wdXNoKChmdW5jdGlvbigpe3ZhciBGLHM7Zm9yKHM9W10sdj1GPTA7Rjw9MzM1O3Y9KytGKXMucHVzaChkKHcsdikpO3JldHVybiBzfSkoKSk7cmV0dXJuIE59KSgpOihbZSxpXT1rW2NdLHRoaXMubW92ZVRhYmxlc1tjXT1vKGUsYyxpKSkpO3JldHVybiB0aGlzfSxoPVswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3XSxWPShmdW5jdGlvbigpe3ZhciB0LHIsdSxsLGUsaSxjLHY7Zm9yKHY9W10scj11PTA7dTw9NTtyPSsrdSl7Zm9yKGw9W10sdD1lPTA7ZTw9NTt0PSsrZSlpZih0IT09ciYmdCE9PXItMylmb3IoYz1pPTA7aTw9MjtjPSsraSlsLnB1c2godCozK2MpO3YucHVzaChsKX1yZXR1cm4gdn0pKCksbj1bMCwxLDIsNCw3LDksMTAsMTEsMTMsMTZdLHo9KGZ1bmN0aW9uKCl7dmFyIHQscix1LGwsZSxpLGMsdix3LHk7Zm9yKHk9W10scj1sPTA7bDw9NTtyPSsrbCl7Zm9yKGU9W10sdD1pPTA7aTw9NTt0PSsraSlpZih0IT09ciYmdCE9PXItMylmb3Iodz10PT09MHx8dD09PTM/WzAsMSwyXTpbMV0sYz0wLHU9dy5sZW5ndGg7Yzx1O2MrKyl2PXdbY10sZS5wdXNoKHQqMyt2KTt5LnB1c2goZSl9cmV0dXJuIHl9KSgpLGZlPWZ1bmN0aW9uKHQscix1KXt2YXIgbCxlLGk7cmV0dXJuIGw9ciU4LGk9cj4+MyxlPWw8PDIsdSE9bnVsbD8odFtpXSY9figxNTw8ZSksdFtpXXw9dTw8ZSx1KToodFtpXSYxNTw8ZSk+Pj5lfSxSPWZ1bmN0aW9uKHQscix1LGwpe3ZhciBlLGksYyx2LHcseSxOLEYscyxhLHAsYixQO2ZvcihiPShmdW5jdGlvbigpe3ZhciBDLEUsXztmb3IoXz1bXSxQPUM9MCxFPU1hdGguY2VpbChyLzgpLTE7MDw9RT9DPD1FOkM+PUU7UD0wPD1FPysrQzotLUMpXy5wdXNoKDQyOTQ5NjcyOTUpO3JldHVybiBffSkoKSx0PT09MT9GPWg6Rj1uLGk9MCxmZShiLDAsaSksYz0xO2MhPT1yOyl7Zm9yKHY9eT0wLHA9ci0xOzA8PXA/eTw9cDp5Pj1wO3Y9MDw9cD8rK3k6LS15KWlmKGZlKGIsdik9PT1pKWZvcihlPXUodiksYT0wLHc9Ri5sZW5ndGg7YTx3O2ErKylOPUZbYV0scz1sKGUsTiksZmUoYixzKT09PTE1JiYoZmUoYixzLGkrMSksYysrKTtpKyt9cmV0dXJuIGJ9LEwucHJ1bmluZ1RhYmxlcz17c2xpY2VUd2lzdDpudWxsLHNsaWNlRmxpcDpudWxsLHNsaWNlVVJGdG9ETEZQYXJpdHk6bnVsbCxzbGljZVVSdG9ERlBhcml0eTpudWxsfSxMZT17c2xpY2VUd2lzdDpbMSx4KlksZnVuY3Rpb24odCl7cmV0dXJuW3QleCx0L3h8MF19LGZ1bmN0aW9uKHQscil7dmFyIHUsbCxlLGk7cmV0dXJuW2UsaV09dCx1PUwubW92ZVRhYmxlcy5GUnRvQlJbZSoyNF1bcl0vMjR8MCxsPUwubW92ZVRhYmxlcy50d2lzdFtpXVtyXSxsKngrdX1dLHNsaWNlRmxpcDpbMSx4KlcsZnVuY3Rpb24odCl7cmV0dXJuW3QleCx0L3h8MF19LGZ1bmN0aW9uKHQscil7dmFyIHUsbCxlLGk7cmV0dXJuW2ksdV09dCxlPUwubW92ZVRhYmxlcy5GUnRvQlJbaSoyNF1bcl0vMjR8MCxsPUwubW92ZVRhYmxlcy5mbGlwW3VdW3JdLGwqeCtlfV0sc2xpY2VVUkZ0b0RMRlBhcml0eTpbMixUKkcqaixmdW5jdGlvbih0KXtyZXR1cm5bdCUyLCh0LzJ8MCklVCwodC8yfDApL1R8MF19LGZ1bmN0aW9uKHQscil7dmFyIHUsbCxlLGksYyx2O3JldHVybltjLHYsdV09dCxsPUwubW92ZVRhYmxlcy5wYXJpdHlbY11bcl0sZT1MLm1vdmVUYWJsZXMuRlJ0b0JSW3ZdW3JdLGk9TC5tb3ZlVGFibGVzLlVSRnRvRExGW3VdW3JdLChpKlQrZSkqMitsfV0sc2xpY2VVUnRvREZQYXJpdHk6WzIsVCpEZSpqLGZ1bmN0aW9uKHQpe3JldHVyblt0JTIsKHQvMnwwKSVULCh0LzJ8MCkvVHwwXX0sZnVuY3Rpb24odCxyKXt2YXIgdSxsLGUsaSxjLHY7cmV0dXJuW2Msdix1XT10LGw9TC5tb3ZlVGFibGVzLnBhcml0eVtjXVtyXSxlPUwubW92ZVRhYmxlcy5GUnRvQlJbdl1bcl0saT1MLm1vdmVUYWJsZXMuVVJ0b0RGW3VdW3JdLChpKlQrZSkqMitsfV19LEwuY29tcHV0ZVBydW5pbmdUYWJsZXM9ZnVuY3Rpb24oLi4udCl7dmFyIHIsdSxsLGUsaTtmb3IodC5sZW5ndGg9PT0wJiYodD0oZnVuY3Rpb24oKXt2YXIgYztjPVtdO2ZvcihsIGluIExlKWMucHVzaChsKTtyZXR1cm4gY30pKCkpLHU9MCxyPXQubGVuZ3RoO3U8cjt1KyspaT10W3VdLHRoaXMucHJ1bmluZ1RhYmxlc1tpXT09PW51bGwmJihlPUxlW2ldLHRoaXMucHJ1bmluZ1RhYmxlc1tpXT1SKC4uLmUpKTtyZXR1cm4gdGhpc30sTC5pbml0U29sdmVyPWZ1bmN0aW9uKCl7cmV0dXJuIEwuY29tcHV0ZU1vdmVUYWJsZXMoKSxMLmNvbXB1dGVQcnVuaW5nVGFibGVzKCl9LEwucHJvdG90eXBlLnNvbHZlVXByaWdodD1mdW5jdGlvbih0PTIyKXt2YXIgcix1LGwsZSxpLGMsdix3LHksTjtyZXR1cm4gbD0oZnVuY3Rpb24oKXt2YXIgRixzLGEscCxiLFAsQztmb3Iocz1bIlUiLCJSIiwiRiIsIkQiLCJMIiwiQiJdLFA9WyIiLCIyIiwiJyJdLEM9W10sRj1hPTA7YTw9NTtGPSsrYSlmb3IoYj1wPTA7cDw9MjtiPSsrcClDLnB1c2goc1tGXStQW2JdKTtyZXR1cm4gQ30pKCkscj1jbGFzc3tjb25zdHJ1Y3RvcihzKXt0aGlzLnBhcmVudD1udWxsLHRoaXMubGFzdE1vdmU9bnVsbCx0aGlzLmRlcHRoPTAscyYmdGhpcy5pbml0KHMpfWluaXQocyl7cmV0dXJuIHRoaXMuZmxpcD1zLmZsaXAoKSx0aGlzLnR3aXN0PXMudHdpc3QoKSx0aGlzLnNsaWNlPXMuRlJ0b0JSKCkvVHwwLHRoaXMucGFyaXR5PXMuY29ybmVyUGFyaXR5KCksdGhpcy5VUkZ0b0RMRj1zLlVSRnRvRExGKCksdGhpcy5GUnRvQlI9cy5GUnRvQlIoKSx0aGlzLlVSdG9VTD1zLlVSdG9VTCgpLHRoaXMuVUJ0b0RGPXMuVUJ0b0RGKCksdGhpc31zb2x1dGlvbigpe3JldHVybiB0aGlzLnBhcmVudD90aGlzLnBhcmVudC5zb2x1dGlvbigpK2xbdGhpcy5sYXN0TW92ZV0rIiAiOiIifW1vdmUocyxhLHApe3JldHVybiBMLm1vdmVUYWJsZXNbc11bYV1bcF19cHJ1bmluZyhzLGEpe3JldHVybiBmZShMLnBydW5pbmdUYWJsZXNbc10sYSl9bW92ZXMxKCl7cmV0dXJuIHRoaXMubGFzdE1vdmUhPT1udWxsP1ZbdGhpcy5sYXN0TW92ZS8zfDBdOmh9bWluRGlzdDEoKXt2YXIgcyxhO3JldHVybiBzPXRoaXMucHJ1bmluZygic2xpY2VGbGlwIix4KnRoaXMuZmxpcCt0aGlzLnNsaWNlKSxhPXRoaXMucHJ1bmluZygic2xpY2VUd2lzdCIseCp0aGlzLnR3aXN0K3RoaXMuc2xpY2UpLEQocyxhKX1uZXh0MShzKXt2YXIgYTtyZXR1cm4gYT11LnBvcCgpLGEucGFyZW50PXRoaXMsYS5sYXN0TW92ZT1zLGEuZGVwdGg9dGhpcy5kZXB0aCsxLGEuZmxpcD10aGlzLm1vdmUoImZsaXAiLHRoaXMuZmxpcCxzKSxhLnR3aXN0PXRoaXMubW92ZSgidHdpc3QiLHRoaXMudHdpc3QscyksYS5zbGljZT10aGlzLm1vdmUoIkZSdG9CUiIsdGhpcy5zbGljZSoyNCxzKS8yNHwwLGF9bW92ZXMyKCl7cmV0dXJuIHRoaXMubGFzdE1vdmUhPT1udWxsP3pbdGhpcy5sYXN0TW92ZS8zfDBdOm59bWluRGlzdDIoKXt2YXIgcyxhLHAsYjtyZXR1cm4gcD0oVCp0aGlzLlVSdG9ERit0aGlzLkZSdG9CUikqait0aGlzLnBhcml0eSxzPXRoaXMucHJ1bmluZygic2xpY2VVUnRvREZQYXJpdHkiLHApLGI9KFQqdGhpcy5VUkZ0b0RMRit0aGlzLkZSdG9CUikqait0aGlzLnBhcml0eSxhPXRoaXMucHJ1bmluZygic2xpY2VVUkZ0b0RMRlBhcml0eSIsYiksRChzLGEpfWluaXQyKHM9ITApe2lmKHRoaXMucGFyZW50IT09bnVsbCYmKHRoaXMucGFyZW50LmluaXQyKCExKSx0aGlzLlVSRnRvRExGPXRoaXMubW92ZSgiVVJGdG9ETEYiLHRoaXMucGFyZW50LlVSRnRvRExGLHRoaXMubGFzdE1vdmUpLHRoaXMuRlJ0b0JSPXRoaXMubW92ZSgiRlJ0b0JSIix0aGlzLnBhcmVudC5GUnRvQlIsdGhpcy5sYXN0TW92ZSksdGhpcy5wYXJpdHk9dGhpcy5tb3ZlKCJwYXJpdHkiLHRoaXMucGFyZW50LnBhcml0eSx0aGlzLmxhc3RNb3ZlKSx0aGlzLlVSdG9VTD10aGlzLm1vdmUoIlVSdG9VTCIsdGhpcy5wYXJlbnQuVVJ0b1VMLHRoaXMubGFzdE1vdmUpLHRoaXMuVUJ0b0RGPXRoaXMubW92ZSgiVUJ0b0RGIix0aGlzLnBhcmVudC5VQnRvREYsdGhpcy5sYXN0TW92ZSkscykpcmV0dXJuIHRoaXMuVVJ0b0RGPXRoaXMubW92ZSgibWVyZ2VVUnRvREYiLHRoaXMuVVJ0b1VMLHRoaXMuVUJ0b0RGKX1uZXh0MihzKXt2YXIgYTtyZXR1cm4gYT11LnBvcCgpLGEucGFyZW50PXRoaXMsYS5sYXN0TW92ZT1zLGEuZGVwdGg9dGhpcy5kZXB0aCsxLGEuVVJGdG9ETEY9dGhpcy5tb3ZlKCJVUkZ0b0RMRiIsdGhpcy5VUkZ0b0RMRixzKSxhLkZSdG9CUj10aGlzLm1vdmUoIkZSdG9CUiIsdGhpcy5GUnRvQlIscyksYS5wYXJpdHk9dGhpcy5tb3ZlKCJwYXJpdHkiLHRoaXMucGFyaXR5LHMpLGEuVVJ0b0RGPXRoaXMubW92ZSgiVVJ0b0RGIix0aGlzLlVSdG9ERixzKSxhfX0sdz1udWxsLGk9ZnVuY3Rpb24oRil7dmFyIHMsYSxwLGI7Zm9yKHM9MCxiPVtdLHM9YT0xLHA9dDsoMTw9cD9hPD1wOmE+PXApJiYoZShGLHMpLHc9PT1udWxsKTtzPTE8PXA/KythOi0tYSliLnB1c2gocysrKTtyZXR1cm4gYn0sZT1mdW5jdGlvbihGLHMpe3ZhciBhLHAsYixQLEMsRSxfO2lmKHM9PT0wKXtpZihGLm1pbkRpc3QxKCk9PT0wJiYoRi5sYXN0TW92ZT09PW51bGx8fChDPUYubGFzdE1vdmUsUWUuY2FsbChuLEMpPDApKSlyZXR1cm4gdihGKX1lbHNlIGlmKHM+MCYmRi5taW5EaXN0MSgpPD1zKXtmb3IoRT1GLm1vdmVzMSgpLF89W10scD0wLGE9RS5sZW5ndGg7cDxhJiYoYj1FW3BdLFA9Ri5uZXh0MShiKSxlKFAscy0xKSx1LnB1c2goUCksdz09PW51bGwpO3ArKylfLnB1c2godm9pZCAwKTtyZXR1cm4gX319LHY9ZnVuY3Rpb24oRil7dmFyIHMsYSxwLGI7Zm9yKEYuaW5pdDIoKSxiPVtdLHM9YT0xLHA9dC1GLmRlcHRoOygxPD1wP2E8PXA6YT49cCkmJihjKEYscyksdz09PW51bGwpO3M9MTw9cD8rK2E6LS1hKWIucHVzaChzKyspO3JldHVybiBifSxjPWZ1bmN0aW9uKEYscyl7dmFyIGEscCxiLFAsQyxFO2lmKHM9PT0wKXtpZihGLm1pbkRpc3QyKCk9PT0wKXJldHVybiB3PUYuc29sdXRpb24oKX1lbHNlIGlmKHM+MCYmRi5taW5EaXN0MigpPD1zKXtmb3IoQz1GLm1vdmVzMigpLEU9W10scD0wLGE9Qy5sZW5ndGg7cDxhJiYoYj1DW3BdLFA9Ri5uZXh0MihiKSxjKFAscy0xKSx1LnB1c2goUCksdz09PW51bGwpO3ArKylFLnB1c2godm9pZCAwKTtyZXR1cm4gRX19LHU9KGZ1bmN0aW9uKCl7dmFyIEYscyxhO2ZvcihhPVtdLE49Rj0wLHM9dCsxOzA8PXM/Rjw9czpGPj1zO049MDw9cz8rK0Y6LS1GKWEucHVzaChuZXcgcik7cmV0dXJuIGF9KSgpLHk9dS5wb3AoKS5pbml0KHRoaXMpLGkoeSksdS5wdXNoKHkpLHcubGVuZ3RoPjAmJih3PXcuc3Vic3RyaW5nKDAsdy5sZW5ndGgtMSkpLHd9LEI9e1U6MCxSOjEsRjoyLEQ6MyxMOjQsQjo1fSxtPXswOiJVIiwxOiJSIiwyOiJGIiwzOiJEIiw0OiJMIiw1OiJCIn0sTC5wcm90b3R5cGUuc29sdmU9ZnVuY3Rpb24odD0yMil7dmFyIHIsdSxsLGUsaSxjLHYsdyx5O2ZvcihyPXRoaXMuY2xvbmUoKSx3PXIudXByaWdodCgpLHIubW92ZSh3KSxjPW5ldyBMKCkubW92ZSh3KS5jZW50ZXIseT1yLnNvbHZlVXByaWdodCh0KSx2PVtdLGk9eS5zcGxpdCgiICIpLGw9MCx1PWkubGVuZ3RoO2w8dTtsKyspZT1pW2xdLHYucHVzaChtW2NbQltlWzBdXV1dKSxlLmxlbmd0aD4xJiYodlt2Lmxlbmd0aC0xXSs9ZVsxXSk7cmV0dXJuIHYuam9pbigiICIpfSxMLnNjcmFtYmxlPWZ1bmN0aW9uKCl7cmV0dXJuIEwuaW52ZXJzZShMLnJhbmRvbSgpLnNvbHZlKCkpfX0pLmNhbGwoWWUpfSk7dmFyIEtlPXplKCh0dCxIZSk9PntIZS5leHBvcnRzPXFlKCk7R2UoKX0pO3ZhciBWZT1LZSgpO3NlbGYuQ3ViZT1WZTtzZWxmLm9ubWVzc2FnZT1mdW5jdGlvbihlZSl7ZWUuZGF0YT09PSJpbml0Ij8oVmUuaW5pdFNvbHZlcigpLHNlbGYucG9zdE1lc3NhZ2Uoe3JlYWR5OiEwfSkpOmVlLmRhdGE9PT0ic2NyYW1ibGUiJiZzZWxmLnBvc3RNZXNzYWdlKHtzY3JhbWJsZTpWZS5zY3JhbWJsZSgpfSl9O30pKCk7Cg==';
const WCA={worker:null,ready:false,failed:false,pending:false};
function wcaInit(){
  if(WCA.worker||WCA.failed)return;
  try{
    if(typeof Worker==='undefined')throw 0;
    const url=URL.createObjectURL(new Blob([atob(CUBEJS_B64)],{type:'text/javascript'}));
    WCA.worker=new Worker(url);
    WCA.worker.onerror=()=>{WCA.failed=true;scrBtnLabel();if(WCA.pending){WCA.pending=false;scrFallback();}};
    WCA.worker.onmessage=e=>{
      if(e.data.ready){WCA.ready=true;scrBtnLabel();if(WCA.pending){WCA.pending=false;WCA.worker.postMessage('scramble');}if(WCA.cb&&!WCA.cbSent){WCA.cbSent=true;WCA.worker.postMessage('scramble');}}
      else if(e.data.scramble){
        if(WCA.cb){const cb=WCA.cb;WCA.cb=null;WCA.cbSent=false;cb(e.data.scramble);}
        else{$('#scrinput').value=e.data.scramble;scrUpdate();scrBtnLabel();}
      }
    };
    WCA.worker.postMessage('init');
  }catch(err){WCA.failed=true;}
}
function scrFallback(){$('#scrinput').value=scrRandom();scrUpdate();}
function scrBtnLabel(){
  const b=$('#scrrand');if(!b)return;
  const t=(ja,en)=>(typeof LANG!=='undefined'&&LANG==='en')?en:ja;
  b.textContent=WCA.failed?t('ランダム生成','Random'):(WCA.ready?t('WCAスクランブル','WCA Scramble'):(WCA.worker?t('準備中…','Preparing…'):t('WCAスクランブル','WCA Scramble')));
  b.disabled=!!(WCA.worker&&!WCA.ready&&!WCA.failed);
}

function scrRandom(n=20){
  const faces=['U','D','L','R','F','B'],axis={U:0,D:0,L:1,R:1,F:2,B:2},suf=['',"'",'2'];
  const out=[];let p1='',p2='';
  while(out.length<n){
    const f=faces[Math.floor(Math.random()*6)];
    if(f===p1)continue;
    if(p1&&p2&&axis[f]===axis[p1]&&axis[f]===axis[p2])continue;
    out.push(f+suf[Math.floor(Math.random()*3)]);p2=p1;p1=f;
  }
  return out.join(' ');
}
function scrUpdate(){
  const raw=$('#scrinput').value;
  const all=raw.trim()?raw.replace(/[()]/g,' ').trim().split(/\s+/):[];
  const good=all.filter(t=>M[t]),bad=all.filter(t=>!M[t]);
  let st=SOLVED.slice();
  for(const t of good)st=ap(st,M[t]);
  $('#scrnet').innerHTML=netStateSVG(st);
  $('#scrmeta').innerHTML=`${good.length}手`+(bad.length?` <span class="bad">/ 認識できない記号: ${bad.map(x=>x.replace(/[<>&]/g,'')).join(' ')}</span>`:'');
  return good.join(' ');
}
function scrInit(){
  if(scrInit._done)return;scrInit._done=true;
  $('#scrinput').addEventListener('input',scrUpdate);
  $('#scrrand').addEventListener('click',()=>{
    if(WCA.failed||typeof Worker==='undefined'){scrFallback();return;}
    if(WCA.ready){WCA.worker.postMessage('scramble');return;}
    WCA.pending=true;wcaInit();scrBtnLabel();
  });
  setTimeout(wcaInit,2500); // 裏で先に初期化(初回タップを待たせない)
  scrBtnLabel();
  $('#scrperfect').addEventListener('click',()=>{
    $('#scrinput').value=PERFECT[Math.floor(Math.random()*2)];
    scrUpdate();
    $('#scrmeta').innerHTML+=' <span style="color:var(--gn);font-weight:700">パーフェクトスクランブル: 全面で同色ステッカーが縦横斜めに一切隣接しない唯一の配置(43京通り中48対称のみ)</span>';
  });
  $('#scrclear').addEventListener('click',()=>{$('#scrinput').value='';scrUpdate();});
  $('#scrplay').addEventListener('click',()=>{
    const alg=scrUpdate();
    if(!alg)return;
    n3loadAlg(alg,'スクランブル',false,false,'solved');
    openPP();
  });
  $('#scrinput').value=scrRandom();scrUpdate();
}

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

/* ================= nav & mode ================= */
const PAGE_IDS=new Set(['home','basic','cross','f2l','oll','pll','quiz']);
function go(p,historyMode='push'){
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
document.querySelectorAll('#tabbar button').forEach(b=>b.addEventListener('click',()=>go(b.dataset.p)));
document.querySelectorAll('#themeSeg button').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
new MutationObserver(queueLanguage).observe(document.body,{subtree:true,childList:true,characterData:true});
applyTheme();
applyLanguage();

if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',async()=>{
    try{const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});await registration.update();}catch(e){}
  });
}
