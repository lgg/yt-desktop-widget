# 0014 - Restore settings window dragging on empty frame areas

## Status

Completed

## Source

- Migrated from Beads issue: `ytw-l48.5`
- Type: Bug
- Priority: P2
- Created: 2026-03-11T09:08:41Z
- Updated: 2026-03-11T09:13:04Z
- Assignee: unknown
- Created by: unknown

## Context

The settings window can no longer be dragged from empty areas near the outer frame and bottom padding. Restore dragging on non-interactive empty surfaces without breaking close button or form interactions.

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

- Backend: Potentially affected.
- Frontend: Potentially affected.
- Database/migrations: Not applicable for this desktop app unless a future task says otherwise.
- API/contracts: Not known from Beads context.
- Tests: Verification should follow the task-specific plan below.
- Documentation: Update README, architecture notes, decisions, and project-tracking files when behavior or process changes.
- Deploy/config: Not known from Beads context.
- Other: Windows-first Tauri runtime behavior may be relevant.

## Acceptance Criteria

- [x] The original Beads issue state is represented in markdown.
- [x] Relevant implementation, documentation, and verification notes are captured or linked.
- [x] If new work is done, update related code, tests, documentation, config, roadmap, task, and report files together.
- [x] No known mismatch remains between UI, native backend, Companion API assumptions, tests, and docs.

## Verification Plan

- [x] Lint/static checks: `npm run verify` passed in task `0036`.
- [x] Tests: settings interaction and browser smoke tests passed in task `0036`.
- [x] Build: `npm run build:desktop` passed for version `2.0.0`.
- [x] Manual QA: the user confirmed the latest portable settings behavior works correctly on 2026-07-13.
- [x] Deploy/config review: Tauri window configuration and no-drag interactive surfaces remain aligned.
- [x] Documentation review: roadmap and closing report `0036` were synchronized.

## Progress History

- 2026-03-11: Restored drag-region on the settings window shell, removed no-drag from the scroll container itself, and kept the actual settings cards as no-drag so empty frame/bottom areas can drag again without breaking controls. Rebuilt portable exe after verify/cargo check/build:desktop. Awaiting user runtime confirmation.
- 2026-07-13: The user confirmed the latest portable settings window works correctly; a fresh `2.0.0` desktop build and regression suite passed in task `0036`. Closed.

## Dependencies

- parent-child: ytw-l48 (created 2026-03-11T12:08:41Z)

## Related Markdown Links

- parent-child: ytw-l48 -> [`0001-stabilize-current-widget-interaction-regressions.md`](../tasks/0001-stabilize-current-widget-interaction-regressions.md)

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
- Closing report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
