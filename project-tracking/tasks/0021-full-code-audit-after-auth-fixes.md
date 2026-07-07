# 0021 - Full Code Audit After Auth Fixes

## Status

Completed

## Context

The user requested a full, high-quality audit of the entire project after the recent Companion authorization fixes, with any discovered problems fixed. The latest HEAD at audit start was `d6bd5618bb5621806883cbf1c2d89798c9843544`.

This audit follows the project rule to work through GitHub App connector writes, not console `git push`. Local repository cloning was attempted only for read-only audit coverage but was blocked by the sandbox policy, so repository reads were performed through GitHub App file fetches and targeted connector searches.

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

- Backend/native: fixed Companion backend connection reuse and connection-key tracking.
- Frontend: fixed AppProvider controller disposal ownership for real Settings windows.
- Domain/API contracts: added gateway/controller disconnect options.
- Tests: added controller regression coverage for shared backend disconnect ownership.
- Documentation: audit report created with follow-up verification commands.
- Build/release/config: fixed Playwright smoke-test web server build prerequisite.
- Project tracking: task/report/time-log/roadmap updated.
- Other: GitHub App connector-only workflow maintained.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0021-a` |
| Started at | `2026-07-07T03:12:23+02:00` |
| Finished at | `2026-07-07T03:24:02+02:00` |
| Time spent minutes | `12` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Critical code paths are reviewed across frontend, backend, integration, tests, config, docs, and tracking.
- [x] Confirmed bugs are fixed with scoped GitHub App commits.
- [x] Any checks that cannot be run are explicitly documented.
- [x] Related task, report, roadmap, and time-log files are updated.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No known mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config, subject to live Companion QA still being required.

## Verification Plan

- [x] Static review of fetched source files.
- [x] Audit recent auth fixes against upstream Companion API behavior.
- [x] Review test coverage for changed flows.
- [x] Review config/build scripts and Tauri permissions.
- [x] Document why `npm run verify`, `cargo check -j1`, and `npm run build:portable` could not be run in this environment.
- [x] Final tracking consistency check.

## Findings and Fixes

| Finding | Impact | Fix |
| --- | --- | --- |
| Settings and main windows each created a playback controller, but the real backend Companion manager exposed one shared WebSocket. Opening or closing Settings could disconnect the main widget from Companion. | Live auth/playback could appear stuck or regress after Settings lifecycle changes. | Added frontend disconnect ownership options and made real Settings disposal detach only the listener, while main still owns backend shutdown. Backend `connect()` is now idempotent for the same endpoint/token. |
| Playwright smoke test config used `vite preview` directly. | `npm run test:e2e` could fail on a clean checkout or after deleting `dist`. | Changed Playwright web server command to `npm run build && npm run preview:e2e`. |

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Can this environment clone the repo for mechanical full-tree audit? | Resolved | No. A read-only clone attempt was blocked by sandbox approval policy. Continue with GitHub App fetches/searches. |
| Should writes use console git push? | Resolved | No. Use GitHub App contents commits only. |
| Can live YTMDesktop Companion auth be verified here? | Resolved | No. It requires a local Windows YTMDesktop instance. The report lists exact local follow-up checks. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Connector search does not expose a complete file tree. | Some low-risk files may not be mechanically enumerated. | Audited known architecture files and configs from README/AGENTS plus targeted fetches; limitation documented in report. |
| Live Companion behavior cannot be exercised here. | Runtime-only auth/window/socket bugs may remain. | Report requires local Windows `npm run build:portable` and live Companion QA. |
| `companion_complete_auth` waits for approval while holding the manager mutex. | Future concurrent auth/reconnect requests may wait behind an approval poll. | Documented as a lifecycle hardening candidate; current serialized UI flow remains covered. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Report: `project-tracking/reports/0021-full-code-audit-after-auth-fixes.md`
- Related reports: `project-tracking/reports/0017-full-code-audit-latest-ytmdesktop.md`, `project-tracking/reports/0020-fix-live-companion-auth-post-approval-stall.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: GitHub App contents commits; final HEAD reported in handoff
