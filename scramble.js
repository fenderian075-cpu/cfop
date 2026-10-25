/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= scramble editor ================= */
function netStateSVG(state){
  return cubeNetSVG(state,{interactive:true});
}
function movedCells(moveKey){
  const p=M[moveKey],on=new Set();
  if(!p)return on;
  for(let i=0;i<54;i++)if(p[i]!==i)on.add(i);
  for(let f=0;f<6;f++){
    let full=true;
    for(let k=0;k<9;k++){if(k===4)continue;if(p[f*9+k]===f*9+k){full=false;break;}}
    if(full)on.add(f*9+4);
  }
  return on;
}

/* Training random-state scrambles, using the pinned cubejs worker. */
const WCA={worker:null,ready:false,failed:false,requests:new Map(),nextId:0,initTimer:null};
function wcaResolve(id,scramble,fallback=false){
  const request=WCA.requests.get(id);if(!request)return;
  WCA.requests.delete(id);clearTimeout(request.timer);
  request.callback(scramble,fallback);
}
function wcaFail(){
  WCA.failed=true;WCA.ready=false;clearTimeout(WCA.initTimer);
  WCA.worker?.terminate();WCA.worker=null;
  for(const id of [...WCA.requests.keys()])wcaResolve(id,scrRandom(),true);
  scrBtnLabel();
}
function wcaSend(id,request){
  if(!WCA.ready||request.sent)return;
  request.sent=true;
  try{WCA.worker.postMessage({type:'scramble',id});}catch(_){wcaFail();}
}
function wcaInit(){
  if(WCA.worker||WCA.failed)return;
  try{
    if(typeof Worker==='undefined')throw new Error('Worker unavailable');
    const worker=new Worker('cube-worker.js?v=104');WCA.worker=worker;
    WCA.initTimer=setTimeout(wcaFail,15000);
    worker.onerror=worker.onmessageerror=()=>{if(WCA.worker===worker)wcaFail();};
    worker.onmessage=e=>{
      if(WCA.worker!==worker)return;
      if(e.data.error){wcaFail();return;}
      if(e.data.ready){
        WCA.ready=true;clearTimeout(WCA.initTimer);scrBtnLabel();
        for(const [id,request] of WCA.requests)wcaSend(id,request);
      }else if(typeof e.data.scramble==='string'){
        const parsed=parseAlg(e.data.scramble);
        if(parsed.invalid.length||!parsed.valid.length){wcaFail();return;}
        wcaResolve(e.data.id,parsed.valid.join(' '));
      }
    };
    worker.postMessage({type:'init'});
  }catch(_){wcaFail();}
}
function requestScramble(callback){
  const id=++WCA.nextId;
  WCA.requests.set(id,{callback,sent:false,timer:setTimeout(wcaFail,15000)});
  if(WCA.failed){wcaResolve(id,scrRandom(),true);return id;}
  wcaInit();
  const request=WCA.requests.get(id);if(request)wcaSend(id,request);
  return id;
}
function scrBtnLabel(){
  for(const b of [$('#scrrand'),$('#fpScramble')])if(b)b.textContent=WCA.failed?tj('ランダムムーブ生成','Random-move scramble'):tj('スクランブル生成','Random-state scramble');
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
  const {valid:good,invalid:bad}=parseAlg(raw);
  $('#scrplay').disabled=bad.length>0||!good.length;
  $('#scrinput').setAttribute('aria-invalid',String(bad.length>0));
  $('#scrnet').hidden=bad.length>0;
  let st=SOLVED.slice();
  if(!bad.length)for(const t of good)st=ap(st,M[t]);
  $('#scrnet').innerHTML=netStateSVG(st);
  // 直前の1手で動いたセルだけ残像ハイライト(前回より手数が増えた時のみ)
  if(good.length>(scrUpdate._n||0)&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    const aff=movedCells(good[good.length-1]);
    document.querySelectorAll('#scrnet .net-cell').forEach(el=>{
      if(aff.has(+el.dataset.p))el.classList.add('net-ghost');
    });
  }
  scrUpdate._n=good.length;
  $('#scrmeta').innerHTML=`${good.length}手`+(bad.length?` <span class="bad">/ 認識できない記号: ${bad.map(x=>x.replace(/[<>&]/g,'')).join(' ')}</span>`:'');
  return bad.length?'':good.join(' ');
}
function scrInit(){
  if(scrInit._done)return;scrInit._done=true;
  $('#scrinput').addEventListener('input',scrUpdate);
  $('#scrrand').addEventListener('click',()=>{
    const button=$('#scrrand');button.disabled=true;
    requestScramble((alg,fallback)=>{
      button.disabled=false;$('#scrinput').value=alg;scrUpdate();
      if(fallback)showToast(tj('代替のランダムムーブを生成しました','Generated a fallback random-move scramble'));
    });
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

