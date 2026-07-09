# 0032 - Fix widget layout and playback stability

## Status

Completed

## Context

After Companion authorization was fixed and confirmed against YTMDesktop v2.0.11, the live widget exposed three runtime regressions: the main window remains much taller than its visible content, paused playback adds a redundant status card, and frequent realtime state updates make playback controls appear unstable or delayed.

This task continues the open stabilization work in tasks `0001`, `0002`, and `0012`.

## Goal

Keep the live widget compact across state transitions, remove the redundant paused card, and make realtime playback rendering and controls stable without changing the Companion API contract.

## Scope

Included:

- Trace main-window content measurement through the Tauri resize command.
- Ensure the window can shrink after reconnect/auth/error content disappears.
- Remove the paused playback status card.
- Audit realtime snapshot mapping, state publication, progress rendering, and command dispatch.
- Prevent semantically duplicate playback updates from causing unnecessary UI work.
- Add focused regression tests and perform browser plus portable-build verification.
- Record the user's successful live authorization confirmation for task `0031`.

Out of scope:

- Manual resizing or new widget size presets.
- Companion protocol changes or token-storage changes.
- Visual redesign beyond removing the paused card and restoring compact behavior.

## Affected Areas

- Backend/native: main-window resize command and constraints if required by the root cause.
- Frontend: widget composition, auto-height measurement, playback controls, progress rendering.
- Domain/API contracts: playback snapshot equality/publication behavior; Companion commands remain unchanged.
- Tests: component, controller/mapping, window sizing, and simulator smoke coverage.
- Documentation: README and project tracking where runtime behavior or verification status changes.
- Build/release/config: portable Windows build verification; no packaging-policy change.
- Project tracking: roadmap, task, report, and time log.
- Other: live YTMDesktop command behavior remains user-verifiable after handoff.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0032-a` |
| Started at | `2026-07-09T16:01:47.0225655+03:00` |
| Finished at | `2026-07-09T16:30:39.3959097+03:00` |
| Time spent minutes | `29` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [x] The main window shrinks back to compact content height after taller transient states disappear.
- [x] Paused playback renders the same compact track/control layout without a paused status card.
- [x] Semantically duplicate realtime playback snapshots do not publish redundant application state.
- [x] Previous, play/pause, and next each dispatch exactly one documented Companion command per activation.
- [x] Progress smoothing remains responsive without forcing unrelated control-state churn.
- [x] Focused tests fail before and pass after each behavioral fix.
- [x] Browser-level screenshots show compact playing and paused layouts without overlap or excess empty space.
- [x] `npm run verify`, `cargo check -j1`, and `npm run build:desktop` pass.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`.
- [x] Tests: focused Vitest suites, then complete Vitest suite through `npm run verify`.
- [x] Native checks: `cargo test --quiet -j1` and `cargo check -j1`.
- [x] Build: `npm run build:desktop`.
- [x] Manual QA: browser simulator playing/paused screenshots; inspect resulting portable executable metadata.
- [x] Documentation review: reconcile README, roadmap, task, report, and time log.
- [x] Release/config review: confirm portable-only packaging remains unchanged.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should paused playback have a separate explanatory card? | Resolved | No. The play/pause icon already communicates the actionable state, and the user explicitly requested removal. |
| Should this introduce manual resizing? | Resolved | No. Restore reliable content-driven sizing only; presets/manual resize remain deferred. |
| Can Companion command names or rate limits be changed? | Resolved | No. Preserve the official v1 `playPause`, `previous`, and `next` command contract. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Measuring the viewport instead of intrinsic content creates a resize feedback loop. | High | Isolate height calculation, test shrinking explicitly, and measure only intrinsic content. |
| Aggressive state deduplication suppresses real progress or playback changes. | High | Compare all render-relevant fields and add positive tests for meaningful updates. |
| Optimistic command UI diverges from YTMDesktop state. | Medium | Keep the server authoritative and avoid unsupported optimistic transitions. |
| Browser simulator differs from Tauri window behavior. | Medium | Cover sizing logic with tests and build the native portable executable in addition to browser screenshots. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related tasks: [`0001`](0001-stabilize-current-widget-interaction-regressions.md), [`0002`](0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md), [`0012`](0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md), [`0031`](0031-fix-companion-auth-persistence.md)
- Related report: [`0032`](../reports/0032-fix-widget-layout-and-playback-stability.md)
- Time log: [`time-log.md`](../time-log.md)
- Branch: `codex/0032-fix-widget-layout-playback`
