# Third-party notices

This site embeds the following third-party software.

## cubejs

- Repository: https://github.com/ldez/cubejs
- License: MIT
- Version: 1.3.2 (exact npm tarball integrity and source hashes: `vendor/cubejs-1.3.2/provenance.json`).
- Usage: Training random-state scrambles in `cube-worker.js`. Not an official WCA competition generator.
- Rebuild: `npm ci --ignore-scripts && npm run build:worker`; verify with `npm run check:worker`.
- Original source and the unmodified license are kept in `vendor/cubejs-1.3.2/`. Only the runtime modules are vendored; cubejs's unrelated npm CLI dependency is not shipped or installed.

## Original cubejs license

```text
Copyright (c) 2013-2017 Petri Lehtinen <petri@digip.org>
Copyright (c) 2018 Ludovic Fernandez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
