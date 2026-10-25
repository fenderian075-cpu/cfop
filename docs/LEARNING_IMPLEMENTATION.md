# Research improvements implemented in v103

Baseline: `857d22c` (v102). Scope: all ten improvements in
`RESEARCH_RECOMMENDATIONS_2026-10-25.md`. Learning efficacy remains a hypothesis;
functional checks do not prove faster physical solves or long-term retention.

| Proposal | Implementation | Verification |
|---|---|---|
| Home goals / resume | Today, review queue, continue, notation, beginner CFOP, practice and records above the existing tools; six lesson routes retained | DOM and mobile browser journeys |
| Case-level history | Versioned attempts with task, result, source, hint, time, orientation, date; original manual checks unchanged | Legacy migration, read-only future schema, round-trip and quota tests |
| Learn → compare → mix | Worked feature examples, paired contrasts, automatically checked recognition and state-based move recall; mixed orientation and due queue | Correct answer, duplicate-submit and recall/AUF tests; mobile browser flow |
| Segmented 3D | Existing trigger highlighting plus sequence boundaries, next-segment playback, prediction pauses, repeat, 0.5–2x speed | Pause at T-perm step 4, reset cancels repeat; 14/14 browser playback |
| Recognition / recall / execution / solve | Four separate metric cards, case filter, recent and case-specific records; physical timer and explicit self-report | No attempt from 3D completion; timer and backup browser tests |
| Browser CI | Chromium/Pixel and WebKit/iPhone profiles; pointer/touch, portrait/landscape, fixtures for old worker and offline reopening, multiple tabs | Dedicated CI job and retained failure traces/screenshots |
| Non-drag viewpoint | Five named viewpoint buttons for player and Freeplay, alongside existing drag/reset | DOM rotation test and browser tap-only rotation |
| Clear module/data/translation seams | Pure ES modules in lib, explicit catalog inputs, stable legacy IDs, case prerequisites/concepts/triggers/source/version and keyed JA/EN messages; deterministic generated runtime | Pure-model tests and generated-source check |
| Performance | Lazy lesson and notation materialization; existing Home scene retained across modes; bounded local action-to-paint and long-task samples; throttled CI samples | Initial hidden grids empty; correct first render at each mode/language; browser attachment |
| Data-safe updates / backups | Legacy raw backup retained, validated merge imports, format version, source recovery, app/catalog version labels and waiting-update announcement; release versions synchronized from one file | Invalid import rollback, two-tab history merge, old cached shell / unrelated cache preservation and offline reload |

All data remains on the current origin. Export/import is manual. Old manual
checks are never converted into fabricated successful attempts or retention
scores. Existing timestamps and attempt IDs survive merge imports. Case IDs
continue to use the original F-index / O-number / P-name / OE-number scheme.

The initial schedule uses failures at 10 minutes, hinted success at 1 hour, and
unhinted successes across distinct UTC dates at 1/3/7/14 days. This is a practical
starting policy. Recognition and motor/execution schedules are separate. The
24h+ metric counts successful unhinted answers at least 24 hours after the previous
attempt in the same task; it is not a scientific certification of mastery.

Existing classic modules still operate; the new domain and message modules have
no implicit DOM/storage dependencies. No framework migration, external analytics,
AI, account service or physical smart-cube dependency was introduced.
