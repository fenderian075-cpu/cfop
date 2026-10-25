const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function worker({ fetch = async () => ({ status: 503, ok: false }), cacheMatch = async () => ({ status: 200 }), cachePut = async () => {}, cacheAddAll = async () => {}, timers = {} } = {}) {
  const handlers = {}, deleted = [];
  const context = vm.createContext({
    URL, Request, AbortController, setTimeout, clearTimeout, ...timers,
    self: { location: { origin: 'https://example.test' }, registration: { scope: 'https://example.test/cfop/' }, addEventListener: (type, fn) => { handlers[type] = fn; } },
    caches: { keys: async () => ['other-app', 'cfop-runtime-v94', 'cfop-runtime-v101'], delete: async key => { deleted.push(key); }, open: async () => ({ match: cacheMatch, put: cachePut, addAll: cacheAddAll }) },
    fetch, request: { url: 'https://example.test/cfop/', mode: 'navigate' },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8'), context);
  return { handlers, deleted, run: expression => vm.runInContext(expression, context) };
}

test('F09: activation only removes obsolete CFOP caches', async () => {
  const w = worker(); let pending;
  w.handlers.activate({ waitUntil: promise => { pending = promise; } }); await pending;
  assert.deepEqual(w.deleted, ['cfop-runtime-v94']);
});
test('F10: HTTP errors return the existing successful shell', async () => {
  const w = worker(); assert.equal((await w.run('networkFirst(request)')).status, 200);
});
test('F10: network failure returns the cached shell', async () => {
  const w = worker({ fetch: async () => { throw new Error('offline'); } });
  assert.equal((await w.run('networkFirst(request)')).status, 200);
});
test('F10: a hung request reaches its deadline and returns cached content', async () => {
  const w = worker({ fetch: () => new Promise(() => {}), timers: { setTimeout: fn => setTimeout(fn, 1) } });
  assert.equal((await w.run('networkFirst(request)')).status, 200);
});
test('cache quota failure does not replace a successful network response', async () => {
  const response = { ok: true, status: 200, type: 'basic', clone() { return this; } };
  const w = worker({ fetch: async () => response, cacheMatch: async () => ({ status: 201 }), cachePut: async () => { throw new Error('quota'); } });
  assert.equal(await w.run('networkFirst(request)'), response);
});
test('versioned assets use the installed cache without going online', async () => {
  let fetched = false;
  const w = worker({ fetch: async () => { fetched = true; throw new Error('unexpected network'); } });
  assert.equal((await w.run('respond({url:"https://example.test/cfop/player.js?v=101",mode:"cors"})')).status, 200);
  assert.equal(fetched, false);
});

test('installed shell bypasses stale browser HTTP cache during precaching', async()=>{
  const requests=[];const w=worker({cacheAddAll:async items=>requests.push(...items)});let pending;
  w.handlers.install({waitUntil:promise=>{pending=promise;}});await pending;
  assert.ok(requests.length>0);
  assert.ok(requests.every(request=>request instanceof Request&&request.cache==='reload'));
});

test('online navigation revalidates the browser HTTP cache',async()=>{
  let options;const response={ok:true,type:'basic',status:200,clone(){return this;}};
  const w=worker({fetch:async(_request,value)=>{options=value;return response;}});
  await w.run('networkFirst(request)');
  assert.equal(options.cache,'no-cache');
  assert.equal(await w.run('networkFirst(request,Promise.resolve({ok:true,status:200,stalePreload:true}))'),response);
});
