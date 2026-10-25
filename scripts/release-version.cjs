const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');const {version}=require('../release.json');
if(!Number.isInteger(version)||version<103)throw new Error('Invalid release version');
for(const name of ['index.html','scramble.js','sw.js']){
  const file=path.join(root,name),before=fs.readFileSync(file,'utf8');
  let after=before.replace(/\bv=\d+/g,'v='+version);
  if(name==='index.html')after=after.replace(/data-app-version="\d+"/,'data-app-version="'+version+'"');
  if(name==='sw.js')after=after.replace(/CACHE_PREFIX \+ 'v\d+'/,'CACHE_PREFIX + \'v'+version+"'").replace(/\.get\('v'\) === '\d+'/g,".get('v') === '"+version+"'");
  if(process.argv.includes('--check')){if(after!==before)throw new Error('Release versions differ: '+name);}
  else fs.writeFileSync(file,after);
}
console.log('Release v'+version+' is coherent.');
