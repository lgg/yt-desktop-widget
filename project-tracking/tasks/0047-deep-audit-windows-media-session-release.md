# 0047 - Deep audit Windows Media Session release

## Status

Complete

## Context

Task `0045` delivered version `3.1.0` and created local commit `7775ce8`, but network approval limits prevented pushing the branch and merging it into `master`. The user explicitly requested continuation plus a second deep audit to confirm the WMS source is complete, identify latent defects, fix every confirmed issue, and finish delivery without regressing the existing Companion or simulator paths.

This audit treats the implementation as untrusted until source flow, lifecycle, failure behavior, capability enforcement, migration, UI, privacy/security, tests, release artifacts, and Git state are independently re-verified.

## Goal

Produce an evidence-backed release audit for version `3.1.0`, fix all reproducible or source-proven defects with regression coverage, and complete the branch push/merge/push workflow if remote access is available.

## Scope

Included:

- Trace product `playbackSource` and development `sourceMode` resolution across browser, Settings, main window, and Tauri.
- Audit WMS manager ownership, multi-window connect/disconnect, poll-task replacement, source switching, stale events, current-session changes, empty sessions, and command races.
- Audit WinRT metadata, timeline, artwork bounds, capabilities, transport/seek result handling, no-op rating/mute behavior, and generic error confidentiality.
- Audit frontend capability enforcement, Settings ordering/conditional sections, persistence/migration, collapsed sections, localization, accessibility, themes, layout, hover, sizing, progress, and drag regressions.
- Audit privacy/security: no metadata persistence/logging/telemetry, no Companion token changes, no unexpected network/listening surface, validated settings/commands, bounded media input.
- Add RED tests before every confirmed behavioral fix and keep changes scoped.
- Run full frontend, Rust, E2E, dependency, version, static, and portable/release gates where the environment allows.
- Update task/report/roadmap/time log and complete the existing branch push plus merge/push to `master`.

Out of scope:

- Implementing deferred local WMS history/favorites/export task `0046`.
- Adding manual WMS session selection, app-specific scraping, volume control, service Like APIs, macOS, installer/MSIX, or unrelated UI redesign.
- Claiming player compatibility without an interactive signed-in Windows session and a player that publishes GSMTC.
- Broad repository formatting rewrites unrelated to WMS delivery.

## Affected Areas

- Backend/native: `src-tauri/src/windows_media.rs`, Tauri commands/state, settings and lifecycle boundaries.
- Frontend: AppProvider source selection, Settings, Widget controls, shared visibility/layout behavior.
- Domain/API contracts: settings/source/capability/raw-state/command contracts.
- Tests: Rust, Vitest, Testing Library, Playwright, migration and negative-path coverage.
- Documentation: README/architecture/decisions only if audit findings change documented behavior; task/report/roadmap always.
- Build/release/config: dependency audit, centralized version, portable EXE metadata.
- Project tracking: task/report `0047`, roadmap, time log, links to `0045`/`0046`.
- Other: branch `codex/0045-windows-media-session-source`, local commit `7775ce8`, remote delivery.

## Time Tracking

| Field              | Value                                                 |
| ------------------ | ----------------------------------------------------- |
| Iteration ID       | `2026-07-14-0047-a`                                   |
| Started at         | `2026-07-14T05:39:09.4639218+03:00`                   |
| Finished at        | `2026-07-14T06:22:39.3842405+03:00`                   |
| Time spent minutes | `44`                                                  |
| Tracking status    | `tracked`                                             |
| Time log row       | [`time-log.md`](../time-log.md) (`2026-07-14-0047-a`) |

## Acceptance Criteria

- [x] Source selection and migration have one documented default and no Companion work starts in WMS production mode.
- [x] Main/Settings multi-window lifecycle cannot leave duplicate WMS pollers, stop the active consumer incorrectly, or accept stale events after source changes.
- [x] WMS current-session absence/change and incomplete/invalid metadata produce safe deterministic UI state without crash, hang, or unbounded work.
- [x] Capabilities gate every relevant control; WMS Like/Dislike/Mute remain disabled and defense-in-depth no-ops.
- [x] Supported transport/seek failures, including WinRT `false`, surface generic bounded errors without leaking media or system internals.
- [x] Timeline/progress and artwork conversion are clamped/bounded and do not introduce runaway CPU, memory, payload, or storage behavior.
- [x] Settings, locale parity, accessibility, themes, hover/layout/sizing/drag behavior, version display, and persistence retain regression coverage.
- [x] WMS metadata/artwork remain in memory only; no new telemetry, external network, port, token, or permission exposure is present.
- [x] Every confirmed defect has a root-cause note, RED regression, minimal fix, and GREEN evidence.
- [x] `npm run verify`, Rust tests/check, E2E, dependency/security checks, portable build, EXE version metadata, and diff checks pass or limitations are precisely documented.
- [x] Task/report/roadmap/time-log values agree and Definition of Done is reconciled.
- [x] Local work is committed by `lgg`, pushed, merged into `master`, and `master` pushed, unless an external tool/remote blocker is documented.
- [x] No mismatch remains between frontend, native backend, Companion/WMS assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Static/data-flow audit of every `playbackSource`, WMS command/event, capability, and persistence boundary.
- [x] Focused RED/GREEN tests for every confirmed defect.
- [x] `npm run verify` and focused Vitest/Testing Library suites.
- [x] `cargo test -j1` and `cargo check -j1` using an isolated target.
- [x] Playwright source/persistence/regression scenarios with teardown diagnostics.
- [x] `npm audit --omit=dev`, secret/log/network/static searches, and dependency review.
- [x] `npm run build:desktop`, EXE version/hash inspection, and `git diff --check`.
- [x] Manual live WMS probe attempted; the sandbox cannot initialize the interactive Windows media broker, which is documented in report `0047`.
- [x] Documentation, task/report/roadmap, time tracking, Git author/branch/remote/merge review.

## Confirmed Audit Findings

| Finding                                                                                                                            | Root cause                                                                                                                                                                               | Resolution                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Capability-only changes were dropped.                                                                                              | The playback presentation comparator checked `canSeek` but omitted the other five source capability flags.                                                                               | Compare every capability and publish immediately; regression starts with stale flags and finishes GREEN.                               |
| A controller disposed during `connect()` could accept and leak the late connection.                                                | Disposal only disconnected an already assigned connection; callbacks and the pending result had no disposed guard.                                                                       | Guard every async boundary/callback and disconnect a late result with the original backend-ownership option.                           |
| A completed new track could inherit the previous track's cover, artist, or album.                                                  | Shared mapping reused previous metadata without checking track identity/completeness.                                                                                                    | Reuse metadata only for the same track or explicitly incomplete transitional state.                                                    |
| Non-zero timeline origins produced fast progress and incorrect seeks.                                                              | WMS treated absolute `EndTime`/`Position` timestamps as duration/elapsed values.                                                                                                         | Normalize against `StartTime`, clamp to `MinSeekTime`/`MaxSeekTime`, and add range tests.                                              |
| Artwork could be truncated into an invalid data URL and repeatedly copied through IPC.                                             | The stream length was cut to 8 MiB and prior base64 was embedded into every polling snapshot.                                                                                            | Reject oversized streams, resolve artwork once per track, omit it from later ticks, and preserve it only in frontend same-track state. |
| WMS polling and external media input had avoidable lifecycle/security risks.                                                       | Reconnects replaced an active shared poller, missed ticks could burst, metadata was unbounded, arbitrary `image/*` MIME values were accepted, and raw WinRT errors reached the frontend. | Reuse one poller, skip missed ticks, bound Unicode metadata, allowlist inert raster MIME types, and expose fixed generic errors.       |
| WMS empty/error UI still referenced Companion/YTMDesktop.                                                                          | Existing state and connection copy was source-agnostic.                                                                                                                                  | Add source-aware English/Russian state and recovery messages with locale parity/UI regressions.                                        |
| Native status `detail: null` disagreed with the TypeScript bridge contract.                                                        | Serde `Option::None` serializes as `null`, while the frontend allowed only absent/string.                                                                                                | Accept `null` at the bridge and normalize it before gateway callbacks.                                                                 |
| Playwright completed tests but hung while stopping its Windows preview process; a parallel layout case was flaky under contention. | The nested built-in `webServer` process tree did not terminate reliably in this environment, and all layout tests ran concurrently.                                                      | Add a PID-owning PowerShell wrapper with guaranteed cleanup and run the small desktop layout suite serially; 15/15 now exit normally.  |

## Questions and Answers

| Question                                                                               | Status   | Answer / Decision                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should this audit implement local favorites/history?                                   | Resolved | No. It remains deferred task `0046` because it persists personal listening data and needs separate consent/schema/retention design.                                  |
| Should the audit create another feature branch before `0045` is pushed?                | Resolved | No. This is an explicit continuation of the still-local, unmerged `0045` delivery branch; audit fixes will be separate commits on that branch before one push/merge. |
| Can live Apple Music/Spotify/Yandex compatibility be claimed from headless automation? | Resolved | No. Only contract/static/automated behavior can be claimed until the portable app is tested in an interactive user session.                                          |

## Risks

| Risk                                                          | Impact | Mitigation                                                                                                                |
| ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Multi-window WMS manager ownership has hidden races.          | High   | Trace controller and native manager lifetimes, add deterministic lifecycle regressions, keep one active native poll task. |
| WinRT values are incomplete, stale, large, or rejected.       | High   | Clamp/bound, tolerate absence, test pure conversion/error helpers, use capabilities and generic errors.                   |
| Deep audit creates unrelated refactors.                       | Medium | Require a reproduced/source-proven defect and RED test before each behavioral change.                                     |
| Dependency or live-WMS checks remain network/session blocked. | Medium | Record exact command/error and distinguish implementation evidence from environment limitations.                          |
| Remote delivery could diverge from the verified local state.  | Medium | Published the audit branch and merged its exact commits into `master`; recorded both SHAs below.                          |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Parent task: [`0045-add-windows-media-session-playback-source.md`](0045-add-windows-media-session-playback-source.md)
- Parent report: [`0045-add-windows-media-session-playback-source.md`](../reports/0045-add-windows-media-session-playback-source.md)
- Related decision: [`0006-separate-product-playback-source-from-development-source-mode.md`](../decisions/0006-separate-product-playback-source-from-development-source-mode.md)
- Deferred history task: [`0046-add-opt-in-local-playback-history-favorites-and-export.md`](0046-add-opt-in-local-playback-history-favorites-and-export.md)
- Related report: [`0047-deep-audit-windows-media-session-release.md`](../reports/0047-deep-audit-windows-media-session-release.md)
- Time log: [`time-log.md`](../time-log.md)
- Git delivery: branch `codex/0045-windows-media-session-source`; baseline `7775ce8`; audit commit `62dd9be`; merge commit `76d0603`
