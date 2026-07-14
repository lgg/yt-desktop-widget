# 0052 - Fix live Windows Media Session snapshot failure

## Status

Completed

## Context

After task `0051`, the user rebuilt the current `master` with `npm run build:portable` and reproduced the Windows Media Session failure with Apple Music in a normal interactive Windows session. The visible state is no longer the direct-launch `access_denied` recovery: the widget reports that media updates were interrupted while Settings remains in `Waiting`. The expected privacy-safe JSONL diagnostic file was not created, so the current implementation neither identifies nor recovers from the later connect/poll failure reliably.

## Goal

Identify the exact live WMS failure after manager discovery, fix session snapshot and recovery behavior for Apple Music, and make every failure stage/HRESULT available through the bounded diagnostic path without regressing Companion mode or portable delivery.

## Scope

Included:

- Verify which executable `npm run build:portable` produces and which runtime path the user exercised.
- Trace WMS manager, current-session, metadata, timeline, playback, artwork, and poll/reconnect stages.
- Add failing native/frontend regressions before behavior changes.
- Fix the confirmed live failure and retain structured diagnostics through native events, gateway, controller, Settings, and the bounded JSONL log.
- Run frontend, Rust, E2E, and portable-build verification.

Out of scope:

- Installer/MSIX work from deferred task `0049` unless new evidence proves it is required and the user authorizes that product/release change.
- WMS local history/favorites/export from task `0046`.
- Logging titles, artists, artwork, credentials, tokens, or listening history.

## Affected Areas

- Backend/native: GSMTC snapshot reads, poll recovery, structured status diagnostics, log path.
- Frontend: WMS event mapping and actionable diagnostic presentation.
- Domain/API contracts: structured diagnostic on WMS runtime status events.
- Tests: Rust unit tests, gateway/controller/component regressions, E2E.
- Documentation: README troubleshooting and exact portable behavior.
- Build/release/config: `build:portable` output and portable artifact verification.
- Project tracking: task/report `0052`, roadmap, and time log.
- Security/privacy: diagnostic logging remains whitelist-only and metadata-free.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0052-a` |
| Started at | `2026-07-14T10:37:32.0158580+03:00` |
| Finished at | `2026-07-14T11:18:21.6044902+03:00` |
| Time spent minutes | `41` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0052-a` |

## Acceptance Criteria

- [x] The reproduced UI state is mapped to the initial snapshot-dependent attach path, and the missing structured diagnostic on live status events is proven by RED tests. The previous run wrote no JSONL entry, so an exact historical HRESULT cannot be invented.
- [x] Production behavior changes are preceded by focused failing native/frontend regression tests.
- [x] Manager-level attach no longer waits for metadata, timeline, controls, or artwork; session snapshots are loaded by the connected worker poll.
- [x] Recoverable session invalidation retains the last state, clears the stale manager, and triggers bounded reacquisition instead of leaving the widget stuck in `Waiting`.
- [x] Runtime diagnostics cross native event, gateway, controller, and Settings boundaries and retain the existing bounded whitelist-only JSONL path.
- [x] Companion mode and existing WMS capability-safe controls do not regress.
- [x] A fresh portable `3.1.0` executable is produced from the documented command.
- [x] Related code, docs, tests, config, roadmap, task, report, and time-log files are updated when relevant; bootstrap rules remain unchanged.
- [x] Time tracking is reconciled across task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: focused TypeScript checks, `npm run verify`, Rust tests, and Clippy.
- [x] Tests: focused RED/GREEN Vitest and Rust tests, full Rust/frontend suites, and Playwright.
- [x] Build: `npm run build:portable` with artifact metadata/hash inspection.
- [x] Manual QA: normal interactive WMS-selected portable process, same-machine Apple Music stage probe, and diagnostic-log inspection. Transparent-window content remains a user visual smoke.
- [x] Documentation review: README, architecture, roadmap, task/report, and prior WMS decision consistency.
- [x] Release/config review: portable-only policy and centralized `3.1.0` version.
- [x] Time tracking review: task, report, and time-log agreement.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Is the failure still `RequestAsync` access denial? | Resolved | No evidence supports that for this run. The fresh normal-session probe passed manager, sessions, current session, metadata, artwork, timeline, playback, and controls; the UI state matched a transient attach/runtime failure. |
| Does one Apple Music snapshot operation currently fail the entire attach? | Resolved | It could: connect synchronously required the complete snapshot. Connect now requires only manager access; snapshot work happens after `socket_open` and recovers independently. |
| Why was no JSONL diagnostic created by the previous run? | Resolved with limitation | The historical run produced no file, so its exact HRESULT cannot be recovered. A separate RED test proved live status events also dropped structured diagnostics; that contract is fixed. Native connect/poll failures still use the bounded JSONL writer. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Treating optional GSMTC fields as mandatory | One unsupported Apple Music property disables all playback state | Separate required session access from best-effort metadata/timeline/artwork fields and test fallback behavior. |
| Infinite reconnect/reacquisition loop | CPU churn and flickering UI | Use the existing worker cadence and explicit bounded recovery policy. |
| Diagnostics expose listening history | Privacy regression | Keep the exact whitelist: timestamp, operation, stage, category, and optional HRESULT only. |
| Automated environment cannot render or control the user's interactive session | Incomplete live proof | Combine deterministic regressions, same-machine probes where permitted, fresh artifact checks, and explicit user smoke handoff. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- Related tasks: `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`, `project-tracking/tasks/0051-diagnose-unpackaged-windows-media-access.md`
- Related reports: `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`, `project-tracking/reports/0051-diagnose-unpackaged-windows-media-access.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0052-fix-live-wms-snapshot-failure`
