# 0027 - Fix Companion Auth Infinite Post-Allow Loop Report

## Summary

Fixed the next confirmed cause of the live Companion auth loop: the app treated every `403` from YTMDesktop as generic `auth_required`. The live local Companion server now returns `AUTHORIZATION_DISABLED` for both auth endpoints, which means new authorization requests are disabled on the YTMDesktop side. The app now detects that code, surfaces a direct error, and no longer sends the user back into an impossible authorization loop.

The post-Allow token activation retry window was also extended from about 3.4 seconds to about 30 seconds, so a valid token that is slow to become usable is polled for longer before the UI falls back.

## Done

- Re-read the relevant project and previous Companion auth task/report context.
- Re-checked the official Companion API behavior.
- Probed the live local Companion API without printing tokens.
- Added regression tests for disabled authorization propagation and longer protected post-auth retry.
- Implemented body-aware `403` classification in Rust.
- Propagated `authorization_disabled` through the Tauri bridge and frontend gateway.
- Made pairing-code generation failures visible in controller state instead of unhandled/silent rejections.
- Ran focused and full validation, including portable desktop build.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0027-a` |
| Started at | `2026-07-08T02:29:16.2098775+03:00` |
| Finished at | `2026-07-08T02:43:27.9224709+03:00` |
| Time spent minutes | `15` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | `AUTHORIZATION_DISABLED` is parsed from JSON error bodies and returned as `authorization_disabled`. |
| Frontend | Changed | Request-code failures now update connection state to `error` with the backend detail. |
| Domain/API contracts | Changed | `GatewayError` includes `authorization_disabled`; post-auth retry delays are longer. |
| Tests | Changed | Added controller, gateway, and Rust regression coverage. |
| Documentation | Changed | Task, report, roadmap, and time-log updated. |
| Build/release/config | Verified | No release config change; portable build passed. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Project tracking | Changed | New task/report and roadmap/time-log rows. |

## Changed Files

- `src-tauri/src/companion.rs`
- `src/domain/playback/controller.ts`
- `src/domain/playback/types.ts`
- `src/domain/playback/controller.test.ts`
- `src/integration/companion/realGateway.ts`
- `tests/integration/companion/realGateway.test.ts`
- `project-tracking/tasks/0027-fix-companion-auth-infinite-post-allow-loop.md`
- `project-tracking/reports/0027-fix-companion-auth-infinite-post-allow-loop.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Live Companion probe | Completed | `/metadata` returned `200`; `/state` without token returned `401 UNAUTHORIZED`; `/auth/requestcode` and `/auth/request` returned `403 AUTHORIZATION_DISABLED`. |
| Focused TS tests | Passed | `npm test -- src/domain/playback/controller.test.ts tests/integration/companion/realGateway.test.ts`. |
| Focused Rust test | Passed | `cargo test companion::tests::classifies_disabled_authorization_requests_from_error_body -j1`. |
| Full frontend verification | Passed | `npm run verify`: lint, 29 Vitest tests, and web build passed. |
| Native check | Passed | `C:\Users\fgcod\.cargo\bin\cargo.exe check -j1`. |
| Desktop build | Passed after PATH fix | Plain `npm run build:desktop` failed because `cargo` was not in PATH; rerun with `C:\Users\fgcod\.cargo\bin` prepended passed and built the portable exe. |
| Security review | Passed | No tokens printed, no new token storage path, no secrets committed. |
| Time tracking review | Passed | Task, report, and time-log agree. |

## Not Verified

- A successful live Allow round-trip could not be completed during this pass because the live YTMDesktop Companion server currently rejects new auth requests with `AUTHORIZATION_DISABLED`.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why does the app return to authorization again instead of explaining the real blocker? | Rust classified all `403` responses as `auth_required` without reading the JSON body. |
| Is the current local Companion endpoint reachable? | Yes. `/metadata` returns `200` with `apiVersions: ["v1"]`. |
| Can the server currently issue new tokens? | No. The live auth endpoints returned `403 AUTHORIZATION_DISABLED`, so YTMDesktop must allow authorization requests before a new token can be issued. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Which YTMDesktop UI toggle currently disables auth requests on the user's machine? | User | Open YTMDesktop Companion Server settings and enable authorization requests / pairing, then retry the widget. |

## Residual Risks

- If YTMDesktop still returns `AUTHORIZATION_DISABLED`, the app cannot create a new token because the server refuses the official auth flow. The fix now surfaces that exact reason instead of looping.
- If auth requests are enabled and the token still takes longer than 30 seconds to validate, live YTMDesktop behavior will need another probe; the previous 3.4-second retry window is already extended substantially.
- `src-tauri/Cargo.toml` still appears as a pre-existing line-ending-only unstaged change and is intentionally not part of this task.

## Next Steps

- Rebuild/run the portable exe and retry authorization after enabling Companion authorization requests in YTMDesktop.
