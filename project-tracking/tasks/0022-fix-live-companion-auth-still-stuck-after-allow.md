# 0022 - Fix Live Companion Auth Still Stuck After Allow

## Status

In Progress

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
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] Current Companion Server API behavior is researched and documented.
- [ ] Post-Allow auth no longer drops immediately back to `Authorization needed` because of a transient token validation race.
- [ ] A fresh token is not cleared on the first post-auth `401/403` before retrying.
- [ ] The UI preserves actionable diagnostics instead of silently looking like nothing happened.
- [ ] Regression tests cover the post-auth retry behavior.
- [ ] Tracking files are completed.
- [ ] Any checks that cannot be run here are explicitly documented.

## Verification Plan

- [ ] Static review of affected files.
- [ ] Regression test reasoning for controller post-auth retry.
- [ ] Compare final GitHub App diff against task start.
- [ ] Document local commands required: `npm run verify`, `cargo check -j1`, `npm run build:portable`, and live YTMDesktop Allow test.

## Research Notes

- Official/mirrored wiki for YTMDesktop Companion Server API v1 says the docs apply to v2.0.0+.
- `POST /auth/request` may take up to 30 seconds while waiting for user interaction.
- Tokens are bound to `appId`; requesting another token with the same `appId` overwrites the prior token.
- REST authenticated requests pass the valid token as the `Authorization` header value.
- Socket.IO realtime connects to `/api/v1/realtime`, websocket transport only, with `auth.token`.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live YTMDesktop cannot be run in this environment. | Runtime-only issues may remain. | Fix code-level race/diagnostics and require local live QA. |
| Auth retry could keep an invalid stale token longer. | User may still need `Clear auth` for truly invalid tokens. | Preserve token only for post-approval retries; normal stale-token paths can still surface auth-required state. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Report: pending
- Time log: `project-tracking/time-log.md`
- Related tasks: `0020-fix-live-companion-auth-post-approval-stall.md`, `0021-full-code-audit-after-auth-fixes.md`
