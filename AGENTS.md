# AGENTS.md

This file is required reading before any work on this repository. Keep it aligned with README and `project-tracking/` whenever project rules change.

## 1. Baseline Workflow

1. Before non-trivial changes, read:
   - `README.md`
   - `AGENTS.md`
   - `project-tracking/roadmap/0000-roadmap.md`
   - relevant tasks, reports, decisions, and checklists under `project-tracking/`
2. Do not start implementation until the task, acceptance criteria, affected areas, and verification plan are clear.
3. If a choice can be resolved safely without the user, choose the conservative option that fits the current architecture and record it in the task/report.
4. If a choice affects product behavior, security, user data, credentials, release packaging, or irreversible migration, ask the user explicitly.
5. Keep changes minimal and scoped to the task. Avoid side refactors unless they are required for the requested work.

## 2. Git

If you create a git commit in this repository, use:

- `user.name = lgg`
- `user.email = lgg@users.noreply.github.com`

Do not commit, amend, or push unless the user explicitly asks.
Do not overwrite or delete user changes without direct permission.

## 3. Project Tracking

Markdown project tracking is the source of truth.

Use `project-tracking/` for all project planning and reporting:

```text
project-tracking/
  README.md
  roadmap/
  tasks/
  reports/
  decisions/
  checklists/
  templates/
  archive/
```

Rules:

1. Before non-trivial work, create or update the relevant task file in `project-tracking/tasks/`.
2. During work, record scope changes, questions, risks, and durable decisions in the task or a decision file.
3. After completion or meaningful verification, create or update the matching report in `project-tracking/reports/`.
4. Update the roadmap when task status, priority, phase, or delivery expectations change.
5. Do not keep a parallel issue tracker or markdown TODO list outside `project-tracking/`.

Beads was removed as the project tracker. Historical Beads state is preserved in:

- `project-tracking/archive/beads-export-2026-07-05.jsonl`
- `project-tracking/archive/beads-migration-map.md`

## 4. Numbering

Use four-digit prefixes for roadmap, task, report, decision, and checklist files:

- `0000-...`
- `0001-...`
- `0002-...`

Rules:

1. The number records the order in which work appeared.
2. Reuse the same number for a task and its report when practical.
3. Do not reuse a number for an unrelated topic.
4. If a task splits, create new numbered task files and link back to the original.

## 5. Task Requirements

Each task should include:

- context
- goal
- included and excluded scope
- affected areas
- acceptance criteria
- verification plan
- questions and answers
- risks
- links to related roadmap, decisions, reports, PRs, commits, and files

Use `project-tracking/templates/task-template.md` for new tasks.

## 6. Report Requirements

Each report should include:

- summary
- what was done
- changed files and affected areas
- checks performed
- check results
- what could not be verified and why
- resolved and open questions
- residual risks
- next steps

Use `project-tracking/templates/report-template.md` for new reports.

## 7. Definition of Done

A task is not complete until:

1. Implementation matches the task and acceptance criteria.
2. Related areas are updated together: frontend, native backend, domain/API contracts, tests, documentation, build/release config, roadmap, task, and report.
3. Available checks were run locally or in CI.
4. Any skipped checks are explained in the report.
5. There is no known mismatch between UI, native backend, Companion API assumptions, tests, docs, and release config.
6. Open questions are recorded in the task or a decision file.

See `project-tracking/checklists/0000-definition-of-done.md`.

## 8. Project Notes

- This is a Windows-first Tauri v2 + React + TypeScript desktop widget app.
- The app integrates with YTMDesktop only through the official Companion Server API.
- Current manual test builds are portable-only.
- Keep UX behavior unchanged unless the task explicitly calls for a UX change.
- Respect existing architecture and decisions before broad changes:
  - `ARCHITECTURE.md`
  - `DECISIONS.md`
  - `project-tracking/decisions/`

## 9. Preferred Validation

Preferred validation commands:

- `npm run verify`
- `cargo check -j1`
- `npm run build:desktop`

Use focused checks when the task is narrow, and broader checks when touching shared behavior, runtime integration, release config, or user-facing flows.

For frontend/UI work, also consider:

- widget and settings window layout
- loading, empty, reconnect, auth, and error states
- pointer/drag behavior on frameless windows
- basic accessibility of interactive controls

For native/runtime work, also consider:

- Tauri permissions
- Companion API request/response handling
- realtime socket behavior
- keyring/token handling
- startup/tray/window lifecycle

## 10. Docker, Packaging, and Deployment

This repository is currently a Windows-first desktop app and does not use Docker Compose, Coolify, or server deployment files.

Rules adapted from the bootstrap repository:

1. Do not add Docker, Coolify, installer, or release packaging files without a task and report.
2. If Docker Compose is introduced later, `docker-compose.yml` is for local Docker Compose only and must read local variables from `.env`.
3. If Coolify deployment is introduced later, use a separate `docker-compose.coolify.yml`; do not overload local compose for Coolify.
4. If env variables are introduced, add or update `.env.example` with safe example values and document required variables.
5. Do not publish internal services or local development ports externally without an explicit task, risk note, and decision.
6. For the current release cycle, keep manual test builds portable-only unless a numbered task changes packaging policy.
7. Any change to Tauri permissions, startup behavior, packaging, or release config must update README, roadmap/task/report, and any relevant decision file.

## 11. Security

1. Do not commit secrets, tokens, private keys, real passwords, or user credentials.
2. Companion tokens must stay in OS keyring-backed storage, not frontend storage.
3. Auth, token storage, startup, permissions, and external integration changes require explicit risk notes in the task/report.
4. Do not add network exposure or telemetry without an explicit task and documented decision.

## 12. Updating Rules

When durable project rules change:

1. Update `AGENTS.md`.
2. Add or update a decision file in `project-tracking/decisions/`.
3. Mention the rule change in the relevant task/report.
4. Check that README and project-tracking docs do not contradict the new rule.
