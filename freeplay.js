/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
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

