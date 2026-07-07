# 0026 - Fix Companion Auth Post-Allow Authorized State Report

## Summary

Fixed the post-Allow Companion auth state regression where the app could show `Reconnecting` and `Not authorized` during the protected fresh-token retry window. The controller now treats the explicit post-auth reconnect path as authorized while it validates the newly issued token, and clears the stale pairing code from connection state.

## Done

- Audited current auth implementation against the official YTMDesktop Companion v2 docs.
- Confirmed local Companion server availability via `GET http://127.0.0.1:9863/metadata`.
- Added a failing controller regression test for a transient `auth_required` during post-auth reconnect.
- Updated controller/state-machine logic so protected post-auth reconnects keep `hasStoredAuth=true` and clear `authCode`.
- Ran focused and broad validation.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0026-a` |
| Started at | `2026-07-08T01:45:42.4667203+03:00` |
| Finished at | `2026-07-08T01:56:34.8302800+03:00` |
| Time spent minutes | `11` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Reviewed | No Rust behavior changed; native check passed. |
| Frontend | Changed | Settings authorization state now stays authorized during protected post-auth reconnect retry. |
| Domain/API contracts | Changed | `discovering` state can explicitly clear a stale auth code. |
| Tests | Changed | Added controller regression coverage for the fresh post-auth retry state. |
| Documentation | Reviewed | Companion auth and Socket.IO docs checked; no README behavior change required. |
| Build/release/config | Not changed | No packaging/config changes. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Time tracking | Changed | Task/report/time-log updated. |
| Project tracking | Changed | Task, report, and roadmap updated. |

## Changed Files

- `src/domain/playback/controller.ts`
- `src/domain/playback/connectionMachine.ts`
- `src/domain/playback/controller.test.ts`
- `project-tracking/tasks/0026-fix-companion-auth-post-allow-authorized-state.md`
- `project-tracking/reports/0026-fix-companion-auth-post-allow-authorized-state.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Focused regression | Passed | `npm test -- src/domain/playback/controller.test.ts` after first confirming the new test failed. |
| Lint/static checks | Passed | `npm run verify` includes ESLint and TypeScript build. |
| Tests | Passed | `npm run verify`: 10 files, 26 tests passed. |
| Build | Passed | `npm run verify`: Vite production build completed. |
| Native check | Passed | `C:\Users\fgcod\.cargo\bin\cargo.exe check -j1` passed on second run after the first timed out compiling dependencies. |
| Manual QA | Partial | `GET /metadata` returned `apiVersions: ["v1"]`; unauthenticated `GET /api/v1/state` returned `401` as expected. |
| Docs review | Passed | Official docs confirm auth endpoints, raw `Authorization`, 30-second `/auth/request`, websocket-only realtime auth token. |
| Release/config review | Passed | No release, packaging, or config files changed intentionally. |
| Time tracking review | Passed | Task, report, and time-log use the same iteration fields. |

## Not Verified

- Full live Allow round-trip inside the user's YTMDesktop prompt was not completed from this environment. The local server was reachable, but pressing Allow is a user-side interactive step.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why can the UI say `Not authorized` immediately after a successful Allow? | The controller re-read stored-auth state at the start of post-auth reconnect and used that value for UI state even on the explicit fresh-token path. A transient auth validation failure then preserved the retry but left `hasStoredAuth=false`. |
| Should a truly invalid/revoked token still fall back to auth required? | Yes. The authorized-state preservation is limited to the explicit `skipStoredAuthGate + preserveAuthOnFailure` post-auth real-gateway path and finite retry window. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the full user-side Allow round-trip now connect on the user's machine? | User | Run the updated build against YTMDesktop v2.0.11 and confirm the Settings card changes to stored/connected after Allow. |

## Residual Risks

- The live Companion flow still depends on YTMDesktop's interactive prompt timing and socket startup behavior; this fix covers the observed stale UI/auth-state path and existing retry behavior, not every possible upstream timing failure.
- Existing uncommitted `src-tauri/Cargo.toml` line-ending state was present before this pass and is intentionally not part of this task.

## Next Steps

- User should verify one live auth round-trip in YTMDesktop v2.0.11 with the updated build.
