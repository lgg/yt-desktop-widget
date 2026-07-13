# 0008 - Validate live Companion auth, realtime, commands, and seek against a real YTMDesktop instance Report

## Summary

The project was audited against the official YTMDesktop v2 Companion Server API v1 documentation. The main mismatch was real: the Rust bridge and README still used older Companion assumptions for metadata, command routes, auth request bodies, appId format, and REST authorization headers. The code and docs are now aligned with the documented v2 contract.

A follow-up audit found and fixed two additional edge cases: stale keyring tokens could survive an auth-required response after the `appId` correction, and invalid seek seconds could be serialized into command payloads if a caller bypassed normal UI constraints.

A deeper full-code audit found and fixed two non-protocol runtime bugs: the playback progress smoother mixed `performance.now()` with `Date.now()`, preventing smooth elapsed-time movement between realtime updates, and Tauri settings changes made in the Settings window were not propagated to the separate main widget webview until reload/restart. The user subsequently confirmed auth, reconnect, realtime, playback commands, live seek/progress, settings, and the latest portable behavior by 2026-07-13; closing validation is recorded in report `0036`.

## Done

- Updated native Companion discovery from `GET /api/v1/metadata` to public `GET /metadata`.
- Updated auth-code requests to send `appId`, `appName`, and `appVersion`.
- Updated auth completion to send `appId` and `code`.
- Replaced invalid dotted/hyphenated auth `appId` with `ytmdesktopwidget`, matching the v2 lowercase-alphanumeric rule.
- Updated REST state and command requests to send the token as the raw `Authorization` header value.
- Replaced old command endpoints with `POST /api/v1/command` payloads.
- Added native unit tests for `appId` constraints and command payload mapping.
- Added native invalid seek payload clamping and test coverage.
- Clear stale keyring tokens when Companion returns auth-required during connect or command execution.
- Fixed progress smoothing to use the same wall-clock source as Companion snapshots.
- Added a Vitest regression test for playback progress smoothing.
- Added a Tauri settings-change event so saved Settings-window changes are applied by the main widget window immediately.
- Updated README, architecture notes, decision notes, and task tracking.
- Recorded successful live YTMDesktop/portable confirmation for auth, reconnect, realtime, playback commands, seek/progress timing, and settings behavior.

## Changed Areas

| Area                 | Status   | Notes                                                                                                                                                                                                                              |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Updated  | `src-tauri/src/companion.rs` follows the documented v2 Companion contract and clamps invalid seek payloads. `src-tauri/src/lib.rs` clears stale stored tokens on auth-required failures and emits saved settings to every webview. |
| Frontend             | Updated  | `src/app/AppProvider.tsx` listens for cross-window settings updates; `src/domain/playback/progress.ts` now uses the same clock as mapped Companion snapshots.                                                                      |
| Domain/API contracts | Updated  | Command semantics are now documented as `{ command, data }` payloads sent to `/api/v1/command`.                                                                                                                                    |
| Tests                | Updated  | Added Rust unit tests for appId constraints, command payload construction, and invalid seek payload clamping. Added Vitest coverage for progress smoothing.                                                                        |
| Documentation        | Updated  | README, ARCHITECTURE, DECISIONS, and task tracking now point to the current v2 wiki and current endpoint assumptions.                                                                                                              |
| Build/release/config | Reviewed | No packaging, Tauri permission, env, or release config changes were needed.                                                                                                                                                        |

## Changed Files

- `src-tauri/src/companion.rs`
- `src-tauri/src/lib.rs`
- `src/integration/companion/tauriBridge.ts`
- `src/app/AppProvider.tsx`
- `src/domain/playback/progress.ts`
- `tests/domain/playback/progress.test.tsx`
- `README.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/reports/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/roadmap/0000-roadmap.md`

## Verification

| Check                     | Result | Notes                                                                                                                                                                                                                |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Official docs review      | Passed | Checked the official v2 Companion Server API v1 wiki.                                                                                                                                                                |
| Latest app release review | Passed | Checked current upstream YTMDesktop release information; the repo remains aligned with the documented v2 Companion API used by YTMDesktop 2.0.0+.                                                                    |
| Code audit                | Passed | Reviewed the native bridge, Tauri command layer, Tauri bridge, multi-window settings flow, command types, state machine behavior, progress smoothing, state mapping, README, architecture notes, and decision notes. |
| Lint/static checks        | Passed | Task `0036` passed `npm run verify` and `cargo check -j1`.                                                                                                                                                           |
| Tests                     | Passed | Task `0036` passed 55 Vitest, 8 Playwright, and 16 Rust tests.                                                                                                                                                       |
| Build                     | Passed | Task `0036` produced the `2.0.0` portable desktop executable.                                                                                                                                                        |
| Manual QA                 | Passed | The user confirmed the live Companion and latest portable behavior on 2026-07-13.                                                                                                                                    |
| Docs review               | Passed | README and internal docs no longer point to the broken/old Companion wiki page.                                                                                                                                      |
| Release/config review     | Passed | No release, installer, env, Docker, Coolify, or Tauri permission changes were introduced.                                                                                                                            |

## Not Verified

- Uncommon upstream edge states such as every possible ad, livestream, expired-token, and transient-restart payload were not exhaustively enumerated; they remain normal future regression coverage rather than blockers for this task.

## Questions Resolved

| Question                                                         | Resolution                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Which Companion docs should README link to?                      | The current official page is `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`.                   |
| Is `/api/v1/metadata` valid for v2 discovery?                    | No. The metadata endpoint is public `GET /metadata` and must not be prefixed with `/api/v1`.                                         |
| Are commands separate endpoints?                                 | No. v2 uses `POST /api/v1/command` with command payloads such as `playPause`, `next`, and `seekTo`.                                  |
| Is the old `appId` valid?                                        | No. v2 docs require lowercase alphanumeric, 2-32 characters. The app now uses `ytmdesktopwidget`.                                    |
| Should REST auth use Bearer auth?                                | The v2 docs say the token is passed as the `Authorization` header value, so the bridge now sends the raw token value.                |
| What happens to stale stored tokens after the appId correction?  | The native Tauri command layer now clears the stored token when Companion returns auth-required during connect or command execution. |
| Can invalid seek seconds be sent to Companion?                   | The native command payload builder now clamps negative and non-finite seek values to `0`.                                            |
| Why did progress not move smoothly between updates?              | The smoothing hook compared `performance.now()` to `Date.now()` timestamps. It now uses `Date.now()` consistently.                   |
| Do settings changes apply immediately across both Tauri windows? | Yes. The backend now emits a settings-change event on save, and each AppProvider applies it if the payload differs.                  |

## Open Questions

None for task acceptance.

## Residual Risks

- Upstream YTMDesktop can add new payload variants; keep mapping defensive and rerun live smoke after Companion upgrades.
- Ads and livestreams may expose duration/progress shapes outside ordinary tracks, though current mapping clamps invalid values.

## Next Steps

- Keep the closed live paths in future portable regression smoke passes.
- Track richer runtime diagnostics separately in deferred task `0013`.
- See closing report [`0036-add-display-controls-localization-and-central-versioning.md`](0036-add-display-controls-localization-and-central-versioning.md).
