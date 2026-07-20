/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
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
function fpSolvePlan(forceMode){
  svInit();
  const simple=forceMode?forceMode==='s':(typeof mode!=='undefined'&&mode==='s');
  let cur=FP.state.slice();
  const all=[];
  // 2層回し・中層・持ち替えでセンターの向きが変わっていたら、まず持ち替えで基準(黄上・青前)に戻す
  if(cur[4]!==4||cur[22]!==22){
    const P=['','x',"x'",'x2','z',"z'"],Y=['','y',"y'",'y2'];
    let fix=null;
    outer:for(const a of P)for(const b of Y){
      const s=(a+' '+b).trim();
      const t2=s?run(cur,s):cur;
      if(t2[4]===4&&t2[22]===22){fix=s;break outer;}
    }
    if(!fix)return null;
    all.push({
      stage:tj('持ち替え','Reorient'),
      t:tj('向きを基準に戻す','Reorient the cube'),
      j:tj('2層回しや中層回しでキューブごと向きが変わっている。黄センターを上・青センターを正面に持ち替えてから解く',
           'Wide/slice turns rotated the whole cube. Bring the yellow center up and the blue center to the front first'),
      alg:fix,mv:toks(fix),hi:null,view:[-25,-35]
    });
    cur=run(cur,fix);
  }
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
    // スワイプパッド側も同期して光らせる
    const t2=token.replace('2','');
    document.querySelectorAll('#fpSwipe .fpsBtn').forEach(b=>{
      if(b.dataset.neg===t2||b.dataset.pos===t2||b.dataset.neg===token||b.dataset.pos===token){
        b.classList.add('flash');setTimeout(()=>b.classList.remove('flash'),240);
      }
    });
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
  // スクランブルは「完成状態から」が定義。直前の自由回しはリセットしてから適用する
  const fpSoftReset=()=>{
    FP.state=SOLVED.slice();FP.hist=[];FP.moves=0;fpPaint();
    $('#fpCount').textContent=(typeof LANG!=='undefined'&&LANG==='en')?'0 moves':'0手';
    const sb=$('#fpSolved');if(sb)sb.hidden=true;
  };
  $('#fpScramble').addEventListener('click',()=>{
    if(FP.anim||FP.solving)return;
    if(WCA.ready&&!WCA.failed){WCA.cb=s2=>{fpSoftReset();fpApplySeq(toks(s2));};WCA.cbSent=true;WCA.worker.postMessage('scramble');}
    else if(!WCA.failed&&typeof Worker!=='undefined'){WCA.cb=s2=>{fpSoftReset();fpApplySeq(toks(s2));};WCA.cbSent=false;wcaInit();}
    else{fpSoftReset();fpApplySeq(toks(scrRandom(18)));}
  });
  $('#fpPerfect').addEventListener('click',()=>{
    if(FP.anim||FP.solving)return;
    fpSoftReset();
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
    const ps=$('#fpPlanStat');if(ps)ps.hidden=true;

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
    // 簡易/本格それぞれの見積り(段数・手数)をステージ余白に表示
    {
      const other=fpSolvePlan((typeof mode!=='undefined'&&mode==='s')?'f':'s');
      const stat=p=>p?[p.length,p.reduce((a,st)=>a+st.mv.length,0)]:null;
      const cur=stat(plan),oth=stat(other);
      const curIsS=(typeof mode!=='undefined'&&mode==='s');
      const [sS,sF]=curIsS?[cur,oth]:[oth,cur];
      const el=$('#fpPlanStat');
      if(el){
        el.innerHTML=
          `<span class="${curIsS?'now':''}">${tj('簡易','Simple')} ${sS?sS[0]+tj('段','st ')+' / '+sS[1]+tj('手','mv'):'—'}</span>`+
          `<span class="${curIsS?'':'now'}">${tj('本格','Adv.')} ${sF?sF[0]+tj('段','st ')+' / '+sF[1]+tj('手','mv'):'—'}</span>`;
        el.hidden=false;
      }
    }
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

