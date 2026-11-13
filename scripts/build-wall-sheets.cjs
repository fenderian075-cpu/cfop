// Builds the printable A4 wall sheets (print/*.pdf) from the site's own diagrams and algorithm data.
// Usage: npm run build:print   (needs the Inter and DejaVu Sans Mono fonts; set PW_EXE to use a specific Chromium)
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {app}=require('../tests/app-helper.cjs');
const root=path.join(__dirname,'..'),outDir=path.join(root,'print');

const SIDES=[[47,46,45],[18,19,20],[36,37,38],[11,10,9]]; // side stickers of the last layer: back, front, left, right
// Plain goal pictures for the two-look sections: no cube, no stickers that do not matter for that look.
function flatGoals(FC){
  const S=26,G=2,GRAY='var(--dOff)';
  const rect=(x,y,w,h,fill,stroke)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="${fill}" stroke="${stroke||'var(--dline)'}" stroke-width="${stroke?1.3:1}"/>`;
  const wrap=(w,body)=>`<svg viewBox="-2 -2 ${w+4} ${w+4}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  // OLL looks only concern the top face: the yellow cross, then all nine yellow.
  const top=yellow=>{let o='';for(let k=0;k<9;k++)o+=rect((k%3)*(S+G),Math.floor(k/3)*(S+G),S,S,yellow.has(k)?FC[0]:GRAY);return wrap(3*S+2*G,o);};
  // PLL looks only concern the side colours: the top is already finished (and drawn grey, as on the case cards).
  // Corners done: only the outer two stickers of each side row match; everything done: all three.
  const side=cornersOnly=>{
    const T=12,o=T+G,X=i=>o+G+i*(S+G),W=2*o+3*S+4*G,far=o+3*(S+G)+G,edge='#737683';
    let out='';
    for(let k=0;k<9;k++)out+=rect(X(k%3),X(Math.floor(k/3)),S,S,GRAY);
    // back (green), front (blue), left (orange), right (red) as on the PLL case cards
    const rows=[[FC[5],i=>[X(i),0,S,T]],[FC[2],i=>[X(i),far,S,T]],[FC[4],i=>[0,X(i),T,S]],[FC[1],i=>[far,X(i),T,S]]];
    for(const [colour,box] of rows)for(let i=0;i<3;i++)out+=rect(...box(i),cornersOnly&&i===1?GRAY:colour,edge);
    return wrap(W,out);
  };
  return {flatOllEdges:top(new Set([1,3,4,5,7])),flatOll:top(new Set([0,1,2,3,4,5,6,7,8])),flatPllCorners:side(true),flatPll:side(false)};
}
// Edge-orientation (3-1) case figure: only the top face matters, so no side stickers. Corners are muted because they are ignored.
function topCaseFigure(FC,state){
  const S=26,G=2,corners=[0,2,6,8];
  let o='';
  for(let k=0;k<9;k++){
    const yellow=k===4||(!corners.includes(k)&&state[k]<9);
    const fill=corners.includes(k)?'var(--dMask)':yellow?FC[0]:'var(--ollOff)';
    o+=`<rect x="${(k%3)*(S+G)}" y="${Math.floor(k/3)*(S+G)}" width="${S}" height="${S}" rx="1.6" fill="${fill}" stroke="var(--dline)" stroke-width="1"/>`;
  }
  const W=3*S+2*G;
  return `<svg viewBox="-2 -2 ${W+4} ${W+4}" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
}
function load(mode){
  const a=app({mode,language:'en'}),v=x=>a.value(x),cases={};
  for(const pg of ['cross','f2l','oll','pll']){
    let sec='';cases[pg]=[];
    for(const el of a.doc.querySelectorAll(`#pg-${pg} h2.sec, #pg-${pg} .acard`)){
      if(el.matches('h2')){const c=el.cloneNode(true);c.querySelectorAll('.hint,.cnt').forEach(x=>x.remove());sec=c.textContent.trim().replace(/\(\d+\)$/,'').trim();continue;}
      cases[pg].push({sec,name:el.querySelector('.nm').childNodes[0].textContent.trim(),alg:el.querySelector('.alg').innerHTML,svg:el.querySelector('svg').outerHTML});
    }
  }
  const FC=v('FC'),all=JSON.stringify([...Array(54).keys()]);
  const colour=(state,i)=>Math.floor(state[i]/9);
  const pllState=name=>v(`caseState(PLL[${JSON.stringify(name)}])`);
  // Headlights check: only the side stickers of the four corners are coloured; a matching pair is ringed.
  function headlightIcon(state,badge){
    const S=26,G=2,T=12,o=T+G,X=i=>o+G+i*(S+G),W=2*o+3*S+4*G,far=o+3*(S+G)+G,c=W/2;
    const gray='var(--dOff)',r=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="${f}" stroke="var(--dline)" stroke-width="1"/>`;
    let out='',ring='';
    for(let k=0;k<9;k++)out+=r(X(k%3),X(Math.floor(k/3)),S,S,gray);
    const boxes=[i=>[X(i),0,S,T],i=>[X(i),far,S,T],i=>[0,X(i),T,S],i=>[far,X(i),T,S]];
    SIDES.forEach((idx,n)=>{
      const box=boxes[n];
      for(let i=0;i<3;i++)out+=r(...box(i),i===1?gray:FC[colour(state,idx[i])]);
      if(colour(state,idx[0])===colour(state,idx[2])){
        const p=box(0),q=box(2),x=Math.min(p[0],q[0])-3,y=Math.min(p[1],q[1])-3,w=Math.max(p[0]+p[2],q[0]+q[2])-x+3,h=Math.max(p[1]+p[3],q[1]+q[3])-y+3;
        ring+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="none" stroke="#0b0f19" stroke-width="3"/>`;
      }
    });
    const text=(t,size)=>`<text x="${c}" y="${c+8.5}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="${size}" fill="#fff">${t}</text>`;
    const mark=badge==='yes'?`<circle cx="${c}" cy="${c}" r="19" fill="#0e7a34"/><path d="M${c-10} ${c+1} l7 7 l13 -15" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`
      :badge==='no'?`<circle cx="${c}" cy="${c}" r="19" fill="#c62828"/><path d="M${c-8} ${c-8} l16 16 M${c+8} ${c-8} l-16 16" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>`
      :`<circle cx="${c}" cy="${c}" r="20" fill="#0e7a34"/>${text('×'+badge,23)}`;
    return `<svg viewBox="-5 -5 ${W+10} ${W+10}" xmlns="http://www.w3.org/2000/svg">${out}${ring}${mark}</svg>`;
  }
  const data={cases,pllState,headlightIcon,
    headlights:state=>SIDES.filter(s=>colour(state,s[0])===colour(state,s[2])).length,
    // goal pictures: only the part that is solved after the step is coloured
    goalCross:v(`isoSVG(run(SOLVED,'z2'),false,new Set([1,3,4,5,7,19,22,10,13]))`),
    goalF2L:v(`isoSVG(SOLVED,false,new Set([21,22,23,24,25,26,12,13,14,15,16,17]))`),
    goalOllEdges:v(`llSVG(SOLVED,'oll',true)`),goalOll:v(`llSVG(SOLVED,'oll')`),
    goalPll:v(`isoSVG(SOLVED,false,new Set(${all}))`),
    ...flatGoals(FC),
    edgeFigures:v('OLL2E.map(([name,alg])=>caseState(alg))').map(state=>topCaseFigure(FC,state))};
  a.close();
  return data;
}
// Trigger names are dropped; the coloured brackets stay.
const alg=h=>h.replace(/<rt>[^<]*<\/rt>/g,'')
  // A bracketed group stays on one line unless it is too long for any card column (more than 12 characters of moves).
  .replace(/<ruby class="ck (ck-\w+)">([^<]*)<\/ruby>/g,(_,cls,text)=>`<span class="trg ${cls}${text.length>13?' longchip':''}">${text}</span>`);
const card=(c,label,cls='')=>`<div class="case ${cls}"><div class="fig">${c.svg}</div><div class="txt">${label?`<div class="no">${label}</div>`:''}<div class="alg">${alg(c.alg)}</div></div></div>`;
const goal=(...pics)=>`<span class="goal">${pics.map(p=>`<i class="to"></i>${p}`).join('')}</span>`;
const step=(n,name,g,more='')=>`<header class="step"><span class="num">${n}</span><h1>${name}</h1>${more?`<span class="range">${more}</span>`:''}${g}</header>`;
const short=c=>c.name.replace(' perm','');

function simpleSheets(){
  // One page. OLL and PLL are two looks each: a rule with an arrow ends in that look's goal picture.
  const d=load('s'),{cross,f2l,oll,pll}=d.cases;
  const title='<div class="title"><b>Simple CFOP</b><span>beginner set · 2-look OLL &amp; PLL</span></div>';
  const look=(label,pic,question='')=>`<span class="pill">${label}</span>${question?`<span class="q">${question}</span>`:''}<i class="rule"></i><span class="gp">${pic}</span>`;
  const subhead=(label,pic,question='')=>`<div class="subhead">${look(label,pic,question)}</div>`;
  // The first look shares the row with the step title; the second look gets its own row.
  const stepWithLook=(n,name,label,pic,question='')=>`<header class="step"><span class="num">${n}</span><h1>${name}</h1>${look(label,pic,question)}</header>`;
  const branch=(icon,c)=>`<div class="half"><div class="cond">${icon}</div><i class="to"></i>${card(c,short(c))}</div>`;
  return `<section class="sheet s1">${title}
  ${step(1,'Cross',goal(d.goalCross))}
  <div class="grid g4">${cross.map(c=>card(c,'')).join('')}</div>
  ${step(2,'F2L',goal(d.goalF2L))}
  <div class="grid g4">${f2l.map(c=>card(c,c.name.replace('F2L ',''))).join('')}</div>
  ${stepWithLook(3,'OLL','3-1',d.flatOllEdges)}
  <div class="grid g3">${oll.slice(0,3).map((c,i)=>card({...c,svg:d.edgeFigures[i]},'')).join('')}</div>
  ${subhead('3-2',d.flatOll)}
  <div class="grid g4">${oll.slice(3).map(c=>card(c,c.name.replace('OLL ','#'))).join('')}</div>
  ${stepWithLook(4,'PLL','4-1',d.flatPllCorners,'Headlights?')}
  <div class="grid g2 br">${branch(d.headlightIcon(d.pllState('T'),'yes'),pll[0])}${branch(d.headlightIcon(d.pllState('Y'),'no'),pll[1])}</div>
  ${subhead('4-2',d.flatPll)}
  <div class="grid g4">${pll.slice(2).map(c=>card(c,short(c))).join('')}</div>
</section>`;
}

function fullSheets(){
  const d=load('a'),{cross,f2l,oll,pll}=d.cases,PAGES=6;
  const title=n=>`<div class="title"><b>Full CFOP</b><span>${f2l.length} F2L · ${oll.length} OLL · ${pll.length} PLL</span><i>${n} / ${PAGES}</i></div>`;
  const fl=c=>c.name.replace('F2L ','');
  function groups(list){
    const out=[];let cur=null;
    for(const c of list){if(!cur||cur.sec!==c.sec){cur={sec:c.sec,items:[]};out.push(cur);}cur.items.push(c);}
    return out.map(g=>`<div class="grp">${g.sec}</div><div class="grid ${g.items.length===4?'four':'three'}">${g.items.map(c=>card(c,fl(c))).join('')}</div>`).join('');
  }
  const num=c=>Number(c.name.replace('OLL ',''));
  const ollSorted=[...oll].sort((x,y)=>num(x)-num(y));
  const ol=c=>`${c.name.replace('OLL ','#')}<em>${c.sec.replace(/ shapes?$/,'').replace(' (corners only)','')}</em>`;
  const ollPage=(n,list)=>`<section class="sheet full o">${title(n)}
  ${step(3,'OLL',goal(d.goalOll),`#${num(list[0])} – #${num(list[list.length-1])}`)}
  <div class="grid two fill">${list.map(c=>card(c,ol(c))).join('')}</div>
</section>`;
  // PLL branches by how many sides show headlights, computed from each case's state.
  const byCount={4:[],1:[],0:[]};
  for(const c of pll){const n=d.headlights(d.pllState(short(c)));if(!byCount[n])throw new Error(`Unexpected headlight count ${n} for ${c.name}`);byCount[n].push(c);}
  const block=(n,rep)=>`<div class="cond">${d.headlightIcon(d.pllState(rep),n?String(n):'no')}</div><i class="to"></i><div class="grid two">${byCount[n].map(c=>card(c,short(c))).join('')}</div>`;
  const per=Math.ceil(ollSorted.length/3);
  return `<section class="sheet full f1">${title(1)}
  ${step(1,'Cross',goal(d.goalCross))}
  <div class="grid cross">${cross.map(c=>card(c,'','v')).join('')}</div>
  ${step(2,'F2L',goal(d.goalF2L),'#1 – #24')}
  ${groups(f2l.slice(0,24))}
</section>
<section class="sheet full f2">${title(2)}
  ${step(2,'F2L',goal(d.goalF2L),`#25 – #${f2l.length}`)}
  ${groups(f2l.slice(24))}
</section>
${[0,1,2].map(i=>ollPage(3+i,ollSorted.slice(i*per,(i+1)*per))).join('\n')}
<section class="sheet full p">${title(6)}
  ${step(4,'PLL',goal(d.goalPll))}
  <div class="branch"><div class="q">Headlights?</div>${block(4,'Ua')}${block(1,'T')}${block(0,'Y')}</div>
</section>`;
}

async function render(browser,name,body){
  const css=fs.readFileSync(path.join(__dirname,'wall-sheets.css'),'utf8');
  const html=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cfop-print-')),name+'.html');
  fs.writeFileSync(html,`<!doctype html><html lang="en"><meta charset="utf-8"><title>${name}</title><style>${css}</style><body>${body}</body></html>`);
  const page=await browser.newPage({viewport:{width:794,height:1123}});
  await page.goto('file://'+html);await page.evaluate(()=>document.fonts.ready);
  // Fail instead of printing a sheet whose content is cut off or leaves its card.
  const problems=await page.evaluate(()=>{
    const out=[];
    document.querySelectorAll('.sheet').forEach((sheet,i)=>{
      const limit=sheet.getBoundingClientRect().bottom-19; // keep about 5 mm clear at the bottom edge
      const bottom=Math.max(...[...sheet.querySelectorAll('.case,.cond,.subgoal')].map(e=>e.getBoundingClientRect().bottom));
      if(bottom>limit)out.push(`page ${i+1} overflows by ${Math.round(bottom-limit)}px`);
    });
    document.querySelectorAll('.case').forEach(c=>{
      const r=c.getBoundingClientRect();
      if([...c.querySelectorAll('.trg,.alg,.fig')].some(e=>{const q=e.getBoundingClientRect();return q.right>r.right-2||q.bottom>r.bottom-1;}))out.push('card overflows: '+c.textContent.slice(0,40));
    });
    return out;
  });
  if(problems.length){
    // PRINT_KEEP_GOING=1 prints the problems and still writes the files, to look at a layout while tuning it.
    if(!process.env.PRINT_KEEP_GOING)throw new Error(name+': '+problems.join('; '));
    console.warn(name+': '+problems.join('; '));
  }
  fs.mkdirSync(outDir,{recursive:true});
  await page.pdf({path:path.join(outDir,name+'.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
  const pages=await page.locator('.sheet').count();
  if(process.env.PRINT_PREVIEW)for(let i=0;i<pages;i++)await page.locator('.sheet').nth(i).screenshot({path:path.join(process.env.PRINT_PREVIEW,`${name}-${i+1}.png`)});
  await page.close();
  console.log(`print/${name}.pdf (${pages} pages)`);
}
(async()=>{
  const {chromium}=require('playwright');
  const browser=await chromium.launch(process.env.PW_EXE?{executablePath:process.env.PW_EXE}:{});
  try{
    await render(browser,'cfop-simple-a4',simpleSheets());
    await render(browser,'cfop-full-a4',fullSheets());
  }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exit(1);});
