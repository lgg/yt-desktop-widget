# 0029 - Fix Companion Post-Approval Loop After Realtime URL

## Status

Completed

## Context

After task `0028`, the user reports that YTMDesktop still accepts the pairing request, but the widget remains in `Reconnecting` and later returns to requiring authorization. Repeating Allow repeats the loop.

This means the previous fixes for `Bearer` fallback and realtime endpoint path were not sufficient, or the locally running binary is still following a different failure path. This pass must collect direct evidence from the current live app/API state before making another production change.

## Goal

Find and fix the remaining root cause that makes a freshly approved Companion token fail to become a stable connected session.

## Scope

Included:

- Re-audit current post-Allow token exchange, keyring storage, REST validation, realtime connection, and frontend retry/cleanup flow.
- Collect safe live evidence from local YTMDesktop and keyring without printing token values.
- Add regression tests for the confirmed failure mode.
- Fix the root cause with minimal backend/frontend changes.
- Update task/report/roadmap/time-log and run validation.

Out of scope:

- Switching away from the official YTMDesktop Companion Server API.
- Logging, printing, or committing token values.
- Broad UI redesign or packaging policy changes.

## Affected Areas

- Backend/native: Companion auth exchange, token validation, realtime Socket.IO setup, token cleanup.
- Frontend/domain: post-auth retry/auth-required transitions if implicated.
- Tests: focused regression coverage for confirmed failure.
- Documentation: README/project tracking if protocol assumptions change.
- Build/release/config: no expected config change.
- Project tracking: task, report, roadmap, time-log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0029-a` |
| Started at | `2026-07-08T14:37:58.9287765+03:00` |
| Finished at | `2026-07-08T14:46:04.0937255+03:00` |
| Time spent minutes | `9` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] The current post-Allow loop is explained with evidence from code and/or safe local probes.
- [x] A valid freshly approved token is not cleared because of transient post-auth validation/realtime timing.
- [x] Invalid tokens are still recoverable through an explicit clear-auth path or proven invalid-auth response.
- [x] Regression tests cover the confirmed remaining failure mode.
- [x] No token values are printed, logged, or committed.
- [x] Relevant validation passes or skipped checks are documented.

## Verification Plan

- [x] Safe local Companion/keyring probe without token output: `/metadata` returned `200`; `/state` without token returned `401`; `/socket.io/?EIO=4&transport=polling` returned `400 Transport unknown`; `/api/v1/realtime/?EIO=4&transport=polling` returned `404`; `cmdkey` target search returned no matching credential.
- [x] Focused regression tests: `cargo test --quiet companion::tests -j1` passed, `12 passed`.
- [x] `npm run verify`: passed, including ESLint, `29` Vitest tests, and web build.
- [x] `cargo test --quiet -j1`: passed, `12 passed`.
- [x] `cargo check -j1`: passed.
- [x] `npm run build:desktop`: passed using a temporary `CARGO_TARGET_DIR` to avoid the locked normal release exe.
- [x] Project tracking/time-log review: task, report, roadmap, and time-log updated.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Is the latest rebuilt binary actually what the user tested? | Partially resolved | A fresh desktop build passed in this pass. The user's reported symptom matches the `0028` code path that used the wrong Engine.IO URL, but manual launch of the rebuilt exe remains the next live QA step. |
| Does `/auth/request` return a token that is accepted by `/api/v1/state` immediately or after delay? | Not directly verified | The current keyring was already empty; this pass did not generate a new pairing code to avoid invalidating tokens during diagnostics. |
| Does the socket connect fail after REST success, or does REST validation fail before socket setup? | Resolved | Live endpoint probe showed `rust_socketio` must use the base Socket.IO URL: `/socket.io` is the Engine.IO route, while `/api/v1/realtime` is not an Engine.IO HTTP route. |
| Does frontend clear/schedule auth-required after protected retries even while a token still exists? | Resolved | Code tracing found token cleanup only on backend `AuthRequired` without preserve, explicit `Clear auth`, or command `AuthRequired`; socket `Network/socket_error` does not clear token. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Token diagnostics could leak credentials. | Security issue. | Print only booleans, lengths, status codes, and redacted hashes if needed; never print token/header values. |
| Repeated auth attempts may invalidate previous tokens for the same `appId`. | More confusing live state. | Prefer inspecting current state first; do not generate new auth codes during diagnostics unless required. |
| Over-preserving invalid tokens can strand users. | User remains stuck as authorized but disconnected. | Preserve only fresh/protected post-auth attempts; keep explicit Clear auth and proven invalid-token recovery. |
| Treating a Socket.IO namespace as Engine.IO path breaks realtime while REST auth succeeds. | `Stored securely` remains stuck in `Reconnecting`. | Use base URL for `rust_socketio` and pass `/api/v1/realtime` only as namespace. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related tasks: `0022`, `0027`, `0028`
- Related reports: `project-tracking/reports/0029-fix-companion-post-approval-loop-after-realtime-url.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: Branch `codex-0029-fix-companion-post-approval-loop`
