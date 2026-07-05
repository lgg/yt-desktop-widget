# 0000 - Use Markdown Project Tracking

## Status

Accepted

## Context

The project previously used Beads as its task tracker. The user requested adopting the rules from `lgg/chatgpt-coding-projects-bootstrap`, making `project-tracking/` the main source of truth, migrating all Beads history/current state, and removing Beads after verification.

## Decision

Use markdown files under `project-tracking/` for roadmap, tasks, reports, decisions, checklists, templates, and historical archive data. Beads is no longer part of the project workflow after this migration.

## Alternatives Considered

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Keep Beads as primary tracker | CLI-native, already had project state | Beads database was local/ignored and not fully preserved by normal Git push | User explicitly requested markdown as source of truth |
| Keep both Beads and markdown | Redundant safety during transition | Creates two sources of truth | User explicitly requested removing Beads after transfer |
| Markdown project-tracking only | Git-native, reviewable, clone-safe | Requires disciplined report/task updates | Matches bootstrap rules and user request |

## Consequences

Positive:

- Tasks, reports, decisions, and history are visible in normal Git review.
- A fresh clone contains the planning source of truth.
- The process matches the bootstrap repository conventions.

Negative / tradeoffs:

- Agents must update markdown files manually when task state changes.
- The Beads CLI workflow is no longer available in this repository.

## Implementation Notes

- Full raw Beads export is stored in `project-tracking/archive/beads-export-2026-07-05.jsonl`.
- Each Beads issue was converted into a task file.
- Completed Beads issues received report files.
- Current workflow rules are documented in `AGENTS.md` and `project-tracking/README.md`.

## Review Date

Review if the project adopts a different issue tracker or starts using GitHub Issues as the primary source of truth.

## Links

- Related task: `project-tracking/tasks/0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md`
- Migration map: `project-tracking/archive/beads-migration-map.md`
