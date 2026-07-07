# 0023 - Audit and Fix Live Companion Auth After Latest Pull Report

## Summary

Updated the repository from `origin/master`, audited the current Companion auth/connect path, and fixed the remaining code-level cause that can leave the main widget stuck after Allow: Companion auth changes completed in one window were not broadcast to the main widget controller.

Settings could successfully complete `/auth/request` and store the token, but the main widget might already be sitting in `auth_required` without an active backend listener or scheduled retry. It therefore had no trigger to re-check stored auth or connect. The fix adds a native `companion://auth-changed` event after token store/clear and makes the main real-mode `AppProvider` reconnect when that event arrives.

## Done

- Pulled latest code with `git pull --rebase`; local `master` fast-forwarded from `0de18eb` to `79f8c98`.
- Reviewed README, AGENTS, roadmap, definition of done, and recent auth tasks/reports `0020` through `0022`.
- Audited controller, real gateway, Tauri bridge, native command layer, keyring token flow, and settings/main window lifecycle.
- Added cross-window auth-change synchronization from native Tauri commands to the main React controller.
- Added regression coverage for main-window reconnect on auth change.
- Fixed an existing controller lifecycle test precondition so it actually establishes auth before expecting an active connection disposal.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0023-a` |
| Started at | `2026-07-07T05:09:57+03:00` |
| Finished at | `2026-07-07T05:22:08+03:00` |
| Time spent minutes | `13` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Emits `companion://auth-changed` after successful auth completion and auth clear. |
| Frontend | Changed | Main real-mode `AppProvider` listens for auth changes and reconnects its controller. |
| Domain/API contracts | Changed | Tauri bridge now exposes a typed auth-change listener. |
| Tests | Changed | Added AppProvider auth-change regression test and fixed a controller lifecycle mock precondition. |
| Documentation | Changed | Project tracking updated. |
| Build/release/config | Verified | No packaging policy or permission changes. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Time tracking | Changed | Task/report/time-log updated. |
| Project tracking | Changed | Task, report, roadmap, and time-log updated. |

## Changed Files

- `src-tauri/src/lib.rs`
- `src-tauri/src/models.rs`
- `src/app/AppProvider.tsx`
- `src/integration/companion/tauriBridge.ts`
- `tests/app/AppProvider.test.tsx`
- `tests/domain/playback/controller.test.ts`
- `project-tracking/tasks/0023-audit-and-fix-live-companion-auth-after-latest-pull.md`
- `project-tracking/reports/0023-audit-and-fix-live-companion-auth-after-latest-pull.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Git update | Passed | `git pull --rebase` fast-forwarded to `79f8c98`. |
| Focused tests | Passed | `npm test -- tests/app/AppProvider.test.tsx tests/domain/playback/controller.test.ts`: 2 files, 7 tests passed. |
| Lint/static/tests/web build | Passed | `npm run verify`: ESLint ok, 10 test files / 23 tests passed, `tsc -b && vite build` ok. |
| Rust check | Passed | `cargo check -j1` finished successfully. |
| Desktop build | Passed | `npm run build:desktop` built `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Rust formatting | Not run | `cargo fmt` failed because `cargo-fmt.exe` is not installed for the stable MSVC toolchain. |
| Manual QA | Not run | Live YTMDesktop Companion Server interaction was not exercised in this automated pass. |
| Docs review | Passed | Project tracking updated; README did not need behavior changes. |
| Release/config review | Passed | No Tauri permissions, packaging policy, env, Docker, or installer changes. |
| Time tracking review | Passed | Task/report/time-log values match. |

## Not Verified

- Live Allow flow against a running local YTMDesktop Companion Server.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why can the widget stay unchanged after Allow even if Settings completes auth? | The main widget controller was not notified when another webview stored or cleared auth, so it could stay in `auth_required` indefinitely. |
| Should auth tokens be sent to frontend to solve this? | No. The fix sends only a boolean auth-change event; token values remain in native keyring-backed storage. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the rebuilt app now complete the live YTMDesktop Allow flow on the user's machine? | User/local QA | Run the rebuilt portable exe, clear auth once, generate code, click Allow in YTMDesktop, and confirm the main widget reconnects. |

## Residual Risks

- If live YTMDesktop returns a token but immediately rejects all authenticated REST calls, the earlier post-auth retry path handles transient cases but persistent rejection will still require live diagnostics.
- If Windows Credential Manager itself fails to store the token, the UI should surface an error from the native command, but local OS-specific validation is still needed.

## Next Steps

- Run live YTMDesktop Companion QA with the rebuilt portable executable.
