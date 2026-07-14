# 0051 - Diagnose unpackaged Windows Media access report

## Summary

The portable failure was caused by the restricted Codex launch identity/security token, not by the absence of MSIX package identity. A focused MTA-initialized Rust probe failed at `GlobalSystemMediaTransportControlsSessionManager::RequestAsync().get()` inside the Codex sandbox with `request_manager.await`, `0x80070005`, `access_denied`. The exact same compiled probe succeeded outside that sandbox in the normal interactive Windows user session, enumerated three media sessions, and returned a current session while Apple Music was active.

The production WMS API path remains the documented `Windows.Media.Control` contract; no activation-factory bypass, elevation, token escape, or self-relaunch workaround was added. Instead, the app now preserves safe structured discovery diagnostics, shows localized recovery guidance, and writes a bounded whitelist-only JSONL failure log. A fresh `3.1.0` portable EXE was built and direct-launched with WMS selected; the process remained responsive and produced no discovery/connect/poll failure log.

## Done

- Proved the failure at a concrete WinRT stage/HRESULT instead of inferring from generic UI copy.
- Compared the restricted and normal interactive execution contexts with the same compiled probe and active Apple Music session.
- Confirmed from Microsoft material that package capability declarations do not make MSIX mandatory for every normal full-trust desktop caller; Microsoft's own desktop console sample uses `RequestAsync`.
- Reviewed standalone Rust and Tauri implementations using the same API, including `win-gsmtc`, Current Song 2 standalone EXE releases, and `tauri-plugin-media`.
- Rejected low-level activation-factory/bypass examples as inappropriate for production.
- Added `DiscoveryInfo.diagnostic` from Rust through the TypeScript state machine.
- Added English/Russian `access_denied` recovery copy directing users to launch the portable EXE directly from File Explorer.
- Added safe technical stage/HRESULT/category output to Settings and retained source-aware widget messaging.
- Added a 256 KiB rotating native log at `%LOCALAPPDATA%\io.github.lgg.ytm-desktop-widget\logs\windows-media-diagnostics.jsonl` with only timestamp, operation, stage, category, and optional HRESULT.
- Logged discovery, connect, poll, and supported-command failures without making log I/O part of the playback success path.
- Added RED/GREEN frontend and Rust regressions for diagnostic propagation, access-denied copy, Settings presentation, and the exact JSONL whitelist.
- Reconciled README, decision `0007`, tasks `0049`/`0050`/`0051`, roadmap, report, and time tracking.

## Research Evidence

| Source | Finding |
| --- | --- |
| Microsoft `RequestAsync` API | Documents `GlobalSystemMediaTransportControlsSessionManager.RequestAsync` and lists `globalMediaControl` in packaged capability metadata. |
| Microsoft app capability declarations | Explains capability declarations in the packaged/AppContainer model; this does not establish that every full-trust unpackaged Win32 process needs package identity. |
| Microsoft Old New Thing console sample | Uses the normal C++ desktop console model, initializes the apartment, and calls `RequestAsync` without making MSIX the application architecture. |
| `win-gsmtc` Rust crate | Wraps `Windows.Media.Control` manager/session access for Rust desktop applications. |
| Current Song 2 | Rust application using GSMTC and distributing standalone Windows `.exe` release assets. |
| `tauri-plugin-media` | Tauri/Rust Windows backend calls the same manager `RequestAsync` contract without an installer-specific alternate API. |
| Local same-probe experiment | Restricted Codex sandbox: MTA initialization passed, manager await returned `0x80070005`. Normal interactive user: three sessions, current session present. This is the strongest machine-specific evidence. |

References:

- <https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager.requestasync>
- <https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations>
- <https://devblogs.microsoft.com/oldnewthing/20231108-00/?p=108980>
- <https://docs.rs/win-gsmtc/latest/gsmtc/>
- <https://github.com/Nerixyz/current-song2>
- <https://github.com/Nerixyz/current-song2/releases>
- <https://github.com/Taiizor/tauri-plugin-media>

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0051-a` |
| Started at | `2026-07-14T08:49:37.1101482+03:00` |
| Finished at | `2026-07-14T09:49:18.4420307+03:00` |
| Time spent minutes | `60` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0051-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Structured discovery diagnostics and bounded privacy-safe JSONL logging for WMS failures. |
| Frontend | Changed | Localized restricted-launch recovery guidance and safe Settings diagnostic line. |
| Domain/API contracts | Changed | Optional `GatewayDiagnostic` retained in discovery and connection state. |
| Tests | Changed | Focused RED/GREEN component/state/message and Rust whitelist/serialization regressions. |
| Documentation | Changed | Unpackaged support evidence, direct-launch troubleshooting, log path, and packaging status. |
| Build/release/config | Verified | Version stays `3.1.0`; portable-only build preserved; no manifest/capability/installer/bypass change. |
| Bootstrap sync | Not applicable | No shared process rule changed. |
| Time tracking | Completed | Task, report, and time-log use iteration `2026-07-14-0051-a`, the same timestamps, and 60 minutes. |
| Project tracking | Changed | Tasks `0049`/`0050`/`0051`, report `0050`/`0051`, roadmap, and decision `0007` reconciled. |

## Changed Files

- `src-tauri/src/models.rs`
- `src-tauri/src/companion.rs`
- `src-tauri/src/windows_media.rs`
- `src-tauri/src/lib.rs`
- `src/domain/playback/types.ts`
- `src/domain/playback/connectionMachine.ts`
- `src/domain/playback/connectionMachine.test.ts`
- `src/domain/playback/controller.ts`
- `src/app/connectionMessage.ts`
- `src/app/connectionMessage.test.ts`
- `src/app/SettingsWindow.tsx`
- `src/app/SettingsWindow.test.tsx`
- `src/locales/en.json`
- `src/locales/ru.json`
- `README.md`
- `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- `project-tracking/tasks/0049-add-supported-packaged-wms-delivery.md`
- `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`
- `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- `project-tracking/tasks/0051-diagnose-unpackaged-windows-media-access.md`
- `project-tracking/reports/0051-diagnose-unpackaged-windows-media-access.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Restricted probe | Expected failure reproduced | MTA initialized; `request_manager.await`, `0x80070005`, `access_denied`. |
| Normal-user probe | Passed | Same EXE reported `session_count=3`, `current_session=true` with active Apple Music. |
| Focused frontend RED | Expected failures observed | 3 files failed because diagnostic state/copy/UI did not exist. |
| Focused Rust RED | Expected compile failures observed | Missing discovery diagnostic and JSONL whitelist helper. |
| Focused frontend GREEN | Passed | 24 tests across connection copy/state and Settings. |
| Focused Rust GREEN | Passed | Structured diagnostic and exact five-field JSONL regression passed. |
| `npm run verify` | Passed | Version sync, ESLint, 124 Vitest tests, TypeScript, and Vite production build. |
| `cargo check -j1` | Passed | Used a clean temporary target because the legacy repository target lock was inaccessible. |
| `cargo test -j1` | Passed | 39 tests, 0 failed. |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed | No warnings. |
| `npm run test:e2e` | Passed | 16 Playwright tests, 0 failed. |
| `npm run build:desktop` | Passed | Fresh `tauri build --no-bundle` in `src-tauri/target-0051`. |
| `npm run build:portable` | Passed | Official portable alias rebuilt the same release path. |
| EXE metadata | Passed | 16,074,240 bytes; FileVersion/ProductVersion `3.1.0`; SHA-256 `31BE17EDBA955175223DA4BB2AFB24AE229ADA546C5BD06F7C995D11C5ECDB38`. |
| Direct-launch app smoke | Passed for access/liveness | WMS selected, process responsive, no discovery/connect/poll diagnostic log after normal interactive launch. |
| `prettier --check .` | Existing repository baseline mismatch | Reports 181 existing files due global style/line-ending baseline; no mass-format rewrite was made. ESLint, TypeScript, tests, and builds are clean. |
| Security/privacy review | Passed | No secrets, metadata logging, network exposure, capability bypass, elevation, token escape, or installer change. Log fields are unit-tested. |

## Not Verified

- The transparent Tauri/WebView window could not be meaningfully captured by the OS screen-copy helper while automated; the user should visually confirm artwork/title/progress and transport buttons in the already direct-launched window.
- Spotify and Yandex Music player-specific GSMTC metadata/control completeness was not live-tested in this iteration.
- Existing `src-tauri/target/.cargo-build-lock` ACL/lock issue remains a local build-cache condition; clean alternate targets build successfully.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Is installation/MSIX mandatory for WMS? | No. The normal interactive unpackaged process works on the same machine; the denied variable was the restricted launcher context. |
| Should production use a low-level activation workaround? | No. Keep the documented API and Windows security boundary intact. |
| Should the app automatically relaunch through Explorer? | No. That would be a security-context escape pattern; give explicit direct-launch recovery guidance instead. |
| What may be written to disk? | Only timestamp, operation, stage, category, and optional HRESULT in a bounded rotating log. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the full widget render current Apple Music metadata and operate play/pause/previous/next/seek in the direct-launched window? | User | Inspect the already running new artifact; if anything fails, send the visible stage/HRESULT/category or the JSONL tail. |
| Do Spotify and Yandex Music expose the same control matrix? | Release QA | Run the same direct-launch smoke per player; missing player capabilities should disable controls rather than fail WMS. |

## Residual Risks

- A third-party launcher can impose another restricted token or desktop session and produce `access_denied`; diagnostics now identify this without weakening security.
- GSMTC is player-published state, so metadata and enabled controls vary independently of manager access.
- The native WMS worker still cannot forcibly cancel an OS WinRT call that never returns, although caller timeouts isolate the UI/Tokio runtime.

## Next Steps

1. In the already direct-launched `3.1.0` window, confirm Apple Music artwork/title/artist/progress and play/pause/previous/next/seek.
2. If it fails, send `%LOCALAPPDATA%\io.github.lgg.ytm-desktop-widget\logs\windows-media-diagnostics.jsonl` or the safe technical line from Settings.
3. Keep task `0049` deferred for optional installer/signing work only; do not treat it as the WMS access fix.
