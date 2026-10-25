const Cube = require('../vendor/cubejs-1.3.2');
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') {
      Cube.initSolver();
      self.postMessage({ ready: true });
    } else if (data.type === 'scramble') {
      self.postMessage({ id: data.id, scramble: Cube.scramble() });
    }
  } catch (_) {
    self.postMessage({ id: data.id, error: 'scrambler-failed' });
  }
};
