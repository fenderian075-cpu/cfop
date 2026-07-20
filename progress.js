/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
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

