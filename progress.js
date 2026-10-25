/* CFOP Trainer — 分割モジュール(クラシックスクリプト・ロード順依存)。元app.jsの行順を保持 */
/* ================= progress ================= */
const prog=new Set();
const allIds=[];
const progressPending=new Map();
function saveProg(){try{localStorage.setItem('cfop-prog',[...prog].join(','));progressPending.clear();}catch(e){if(typeof learningStorageError!=='undefined')learningStorageError=true;}}
function syncProgressControl(el,id){
  const control=el.querySelector('.chk');if(!control)return;
  const done=prog.has(id);control.setAttribute('aria-pressed',String(done));
  const name=(el.querySelector('.nm')?.textContent||el.textContent||id).replace(/\s+/g,' ').trim();
  control.setAttribute('aria-label',LANG==='en'?(done?`Mark ${name} as not learned`:`Mark ${name} as learned`):(done?`${name}を未習得に戻す`:`${name}を習得済みにする`));
}
function refreshProgressControls(){
  document.querySelectorAll('[data-progress-id]').forEach(el=>{el.classList.toggle('done',prog.has(el.dataset.progressId));syncProgressControl(el,el.dataset.progressId);});
  refreshCounts();
}
function readProgress(){const latest=new Set((localStorage.getItem('cfop-prog')||'').split(',').filter(Boolean));for(const [id,checked] of progressPending)if(checked)latest.add(id);else latest.delete(id);return latest;}
function toggleId(id,el){
  const checked=!prog.has(id);
  // Apply this click's intent to the latest stored checks, including other tabs.
  try{const latest=readProgress();prog.clear();latest.forEach(value=>prog.add(value));}catch(e){}
  progressPending.set(id,checked);
  if(checked)prog.add(id);else prog.delete(id);
  refreshProgressControls();saveProg();
  if(typeof learningRefreshDashboard==='function')learningRefreshDashboard();
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


window.addEventListener('storage',event=>{if(event.key!=='cfop-prog')return;try{const latest=readProgress();prog.clear();latest.forEach(id=>prog.add(id));refreshProgressControls();if(typeof learningRefresh==='function')learningRefresh();}catch(e){}});
