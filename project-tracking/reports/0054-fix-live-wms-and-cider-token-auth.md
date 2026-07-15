# 0054 - Fix live WMS and Cider token authentication report

## Summary

The two live failures had one shared cause: Tauri's active custom-command permission manifest had not been updated when WMS and Cider were added. Every `windows_media_*` and `cider_*` invoke was rejected before Rust ran, so WMS could not write a diagnostic and Settings misreported the denied Cider save as a rejected token. The ACL now contains every registered native command, an automatic parity regression prevents recurrence, and the freshly built portable release passed live WMS and Cider metadata/artwork plus play/pause/restore checks. The Cider token area was also rebuilt as a cohesive credential card with an accessible label/group, styled controls, explicit Windows Credential Manager state, compact clear action, and responsive layout.

## Done

- Confirmed the absence of WMS diagnostics and compared the active `generate_handler!` list with `permissions/default.toml`.
- Probed the installed Cider 4 service without exposing response values: both protected REST endpoints returned `403` without auth and `200` with the supplied disposable token in `apptoken`; Socket.IO handshake was reachable.
- Added a RED regression that failed on missing `windows_media_discover`, restored all WMS/Cider ACL entries, and refactored the test to derive its expected commands directly from `generate_handler!`.
- Built the release, saved the token through the real Settings control into Windows Credential Manager, and verified a stable Cider WebSocket owned by the portable process.
- Switched the same release between Cider and WMS with normal UI controls. Both showed `Live`, loaded metadata/artwork, toggled play/pause, and returned to the starting playback state.
- Added a RED/GREEN Settings regression for a single accessible Cider credential form, then replaced the unstyled native input/button row with a localized glass card, lock/success iconography, empty-submit guard, safe error semantics, secure-storage status, and compact clear action.
- Measured the rebuilt card in the real 720 px Settings WebView: input/save were aligned at 46 px, all children remained inside the card, and the page had no horizontal overflow while Cider remained `Live`.
- During the final handoff check, Cider's external local server temporarily stopped listening; the widget correctly showed `Attention`, and after restarting Cider and waiting for its API startup, the normal Reconnect action returned the release to `Live`.
- Restored the user's original Cider source selection and left one fresh portable process open for inspection.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0054-a` |
| Started at | `2026-07-15T06:34:52+03:00` |
| Finished at | `2026-07-15T07:19:55+03:00` |
| Time spent minutes | `46` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0054-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Fixed | All registered WMS/Cider Tauri commands are now allowed by the active application ACL. |
| Frontend | Improved | The existing source/token flow now uses an accessible responsive credential card with deliberate saved/error/empty states. |
| Domain/API contracts | Live-confirmed | Installed Cider 4 accepts `apptoken`; WMS works unpackaged through the existing GSMTC worker. |
| Tests | Added | Handler/permission parity prevents native command drift; Settings coverage protects the Cider credential form semantics and states. |
| Documentation | Updated | README and Cider decision now record the live contract and ACL boundary. |
| Build/release/config | Fixed | Portable-only policy is unchanged; the release embeds the corrected Tauri manifest. |
| Bootstrap sync | Not applicable | No shared bootstrap rule changed. |
| Time tracking | Updated | Task/report/time-log use iteration `2026-07-15-0054-a`. |
| Project tracking | Updated | Task `0054`, report `0054`, and roadmap counts/status were reconciled. |

## Changed Files

- `src-tauri/permissions/default.toml`
- `src-tauri/src/lib.rs`
- `src/app/SettingsWindow.tsx`
- `src/app/SettingsWindow.test.tsx`
- `src/components/icons.tsx`
- `src/styles/global.css`
- `src/locales/en.json`
- `src/locales/ru.json`
- `README.md`
- `project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0054-fix-live-wms-and-cider-token-auth.md`
- `project-tracking/reports/0054-fix-live-wms-and-cider-token-auth.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| ACL RED/GREEN | Passed | Failed first on missing `windows_media_discover`; passed after the manifest fix and again after automatic handler parsing. |
| Cider credential RED/GREEN | Passed | Failed first because no accessible named credential group existed; passed after the card implementation. |
| `npm run verify` | Passed | Version sync, ESLint, 126 Vitest tests, TypeScript, and Vite production build passed. |
| `cargo test` | Passed | 46 Rust tests passed. |
| `cargo clippy --all-targets -- -D warnings` | Passed | No warnings. |
| `cargo check -j1` | Passed | Native crate checked successfully. |
| `npm run test:e2e` | Passed | 16 Playwright simulator tests passed. |
| `npm audit --omit=dev` | Passed | 0 vulnerabilities. |
| `npm run build:desktop` | Passed | Portable `3.1.0` release built at `src-tauri/target/release/ytm-desktop-widget.exe`; 16,428,544 bytes; SHA-256 `95AFB20EF74631889F25E5F25E5DBAC2E75128BAF8EC9D443EA64C123D15F77A`. |
| Live Cider REST/auth | Passed | Protected endpoints: `403` without token, `200` with `apptoken`; values were not printed. |
| Live Cider portable flow | Passed | Real Settings save, Credential Manager reload, `Live`, artwork/metadata, established socket, play/pause/restore. |
| Final live handoff | Passed | After Cider's own API restart delay, Settings Reconnect restored `Live`; both Cider and the portable widget were left responsive. |
| Live WMS portable flow | Passed | `available: true`, no diagnostic, `Live`, artwork/metadata, play/pause/restore. |
| Visual QA | Passed | Reviewed both source-selected `Live` states plus the rebuilt credential card in the real WebView. Card: 617×223 px; input/save: 46 px aligned; compact clear: 153×36 px; no clipping or horizontal overflow. |
| Secret scan | Passed | Disposable token absent from repository files; no response values or credentials were added to diagnostics. |

## Not Verified

- Cider commands other than play/pause were not exercised to avoid changing library/rating/queue state.
- WMS was live-tested against Cider's active GSMTC session in this pass; player-specific behavior for Apple Music, Spotify, and Yandex Music still depends on what each player publishes.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Was a Windows package capability or MSIX manifest missing? | No. The missing permission was Tauri's local IPC ACL; the unpackaged release worked after that correction. |
| Was the Cider token/header invalid? | No. The supplied token returned `200` through `apptoken` and worked through the real Settings/keyring flow. |
| Why was there no WMS JSONL diagnostic? | Rust never ran because Tauri denied `windows_media_discover/connect` before the backend boundary. |

## Open Questions

None for the requested WMS/Cider live paths.

## Residual Risks

- Cider and GSMTC remain external player contracts; future upstream changes require another live smoke.
- The disposable Cider token is intentionally stored in Windows Credential Manager for the user's running test build and should be rotated as the user planned.

## Next Steps

- Rotate the disposable Cider token after inspection and save the replacement through Settings.
- Repeat the live WMS source switch after future changes to native commands, permissions, or the GSMTC worker.
