/* ================= cube engine (facelets: U0-8 R9-17 F18-26 D27-35 L36-44 B45-53) ================= */
function permFromCycles(cy){const p=Array.from({length:54},(_,i)=>i);for(const c of cy){for(let k=0;k<c.length;k++){p[c[(k+1)%c.length]]=c[k];}}return p;}
function ap(s,p){const r=new Array(54);for(let i=0;i<54;i++)r[i]=s[p[i]];return r;}
function comp(a,b){const r=new Array(54);for(let i=0;i<54;i++)r[i]=a[b[i]];return r;}
function invp(p){const r=new Array(54);for(let i=0;i<54;i++)r[p[i]]=i;return r;}
const M={};
M.U=permFromCycles([[0,2,8,6],[1,5,7,3],[18,36,45,9],[19,37,46,10],[20,38,47,11]]);
{const xc=[];for(let i=0;i<9;i++)xc.push([18+i,i,45+(8-i),27+i]);xc.push([9,11,17,15],[10,14,16,12],[36,42,44,38],[37,39,43,41]);M.x=permFromCycles(xc);}
{const yc=[[0,2,8,6],[1,5,7,3],[29,27,33,35],[28,30,34,32]];for(let i=0;i<9;i++)yc.push([18+i,36+i,45+i,9+i]);M.y=permFromCycles(yc);}
function sq(...ns){let p=Array.from({length:54},(_,i)=>i);for(const n of ns)p=comp(p,M[n]);return p;}
M["U'"]=invp(M.U);M["x'"]=invp(M.x);M["y'"]=invp(M.y);
M.U2=sq('U','U');M.x2=sq('x','x');M.y2=sq('y','y');
M.z=sq('x','y',"x'");M["z'"]=invp(M.z);M.z2=sq('z','z');
M.D=sq('x2','U','x2');M.F=sq('x','U',"x'");M.B=sq("x'",'U','x');M.R=sq("z'",'U','z');M.L=sq('z','U',"z'");
for(const f of['D','F','B','R','L']){M[f+"'"]=invp(M[f]);M[f+"2"]=sq(f,f);}
M["M'"]=sq("R'",'x','L');M.M=invp(M["M'"]);M.M2=sq('M','M');
M["E'"]=sq("U'",'y','D');M.E=invp(M["E'"]);M.E2=sq('E','E');
M.S=sq("F'",'z','B');M["S'"]=invp(M.S);M.S2=sq('S','S');
M.r=sq('R',"M'");M.l=sq('L','M');M.u=sq('U',"E'");M.f=sq('F','S');M.b=sq('B',"S'");M.d=sq('D','E');
for(const w of['r','l','u','f','b','d']){M[w+"'"]=invp(M[w]);M[w+"2"]=sq(w,w);}
const SOLVED=Array.from({length:54},(_,i)=>i);
function toks(a){return a.replace(/[()]/g,' ').trim().split(/\s+/).filter(Boolean);}
function run(s,a){let r=s.slice();for(const t of toks(a)){r=ap(r,M[t]);}return r;}
function inv(a){return toks(a).reverse().map(t=>t.endsWith('2')?t:(t.endsWith("'")?t.slice(0,-1):t+"'")).join(' ');}
function caseState(alg){return run(SOLVED,inv(alg));}
function hm(alg){return toks(alg).filter(t=>!/^[xyz]/.test(t)).length;}
const ORDER_CACHE=new Map();
function algOrder(alg){
  if(ORDER_CACHE.has(alg))return ORDER_CACHE.get(alg);
  let p=Array.from({length:54},(_,i)=>i);
  for(const t of toks(alg)){if(M[t])p=comp(p,M[t]);}
  const seen=new Set();let order=1;
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  for(let i=0;i<54;i++)if(!seen.has(i)){
    let j=i,n=0;do{seen.add(j);j=p[j];n++;}while(j!==i);
    order=order/gcd(order,n)*n;
  }
  ORDER_CACHE.set(alg,order);return order;
}
function cycleText(alg){const n=algOrder(alg);return n?`↻ 同じ手順×${n}で元通り`:'↻ 元に戻る回数は長周期';}
