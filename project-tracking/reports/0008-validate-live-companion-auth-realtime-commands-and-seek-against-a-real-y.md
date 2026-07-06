# 0008 - Validate live Companion auth, realtime, commands, and seek against a real YTMDesktop instance Report

## Summary

The project was audited against the official YTMDesktop v2 Companion Server API v1 documentation. The main mismatch was real: the Rust bridge and README still used older Companion assumptions for metadata, command routes, auth request bodies, appId format, and REST authorization headers. The code and docs are now aligned with the documented v2 contract, but live YTMDesktop verification remains open.

## Done

- Updated native Companion discovery from `GET /api/v1/metadata` to public `GET /metadata`.
- Updated auth-code requests to send `appId`, `appName`, and `appVersion`.
- Updated auth completion to send `appId` and `code`.
- Replaced invalid dotted/hyphenated auth `appId` with `ytmdesktopwidget`, matching the v2 lowercase-alphanumeric rule.
- Updated REST state and command requests to send the token as the raw `Authorization` header value.
- Replaced old command endpoints with `POST /api/v1/command` payloads.
- Added native unit tests for `appId` constraints and command payload mapping.
- Updated README, architecture notes, decision notes, and task tracking.

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Updated | `src-tauri/src/companion.rs` now follows the documented v2 Companion contract for metadata, auth, state, commands, and request auth headers. |
| Frontend | Reviewed | The frontend command interface already maps cleanly to the backend enum; no UI contract change was needed. |
| Domain/API contracts | Updated | Command semantics are now documented as `{ command, data }` payloads sent to `/api/v1/command`. |
| Tests | Updated | Added Rust unit tests for appId constraints and command payload construction. |
| Documentation | Updated | README, ARCHITECTURE, DECISIONS, and task tracking now point to the current v2 wiki and current endpoint assumptions. |
| Build/release/config | Reviewed | No packaging, Tauri permission, env, or release config changes were needed. |

## Changed Files

- `src-tauri/src/companion.rs`
- `README.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/reports/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/roadmap/0000-roadmap.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Official docs review | Passed | Checked the official v2 Companion Server API v1 wiki. |
| Code audit | Passed | Reviewed the native bridge, Tauri bridge, command types, state mapping, README, architecture notes, and decision notes. |
| Lint/static checks | Not run | The sandbox could not clone/install/run the project; GitHub terminal access was blocked and work was performed through GitHub App contents API. |
| Tests | Not run | Rust unit tests were added but not executed in this environment. |
| Build | Not run | Desktop build requires a local checkout/toolchain run that was unavailable here. |
| Manual QA | Not run | A live YTMDesktop Companion Server instance was not available in this environment. |
| Docs review | Passed | README and internal docs no longer point to the broken/old Companion wiki page. |
| Release/config review | Passed | No release, installer, env, Docker, Coolify, or Tauri permission changes were introduced. |

## Not Verified

- Full auth approval round-trip in a running YTMDesktop v2 instance.
- Realtime `state-update` payload shape from a live socket.
- Playback command behavior against an actual player.
- Live `seekTo` success/failure behavior.
- Edge cases for ads, livestreams, transient restarts, and expired/stale tokens.
- Local `cargo test`, `cargo check`, `npm run verify`, or `npm run build:desktop` execution.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Which Companion docs should README link to? | The current official page is `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`. |
| Is `/api/v1/metadata` valid for v2 discovery? | No. The metadata endpoint is public `GET /metadata` and must not be prefixed with `/api/v1`. |
| Are commands separate endpoints? | No. v2 uses `POST /api/v1/command` with command payloads such as `playPause`, `next`, and `seekTo`. |
| Is the old `appId` valid? | No. v2 docs require lowercase alphanumeric, 2-32 characters. The app now uses `ytmdesktopwidget`. |
| Should REST auth use Bearer auth? | The v2 docs say the token is passed as the `Authorization` header value, so the bridge now sends the raw token value. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does a live YTMDesktop v2 instance accept the updated auth and command requests exactly as documented? | Project owner / tester | Run the portable app against local YTMDesktop with Companion Server enabled. |
| Does `rust_socketio` expose the `state-update` payload in the exact structure currently expected by `payload_to_json`? | Developer during live QA | Inspect live realtime events and adjust only the isolated payload mapping if needed. |
| Do existing users need to clear auth after the `appId` correction? | Tester | If connection fails with a stored token, use the clear-auth flow and approve the app again. |

## Residual Risks

- The code now follows the official docs, but Companion behavior still needs a real local YTMDesktop verification pass.
- The `appId` correction can require re-auth for any stored token created under the previous invalid assumption.
- Realtime payload shape is isolated but still unverified against a live socket in this session.

## Next Steps

- Run `cargo test` and `cargo check -j1` locally or in CI.
- Run `npm run verify`.
- Run `npm run build:desktop` for the Windows portable build.
- Test auth, realtime, play/pause, next/previous, and seek against a live YTMDesktop v2 Companion Server.
