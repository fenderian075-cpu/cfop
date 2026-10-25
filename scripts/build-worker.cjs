const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');
const root = path.join(__dirname, '..');
const provenance = JSON.parse(fs.readFileSync(path.join(root, 'vendor/cubejs-1.3.2/provenance.json')));
for (const [file, expected] of Object.entries(provenance.files)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor/cubejs-1.3.2', file))).digest('hex');
  if (actual !== expected) throw new Error(`Vendored source changed: ${file}`);
}
const result = esbuild.buildSync({
  absWorkingDir: root, entryPoints: ['scripts/worker-entry.cjs'], bundle: true, minify: true,
  platform: 'browser', format: 'iife', target: 'es2020', write: false,
  banner: { js: '/* cubejs 1.3.2, MIT. Copyright Petri Lehtinen and Ludovic Fernandez. See vendor/cubejs-1.3.2/LICENSE. Generated: npm run build:worker */' },
});
const output = Buffer.from(result.outputFiles[0].contents);
const target = path.join(root, 'cube-worker.js');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(output)) throw new Error('cube-worker.js is stale; run npm run build:worker');
  console.log('Worker source, provenance and generated output match.');
} else {
  fs.writeFileSync(target, output);
  console.log(`Generated cube-worker.js (${output.length} bytes).`);
}
