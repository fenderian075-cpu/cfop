# CFOP Trainer

A static Japanese/English CFOP trainer with 41 F2L, 57 OLL and 21 PLL
algorithms, a 3D player, practice scrambles and quizzes.

## Develop and check

Use Node.js 24.15.0 or later and npm. Development dependencies are pinned in
`package-lock.json`; runtime assets do not download from a third-party CDN.

```sh
npm ci --ignore-scripts
npm run check
npm run serve
```

Open `http://127.0.0.1:4173/cfop/`. For a real responsive browsing context, use
`http://127.0.0.1:4173/__preview?width=390&height=844&page=basic`.
Preview pages: `home`, `basic`, `cross`, `f2l`, `oll`, `pll`.

The check runs DOM/event regressions, algorithm properties, Worker failures,
Service Worker recovery, release checks and Worker reproducibility. DOM tests
do not replace physical iOS/Android or VoiceOver testing.

## Worker provenance

The training scrambler is cubejs **1.3.2**. Its original runtime source and
license are in `vendor/cubejs-1.3.2/`; the exact npm tarball integrity and source
hashes are in `provenance.json`. Its unrelated legacy npm CLI dependency is
neither installed nor distributed. Rebuild with `npm run build:worker` and
verify with `npm run check:worker`.

Training random-state generation is not an official WCA competition generator.
Worker startup, execution and deadline failures return an indicated random-move
fallback to the requesting practice tool.

## Deploy the current site

Run `npm run package:site` and deploy only `dist/site/` from the intended commit.
The package includes `asset-sha256.json` and the original cubejs license; it
excludes tests, tooling, Git metadata, npm packages and the historical ZIP.
The packager preserves previous artifacts by refusing a nonempty destination.
For another release choose a fresh directory:

```sh
node -e "require('./scripts/package-site.cjs').packageSite('dist/release-2')"
```

The former root ZIP is preserved unchanged under `archives/legacy/` and must
not be used for current deployments.

## Hosting and security boundaries

**GitHub Pages does not apply `_headers`.** That file targets hosting providers
that support its format. On Pages the HTML meta CSP restricts scripts, styles,
workers and connections; an early visibility guard keeps the app hidden when
publicly framed. This JavaScript fallback is not an HTTP
`frame-ancestors`/X-Frame-Options guarantee. Do not describe those headers as
active on Pages. A strict header requirement needs a header-capable host;
changing public hosting is a separate deployment action.

The local preview allows same-origin frames for responsive testing. Production
`_headers` denies all framing, restricts device/payment permissions and referrers,
and disables browser HTTP caching of the worker and page shell. Verify actual
response headers after deployment: repository configuration and Pages build
success are not proof of live header enforcement.

Runtime scripts and styles share a release query version. The Service Worker
precaches that release and serves versioned assets from its installed cache.
Shell navigation has a four-second deadline, with cache recovery on HTTP,
connection or deadline failures. New workers wait for existing pages to close;
close all site tabs and reopen to complete an update. Only `cfop-runtime-`
caches may be removed. Query versions are release identifiers, not immutable
content hashes: update HTML, Worker URL and SW together, deploy the package
atomically where possible, and test upgrades with old tabs present.

See [docs/AUDIT_FIXES.md](docs/AUDIT_FIXES.md) for all 18 changes, regression
coverage and remaining physical-device/deployment checks.
