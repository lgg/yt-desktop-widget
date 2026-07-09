# 0033 - Fix widget display preference layout

## Status

Completed

## Context

After task `0032` restored compact connected playback sizing, the user reported a remaining visual/layout regression in the live widget: the progress row sits too close to the rounded lower edge, the right duration label appears cramped, `Hide progress bar` does not visibly hide the progress row, and `Hide playback controls` hides buttons without shrinking the widget height.

This continues the open widget stabilization work in tasks `0001`, `0002`, and `0012`.

## Goal

Make display preferences remove their corresponding UI from the connected widget layout, keep the progress row visually centered inside the widget, and ensure the content-driven window height shrinks when controls or progress are hidden.

## Scope

Included:

- Audit connected widget footer layout, progress row CSS, and settings-driven visibility.
- Render playback controls and progress scrubber only when the matching display preference allows them.
- Preserve hover behavior for controls when controls are enabled.
- Add lower breathing room and safer progress row columns so duration labels do not collide with rounded corners.
- Add focused regression tests and browser simulator coverage for hidden controls/progress and compact height.
- Rebuild the portable executable if validation succeeds.

Out of scope:

- New size presets or manual resize.
- Companion API, auth, token storage, or command contract changes.
- A broader visual redesign outside the reported footer/layout behavior.

## Affected Areas

- Backend/native: Tauri auto-height command is exercised but not expected to change.
- Frontend: widget connected footer layout, progress scrubber, transport controls, settings-driven rendering.
- Domain/API contracts: no Companion contract change expected.
- Tests: component and Playwright simulator coverage.
- Documentation: README/project-tracking updates if behavior or validation status changes.
- Build/release/config: portable Windows build verification; packaging policy unchanged.
- Project tracking: roadmap, task, report, and time log.
- Other: live YTMDesktop verification remains user-side for the rebuilt portable executable.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0033-a` |
| Started at | `2026-07-09T17:43:36.7001326+03:00` |
| Finished at | `2026-07-09T18:00:17.0361401+03:00` |
| Time spent minutes | `17` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] `Hide progress bar` removes the scrubber/timings from the connected widget and allows the window to shrink.
- [x] `Hide playback controls` removes transport buttons from the connected widget and allows the window to shrink.
- [x] When both blocks are visible, the progress row has safe horizontal spacing and more bottom breathing room.
- [x] Controls still appear on hover when controls are enabled and still dispatch the documented commands.
- [x] Focused tests fail before and pass after the behavioral fix.
- [x] Browser simulator smoke coverage verifies hidden progress/controls and compact height changes.
- [x] `npm run verify`, `cargo check -j1`, and `npm run build:desktop` pass or any skipped checks are recorded with reasons.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`.
- [x] Tests: focused Vitest suite for widget rendering/height, then full Vitest through verify.
- [x] Build: `npm run build:desktop`.
- [x] Native check: `cargo check -j1`.
- [x] Manual QA: browser simulator measurements for visible, hidden controls, hidden progress, and both hidden.
- [x] Documentation review: README, roadmap, task, report, and time log.
- [x] Release/config review: portable-only packaging remains unchanged.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should hidden display sections remain in the DOM with opacity transitions? | Resolved | No. A `Hide` setting should remove the section from layout so the auto-height measurement can shrink the Tauri window. |
| Should transport controls still use hover reveal when enabled? | Resolved | Yes. The user reported the setting behavior, not a request to make controls permanently visible. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Removing components from the DOM could make hover controls unavailable if the visibility condition is wrong. | Medium | Keep an explicit enabled/rendered condition separate from hover visibility and test hover command access. |
| Progress row spacing changes could reduce compactness too much. | Medium | Use small fixed footer padding/gap and browser height checks. |
| Browser simulator height differs from Tauri WebView2. | Medium | Keep intrinsic auto-height tests and rebuild portable executable for live user verification. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related tasks: [`0001`](0001-stabilize-current-widget-interaction-regressions.md), [`0002`](0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md), [`0012`](0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md), [`0032`](0032-fix-widget-layout-and-playback-stability.md)
- Related report: [`0033`](../reports/0033-fix-widget-display-preference-layout.md)
- Time log: [`time-log.md`](../time-log.md)
- Branch: `codex/0033-fix-widget-display-preferences-layout`
