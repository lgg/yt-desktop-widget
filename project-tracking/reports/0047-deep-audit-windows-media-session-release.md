# 0047 - Deep audit Windows Media Session release report

## Summary

Completed a second source-to-release audit of version `3.1.0` and fixed every confirmed defect found in the WMS delivery path. The audit corrected controller lifecycle and capability propagation, cross-track metadata isolation, Windows timeline/seek math, artwork bounds and IPC churn, shared poll ownership, untrusted media input handling, source-specific localization, the native event nullability contract, and the previously hanging/flaky Windows Playwright harness.

All automated frontend, native, dependency, E2E, version, and portable build gates pass. A new portable executable reports file/product version `3.1.0`. The only unavailable check is a live player/broker probe from the sandboxed Codex process; it fails safely with a generic error and still requires an ordinary interactive Windows session for player-specific compatibility claims.

## Done

- Added RED then GREEN regressions for dropped WMS capabilities, late post-dispose connections, stale cross-track metadata/artwork, non-zero-origin timelines, seek ranges, artwork size/resolution policy, metadata/MIME bounds, source-specific UI copy, bridge lifecycle, and status nullability.
- Made active native WMS polling reusable across main/settings consumers and kept unsupported Like/Dislike/Mute as capability-disabled no-ops at UI, TypeScript gateway, and Rust command boundaries.
- Replaced absolute timeline math with start-relative duration/elapsed values and clamped seek targets to the published range.
- Removed repeated base64 artwork payloads from 750 ms updates, rejected incomplete/oversized artwork, and stopped a second metadata fetch from racing the first.
- Bounded WMS text, allowlisted raster data-URL MIME types, skipped timer catch-up bursts, and removed raw WinRT details from user-facing errors.
- Added WMS-specific English/Russian empty, discovery, reconnect, disconnected, and error copy; locale parity remains enforced automatically.
- Repaired the Windows E2E runner so `npm run test:e2e` owns and stops its exact preview PID and returns normally after 15 deterministic serial scenarios.
- Updated README, architecture, roadmap/task/report, and time tracking without changing packaging policy or adding permissions, telemetry, persistence, or network exposure.
- Committed the verified audit as `62dd9be`, published `codex/0045-windows-media-session-source`, and merged it into `master` as `76d0603`.

## Time Tracking

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Iteration ID       | `2026-07-14-0047-a`                                  |
| Started at         | `2026-07-14T05:39:09.4639218+03:00`                  |
| Finished at        | `2026-07-14T06:22:39.3842405+03:00`                  |
| Time spent minutes | `44`                                                 |
| Tracking status    | `tracked`                                            |
| Time log row       | `project-tracking/time-log.md` (`2026-07-14-0047-a`) |

## Changed Areas

| Area                 | Status         | Notes                                                                                                                  |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Changed        | Corrected WMS timeline/seek, poll ownership, artwork loading, bounds, MIME policy, generic errors, and timer behavior. |
| Frontend             | Changed        | Added source-specific WMS states and safe bridge null normalization.                                                   |
| Domain/API contracts | Changed        | Capability changes now publish; transitional metadata reuse is track-safe; late connections respect disposal.          |
| Tests                | Changed        | Added controller, mapping, gateway, UI, i18n, and Rust regressions; stabilized the Playwright runner.                  |
| Documentation        | Changed        | Updated README and architecture with the verified behavior and limits.                                                 |
| Build/release/config | Changed        | E2E process wrapper/config only; portable-only Tauri policy, permissions, and version source remain unchanged.         |
| Bootstrap sync       | Not applicable | No bootstrap rule change occurred.                                                                                     |
| Time tracking        | Changed        | Task/report/time-log use iteration `2026-07-14-0047-a`.                                                                |
| Project tracking     | Changed        | Added task/report `0047` and reconciled the roadmap.                                                                   |

## Changed Files

- Native: `src-tauri/src/windows_media.rs`
- Controller/mapping: `src/domain/playback/controller.ts`, `src/domain/playback/mapping.ts`
- UI/localization: `src/app/WidgetWindow.tsx`, `src/app/SettingsWindow.tsx`, `src/app/connectionMessage.ts`, `src/locales/en.json`, `src/locales/ru.json`
- Gateways/contracts: `src/integration/companion/tauriBridge.ts`, `src/integration/companion/realGateway.ts`, `src/integration/windowsMedia/windowsMediaGateway.ts`
- Tests: matching `*.test.ts(x)` files plus `src/app/connectionMessage.test.ts`
- E2E/build: `package.json`, `playwright.config.ts`, `scripts/run-e2e.ps1`
- Docs/tracking: `README.md`, `ARCHITECTURE.md`, roadmap/task/report/time-log `0047`

## Verification

| Check                                           | Result               | Notes                                                                                                                                                                                                                                          |
| ----------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused RED/GREEN                               | Passed               | Initial frontend: 3 expected failures; initial Rust: unresolved new helpers; source-copy and stale metadata regressions also failed before their fixes. Final focused frontend: 57/57; final focused Rust: 7 passed plus 1 ignored live smoke. |
| `npm run verify`                                | Passed               | Version sync, ESLint, 19 Vitest files / 117 tests, TypeScript, and production Vite build.                                                                                                                                                      |
| `cargo test -j1`                                | Passed               | 33 passed, 1 ignored manual broker smoke, 0 failed.                                                                                                                                                                                            |
| `cargo check -j1`                               | Passed               | Clean isolated-target check.                                                                                                                                                                                                                   |
| `cargo clippy -j1 --all-targets -- -D warnings` | Passed               | No warnings.                                                                                                                                                                                                                                   |
| `npm run test:e2e`                              | Passed               | 15/15 serial Playwright scenarios; process exits normally in 22.3 seconds including build.                                                                                                                                                     |
| `npm audit --omit=dev`                          | Passed               | 0 vulnerabilities.                                                                                                                                                                                                                             |
| `cargo audit`                                   | Passed with warnings | 0 vulnerabilities; 22 allowed transitive warnings. GTK3 warnings are non-Windows; `rand 0.7.3` is build-only through Tauri/phf; `backoff` is transitive through `rust_socketio`. No direct safe patch was available in this scoped pass.       |
| Static privacy/security scan                    | Passed               | No WMS logging/persistence/network/token path; no permission, capability, lockfile, or Tauri config changes; metadata/artwork bounded.                                                                                                         |
| `npm run build:desktop`                         | Passed               | `--no-bundle` portable release at `src-tauri/target-codex/release/ytm-desktop-widget.exe`.                                                                                                                                                     |
| EXE metadata/hash                               | Passed               | FileVersion/ProductVersion `3.1.0`; size 15,945,216 bytes; SHA-256 `D028B9DF270042C2ADEC9B28A1FA77F448C6EB667A53D976299E0187DEB026CF`.                                                                                                         |
| Version/diff/docs review                        | Passed               | Root `3.1.0` remains synchronized; `git diff --check` clean; README/architecture/tracking agree.                                                                                                                                               |
| Live WMS broker probe                           | Environment-blocked  | Ignored test was run manually and the sandbox could not initialize the interactive Windows Media Session broker. The generic failure contained no raw HRESULT/system/media data.                                                               |
| Git delivery                                    | Passed               | Audit commit `62dd9be` by `lgg <lgg@users.noreply.github.com>` was pushed on the pass branch and merged into `master` as `76d0603`.                                                                                                            |

## Not Verified

- Live playback/control compatibility against signed-in Apple Music, Spotify, and Yandex Music sessions cannot be automated from the sandbox. Windows and each player choose which metadata/capabilities to publish.
- The newly built executable was inspected and compiled but was not launched as a second GUI instance during this pass, to avoid interfering with the user's already tested/running desktop state.

## Questions Resolved

| Question                                                     | Resolution                                                                                                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should incomplete WMS features be source-name special cases? | No. Runtime controls remain capability-driven; source identity is used only for accurate user-facing connection copy.                                                   |
| Should missing artwork be retried every poll?                | No. Artwork is resolved once per stable track identity to avoid repeated WinRT stream work/base64 IPC; a changed identity triggers a new resolution.                    |
| Should oversized artwork be truncated?                       | No. A truncated file is invalid and potentially ambiguous; reject it safely.                                                                                            |
| Should the audit add local WMS history/favorites?            | No. Personal-data persistence remains separate default-off task `0046`.                                                                                                 |
| Should RustSec warnings force a broad dependency migration?  | No. No vulnerability was reported, affected paths are platform/build/transitive, and replacing the Companion/Tauri stack requires a separate scoped compatibility task. |

## Open Questions

| Question                                                                                               | Owner              | Next Step                                                                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| Which exact controls/metadata do Apple Music, Spotify, and Yandex Music publish on the user's machine? | User/release smoke | Run the portable build in a normal interactive session and record player-specific differences if any. |

## Residual Risks

- GSMTC current-session selection and capabilities are owned by Windows/source applications, not the widget.
- A transient artwork failure is not retried until the stable track identity changes; this is the bounded-work tradeoff chosen over polling a potentially large stream every 750 ms.
- RustSec reports maintenance/unsoundness warnings only in transitive platform/build dependencies; there are no reported vulnerabilities, but the dependency tree should continue to be audited on future Tauri/Companion upgrades.
- CSP remains the repository's pre-existing `null` setting. Changing it could affect remote Companion artwork and is a separate product/security decision under `AGENTS.md`, not an implicit WMS audit change.

## Next Steps

- Perform the normal interactive multi-player WMS smoke when convenient.
- Keep local history/favorites/export under deferred task `0046` with explicit consent, retention, and deletion design.
