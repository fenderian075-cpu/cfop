const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./app-helper.cjs');

function fakeWorker() {
  const instances = [];
  class Worker {
    constructor() { this.messages = []; instances.push(this); }
    postMessage(message) { this.messages.push(message); }
    terminate() { this.terminated = true; }
    receive(data) { this.onmessage({ data }); }
  }
  return { Worker, instances };
}

test('F12: Worker error completes both Home and Freeplay requests with fallbacks', () => {
  const fake = fakeWorker(), a = app({ Worker: fake.Worker });
  try {
    const responses = [];
    a.w.record = (...result) => responses.push(result);
    a.value('requestScramble((s,f)=>record("home",s,f));requestScramble((s,f)=>record("freeplay",s,f))');
    fake.instances[0].onerror();
    assert.deepEqual(responses.map(r => [r[0], r[2]]), [['home', true], ['freeplay', true]]);
    assert.equal(a.value('WCA.requests.size'), 0);
    assert.equal(fake.instances[0].terminated, true);
  } finally { a.close(); }
});

test('F12: concurrent Worker responses route to their request IDs', () => {
  const fake = fakeWorker(), a = app({ Worker: fake.Worker });
  try {
    const responses = []; a.w.record = (...result) => responses.push(result);
    a.value('requestScramble(s=>record("home",s));requestScramble(s=>record("freeplay",s))');
    const worker = fake.instances[0]; worker.receive({ ready: true });
    const requests = worker.messages.filter(m => m.type === 'scramble');
    worker.receive({ id: requests[1].id, scramble: 'R U' });
    worker.receive({ id: requests[0].id, scramble: 'F D' });
    assert.deepEqual(responses, [['freeplay', 'R U'], ['home', 'F D']]);
  } finally { a.close(); }
});

test('F12: no-response timeout resolves pending requests', async () => {
  const fake = fakeWorker(), a = app({ Worker: fake.Worker, workerDeadline: 5 });
  try {
    const responses = []; a.w.record = (...result) => responses.push(result);
    a.value('requestScramble((s,f)=>record(s,f))');
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(responses.length, 1); assert.equal(responses[0][1], true);
    assert.equal(a.value('WCA.requests.size'), 0);
  } finally { a.close(); }
});

test('F12: startup exceptions return a fallback instead of losing the request', () => {
  const a = app({ Worker: class { constructor() { throw new Error('worker unavailable'); } } });
  try {
    let fallback; a.w.record = (_, failed) => { fallback = failed; };
    a.value('requestScramble(record)'); assert.equal(fallback, true);
    assert.equal(a.value('WCA.requests.size'), 0);
  } finally { a.close(); }
});
