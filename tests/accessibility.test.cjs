const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./app-helper.cjs');

test('F11: case diagrams and text questions describe the actual state without naming the answer', () => {
  const a = app();
  try {
    const figure = a.doc.querySelector('#qFig svg');
    assert.equal(figure.getAttribute('role'), 'img');
    assert.match(figure.getAttribute('aria-label'), /上面.+右面.+正面/);
    assert.doesNotMatch(figure.getAttribute('aria-label'), /perm|OLL \d|F2L #/);
    const toggle = a.doc.querySelector('#qTextMode');toggle.checked = true;toggle.dispatchEvent(new a.w.Event('change'));
    assert.equal(a.doc.querySelector('#qStateText').classList.contains('sr-only'), false);
    a.value('setLanguage("en")');
    assert.match(a.doc.querySelector('#qStateText').textContent, /Cube state.+Top.+Right.+Front/);
    const before = a.doc.querySelector('#qStateText').textContent;
    a.value('qDiagramState=run(SOLVED,"R");qUpdateDescription()');
    assert.notEqual(a.doc.querySelector('#qStateText').textContent, before);
  } finally { a.close(); }
});
test('F16: setup is an explicit native button with an expanded state', () => {
  const a = app();
  try {
    const card = a.doc.querySelector('#ollList .acard'), toggle = card.querySelector('button.setup-toggle');
    assert.ok(toggle);assert.equal(toggle.getAttribute('aria-expanded'), 'false');toggle.click();
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');assert.equal(card.querySelector('.setuprow').hidden, false);
  } finally { a.close(); }
});

test('F11: the mirrored F2L description uses the left-slot algorithm state',()=>{
  const a=app();
  try{
    a.doc.querySelector('#f2lSlotSeg [data-sl="l"]').click();
    assert.equal(a.doc.querySelector('#f2lList .acard svg').dataset.cubestate,a.value('caseState(mirAlg(F2L[0].a)).join(",")'));
  }finally{a.close();}
});
test('command search exposes options, active selection, and restores keyboard focus', () => {
  const a = app();
  try {
    const trigger = a.doc.querySelector('.navmain'); trigger.focus();
    a.doc.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    const input = a.doc.querySelector('#cmdkInput');
    assert.equal(a.doc.activeElement, input);
    assert.equal(input.getAttribute('aria-expanded'), 'true');
    assert.ok(a.doc.getElementById(input.getAttribute('aria-activedescendant'))?.matches('[role="option"][aria-selected="true"]'));
    input.value='no-such-case-zzzz';input.dispatchEvent(new a.w.Event('input'));
    assert.equal(input.hasAttribute('aria-activedescendant'),false);
    input.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(a.doc.activeElement, trigger);
  } finally { a.close(); }
});
test('language changes preserve the existing solver plan and step', () => {
  const a = app();
  try {
    a.value('FP.state=run(SOLVED,"R F U");fpPaint()');a.doc.querySelector('#fpSolve').click();
    a.value('FP.testPlan=FP.plan;FP.planI=1;setLanguage("en")');
    assert.equal(a.value('FP.plan===FP.testPlan'), true);assert.equal(a.value('FP.planI'), 1);
    a.value('setLanguage("ja")');assert.equal(a.value('FP.plan===FP.testPlan'), true);assert.equal(a.value('FP.planI'), 1);
  } finally { a.close(); }
});

test('F18: a plan created in English has complete Japanese labels after switching', () => {
  const a=app({language:'en'});
  try{
    a.value('FP.state=run(SOLVED,"R");fpPaint()');a.doc.querySelector('#fpSolve').click();
    a.value('setLanguage("ja")');
    assert.match(a.doc.querySelector('#fsTitle').textContent,/白×赤/);
    assert.match(a.doc.querySelector('#fpSolveBox .fsj').textContent,/正面中段/);
    assert.doesNotMatch(a.doc.querySelector('#fpSolveBox .fsj').textContent,/front middle/);
  }finally{a.close();}
});
