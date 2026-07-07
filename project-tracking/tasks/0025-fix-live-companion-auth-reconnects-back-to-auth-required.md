# 0025 - Fix Live Companion Auth Reconnects Back To Auth Required

## Status

Completed

## Context

The user retested the rebuilt app and reported that live Companion authorization still fails. In YTMDesktop the same code is approved, but the widget enters `Reconnecting` and then returns to an authorization-required state.

Previous fixes addressed post-approval reconnect retries and cross-window auth-change synchronization. The remaining symptom points to either token invalidation/rejection after `/auth/request`, an endpoint mismatch, a duplicate auth flow, or an overly destructive token-clear path.

The user provided current documentation:

- `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`
- `https://ytmdesktop.github.io/developer/companion-server/getting-started.html`

## Goal

Identify and fix the remaining code-level cause that makes approved live Companion auth return to `auth_required`.

## Scope

Included:

- Re-read current Companion Server API documentation.
- Audit auth code request, token exchange, token storage, token validation, reconnect retries, duplicate auth flow risk, and token clearing.
- Fix confirmed defects that can explain `Reconnecting` followed by `auth_required`.
- Add regression tests.
- Update tracking files.
- Validate and merge/push via branch-per-pass workflow.

Out of scope:

- Replacing the official Companion Server API.
- Storing tokens in frontend storage.
- Claiming live YTMDesktop validation unless actually run locally.

## Affected Areas

- Backend/native: `src-tauri/src/companion.rs`, `src-tauri/src/lib.rs`
- Frontend: auth/reconnect state if needed
- Domain/API contracts: `src/domain/playback/*`, `src/integration/companion/*`
- Tests: auth/connect regression tests
- Documentation: project tracking
- Build/release/config: review only
- Project tracking: task/report/roadmap/time-log
- Other: external YTMDesktop docs

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0025-a` |
| Started at | `2026-07-07T05:41:51+03:00` |
| Finished at | `2026-07-07T05:45:48+03:00` |
| Time spent minutes | `4` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Current docs are reviewed and key auth constraints are recorded.
- [x] Root cause is identified from code/docs/runtime symptom evidence before implementation.
- [x] Approved auth no longer falls back to auth-required because of avoidable app-side token invalidation or validation logic.
- [x] Regression tests cover the fixed failure mode.
- [x] No token values are logged or exposed to frontend storage.
- [x] Available checks pass before merge.
- [x] Branch is committed, merged to `master`, and pushed.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.

## Verification Plan

- [x] Lint/static/tests/web build: `npm run verify`
- [x] Native check: `cargo check -j1`
- [x] Desktop build: `npm run build:desktop`
- [x] Manual QA: live YTMDesktop Allow flow remains required if not runnable here
- [x] Documentation/tracking review
- [x] Git branch/merge/push verification

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does the docs site require raw token or Bearer token for REST? | Resolved | Wiki states authenticated requests pass `Authorization` with the value of a valid token. |
| Does requesting another token with the same `appId` matter? | Resolved | Yes. Wiki states it overwrites the current valid token. The app must avoid accidental duplicate token exchanges. |
| Can live YTMDesktop be run here? | Resolved | Not run in this automated pass; final confirmation remains local live QA on the user's YTMDesktop. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The live failure is caused by local YTMDesktop state outside this environment. | App-side tests may pass but user still needs local QA. | Add safer diagnostics and document live validation steps. |
| Debugging auth could expose token values. | Credential leak. | Do not log token values; only record status categories and redacted facts. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0002-adopt-branch-per-pass-commit-merge-push-workflow.md`
- Related reports: `project-tracking/reports/0023-audit-and-fix-live-companion-auth-after-latest-pull.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex-0025-fix-live-companion-auth`
