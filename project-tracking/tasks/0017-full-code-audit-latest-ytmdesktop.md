# 0017 - Full Code Audit Against Latest YTMDesktop

## Status

In Progress

## Context

The project was recently updated for the YTMDesktop v2 Companion Server API and then synchronized with bootstrap rules through version `0002`. A new full audit pass is required to verify the whole project remains coherent, bug-free within the available review scope, and aligned with the latest YTMDesktop release and documented Companion API.

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

- Backend/native: Under review.
- Frontend: Under review.
- Domain/API contracts: Under review.
- Tests: Under review.
- Documentation: Under review.
- Build/release/config: Under review.
- Project tracking: Updated for this audit.
- Other: Latest upstream YTMDesktop / Companion API assumptions.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0017-a` |
| Started at | `2026-07-07T02:21:27+02:00` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] Current upstream YTMDesktop release and Companion API docs are reviewed.
- [ ] Companion bridge remains aligned with the documented v2 Companion API contract.
- [ ] Frontend/domain/native runtime code is audited for bugs and mismatches.
- [ ] Any found bug is fixed or explicitly recorded as a live-validation/open risk if it cannot be fixed safely here.
- [ ] Task, report, roadmap, and time-log are updated.
- [ ] No Docker/Coolify/release packaging changes are introduced unless required by a discovered issue.
- [ ] Time tracking is filled in task, report, and `project-tracking/time-log.md`.

## Verification Plan

- [ ] Upstream docs/release review.
- [ ] Static code audit through GitHub App file reads.
- [ ] Lint/static checks: run if a local checkout/toolchain is available; otherwise explain skipped state.
- [ ] Tests: run if available; otherwise explain skipped state.
- [ ] Build: run if available; otherwise explain skipped state.
- [ ] Documentation review.
- [ ] Release/config review.
- [ ] Time tracking review.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Can this audit prove live Companion behavior? | Open | No. Live auth/realtime/commands/seek still require a real local YTMDesktop Companion instance. |
| Should Docker/Coolify files be introduced from bootstrap during this audit? | Resolved | No. This is a Windows-first Tauri desktop app and no deployment support is required for this audit. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| GitHub App contents access does not provide a convenient recursive tree listing. | Medium | Audit known project files, use GitHub App search/compare, and record this limitation if exhaustive local execution is unavailable. |
| Latest upstream runtime behavior may differ from docs. | Medium | Use the official docs/release info as source of truth here and keep live validation open. |
| Local tests/build may be unavailable in this connector-only workflow. | Medium | Add/update tests when code changes and record skipped execution honestly in the report. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related task: `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- Related report: `project-tracking/reports/0017-full-code-audit-latest-ytmdesktop.md`
- Time log: `project-tracking/time-log.md`
- Source Companion docs: `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`
