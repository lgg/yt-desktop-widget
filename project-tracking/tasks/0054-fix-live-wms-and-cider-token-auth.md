# 0054 - Fix live WMS and Cider token authentication

## Status

Completed

## Context

The portable `3.1.0` build from task `0053` still fails in the user's normal interactive session. Windows Media Session reaches a live-poll error and returns to `Waiting`, while the dedicated Cider adapter rejects a token created by Cider 4 even though WebSockets are enabled on port `10767`. The previous pass validated inferred contracts and deterministic tests but did not validate either integration against the two live applications. During the same pass, the user also requested that the Cider credential controls be replaced with a polished, aligned card instead of the native-looking input and oversized clear action.

Root cause found: `src-tauri/permissions/default.toml` still contained only the older Companion command list. Tauri rejected all four `windows_media_*` commands and all seven `cider_*` commands at the IPC ACL before Rust executed. This explains both screenshots, including the absence of the promised WMS diagnostic file and the misleading token-rejected copy. The installed Cider 4 server and supplied token independently returned HTTP `200` for both authenticated REST probes, confirming the protocol/header were not the rejection cause.

## Goal

Identify the exact live WMS failure stage/HRESULT and the actual Cider 4 authentication/transport contract, add regressions for those confirmed causes, make both adapters work from the portable application without weakening token storage or loopback-only security boundaries, and give the Cider token flow a coherent accessible presentation.

## Scope

Included:

- Inspect active Tauri configuration, runtime identity/capabilities, WMS diagnostics, and the live GSMTC failure path.
- Probe the user's local Cider 4 API with the explicitly supplied disposable token without persisting or logging it.
- Add RED/GREEN native regressions for each confirmed integration defect.
- Correct WMS and Cider native/frontend behavior, safe diagnostics, and source-specific status copy where required.
- Redesign the Cider credential area as one accessible, responsive card with explicit secure-storage state and restrained destructive affordance.
- Build and validate a fresh portable executable and document a precise interactive smoke test.

Excluded:

- Reading or changing unrelated Cider credentials or disabling Cider token enforcement.
- Scraping player UI, parsing window titles, injection, OCR, or non-official playback contracts.
- Installer/MSIX work and visual changes outside the Cider credential card.

## Affected Areas

- Backend/native: `src-tauri/src/windows_media.rs`, `src-tauri/src/cider.rs`, runtime registration and Tauri configuration if evidence requires it.
- Frontend/domain: connection/auth mapping, diagnostic copy, and the Cider credential card in Settings.
- Tests: Rust ACL regression plus focused frontend accessibility/presentation coverage.
- Documentation/tracking: README/architecture/decision records only where the confirmed contract changes them; roadmap, task, report, and time log.
- Security/privacy: disposable token handling, loopback-only requests, keyring persistence, and secret-safe diagnostics.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0054-a` |
| Started at | `2026-07-15T06:34:52+03:00` |
| Finished at | `2026-07-15T07:15:40+03:00` |
| Time spent minutes | `41` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0054-a` |

## Acceptance Criteria

- [x] The live WMS failure is identified by exact stage/HRESULT or an equally concrete boundary observation, not inferred from generic UI text.
- [x] WMS reaches a stable connected/empty or connected/playing state in a normal interactive portable launch without reconnect churn caused by the confirmed defect.
- [x] The actual installed Cider 4 API accepts the supplied application token through the adapter's validation request.
- [x] Cider can establish initial state/realtime updates and execute supported commands using the confirmed official local contract.
- [x] The token remains absent from repository files, settings, logs, errors, and frontend persistence; durable storage remains Windows Credential Manager only.
- [x] RED/GREEN regressions cover the confirmed WMS and Cider causes.
- [x] The Cider token controls form one accessible card with styled input/action controls, disabled empty submission, a Credential Manager status, compact clear action, and no horizontal overflow at the shipped Settings width.
- [x] `npm run verify`, Rust tests/Clippy, relevant E2E checks, `cargo check -j1`, and `npm run build:desktop` pass.
- [x] Task, report, roadmap, and time log agree before handoff.

## Verification Plan

- [x] Live evidence: no WMS log was created because the blocked command never reached Rust; unauthenticated Cider probes returned `403`, while authenticated `apptoken` probes returned `200` with the expected response schema.
- [x] Tests: the new ACL regression failed first on `windows_media_discover`, then passed after all registered commands were restored; the complete Rust/frontend/browser suites pass.
- [x] Static/build: `npm run verify`, `cargo check -j1`, Clippy with warnings denied, and portable desktop build pass.
- [x] Security: repository content was checked for the disposable token; the live Settings flow persisted it only through Windows Credential Manager.
- [x] Interactive smoke: the fresh release reached `Live` for both WMS and Cider, loaded artwork/metadata, and completed play/pause/restore cycles for both adapters.
- [x] Visual QA: the rebuilt Settings WebView showed an aligned 46 px input/save row, all credential controls inside the card, no page overflow, compact clear action, and `Live` Cider state.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| May the supplied disposable Cider token be used for local diagnostics? | Resolved | Yes. The user explicitly supplied it for tests and will rotate it afterwards. It must not be persisted or echoed. |
| Does portable WMS require a packaged capability? | Resolved | No new Windows capability was involved. Tauri's own custom-command ACL blocked the frontend invocation; the same unpackaged release reached `Live` after the ACL fix. |
| Is the task `0053` Cider Remote v1 contract compatible with installed Cider 4? | Resolved | Yes for the exercised contract: REST `apptoken`, active/now-playing responses, Socket.IO connection, metadata/artwork, and play/pause were all confirmed live. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A disposable token leaks through commands or diagnostics | Credential compromise until rotation | Only status/schema were emitted, repository content was scanned, and persistence occurred through the explicit live Settings save into Windows Credential Manager. |
| Restricted Codex token produces a false WMS result | Wrong root cause | Prefer diagnostics from the user's already-running normal process and require final direct-launch smoke. |
| Cider 4 API surface differs by build/version | Brittle adapter | Detect the installed contract from official server responses, isolate mapping/auth helpers, and test status/body variants. |
| A broad runtime rewrite regresses Companion | Shared widget failure | Keep fixes adapter-scoped and run full verification/E2E. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Previous task/report: `project-tracking/tasks/0053-fix-windows-media-and-add-cider-adapter.md`, `project-tracking/reports/0053-fix-windows-media-and-add-cider-adapter.md`
- Report: `project-tracking/reports/0054-fix-live-wms-and-cider-token-auth.md`
- Relevant decision: `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0054-fix-live-wms-cider-auth`; final SHA recorded in handoff
