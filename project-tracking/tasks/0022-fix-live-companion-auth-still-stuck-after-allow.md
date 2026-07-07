# 0022 - Fix Live Companion Auth Still Stuck After Allow

## Status

Completed

## Context

The user reported that Companion authorization still does not work in the live Windows app: after generating a code and clicking Allow in YTMDesktop, the widget returns to `Authorization needed / Not authorized` and allows generating another code. Screenshots show the widget entering `Authorizing` and then returning to `Authorization needed` with the same pairing code.

The user explicitly requested urgent current research, a full quality audit, and fixes through the project workflow. Work must continue through GitHub App connector commits, not console `git push`.

Current public Companion Server API v1 documentation says the YTMDesktop v2 auth flow is `POST /api/v1/auth/requestcode`, then a long-polling `POST /api/v1/auth/request` that can wait up to 30 seconds for user Allow/Deny, then authenticated REST calls use the returned token in the `Authorization` header, and Socket.IO realtime uses `auth.token` over websocket.

## Goal

Fix the live post-Allow authorization stall and audit the affected Companion auth/connect pipeline end to end.

## Scope

Included:

- Research current Companion Server v2/API v1 docs and related client behavior.
- Audit auth code generation, long-poll token request, token storage, post-auth connect, REST auth header handling, realtime socket setup, frontend controller state, and settings UI error visibility.
- Fix confirmed code-level causes that can explain the user's screenshots.
- Add focused regression coverage where possible.
- Update task/report/time-log/roadmap.

Out of scope:

- Live Windows/YTMDesktop execution inside this environment.
- Switching away from official Companion Server API.
- Console `git push`.

## Affected Areas

- Backend/native: `src-tauri/src/lib.rs`, `src-tauri/src/companion.rs`
- Frontend/domain: `src/domain/playback/controller.ts`, `src/domain/playback/types.ts`
- Integration bridge: `src/integration/companion/realGateway.ts`, `src/integration/companion/tauriBridge.ts`
- Tests: `tests/domain/playback/controller.test.ts`
- Project tracking: this task, report, roadmap, time-log

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0022-a` |
| Started at | `2026-07-07T03:35:45+02:00` |
| Finished at | `2026-07-07T03:51:25+02:00` |
| Time spent minutes | `16` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Current Companion Server API behavior is researched and documented.
- [x] Post-Allow auth no longer drops immediately back to `Authorization needed` because of a transient token validation race.
- [x] A fresh token is not cleared on the first post-auth `401/403` before retrying.
- [x] The UI preserves actionable diagnostics instead of silently looking like nothing happened.
- [x] Regression tests cover the post-auth retry behavior.
- [x] Tracking files are completed.
- [x] Any checks that cannot be run here are explicitly documented.

## Verification Plan

- [x] Static review of affected files.
- [x] Regression test reasoning for controller post-auth retry.
- [x] Compare final GitHub App diff against task start.
- [x] Document local commands required: `npm run verify`, `cargo check -j1`, `npm run build:portable`, and live YTMDesktop Allow test.

## Research Notes

- Official/mirrored wiki for YTMDesktop Companion Server API v1 says the docs apply to v2.0.0+.
- `POST /auth/request` may take up to 30 seconds while waiting for user interaction.
- Tokens are bound to `appId`; requesting another token with the same `appId` overwrites the prior token.
- REST authenticated requests pass the valid token as the `Authorization` header value.
- Socket.IO realtime connects to `/api/v1/realtime`, websocket transport only, with `auth.token`.

## Fix Summary

| Finding | Impact | Fix |
| --- | --- | --- |
| Fresh post-Allow token could be cleared on the first `401/403` from immediate `/state` validation. | Widget returned to `Authorization needed` right after Allow, matching the user's screenshots. | Added post-auth `preserveAuthOnFailure` wiring and short controller retries before giving up. |
| `/auth/request` long-poll held the shared CompanionManager mutex. | Other Companion operations could be blocked for up to 30 seconds during Allow/Deny. | Added standalone auth helpers so auth code/token requests no longer lock the socket manager. |
| REST auth validation assumed exactly one `Authorization` format. | Current/future client differences could cause avoidable auth failure. | Plain token is still tried first per docs; `Bearer token` is tried as a defensive fallback. |
| Regression coverage did not model post-Allow transient auth failure. | The live failure mode could regress. | Added controller test covering first `auth_required` then successful retry. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live YTMDesktop cannot be run in this environment. | Runtime-only issues may remain. | Fix code-level race/diagnostics and require local live QA. |
| Auth retry could keep an invalid stale token longer. | User may still need `Clear auth` for truly invalid tokens. | Preserve token only for post-approval retries; normal stale-token paths can still surface auth-required state. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Report: `project-tracking/reports/0022-fix-live-companion-auth-still-stuck-after-allow.md`
- Time log: `project-tracking/time-log.md`
- Related tasks: `0020-fix-live-companion-auth-post-approval-stall.md`, `0021-full-code-audit-after-auth-fixes.md`
- PR/commit: GitHub App contents commits; final HEAD reported in handoff
