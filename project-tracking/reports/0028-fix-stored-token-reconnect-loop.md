# 0028 - Fix Stored Token Reconnect Loop Report

## Summary

Fixed two backend protocol issues that can produce the user's `Stored securely` then endless `Reconnecting` / auth-required loop after approving YTMDesktop Companion authorization.

The REST path now tolerates a stored `Bearer ...` value by retrying with the raw token, and the realtime Socket.IO connection now uses `/api/v1/realtime` as the actual endpoint path instead of falling back to the library default `/socket.io/`. Realtime `auth.token` is also normalized to the raw token value, matching the official YTMDesktop v2 Companion API docs.

## Done

- Re-read the project rules, latest Companion auth reports, code paths, and official YTMDesktop Companion docs.
- Ran a safe local keyring/live probe that printed only `token_present=false`, not token values.
- Traced token cleanup after `Stored securely`; cleanup still only happens on backend `AuthRequired`, not socket/lifecycle errors.
- Added Rust regression coverage for `/api/v1/realtime` URL construction and `Bearer ` token fallback/normalization.
- Changed realtime Socket.IO setup to connect to `/api/v1/realtime` and send raw `auth.token`.
- Updated README and project tracking.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-08-0028-a` |
| Started at | `2026-07-08T14:16:53.3010707+03:00` |
| Finished at | `2026-07-08T14:30:48.3546638+03:00` |
| Time spent minutes | `14` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | REST auth fallback handles both `Bearer token` and raw token; realtime connects to `/api/v1/realtime` and sends raw `auth.token`. |
| Frontend | Not changed | Existing protected post-auth UI flow remains unchanged. |
| Domain/API contracts | Changed | README now documents realtime endpoint and namespace explicitly. |
| Tests | Changed | Added Rust regressions for realtime URL and token normalization/fallback. |
| Documentation | Changed | README, task, report, roadmap, and time-log updated. |
| Build/release/config | Verified | No config change; desktop build passed with a temporary target directory because the normal release exe was locked. |
| Bootstrap sync | Not applicable | No bootstrap rule changes. |
| Project tracking | Changed | New task/report and roadmap/time-log rows. |

## Changed Files

- `src-tauri/src/companion.rs`
- `README.md`
- `project-tracking/tasks/0028-fix-stored-token-reconnect-loop.md`
- `project-tracking/reports/0028-fix-stored-token-reconnect-loop.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Safe live/keyring probe | Completed | Current keyring reported `token_present=false`; no token values were printed. |
| Focused Rust tests | Passed | `cargo test --quiet companion::tests -j1`: `12 passed`. |
| Full Rust tests | Passed | `cargo test --quiet -j1`: `12 passed`. |
| Frontend verification | Passed | `npm run verify`: ESLint, `29` Vitest tests, and web build passed. |
| Native check | Passed | `cargo check -j1` finished successfully. |
| Desktop build | Passed after temp target rerun | Normal release build was blocked by locked `target/release/ytm-desktop-widget.exe`; rerun with temporary `CARGO_TARGET_DIR` passed and built the executable. |
| Docs review | Passed | Official docs confirm token response, websocket-only realtime, `/api/v1/realtime`, and `auth.token`. |
| Security review | Passed | No secrets printed or committed; token remains in OS keyring-backed storage. |
| Time tracking review | Passed | Task, report, roadmap, and time-log agree. |

## Not Verified

- A fresh live Allow round-trip with a newly stored token was not completed inside this pass because the current keyring had already been cleared before probing.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why can `Stored securely` still end as auth-required? | A stored value with a `Bearer ` prefix was only retried as `Bearer ...`, never as the raw token expected by YTMDesktop. |
| Why can `Stored securely` remain stuck in reconnecting after REST success? | `rust_socketio` was using default `/socket.io/` for the Engine.IO endpoint when given only the base URL; YTMDesktop v2 documents `/api/v1/realtime`. |
| Was token material exposed during debugging? | No. The probe printed only booleans/status-like information. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the next live approval now complete end-to-end on this machine? | User / next manual QA pass | Run the rebuilt app, approve the code in YTMDesktop, and verify the widget reaches connected playback state. |

## Residual Risks

- If YTMDesktop has additional local settings disabling auth issuance, it can still reject new tokens; that condition is separately surfaced as `authorization_disabled`.
- If the live Socket.IO server emits payloads in a shape not covered by existing mapping tests, task `0008` still tracks broader live Companion realtime/command validation.
- `src-tauri/Cargo.toml` still appears as a pre-existing line-ending-only unstaged change and is intentionally not part of this task.

## Next Steps

- Rebuild/run the app and retry Companion authorization once with YTMDesktop v2.0.11.
