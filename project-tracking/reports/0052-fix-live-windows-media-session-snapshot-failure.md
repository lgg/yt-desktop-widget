# 0052 - Fix live Windows Media Session snapshot failure report

## Summary

The WMS attach path no longer depends on completing a full Apple Music snapshot. The prior implementation performed manager access, current-session lookup, metadata, timeline, playback controls, and artwork work inside the frontend-facing `connect` request; one transient failure or slow call could reject the whole connection and leave the UI in `Waiting`. The corrected worker commits after manager access, polls the current session after `socket_open`, retains the previous snapshot on failure, drops a stale manager, and reacquires it on the next 750 ms cycle.

Live poll diagnostics now survive the complete Rust event -> Tauri bridge -> WMS gateway -> controller -> Settings path. The previous user run did not create the expected JSONL file, so no exact historical HRESULT is claimed. Focused RED tests reproduced the structured-diagnostic loss before the fix.

## Done

- Confirmed `npm run build:portable` produced the fresh default release EXE that the user tested; the issue was not an old artifact.
- Ran a metadata-free same-machine probe in the normal interactive session: manager, two sessions, current session, source access, metadata, artwork, timeline, playback, and controls all succeeded when sampled later, proving the failure was transient rather than a permanent Apple Music incompatibility.
- Compared Microsoft GSMTC contracts and working Current Song 2 / `win-gsmtc` / `tauri-plugin-media` sources. These implementations separate manager/session lifecycle from individual metadata/timeline/image reads and handle transient getter errors independently.
- Added RED/GREEN native and frontend regressions for structured live diagnostics.
- Made session count/current-session detail best-effort during discovery; manager access defines availability.
- Made connection preparation manager-only; it no longer blocks on an initial media snapshot.
- Moved first state acquisition to the already-connected worker poll.
- Made poll failure retain the previous snapshot, clear the stale manager, log/emit the safe diagnostic once, and reacquire automatically on the next cycle.
- Avoided cloning the previous JSON/base64 artwork on every 750 ms poll by temporarily taking and restoring the prior state.
- Routed `stage`, `HRESULT`, and `category` through the Tauri event and controller, with localized `socketError` public copy kept separate.
- Reconciled README, architecture, decision `0007`, roadmap, task/report, and time tracking.
- Built and normal-session launched a fresh WMS-selected portable `3.1.0`; it remained responsive and produced no connect/poll failure diagnostic.

## Research Evidence

| Source | Finding |
| --- | --- |
| Microsoft GSMTC session contract | Manager, current-session, metadata, playback, and timeline are separate operations/events; a metadata read is not the definition of manager availability. |
| Current Song 2 / bundled `win-gsmtc` | Manager and session workers are event-driven; media-properties/image errors are warned and isolated rather than turning every session update into manager failure. |
| `tauri-plugin-media` Windows source | Current session, metadata, playback, and timeline reads are independently best-effort and fall back when unavailable. |
| Local normal-session probe | With Apple Music active, all production-equivalent stages passed and no package identity was required. |
| User's prior run | Fresh EXE showed `Waiting`/interrupted updates but produced no JSONL diagnostic; therefore an exact historical HRESULT is unavailable and is not fabricated. |

References:

- <https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession>
- <https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager>
- <https://github.com/Nerixyz/current-song2/tree/master/lib/win-gsmtc>
- <https://github.com/Taiizor/tauri-plugin-media/blob/main/src/platform/windows.rs>

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0052-a` |
| Started at | `2026-07-14T10:37:32.0158580+03:00` |
| Finished at | `2026-07-14T11:18:21.6044902+03:00` |
| Time spent minutes | `41` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0052-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Manager-only attach, best-effort discovery detail, poll manager reacquisition, and structured status diagnostics. |
| Frontend | Changed | Runtime diagnostic propagation and source-aware localized socket-error state. |
| Domain/API contracts | Changed | Optional diagnostic added to native status event and gateway `onError`. |
| Tests | Changed | RED/GREEN gateway, controller, native serialization, and manager-only connection response regressions. |
| Documentation | Changed | README, architecture, and durable WMS worker decision. |
| Build/release/config | Verified | Portable-only `3.1.0`; no installer, capability bypass, or package-identity change. |
| Bootstrap sync | Not applicable | No shared process rule changed. |
| Time tracking | Completed | Task, report, and time log use the same timestamps and 41 minutes. |
| Project tracking | Changed | Task/report `0052` and roadmap reconciled. |

## Changed Files

- `src-tauri/src/models.rs`
- `src-tauri/src/companion.rs`
- `src-tauri/src/windows_media.rs`
- `src/domain/playback/types.ts`
- `src/domain/playback/controller.ts`
- `src/domain/playback/controller.test.ts`
- `src/integration/companion/tauriBridge.ts`
- `src/integration/windowsMedia/windowsMediaGateway.ts`
- `src/integration/windowsMedia/windowsMediaGateway.test.ts`
- `README.md`
- `ARCHITECTURE.md`
- `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0052-fix-live-windows-media-session-snapshot-failure.md`
- `project-tracking/reports/0052-fix-live-windows-media-session-snapshot-failure.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Focused frontend RED | Expected failures observed | Gateway dropped event diagnostic; controller state stored `undefined`. |
| Focused Rust RED | Expected compile failure observed | `CompanionEvent::Status` had no diagnostic field. |
| Focused GREEN | Passed | 39 relevant frontend tests plus native diagnostic and manager-only response tests. |
| `npm run verify` | Passed | Version sync, ESLint, 125 Vitest tests, TypeScript, and Vite production build. |
| Rust tests | Passed | 41 passed, 0 failed. |
| Rust Clippy | Passed | `--all-targets --all-features -- -D warnings`. |
| `npm run test:e2e` | Passed | 16 Playwright tests, 0 failed. |
| `npm audit --omit=dev` | Passed | 0 vulnerabilities. |
| `git diff --check` | Passed | No whitespace errors. |
| Changed-file Prettier / Rust format probes | Existing baseline mismatch | The repository's established formatting and line-ending baseline is not clean under blanket Prettier/rustfmt checks. No unrelated mass-format rewrite was applied; ESLint, TypeScript, Clippy, tests, builds, and `git diff --check` are clean. |
| `npm run build:portable` | Passed | Built `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Artifact metadata | Passed | 16,086,016 bytes; FileVersion/ProductVersion `3.1.0`; SHA-256 `414CD60461B9D285F6C1BB040A09EA7F12EF3536F25F409F7AC907FCA6403374`. |
| Normal-session WMS smoke | Passed for native attach/liveness | Persisted source is `windowsMediaSession`; fresh process responsive; no discovery/connect/poll diagnostic after repeated cycles. |
| Privacy/security review | Passed | No media metadata, credentials, tokens, bypass, elevation, installer, or new network surface. |

## Not Verified

- The transparent Tauri window cannot be read reliably by the automated capture path, so final visual confirmation of current title/artwork/progress and transport buttons remains a short user smoke in the already launched fresh build.
- Spotify and Yandex Music were not live-tested in this pass.
- The previous failed run wrote no diagnostic file; its exact stage/HRESULT cannot be recovered retroactively.
- Blanket Prettier/rustfmt conformance remains a repository-wide baseline cleanup rather than part of this scoped runtime fix.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Was the user running an old EXE? | No. The default release EXE was freshly built immediately before the screenshot. |
| Is Apple Music permanently inaccessible to unpackaged GSMTC? | No. The normal interactive stage probe passed all accessed fields and the new WMS-selected portable process remains healthy. |
| Why could the old UI stay in `Waiting`? | Connect synchronously required the full session snapshot. A transient/slow snapshot operation rejected manager-level attach. |
| Should transient poll errors erase the manager and playback state permanently? | No. Retain the last state, reacquire manager/current session, and clear the error on the next successful poll. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the visible fresh widget show Apple Music title/artwork/progress and execute transport commands? | User | Inspect the currently launched build; report only if a specific visible/control mismatch remains. |

## Residual Risks

- A WinRT call that never returns still occupies the dedicated WMS worker; it cannot block Tokio/UI, but later worker work waits until Windows returns.
- Player-published capabilities and metadata completeness vary; unsupported controls remain disabled/no-op.
- A restricted service/SYSTEM/sandbox launch can still be denied by Windows; direct normal interactive launch remains the supported portable context.

## Next Steps

1. Visually smoke the already launched fresh portable build with Apple Music.
2. If a failure appears, Settings now preserves the exact safe stage/HRESULT/category; the JSONL path remains documented in README.
