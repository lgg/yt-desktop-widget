# 0029 - Fix Companion Post-Approval Loop After Realtime URL Report

## Summary

Fixed the remaining post-approval reconnect loop introduced by task `0028`: the code treated `/api/v1/realtime` as the Engine.IO transport path for `rust_socketio`, but live YTMDesktop exposes the Engine.IO server at the normal Socket.IO route and uses `/api/v1/realtime` as the Socket.IO namespace.

The backend now gives `rust_socketio` the base Companion URL and still sets namespace `/api/v1/realtime`. This matches the live local probe and prevents a valid stored token from getting stuck at `Stored securely` + `Reconnecting` because realtime cannot open.

## Done

- Re-read project rules, prior Companion auth tasks/reports, current code, and official YTMDesktop Companion docs.
- Probed local YTMDesktop routes without tokens:
  - `/metadata` returned `200`.
  - `/api/v1/state` without auth returned `401`.
  - `/socket.io/?EIO=4&transport=polling` returned `400 Transport unknown`, proving the Engine.IO route exists and rejects polling as documented.
  - `/api/v1/realtime/?EIO=4&transport=polling` returned `404`, proving it is not the Engine.IO transport path.
- Checked Windows Credential Manager listing for matching targets without printing secrets; no matching credential was visible.
- Added a regression test for the Socket.IO base URL.
- Updated the backend Socket.IO builder URL and README wording.
- Ran focused and full validation, including desktop build.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0029-a` |
| Started at | `2026-07-08T14:37:58.9287765+03:00` |
| Finished at | `2026-07-08T14:46:04.0937255+03:00` |
| Time spent minutes | `9` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | `rust_socketio` now receives `http://<host>:<port>` and namespace `/api/v1/realtime`. |
| Frontend | Not changed | Existing post-auth retry and auth state behavior remains unchanged. |
| Domain/API contracts | Changed | README clarifies Socket.IO base URL vs realtime namespace. |
| Tests | Changed | Rust regression test now protects the Socket.IO base URL behavior. |
| Documentation | Changed | README, task, report, roadmap, and time-log updated. |
| Build/release/config | Verified | No release config change; desktop build passed with a temporary target directory. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Project tracking | Changed | New task/report and roadmap/time-log rows. |

## Changed Files

- `src-tauri/src/companion.rs`
- `README.md`
- `project-tracking/tasks/0029-fix-companion-post-approval-loop-after-realtime-url.md`
- `project-tracking/reports/0029-fix-companion-post-approval-loop-after-realtime-url.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Live route probe | Passed | Confirmed `/socket.io` is the Engine.IO route and `/api/v1/realtime` is not the Engine.IO route. |
| Safe credential probe | Completed | `cmdkey` search printed no secrets and showed no matching credential target. |
| Focused Rust tests | Passed | `cargo test --quiet companion::tests -j1`: `12 passed`. |
| Full Rust tests | Passed | `cargo test --quiet -j1`: `12 passed`. |
| Frontend verification | Passed | `npm run verify`: ESLint, `29` Vitest tests, and web build passed. |
| Native check | Passed | `cargo check -j1` finished successfully. |
| Desktop build | Passed | `npm run build:desktop` passed with temporary `CARGO_TARGET_DIR`; output exe was built under `%TEMP%`. |
| Security review | Passed | No token values were printed, logged, or committed. |
| Time tracking review | Passed | Task, report, roadmap, and time-log agree. |

## Not Verified

- A full fresh Allow round-trip with the newly built executable was not manually completed inside this pass.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why did the app still reconnect after task `0028`? | The Socket.IO transport URL was changed to `/api/v1/realtime`, but live YTMDesktop's Engine.IO route is `/socket.io`; `/api/v1/realtime` is the namespace. |
| Does this require a frontend auth-state change? | No. Code tracing showed socket/network errors do not clear the token by themselves; the remaining confirmed mismatch is backend Socket.IO URL construction. |
| Was any token exposed during diagnosis? | No. Only status codes and non-secret credential target search results were printed. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the fresh executable complete the live Allow round-trip on the user's machine? | User / next manual QA pass | Run the rebuilt app, clear old auth once if needed, approve a new code in YTMDesktop, and confirm it reaches connected state. |

## Residual Risks

- If the user is still running an older already-open executable, they will keep seeing the previous behavior until the rebuilt binary is launched.
- If YTMDesktop rejects new token issuance or revokes the token immediately, the app can still return to auth-required for a genuine auth failure.
- `src-tauri/Cargo.toml` remains a pre-existing line-ending-only unstaged change and is intentionally not part of this task.

## Next Steps

- Launch the newly built/pushed app and retry Companion authorization once.
