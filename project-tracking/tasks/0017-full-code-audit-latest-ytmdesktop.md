# 0017 - Full Code Audit Against Latest YTMDesktop

## Status

Completed

## Context

The project was recently updated for the YTMDesktop v2 Companion Server API and then synchronized with bootstrap rules through version `0002`. This audit pass verified the project remains coherent, bug-free within the available review scope, and aligned with the latest YTMDesktop release and documented Companion API.

## Goal

Audit the full codebase and project documentation, verify alignment with the latest YTMDesktop / Companion Server behavior available from upstream documentation, and fix any issues found during the pass.

## Scope

Included:

- Review frontend, native backend, Companion bridge, simulator, domain mapping/state/progress logic, settings/window lifecycle, tests, docs, and project tracking.
- Re-check current upstream YTMDesktop release and Companion Server API documentation.
- Fix bugs or process/documentation issues found during the audit.
- Record verification limits honestly when live YTMDesktop or local build/test execution is unavailable.

Out of scope:

- Claiming live Companion verification without a real local YTMDesktop instance.
- Adding new product features outside audit fixes.
- Adding Docker/Coolify/deployment files.
- Reworking packaging policy outside an explicit release task.

## Affected Areas

- Backend/native: Audited; Companion v2 endpoints/auth/socket assumptions remain aligned with docs.
- Frontend: Audited; endpoint parsing and UI edge cases fixed.
- Domain/API contracts: Audited; realtime socket error handling fixed.
- Tests: Added endpoint parser and realtime socket-error regression coverage.
- Documentation: README wiki link and Companion assumptions confirmed current.
- Build/release/config: Audited; no Docker/Coolify/release packaging changes required.
- Project tracking: Updated for this audit.
- Other: Latest upstream YTMDesktop release checked as v2.0.11.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0017-a` |
| Started at | `2026-07-07T02:21:27+02:00` |
| Finished at | `2026-07-07T02:31:34+02:00` |
| Time spent minutes | `11` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Current upstream YTMDesktop release and Companion API docs are reviewed.
- [x] Companion bridge remains aligned with the documented v2 Companion API contract.
- [x] Frontend/domain/native runtime code is audited for bugs and mismatches.
- [x] Any found bug is fixed or explicitly recorded as a live-validation/open risk if it cannot be fixed safely here.
- [x] Task, report, roadmap, and time-log are updated.
- [x] No Docker/Coolify/release packaging changes are introduced unless required by a discovered issue.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.

## Verification Plan

- [x] Upstream docs/release review.
- [x] Static code audit through GitHub App file reads.
- [ ] Lint/static checks: not run in this connector-only workflow.
- [ ] Tests: regression tests added but not executed in this connector-only workflow.
- [ ] Build: not run in this connector-only workflow.
- [x] Documentation review.
- [x] Release/config review.
- [x] Time tracking review.

## Findings and Fixes

| Finding | Impact | Resolution |
| --- | --- | --- |
| Realtime `socket_error` first scheduled reconnect and then immediately overwrote UI state with `error`, clearing `retryAt`. | Users could see an error state while reconnect was actually scheduled in the background. | `src/integration/companion/realGateway.ts` now reports socket errors through `onDisconnected('socket_error', detail)` only. |
| Companion endpoint settings accepted pasted URLs as raw hosts, producing invalid backend URLs such as `http://http://127.0.0.1:9863`. | A common paste action could silently break the Companion connection. | Added `src/app/endpoint.ts`, normalized `host:port` and local `http://...` URLs, and covered parser behavior. |
| External artwork URLs were interpolated directly into CSS `url(...)`. | Rare malformed URLs could break CSS image rendering. | Added `src/utils/css.ts` and escaped artwork URLs via `JSON.stringify`. |
| Scrubber pointer math divided by `rect.width` without guarding zero-width layout states. | Rare hidden/layout-transition state could produce unstable seek values. | Guarded zero-width tracks in `ProgressScrubber`. |

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Can this audit prove live Companion behavior? | Open | No. Live auth/realtime/commands/seek still require a real local YTMDesktop Companion instance and remain tracked by task `0008`. |
| Should Docker/Coolify files be introduced from bootstrap during this audit? | Resolved | No. This is a Windows-first Tauri desktop app and no deployment support is required for this audit. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| GitHub App contents access does not provide a convenient recursive tree listing. | Medium | Audited known project files, configs, docs, tests, native backend, and changed-file comparison. |
| Latest upstream runtime behavior may differ from docs. | Medium | Used official docs/release info as source of truth here and kept live validation open. |
| Local tests/build were unavailable in this connector-only workflow. | Medium | Added focused regression tests and recorded execution gap honestly in the report. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related task: `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- Report: `project-tracking/reports/0017-full-code-audit-latest-ytmdesktop.md`
- Time log: `project-tracking/time-log.md`
- Source Companion docs: `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`
- Final HEAD: `e8e1285a3c95eaf0c68a26bd137a2460b11a2d6a`
