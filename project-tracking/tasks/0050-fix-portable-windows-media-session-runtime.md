# 0050 - Fix portable Windows Media Session runtime

## Status

Completed

## Context

The portable `3.1.0` build failed to attach to an active Apple Music Windows media session. Task `0048` reproduced `E_ACCESSDENIED` in a short-lived diagnostic process both before and after `RoInitialize(RO_INIT_MULTITHREADED)`, which led task `0049` to defer WMS behind packaged delivery.

A follow-up external audit identified additional confirmed defects in the production implementation: blocking WinRT `.get()` calls run on arbitrary Tokio worker threads without an explicitly initialized WinRT apartment, the same async mutex covers calls that can block, Windows error details are discarded, several command failure paths silently return success, and a persisted developer simulator override can supersede the selected WMS source in a release build. The earlier probe was not the real interactive portable process, so its access-denied result is useful evidence but not sufficient to rule out a runtime/apartment defect in the shipped executable.

Official GSMTC metadata marks the manager and session objects as Agile and both-threaded, so strict object thread affinity is not assumed. This pass uses a conservative actor design: one long-lived MTA-initialized worker owns all blocking WinRT work and exposes asynchronous request/response messages to Tauri.

## Goal

Make the portable Windows Media Session adapter structurally correct and diagnosable, then produce a verified portable build for an interactive Apple Music smoke test without weakening Windows capability checks or exposing media metadata in diagnostics.

## Scope

Included:

- Move manager discovery, polling, session reads, and playback commands onto one long-lived `RoInitialize(RO_INIT_MULTITHREADED)` worker thread.
- Keep blocking WinRT futures out of the Tokio runtime and make connect/disconnect lifecycle deterministic.
- Preserve safe public error copy while attaching stage, HRESULT, and category diagnostics without track, artist, artwork, or source-app metadata.
- Stop returning silent success when the WMS backend or current session is absent; keep intentionally unsupported Like, Dislike, and Mute actions as documented no-ops.
- Prevent release/native builds from being silently forced to the simulator by a persisted developer setting and hide the debug simulator control outside development builds.
- Add regression tests for worker-thread serialization, error classification, lifecycle behavior, and production source selection.
- Reconcile README, WMS architecture/release notes, task `0049`, roadmap, report, and time tracking with the verified outcome.

Out of scope:

- Undocumented Windows capability bypasses.
- Installer, MSIX, sparse-package, signing, or update delivery changes from deferred task `0049`.
- Local WMS history/favorites/export from deferred task `0046`.
- Service-specific Like/Dislike or numeric volume control.
- Selection of an arbitrary non-current media session when Windows reports no current session.

## Affected Areas

- Backend/native: WMS thread/apartment ownership, lifecycle, polling, command semantics, and safe diagnostics.
- Frontend: release-safe gateway selection and development-only simulator UI.
- Domain/API contracts: optional non-sensitive backend diagnostic fields and WMS failure semantics.
- Tests: Rust worker/error regressions, provider/settings regressions, existing integration and E2E coverage.
- Documentation: portable WMS status, troubleshooting, and packaging follow-up.
- Build/release/config: Windows crate WinRT initialization feature and portable build validation; no packaging policy change.
- Project tracking: task/report `0050`, roadmap, task `0049`, and time log.
- Security/privacy: external Windows integration; diagnostics must not contain media or credential data.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0050-a` |
| Started at | `2026-07-14T07:55:49.7373378+03:00` |
| Finished at | `2026-07-14T08:35:45.3962919+03:00` |
| Time spent minutes | `40` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0050-a` |

## Acceptance Criteria

- [x] Every production GSMTC call runs on the dedicated worker after successful MTA initialization; Tokio tasks do not block on WinRT `.get()`.
- [x] Discovery, connect, disconnect, polling, and supported commands have deterministic request/response behavior and do not silently succeed when their backend/session prerequisite is absent.
- [x] WMS errors retain safe stage/HRESULT/category diagnostics without media metadata, credentials, raw tokens, or private user data.
- [x] A release/native build honors `playbackSource` even if legacy persisted settings contain `sourceMode: simulator`; simulator controls remain development-only.
- [x] Unit, frontend, Rust, E2E, desktop-build, dependency, and portable-build checks pass or any platform-only limitation is recorded precisely.
- [x] The resulting portable build is handed off for an interactive Apple Music smoke test; no unsupported claim of live success is made before that test.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, baseline-aware `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`.
- [x] Tests: focused Vitest/Rust RED-GREEN tests, full Vitest, full Rust tests, Playwright E2E.
- [x] Build: `cargo check -j1`, `npm run build:desktop`, `npm run build:portable`.
- [x] Manual/API QA: task `0051` ran the same unpackaged WMS access path against active Apple Music in a normal interactive user session, enumerated three sessions with a current session, and direct-launched the rebuilt widget without a native WMS failure.
- [x] Documentation review: reconcile README, roadmap, task `0049`, task/report `0050`, and architecture wording.
- [x] Release/config review: confirm version remains centralized at `3.1.0`, no installer/package files are introduced, and portable-only policy remains intact.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does official API metadata require all GSMTC objects to remain on their creation thread? | Resolved | No. The generated classes are `Send + Sync`, and Microsoft documents Agile marshaling with `ThreadingModel.Both`. A single worker is still used to guarantee apartment initialization and isolate blocking calls. |
| Does the earlier `E_ACCESSDENIED` probe prove portable WMS is impossible? | Resolved | No. It is strong evidence of a capability/access problem in that diagnostic context, but it did not exercise the real interactive portable process and cannot exclude the confirmed runtime defects. |
| Should this pass add an undocumented capability bypass? | Resolved | No. Only supported Windows APIs are used. Task `0051` proved normal unpackaged access works, so packaging is no longer an access fallback. |
| Should the worker select a non-current session from `GetSessions()`? | Resolved | No. Session count may inform safe diagnostics, but playback remains tied to the Windows current session to avoid surprising cross-player control. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A restricted launcher still returns `E_ACCESSDENIED` | WMS remains unavailable only in that restricted execution context | Show localized direct-launch guidance and safe persistent diagnostics; do not attempt a sandbox/token escape. |
| A blocking WinRT call stalls the worker | WMS requests may be delayed | Isolate the stall from Tokio/UI, serialize lifecycle, preserve reconnect recovery, and avoid holding unrelated runtime resources. |
| Shutdown races with polling or commands | Stale events or leaked work | Use one actor queue, explicit connected state, deterministic disconnect response, and regression tests. |
| Diagnostics leak listening activity | Privacy regression | Store only stage, HRESULT, category, and session-count/state booleans; never media properties or source identifiers. |
| Legacy simulator setting masks WMS again | False diagnosis and broken release behavior | Ignore developer source overrides in native production and test the exact persisted-setting case. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0006-separate-product-playback-source-from-development-source-mode.md`, `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- Related tasks: `project-tracking/tasks/0045-add-windows-media-session-playback-source.md`, `project-tracking/tasks/0047-deep-audit-windows-media-session-release.md`, `project-tracking/tasks/0049-add-supported-packaged-wms-delivery.md`
- Related reports: `project-tracking/reports/0047-deep-audit-windows-media-session-release.md`, `project-tracking/reports/0048-unify-settings-visibility-controls-and-layout.md`, `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- Completion evidence: `project-tracking/tasks/0051-diagnose-unpackaged-windows-media-access.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0050-portable-wms-worker-diagnostics`; commit/merge pending at task update
