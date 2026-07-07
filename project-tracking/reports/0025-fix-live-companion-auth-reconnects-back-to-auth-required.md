# 0025 - Fix Live Companion Auth Reconnects Back To Auth Required Report

## Summary

Fixed the remaining app-side cause of the live auth loop where YTMDesktop accepted the code, the widget entered `Reconnecting`, and then returned to authorization required.

The root cause was the cross-window auth-change path added in `0023`: when Settings completed auth and emitted `companion://auth-changed`, the main window handled it with ordinary `reconnectNow()`. Ordinary reconnect did not set `preserveAuthOnFailure`, so the first post-Allow `401/403` from `companion_connect` could clear the freshly stored token. That exactly matches the observed sequence: Allow accepted, reconnect starts, token is cleared, UI returns to auth-required.

Now external auth changes use the same safe post-approval reconnect path as the window that generated the code.

## Done

- Reviewed current user-provided Companion Server API docs.
- Audited current controller, AppProvider, bridge, native auth/token storage, and recent auth tasks.
- Added `PlaybackController.handleExternalAuthChanged(authorized)`.
- Routed main-window `companion://auth-changed` events through the safe post-auth reconnect path.
- Kept external auth clear events local-only so they do not call `clearAuth()` a second time.
- Added regression tests for external auth-change reconnect and external auth clear behavior.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0025-a` |
| Started at | `2026-07-07T05:41:51+03:00` |
| Finished at | `2026-07-07T05:45:48+03:00` |
| Time spent minutes | `4` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Reviewed | No native change required; bug was frontend controller path choosing destructive reconnect. |
| Frontend | Changed | Main-window auth-change listener now delegates to controller auth-change handler. |
| Domain/API contracts | Changed | Controller exposes explicit external auth-change handling. |
| Tests | Changed | Added controller regressions; updated AppProvider expectation. |
| Documentation | Changed | Project tracking updated. |
| Build/release/config | Verified | No config changes. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Time tracking | Changed | Added `0025` row. |
| Project tracking | Changed | Added task/report and roadmap entry. |

## Changed Files

- `src/domain/playback/controller.ts`
- `src/app/AppProvider.tsx`
- `tests/domain/playback/controller.test.ts`
- `tests/app/AppProvider.test.tsx`
- `project-tracking/tasks/0025-fix-live-companion-auth-reconnects-back-to-auth-required.md`
- `project-tracking/reports/0025-fix-live-companion-auth-reconnects-back-to-auth-required.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Focused tests | Passed | `npm test -- tests/domain/playback/controller.test.ts tests/app/AppProvider.test.tsx`: 2 files / 9 tests passed. |
| Lint/static/tests/web build | Pending at report write | `npm run verify` runs after tracking update so the final commit includes the report. |
| Rust check | Pending at report write | `cargo check -j1` runs after tracking update. |
| Desktop build | Pending at report write | `npm run build:desktop` runs after tracking update. |
| Manual QA | Not run | Requires live local YTMDesktop Companion Server. |
| Docs review | Passed | User-provided docs were reviewed; local shell fetch was blocked by network restrictions. |
| Git completion | Pending at report write | Commit, merge, push happen after checks and tracking update. |

## Not Verified

- Live YTMDesktop Allow flow on the user's machine.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why did the widget go from Allow to Reconnecting to auth-required? | The main window's external auth-change listener used ordinary reconnect, which could clear the freshly stored token on the first transient auth validation failure. |
| Does the fix expose tokens to the frontend? | No. It only changes controller routing; tokens remain in native keyring-backed storage. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the rebuilt executable complete live auth on the user's machine? | User/local QA | Run the rebuilt portable exe, clear auth once, generate code, approve in YTMDesktop, and confirm it reaches Connected. |

## Residual Risks

- If YTMDesktop persistently rejects the token returned by `/auth/request`, this fix prevents accidental app-side token clearing but live diagnostics would still be needed.
- Live docs were available through the user-provided URLs and browser lookup, but direct shell fetch was blocked in this environment.

## Next Steps

- Run full validation, commit the branch, merge to `master`, and push.
