# 0042 - Fix stuck hover and control jitter

## Status

Completed

## Context

After task `0041` expanded the widget drag region and added three LIVE badge modes, live portable testing reports that hover-only UI can remain stuck visible and that window controls jerk or repeatedly redraw. The regression affects a core frameless-window interaction and requires evidence from pointer-event, drag-region, layout-height, and render behavior before any fix is selected.

## Goal

Restore deterministic hover enter/leave behavior without size changes or control jitter, preserve blank-surface window dragging, and complete a fresh audit of the connected UI/runtime path for related regressions.

## Scope

Included:

- reproduce the stuck hover in browser/E2E and compare it with the native drag-region implementation;
- inspect pointer enter/leave semantics, CSS app-region behavior, hidden control hit areas, height synchronization, and repeated renders;
- add RED/GREEN component and browser regressions for the confirmed cause;
- fix all evidence-backed hover, layout, drag, and redraw defects found in scope;
- re-audit settings persistence, LIVE modes, localization, themes, versioning, Tauri permissions, dependencies, and portable build output;
- update README/project tracking when behavior or audit state changes.

Out of scope:

- changing Companion protocol/auth behavior without a reproduced finding;
- redesigning the widget, adding new display modes, or changing portable-only packaging;
- broad dependency major upgrades unrelated to the reported interaction.

## Affected Areas

- Backend/native: Tauri window dragging/height interaction if implicated.
- Frontend: hover state ownership, drag surfaces, window actions, artwork overlay, transport controls, layout sizing.
- Domain/API contracts: not expected; update only if investigation proves necessary.
- Tests: widget components, E2E pointer/geometry/runtime regressions.
- Documentation: task, report, roadmap, time log, README if behavior wording changes.
- Build/release/config: permissions and portable executable audit; policy unchanged.
- Project tracking: task/report `0042`, roadmap snapshot, time log.
- Other: accessibility and reduced-motion/focus behavior around hidden controls.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-14-0042-a`                              |
| Started at         | `2026-07-14T01:08:40.6070516+03:00`              |
| Finished at        | `2026-07-14T01:44:20.9521561+03:00`              |
| Time spent minutes | `36`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-14-0042-a` |

## Acceptance Criteria

- [x] Hover-only widget controls reliably become visible on entry and hidden after exit, including repeated rapid boundary crossings.
- [x] LIVE `On hover` follows the same deterministic lifecycle; `Always` and `Hidden` remain unaffected.
- [x] Hover transitions do not alter requested widget height, reflow the layout, or move button hit targets.
- [x] Buttons and artwork overlay do not flicker, jerk, or remount during ordinary playback progress updates.
- [x] Blank lower/header/artwork surfaces remain draggable while interactive controls remain no-drag.
- [x] Pointer/focus accessibility remains usable and motion preferences are respected.
- [x] Regression tests fail before the fix and pass after it.
- [x] All repository audit findings are fixed or documented with evidence and rationale.
- [x] Full frontend, Playwright, Rust, dependency, and desktop-build checks pass or blockers are precisely recorded.
- [x] Task, report, roadmap, time log, and relevant documentation agree.
- [x] No mismatch remains between frontend, native backend, settings persistence, tests, and release configuration.

## Verification Plan

- [x] Capture baseline event/class/geometry behavior with Playwright under repeated enter/leave cycles.
- [x] Run focused RED/GREEN Vitest and Playwright regressions.
- [x] Run `npm run verify`, full Playwright, Rust tests/Clippy/check, dependency audits, and `npm run build:desktop`.
- [x] Inspect EXE version/hash and document native physical-hover limitations.
- [x] Run Prettier checks and `git diff --check`.
- [x] Reconcile task/report/roadmap/time log before commit.

## Questions and Answers

| Question                                             | Status   | Answer / Decision                                                                                                                                   |
| ---------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is the new full-layout drag region the root cause?   | Resolved | Yes. Native `app-region: drag` covered the hover boundary and changed hit testing when controls became interactive; it was removed from the widget. |
| Should hover remain React pointer-state driven?      | Resolved | Yes, with one stable outer boundary, explicit window-blur reset, pointer-move recovery, and keyboard-focus state.                                   |
| Can hidden controls retain interactive hit surfaces? | Resolved | They stay mounted at fixed geometry but use `opacity: 0` and `pointer-events: none`; keyboard focus explicitly reveals them.                        |

## Risks

| Risk                                                 | Impact                                      | Mitigation                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Removing a drag region may regress window movement.  | Blank artwork/lower areas stop dragging.    | Delegate one explicit primary-button handler from the layout and reject interactive descendants by selector; cover both paths with tests. |
| CSS-only visibility can harm keyboard accessibility. | Hidden controls remain focusable/invisible. | Verify focus semantics and keep hover/focus-visible behavior explicit.                                                                    |
| Playback updates can obscure the true cause.         | Fix targets symptoms rather than source.    | Count renders/remounts and separate progress updates from pointer-state transitions before implementing.                                  |
| Broad audit causes unrelated churn.                  | New regressions.                            | Fix only reproduced/evidence-backed issues; document incompatible dependency work separately.                                             |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related tasks: `project-tracking/tasks/0035-fix-hover-progress-and-connection-badge.md`, `project-tracking/tasks/0041-equalize-widget-height-enable-surface-drag-and-add-live-badge-modes.md`
- Related reports: `project-tracking/reports/0035-fix-hover-progress-and-connection-badge.md`, `project-tracking/reports/0041-equalize-widget-height-enable-surface-drag-and-add-live-badge-modes.md`
- Time log: `project-tracking/time-log.md#2026-07-14-0042-a`
- Report: `project-tracking/reports/0042-fix-stuck-hover-and-control-jitter.md`
- PR/commit: branch `codex/0042-fix-stuck-hover-jitter-audit`; commit/merge pending at report write
