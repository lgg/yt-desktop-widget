# 0026 - Fix Companion Auth Post-Allow Authorized State

## Status

Completed

## Context

Live YTMDesktop v2.0.11 Companion authorization still regresses after the user enters the correct code and clicks Allow. The Settings window can remain in `Reconnecting` while the Authorization card says `Not authorized`, then fall back to the unauthenticated flow.

This follows earlier Companion auth work in tasks `0017` through `0025`.

## Goal

Make the post-Allow Companion flow keep the freshly approved authorization state while validating the token and reconnecting, and avoid presenting the user as unauthenticated during that protected post-auth retry window.

## Scope

Included:

- Audit current Companion auth code against the official v2 Companion API docs.
- Add regression coverage for the post-Allow reconnect state.
- Fix frontend/domain state handling around fresh-token reconnects.
- Update project tracking and run focused validation.

Out of scope:

- Changing Companion API endpoints or token storage backend unless evidence requires it.
- Adding installer/release packaging changes.
- Broad UI redesign.

## Affected Areas

- Backend/native: Companion API behavior reviewed; no native change planned unless root cause moves there.
- Frontend: Settings authorization status and controller auth flow.
- Domain/API contracts: `PlaybackController` post-auth reconnect options.
- Tests: Controller regression tests.
- Documentation: README/project-tracking updates if behavior assumptions change.
- Build/release/config: No planned release config change.
- Project tracking: Task, report, roadmap, time-log.
- Other: Live local Companion endpoint probe when available.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0026-a` |
| Started at | `2026-07-08T01:45:42.4667203+03:00` |
| Finished at | `2026-07-08T01:56:34.8302800+03:00` |
| Time spent minutes | `11` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] After auth completion, the controller treats the fresh token as authorized during post-auth connect validation and retry.
- [x] A transient `auth_required` from `companion_connect` in the post-auth protected path does not immediately flip the Settings Authorization card to `Not authorized`.
- [x] Regression tests cover the post-Allow reconnect path.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, `cargo check -j1`.
- [x] Tests: focused controller tests, then `npm run verify`.
- [x] Build: `npm run verify`.
- [x] Manual QA: probe local Companion metadata and document live auth limitation.
- [x] Documentation review: official Companion auth/socket docs checked.
- [x] Release/config review: confirm no packaging/config changes.
- [x] Time tracking review: task, report, time-log agree.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does the official API still use `/api/v1/auth/requestcode`, `/api/v1/auth/request`, raw `Authorization`, and websocket-only Socket.IO auth token? | Resolved | Yes, confirmed against the official docs during this pass. |
| Is the local Companion server reachable on the configured default endpoint? | Resolved | `GET http://127.0.0.1:9863/metadata` returned `apiVersions: ["v1"]`. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live auth cannot be fully exercised without interacting with the user's YTMDesktop prompt. | Fix may still need user-side confirmation. | Add regression tests for the observed state bug and document manual verification gap. |
| Preserving authorized state too broadly could hide a truly revoked token. | User may see reconnecting instead of auth required briefly. | Limit behavior to explicit post-auth `preserveAuthOnFailure` path and finite retries. |
| Token handling touches sensitive auth state. | Potential credential leak or bad clearing behavior. | Keep tokens in backend keyring only and avoid logging token values. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/`
- Related reports: `project-tracking/reports/0026-fix-companion-auth-post-allow-authorized-state.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: Branch `codex-0026-fix-companion-auth-retry`
