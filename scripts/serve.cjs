const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { siteFiles, root } = require('./package-site.cjs');
const allowed = new Set([...siteFiles(), 'vendor/cubejs-1.3.2/LICENSE']);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.md': 'text/plain' };
const csp = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Content-Security-Policy', csp + "; frame-ancestors 'self'");
  if(process.env.CFOP_E2E==='1'&&url.pathname==='/__upgrade-status.html'){response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>Upgrade status</title><body>Outside the application scope</body>');return;}
  const fixture={'/cfop/__upgrade.html':'legacy-shell.html','/cfop/__upgrade.js':'legacy-shell.js','/cfop/__old-sw.js':'legacy-sw.js'}[url.pathname];
  if(process.env.CFOP_E2E==='1'&&fixture){response.setHeader('Content-Type',fixture.endsWith('.html')?'text/html':'text/javascript');response.end(fs.readFileSync(path.join(root,'tests/fixtures',fixture)));return;}
  if(url.pathname==='/__preview.js'){
    response.setHeader('Content-Type','text/javascript; charset=utf-8');
    response.end(`const frame=document.querySelector('iframe');frame.addEventListener('load',()=>frame.contentWindow.requestAnimationFrame(()=>{const d=frame.contentDocument,w=frame.contentWindow;const small=[...d.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.closest('[aria-hidden="true"],[inert]')&&w.getComputedStyle(b).visibility!=='hidden'&&!b.matches('.chk,.n3dockhandle,.pillfab')).filter(b=>b.getBoundingClientRect().height<43.5).map(b=>b.id||b.textContent.trim());document.querySelector('#previewChecks').textContent=JSON.stringify({viewport:d.documentElement.clientWidth,scrollWidth:d.documentElement.scrollWidth,shortTouchControls:small});}));`);
    return;
  }
  if (url.pathname === '/__preview') {
    const width = Math.min(1280, Math.max(320, Number(url.searchParams.get('width')) || 390));
    const height = Math.min(1100, Math.max(320, Number(url.searchParams.get('height')) || 844));
    const page = ['home', 'basic', 'cross', 'f2l', 'oll', 'pll'].includes(url.searchParams.get('page')) ? url.searchParams.get('page') : 'home';
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html lang="en"><title>CFOP ${width} × ${height} preview</title><body><p>Responsive viewport: ${width} × ${height}</p><pre id="previewChecks"></pre><iframe title="CFOP mobile preview" src="/cfop/#${page}" width="${width}" height="${height}" style="border:1px solid #888"></iframe><script src="/__preview.js" defer></script></body></html>`);
    return;
  }
  const file = url.pathname === '/cfop/' || url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/cfop\//, '').replace(/^\//, '');
  if (!allowed.has(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.setHeader('Content-Type', (types[path.extname(file)] || 'text/plain') + (/\.(?:png|jpg)$/.test(file) ? '' : '; charset=utf-8'));
  response.end(fs.readFileSync(path.join(root, file)));
});
server.listen(Number(process.env.PORT) || 4173, '127.0.0.1', () => console.log(`CFOP preview: http://127.0.0.1:${server.address().port}/cfop/`));
