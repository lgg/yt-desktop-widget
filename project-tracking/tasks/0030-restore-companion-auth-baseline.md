# 0030 - Restore Companion auth baseline

## Status

Completed

## Context

Live Companion authorization against YTMDesktop v2.0.11 still loops after the user approves the matching code. Tasks 0018-0029 changed the pairing controller, token validation, cross-window reconnect behavior, and Socket.IO connection setup without resolving the live failure.

The user reports that authorization worked before the changes made during the week of 2026-07-07. The repository baseline immediately before those changes is commit `de61ccf`. This pass compares that baseline, the current implementation, and the exact upstream YTMDesktop v2.0.11 source at tag commit `3d49f521`.

## Goal

Identify the first concrete behavioral regression from the working baseline, reproduce it with a failing test, and restore a single reliable post-Allow path without weakening token storage or exposing credentials.

## Scope

Included:

- Compare `de61ccf` with current auth, token, reconnect, and realtime behavior.
- Verify assumptions directly against YTMDesktop v2.0.11 source.
- Remove or correct regressions introduced by the recent auth passes.
- Add focused regression tests and redacted diagnostics where needed.
- Build a fresh portable executable for live verification.

Out of scope:

- Changes to YTMDesktop itself.
- Logging or exposing Companion tokens.
- Unrelated UI or architecture refactors.

## Affected Areas

- Backend/native: Companion auth exchange, token validation/storage, connection lifecycle.
- Frontend: pairing controller and cross-window reconnect behavior.
- Domain/API contracts: YTMDesktop Companion Server API v1.
- Tests: Rust and TypeScript auth/reconnect regression coverage.
- Documentation: README protocol notes if assumptions change.
- Build/release/config: portable Windows test build.
- Project tracking: task, report, roadmap, and time log.
- Other: live local YTMDesktop v2.0.11 process and endpoint behavior.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0030-a` |
| Started at | `2026-07-09T06:52:37.6077542+03:00` |
| Finished at | `2026-07-09T07:32:04.0756970+03:00` |
| Time spent minutes | `40` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) |

## Acceptance Criteria

- [x] The last pre-week baseline and every relevant auth/realtime difference are reviewed.
- [x] The root cause is backed by repository history and YTMDesktop v2.0.11 source or live evidence.
- [x] A focused regression test fails before the production fix and passes afterward.
- [x] A successful Allow validates one token before durable storage and uses that stored credential for connection.
- [x] Transient realtime failures do not invalidate an otherwise valid REST token.
- [x] Tokens remain in the OS keyring and are never logged.
- [x] Relevant verification and a fresh portable build complete successfully.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No known code-contract mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, `cargo check -j1`.
- [x] Tests: focused RED/GREEN tests, `cargo test --quiet -j1`.
- [x] Build: `npm run build:desktop` to the normal primary release path.
- [x] Manual QA: redacted local Companion endpoint/keyring probes; final user Allow remains explicitly noted in the report.
- [x] Documentation review: compared README assumptions with upstream v2.0.11 source.
- [x] Release/config review: no permission or packaging change.
- [x] Time tracking review: task, report, and time log reconciled.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| What is the comparison baseline? | Resolved | Commit `de61ccf`, the last repository snapshot before the 2026-07-07 Companion changes. |
| What is the authoritative server implementation? | Resolved | YTMDesktop tag `v2.0.11`, peeled commit `3d49f521344879492f0d9f250f4e3b21720b24b9`. |
| Is the Allow action reaching token creation? | Resolved | Yes. The live server disables new auth requests after the user's successful request, matching the upstream post-token behavior. |
| Which recent change is the root cause? | Superseded by 0031 | Commit `66e4ef0` caused the visible re-pair loop, but task 0031 proved the deeper persistence failure: `keyring` lacked its `windows-native` feature, so a new entry could not read the token. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Another speculative fix extends the loop. | High | No production edit until one hypothesis is reproduced with a failing test or live boundary evidence. |
| Debugging exposes a token. | High | Record only status codes, token presence/length, and stage names; never token contents. |
| Reverting protocol corrections breaks v2.0.11 schema validation. | High | Preserve request schemas confirmed from upstream source and restore only proven lifecycle behavior. |
| Multiple windows race during post-auth reconnect. | Medium | Trace and test event ordering and ensure one owner performs post-auth activation. |

## Follow-up Correction

Task 0031 invalidated the 0030 keyring conclusion. The 0030 probe called `set_password` and `get_password` on the same `Entry`, which passes with keyring's non-persistent fallback. The correct durability test creates a new entry through `load_token`; that test failed until `windows-native` was enabled.

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related tasks: [`0008`](0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md), [`0029`](0029-fix-companion-post-approval-loop-after-realtime-url.md)
- Related reports: [`0008`](../reports/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md), [`0029`](../reports/0029-fix-companion-post-approval-loop-after-realtime-url.md)
- Time log: [`time-log.md`](../time-log.md)
- Report: [`0030-restore-companion-auth-baseline.md`](../reports/0030-restore-companion-auth-baseline.md)
- PR/commit: `8ba8939` on `master`
