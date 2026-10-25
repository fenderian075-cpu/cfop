const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./app-helper.cjs');

function pointer(a, target, type, x = 100, y = 100) {
  target.dispatchEvent(new a.w.MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
}

test('mobile navigation taps retain their button target; horizontal drags still capture and navigate', () => {
  const a = app({ width: 390 });
  try {
    const bar = a.doc.querySelector('#tabbar');
    let captured = false;
    bar.setPointerCapture = () => { captured = true; };
    const button = bar.querySelector('[data-p="basic"]');
    pointer(a, button, 'pointerdown');
    pointer(a, button, 'pointerup');
    // Pointer capture retargets the browser-generated click to the capturing element.
    (captured ? bar : button).click();
    assert.equal(a.doc.body.dataset.page, 'basic');
    pointer(a, button, 'pointerdown');
    pointer(a, button, 'pointermove', 30);
    assert.equal(captured, true);
    pointer(a, bar, 'pointerup', 30);
    assert.equal(a.doc.body.dataset.page, 'cross');
    bar.click();
    assert.equal(a.doc.body.dataset.page, 'cross');
  } finally { a.close(); }
});

test('Freeplay view reset remains clickable inside the orbit gesture surface', () => {
  const a = app({ width: 390 });
  try {
    const stage = a.doc.querySelector('#fpStage');
    let captured = false;
    stage.setPointerCapture = () => { captured = true; };
    const reset = a.doc.querySelector('#fpViewReset');
    pointer(a, reset, 'pointerdown');
    assert.equal(captured, false);
    pointer(a, stage, 'pointerdown');
    assert.equal(captured, true);
  } finally { a.close(); }
});
