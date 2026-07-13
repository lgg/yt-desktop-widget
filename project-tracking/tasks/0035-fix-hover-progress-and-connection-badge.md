# 0035 - Fix hover controls, playback progress, and connection badge visibility

## Status

Completed

## Context

After the hover-only playback controls setting shipped in task `0034`, live portable testing found that the setting cannot be switched off reliably, hover controls and widget height feel unstable, and the progress display can advance much faster than wall-clock time or jump to the end on some tracks. The user also requested an optional connection-status visibility mode matching the Settings and Close buttons: hidden until hover while keeping its layout space reserved.

## Goal

Restore reliable display-preference interaction, make playback progress advance at real time without premature end jumps, and add an accessible persisted option to hide the connection badge until widget hover without changing layout height.

## Scope

Included:

- Diagnose and fix the hover-only playback-controls toggle.
- Remove hover/height feedback or event behavior that makes controls lag or widget height oscillate.
- Trace Companion timestamps through mapping, smoothing, and scrubber rendering.
- Ensure one second of wall-clock time advances displayed elapsed time by approximately one second while playing.
- Prevent invalid or inconsistent progress data from forcing the scrubber to the end.
- Add a persisted setting that hides the connection badge until hover while reserving its layout footprint.
- Add focused component/domain tests and browser smoke coverage.

Out of scope:

- Changing Companion authentication, token storage, or command endpoints.
- Redesigning the overall widget or Settings layout.
- Adding new packaging formats beyond the portable build.

## Affected Areas

- Backend/native: Persisted UI settings schema and backward-compatible serde defaults.
- Frontend: Settings toggle controls, widget hover behavior, connection badge visibility, progress display.
- Domain/API contracts: Playback elapsed/duration/timestamp normalization and smoothing.
- Tests: Vitest component/domain coverage and Playwright simulator smoke.
- Documentation: README display-preference notes and project tracking.
- Build/release/config: Portable build verification; packaging policy unchanged.
- Project tracking: Roadmap, task, report, and time log.
- Other: Windows WebView2 pointer-boundary and auto-height behavior.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-13-0035-a` |
| Started at | `2026-07-13T19:32:38+03:00` |
| Finished at | `2026-07-13T19:57:47+03:00` |
| Time spent minutes | `26` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) |

## Acceptance Criteria

- [x] `Show playback controls only on hover` can be enabled and disabled, persists correctly, and immediately updates the widget.
- [x] Hover-only controls appear and disappear without pointer-event loops, lag, button jitter, or repeated widget-height oscillation.
- [x] Always-visible controls remain mounted and stable when hover-only mode is disabled.
- [x] While playing, displayed elapsed time advances at approximately one second per real second between authoritative snapshots.
- [x] Track changes, invalid timing values, and elapsed values beyond duration cannot leave the progress bar incorrectly pinned to the end.
- [x] A separate persisted option hides the connection badge until hover while keeping its layout footprint reserved.
- [x] The connection badge remains visible by default for existing and new settings unless the user enables the new hide-until-hover option.
- [x] Keyboard interaction, labels, and focus behavior remain accessible for Settings controls.
- [x] Focused tests fail before and pass after each production fix.
- [x] Browser smoke covers toggling hover-only mode, stable pointer leave, real-time progress, and connection-badge visibility.
- [x] `npm run verify`, `npm run test:e2e`, `cargo test --quiet -j1`, `cargo check -j1`, and `npm run build:desktop` pass or skipped checks are documented.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Root-cause evidence: inspect settings save/merge flow, React pointer events, auto-height synchronization, and playback timestamp sources.
- [x] TDD: focused RED/GREEN tests for the toggle, hover stability, connection-badge visibility, and progress clock rate/reset behavior.
- [x] Lint/static checks: `npm run verify` and `cargo check -j1`.
- [x] Tests: focused Vitest suites, full Vitest, `npm run test:e2e`, and `cargo test --quiet -j1`.
- [x] Build: `npm run build:desktop`.
- [x] Manual QA: browser simulator; portable WebView2/YTMDesktop behavior remains explicit because no live instance was attached during this pass.
- [x] Documentation review: README, roadmap, task, report, and time log.
- [x] Release/config review: portable-only packaging and Tauri permissions unchanged.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should the connection badge disappear from layout when hidden? | Resolved | No. Match the Settings/Close visibility behavior: visually hidden until hover, but reserve the same layout space. |
| Should the new badge preference change existing users by default? | Resolved | No. Keep the badge visible unless the user explicitly enables hide-until-hover. |
| Should hover-only controls still change intrinsic height? | Resolved | No. Native resize on pointer enter/leave created a feedback loop; keep enabled controls mounted in a reserved row and change only visibility/interactivity. |
| Are the progress jumps caused by Companion payloads or local smoothing? | Resolved | The frontend mapper treated Companion `player.videoProgress` seconds as a percentage. Normalize at the domain mapping boundary and keep smoothing in seconds. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Window auto-height and pointer boundaries form a feedback loop. | High | Reproduce with real pointer movement and test stable enter/leave semantics before changing layout behavior. |
| Companion timing fields use inconsistent units or clock bases. | High | Normalize only at a proven boundary and cover seconds, milliseconds, invalid, and track-change cases. |
| Settings defaults merge hides a persisted false value. | Medium | Test both true-to-false persistence and missing-key default migration. |
| Hiding status harms connection discoverability. | Medium | Default to visible, keep semantic content mounted, and reveal on hover/focus. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0032-fix-widget-layout-and-playback-stability.md`](0032-fix-widget-layout-and-playback-stability.md)
- Related task: [`0034-fix-playback-controls-hover-mode.md`](0034-fix-playback-controls-hover-mode.md)
- Related report: [`0034-fix-playback-controls-hover-mode.md`](../reports/0034-fix-playback-controls-hover-mode.md)
- Time log: [`time-log.md`](../time-log.md)
- Commit: `a828e0b` on branch `codex/0035-fix-hover-progress-status-badge`
