# Project Tracking

This folder is the source of truth for project work tracking.

It records not only what changed, but also why it changed, what was verified, which questions remain open, which bootstrap process rules are synced, and how much AI iteration time was spent.

## Structure

```text
project-tracking/
  README.md
  bootstrap-sync.md
  time-log.md
  roadmap/     # phases, priorities, dependencies, and large plans
  tasks/       # task statements and current task state
  reports/     # completion and verification reports
  decisions/   # durable architecture, product, release, and process decisions
  checklists/  # reusable quality checklists
  templates/   # templates for new tracking documents
  archive/     # one-time imports and historical raw exports
```

## Bootstrap Sync

`bootstrap-sync.md` records how this repository adapts shared rules from `lgg/chatgpt-coding-projects-bootstrap`.

It must include:

- source bootstrap repository;
- current `synced_through` version;
- sync history by version;
- files changed during sync;
- project-specific adaptations;
- pending or intentionally skipped bootstrap items.

This repository is a Windows-first Tauri desktop app. Docker/Coolify rules from the bootstrap are adapted as conditional future rules, not copied as deployment files.

## Time Log

`time-log.md` is the project-level AI iteration log.

Use it to summarize later:

- time spent on the project;
- time spent per task or feature;
- which iterations were tracked exactly, approximate, or not tracked;
- which reports and commits belong to the time spent.

Workflow:

1. At the start of a substantial iteration, capture `started_at` in ISO 8601 with timezone.
2. Record the start in the relevant task file.
3. Before final commit, push, or handoff, capture `finished_at`.
4. Calculate `time_spent_minutes` as integer minutes rounded up.
5. Record matching data in task, report, and one row in `time-log.md`.
6. If start time was missed, do not invent precision. Mark `tracking_status` as `approximate` or `not_tracked` and explain why.

## Rules

1. Before non-trivial work, create or update the relevant task file in `tasks/`.
2. During work, record scope changes, questions, and decisions in the task or a decision file.
3. After completion or a verification pass, create or update a report in `reports/`.
4. Update the roadmap when priority, phase, or delivery status changes.
5. Keep task/report numbers stable. Do not reuse a number for an unrelated topic.
6. Update `bootstrap-sync.md` when importing new bootstrap rules.
7. Update `time-log.md` for substantial AI work iterations.

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
- related areas are updated together: frontend, native backend, domain/API contracts, tests, documentation, release/config, roadmap, tasks, reports, bootstrap-sync, and time-log when relevant;
- time tracking is filled in the task, report, and `time-log.md`, or the report explicitly explains why it is approximate or not tracked;
- for this desktop app, Tauri permissions, portable-build policy, Companion API assumptions, and Windows runtime behavior are reviewed when affected.

## Bootstrap Adaptation Notes

The source bootstrap repository includes Docker/Coolify examples for server-style projects. This repository does not use Docker or Coolify today, so those files are not copied into the app root. Their process rules are adapted in `AGENTS.md`: if Docker/Coolify/env deployment is introduced later, it must be tracked by a task, documented, and verified in a report.