# 0001 - Stabilize current widget interaction regressions

## Status

Open

## Source

- Migrated from Beads issue: `ytw-l48`
- Type: Epic
- Priority: P1
- Created: 2026-03-11T03:15:10Z
- Updated: 2026-03-11T03:15:10Z
- Assignee: Unassigned
- Created by: unknown

## Context

Track the current set of user-reported regressions before the next implementation pass. This umbrella issue groups the open widget problems that must be handled through beads first.

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
- Frontend: Potentially affected.
- Database/migrations: Not applicable for this desktop app unless a future task says otherwise.
- API/contracts: Not known from Beads context.
- Tests: Verification should follow the task-specific plan below.
- Documentation: Update README, architecture notes, decisions, and project-tracking files when behavior or process changes.
- Deploy/config: Not known from Beads context.
- Other: Windows-first Tauri runtime behavior may be relevant.

## Acceptance Criteria

- [ ] The original Beads issue state is represented in markdown.
- [ ] Relevant implementation, documentation, and verification notes are captured or linked.
- [ ] If new work is done, update related code, tests, documentation, config, roadmap, task, and report files together.
- [ ] No known mismatch remains between UI, native backend, Companion API assumptions, tests, and docs.

## Verification Plan

- [ ] Lint/static checks: run `npm run lint` or `npm run verify` when code changes.
- [ ] Tests: run `npm test`; add targeted tests for changed logic.
- [ ] Build: run `npm run build:desktop` for release/runtime-sensitive changes.
- [ ] Manual QA: verify the affected widget/settings/Companion scenario on Windows when automation cannot cover it.
- [ ] Deploy/config review: review Tauri permissions, startup behavior, packaging, and env/config docs when touched.
- [ ] Documentation review: update README, ARCHITECTURE, decisions, roadmap, tasks, and reports as applicable.

## Progress History

- No progress notes were recorded in Beads.

## Dependencies

- None recorded.

## Related Markdown Links

- child: ytw-l48.2 -> [`0003-fix-main-widget-close-button-honoring-the-configured-action.md`](../tasks/0003-fix-main-widget-close-button-honoring-the-configured-action.md)
- child: ytw-l48.1 -> [`0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md`](../tasks/0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md)
- child: ytw-l48.5 -> [`0014-restore-settings-window-dragging-on-empty-frame-areas.md`](../tasks/0014-restore-settings-window-dragging-on-empty-frame-areas.md)
- child: ytw-l48.4 -> [`0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`](../tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md)
- child: ytw-l48.3 -> [`0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md`](../tasks/0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md)

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Are there missing details from the Beads issue? | Open | Use the raw archive in `project-tracking/archive/beads-export-2026-07-05.jsonl` as the source fallback. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migrated task loses subtle Beads context. | Medium | Keep the raw JSONL archive and the progress history in this file. |
| Runtime behavior differs from documented assumptions. | Medium | Verify with portable Windows build and live YTMDesktop Companion where required. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Raw Beads export: [`beads-export-2026-07-05.jsonl`](../archive/beads-export-2026-07-05.jsonl)
