const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app, root } = require('./app-helper.cjs');
const { BUNDLE_SOURCES, BUNDLE_OUTPUT, buildBundle } = require('../scripts/build-bundle.cjs');

const solve = (t, p = 0) => ({ t, p, s: "R U R' U'", d: 1 });
function pointer(a, type) { a.doc.querySelector('#tmPad').dispatchEvent(new a.w.MouseEvent(type, { bubbles: true, button: 0 })); }
function wait(a, milliseconds) { return new Promise(resolve => a.w.setTimeout(resolve, milliseconds)); }

test('timer averages drop the best and worst solve and treat penalties like competition averages', () => {
  const a = app();
  try {
    a.w.__solves = [solve(10000), solve(12000), solve(12000, 2), solve(20000), solve(9000)];
    assert.equal(a.value('tmAverage(5,__solves)'), 12000); // 10 + 12 + (12+2) over 3; 9 and 20 are dropped
    assert.equal(a.value('tmAverage(12,__solves)'), null);
    a.w.__solves[3].p = -1;
    assert.equal(a.value('tmAverage(5,__solves)'), 12000); // one DNF is the dropped worst solve
    a.w.__solves[0].p = -1;
    assert.equal(a.value('tmAverage(5,__solves)'), Infinity);
    assert.equal(a.value('tmFormat(tmAverage(5,__solves))'), 'DNF');
    assert.equal(a.value('tmStats(__solves).best'), 9000);
    assert.equal(a.value('tmFormat(61234)'), '1:01.23');
    assert.equal(a.value('tmFormat(9999)'), '9.99');
    assert.equal(a.value('tmFormat(null)'), '—');
  } finally { a.close(); }
});

test('timer needs a held press to start, stops on the next press and stores the solve with its scramble', async () => {
  const a = app({ width: 390 });
  try {
    const pad = a.doc.querySelector('#tmPad'), scramble = a.doc.querySelector('#tmScramble').textContent;
    assert.ok(scramble.split(' ').length >= 15);
    pointer(a, 'pointerdown'); pointer(a, 'pointerup');
    assert.equal(a.value('TM.state'), 'idle', 'a short tap must not start the timer');
    pointer(a, 'pointerdown');
    assert.ok(pad.classList.contains('holding'));
    await wait(a, 340);
    assert.ok(pad.classList.contains('ready'));
    pointer(a, 'pointerup');
    assert.ok(pad.classList.contains('running'));
    a.tick(12340);
    assert.equal(a.doc.querySelector('#tmTime').textContent, '12.3');
    pointer(a, 'pointerdown'); pointer(a, 'pointerup');
    assert.equal(a.value('TM.state'), 'idle');
    const stored = JSON.parse(a.w.localStorage.getItem('cfop-timer-v1'));
    assert.equal(stored.v, 1);
    assert.deepEqual(stored.solves.map(s => [s.t, s.p, s.s]), [[12340, 0, scramble]]);
    assert.equal(a.doc.querySelectorAll('#tmList .tmrow').length, 1);
    a.doc.querySelector('#tmList [data-tm="plus2"]').click();
    assert.equal(a.doc.querySelector('#tmList .tmrow b').textContent, '14.34+');
    a.doc.querySelector('#tmList [data-tm="del"]').click();
    assert.equal(JSON.parse(a.w.localStorage.getItem('cfop-timer-v1')).solves.length, 0);
  } finally { a.close(); }
});

test('timer keeps unreadable or newer stored records instead of overwriting them', () => {
  const future = JSON.stringify({ v: 2, solves: [{ time: 1 }] });
  const a = app({ storage: { 'cfop-timer-v1': future } });
  try {
    a.w.eval('TM.state="running";TM.start=performance.now()-5000;tmStop()');
    assert.equal(a.w.localStorage.getItem('cfop-timer-v1'), future);
    assert.equal(a.doc.querySelector('#tmStatus').hidden, false);
  } finally { a.close(); }
});

test('Home highlights the action that is available now and mobile jump links reach each tool', () => {
  const a = app({ width: 390 });
  try {
    assert.equal(a.doc.querySelector('#startReview').classList.contains('pri'), false);
    assert.equal(a.doc.querySelector('#learnCFOP').classList.contains('pri'), true);
    for (const button of a.doc.querySelectorAll('[data-jump]')) {
      button.click();
      assert.equal(a.w.lastScrollTarget.id, button.dataset.jump);
      assert.ok(a.w.lastScrollTarget.matches('#pg-home h2.sec'));
    }
    assert.equal(a.doc.querySelectorAll('[data-jump]').length, 4);
  } finally { a.close(); }
  const b = app({ width: 390, storage: { 'cfop-prog': 'P1' } });
  try {
    assert.equal(b.doc.querySelector('#learnCFOP').classList.contains('pri'), false);
    assert.equal(b.doc.querySelector('#startPractice').classList.contains('pri') || b.doc.querySelector('#startReview').classList.contains('pri'), true);
  } finally { b.close(); }
});

test('the page loads one checked-in bundle that matches its sources', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map(match => match[1]);
  assert.deepEqual(scripts, ['theme-init.js', BUNDLE_OUTPUT]);
  assert.equal(fs.readFileSync(path.join(root, BUNDLE_OUTPUT), 'utf8'), buildBundle());
  for (const file of BUNDLE_SOURCES) assert.ok(fs.existsSync(path.join(root, file)), file);
});
