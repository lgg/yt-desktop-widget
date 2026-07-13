# 0005 - Track deferred post-v1 roadmap items

## Status

Deferred

## Source

- Migrated from Beads issue: `ytw-5v6`
- Type: Epic
- Priority: P3
- Created: 2026-03-11T03:28:04Z
- Updated: 2026-03-11T03:28:04Z
- Assignee: Unassigned
- Created by: unknown

## Context

Collect the medium-term and deferred work that was intentionally left out of the current portable-first Windows testing cycle so future implementation passes can pick it up explicitly.

## Goal

Preserve and continue the work described by the migrated Beads issue in the markdown project-tracking system.

## Scope

Included:

- Keep the original Beads context, status, priority, dependencies, and history visible in markdown.
- Continue or verify the product work described by this task according to the current project rules.

Out of scope:

- Reopening Beads as the source of truth.
- Expanding scope beyond the migrated issue without creating or updating another markdown task.

## Affected Areas

- Backend: Not known from Beads context.
- Frontend: Not known from Beads context.
- Database/migrations: Not applicable for this desktop app unless a future task says otherwise.
- API/contracts: Not known from Beads context.
- Tests: Verification should follow the task-specific plan below.
- Documentation: Update README, architecture notes, decisions, and project-tracking files when behavior or process changes.
- Deploy/config: Not known from Beads context.
- Other: Windows-first Tauri runtime behavior may be relevant.

## Acceptance Criteria

- [x] The original Beads issue state is represented in markdown.
- [x] Relevant implementation, documentation, and verification notes are captured or linked.
- [x] Delivered child work is reflected in code, tests, documentation, config, roadmap, tasks, and reports.
- [x] Remaining future work is represented by explicit deferred child tasks without an active open umbrella.

## Verification Plan

- [ ] Lint/static checks: run `npm run lint` or `npm run verify` when code changes.
- [ ] Tests: run `npm test`; add targeted tests for changed logic.
- [ ] Build: run `npm run build:desktop` for release/runtime-sensitive changes.
- [ ] Manual QA: verify the affected widget/settings/Companion scenario on Windows when automation cannot cover it.
- [ ] Deploy/config review: review Tauri permissions, startup behavior, packaging, and env/config docs when touched.
- [ ] Documentation review: update README, ARCHITECTURE, decisions, roadmap, tasks, and reports as applicable.

## Progress History

- No progress notes were recorded in Beads.
- 2026-07-13: Live Companion validation (`0008`) and English/Russian localization (`0010`) are completed. The remaining size presets, macOS, installer, alternate-mode, and diagnostics children remain intentionally deferred, so this umbrella moves from Open to Deferred.

## Dependencies

- None recorded.

## Related Markdown Links

- child: ytw-5v6.3 -> [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md)
- child: ytw-5v6.7 -> [`0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md`](../tasks/0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md)
- child: ytw-5v6.6 -> [`0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md`](../tasks/0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md)
- child: ytw-5v6.4 -> [`0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md`](../tasks/0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md)
- child: ytw-5v6.1 -> [`0006-add-future-widget-size-presets-and-manual-resize-support.md`](../tasks/0006-add-future-widget-size-presets-and-manual-resize-support.md)
- child: ytw-5v6.5 -> [`0010-expand-localization-beyond-the-english-only-v1-bundle.md`](../tasks/0010-expand-localization-beyond-the-english-only-v1-bundle.md)
- child: ytw-5v6.2 -> [`0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md`](../tasks/0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md)

## Questions and Answers

| Question                                        | Status | Answer / Decision                                                                                       |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Are there missing details from the Beads issue? | Open   | Use the raw archive in `project-tracking/archive/beads-export-2026-07-05.jsonl` as the source fallback. |

## Risks

| Risk                                                  | Impact | Mitigation                                                                       |
| ----------------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Migrated task loses subtle Beads context.             | Medium | Keep the raw JSONL archive and the progress history in this file.                |
| Runtime behavior differs from documented assumptions. | Medium | Verify with portable Windows build and live YTMDesktop Companion where required. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Raw Beads export: [`beads-export-2026-07-05.jsonl`](../archive/beads-export-2026-07-05.jsonl)
- Reconciliation report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
