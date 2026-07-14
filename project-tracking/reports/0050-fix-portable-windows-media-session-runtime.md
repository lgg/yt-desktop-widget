# 0050 - Fix portable Windows Media Session runtime report

## Summary

The production WMS adapter was rebuilt around a lazy, dedicated MTA-initialized actor thread. Every blocking GSMTC manager/session/future call now executes on that worker rather than arbitrary Tokio threads. The pass also preserves safe HRESULT diagnostics, bounds caller waits, prevents cancelled connects from committing late, surfaces supported-command prerequisite errors, keeps Like/Dislike/Mute as documented no-ops, and prevents native release builds from being silently overridden by the development simulator.

Automated/frontend/native/release verification is complete and a version `3.1.0` portable executable was produced. Follow-up task `0051` then proved the same unpackaged WMS access path succeeds against active Apple Music in a normal interactive Windows user session and that the rebuilt widget direct-launches without a native WMS failure. Task `0050` is complete; packaged delivery task `0049` remains only a future installer/product-delivery option.

## Done

- Replaced the Tauri async polling task with a typed actor queue and one long-lived `RoInitialize(RO_INIT_MULTITHREADED)` worker.
- Made worker creation lazy so Companion-only use does not create a WMS thread.
- Kept manager ownership, discovery, snapshots, artwork reads, polling, commands, and lifecycle state on the worker.
- Added 15-second caller bounds, cancelled-request checks, late-connect protection, and native cleanup after failed frontend connects.
- Distinguished no current session from other `GetCurrentSession` errors and stopped swallowing backend/session prerequisites for supported transport commands.
- Added structured `stage` / `HRESULT` / `category` diagnostics while keeping public copy static and excluding media metadata, artwork, credentials, and tokens.
- Propagated safe diagnostics through the TypeScript bridge and `GatewayError` without logging them or mixing them into localized user copy.
- Ignored persisted/query/env simulator overrides in native production while preserving simulator behavior for development and browser/E2E workflows; hid the About mock shortcut in release UI.
- Added RED/GREEN regressions for production source resolution, diagnostic propagation/serialization, HRESULT classification, initialized worker-thread execution, unsupported actions, and disconnected transport behavior.
- Updated README, architecture, source-mode decision, new MTA-worker decision, roadmap, and conditional packaging fallback.
- Produced `src-tauri/target/release/ytm-desktop-widget.exe` (16,072,704 bytes; FileVersion/ProductVersion `3.1.0`).

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0050-a` |
| Started at | `2026-07-14T07:55:49.7373378+03:00` |
| Finished at | `2026-07-14T08:35:45.3962919+03:00` |
| Time spent minutes | `40` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0050-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Dedicated MTA actor, lazy lifecycle, bounded responses, safe HRESULT diagnostics, explicit command prerequisites. |
| Frontend | Changed | Native release simulator overrides disabled; debug shortcut dev-only; diagnostics retained on `GatewayError`. |
| Domain/API contracts | Changed | `CommandError` and `GatewayError` carry optional non-sensitive diagnostics. |
| Tests | Changed | Added source-selection, diagnostic, worker/apartment, HRESULT, and command-semantics regressions. |
| Documentation | Changed | Portable candidate status and MTA architecture documented without claiming live success. |
| Build/release/config | Changed | Enabled only the `windows-rs` Win32 WinRT initialization feature; packaging policy and version stay unchanged. |
| Bootstrap sync | Not applicable | No shared bootstrap rule changed. |
| Time tracking | Completed | Task, report, and time-log use the same tracked 40-minute iteration. |
| Project tracking | Changed | Task/report `0050`, roadmap, decision `0007`, and conditional task `0049` wording updated. |

## Changed Files

- `src-tauri/Cargo.toml`
- `src-tauri/src/models.rs`
- `src-tauri/src/windows_media.rs`
- `src/app/AppProvider.tsx`
- `src/app/SettingsWindow.tsx`
- `src/domain/playback/types.ts`
- `src/integration/companion/realGateway.ts`
- `src/integration/companion/tauriBridge.ts`
- `src/integration/windowsMedia/windowsMediaGateway.ts`
- `src/integration/windowsMedia/windowsMediaGateway.test.ts`
- `tests/app/AppProvider.test.tsx`
- `README.md`
- `ARCHITECTURE.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0049-add-supported-packaged-wms-delivery.md`
- `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`
- `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- `project-tracking/decisions/0006-separate-product-playback-source-from-development-source-mode.md`
- `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Baseline `npm run verify` | Passed | Before changes: 119 tests, lint, version sync, and production web build passed. |
| RED source-mode test | Expected failure observed | `resolveSourceModeForRuntime is not a function`. |
| RED native tests | Expected compile failures observed | Missing diagnostic model, HRESULT helpers, and initialized worker API. |
| RED diagnostic propagation test | Expected failure observed | `GatewayError` initially dropped the native diagnostic object. |
| Focused frontend GREEN | Passed | 10 tests across AppProvider and WMS gateway. |
| Focused WMS Rust GREEN | Passed | 10 tests, 0 failed. |
| `npm run verify` | Passed | Version `3.1.0` synchronized; ESLint clean; 121 tests; TypeScript/Vite production build passed. |
| `cargo test --manifest-path src-tauri/Cargo.toml -j1` | Passed | 37 tests, 0 failed, 0 ignored. |
| `cargo check --manifest-path src-tauri/Cargo.toml -j1` | Passed | Native graph compiled successfully. |
| `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` | Passed | No warnings. |
| `npm run test:e2e` | Passed | 16 serial Playwright scenarios, 0 failed. |
| `npm audit --audit-level=moderate` | Passed | 0 vulnerabilities. |
| `cargo audit --file src-tauri/Cargo.lock` | Passed with baseline warnings | Exit 0; 22 allowed upstream/transitive maintenance, unsoundness, or yanked warnings and no blocking vulnerability. |
| `npm run build:desktop` | Passed | Release `tauri build --no-bundle` completed. |
| `npm run build:portable` | Passed | Portable alias completed and produced the same release executable. |
| EXE metadata | Passed | 16,072,704 bytes; FileVersion/ProductVersion `3.1.0`; ProductName `YTM Desktop Widget`. |
| `cargo fmt --check` | Baseline mismatch | Standard rustfmt would reformat nearly the entire existing two-space native codebase. No unrelated mass-format diff was applied; Clippy/check/tests are clean. |
| Live unpackaged WMS access | Passed in task `0051` | Same compiled probe enumerated three sessions and returned a current Apple Music session in the normal interactive context; direct-launched widget stayed responsive with no discovery/connect/poll failure log. |
| Docs/release review | Passed | Version and portable-only packaging unchanged; no installer, capability bypass, telemetry, network exposure, or secret storage added. |
| Time tracking review | Passed | Task, report, and time-log all use iteration `2026-07-14-0050-a`, the same timestamps, and 40 minutes. |

## Not Verified

- Apple Music, Spotify, and Yandex Music application-specific metadata/control completeness.
- A signed MSIX/sparse-package path; it remains deferred as an independent installer/product-delivery choice in task `0049`.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Must GSMTC objects remain on their creation thread? | Official metadata says Agile and both-threaded; the worker is used for apartment correctness, serialization, and blocking isolation rather than an unsupported strict-affinity claim. |
| Should a persisted simulator mode override WMS in release? | No. Native release always honors the selected production bridge; simulator overrides are development/browser-only. |
| Should supported transport commands silently succeed without a backend/session? | No. They return safe typed errors; only the explicitly unsupported Like/Dislike/Mute actions remain no-ops. |
| Should the actor choose another session when Windows has no current session? | No. It enumerates only safe discovery counts and continues following the Windows-selected current session. |
| Does the earlier access-denied probe prove packaging is mandatory? | No. Task `0051` proved that result came from the restricted Codex sandbox context; the same unpackaged access path succeeds in the normal interactive user session. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Do Apple Music, Spotify, and Yandex Music all expose identical metadata/control capabilities? | User/live matrix | Validate player-specific behavior as release QA; GSMTC manager access itself is resolved. |

## Residual Risks

- Restricted launchers can still deny GSMTC; the app now surfaces direct-launch guidance and safe logs instead of hiding that context error.
- A WinRT call that stalls inside Windows cannot be forcibly stopped. The caller times out without blocking Tokio, but the single actor can remain unavailable until the OS call returns or the process restarts.
- Polling remains a 750 ms compatibility watchdog rather than event-driven GSMTC subscriptions; this is deterministic but not the lowest possible idle work.
- RustSec's 22 allowed transitive warnings remain the documented dependency baseline and require upstream/dependency-modernization work rather than a scoped WMS patch.

## Next Steps

1. Close any older widget instance and run the newly built portable `ytm-desktop-widget.exe`.
2. Start a track in current Apple Music, select `Windows Media Session`, and press `Reconnect`.
3. Confirm artwork/title/artist, real-time progress, pause/play, previous/next, seek, track change, and reconnect after an app restart.
4. If it fails, capture the exact safe diagnostic (`stage`, `HRESULT`, `category`) and confirm the EXE was launched directly from File Explorer. `access_denied` indicates the launch/security context; apartment/wrong-thread categories remain runtime defects.
