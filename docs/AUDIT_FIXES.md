# 2026-10-25 audit remediation

Base: `ff2201465e018516bcf6550c332ab26a2b7d8c83`.
Scope: the 18 audit findings. Separate feature proposals are not part of this
fix. Changes remain local until explicitly pushed and deployed.

| Finding | Change | Regression / verification |
| --- | --- | --- |
| F01 | Disconnect translation observation during writes; ignore owned solver/message output; translate existing plan labels only on explicit language changes. | English solver becomes idle without DOM mutations; plan identity/index survive JA/EN changes. |
| F02 | Cancel frames and invalidate animation sessions on pause/seek/reset/load. | Reset during a turn stays at zero and the original state. |
| F03 | Keep OE1–3; register only active Cross tasks; distinguish algorithms and tasks. | Edge learning updates the numerator; Simple has 24 algorithms/3 tasks, Advanced 119/3. |
| F04 | Store language-independent PLL target IDs. | English guide scrolls to a connected section. |
| F05 | Preserve heading IDs and rebuild F2L subnav; resolve current headings at click time. | FR/FL switching retains working section links. |
| F06 | Clear current quiz/state/AUF and disable reveal for an empty pool. | Empty filters cannot reveal a stale answer. |
| F07 | Preserve native button/link/input keys; exclude modified shortcuts. | Space on Close is not prevented or treated as Play. |
| F08 | Null-prototype move registry; common own-key parser; wide/prime normalization; block invalid playback. | Reject inherited keys; Rw equals r; invalid input disables play. |
| F09 | Limit cleanup to CFOP caches; wait for old clients to close. | Another application's cache survives activation. |
| F10 | Four-second deadline and cached recovery on HTTP/connection failures; isolate cache write errors. | 503/offline/hung requests recover; cache quota errors preserve successful responses. |
| F11 | Bilingual state descriptions/text questions, named inputs and semantic search selection/focus. | Face rows are exposed without answer names; setup/search are keyboard reachable. |
| F12 | ID-routed Worker requests with startup/runtime/message/deadline completion. | Concurrent responses route correctly; failure completes fallbacks exactly once. |
| F13 | Correct the Pages header documentation; retain header-capable configuration and add early framed-page hiding. | No claim that Pages applies _headers. Actual HTTP policies need verification on deployment. |
| F14 | Pin tools; vendor cubejs runtime with original license, tarball integrity and hashes; reproducible Worker; add CI. | Test suite, Worker output comparison and dependency audit; actions pinned by commit. |
| F15 | Preserve old ZIP under a labelled legacy directory; package current runtime files with hashes. | Release excludes archive; historical hash stays unchanged. |
| F16 | Explicit setup buttons, 44px-class mobile controls, readable supporting text and stronger dark muted text. | Native setup toggle and responsive browser review. Physical touch testing remains separate. |
| F17 | Label training random-state generation and fallback separately from official WCA generation. | No WCA-compliant claim in runtime UI. |
| F18 | Message IDs own dynamic counts/control labels; refresh without rebuilding solver state. | English-created labels return to Japanese. |

## Validation boundary

The suite executes the real classic scripts and DOM/event handlers in jsdom,
uses deterministic animation frames, and executes actual SW code with controlled
network/cache boundaries. Algebraic coverage includes 54 move types against
cubejs, 216 OLL orientations, 288 PLL permutations, 150 F2L pair placements, and
40 seeded scrambles in both solve modes.

Browser inspection uses a local preview and real iframe viewports for mobile
CSS. It does not certify physical Safari/Chrome gestures, VoiceOver, device
power use or installed PWA behaviour. Public Pages responses and public CI are
unchanged until push/deployment; local passes are not remote CI or production
verification.

Before deployment verify v94 upgrades with an old tab open, offline restart,
network recovery, actual headers on the chosen host, and physical iOS/Android
interactions at 320/375/390px and landscape.

## Local verification result

- `npm ci --ignore-scripts --offline` completed; `npm audit --audit-level=moderate`
  reported zero vulnerabilities.
- All **33 tests** and the generated Worker/source-hash comparison passed.
- In the actual browser, all six pages at **320, 375 and 390px** had matching
  viewport/document widths and no ordinary visible control shorter than 44px.
  Progress controls use an expanded pseudo-element target; the full dock drag
  handle and collapsed navigation affordance are measured separately.
- The final v100 browser completed T Perm at **14/14**; Space closed the focused
  Close button; an English-created R-turn solve retained **1/1** while restoring
  a complete Japanese title/instruction. The learned count changed between
  **0/24 and 1/24**, with tasks shown separately as **0/3**.

These are local results. The public site, hosted response headers and hosted CI
were not changed or verified as a deployed fix.

## Publication follow-up: browser HTTP cache

After publishing the initial remediation, all primary flows passed on the v100
page, but reopening the ordinary URL in the browser reused a cached v94 shell.
Direct HTTP retrieval already matched the published commit and still declared
`max-age=600`, locating the remaining problem in browser HTTP caching.

The follow-up release bypasses that cache when precaching, explicitly
revalidates network responses, and disables navigation preload so it cannot
supply an old HTTP-cached shell ahead of revalidation. Two additional regression
tests cover installation and online navigation, including a stale preload.


## Mobile interaction follow-up (2026-10-25, v102)

- Reproduced in a real browser at a 390px iframe viewport: pointer clicks on
  mobile tabs left the active page unchanged, while Enter activated the same tab.
  Capturing the pointer on the parent bar during pointerdown retargeted clicks
  away from child buttons. Capture now starts only after a horizontal drag crosses
  the existing 10px direction threshold; swipe navigation and post-swipe click
  suppression remain intact.
- Freeplay's orbit surface now excludes child buttons from pointer capture, so
  its view-reset button receives ordinary clicks. Dragging the cube still captures.
- Added two regression tests with browser pointer-capture click retargeting modeled
  at the DOM event boundary. These supplement, rather than replace, browser checks.
- Responsive checks use the unmodified runtime in the local same-origin preview:
  320x568, 375x667, 390x640, 740x390 and 844x390. Six-page navigation has no document
  horizontal overflow at 320, 375 and 844px; mobile tabs were directly clicked at
  320, 375 and 390px. T-perm playback reaches 14/14 at 320, 390 and 740px.
  Also checked mobile contents navigation, language/mode switches, player reset,
  minimize/restore, Freeplay solve completion and quiz-to-player entry.
- These are responsive desktop-browser checks, not physical iOS/Android or touch
  hardware certification. Browser UI and safe-area behavior on real devices remain
  outside this environment's verified evidence.
