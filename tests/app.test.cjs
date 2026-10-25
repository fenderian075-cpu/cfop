const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./app-helper.cjs');

test('F02: resetting a turning player cancels the old animation', () => {
  const a = app();
  try {
    a.value('n3loadAlg(PLL.T,"T",false,false,"case","pll"); n3start(); n3pause(); n3setStep(0)');
    a.tick();
    assert.equal(a.value('N3.step'), 0);
    assert.equal(a.value('JSON.stringify(N3.state)===JSON.stringify(N3.start)'), true);
  } finally { a.close(); }
});

test('F03: OLL edge learning updates the active total', () => {
  const a = app();
  try {
    const before = a.doc.querySelector('#hcount b').textContent;
    a.doc.querySelector('[data-progress-id="OE1"] .chk').click();
    assert.equal(a.doc.querySelector('#hcount b').textContent, String(+before + 1));
    assert.equal(a.value('allIds.filter(id=>/^XA/.test(id)).length'), 0);
  } finally { a.close(); }
});

test('F04: translated PLL guide scrolls to a live section', () => {
  const a = app({ language: 'en' });
  try {
    a.doc.querySelector('#pllList .pfrow').click(); a.tick();
    assert.ok(a.w.lastScrollTarget?.isConnected);
    assert.ok(a.w.lastScrollTarget.closest('#pllList'));
  } finally { a.close(); }
});

test('F05: mirror rebuild retains functioning section navigation', () => {
  const a = app();
  try {
    a.value('goCore("f2l")');
    a.doc.querySelector('#f2lSlotSeg [data-sl="l"]').click();
    a.doc.querySelector('.navitem[data-nav="f2l"] .toclink').click(); a.tick();
    assert.ok(a.w.lastScrollTarget?.isConnected);
    assert.ok(a.doc.querySelector('#f2lList h2').id);
  } finally { a.close(); }
});

test('F06: no quiz categories means no stale answer or player', () => {
  const a = app();
  try {
    a.doc.querySelectorAll('#qFilters [data-q]').forEach(button => button.click());
    a.doc.querySelector('#qReveal').click();
    assert.equal(a.value('qCur'), null);
    assert.equal(a.doc.querySelector('#qAns').textContent, '');
    assert.equal(a.doc.querySelector('#qReveal').disabled, true);
  } finally { a.close(); }
});

test('F07: Space on a native button is not a player shortcut', () => {
  const a = app();
  try {
    a.value('n3loadAlg(PLL.T,"T",false,false,"case","pll"); openPP()');
    const event = new a.w.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    a.doc.querySelector('#ppclose').dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
    assert.equal(a.value('N3.playing'), false);
  } finally { a.close(); }
});

test('F08: inherited object keys are invalid, standard wide aliases normalize', () => {
  const a = app();
  try {
    const input = a.doc.querySelector('#scrinput');
    input.value = 'toString'; a.value('scrUpdate()');
    assert.match(a.doc.querySelector('#scrmeta').textContent, /認識できない|Unrecognized/);
    assert.equal(a.doc.querySelector('#scrplay').disabled, true);
    input.value = 'Rw U'; assert.equal(a.value('scrUpdate()'), 'r U');
    assert.equal(a.doc.querySelector('#scrplay').disabled, false);
  } finally { a.close(); }
});

test('F01: English solver settles without mutation-driven replanning', async () => {
  const a = app({ language: 'en' });
  try {
    a.value('FP.state=run(SOLVED,"R");fpPaint()');
    a.doc.querySelector('#fpSolve').click();
    await new Promise(resolve => setTimeout(resolve, 30));
    let mutations = 0;
    const observer = new a.w.MutationObserver(records => { mutations += records.length; });
    observer.observe(a.doc.querySelector('#fpSolveBox'), { subtree: true, childList: true, characterData: true });
    await new Promise(resolve => setTimeout(resolve, 30));
    observer.disconnect();
    assert.equal(mutations, 0);
  } finally { a.close(); }
});

test('F18: dynamic controls and move counts return to Japanese', () => {
  const a = app({ language: 'en' });
  try {
    a.doc.querySelector('#fpCtlMode').click();
    a.doc.querySelector('#fpReset').click();
    a.value('setLanguage("ja")');
    assert.equal(a.doc.querySelector('#fpCount').textContent, '0手');
    assert.match(a.doc.querySelector('#fpCtlMode').textContent, /操作へ/);
    assert.doesNotMatch(a.doc.querySelector('#fpCtlMode').textContent, /controls/);
  } finally { a.close(); }
});
