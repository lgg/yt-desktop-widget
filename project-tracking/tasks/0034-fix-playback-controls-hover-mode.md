# 0034 - Fix playback controls hover mode

## Status

Completed

## Context

After task `0033`, display preferences correctly remove playback controls and the progress row from the compact layout. The user confirmed that fix works, then reported two remaining control UX issues:

- Playback controls should have a separate setting for hover-only visibility. `Hide playback controls` should still remove controls entirely, while a new setting should decide whether enabled controls are always visible or only visible while the pointer is over the widget.
- When hover-only controls hide because the pointer leaves the widget, the widget height should shrink as if the controls block is absent.
- Transport buttons visually jitter when the pointer moves between controls or away from the control row.

This task continues the stabilization work from tasks `0032` and `0033`.

## Goal

Add a separate hover-only playback-controls setting, make hover-hidden controls unmount from layout so auto-height shrinks, and remove unnecessary group/button transform collisions that make controls appear to jitter.

## Scope

Included:

- Add a persisted UI setting for hover-only playback controls.
- Keep `hidePlaybackControls` as the stronger setting that removes controls entirely.
- Render controls always when enabled and hover-only mode is disabled.
- Render controls only while the widget is hovered when hover-only mode is enabled.
- Trigger auto-height resync when hover-only controls mount/unmount.
- Remove or simplify transform-based transport-control animations that cause group jitter.
- Add focused component and browser simulator coverage.
- Update settings UI copy, docs, tracking, and release build.

Out of scope:

- Companion command contract changes.
- Manual widget resize or size presets.
- Reworking settings/close button hover behavior unless directly affected by shared CSS.

## Affected Areas

- Backend/native: no native API changes expected; settings persistence schema remains backward-compatible through defaults merge.
- Frontend: widget controls render logic, settings window UI, settings types/defaults/equality, CSS motion.
- Domain/API contracts: settings type only; no Companion contract changes.
- Tests: component and Playwright simulator coverage.
- Documentation: README and project tracking.
- Build/release/config: portable Windows build verification; packaging policy unchanged.
- Project tracking: roadmap, task, report, and time log.
- Other: live visual confirmation remains user-side.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0034-a` |
| Started at | `2026-07-09T22:15:39.6297837+03:00` |
| Finished at | `2026-07-09T22:34:55.6234565+03:00` |
| Time spent minutes | `20` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] `Hide playback controls` still removes transport controls entirely.
- [x] A separate setting controls whether enabled playback controls are always visible or only visible while the pointer is over the widget.
- [x] In hover-only mode, controls are absent from DOM/layout while the pointer is outside the widget and the intrinsic height shrinks.
- [x] In always-visible mode, controls stay rendered when the pointer leaves the widget.
- [x] Transport buttons no longer share transform animations that make all controls appear to jitter when moving pointer between controls or away from them.
- [x] Focused tests fail before and pass after the behavioral fix.
- [x] Browser smoke verifies hidden, hover-only, and always-visible controls with compact height changes.
- [x] `npm run verify`, `cargo check -j1`, and `npm run build:desktop` pass or skipped checks are recorded with reasons.
- [x] A separate branch/PR is created and merged to `master` if validation passes and remote access is available.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`.
- [x] Tests: focused `WidgetWindow` tests, settings/defaults checks as needed, then full Vitest through verify.
- [x] Build: `npm run build:desktop`.
- [x] Native check: `cargo check -j1`.
- [x] Browser QA: simulator smoke for always-visible, hover-only collapsed/un-collapsed, and fully hidden controls.
- [x] Documentation review: README, roadmap, task, report, and time log.
- [x] Release/config review: portable-only packaging unchanged.
- [x] GitHub review: PR #1 created and merged to `master`.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should the new hover-only control be a separate setting from `Hide playback controls`? | Resolved | Yes. `Hide playback controls` removes controls entirely; the new setting controls hover-only visibility when controls are enabled. |
| What should the default be? | Resolved | Preserve current user-facing behavior by defaulting hover-only controls to enabled, while allowing users to disable it for always-visible controls. |
| Should hover-hidden controls reserve layout space? | Resolved | No. When hidden by hover-only mode, controls are unmounted from the footer so auto-height can shrink. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Adding a new persisted setting could break older settings payloads. | Medium | Use existing merge-with-defaults path and update equality/defaults/tests. |
| Unmounting controls on pointer leave could make the window resize too frequently. | Medium | Trigger explicit height sync only on derived render state changes and verify browser height behavior. |
| Removing transforms could make controls feel flatter. | Low | Preserve opacity/background transitions and button hover background feedback without group translate. |
| Browser hover behavior may differ from WebView2. | Medium | Use component tests plus Playwright metrics and rebuild portable executable for live check. |

## Follow-up Correction

Live portable feedback on 2026-07-13 showed that unmounting the controls and resizing the native window on every pointer enter/leave created a pointer-boundary feedback loop and visible height jitter. Task [`0035`](0035-fix-hover-progress-and-connection-badge.md) supersedes only that layout decision: enabled controls now remain mounted in a stable reserved row and fade in/out without changing intrinsic widget height. The separate hover preference and transform-free transport buttons remain in effect.

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related tasks: [`0032`](0032-fix-widget-layout-and-playback-stability.md), [`0033`](0033-fix-widget-display-preference-layout.md), [`0035`](0035-fix-hover-progress-and-connection-badge.md), [`0012`](0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md)
- Related report: [`0034`](../reports/0034-fix-playback-controls-hover-mode.md)
- Time log: [`time-log.md`](../time-log.md)
- Branch: `codex/0034-fix-playback-controls-hover-mode`
