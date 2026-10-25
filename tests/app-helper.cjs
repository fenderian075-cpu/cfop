const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function app({ language = 'ja', mode = 's', width = 1280, Worker, workerDeadline } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), {
    url: 'http://localhost:4173/cfop/', runScripts: 'outside-only', pretendToBeVisual: true,
  });
  const w = dom.window;
  if(Worker)w.Worker=Worker;
  if(workerDeadline){const timeout=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>timeout(fn,ms===15000?workerDeadline:ms,...args);}
  w.localStorage.setItem('cfop-lang', language);
  w.localStorage.setItem('cfop-mode', mode);
  w.innerWidth = width;
  w.matchMedia = query => ({ matches: query.includes('max-width:760') ? width <= 760 : query.includes('min-width:761') ? width >= 761 : false, addEventListener() {}, addListener() {} });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = function () { w.lastScrollTarget = this; };
  w.HTMLElement.prototype.scrollTo = () => {};
  w.HTMLElement.prototype.animate = () => ({ finished: Promise.resolve(), cancel() {} });
  let now = 0, id = 0;
  const frames = new Map();
  w.performance.now = () => now;
  w.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  w.cancelAnimationFrame = key => frames.delete(key);
  function tick(milliseconds = 1000) {
    now += milliseconds;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(now));
  }
  for (const script of w.document.querySelectorAll('script[src]')) {
    vm.runInContext(fs.readFileSync(path.join(root, script.getAttribute('src').split('?')[0]), 'utf8'), dom.getInternalVMContext());
  }
  return { w, doc: w.document, tick, value: expression => w.eval(expression), close: () => dom.window.close() };
}
module.exports = { app, root };
