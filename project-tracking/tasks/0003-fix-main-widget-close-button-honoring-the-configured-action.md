# 0003 - Fix main widget close button honoring the configured action

## Status

Completed

## Source

- Migrated from Beads issue: `ytw-l48.2`
- Type: Bug
- Priority: P1
- Created: 2026-03-11T03:15:53Z
- Updated: 2026-03-11T09:09:00Z
- Assignee: unknown
- Created by: unknown

## Context

The close button in the main widget visually presses, but the app only closes from the tray menu. When settings specify Exit app, the widget close button should actually exit the app; when configured for Hide to tray, it should hide reliably.

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

- [x] The original Beads issue state is represented in markdown.
- [x] Relevant implementation, documentation, and verification notes are captured or linked.
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

- 2026-03-11: Added missing hide_widget_stack backend command, switched widget header buttons to explicit click handlers with error logging, and rebuilt portable exe after verify/cargo check/build:desktop. Pending manual runtime confirmation on Windows that the main close button now honors Exit app and Hide to tray.
- 2026-03-11: Follow-up pass switched quit_application to app.exit(0), narrowed drag regions away from the entire window roots, and changed closeWidgetWindow to try the Tauri close invoke path before browser fallback. Rebuilt portable exe after verify/cargo check/build:desktop. Awaiting another manual runtime check for the main widget close button.
- 2026-03-11: Root cause found in src-tauri/permissions/default.toml. The main widget was not permitted to invoke exit_app or hide_widget_stack, so the close button action failed even though the UI click fired. Added the missing permissions and rebuilt after verify/cargo check/build:desktop. Awaiting user runtime confirmation.
- 2026-03-11: User confirmed at runtime that the main widget close button now works correctly after the permission fix.

## Dependencies

- parent-child: ytw-l48 (created 2026-03-11T06:15:52Z)

## Related Markdown Links

- parent-child: ytw-l48 -> [`0001-stabilize-current-widget-interaction-regressions.md`](../tasks/0001-stabilize-current-widget-interaction-regressions.md)

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
