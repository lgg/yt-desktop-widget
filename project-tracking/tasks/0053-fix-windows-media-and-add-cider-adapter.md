# 0053 - Fix Windows Media and add a Cider adapter

## Status

Completed

## Context

The user reports that Windows Media Session still remains in an endless reconnect/waiting state after tasks `0050`-`0052` and asks for a dedicated Cider adapter. The previous WMS report claimed optional session reads were isolated, but the current implementation still treats media properties, timeline, playback info, and controls as one all-or-nothing snapshot and emits no first empty-state update when Windows has no current session. The user's installed Cider 4 instance exposes the official opt-in local WebSockets/API surface on port `10767`, has WebSockets enabled, requires application tokens, and currently has no external-application token configured.

## Goal

Make WMS publish a stable connected/empty state and tolerate partial GSMTC snapshots without reconnect churn, then add Cider as a separate first-class playback source using its local Socket.IO/REST API and OS-keyring-backed application token.

## Scope

Included:

- Add RED/GREEN regressions for WMS initial-empty and partial-snapshot behavior.
- Stop optional GSMTC field failures from invalidating the manager connection.
- Add a separate `cider` playback source, local endpoint defaults, state mapping, realtime updates, commands, and secure token lifecycle.
- Add localized Settings guidance for enabling WebSockets and creating an external-application token in Cider.
- Preserve Companion behavior, portable-only packaging, and source migration defaults.

Out of scope:

- Disabling Cider API token enforcement or editing Cider configuration on the user's behalf.
- Remote/LAN Cider access; the first implementation is loopback-only.
- Installer/MSIX work and unrelated widget visual changes.

## Affected Areas

- Backend/native: WMS snapshot policy; Cider REST, Socket.IO, commands, and keyring storage.
- Frontend: source selection, Cider token controls, source-aware state copy.
- Domain/API contracts: third playback source and Cider bridge commands/events.
- Tests: Rust, gateway/controller, settings repository/UI, and browser smoke where relevant.
- Documentation: README, architecture, roadmap, decision records if required.
- Build/release/config: portable build only; no installer change.
- Project tracking: task/report `0053`, roadmap, and time log.
- Security/privacy: loopback endpoint validation, bounded untrusted metadata, token never stored in settings/frontend storage or logs.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0053-a` |
| Started at | `2026-07-15T06:02:38+03:00` |
| Finished at | `2026-07-15T06:22:53+03:00` |
| Time spent minutes | `21` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0053-a` |

## Acceptance Criteria

- [x] WMS emits an explicit empty playback state after connect when no current session exists, so the UI cannot remain indefinitely in `Waiting` solely because `None == None`.
- [x] Failures of optional WMS metadata/timeline/playback/control reads degrade only the affected fields and do not discard a healthy manager or trigger reconnect churn.
- [x] Cider is selectable independently from Companion and WMS and connects only to loopback port `10767` by default.
- [x] Cider token entry is validated by the native backend and stored only in the OS credential store; clear-token behavior is explicit.
- [x] Cider metadata, progress, artwork, supported controls, realtime updates, reconnects, and transport commands map into the existing playback domain.
- [x] English and Russian Settings/connection copy explains Cider WebSockets and Manage External Application Access requirements.
- [x] Companion mode, settings migration, WMS capability safety, and portable-only release policy do not regress.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion/Cider API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: focused TypeScript, `npm run verify`, Rust check/test/Clippy.
- [x] Tests: focused RED/GREEN tests, full frontend/Rust suites, Playwright where relevant.
- [x] Build: `npm run build:desktop` portable release.
- [x] Manual QA: fresh artifact produced; live WMS/Cider UI remains a direct-launch user smoke.
- [x] Documentation review: README, architecture, roadmap, task/report, decisions.
- [x] Release/config review: no installer, network exposure, or token-in-settings regression.
- [x] Time tracking review: task, report, and time-log agreement.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should the adapter weaken Cider's token requirement? | Resolved | No. Use Cider's Manage External Application Access flow and store the supplied token in Windows Credential Manager. |
| Should Cider be folded into WMS detection? | Resolved | No. It is a separate explicit adapter because Cider publishes a richer official local API contract. |
| Which Cider protocol is in scope? | Resolved with compatibility risk | Use the official local port `10767`, Socket.IO `API:Playback` events, and `/api/v1/playback/*` REST endpoints evidenced by Cider's official remote clients and the installed Cider 4 configuration. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Cider 4 changes response shapes relative to open-source Remote clients | State mapping can break | Parse defensively, bound fields, add fixture tests, and expose safe connection errors. |
| Optional WMS fallback hides a real transport failure | Stale/partial UI | Keep manager/current-session failures diagnostic; isolate only field-level failures and retain last known values deliberately. |
| Token leaks into settings or logs | Credential compromise | Native-only token commands, Windows keyring storage, redacted errors, and security tests/review. |
| Local API becomes network-exposed | Unintended remote control surface | Hard-code/validate loopback-only endpoint for this task and document the boundary. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- Related reports: `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`, `project-tracking/reports/0051-diagnose-unpackaged-windows-media-access.md`, `project-tracking/reports/0052-fix-live-windows-media-session-snapshot-failure.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: commit `e650ba2`; merged to `master` as `42c1ec8`
