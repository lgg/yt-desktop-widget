# 0008 - Validate live Companion auth, realtime, commands, and seek against a real YTMDesktop instance

## Status

Open

## Source

- Migrated from Beads issue: `ytw-5v6.3`
- Type: Task
- Priority: P2
- Created: 2026-03-11T03:29:00Z
- Updated: 2026-03-11T03:29:00Z
- Assignee: Unassigned
- Created by: unknown

## Context

Run the implemented integration against a live local YTMDesktop Companion instance and verify the auth round-trip, realtime state updates, playback commands, reconnect behavior, and actual seek behavior. Capture any protocol mismatches or follow-up fixes as linked issues.

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
- Frontend: Not known from Beads context.
- Database/migrations: Not applicable for this desktop app unless a future task says otherwise.
- API/contracts: YTMDesktop Companion API behavior may be affected.
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

- parent-child: ytw-5v6 (created 2026-03-11T06:29:00Z)
- blocks: ytw-l48.4 (created 2026-03-11T07:35:42Z)

## Related Markdown Links

- parent-child: ytw-5v6 -> [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md)
- blocks: ytw-l48.4 -> [`0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`](../tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md)

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
