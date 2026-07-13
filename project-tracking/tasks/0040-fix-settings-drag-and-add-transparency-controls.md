# 0040 - Fix settings drag and add transparency controls

## Status

Completed

## Context

After the Settings content is scrolled away from the top, the visible Settings header can no longer drag the frameless window even though dragging works at scroll position zero. The appearance settings also do not expose the existing window surface, artwork-derived background, or gradient-overlay transparency.

This task follows the settings drag-region work in task `0014` and the display/localization work in tasks `0036` and `0038`.

## Goal

Keep the Settings header draggable at every scroll position and add persisted, localized transparency controls whose defaults reproduce the current appearance exactly.

## Scope

Included:

- identify and fix the root cause of the scroll-dependent Settings header drag failure;
- add a separate appearance/transparency section immediately before Window / Behavior;
- expose window-surface opacity, artwork-background opacity, and gradient-overlay intensity;
- show the current percentage and provide an individual reset-to-default action for every control;
- persist and normalize the three settings in browser and native settings contracts;
- apply the values live to both widget and Settings windows without reducing text/control legibility;
- add English and Russian localization and automated regression coverage.

Out of scope:

- changing native window opacity APIs or broad Tauri window permissions; the narrowly scoped `core:window:allow-start-dragging` capability required by the fix is included;
- changing the current default visual treatment;
- adding new artwork filters, blur controls, resize modes, or packaging formats.

## Affected Areas

- Backend/native: persisted Rust `UiSettings` contract and compatibility tests.
- Frontend: Settings header interaction, appearance controls, shared CSS variables, both window roots.
- Domain/API contracts: `AppSettings.ui` and settings normalization/defaults.
- Tests: component, repository, browser geometry/interaction, and native settings tests.
- Documentation: README, roadmap, task, report, and time log.
- Build/release/config: validation only; portable-only policy remains unchanged.
- Project tracking: task `0040`, matching report, roadmap, and time log.
- Other: frameless-window pointer/drag behavior and accessibility of range controls.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0040-a`                              |
| Started at         | `2026-07-13T23:40:05.7243175+03:00`              |
| Finished at        | `2026-07-14T00:11:51.5559961+03:00`              |
| Time spent minutes | `32`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0040-a` |

## Acceptance Criteria

- [x] The visible Settings header starts native window dragging from non-interactive header space before and after scrolling.
- [x] Header drag handling never captures the close button or any form control.
- [x] A dedicated localized transparency section appears immediately before Window / Behavior.
- [x] Window surface, artwork background, and gradient overlay can each be adjusted from `0%` to `100%`, display their value, persist, and reset individually.
- [x] Current visuals are preserved by the default values, and content such as text and controls does not become translucent with the window-surface setting.
- [x] Missing, invalid, and out-of-range persisted values safely normalize to supported values in both browser and native paths.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, tests, docs, and release/config.

## Verification Plan

- [x] Root-cause reproduction: inspected the separate scroll container and persistent header, then added a failing explicit-drag regression.
- [x] Focused frontend tests: Settings UI, settings repository/defaults, CSS-variable application, provider equality, and localization parity.
- [x] Browser smoke: scrolled Settings, measured the persistent header hit area, exercised all ranges, reload persistence, and reset.
- [x] Native tests: Rust settings defaults, legacy compatibility, and JSON serialization.
- [x] Static/full frontend: `npm run verify` passed with 70 tests.
- [x] Native: 19 Rust tests and `cargo check -j1` passed.
- [x] Build: `npm run build:desktop` passed.
- [x] Manual QA: browser layout/interaction was verified; physical OS-level movement is explicitly left for the user's portable smoke.
- [x] Documentation, release-policy, and time-tracking review.

## Questions and Answers

| Question                                                 | Status   | Answer / Decision                                                                                                       |
| -------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Should “window transparency” fade controls and text too? | Resolved | No. It controls the shared window surface layer so controls remain legible; artwork and overlay have separate controls. |
| What are the defaults?                                   | Resolved | Each new multiplier defaults to `100%`, which leaves the current CSS appearance unchanged.                              |
| Is a new native window-opacity command required?         | Resolved | No. The existing transparent Tauri window already renders CSS-composited layers; this task changes those layers only.   |

## Risks

| Risk                                                        | Impact | Mitigation                                                                                                                |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| A CSS-only drag marker still fails in WebView after scroll. | High   | Replaced the header's passive marker with an explicit, narrowly permitted native drag call on the non-interactive anchor. |
| Surface opacity accidentally fades content.                 | Medium | Isolate the surface in a pointer-transparent pseudo-layer below content and test computed CSS variables.                  |
| Legacy settings deserialize new numeric fields as zero.     | High   | Add explicit native defaults and legacy JSON tests before implementation.                                                 |
| Range changes cause excessive disk writes.                  | Medium | Reuse the existing settings update path and validate interaction behavior; do not introduce parallel persistence state.   |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0014-restore-settings-window-dragging-on-empty-frame-areas.md`](0014-restore-settings-window-dragging-on-empty-frame-areas.md)
- Related task: [`0036-add-display-controls-localization-and-central-versioning.md`](0036-add-display-controls-localization-and-central-versioning.md)
- Related report: [`0040-fix-settings-drag-and-add-transparency-controls.md`](../reports/0040-fix-settings-drag-and-add-transparency-controls.md)
- Time log: [`time-log.md`](../time-log.md)
- PR/commit: branch `codex/0040-settings-drag-transparency-controls`; commit/merge pending at report write
