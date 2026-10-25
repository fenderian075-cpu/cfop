const fs=require('node:fs');
const path=require('node:path');
const {buildSync}=require('esbuild');
const root=path.join(__dirname,'..');
const result=buildSync({entryPoints:[path.join(root,'lib/learning-entry.mjs')],bundle:true,write:false,format:'iife',globalName:'CFOPLearning',target:['safari16.4','chrome110'],charset:'utf8',legalComments:'none'}).outputFiles[0].text;
const output=path.join(root,'learning-core.js');
if(process.argv.includes('--check')){
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==result)throw new Error('learning-core.js must be rebuilt');
  console.log('Learning modules and generated runtime match.');
}else{fs.writeFileSync(output,result);console.log('Built learning-core.js');}
