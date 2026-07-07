# 0020 - Fix Live Companion Auth Post-Approval Stall Report

## Summary

Fixed the remaining Companion authorization stall where the user approved the matching YTMDesktop prompt but the widget could return to `Authorization needed` / `Not authorized` instead of connecting.

The main issue was in the post-approval controller path: after `completeAuth` succeeded, `reconnectNow()` performed the normal `hasStoredAuth()` precheck and could stop before attempting `companion_connect`. The fix treats successful `completeAuth` as the stronger signal and attempts the real connection immediately, while still allowing the backend to reject missing/invalid tokens.

## Done

- Rechecked the official Companion API v2 flow and upstream YTMDesktop implementation.
- Confirmed raw `Authorization` header usage from upstream `isAuthValidMiddleware`.
- Changed post-approval reconnect to bypass the preliminary stored-auth gate and call the backend connection path.
- Updated the connection state machine so successful real connections can mark `hasStoredAuth: true`.
- Added a regression test for `completeAuth` success while `hasStoredAuth()` still returns `false`.
- Improved Rust auth response parsing and diagnostics for unexpected auth code/token responses.
- Added Rust unit coverage for nested auth extraction, numeric code extraction, and avoiding unrelated nested strings.
- Updated roadmap and time tracking.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0020-a` |
| Started at | `2026-07-07T02:55:33+02:00` |
| Finished at | `2026-07-07T03:05:57+02:00` |
| Time spent minutes | `11` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Better auth response parsing and diagnostics in `companion.rs`. |
| Frontend | Not directly changed | UI consumes corrected connection state. |
| Domain/API contracts | Changed | `connected` state can explicitly carry `hasStoredAuth`. |
| Tests | Changed | Added post-approval stale-auth-probe regression coverage. |
| Documentation | Changed | Project tracking updated. |
| Build/release/config | Not changed | Portable build path unchanged. |
| Bootstrap sync | Not applicable | No bootstrap rules changed. |
| Time tracking | Changed | Added `2026-07-07-0020-a`. |
| Project tracking | Changed | Added task/report and roadmap entry. |

## Changed Files

- `src/domain/playback/connectionMachine.ts`
- `src/domain/playback/controller.ts`
- `tests/domain/playback/controller.test.ts`
- `src-tauri/src/companion.rs`
- `project-tracking/tasks/0020-fix-live-companion-auth-post-approval-stall.md`
- `project-tracking/reports/0020-fix-live-companion-auth-post-approval-stall.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Companion API source research | Passed | Re-read upstream YTMDesktop auth code/token endpoints and auth middleware. |
| Static checks | Reviewed | Checked controller transition path, state reducer, and Rust helper logic by inspection. |
| Tests | Not run here | Connector-only workflow has no local repo checkout/dependencies for running Vitest or Cargo. |
| Build | Not run here | Windows portable build must be rerun locally: `npm run build:portable`. |
| Manual QA | Not run here | Requires a live local YTMDesktop instance and the Windows app. |
| Docs review | Passed | Tracking docs updated; README API assumptions remain aligned. |
| Release/config review | Passed | No release/package config changed. |
| Time tracking review | Passed | Task, report, and time-log use the same timestamps/duration. |

## Not Verified

- Live Allow button round-trip against the user's local YTMDesktop instance.
- Windows keyring write/read behavior on the user's machine.
- `npm run build:portable` after these GitHub App commits.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Is raw token auth still correct? | Yes. Upstream hashes `request.headers.authorization` directly. |
| Is `/auth/request` allowed to be called immediately after code generation? | Yes. It consumes the code, opens the prompt, waits up to 30 seconds, then returns `{ token }` after Allow. |
| Should successful approval rely on another `hasStoredAuth()` before connecting? | No. The controller now attempts `companion_connect` directly after successful `completeAuth`. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the user's Windows keyring accept and return the token reliably in the portable build? | User / next live QA pass | Rebuild and retry auth; if it still fails, capture the new displayed error detail. |

## Residual Risks

- If the remaining live failure is an OS keyring backend issue, the app may still fail to connect, but it should now expose a more specific error instead of silently stopping before `companion_connect`.
- The Rust changes were reviewed but not compiled in this connector-only environment.

## Next Steps

- Pull the latest GitHub App commits.
- Run `npm run build:portable`.
- In YTMDesktop, enable Companion Server and its authorization window, generate a fresh code, click Allow, and confirm the widget reaches `Connected` with `Authorized`.
