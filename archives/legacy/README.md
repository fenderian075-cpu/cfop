# Historical deployment archive — do not deploy

`cfop-netlify-deploy-v24.zip` is retained unchanged for historical recovery only.
It contains the older `cfop-runtime-v19` site, not the current split-module app.
Its SHA-256 is `bcf4588ae0d75569711d2939620c70fbd038eb94d8e5af2e840dc7bf0a8a444c`.

For current releases use `npm run package:site` and deploy `dist/site/` from the
desired Git commit. The packager excludes this directory, tests, tooling,
node_modules, Git metadata and provenance development files.
