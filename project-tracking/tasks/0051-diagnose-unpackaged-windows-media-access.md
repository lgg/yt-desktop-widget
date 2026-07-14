# 0051 - Diagnose unpackaged Windows Media access

## Status

Completed

## Context

The interactive Apple Music smoke for task `0050` still fails in the newly rebuilt portable `3.1.0` executable with the generic `Media-session access is unavailable` state. The UI does not currently expose or persist the safe native diagnostic, so the actual failing stage and HRESULT cannot be recovered from the screenshot or an application log.

The previous short-lived probe observed `E_ACCESSDENIED` from `GlobalSystemMediaTransportControlsSessionManager::RequestAsync`, while task `0050` corrected WinRT apartment/thread ownership in the real app. This iteration must now establish the exact portable runtime failure, compare it with official Windows requirements and working unpackaged Rust/Tauri/Win32 implementations, and fix the portable path if a supported unpackaged solution exists.

## Goal

Determine the evidence-backed root cause of the live portable WMS failure and deliver the smallest supported correction plus durable, privacy-safe diagnostics. Do not assume package identity is required unless official requirements and real-world implementations support that conclusion.

## Scope

Included:

- Add persistent privacy-safe diagnostics for WMS discovery/connect/poll/command failures containing only timestamp, operation, stage, HRESULT, and category. Record launch-context evidence in this task/report instead of expanding the persistent privacy surface.
- Research official Microsoft contracts and current open-source Rust, Tauri, Win32, Electron, and Windows App SDK implementations of GSMTC from unpackaged desktop processes.
- Reproduce the relevant manager-access path locally with focused probes that match the portable process architecture.
- Add regression tests before any production behavior change.
- Implement a supported unpackaged fix if the evidence identifies one; otherwise make the exact Windows prerequisite and recovery path visible without breaking Companion mode.
- Build a fresh portable executable and complete frontend/native/security/release verification.

Out of scope:

- Undocumented capability bypasses or Windows security-check circumvention.
- Signing keys, publishing, installer rollout, or an approved packaging migration unless the user explicitly authorizes task `0049` after the research result.
- WMS local history/favorites/export from task `0046`.
- Logging media titles, artists, artwork, credentials, tokens, or other listening-history data.

## Affected Areas

- Backend/native: GSMTC manager activation, package identity/capability diagnostics, persistent native logging, and error propagation.
- Frontend: diagnostic/recovery presentation only if needed for actionable live testing.
- Domain/API contracts: safe structured WMS diagnostics.
- Tests: Rust unit/integration probes, frontend bridge regressions, and existing E2E flows.
- Documentation: README troubleshooting, architecture/decision evidence, and WMS delivery status.
- Build/release/config: portable executable and any manifest/runtime configuration proven necessary.
- Project tracking: tasks `0050`/`0051`, report `0051`, roadmap, decisions, and time log.
- Security/privacy: logs must remain metadata-free and must not weaken Windows capability checks.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0051-a` |
| Started at | `2026-07-14T08:49:37.1101482+03:00` |
| Finished at | `2026-07-14T09:49:18.4420307+03:00` |
| Time spent minutes | `60` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0051-a` |

## Acceptance Criteria

- [x] The live failure is identified as `request_manager.await` / `0x80070005` / `access_denied` in the restricted Codex sandbox; it is not inferred from generic UI copy.
- [x] Official Microsoft documentation and multiple relevant open-source implementations are compared, with packaged versus unpackaged assumptions called out.
- [x] Production diagnostic/recovery changes were preceded by focused failing frontend and Rust regression tests and verified against the failure classification.
- [x] WMS diagnostics persist to a discoverable file and visible Settings/widget surface and contain no media metadata, credentials, or tokens.
- [x] Companion mode and existing widget/settings behavior do not regress.
- [x] A fresh portable `3.1.0` executable is produced and direct-launched in the normal interactive Windows session with WMS selected and no native discovery/connect/poll failure.
- [x] Related code, docs, tests, config, roadmap, task, report, decision, and time-log files are updated when relevant; bootstrap rules did not change.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No known mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, `cargo check -j1`, `cargo clippy --all-targets --all-features -- -D warnings`.
- [x] Tests: focused RED/GREEN native/frontend tests, full Rust tests, full Vitest, Playwright E2E.
- [x] Build: `npm run build:desktop`, `npm run build:portable`, artifact metadata inspection.
- [x] Manual/API QA: active Apple Music, WMS-selected settings, successful normal-context manager/session probe, responsive direct-launched widget, and no WMS failure log. Transparent-window capture could not verify the rendered metadata/buttons and is recorded in the report.
- [x] Documentation review: reconcile official/open-source evidence with README, roadmap, decision `0007`, and tasks `0049`/`0050`.
- [x] Release/config review: preserve centralized version `3.1.0`, portable-only policy, and no installer, bypass, secrets, or signing material.
- [x] Time tracking review: task, report, and time-log fields agree.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does GSMTC `RequestAsync` require package identity for all desktop callers? | Resolved | No. Microsoft's console example and multiple standalone Rust/Tauri implementations use the desktop API; the local normal-user probe also succeeds unpackaged. Capability declarations primarily govern packaged/AppContainer scenarios, not every normal full-trust Win32 caller. |
| What exact stage/HRESULT failed in the user's latest portable run? | Resolved | `request_manager.await`, `0x80070005`, `access_denied` under the restricted Codex sandbox identity/token. |
| Is Apple Music publishing a current GSMTC session on this machine? | Resolved | Yes. The same compiled probe in the normal interactive user context reported three sessions and a current session without reading or logging title/artist/artwork. |
| Should the app relaunch itself through Explorer to escape a restricted token? | Resolved | No. That would turn a supported integration into a security-context workaround. The UI gives direct-launch guidance instead. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Diagnostics record listening history | Privacy regression | Persist only timestamp, operation stage, HRESULT/category, identity/capability booleans, and aggregate session presence/count. |
| An open-source workaround relies on unsupported activation or capability bypass | Security/support regression | Accept only documented Windows APIs and explicitly reject bypass patterns. |
| Restricted launchers deny GSMTC again | WMS is unavailable only under that launcher/token | Persist exact safe diagnostics and tell the user to launch directly from File Explorer; never attempt a token/sandbox escape. |
| Tests cannot emulate interactive GSMTC policy | False confidence | Separate deterministic contract tests from the required live Apple Music smoke and keep claims narrow. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md`
- Related tasks: `project-tracking/tasks/0049-add-supported-packaged-wms-delivery.md`, `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`
- Related reports: `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- Report: `project-tracking/reports/0051-diagnose-unpackaged-windows-media-access.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0051-diagnose-unpackaged-wms-access`; final commit/merge pending at report write
