# 0002 - Resize the main widget window to fit reconnect and error state cards

## Status

Completed

## Source

- Migrated from Beads issue: `ytw-l48.1`
- Type: Bug
- Priority: P1
- Created: 2026-03-11T03:15:50Z
- Updated: 2026-03-11T07:09:52Z
- Assignee: Unassigned
- Created by: unknown

## Context

When the reconnect or error state card appears at the bottom of the main widget, the card and button can extend past the lower edge of the transparent window. The widget window height should be recalculated so the full state card remains visible after state transitions and reconnect actions.

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
- [x] Tests: component and Playwright height regressions passed in task `0036`.
- [x] Build: `npm run build:desktop` passed for version `2.0.0`.
- [x] Manual QA: the user confirmed correct latest-portable layout behavior on 2026-07-13.
- [x] Deploy/config review: Tauri auto-height permission/config remain aligned.
- [x] Documentation review: roadmap and closing report `0036` were synchronized.

## Progress History

- 2026-03-11: Root cause also affected auto-height. The widget was not permitted to invoke set_main_window_height, so the reconnect/error card overflow fix could not apply at runtime. Added the missing permission in src-tauri/permissions/default.toml and rebuilt after verify/cargo check/build:desktop. Awaiting user runtime confirmation.
- 2026-07-09: Task `0032` found the remaining shrink failure: auto-height measured a `height: 100%` viewport container, making the current expanded window height a permanent lower bound. Measurement now uses only intrinsic layout height, and focused plus browser tests cover shrink-back behavior. Awaiting confirmation in the new portable build.
- 2026-07-09: Task `0033` fixed the display-preference shrink path: hidden controls/progress are no longer rendered into the connected footer, and settings changes explicitly resync intrinsic Tauri height. Browser smoke coverage verifies compact height changes for hidden controls, hidden progress, and both hidden.
- 2026-07-13: The user confirmed the latest portable widget layout works correctly; task `0036` also passed browser height coverage and a fresh desktop build. Closed.

## Dependencies

- parent-child: ytw-l48 (created 2026-03-11T06:15:50Z)

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
