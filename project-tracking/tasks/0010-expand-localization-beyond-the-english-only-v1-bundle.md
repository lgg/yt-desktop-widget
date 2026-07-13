# 0010 - Expand localization beyond the English-only v1 bundle

## Status

Completed

## Source

- Migrated from Beads issue: `ytw-5v6.5`
- Type: Feature
- Priority: P4
- Created: 2026-03-11T03:29:04Z
- Updated: 2026-03-11T04:36:17Z
- Assignee: Unassigned
- Created by: unknown

## Context

The app already externalizes user-facing strings into JSON files. Add at least one additional locale and validate that the existing i18n structure scales without UI regressions.

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
- [x] Russian is available alongside English through matching JSON locale bundles.
- [x] English remains the default and the selected language persists through the existing settings model.
- [x] Relevant implementation, documentation, verification, roadmap, task, and report notes are captured or linked.
- [x] No known mismatch remains between UI, native settings, tests, and localization docs.

## Verification Plan

- [x] Lint/static checks: `npm run verify` passed in task `0036`.
- [x] Tests: locale render/key-parity component tests and persisted-language Playwright coverage passed.
- [x] Build: `npm run build:desktop` passed for version `2.0.0`.
- [x] Manual QA: browser E2E verified English-to-Russian switching and reload persistence.
- [x] Deploy/config review: localization adds no permission, credential, or packaging change.
- [x] Documentation review: README, architecture, roadmap, task, and report `0036` are synchronized.

## Progress History

- No progress notes were recorded in Beads.
- 2026-07-13: Task `0036` added a persisted `en`/`ru` selector, complete `ru.json`, English fallback/default behavior, document language updates, hardcoded UI-copy cleanup, exact locale-key parity tests, and browser persistence coverage. Closed.

## Dependencies

- parent-child: ytw-5v6 (created 2026-03-11T06:29:04Z)

## Related Markdown Links

- parent-child: ytw-5v6 -> [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md)

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
- Completion report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
