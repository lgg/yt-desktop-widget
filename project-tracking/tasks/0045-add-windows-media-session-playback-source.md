# 0045 - Add Windows Media Session playback source

## Status

Completed

## Context

Version 3.0 supports YTMDesktop through its official Companion Server API. The user requested a second production playback source based on Windows Global System Media Transport Controls so the widget can display and control compatible sessions published by apps such as Apple Music, Spotify, and Yandex Music. The existing Companion behavior must remain the default and must not regress.

Windows documents `GlobalSystemMediaTransportControlsSessionManager` for Windows 10 version 1809 and later. It exposes the current system-selected media session, media properties, timeline/playback state, and supported transport commands. It does not expose Like/Dislike or numeric volume/mute state.

## Goal

Deliver version `3.1.0` with a first-class persisted playback-source choice in the first Settings section: YTMDesktop Companion or Windows Media Session. WMS must safely disable and ignore unsupported rating/mute behavior without crashes, hangs, auth prompts, or Companion traffic.

## Scope

Included:

- Add a persisted user-facing playback source independent of the existing development simulator mode.
- Keep YTMDesktop Companion as the migration/default source.
- Put the playback-source selection first in Settings and conditionally show Companion connection/auth settings only for Companion mode.
- Add a Windows/Rust GSMTC adapter for the current system-selected session.
- Map WMS title, artist, album, artwork when available, playback status, timeline, duration, and supported transport capabilities into the existing domain controller.
- Support play, pause, play/pause, previous, next, and seek when the active Windows session reports support.
- Mark Like/Dislike and mute unavailable for WMS; disable them in UI and ignore those commands defensively in the WMS gateway.
- Restart the active controller cleanly when the playback source changes and avoid starting Companion auth/realtime work in WMS mode.
- Preserve browser simulator behavior for development and E2E.
- Normalize/migrate the new setting in TypeScript and Rust.
- Localize all new English/Russian UI copy and capability explanations.
- Update README, AGENTS, architecture, decision, roadmap, task/report, and time log.
- Bump the centralized version to `3.1.0`.
- Run frontend, native, security, dependency, E2E, release, and version audits.

Out of scope:

- Local playback history or local favorites; tracked separately in task `0046`.
- Emulating Like/Dislike against apps that do not expose rating through Windows Media Session.
- Numeric volume adjustment or mute through WMS.
- Choosing a non-current Windows media session manually.
- Guaranteeing support for apps that do not publish a Windows media session.
- Installer/MSIX packaging changes; the manual build remains portable-only.
- macOS media-session support.

## Affected Areas

- Backend/native: new Windows Media Control module, Tauri commands/events, runtime lifecycle.
- Frontend: source selection section, conditional Companion settings, capability-aware actions.
- Domain/API contracts: playback source, gateway kind, raw capabilities, snapshot capabilities.
- Tests: settings migration, controller/gateway behavior, WMS mapping/command policy, Settings/Widget, E2E, Rust.
- Documentation: README, AGENTS, architecture, ADR, roadmap, task/report.
- Build/release/config: Windows crate features, centralized version `3.1.0`; no packaging-policy change.
- Project tracking: task/report `0045`, decision `0006`, future task `0046`, roadmap, time log.
- Other: Windows 10 1809+ compatibility, local media metadata privacy, clean source switching.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0045-a` |
| Started at | `2026-07-14T04:16:46.1292979+03:00` |
| Finished at | `2026-07-14T05:34:48.2025299+03:00` |
| Time spent minutes | `79` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md), iteration `2026-07-14-0045-a` |

## Acceptance Criteria

- [x] The first Settings section selects YTMDesktop Companion or Windows Media Session and persists across windows/restarts.
- [x] Existing settings without the new field migrate to Companion and preserve all existing behavior.
- [x] WMS mode never starts Companion discovery, auth, keyring, REST, or realtime work.
- [x] WMS reads the current Windows media session and maps available metadata, artwork, playback state, position, duration, and capabilities without exposing unrelated system data.
- [x] Play/pause/previous/next and seek use WMS only when supported and rejected native operations surface safe generic errors.
- [x] Like/Dislike controls are non-operable in WMS even if their block is configured visible, and direct rating commands are ignored without error, crash, reconnect loop, or hang.
- [x] Mute is likewise non-operable/ignored in WMS because GSMTC does not expose volume state.
- [x] Source changes dispose the previous gateway and start exactly one new controller/event stream.
- [x] Companion endpoint/auth UI is only shown in Companion mode; WMS explains compatibility and unsupported actions.
- [x] Simulator/browser development behavior remains deterministic and does not require Windows APIs.
- [x] English/Russian locale parity, light/dark themes, collapsed sections, block ordering, hover modes, sizing, drag, progress, and settings persistence remain intact.
- [x] Version `3.1.0` is synchronized through package, Cargo/lock, Tauri, Settings/About, Companion metadata, and Windows EXE metadata.
- [x] No secret/token storage changes, network exposure, telemetry, or unrelated personal-data persistence are introduced.
- [x] Full frontend, Rust, E2E, dependency/security, and portable/release checks pass or any environment limitation is documented.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion/WMS assumptions, tests, docs, and release/config.

## Verification Plan

- [x] RED/GREEN: source migration/selection, capability mapping, ignored rating/mute commands, WMS payload conversion, lifecycle switching.
- [x] Static: `npm run verify`, locale parity/static searches, `git diff --check`.
- [x] Native: `cargo test -j1`, `cargo check -j1`, Windows API request/current-session probe when available.
- [x] E2E: source first, persistence, conditional Companion UI, disabled rating/mute, source switching, existing regressions.
- [x] Build: `npm run build:desktop`, inspect EXE version metadata.
- [x] Security/dependencies: `npm audit --omit=dev`, no new network/secret/logging exposure, scoped Windows API access.
- [x] Documentation/release/time tracking review.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Is WMS a replacement for the dev simulator source mode? | Resolved | No. `playbackSource` is the user product choice; `sourceMode` remains a development/runtime override for Companion vs simulator behavior. |
| Which WMS session is controlled? | Resolved | Windows `GetCurrentSession()` selects the system-preferred current session; manual session selection is deferred. |
| What happens to Like/Dislike in WMS? | Resolved | The block may remain visible by layout preference but its buttons are disabled, and rating commands are ignored defensively by the gateway. |
| What happens to mute in WMS? | Resolved | It is disabled and direct mute/unmute commands are ignored because GSMTC has no numeric volume/mute contract. |
| Is local history included now? | Resolved | No; task `0046` records the requested opt-in history/favorites/export feature. |
| Does this require installer/MSIX work? | Resolved | No packaging change in this pass; portable behavior is tested directly and documented. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Portable Win32 access to GSMTC differs across Windows/app builds. | High | Detect/request the API at runtime, return safe unavailable state, test on current Windows, document Windows 10 1809+ and compatible-session requirement. |
| Multiple controllers or stale events after source switching. | High | Keep one controller owner, dispose before replacement, isolate event names and add lifecycle regressions. |
| App exposes incomplete or invalid timeline/metadata. | Medium | Clamp times, tolerate missing properties/artwork, use safe fallbacks and capability flags. |
| Unsupported rating/mute commands trigger retry/error loops. | High | Disable UI by capability and make WMS gateway treat those command variants as successful no-ops. |
| Polling causes unnecessary idle work. | Medium | Poll only while WMS controller is active, emit only changed snapshots, stop task on disconnect/source switch. |
| Media metadata is personal data. | Medium | Keep it in-memory only in this task; no logging/history/telemetry or disk persistence. |
| Windows crate expands platform surface. | Medium | Enable only required WinRT feature namespaces, keep module Windows-gated, run dependency/security and portable-build checks. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related decisions: [`0006-separate-product-playback-source-from-development-source-mode.md`](../decisions/0006-separate-product-playback-source-from-development-source-mode.md)
- Related future task: [`0046-add-opt-in-local-playback-history-favorites-and-export.md`](0046-add-opt-in-local-playback-history-favorites-and-export.md)
- Related report: [`0045-add-windows-media-session-playback-source.md`](../reports/0045-add-windows-media-session-playback-source.md)
- Microsoft GSMTC manager docs: <https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager>
- Rust for Windows API docs: <https://microsoft.github.io/windows-docs-rs/doc/windows/Media/Control/struct.GlobalSystemMediaTransportControlsSession.html>
- Time log: [`time-log.md`](../time-log.md), iteration `2026-07-14-0045-a`
- PR/commit: branch `codex/0045-windows-media-session-source`
