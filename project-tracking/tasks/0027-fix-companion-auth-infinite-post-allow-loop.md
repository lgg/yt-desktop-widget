# 0027 - Fix Companion Auth Infinite Post-Allow Loop

## Status

Completed

## Context

After the previous post-Allow state fix, live YTMDesktop v2.0.11 Companion authorization still loops: the user clicks Allow, the widget shows `Reconnecting` with the post-auth retry detail, then returns to the authorization-required flow. Repeating Allow repeats the cycle.

This follows Companion auth tasks `0017` through `0026`. The repeated failure means the root cause is likely below the UI status layer: token exchange, token validation, REST auth header format, Socket.IO connection setup, or local token invalidation behavior.

## Goal

Identify and fix the root cause that prevents a freshly approved Companion token from producing a stable connected session.

## Scope

Included:

- Re-audit the Companion auth/connect code against current official docs.
- Collect live local evidence from `127.0.0.1:9863` without logging or storing token values.
- Trace token exchange, REST validation, Socket.IO setup, and frontend retry/auth-state transitions.
- Add regression coverage for the confirmed loop cause.
- Update task/report/roadmap/time-log and run relevant validation.

Out of scope:

- Switching away from the official Companion Server API.
- Persisting tokens anywhere except the existing OS keyring-backed backend.
- Broad UI redesign or release packaging changes.

## Affected Areas

- Backend/native: Companion API client, auth/token validation, socket connection.
- Frontend/domain: controller retry/auth-state transitions if the loop is frontend-caused.
- Integration bridge: Tauri bridge only if option/event flow is implicated.
- Tests: focused regression coverage for the confirmed loop.
- Documentation: project tracking; README only if protocol assumptions change.
- Build/release/config: no expected packaging/config change.
- Project tracking: task, report, roadmap, time-log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0027-a` |
| Started at | `2026-07-08T02:29:16.2098775+03:00` |
| Finished at | `2026-07-08T02:43:27.9224709+03:00` |
| Time spent minutes | `15` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] The confirmed cause of the post-Allow loop is documented with evidence.
- [x] Freshly approved tokens are validated according to the official Companion API behavior.
- [x] The widget does not return to auth-required after Allow when the token is valid and YTMDesktop is reachable.
- [x] Regression tests cover the fixed failure mode.
- [x] Related tracking files are updated.
- [x] Validation is run or any skipped check is explicitly documented.

## Verification Plan

- [x] Official docs review: confirmed auth endpoints, token auth header, and websocket-only realtime behavior.
- [x] Live local Companion probe: `/metadata` returned `200`, `/state` without token returned `401 UNAUTHORIZED`, auth endpoints returned `403 AUTHORIZATION_DISABLED`.
- [x] Focused regression test: controller, real gateway, and Rust auth error classification tests.
- [x] `npm run verify`: passed.
- [x] `cargo check -j1`: passed.
- [x] `npm run build:desktop`: first failed because `cargo` was not in PATH, then passed with `C:\Users\fgcod\.cargo\bin` prepended.
- [x] Manual/live auth limitation: full Allow round-trip could not be completed because the live server currently reports auth requests disabled.
- [x] Time tracking review: task/report/time-log agree.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does YTMDesktop return a token that works with raw `Authorization` immediately after Allow? | Partially resolved | The current live server did not allow a new token exchange: both auth endpoints returned `403 AUTHORIZATION_DISABLED`. The code now classifies that explicitly instead of treating it as generic auth-required. |
| Does Socket.IO emit an auth/connect error after REST `/state` succeeds? | Resolved for this pass | The current screenshot state is caused by REST validation returning `auth_required`, not by a Socket.IO event. Socket setup was reviewed but not the confirmed root for this cycle. |
| Are we invalidating the fresh token by generating another code with the same `appId` while an auth request is still pending? | Resolved | The controller already deduplicates active token exchange for the same code. This pass avoids unnecessary new auth requests during diagnostics and surfaces disabled authorization instead. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live Allow requires user interaction in YTMDesktop. | Automated proof may be partial. | Use a local probe that prints only the code and non-secret status; document any remaining manual step. |
| Token data is sensitive. | Credential leakage. | Do not print tokens; only use in memory for validation and store through existing keyring path. |
| Repeated auth attempts overwrite tokens for the same `appId`. | Existing token may be invalidated during investigation. | Avoid unnecessary auth code generation and prefer current stored-token validation first. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related tasks: `0022`, `0025`, `0026`
- Related reports: `project-tracking/reports/0027-fix-companion-auth-infinite-post-allow-loop.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: Branch `codex-0027-fix-companion-auth-loop`
