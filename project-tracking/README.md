# Project Tracking

This folder is the source of truth for project work tracking.

## Structure

```text
project-tracking/
  roadmap/     # phases, priorities, dependencies, and large plans
  tasks/       # task statements and current task state
  reports/     # completion and verification reports
  decisions/   # durable architecture, product, release, and process decisions
  checklists/  # reusable quality checklists
  templates/   # templates for new tracking documents
  archive/     # one-time imports and historical raw exports
```

## Rules

1. Before non-trivial work, create or update the relevant task file in `tasks/`.
2. During work, record scope changes, questions, and decisions in the task or a decision file.
3. After completion or a verification pass, create or update a report in `reports/`.
4. Update the roadmap when priority, phase, or delivery status changes.
5. Keep task/report numbers stable. Do not reuse a number for an unrelated topic.

## Numbering

Use four-digit prefixes:

- `0000-...`
- `0001-...`
- `0002-...`

The same number should link a task and its report when practical.

## Migration From Beads

Beads was removed as the source of truth on 2026-07-05. The full raw export is preserved at:

- `archive/beads-export-2026-07-05.jsonl`

The migration map is preserved at:

- `archive/beads-migration-map.md`

## Minimum Acceptance

Work is not closed until:

- the implementation, documentation, and tracking files match the task;
- available lint/static checks, tests, and builds are run or explicitly explained as skipped;
- a report records what changed, what was verified, what was not verified, residual risks, and next steps;
- related areas are updated together: frontend, native backend, domain/API contracts, tests, documentation, release/config, roadmap, tasks, and reports;
- for this desktop app, Tauri permissions, portable-build policy, Companion API assumptions, and Windows runtime behavior are reviewed when affected.

## Bootstrap Adaptation Notes

The source bootstrap repository includes Docker/Coolify examples for server-style projects. This repository does not use Docker or Coolify today, so those files were not copied into the app root. Their process rules are adapted in `AGENTS.md`: if Docker/Coolify/env deployment is introduced later, it must be tracked by a task, documented, and verified in a report.
