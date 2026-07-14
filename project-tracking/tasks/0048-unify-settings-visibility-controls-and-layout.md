# 0048 - Unify Settings visibility controls and layout

## Status

Implementation Complete - Git Delivery Pending

## Context

Live review of version `3.1.0` exposed two Settings consistency problems. Settings/Close visibility still use legacy boolean switches while the adjacent Mute preference uses segmented choices, and four-mode block controls wrap as three choices on the first row plus `Hidden` alone on the second row.

The same review found that WMS is denied for the portable/unpackaged process. The user asked to leave that runtime/packaging decision for later, so the evidence and future work were split into deferred task `0049` without mixing release-policy changes into this UI pass.

## Goal

Present Settings and Close visibility as `Always` / `On hover` segmented controls and make all four-mode visibility selectors use two intentional rows, while preserving every existing persisted setting and widget behavior.

## Scope

Included:

- Replace the Settings/Close toggle presentation with the same segmented-control visual language used by Mute.
- Offer exactly two choices for each button: `Always` and `On hover`; no `Hidden` mode.
- Map choices directly to the existing `hideSettingsButton` / `hideCloseButton` booleans without a data migration.
- Render four-mode block visibility as row 1 `Always` + `Hidden`, row 2 both `On hover` variants.
- Keep layout deterministic at supported Settings widths and across English/Russian labels.
- Add accessibility, component, E2E/layout, localization, theme, and persistence regressions.
- Update roadmap, task/report, time log, and perform full validation/delivery.

Out of scope:

- Windows Media Session runtime or packaging changes; deferred to task `0049`.
- A fully hidden Settings/Close mode.
- Changes to stored visibility types, widget block ordering, or hover semantics.
- Installer/MSIX changes.

## Affected Areas

- Backend/native: no behavior change expected; settings contract must remain compatible.
- Frontend: Settings visibility controls and four-mode selector layout.
- Domain/API contracts: existing booleans and visibility enums remain unchanged.
- Tests: Settings component, persistence, locale parity, Playwright layout.
- Documentation: README UI behavior if wording needs clarification.
- Build/release/config: no version or packaging change.
- Project tracking: task/report `0048`, deferred task `0049`, roadmap, time log.

## Time Tracking

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Iteration ID       | `2026-07-14-0048-a`                                  |
| Started at         | `2026-07-14T06:59:46.0008978+03:00`                  |
| Finished at        | `pending`                                            |
| Time spent minutes | `pending`                                            |
| Tracking status    | `tracked`                                            |
| Time log row       | `project-tracking/time-log.md` (`2026-07-14-0048-a`) |

## Acceptance Criteria

- [x] Settings and Close preferences render as accessible `Always` / `On hover` segmented controls with no `Hidden` option.
- [x] Existing `false` values select `Always`; existing `true` values select `On hover`; clicking either choice persists the corresponding boolean.
- [x] Widget Settings/Close visibility and hover/focus behavior remain unchanged.
- [x] Every four-mode selector exposes `Always` and `Hidden` in its first visual row and the two hover modes in its second visual row.
- [x] The two-row grouping remains deterministic at supported Settings widths and with English/Russian labels.
- [x] Theme, keyboard navigation, Settings scrolling/dragging, section collapsing, sizing, block ordering, and all unrelated controls do not regress.
- [x] Locale JSON remains complete and parity-tested; no user-facing text is hardcoded in React.
- [x] No new persistence, permission, network, telemetry, secret, or packaging surface is introduced.
- [x] Related code, tests, docs, roadmap, task/report, time-log, and Definition of Done are reconciled.
- [ ] Work is committed by `lgg`, pushed, merged into `master`, and `master` pushed after all checks pass.

## Verification Plan

- [x] Add RED Settings component tests for roles, labels, selected values, and persistence mapping.
- [x] Add RED layout/E2E assertions for explicit row grouping and supported window widths.
- [x] Run focused Settings tests during implementation.
- [x] Run `npm run verify`, `cargo test -j1`, `cargo check -j1`, and strict Clippy.
- [x] Run `npm run test:e2e` and inspect Settings geometry.
- [x] Run dependency/security checks and static scan.
- [x] Run `npm run build:desktop` and inspect version metadata.
- [x] Review docs, release/config, git diff, task/report/roadmap/time-log, and DoD.

## Questions and Answers

| Question                                                       | Status   | Answer / Decision                                                                                 |
| -------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| Should Settings/Close gain a fully hidden mode?                | Resolved | No. The user explicitly requested Mute-style presentation without the `Hidden` option.            |
| Should the stored booleans be replaced with a visibility enum? | Resolved | No. Directly map `false=Always`, `true=On hover` to preserve compatibility without migration.     |
| Should WMS packaging be changed in this pass?                  | Resolved | No. The user explicitly deferred it; task `0049` preserves the evidence and decision requirement. |

## Risks

| Risk                                                  | Impact | Mitigation                                                                                     |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| UI presentation accidentally changes stored behavior. | Medium | Keep existing boolean fields and test both initial states plus both click mappings.            |
| Long localized labels break the intended rows.        | Medium | Use explicit semantic row wrappers/grid rather than relying on incidental flex wrapping.       |
| Shared selector CSS regresses unrelated controls.     | Medium | Scope the two-row rule to four-mode visibility controls and retain generic segmented behavior. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Parent UI task: [`0044-add-v3-customizable-widget-blocks-and-playback-actions.md`](0044-add-v3-customizable-widget-blocks-and-playback-actions.md)
- Deferred WMS follow-up: [`0049-add-supported-packaged-wms-delivery.md`](0049-add-supported-packaged-wms-delivery.md)
- Report: [`0048-unify-settings-visibility-controls-and-layout.md`](../reports/0048-unify-settings-visibility-controls-and-layout.md)
- Time log: [`time-log.md`](../time-log.md)
- PR/commit: branch `codex/0048-fix-wms-apple-music-settings-modes`; pending
