# 0020 - Fix Live Companion Auth Post-Approval Stall

## Status

Completed

## Context

A live Windows auth attempt still returned to `Authorization needed` / `Not authorized` after the user approved the matching Companion Authorization Request in YTMDesktop. The previous fix started `/api/v1/auth/request` automatically after code generation, but it did not cover the post-approval reconnect path where the controller could still stop on a false `hasStoredAuth()` probe before trying `companion_connect`.

Upstream YTMDesktop source and the official Companion API v2 documentation were reviewed again. The current API behavior is:

- `POST /api/v1/auth/requestcode` returns `{ code }`.
- `POST /api/v1/auth/request` consumes that temporary code, opens the Allow/Deny authorization window, waits up to 30 seconds, and returns `{ token }` after Allow.
- Authenticated REST requests use the raw token in the `Authorization` header.
- Realtime uses namespace `/api/v1/realtime` with `auth.token`.

## Goal

Make the post-Allow path connect reliably instead of returning to `auth_required` because of a stale or conservative stored-auth precheck, and improve native diagnostics for unexpected Companion auth responses.

## Scope

Included:

- Bypass the preliminary stored-auth gate immediately after successful `completeAuth` and attempt the real Companion connection.
- Mark successful real connections as authorized in connection state so settings does not keep showing `Not authorized` after connect.
- Add regression coverage for `completeAuth` success followed by `hasStoredAuth() === false`.
- Improve Rust auth response parsing and unexpected response diagnostics.
- Update project tracking.

Out of scope:

- Changing Companion API endpoints, app ID, raw `Authorization` token format, or websocket namespace.
- Adding non-keyring token storage fallback.
- Claiming live YTMDesktop validation from this connector-only environment.

## Affected Areas

- Backend/native: `src-tauri/src/companion.rs`
- Frontend: none directly
- Domain/API contracts: `src/domain/playback/connectionMachine.ts`, `src/domain/playback/controller.ts`
- Tests: `tests/domain/playback/controller.test.ts`, Rust unit coverage in `companion.rs`
- Documentation: project tracking only
- Build/release/config: not changed
- Project tracking: task, report, roadmap, time-log
- Other: upstream YTMDesktop source and wiki reviewed

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0020-a` |
| Started at | `2026-07-07T02:55:33+02:00` |
| Finished at | `2026-07-07T03:05:57+02:00` |
| Time spent minutes | `11` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] After successful Companion approval, the controller attempts `companion_connect` even if the stored-auth probe still reports `false`.
- [x] A successful real connection updates connection state to authorized.
- [x] Regression coverage exists for the post-approval stale-auth-probe case.
- [x] Native auth response parsing keeps the official v2 path intact and reports unexpected response bodies more clearly.
- [x] Related project tracking files are updated.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No intentional mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Companion API research against upstream YTMDesktop source and wiki.
- [x] Static review of controller state transitions.
- [x] Static review of Rust response parsing and extraction helpers.
- [ ] Run `npm test` locally.
- [ ] Run `npm run build:portable` locally on Windows.
- [ ] Live QA against a real YTMDesktop Companion Server.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should the app switch to `Bearer <token>`? | Resolved | No. Upstream `isAuthValidMiddleware` reads `request.headers.authorization` directly and hashes the raw token. |
| Should post-approval reconnect be blocked by `hasStoredAuth()`? | Resolved | No. Successful `completeAuth` is the stronger signal; the controller should try `companion_connect` and let the backend load/validate the token. |
| Should token storage fallback move to frontend/localStorage? | Resolved | No. Tokens stay in native/keyring-backed storage for this task. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live issue is caused by an OS keyring write failure rather than stale auth probing. | Auth may still fail, but now the backend/frontend should surface a more specific error instead of silently returning to `Not authorized`. | Keep token storage native-only; improve diagnostics; require live retest. |
| Connector environment cannot run the Windows portable build. | Build regressions could be missed until local Windows run. | Added focused tests/code review and explicitly require local `npm run build:portable`. |
| Companion app may return undocumented auth error bodies. | UI may still need further message mapping. | Rust now includes response-body summaries for unexpected auth responses. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related reports: `project-tracking/reports/0018-fix-companion-auth-completion-flow.md`, `project-tracking/reports/0019-fix-controller-auth-test-typescript-build.md`, `project-tracking/reports/0020-fix-live-companion-auth-post-approval-stall.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: GitHub App contents commits; final HEAD reported in handoff
