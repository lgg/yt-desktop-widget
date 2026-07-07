# 0016 - Sync Bootstrap Rules to 0002

## Status

Completed

## Context

The repository already had markdown project tracking and an `AGENTS.md` file adapted from an earlier bootstrap state, but it did not have the latest downstream sync marker or AI iteration time-log workflow from `lgg/chatgpt-coding-projects-bootstrap`.

Bootstrap source current version: `0002`.

Relevant source versions:

- `0001` - bootstrap versioning baseline and downstream `bootstrap-sync.md` marker.
- `0002` - AI iteration time tracking in task, report, and `project-tracking/time-log.md`.

## Goal

Bring this repository's process documentation and tracking files up to bootstrap version `0002`, adapted to the YTM Desktop Widget project as a Windows-first Tauri desktop app.

## Scope

Included:

- Add `project-tracking/bootstrap-sync.md`.
- Add `project-tracking/time-log.md`.
- Update AGENTS, README, project-tracking README, templates, DoD, and PR checklist.
- Record this sync in roadmap, task, report, and time-log.
- Keep Docker/Coolify bootstrap rules as conditional future rules only.

Out of scope:

- Runtime product code changes.
- Adding Docker, Coolify, installer, or deployment files.
- Running desktop build or live Companion validation.

## Affected Areas

- Backend/native: Not changed.
- Frontend: Not changed.
- Domain/API contracts: Not changed.
- Tests: Not changed.
- Documentation: Updated.
- Build/release/config: PR template updated; no release config changed.
- Project tracking: Updated with bootstrap sync and time-log workflow.
- Other: Bootstrap process rules adapted to Tauri desktop context.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0016-a` |
| Started at | `2026-07-07T02:06:55+02:00` |
| Finished at | `2026-07-07T02:11:05+02:00` |
| Time spent minutes | `5` |
| Tracking status | `approximate` |
| Time log row | `project-tracking/time-log.md#ai-iteration-time-log` |

Note: exact start was not captured before this sync introduced bootstrap `0002` time-tracking rules, so the entry is marked approximate.

## Acceptance Criteria

- [x] `project-tracking/bootstrap-sync.md` exists and records `synced_through: 0002`.
- [x] `project-tracking/time-log.md` exists with the current sync iteration recorded.
- [x] AGENTS includes bootstrap sync and AI iteration time tracking rules.
- [x] README and project-tracking README point to bootstrap sync and time-log files.
- [x] Task and report templates include Time Tracking sections.
- [x] Definition of Done and PR checklist include time tracking checks.
- [x] Docker/Coolify bootstrap rules are adapted to this repo as conditional future rules, not copied as active deployment files.
- [x] Related roadmap, task, report, bootstrap-sync, and time-log files are updated.

## Verification Plan

- [ ] Lint/static checks: not required for docs-only sync.
- [ ] Tests: not required for docs-only sync.
- [ ] Build: not required for docs-only sync.
- [ ] Manual QA: not applicable; no runtime behavior changed.
- [x] Documentation review: checked updated docs for consistency with bootstrap versions `0001` and `0002`.
- [x] Release/config review: confirmed no Docker/Coolify/release config files were introduced.
- [x] Time tracking review: task/report/time-log use matching approximate values.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should server Docker/Coolify examples be copied into this project? | Resolved | No. This repo is a Windows-first Tauri desktop app; server deployment rules are documented as conditional future rules only. |
| Should this sync be exact or approximate in time tracking? | Resolved | Approximate, because the time-tracking rule was introduced after the iteration had already started. |
| Does this change product/runtime behavior? | Resolved | No. This is a process/documentation sync only. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Future agents forget to record time before implementation. | Medium | Added the rule to AGENTS, templates, DoD, PR checklist, README, and time-log. |
| Bootstrap server rules conflict with desktop app reality. | Low | Adapted Docker/Coolify rules as future conditional rules only. |
| Approximate first time-log row is mistaken for exact tracking. | Low | Marked `tracking_status` as `approximate` and explained why. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related report: `project-tracking/reports/0016-sync-bootstrap-rules-to-0002.md`
- Time log: `project-tracking/time-log.md`
- Source bootstrap: `https://github.com/lgg/chatgpt-coding-projects-bootstrap`
- PR/commit: GitHub App contents commits; final HEAD reported in handoff.