# Learning journey re-audit — 2026-10-25 / v104

Baseline: main b166a18 (v103). Scope: recently added guided learning, mobile controls,
practice records, interruption/resumption, backup/export/import. Existing checks and
history are preserved; no progress reset or destructive migration.

## Findings and fixes

| Priority | Reproduction on v103 | Cause / corrected behavior | Source in v104 |
|---|---|---|---|
| P1 | Open two tabs. Record an attempt/check in one; import a legacy backup in the other before its storage event arrives. | Import used stale memory and could overwrite the new history/check. Import/export now read and validate current disk state before merging. Manual check edits apply the click intent to latest checks; storage events synchronize check removal too. | `learning-ui.js:56`, `learning-ui.js:66`, `progress.js:13` |
| P1 | Practice → Mixed review → recognize: the Case selector displays the correct answer before answering. | Hide the answer selector during recognition questions; restore it after grading. | `learning-ui.js:187` |
| P2 | Practice → first advance button: comparison examples are skipped; wrong answer shows no case explanation. | Advance now shows the paired examples, then randomly selects a pair member for the question. Results include correct case name and distinguishing concept. Prompt/button text describes the next action. | `learning-ui.js:200`, `learning-ui.js:218`, `lib/messages.mjs:9` |
| P2 | Start physical timer → View records or another route: timer continues. Continue or reload discards timer/input/orientation/hints. | Suspend on route/records/close/visibility/pagehide. Persist a validated optional practice draft. Restore paused elapsed time, entered moves, orientation, hint/setup and graded state; no automatic success or duplicate attempt. Restarting explicitly starts a new measurement. | `learning-ui.js:46`, `learning-ui.js:159`, `learning-ui.js:268`, `navigation.js:14`, `lib/learning.mjs:20` |
| P2 | Export a valid history with a non-ASCII event ID, or import the same event with JSON keys reordered. | ASCII-only encoding failed; byte-order-sensitive comparison rejected equivalent events. Use UTF-8 backup encoding and compare semantic event fields. Legacy ASCII backups remain readable; real event conflicts remain rejected. | `learning-ui.js:54`, `lib/learning.mjs:34` |
| P2 | Open physical setup and immediately grade before its queued toggle event fires. | The hint flag could still be false. Grading also inspects the setup disclosure directly. | `learning-ui.js:224` |
| P2 | Correct answers at 23:59 and 00:01 UTC. | Different calendar dates advanced spacing despite only two minutes between attempts. Interval escalation now requires successes separated by 24 hours. Scheduling remains advisory, not a mastery/learning efficacy claim. | `lib/learning.mjs:51` |
| P3 | View records and look for a way to move progress to another device. | Backup was distant below Freeplay. Records now provides an Open backup button that opens, populates and focuses the backup field. | `index.html:106`, `learning-ui.js:292` |

## Regression evidence

`node --test tests/reaudit.test.cjs` initially reproduced eight failing scenarios;
all now pass. Further tests cover invalid drafts preserving raw data, exporting
in-memory history when browser storage is blocked, and a pending cross-tab uncheck.
`npm run check`: 59 Node tests, generated Worker/runtime consistency and release
version coherence pass. Tests include exhaustive cube-state checks and preservation
of unsupported/future schemas and import write-failure behavior.

Browser suite: `tests/e2e/learning.spec.cjs`, Chromium Pixel 7 and WebKit iPhone 13
profiles. Added fresh independent browser-context restore (checks, complete attempt,
hint, paused draft), reload/resume, cross-tab check/uncheck; strengthened 3D end
assertion to the actual slider position. Existing tests cover all six routes,
320/375/740px, language/level switches, tap/swipe, Freeplay solver, two-tab history,
old PWA upgrade/offline, prediction, repetition and local response samples.

Manual browser checks use the actual site through CUA, including 320×568 and
390×640 same-origin responsive previews. These are desktop browser viewports;
CI adds mobile/touch emulation, not a physical iPhone/Android hardware test.
No claims of measured learning gains or field INP are made.

## Data and release boundaries

The optional draft is backward-compatible with v103 history and CFOP2 backups;
unsupported or malformed stored drafts are protected instead of overwritten.
Only the latest continuation point is kept. Opening a lesson makes that lesson
the continuation point. A restored physical measurement stays stopped and needs
an explicit self-reported result. Progress backups are local codes, not cloud sync.
Two-key localStorage import uses validation before writes and rollback on the
second write failing; browser storage has no cross-key/multi-process transaction.
Completely simultaneous browser-process writes are not an atomic database guarantee.

Release v104 uses one coherent asset/cache version. CI must pass on the staging
branch before a normal fast-forward main push; publication and public file hashes
are checked after Pages deployment. Final run IDs and screenshots are recorded in
the task's external `cfop-learning-reaudit` verification artifacts.
