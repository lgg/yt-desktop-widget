# 0023 - Audit and Fix Live Companion Auth After Latest Pull

## Status

Completed

## Context

The user reported that live Companion authorization still does not complete: after clicking Allow in YTMDesktop, the widget remains in the same authorization-needed state and authorization does not happen.

The repository was updated from `origin/master` before this work. Recent completed tasks `0020`, `0021`, and `0022` already fixed several likely post-approval failures, including stale stored-auth probes, transient post-token validation failures, auth polling manager locks, and shared socket ownership. This task continues the investigation against the freshly pulled code and treats the current live symptom as not yet resolved until verified.

## Goal

Perform a deep audit of the current Companion auth/connect pipeline and fix confirmed code-level bugs that can explain the post-Allow stall while keeping tokens in native keyring-backed storage.

## Scope

Included:

- Review current project rules, roadmap, recent auth tasks/reports, and the freshly pulled code.
- Audit the end-to-end flow from code generation through `/auth/request`, token storage, stored-auth probing, `companion_connect`, REST validation, realtime socket setup, frontend state transitions, and user diagnostics.
- Fix confirmed defects and add focused regression coverage.
- Run available local checks and document anything that cannot be verified without a live YTMDesktop instance.
- Update task/report/roadmap/time-log.

Out of scope:

- Switching away from the official YTMDesktop Companion Server API.
- Storing Companion tokens in frontend storage.
- Adding Docker, installer packaging, telemetry, or external service exposure.
- Claiming live Companion validation unless it is actually run against local YTMDesktop.

## Affected Areas

- Backend/native: `src-tauri/src/lib.rs`, `src-tauri/src/companion.rs`
- Frontend: settings/widget auth status if needed
- Domain/API contracts: `src/domain/playback/*`, `src/integration/companion/*`
- Tests: Vitest/Rust tests for auth/connect behavior
- Documentation: README/project tracking if behavior or diagnostics change
- Build/release/config: review only unless checks reveal a config bug
- Project tracking: this task, matching report, roadmap, time-log
- Other: current Companion API assumptions

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0023-a` |
| Started at | `2026-07-07T05:09:57+03:00` |
| Finished at | `2026-07-07T05:22:08+03:00` |
| Time spent minutes | `13` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] The latest code is pulled from git and current workspace state is known.
- [x] The auth failure is investigated systematically with evidence from current code paths.
- [x] Confirmed bugs in the Companion auth/connect path are fixed.
- [x] Tests cover the fixed behavior where feasible.
- [x] Security constraints are preserved: no secret logging and tokens remain native/keyring-backed.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`
- [x] Tests: focused Vitest tests for changed auth/controller behavior; Rust tests if backend logic changes
- [x] Build: `cargo check -j1`; `npm run build:desktop` if runtime/build-sensitive changes are made and environment allows
- [x] Manual QA: live YTMDesktop Allow flow remains required if not runnable in this environment
- [x] Documentation review: README/project tracking consistency
- [x] Release/config review: no unintended packaging or permission changes
- [x] Time tracking review: task/report/time-log consistency

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Can this environment run live YTMDesktop Companion QA? | Resolved | Not run during this automated pass; local YTMDesktop Allow QA remains the final runtime check. |
| Should tokens ever move to frontend storage to debug this? | Resolved | No. Project rules require OS keyring-backed storage. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live behavior depends on YTMDesktop runtime state unavailable in automation. | A code-level fix may still require local manual validation. | Add focused regression tests and document live QA steps clearly. |
| Extra diagnostics could expose tokens. | Credential leak risk. | Do not log token values or auth headers; only log state/error categories. |
| Repeated auth fixes could mask an architectural lifecycle issue. | More regressions around shared real Companion connection. | Trace ownership and state transitions before editing. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions:
- Related reports: `project-tracking/reports/0020-fix-live-companion-auth-post-approval-stall.md`, `project-tracking/reports/0021-full-code-audit-after-auth-fixes.md`, `project-tracking/reports/0022-fix-live-companion-auth-still-stuck-after-allow.md`
- Time log: `project-tracking/time-log.md`
- PR/commit:
