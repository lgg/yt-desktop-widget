# 0028 - Fix Stored Token Reconnect Loop

## Status

Completed

## Context

After tasks `0026` and `0027`, the live Settings window now shows `Authorization: Stored securely` while `Connection state` remains `Reconnecting`. The user reports it later falls back to requiring authorization, and approving again repeats the same loop.

This means the app is past the code approval phase and has stored something in the backend credential path, but the stored token still does not produce a stable Companion session. The local keyring was empty by the time this pass probed it safely, so the code audit also followed the cleanup path that removes tokens after failed stored-auth validation.

## Goal

Identify and fix the exact failure between stored Companion token, REST `/api/v1/state` validation, and realtime socket connection, without exposing token values.

## Scope

Included:

- Inspect current auth/token/reconnect code and prior reports.
- Add safe diagnostics and tests that expose only status/error classification, not token values.
- Verify whether the stored token validates REST state and whether realtime setup is the reconnect source.
- Fix the confirmed root cause with focused tests.
- Update tracking, run validation, commit/push/merge.

Out of scope:

- Switching away from the official Companion Server API.
- Printing, logging, or committing token values.
- Broad UI redesign or packaging policy changes.

## Affected Areas

- Backend/native: Companion token validation, error classification, realtime connection.
- Frontend/domain: reconnect/auth-state transitions if loop source is frontend.
- Tests: focused regression coverage for confirmed failure.
- Documentation: project tracking.
- Build/release/config: no expected config change.
- Project tracking: task, report, roadmap, time-log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0028-a` |
| Started at | `2026-07-08T14:16:53.3010707+03:00` |
| Finished at | `2026-07-08T14:30:48.3546638+03:00` |
| Time spent minutes | `14` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Stored-token reconnect failure is classified with evidence.
- [x] Valid stored tokens do not fall back to auth-required because of realtime/socket lifecycle issues.
- [x] Invalid stored tokens are cleared only when REST validation proves they are invalid.
- [x] Regression tests cover the confirmed loop.
- [x] No token values are printed or committed.
- [x] Relevant validation passes or skipped checks are documented.

## Verification Plan

- [x] Live local Companion probe without token output: `token_present=false`; no token value, header, or secret material printed.
- [x] Focused tests: `cargo test --quiet companion::tests -j1` passed, `12 passed`.
- [x] `npm run verify`: passed, including ESLint, `29` Vitest tests, and web build.
- [x] `cargo check -j1`: passed with `Finished dev profile`.
- [x] `npm run build:desktop`: initial run failed because the currently running app locked `src-tauri/target/release/ytm-desktop-widget.exe`; rerun with a temporary `CARGO_TARGET_DIR` passed and built the executable.
- [x] Project tracking/time-log review: task, report, roadmap, and time-log updated.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Does the OS keyring contain the token under the app's expected account? | Resolved | Safe diagnostic reported `token_present=false` after the loop had already fallen back and cleared auth. |
| Does stored-token REST `/state` validation succeed? | Resolved | Could not test a live stored token because the keyring was empty; static audit found `Bearer `-prefixed stored values were not retried as raw tokens, so valid tokens could be misclassified as `auth_required`. |
| Is the reconnect loop caused by realtime Socket.IO failure after REST success? | Resolved | Static audit found `rust_socketio` was handshaking on default `/socket.io/` instead of the documented `/api/v1/realtime` endpoint, which can keep a valid token in `Stored securely + Reconnecting`. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Token diagnostics could leak credentials. | Security issue. | Only report booleans/status/error kind; never print token strings or headers. |
| Live YTMDesktop state may change during testing. | Evidence may be transient. | Capture exact timestamps and endpoint statuses. |
| Fixing auth clearing too broadly may keep bad tokens forever. | User remains stuck. | Clear only on proven REST auth failure, not on socket/lifecycle failures. |
| A token may be returned or stored with a `Bearer ` prefix even though YTMDesktop expects raw `auth.token`. | Fresh approval loops back to auth-required or reconnecting. | Strip `Bearer ` for realtime `auth.token` and try both prefixed and raw REST header values. |
| Socket.IO library path semantics may differ from YTMDesktop docs. | REST succeeds but realtime never opens. | Pass `/api/v1/realtime` as the Engine.IO endpoint path and namespace, matching upstream documentation. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related tasks: `0022`, `0026`, `0027`
- Related reports: `project-tracking/reports/0028-fix-stored-token-reconnect-loop.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: Branch `codex-0028-fix-stored-token-reconnect-loop`
