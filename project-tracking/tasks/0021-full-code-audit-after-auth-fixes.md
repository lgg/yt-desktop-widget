# 0021 - Full Code Audit After Auth Fixes

## Status

In Progress

## Context

The user requested a full, high-quality audit of the entire project after the recent Companion authorization fixes, with any discovered problems fixed. The latest HEAD at audit start was `d6bd5618bb5621806883cbf1c2d89798c9843544`.

This audit follows the project rule to work through GitHub App connector writes, not console `git push`. Local repository cloning was attempted only for read-only audit coverage but was blocked by the sandbox policy, so repository reads are performed through GitHub App file fetches and targeted connector searches.

## Goal

Review the project across frontend, domain state, native Tauri backend, Companion API integration, tests, configuration, documentation, and project tracking. Fix confirmed defects with minimal scoped changes.

## Scope

Included:

- Audit Companion auth/reconnect behavior after tasks `0018`-`0020`.
- Audit Rust/Tauri backend, token handling, request parsing, settings/window commands, and config.
- Audit React/TypeScript domain, UI, settings, simulator, and integration layers.
- Audit tests/build scripts/configuration for obvious breakage.
- Update tracking and report.

Out of scope:

- Live YTMDesktop validation, because this environment cannot run the Windows desktop app or local Companion Server.
- Broad redesigns or deferred roadmap features unless required to fix a concrete bug.
- Console `git push`.

## Affected Areas

- Backend/native: pending audit
- Frontend: pending audit
- Domain/API contracts: pending audit
- Tests: pending audit
- Documentation: pending audit
- Build/release/config: pending audit
- Project tracking: this task/report/time-log/roadmap
- Other: GitHub App connector-only workflow

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0021-a` |
| Started at | `2026-07-07T03:12:23+02:00` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] Critical code paths are reviewed across frontend, backend, integration, tests, config, docs, and tracking.
- [ ] Confirmed bugs are fixed with scoped GitHub App commits.
- [ ] Any checks that cannot be run are explicitly documented.
- [ ] Related task, report, roadmap, and time-log files are updated.
- [ ] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [ ] No known mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [ ] Static review of fetched source files.
- [ ] Audit recent auth fixes against upstream Companion API behavior.
- [ ] Review test coverage for changed flows.
- [ ] Review config/build scripts and Tauri permissions.
- [ ] If possible, run or reason about `npm run verify`, `cargo check -j1`, and `npm run build:portable` limitations.
- [ ] Final tracking consistency check.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Can this environment clone the repo for mechanical full-tree audit? | Resolved | No. A read-only clone attempt was blocked by sandbox approval policy. Continue with GitHub App fetches/searches. |
| Should writes use console git push? | Resolved | No. Use GitHub App contents commits only. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Connector search does not expose a complete file tree. | Some low-risk files may not be mechanically enumerated. | Audit known architecture files and configs from README/AGENTS plus targeted searches/fetches; document limitation. |
| Live Companion behavior cannot be exercised here. | Runtime-only auth/window/socket bugs may remain. | Keep report explicit; require local Windows `npm run build:portable` and live Companion QA. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related reports: `project-tracking/reports/0017-full-code-audit-latest-ytmdesktop.md`, `project-tracking/reports/0020-fix-live-companion-auth-post-approval-stall.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: pending
