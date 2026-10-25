// Pure learning model. No DOM, timers, storage, or implicit application globals.
export const SCHEMA_VERSION=1;
export const CATALOG_VERSION='cfop-2026-10-25';
export const TASKS=['recognition','recall','execution','solve'];
const DAY=86400000;
export function emptyState(){return {schemaVersion:SCHEMA_VERSION,catalogVersion:CATALOG_VERSION,attempts:[],seen:{},resume:null};}
export function validateState(value,knownIds){
  if(!value||value.schemaVersion!==SCHEMA_VERSION)throw new Error('Unsupported learning schema');
  if(!Array.isArray(value.attempts)||value.attempts.length>50000||!value.seen||typeof value.seen!=='object'||Array.isArray(value.seen))throw new Error('Invalid learning state');
  const ids=new Set();
  for(const a of value.attempts){
    if(!a||typeof a.id!=='string'||a.id.length>100||ids.has(a.id)||!knownIds.has(a.caseId)||!TASKS.includes(a.task)||!['correct','incorrect'].includes(a.result)||!['automatic','self'].includes(a.source)||typeof a.hintUsed!=='boolean'||!Number.isFinite(a.at)||a.at<0||!Number.isFinite(a.responseMs)||a.responseMs<0||a.responseMs>86400000||!Number.isInteger(a.orientation)||a.orientation<0||a.orientation>3)throw new Error('Invalid learning attempt');
    ids.add(a.id);
  }
  for(const [id,at] of Object.entries(value.seen))if(!knownIds.has(id)||!Number.isFinite(at)||at<0)throw new Error('Invalid seen case');
  if(value.resume!==null){
    const r=value.resume;
    if(!r||!['home','basic','cross','f2l','oll','pll','practice'].includes(r.page)||!Number.isFinite(r.at)||r.at<0||r.caseId&&!knownIds.has(r.caseId)||r.task&&!TASKS.includes(r.task)||r.mode&&!['learn','compare','mixed'].includes(r.mode))throw new Error('Invalid resume');
  }
  return structuredClone(value);
}
export function addAttempt(state,attempt){
  if(state.attempts.some(a=>a.id===attempt.id))return state;
  return {...state,attempts:[...state.attempts,{...attempt}].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))};
}
export function mergeStates(a,b){
  const attempts=new Map(a.attempts.map(x=>[x.id,x]));
  for(const item of b.attempts){
    const current=attempts.get(item.id);
    if(current&&JSON.stringify(current)!==JSON.stringify(item))throw new Error('Conflicting attempt ID');
    attempts.set(item.id,item);
  }
  const seen={...a.seen};for(const [id,at] of Object.entries(b.seen))seen[id]=Math.max(seen[id]||0,at);
  return {...emptyState(),attempts:[...attempts.values()].sort((x,y)=>x.at-y.at||x.id.localeCompare(y.id)),seen,resume:!a.resume||b.resume&&b.resume.at>a.resume.at?b.resume:a.resume};
}
export function caseMetrics(state,id,task){
  const list=state.attempts.filter(a=>(!id||a.caseId===id)&&a.task===task);
  let delayedSuccesses=0;
  const previous=new Map();
  for(const a of list){
    if(a.result==='correct'&&!a.hintUsed&&previous.has(a.caseId)&&a.at-previous.get(a.caseId)>=DAY)delayedSuccesses++;
    previous.set(a.caseId,a.at);
  }
  const correct=list.filter(a=>a.result==='correct'&&!a.hintUsed);
  return {attempts:list.length,correct:correct.length,hinted:list.filter(a=>a.hintUsed).length,delayedSuccesses,averageMs:correct.length?Math.round(correct.reduce((s,a)=>s+a.responseMs,0)/correct.length):null};
}
export function dueAt(state,id,task='recognition'){
  const list=state.attempts.filter(a=>a.caseId===id&&a.task===task);const last=list.at(-1);
  if(!last)return 0;
  if(last.result!=='correct')return last.at+600000;
  if(last.hintUsed)return last.at+3600000;
  // A transparent starting policy, not a scientifically established mastery threshold.
  // One day's consecutive clicks do not advance the spacing interval.
  const days=new Set();
  for(let i=list.length-1;i>=0;i--){const a=list[i];if(a.result!=='correct'||a.hintUsed)break;days.add(Math.floor(a.at/DAY));}
  return last.at+[1,3,7,14][Math.min(3,days.size-1)]*DAY;
}
export function reviewQueue(state,cases,learnedIds,now,task='recognition'){
  const learned=new Set(learnedIds);
  return cases.filter(c=>c.kind!=='solve'&&(learned.has(c.id)||state.seen[c.id]||state.attempts.some(a=>a.caseId===c.id))&&dueAt(state,c.id,task)<=now)
    .sort((a,b)=>dueAt(state,a.id,task)-dueAt(state,b.id,task)||a.id.localeCompare(b.id));
}
export function segments(tokens,patterns=[]){
  const result=[];let start=0;
  while(start<tokens.length){
    const match=patterns.find(p=>p.tokens.length&&p.tokens.every((t,i)=>tokens[start+i]===t));
    if(match){result.push({start,end:start+match.tokens.length,label:match.label});start+=match.tokens.length;}
    else{
      let end=start+1;
      while(end<tokens.length&&end-start<4&&!patterns.some(p=>p.tokens.every((t,i)=>tokens[end+i]===t)))end++;
      result.push({start,end,label:null});start=end;
    }
  }
  return result;
}
export function createCatalog({F2L,OLL,OLL2E,PLL,F2LSIMPLE,PLL2,OLLG,PLLG,CHUNKS}){
  // Existing locally curated algorithms; CubeSkills is a conceptual reference, not their provenance.
  const source='algorithms.js';
  const common={version:CATALOG_VERSION,source,prerequisites:['basic-notation'],triggers:CHUNKS.map(([ja,,tokens])=>({ja,tokens}))};
  const describe=(kind,group)=>({ja:kind==='f2l'?'白コーナーと相方のエッジを見つけ、ペアを保ったまま空きスロットへ入れる。':kind==='pll'?'上面の向きは完成。側面上段のバーとヘッドライトで交換するピースを見分ける。':kind==='olledge'?'コーナーの向きは後回しにし、黄色エッジの点・L字・一文字を見分ける。':'側面の色より、上面の黄色とコーナーの向きに注目する。',en:kind==='f2l'?'Find the white corner and its edge. Pair them, then insert without breaking the pair.':kind==='pll'?'Orientation is complete. Inspect side bars and headlights to identify the pieces to permute.':kind==='olledge'?'Ignore corners for now. Distinguish the yellow-edge dot, L and line.':'Focus on yellow stickers and corner orientation, rather than side colors.',group});
  const list=F2L.map((c,i)=>({...common,id:'F'+i,name:{ja:'F2L #'+(i+1),en:'F2L #'+(i+1)},alg:c.a,kind:'f2l',simple:F2LSIMPLE.includes(i),concept:describe('f2l',c.g),prerequisites:['basic-notation','cross']}));
  for(const [id,alg] of Object.entries(OLL)){const group=OLLG.find(([,ids])=>ids.includes(+id))?.[0]||'OLL';list.push({...common,id:'O'+id,name:{ja:'OLL '+id,en:'OLL '+id},alg,kind:'oll',simple:+id>=21&&+id<=27,concept:describe('oll',group),prerequisites:['f2l']});}
  OLL2E.forEach(([name,alg],i)=>list.push({...common,id:'OE'+(i+1),name:{ja:name,en:['Dot to cross','L to cross','Line to cross'][i]},alg,kind:'olledge',simple:true,concept:describe('olledge',name),prerequisites:['f2l']}));
  for(const [id,alg] of Object.entries(PLL)){const group=PLLG.find(([,ids])=>ids.includes(id))?.[0]||'PLL';list.push({...common,id:'P'+id,name:{ja:id+'パーム',en:id+' perm'},alg,kind:'pll',simple:PLL2.includes(id),concept:describe('pll',group),prerequisites:['oll']});}
  const details={PT:['ヘッドライトを左。隣接コーナー2個と左右エッジを交換。','Headlights on the left. Swap adjacent corners and left/right edges.'],PY:['ヘッドライトなし。対角コーナーとエッジを交換。','No headlights. Swap diagonal corners and edges.'],PUa:['角は完成。側面のエッジ3個が一方向に循環。Ubと逆向き。','Corners are solved. Three edges cycle in the opposite direction to Ub.'],PUb:['角は完成。Uaの逆向きにエッジ3個が循環。','Corners are solved. Three edges cycle in the opposite direction to Ua.'],PH:['角は完成。向かい合うエッジを2組交換。','Corners are solved. Swap two pairs of opposite edges.'],PZ:['角は完成。隣り合うエッジを2組交換。','Corners are solved. Swap two pairs of adjacent edges.']};
  for(const c of list)if(details[c.id]){c.concept.ja=details[c.id][0];c.concept.en=details[c.id][1];}
  const insertion=[
    ["F'で前のスロットを開き、U'でペアを合わせ、Fで戻す。他の完成部分を戻す動きにも注目。","Open the front slot with F', align with U', then restore with F. Notice how the completed pieces return."],
    ["Rで右のスロットを開き、Uでペアを合わせ、R'で戻す。ペアを壊さず差し込む基本形。","Open the right slot with R, align with U, then restore with R'. Insert while keeping the pair together."],
    ["Uで位置を調整してから、Rで開く → U'で合わせる → R'で戻す。","Adjust with U, then open with R, align with U', and restore with R'."],
    ["U'で位置を調整してから、F'で開く → Uで合わせる → Fで戻す。","Adjust with U', then open with F', align with U, and restore with F."],
  ];
  for(let i=0;i<4;i++){list[i].concept.ja=insertion[i][0];list[i].concept.en=insertion[i][1];}
  for(const c of list){
    const tokens=c.alg.trim().split(/\s+/);
    c.triggers=common.triggers.filter(t=>tokens.some((_,start)=>t.tokens.every((token,i)=>tokens[start+i]===token)));
    c.segments=segments(tokens,c.triggers.map(t=>({label:t.ja,tokens:t.tokens})));
  }
  // T-perm's existing Sexy trigger, F/R setup, middle sequence, and final restoration.
  list.find(c=>c.id==='PT').segments=[{start:0,end:4,label:'セクシー'},{start:4,end:7,label:"R' F R2"},{start:7,end:12,label:"U' R' U' R U"},{start:12,end:14,label:"R' F'"}];
  return list;
}
