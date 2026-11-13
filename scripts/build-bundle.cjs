const fs=require('node:fs');
const path=require('node:path');
const {transformSync}=require('esbuild');
const root=path.join(__dirname,'..');
// Classic scripts that share one global scope. The order is the former <script> order in index.html.
const BUNDLE_SOURCES=['i18n.js','cube-engine.js','rendering.js','algorithms.js','learning-core.js','progress.js','build.js','player.js','freeplay.js','solver.js','scramble.js','app.js','timer.js','learning-ui.js','navigation.js'];
const BUNDLE_OUTPUT='app.bundle.js';
function buildBundle(){
  // Whitespace-only minification: top-level names stay global, exactly as when each file loaded separately.
  const source=BUNDLE_SOURCES.map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n;\n');
  return transformSync(source,{loader:'js',minifyWhitespace:true,charset:'utf8',legalComments:'none'}).code;
}
if(require.main===module){
  const result=buildBundle(),output=path.join(root,BUNDLE_OUTPUT);
  if(process.argv.includes('--check')){
    if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==result)throw new Error(BUNDLE_OUTPUT+' must be rebuilt: npm run build:bundle');
    console.log('Runtime sources and generated bundle match.');
  }else{fs.writeFileSync(output,result);console.log('Built '+BUNDLE_OUTPUT);}
}
module.exports={BUNDLE_SOURCES,BUNDLE_OUTPUT,buildBundle};
