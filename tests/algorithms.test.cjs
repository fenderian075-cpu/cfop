const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const Cube = require('../vendor/cubejs-1.3.2');
const root = path.join(__dirname, '..');
function engine() {
  const context = vm.createContext({ Cube, LANG: 'ja' });
  for (const file of ['cube-engine.js', 'algorithms.js', 'solver.js']) {
    let source = fs.readFileSync(path.join(root, file), 'utf8');
    if (file === 'solver.js') source = source.split('function fpInit()')[0];
    vm.runInContext(source, context);
  }
  vm.runInContext('svInit()', context);
  return expression => vm.runInContext(expression, context);
}
test('all 54 move permutations agree with the pinned independent cubejs model', () => {
  const run = engine();
  assert.equal(run(`Object.keys(M).filter(token => new Cube().move(token).asString() !== ap(SOLVED,M[token]).map(i=>'URFDLB'[Math.floor(i/9)]).join('')).length`), 0);
});
test('OLL and PLL preserve completed stages; all 41 F2L cases preserve other slots', () => {
  const run = engine();
  assert.equal(run(`Object.values(OLL).every(a=>caseState(a).every((v,p)=>LLIDS.has(p)||v===p))`), true);
  assert.equal(run(`Object.values(PLL).every(a=>{const s=caseState(a);return s.every((v,p)=>LLIDS.has(p)||v===p)&&s.slice(0,9).every(v=>v<9)})`), true);
  assert.equal(run(`F2L.every(c=>caseState(c.a).every((v,p)=>LLIDS.has(p)||[29,26,15,23,12].includes(p)||v===p))`), true);
});
test('all 216 OLL orientations, 288 PLL states and 150 F2L pair patterns solve', () => {
  const run = engine();
  const result = JSON.parse(run(`JSON.stringify((()=>{
    const oll=new Map(),pll=new Map(),f2l=new Map();
    for(const a of Object.values(OLL))for(let k=0;k<4;k++){let st=caseState(a);for(let n=0;n<k;n++)st=ap(st,M.U);oll.set(svSigOri(st),st)}oll.set(svSigOri(SOLVED),SOLVED);
    for(const a of ['',...Object.values(PLL)])for(let k=0;k<4;k++)for(let j=0;j<4;j++){let st=a?caseState(a):SOLVED;for(let n=0;n<k;n++)st=ap(st,M.U);st=svFrame(st,j);pll.set(st.join(','),st)}
    for(const c of F2L)for(let k=0;k<4;k++){let st=caseState(c.a);for(let n=0;n<k;n++)st=ap(st,M.U);f2l.set(svSigPair(st),st)}f2l.set(svSigPair(SOLVED),SOLVED);
    return {counts:[oll.size,pll.size,f2l.size],ok:[...oll.values()].every(st=>[true,false].every(simple=>!!svOLL(st,simple)))&&[...pll.values()].every(st=>[true,false].every(simple=>!!svPLL(st,simple)))&&[...f2l.values()].every(st=>!!svF2L(st))};
  })())`));
  assert.deepEqual(result.counts, [216, 288, 150]); assert.equal(result.ok, true);
});
test('40 deterministic scrambles solve in both Simple and Advanced modes', () => {
  const run = engine();
  assert.equal(run(`(()=>{let seed=123456789;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};for(let i=0;i<40;i++){
    const a=Array.from({length:20},()=>['U','D','R','L','F','B'][Math.floor(rnd()*6)]+['',"'",'2'][Math.floor(rnd()*3)]).join(' ');
    for(const simple of [true,false]){let cur=run(SOLVED,a);for(const solve of [svCross,svF2L,s=>svOLL(s,simple),s=>svPLL(s,simple)]){const r=solve(cur);if(!r)return false;cur=r.st;}if(!cur.every((v,i)=>v===i))return false;}}
    return true;})()`), true);
});
