# 0043 - Add widget size presets and custom dimensions

## Status

Completed

## Context

The widget currently has one fixed 336 px window width and a 256 px cover-driven layout. The deferred task [`0006`](0006-add-future-widget-size-presets-and-manual-resize-support.md) reserved future size presets and manual resize support. The user has now requested that work, with the current visual state preserved exactly as the default and every widget element scaling proportionally instead of only enlarging the window background.

The clarified product contract keeps built-in Compact, Default, and Large modes and adds Custom. In Custom, the user can edit either width or height; the other dimension is derived from the current canonical `336 x 438` widget proportion.

## Goal

Add persisted widget size presets and linked custom width/height controls while preserving the current 336 px layout as the unchanged Default mode and uniformly scaling the complete widget UI and intrinsic state-dependent height.

## Scope

Included:

- Add Compact (85%), Default (100%), Large (125%), and Custom widget size modes.
- Add linked Custom width and height fields with a safe 75%-150% scale range.
- Preserve the canonical 336 x 438 proportion when either custom dimension changes.
- Uniformly scale artwork, typography, controls, spacing, progress UI, and window dimensions.
- Continue deriving the widget's height from its visible content and state before applying the selected scale.
- Persist, normalize, migrate, and synchronize the new settings across app windows.
- Localize all new settings copy in English and Russian.
- Expand the native Tauri window-size contract and safe dimension bounds.
- Add component, repository, E2E, and Rust coverage for the new behavior.

Out of scope:

- Free non-proportional stretching.
- Mouse-driven resizing from the frameless window border.
- Changing the current Default layout, spacing, or behavior.
- macOS support or installer packaging changes.

## Affected Areas

- Backend/native: Tauri size command, persisted settings model, main-window bounds.
- Frontend: Settings UI, widget scale calculation, layout transform, cross-window synchronization.
- Domain/API contracts: `UiSettings` and Tauri command payload.
- Tests: Vitest component/repository tests, Playwright geometry/persistence coverage, Rust model and sizing tests.
- Documentation: README, architecture decision, roadmap, task/report.
- Build/release/config: Tauri main-window min/max dimensions only; packaging policy remains unchanged.
- Project tracking: roadmap task `0006`, this task/report, decision `0004`, and time log.
- Other: Accessibility of segmented mode controls and custom numeric inputs.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0043-a` |
| Started at | `2026-07-14T02:06:04.2429391+03:00` |
| Finished at | `2026-07-14T02:56:22.7783024+03:00` |
| Time spent minutes | `51` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0043-a` |

## Acceptance Criteria

- [x] Existing installations without size fields normalize to Default at 100% and retain the exact current visual dimensions.
- [x] Settings contains a separate Widget Size block with Compact, Default, Large, and Custom modes.
- [x] Custom exposes editable width and height; editing either recalculates the other using the canonical 336 x 438 ratio.
- [x] Custom dimensions are constrained to the documented 75%-150% range and remain valid after persistence/reload.
- [x] Artwork, text, controls, gaps, progress UI, hit targets, and window size scale by one uniform factor.
- [x] State- and preference-dependent intrinsic widget height remains correct at every mode.
- [x] The Settings window itself is not scaled by the widget size preference.
- [x] English and Russian locale files contain every new user-facing string.
- [x] Tauri accepts safe width and height updates without enabling free border resize.
- [x] Targeted frontend, E2E, Rust, static, security/dependency, and desktop release-link checks pass; the standard output path remained locked by the running app and is documented in the report.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`.
- [x] Tests: targeted Vitest RED/GREEN passes, full frontend tests, Playwright E2E, Rust tests.
- [x] Build: `cargo check -j1`; release code linked successfully to an alternate verification executable because the running widget locked the standard desktop output.
- [ ] Manual QA: inspect Default parity and all size modes in a newly rebuilt Windows portable executable after closing the currently running widget.
- [x] Documentation review: reconcile README, roadmap, task, report, decision, and time log.
- [x] Release/config review: confirm only safe main-window bounds changed and portable-only packaging remains intact.
- [x] Time tracking review: confirm matching iteration fields in task, report, and time log.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should built-in presets remain alongside Custom? | Resolved | Yes: Compact 85%, Default 100%, and Large 125%, plus Custom. |
| Can Custom distort the widget by changing width and height independently? | Resolved | No. Both fields are editable, but the other field recalculates to preserve the canonical 336 x 438 proportion. |
| What should happen to dynamic heights when sections are hidden? | Resolved | Continue measuring the intrinsic base layout, then apply the same uniform scale factor to the measured height. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Default mode shifts the already approved layout. | High | Use scale `1` and canonical width `336`; add exact default-parity tests. |
| Only the native window grows while child UI stays fixed. | High | Scale one base layout wrapper uniformly and test child geometry ratios. |
| CSS transforms break pointer or progress seeking math. | Medium | Preserve pointer hit testing through transformed bounding rectangles and cover scrubber interactions in E2E/component tests. |
| Settings and native models disagree after migration. | High | Add defaults/normalization in TypeScript and Rust plus serialization/migration tests. |
| Rapid input produces invalid or oscillating sizes. | Medium | Store one canonical percentage, clamp once, and derive both displayed dimensions from it. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Parent task: [`0006-add-future-widget-size-presets-and-manual-resize-support.md`](0006-add-future-widget-size-presets-and-manual-resize-support.md)
- Related decisions: [`0004-use-uniform-widget-scaling-for-size-modes.md`](../decisions/0004-use-uniform-widget-scaling-for-size-modes.md)
- Related reports: [`0043-add-widget-size-presets-and-custom-dimensions.md`](../reports/0043-add-widget-size-presets-and-custom-dimensions.md)
- Time log: [`time-log.md`](../time-log.md#2026-07-14-0043-a)
- PR/commit: branch `codex/0043-widget-size-presets-custom-dimensions`
