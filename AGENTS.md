# AGENTS.md

This file is required reading before any work on this repository. Keep it aligned with README and `project-tracking/` whenever project rules change.

## 1. Baseline Workflow

1. Before non-trivial changes, read:
   - `README.md`
   - `AGENTS.md`
   - `project-tracking/bootstrap-sync.md`
   - `project-tracking/roadmap/0000-roadmap.md`
   - relevant tasks, reports, decisions, and checklists under `project-tracking/`
2. Do not start implementation until the task, acceptance criteria, affected areas, and verification plan are clear.
3. If a choice can be resolved safely without the user, choose the conservative option that fits the current architecture and record it in the task/report.
4. If a choice affects product behavior, security, user data, credentials, release packaging, or irreversible migration, ask the user explicitly.
5. Keep changes minimal and scoped to the task. Avoid side refactors unless they are required for the requested work.
6. At the start of each substantial AI work iteration, record the start time. Before final commit, push, or user handoff, record finish time and duration as described in section 14.

## 2. Git and GitHub

If you create a git commit in this repository, use:

- `user.name = lgg`
- `user.email = lgg@users.noreply.github.com`

Rules:

1. If the user asks to work through GitHub App, do not use console `git push`.
2. Prefer GitHub App / connector tools for remote repository writes when requested.
3. Default repository workflow is one AI work pass equals one dedicated branch. Create or switch to a pass-specific branch before edits whenever possible.
4. By default, every pass must end with committed and pushed changes. Do not leave completed work only in the working tree.
5. After implementation, run the relevant audit/review and validation checks. If there are no blocking problems, merge the pass branch into `master` and push `master` in the same pass.
6. If validation fails or a blocker remains, commit and push the branch only when it is useful for handoff, and clearly mark the task/report as blocked or partially verified.
7. The only exceptions to the commit/push/merge flow are an explicit user instruction not to commit or push, a safety concern, unavailable credentials/remote access, or a failed required check that should prevent merge.
8. Do not overwrite or delete user changes without direct permission.
9. Keep commits small enough for review and use messages that explain what changed.
10. The last process/documentation commit before handoff should include current task, report, bootstrap-sync, and time-log updates when applicable.

## 3. Project Tracking

Markdown project tracking is the source of truth.

Use `project-tracking/` for all project planning and reporting:

```text
project-tracking/
  README.md
  bootstrap-sync.md
  time-log.md
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
5. Record substantial AI iteration time in `project-tracking/time-log.md`.
6. Update `project-tracking/bootstrap-sync.md` whenever rules from `lgg/chatgpt-coding-projects-bootstrap` are synchronized.
7. Do not keep a parallel issue tracker or markdown TODO list outside `project-tracking/`.

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
- time tracking: `iteration_id`, `started_at`, `finished_at`, `time_spent_minutes`, `tracking_status`, and time-log link
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
- time tracking summary and where it is recorded in `project-tracking/time-log.md`
- what could not be verified and why
- resolved and open questions
- residual risks
- next steps

Use `project-tracking/templates/report-template.md` for new reports.

## 7. Definition of Done

A task is not complete until:

1. Implementation matches the task and acceptance criteria.
2. Related areas are updated together: frontend, native backend, domain/API contracts, tests, documentation, build/release config, roadmap, task, report, bootstrap-sync, and time-log when relevant.
3. Available checks were run locally or in CI.
4. Any skipped checks are explained in the report.
5. There is no known mismatch between UI, native backend, Companion API assumptions, tests, docs, and release config.
6. Open questions are recorded in the task or a decision file.
7. Time tracking is filled in the task, report, and `project-tracking/time-log.md`, or the report explicitly explains why it is approximate or not tracked.

See `project-tracking/checklists/0000-definition-of-done.md`.

## 8. Project Notes

- The public product/repository name is **Music Desktop Widget** / `music-desktop-widget`.
- Compatibility-sensitive legacy runtime identifiers remain unchanged under `project-tracking/decisions/0009-rename-product-while-preserving-runtime-identifiers.md`; do not bulk-rename them without a tested settings/credential/startup migration.
- This is a Windows-first Tauri v2 + React + TypeScript desktop widget app.
- Production playback integrations are limited to the official YTMDesktop Companion Server API and the official Windows Media Session/GSMTC contract. Do not add scraping, injection, OCR, or window-title parsing.
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
2. Do not publish personal absolute paths, local usernames, temporary clipboard paths, or private machine-specific locations in tracked documentation, reports, fixtures, or diagnostics; use portable placeholders such as `%USERPROFILE%` when the path itself matters.
3. Companion tokens must stay in OS keyring-backed storage, not frontend storage.
4. Auth, token storage, startup, permissions, and external integration changes require explicit risk notes in the task/report.
5. Do not add network exposure or telemetry without an explicit task and documented decision.

## 12. Updating Rules

When durable project rules change:

1. Update `AGENTS.md`.
2. Add or update a decision file in `project-tracking/decisions/` when the rule is architecture, product, release, or process durable enough to need a record beyond bootstrap sync.
3. Mention the rule change in the relevant task/report.
4. Check that README and project-tracking docs do not contradict the new rule.
5. If the rule comes from `lgg/chatgpt-coding-projects-bootstrap`, update `project-tracking/bootstrap-sync.md`.

## 13. Bootstrap Rule Synchronization

This project adapts shared process rules from `https://github.com/lgg/chatgpt-coding-projects-bootstrap`.

Rules:

1. `project-tracking/bootstrap-sync.md` records the latest adapted bootstrap version in `synced_through`.
2. Before a bootstrap-sync task, read the source `bootstrap-versioning/VERSION.md` and only apply versions newer than the current `synced_through`, unless the user asks for a full sync audit.
3. Adapt rules to this repository's Tauri desktop context. Do not copy server-only Docker/Coolify files into the app root unless a task introduces deployment support.
4. After sync, update `bootstrap-sync.md`, the relevant task/report, and `time-log.md`.

## 14. AI Iteration Time Tracking

The goal is to make project effort auditable later by task, report, feature, bootstrap sync, or PR.

Required flow:

1. At the start of each substantial iteration, capture current time in ISO 8601 with timezone, for example with `date -Iseconds` or an equivalent tool.
2. Record the start in the current task file. If no task exists, create or update the closest relevant task before implementation.
3. Before final commit, push, or user handoff, capture finish time.
4. Compute `time_spent_minutes` as integer minutes, rounded up.
5. Update the task, matching report, and `project-tracking/time-log.md` with the same core fields.
6. If the start time was not captured, do not invent precision. Use `tracking_status: approximate` or `tracking_status: not_tracked` and explain why.

Minimum fields:

| Field | Requirement |
| --- | --- |
| `iteration_id` | Unique row ID, for example `2026-07-07-0016-a` |
| `task` | Task path or `not linked` |
| `report` | Report path or `pending` |
| `started_at` | ISO 8601 timestamp with timezone |
| `finished_at` | ISO 8601 timestamp with timezone |
| `time_spent_minutes` | Integer minutes, rounded up |
| `tracking_status` | `tracked`, `approximate`, or `not_tracked` |
| `commit_or_pr` | Commit SHA, branch, PR link, or `pending` |

Before handoff, verify task, report, and time-log do not contradict each other.
