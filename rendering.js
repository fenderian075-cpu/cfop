/* ===== 3D player side panel ===== */
const PP={open:false,min:false,homes:null,lastFocus:null};
function ppNodes(){return [$('#n3stage').closest('.n3wrap'),$('#algPlayer')];}
function openPP(){
  const body=$('#ppbody');
  const nodes=ppNodes();
  PP.lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(!PP.homes)PP.homes=nodes.map(el=>{
    const marker=document.createComment('3d-player-home');
    el.parentNode.insertBefore(marker,el);
    return [el,marker];
  });
  nodes.forEach(el=>{if(el.parentNode!==body)body.appendChild(el);});
  $('#pptitle').textContent=N3.algName||'3D再生';
  $('#pprname').textContent=N3.algName||'3D再生';
  $('#pp').classList.add('open');$('#pp').setAttribute('aria-hidden','false');
  $('#pprestore').hidden=true;PP.open=true;PP.min=false;
  try{n3view();}catch(e){}
  requestAnimationFrame(()=>$('#ppclose')?.focus());
}
function minPP(){
  $('#pp').classList.remove('open');
  $('#pprname').textContent=N3.algName||'3D再生';
  $('#pprestore').hidden=false;PP.min=true;requestAnimationFrame(()=>$('#pprestore')?.focus());
}
function restorePP(){$('#pp').classList.add('open');$('#pprestore').hidden=true;PP.min=false;requestAnimationFrame(()=>$('#ppclose')?.focus());}
function closePP(){
  if(!PP.open)return;
  n3pause();
  $('#pp').classList.remove('open');$('#pp').setAttribute('aria-hidden','true');
  $('#pprestore').hidden=true;PP.open=false;PP.min=false;
  if(PP.homes){
    for(const [el,marker] of PP.homes){
      if(marker.parentNode)marker.parentNode.insertBefore(el,marker.nextSibling);
      marker.remove();
    }
    PP.homes=null;
  }
  try{n3view();}catch(e){}
  if(PP.lastFocus&&document.contains(PP.lastFocus))requestAnimationFrame(()=>PP.lastFocus.focus());
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&PP.open){closePP();return;}
  const tag=(e.target&&e.target.tagName)||'';
  if(/INPUT|TEXTAREA|SELECT/.test(tag)||e.isComposing)return;
  const active=PP.open||document.body.dataset.page==='basic';
  if(!active)return;
  if(e.key===' '){e.preventDefault();n3play();}
  else if(e.key==='ArrowRight'){e.preventDefault();n3pause();n3stepForward();}
  else if(e.key==='ArrowLeft'){e.preventDefault();n3pause();n3stepBack();}
});

function attach3DButton(root,alg,name,kind){
  const bt=root.querySelector('.playmini');
  if(!bt)return;
  bt.addEventListener('click',e=>{e.stopPropagation();n3loadAlg(alg,name,false,false,'case',kind||'trigger');openPP();});
}

/* ================= rendering ================= */
const FC=['#FFFF55','#D92E20','#1B45A6','#FFFFFF','#EB632B','#449751']; // U R F D L B (だーおか配色由来)
const GRAY='var(--dOff)', DARK='var(--dMask)';
const LLORIG=new Set([0,1,2,3,4,5,6,7,8,18,19,20,9,10,11,36,37,38,45,46,47]);
const PAIR=new Set([29,26,15,23,12]);
function rect(x,y,w,h,f,st){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="${f}" stroke="${st||'var(--dline)'}" stroke-width="${st?1.3:1}"/>`;}
/* Last-layer top view. mode:'oll'|'pll'  maskC: corners ignored */
function llSVG(st,mode,maskC,arrows){
  const S=26,G=2,T=12,o=T+G;
  const col=c=> mode==='oll' ? (c<9?FC[0]:'var(--ollOff,var(--dOff))') : FC[Math.floor(c/9)];
  let s='';
  const cellX=i=>o+G+i*(S+G);
  // U face
  for(let k=0;k<9;k++){
    const r=Math.floor(k/3),c=k%3;
    const corner=(k===0||k===2||k===6||k===8);
    const top=mode==='pll'?GRAY:((maskC&&corner)?DARK:col(st[k]));
    s+=rect(cellX(c),cellX(r),S,S,top);
  }
  // strips: B top (B2,B1,B0), F bottom (F0,F1,F2), L left (L0,L1,L2), R right (R2,R1,R0)
  const bIdx=[47,46,45],fIdx=[18,19,20],lIdx=[36,37,38],rIdx=[11,10,9];
  for(let i=0;i<3;i++){
    const edgeMid=(i===1);
    const mk=v=>(maskC&&!edgeMid)?DARK:col(v);
    const edge=mode==='pll'?'#737683':'';
    s+=rect(cellX(i),0,S,T,mk(st[bIdx[i]]),edge);
    s+=rect(cellX(i),o+3*(S+G)+G,S,T,mk(st[fIdx[i]]),edge);
    s+=rect(0,cellX(i),T,S,mk(st[lIdx[i]]),edge);
    s+=rect(o+3*(S+G)+G,cellX(i),T,S,mk(st[rIdx[i]]),edge);
  }
  const W=2*o+3*S+4*G;
  let arr='';
  if(arrows&&mode==='pll'){
    const C=i=>[cellX(i%3)+S/2, cellX(Math.floor(i/3))+S/2];
    const pairs=[];
    for(let i=0;i<9;i++){if(i===4)continue;const c=st[i];if(c!==i&&c<9)pairs.push([i,c]);}
    for(const [a,b] of pairs){
      const reciprocal=pairs.some(([p,q])=>p===b&&q===a);
      if(reciprocal&&a>b)continue;
      const [x1,y1]=C(a),[x2,y2]=C(b);
      const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy);
      const ux=dx/L,uy=dy/L,px=-uy,py=ux;
      const off=0;
      const sx=x1+ux*7+px*off, sy=y1+uy*7+py*off;
      const ex=x2-ux*9+px*off, ey=y2-uy*9+py*off;
      const edge=(a%2===1);
      const w=edge?2.6:1.4, op=edge?1:.55;
      arr+=`<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="var(--hl)" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
      const ang=Math.atan2(ey-sy,ex-sx)*180/Math.PI;
      arr+=`<polygon points="0,-3.6 6.2,0 0,3.6" transform="translate(${ex.toFixed(1)},${ey.toFixed(1)}) rotate(${ang.toFixed(1)})" fill="var(--hl)" opacity="${op}"/>`;
      if(reciprocal)arr+=`<polygon points="0,-3.6 6.2,0 0,3.6" transform="translate(${sx.toFixed(1)},${sy.toFixed(1)}) rotate(${(ang+180).toFixed(1)})" fill="var(--hl)" opacity="${op}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${W}" xmlns="http://www.w3.org/2000/svg">${s}${arr}</svg>`;
}
/* Isometric view for F2L (U,F,R faces). pair highlighted, LL grayed */
function isoSVG(st,flip,keep){
  const s=15.5,TX=49,TY=6;
  const d1=[Math.sqrt(3)/2*s,.5*s],d2=[-Math.sqrt(3)/2*s,.5*s],v=[0,s];
  const P=(a)=>a[0].toFixed(2)+','+a[1].toFixed(2);
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
  const mul=(a,k)=>[a[0]*k,a[1]*k];
  function quad(o,e1,e2,fill,hl){
    const p1=o,p2=add(o,e1),p3=add(add(o,e1),e2),p4=add(o,e2);
    return `<polygon points="${P(p1)} ${P(p2)} ${P(p3)} ${P(p4)}" fill="${fill}" stroke="${hl?'var(--hl)':'var(--dline)'}" stroke-width="${hl?1.6:1}"${hl?' stroke-linejoin="round"':''}/>`;
  }
  const colOf=c=> LLORIG.has(c)?GRAY:FC[Math.floor(c/9)];
  let base='',hls='';
  const T=[TX,TY];
  for(let k=0;k<9;k++){ // U
    const r=Math.floor(k/3),c=k%3;
    const o=add(add(T,mul(d1,c)),mul(d2,r));
    const fill=keep?(keep.has(k)?FC[Math.floor(st[k]/9)]:GRAY):colOf(st[k]);
    const q=quad(o,d1,d2,fill,!keep&&PAIR.has(st[k]));
    (!keep&&PAIR.has(st[k]))?hls+=q:base+=q;
  }
  const FO=add(T,mul(d2,3));
  for(let k=0;k<9;k++){ // F
    const r=Math.floor(k/3),c=k%3;
    const o=add(add(FO,mul(d1,c)),mul(v,r));
    const fill=keep?(keep.has(18+k)?FC[Math.floor(st[18+k]/9)]:GRAY):colOf(st[18+k]);
    const q=quad(o,d1,v,fill,!keep&&PAIR.has(st[18+k]));
    (!keep&&PAIR.has(st[18+k]))?hls+=q:base+=q;
  }
  const RO=add(add(T,mul(d1,3)),mul(d2,3));
  const md2=[-d2[0],-d2[1]];
  for(let k=0;k<9;k++){ // R
    const r=Math.floor(k/3),c=k%3;
    const o=add(add(RO,mul(md2,c)),mul(v,r));
    const fill=keep?(keep.has(9+k)?FC[Math.floor(st[9+k]/9)]:GRAY):colOf(st[9+k]);
    const q=quad(o,md2,v,fill,!keep&&PAIR.has(st[9+k]));
    (!keep&&PAIR.has(st[9+k]))?hls+=q:base+=q;
  }
  const inner=flip?`<g transform="translate(98,0) scale(-1,1)">${base}${hls}</g>`:`${base}${hls}`;
  return `<svg viewBox="0 0 98 102" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
