# 0031 - Fix Companion auth persistence

## Status

Completed

## Context

After task 0030, a live YTMDesktop v2.0.11 approval still produces a false intermediate state: Settings shows `Stored securely` while reconnecting, but pressing `Reconnect now` immediately changes the same running app to `Authorization needed` / `Not authorized`.

The transition proves that the post-auth UI can claim storage without a successful `companion_has_auth` read. The current controller synthesizes `hasStoredAuth=true` whenever it is in the protected post-auth path, even if the backend keyring probe returned false.

No widget process or matching Windows Credential Manager target remained when this iteration began, so the pass must make persistence self-verifying and expose backend failures instead of masking them.

## Goal

Make the OS keyring the only source of truth for stored Companion authorization, verify token persistence immediately after writing, and ensure manual reconnect cannot silently demote a successful approval to unauthenticated state.

## Scope

Included:

- Trace actual executable identity, keyring target, and store/load/clear calls.
- Remove synthetic `Stored securely` state.
- Add read-after-write verification for token persistence.
- Preserve useful backend error detail instead of converting credential read failures to `false`.
- Fix all confirmed auth-flow state, race, and error-handling bugs found during the pass.
- Add regression tests for post-Allow and manual reconnect behavior.

Out of scope:

- Unrelated widget UI changes.
- Storing tokens outside the OS keyring.
- Logging token values or hashes.

## Affected Areas

- Backend/native: keyring write/read verification and auth commands.
- Frontend: gateway auth probe and controller state transitions.
- Domain/API contracts: post-auth connection state semantics.
- Tests: Rust keyring and TypeScript reconnect regressions.
- Documentation: auth persistence and diagnostic behavior.
- Build/release/config: primary portable executable.
- Project tracking: task, report, roadmap, and time log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0031-a` |
| Started at | `2026-07-09T07:47:42.0717020+03:00` |
| Finished at | `2026-07-09T08:07:42.3174887+03:00` |
| Time spent minutes | `21` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) |

## Acceptance Criteria

- [x] `Stored securely` is shown only when `companion_has_auth` confirms a persisted credential.
- [x] Token storage performs an immediate read-after-write verification and fails atomically if persistence is not durable.
- [x] Keyring read errors are surfaced, not silently treated as `Not authorized`.
- [x] Manual reconnect after successful approval retains authorization.
- [x] Explicit `Clear auth` remains the only credential deletion path.
- [x] No token value or hash is logged, serialized to frontend storage, or committed.
- [x] All confirmed auth-flow bugs found during the pass are fixed and covered by tests.
- [x] Full frontend/native checks and the primary portable build pass.
- [x] Tracking files and time log are reconciled.

## Verification Plan

- [x] Runtime evidence: process/credential absence after the reported run and rebuilt exe hash recorded.
- [x] TDD: focused RED/GREEN controller, gateway, and Rust persistence tests.
- [x] Static/tests: `npm run verify`, `cargo test --quiet -j1`, `cargo check -j1`.
- [x] Build: `npm run build:desktop`.
- [x] Security: no token logging/frontend storage; production keyring test cleans its temporary credential.
- [x] Git: `git diff --check`; staged review, branch push, fast-forward merge, and master push pending delivery step.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Why did the first screenshot say `Stored securely`? | Resolved | `beginConnect` forced `effectiveHasStoredAuth=true` for protected post-auth retries even when `gateway.hasStoredAuth()` returned false. |
| Was a matching keyring target present after the reported reconnect? | Resolved | No matching target was visible after the app was closed; no secret values were queried. |
| Why is the credential missing? | Resolved | `keyring = "3.6.3"` did not enable `windows-native`; the fallback retained data only inside one `Entry`, so the next Tauri command saw no credential. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| UI continues to mask backend storage failure. | High | Remove synthetic stored state and propagate credential errors. |
| Read-after-write verification exposes token data. | High | Compare only in Rust memory and return generic stage errors; never log values or hashes. |
| Credential test leaves a probe entry. | Medium | Use a unique target and cleanup guard; verify target absence after tests. |
| Broad auth cleanup introduces another state regression. | High | Require RED/GREEN coverage for each behavior change and keep unrelated code untouched. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Previous task: [`0030-restore-companion-auth-baseline.md`](0030-restore-companion-auth-baseline.md)
- Previous report: [`0030-restore-companion-auth-baseline.md`](../reports/0030-restore-companion-auth-baseline.md)
- Time log: [`time-log.md`](../time-log.md)
- Report: [`0031-fix-companion-auth-persistence.md`](../reports/0031-fix-companion-auth-persistence.md)
- PR/commit: commit `dd9a68c`, merged to `master`
