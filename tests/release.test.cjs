const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { siteFiles, packageSite, root } = require('../scripts/package-site.cjs');

test('F14: all runtime scripts parse and every HTML dependency is precached at one version', () => {
  for (const file of siteFiles().filter(file => file.endsWith('.js'))) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').split("self.addEventListener('install'")[0], context);
  const core = JSON.parse(vm.runInContext('JSON.stringify(CORE)', context));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
  const stylesheet = html.match(/rel="stylesheet" href="([^"]+)"/)[1];
  for (const file of [...scripts, stylesheet, 'cube-worker.js?v=100']) {
    assert.ok(core.includes('./' + file), file);assert.equal(new URL(file, 'https://test/').searchParams.get('v'), '100');
  }
  for (const file of core) assert.ok(fs.existsSync(path.join(root, file.split('?')[0])), file);
});

test('F15: current release excludes the historical archive and includes intact notices', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cfop-release-'));
  const destination = packageSite(path.join(temporary, 'site'));
  const files = fs.readdirSync(destination);
  assert.equal(files.some(file => /\.zip$|node_modules|tests|\.git/.test(file)), false);
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'asset-sha256.json')));
  for (const [file, hash] of Object.entries(manifest)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(destination, file))).digest('hex'), hash);
  assert.equal(fs.existsSync(path.join(root, 'cfop-netlify-deploy-v24.zip')), false);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'archives/legacy/cfop-netlify-deploy-v24.zip'))).digest('hex'), 'bcf4588ae0d75569711d2939620c70fbd038eb94d8e5af2e840dc7bf0a8a444c');
  assert.throws(() => packageSite(destination), /not empty/);
});

test('F13: public frame guard denies framed rendering and permits standalone/local preview', () => {
  function visible(framed, hostname) {
    const element = () => ({ dataset: {}, style: {}, classList: { toggle() {} } });
    const document = { documentElement: element(), body: element(), getElementById: () => null };
    const window = { matchMedia: () => ({ matches: false }) };window.self = window;window.top = framed ? {} : window;
    vm.runInNewContext(fs.readFileSync(path.join(root, 'theme-init.js'), 'utf8'), { window, document, location: { hostname }, navigator: {}, localStorage: { getItem: () => null } });
    return document.documentElement.dataset.appVisible === 'true';
  }
  assert.equal(visible(true, 'fenderian075-cpu.github.io'), false);
  assert.equal(visible(false, 'fenderian075-cpu.github.io'), true);
  assert.equal(visible(true, 'localhost'), true);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /GitHub Pages does not apply `_headers`/);
});

test('F17: runtime labels distinguish training scrambles from official generation', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /公式大会用の生成器ではありません/);
  assert.doesNotMatch(html, /WCA準拠/);
  assert.ok(fs.readFileSync(path.join(root, 'vendor/cubejs-1.3.2/LICENSE'), 'utf8').includes('Petri Lehtinen'));
});
