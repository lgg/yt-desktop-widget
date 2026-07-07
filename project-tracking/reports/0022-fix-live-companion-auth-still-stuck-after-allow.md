# 0022 - Fix Live Companion Auth Still Stuck After Allow

## Summary

Fixed the next likely live authorization failure after the user confirmed that clicking Allow in YTMDesktop still returned the widget to `Authorization needed`.

The current Companion Server API v1 docs for YTMDesktop v2.0+ confirm that `/auth/request` is a long-polling request that can wait up to 30 seconds for Allow/Deny, then returns a token. The user's screenshot showed the widget leaving `Authorizing` and returning to the generic auth-required state after Allow, which points to the post-token validation/connect step rather than the pairing-code display itself.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0022-a` |
| Started at | `2026-07-07T03:35:45+02:00` |
| Finished at | `2026-07-07T03:51:25+02:00` |
| Time spent minutes | `16` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Research

Sources reviewed:

- YTMDesktop Companion Server API v1 wiki mirror for v2.0.0+ behavior.
- Current `ytmdesktop/ytmdesktop` repository/release state from GitHub web results.
- Existing project code for Companion auth, token storage, REST state validation, realtime socket setup, frontend controller state, and bridge command wiring.

Relevant API facts used:

- `POST /api/v1/auth/requestcode` returns a code.
- `POST /api/v1/auth/request` exchanges the code and can wait up to 30 seconds for user interaction.
- Tokens are bound to the `appId`.
- Authenticated REST requests use the token in the `Authorization` header.
- Realtime Socket.IO connects to `/api/v1/realtime` with websocket transport and `auth.token`.

## What Changed

| Area | File | Change |
| --- | --- | --- |
| Controller | `src/domain/playback/controller.ts` | Added short post-Allow connect retries after transient `auth_required`, with a clear reconnect detail. |
| Domain contract | `src/domain/playback/types.ts` | Added `GatewayConnectOptions.preserveAuthOnFailure`. |
| Tauri bridge | `src/integration/companion/tauriBridge.ts` | Passed optional `preserveAuthOnFailure` to `companion_connect` without violating strict optional typing. |
| Real gateway | `src/integration/companion/realGateway.ts` | Preserves fresh auth during post-Allow validation and forwards the option to Tauri. |
| Rust command layer | `src-tauri/src/lib.rs` | `companion_connect` now preserves fresh tokens when requested; auth code/token long-poll no longer holds the shared CompanionManager mutex. |
| Rust Companion client | `src-tauri/src/companion.rs` | Added standalone auth request helpers, REST `Authorization` fallback values, and tests for auth body/header helpers. |
| Tests | `tests/domain/playback/controller.test.ts` | Added regression coverage for a transient post-approval `auth_required` followed by successful connect. |

## Bug Fixed

Before this pass, once `/auth/request` returned a token after Allow, the frontend immediately tried to connect. If `GET /state` returned `401/403` once, the backend cleared the stored token and the UI returned to `Authorization needed`. That behavior was too aggressive for the live post-Allow path and matches the user's screenshots.

Now the post-Allow path:

1. Stores the token returned by `/auth/request`.
2. Attempts `companion_connect` with `preserveAuthOnFailure: true`.
3. If the first validation gets `auth_required`, keeps the fresh token and retries quickly.
4. Only returns to auth-required after the short retry window is exhausted.

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Current API research | Completed | Confirmed v2/API v1 auth flow, long-poll behavior, token header, and realtime auth shape. |
| Static code audit | Completed | Reviewed backend auth/connect path, frontend controller, bridge wiring, and tests. |
| Diff review | Completed | Compared task start HEAD `f5b98084e3f0d31a2e2625dead4257e3ea88634e` to code-fix HEAD before tracking close. |
| Local `npm run verify` | Not run here | No local repository checkout/build environment is available in this connector-only workflow. |
| Local `cargo check -j1` | Not run here | Same environment limitation. |
| Live YTMDesktop Allow test | Not run here | Requires Windows YTMDesktop Companion Server. |

## Required Local Validation

Run on the user's machine:

```bash
npm run verify
cargo check -j1
npm run build:portable
```

Then run the live Companion test:

1. Start YTMDesktop 2.x and enable Companion Server on `127.0.0.1:9863`.
2. Start the rebuilt widget.
3. Open Settings, click `Clear auth` once to remove stale local keyring state.
4. Click `Generate code`.
5. Confirm the matching code in YTMDesktop with Allow within 30 seconds.
6. Expected result: widget transitions through `Authorizing` / short reconnect state into `Connected` without returning immediately to `Authorization needed`.

## Residual Risks

- If YTMDesktop returns persistent `401/403` for the new token after retries, the issue is outside this race fix: likely rejected token, keyring storage failure, Companion Server bug, appId/token overwrite behavior, or a local YTMDesktop state issue.
- Live QA remains mandatory because the environment cannot run the Windows app or Companion Server.
- The REST Authorization fallback tries plain token first, then `Bearer token`. The wiki says plain token is expected; the fallback is defensive and should not affect the documented path.

## Outcome

The code now handles the exact post-Allow failure mode much more safely: fresh tokens are not destroyed on the first validation failure, auth polling no longer blocks the shared Companion manager, and the frontend has a focused regression test for transient post-approval auth failure.
