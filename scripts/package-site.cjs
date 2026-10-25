const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
function siteFiles() {
  return fs.readdirSync(root).filter(name => /\.(?:js|css|html|webmanifest|png|jpg)$/.test(name) || ['_headers', 'THIRD_PARTY_NOTICES.md'].includes(name)).sort();
}
function packageSite(destination = path.join(root, 'dist/site')) {
  // Release packages contain explicit runtime files, never a copy of the repository.
  if (fs.existsSync(destination) && fs.readdirSync(destination).length) throw new Error('Release destination is not empty; choose a new destination to preserve existing artifacts.');
  fs.mkdirSync(destination, { recursive: true });
  const files = siteFiles();
  const manifest = {};
  for (const file of files) {
    const data = fs.readFileSync(path.join(root, file));
    fs.writeFileSync(path.join(destination, file), data);
    manifest[file] = crypto.createHash('sha256').update(data).digest('hex');
  }
  const license = 'vendor/cubejs-1.3.2/LICENSE';
  fs.mkdirSync(path.join(destination, path.dirname(license)), { recursive: true });
  fs.copyFileSync(path.join(root, license), path.join(destination, license));
  manifest[license] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, license))).digest('hex');
  fs.writeFileSync(path.join(destination, 'asset-sha256.json'), JSON.stringify(manifest, null, 2) + '\n');
  return destination;
}
if (require.main === module) console.log(packageSite());
module.exports = { siteFiles, packageSite, root };
