# 0041 - Equalize widget height, enable surface drag, and add LIVE badge modes

## Status

Completed

## Context

The compact artwork-only layout is taller than the otherwise equivalent layout with the progress row enabled. The lower empty surface in the artwork-only layout also cannot drag the frameless widget because only the header and hero are marked as drag regions. The existing `hideConnectionBadge` boolean represents only always-visible and hover-only behavior, while the requested UI needs explicit always, hover, and fully-hidden modes. This pass follows tasks `0038`-`0040` and includes a fresh repository-wide quality audit.

## Goal

Keep the compact widget at one stable height whether the progress row is enabled or disabled, make non-interactive widget surface draggable, and expose a persisted localized three-mode LIVE badge preference without regressing existing settings. Audit the complete project and fix any additional verified defects found in scope.

## Scope

Included:

- reproduce and measure both compact layout variants;
- equalize the intrinsic/native widget height while preserving balanced spacing;
- make blank widget surface, including the lower area, draggable while keeping controls interactive;
- replace the ambiguous connection-badge boolean with `always`, `hover`, and `hidden` modes;
- migrate legacy `hideConnectionBadge` values (`false` to `always`, `true` to `hover`);
- update TypeScript, Rust, persistence, settings UI, English/Russian localization, tests, docs, and project tracking;
- audit frontend, native/runtime, settings propagation, i18n, themes, versioning, permissions, dependencies, and build output.

Out of scope:

- changing Companion protocol behavior without a verified audit finding;
- adding new widget size presets, manual resize, installers, macOS support, or telemetry;
- changing the current portable-only release policy.

## Affected Areas

- Backend/native: settings serialization/migration and existing window sizing command contract.
- Frontend: compact layout, drag surface, Settings UI, LIVE badge rendering.
- Domain/API contracts: `UiSettings` connection badge visibility type.
- Tests: component, repository, provider, E2E geometry/interaction, and Rust compatibility tests.
- Documentation: README, roadmap, task/report, time log.
- Build/release/config: Tauri capability and version/build output audit; no planned policy change.
- Project tracking: task `0041`, report `0041`, roadmap snapshot, time log.
- Other: English/Russian locale parity and accessibility of the three-state control.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-14-0041-a`                              |
| Started at         | `2026-07-14T00:22:58.2728382+03:00`              |
| Finished at        | `2026-07-14T00:58:58.2820189+03:00`              |
| Time spent minutes | `37`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-14-0041-a` |

## Acceptance Criteria

- [x] The compact connected widget requests the same height, within one CSS pixel, with progress enabled and disabled under the user-reported display settings.
- [x] Artwork, header, and progress spacing remain visually balanced and artwork stays horizontally centered.
- [x] Primary-button dragging from blank lower widget surface invokes native window dragging; buttons, artwork playback control, progress slider, and other interactive elements remain non-drag targets.
- [x] LIVE badge visibility offers exactly `Always`, `On hover`, and `Hidden` modes with accessible selection semantics.
- [x] `Hidden` never renders/reveals the badge on hover and does not introduce a layout or height shift.
- [x] Existing `hideConnectionBadge: false/true` settings migrate to `always/hover` in browser and native persistence.
- [x] New settings persist and propagate between windows without stale equality checks.
- [x] English and Russian locale keys remain structurally identical and no new visible UI text is hardcoded.
- [x] Repository-wide audit findings are documented and all verified in-scope defects are fixed or explicitly reported with rationale.
- [x] Full frontend, E2E, Rust, and portable desktop build checks pass, or any blocker is recorded precisely.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, focused TypeScript/Vitest checks, locale/version audits, `git diff --check`.
- [x] Tests: RED/GREEN component and repository tests, full Vitest, Playwright E2E, Rust tests.
- [x] Build: `cargo check -j1`, `npm run build:desktop`, portable EXE metadata review.
- [x] Manual QA: document the one native physical-drag observation that browser automation cannot perform.
- [x] Documentation review: README, task, report, roadmap, time log, and bootstrap-sync consistency.
- [x] Release/config review: Tauri permissions, portable-only policy, package version sources, dependency audit.
- [x] Time tracking review: matching core fields in task, report, and time log.

## Questions and Answers

| Question                                     | Status   | Answer / Decision                                                                                                                                                                  |
| -------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which compact height should be retained?     | Resolved | Preserve the taller artwork-only envelope shown by the user and expand the progress variant to the same stable height; avoid shrinking the more spacious artwork-only composition. |
| How should legacy badge settings migrate?    | Resolved | `hideConnectionBadge: false` becomes `always`; `true` becomes `hover`; only the new explicit value can select `hidden`.                                                            |
| Should fully hidden remove the badge anchor? | Resolved | Remove the visible badge from rendering but preserve a draggable header surface and stable layout geometry.                                                                        |

## Risks

| Risk                                                          | Impact                                         | Mitigation                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A parent drag region could steal pointer input from controls. | Playback/settings controls could stop working. | Keep interactive descendants as explicit no-drag targets and cover component/E2E interaction paths. |
| Changing settings schema could reset existing preference.     | Users lose hover-only behavior.                | Accept legacy boolean values in both TypeScript and Rust and test both mappings.                    |
| Fixed compact height could clip non-compact/error states.     | Runtime content could be cut off.              | Scope the minimum only to connected compact layouts and retain intrinsic sizing elsewhere.          |
| Broad audit creates unrelated churn.                          | Higher regression risk.                        | Fix only reproduced or evidence-backed issues and record the audit boundary in the report.          |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `DECISIONS.md` decisions 7, 11, and 12
- Related reports: `project-tracking/reports/0039-balance-widget-vertical-spacing-and-header-alignment.md`, `project-tracking/reports/0040-fix-settings-drag-and-add-transparency-controls.md`, `project-tracking/reports/0041-equalize-widget-height-enable-surface-drag-and-add-live-badge-modes.md`
- Time log: `project-tracking/time-log.md#2026-07-14-0041-a`
- PR/commit: branch `codex/0041-widget-height-drag-live-chip-audit`; pending
