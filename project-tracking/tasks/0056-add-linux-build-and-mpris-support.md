# 0056 - Add Linux build and MPRIS support

## Status

Deferred

## Context

Music Desktop Widget is currently Windows-first. The Rust crate depends on WinRT/GSMTC, Windows Registry startup, and the Windows keyring backend, while product documentation and tests assume Windows lifecycle behavior. Linux is the first planned cross-platform target and needs both a buildable native shell and a system playback adapter based on the official MPRIS D-Bus specification.

## Goal

Produce a supported Linux build with platform-appropriate window/tray/startup/keyring behavior and a first-class MPRIS playback source, without regressing Windows or adding unofficial player inspection.

## Scope

Included:

- Gate Windows-only Rust modules/dependencies and introduce explicit platform service boundaries.
- Select and document supported Linux distributions/runtime dependencies.
- Build and run the Tauri application on Linux.
- Add MPRIS discovery, metadata/artwork, timeline, capability, transport, and seek mapping through D-Bus.
- Use an appropriate Linux secret-service/keyring backend for credentials.
- Adapt startup, tray, transparent-window, always-on-top, and close behavior.
- Define which existing Companion/Cider adapters are supported on Linux after live validation.
- Add Linux-specific unit/integration/manual checks and preserve the Windows suite.

Out of scope:

- macOS support.
- GitHub release automation (`0057`) beyond any minimal local build script needed to verify Linux.
- Scraping player windows, private app databases, OCR, or title parsing.

## Affected Areas

- Backend/native: conditional compilation, MPRIS/D-Bus, keyring, startup, tray, window behavior.
- Frontend: OS-aware source availability and recovery copy.
- Domain/API contracts: platform/source capability matrix.
- Tests: Linux adapter, platform services, existing Windows regressions.
- Documentation/build/release: Linux prerequisites, artifacts, architecture and support tables.
- Security/privacy: D-Bus boundaries, credentials, metadata persistence.
- Project tracking: roadmap, task/report, decision, time log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `not started` |
| Started at | `pending` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `not_tracked` until implementation starts |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] The project compiles and launches on the documented Linux baseline without weakening Windows support.
- [ ] MPRIS discovery and playback use only the official D-Bus contract and expose capability-safe controls.
- [ ] Linux credential storage uses the OS secret service rather than frontend/plaintext persistence.
- [ ] Window, tray, startup, always-on-top, close, and position behavior have explicit Linux outcomes.
- [ ] Unsupported adapters/actions are disabled with localized guidance instead of reconnect loops.
- [ ] Windows and Linux support/adapter tables match live-verified behavior.
- [ ] Frontend, Rust, E2E, Linux build, Windows regression, security, docs, task/report, and time-log checks pass.

## Verification Plan

- [ ] Record a platform architecture decision before implementation.
- [ ] RED/GREEN tests for platform service selection and MPRIS mapping/capabilities.
- [ ] Run frontend verification and Rust tests/checks on both Windows and Linux.
- [ ] Live-test MPRIS against representative compatible Linux players.
- [ ] Verify keyring, startup, tray, transparent window, and source switching on Linux.
- [ ] Build a documented Linux artifact locally before CI automation starts.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Which Linux distributions/package formats are supported first? | Open | Decide from Tauri/WebKit/runtime dependency trade-offs before implementation. |
| Is MPRIS the first Linux system adapter? | Resolved | Yes; it is the official cross-player Linux contract and precedes macOS work. |
| Do Companion and Cider ship on Linux in the first pass? | Open | Enable only after their upstream Linux availability and live local API behavior are verified. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Windows-only dependencies prevent Linux compilation | No usable artifact | Isolate platform services and use target-specific dependencies before adapter work. |
| Player MPRIS implementations vary | Inconsistent controls/metadata | Use published capabilities, defensive mapping, and representative live tests. |
| Linux keyring/runtime dependencies confuse installation | Credential or launch failures | Document supported baseline and fail with actionable platform-specific copy. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Windows source baseline: [`0045`](0045-add-windows-media-session-playback-source.md)
- CI/release successor: [`0057`](0057-add-github-ci-builds-and-releases.md)
- Report: `pending`
- Time log: `pending`
- PR/commit: `pending`
