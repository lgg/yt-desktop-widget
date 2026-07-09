# 0030 - Restore Companion auth baseline report

## Summary

Compared the current Companion flow with repository baseline `de61ccf` and the exact YTMDesktop v2.0.11 implementation at upstream commit `3d49f521`.

The concrete regression was introduced in commit `66e4ef0`: a single `401` during connect or command execution began deleting the OS-keyring token automatically. The later protected-retry flags only delayed that deletion; an ordinary reconnect still erased the freshly issued credential and restarted pairing.

The corrected flow validates the token against authenticated `/api/v1/state` before storing it, never deletes stored auth implicitly, and never retries a pairing code after YTMDesktop has consumed it.

## Done

- Audited all Companion/auth commits from `de61ccf` through `3e5457b`.
- Read the exact YTMDesktop v2.0.11 auth, token, schema, middleware, and Socket.IO source.
- Confirmed live YTMDesktop is reachable and that new auth requests were disabled after the previous successful Allow, matching upstream post-token behavior.
- Confirmed Windows keyring round-trips a 512-character Companion-sized token exactly and cleans up the probe credential.
- Added pre-storage validation of fresh tokens using the exact raw `Authorization` value.
- Removed automatic keyring deletion from connect and command `401` handling.
- Kept explicit `Clear auth` as the only credential deletion path.
- Changed rejected stored credentials to a stable, actionable error instead of an automatic pairing loop.
- Cleared consumed pairing codes after any completion failure.
- Built the primary portable executable in the normal release path.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0030-a` |
| Started at | `2026-07-09T06:52:37.6077542+03:00` |
| Finished at | `2026-07-09T07:32:04.0756970+03:00` |
| Time spent minutes | `40` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Fresh-token validation precedes storage; auth failures no longer delete credentials. |
| Frontend | Changed | Stored-token rejection is an error, and consumed pairing codes are cleared. |
| Domain/API contracts | Changed | Client behavior now follows v2.0.11 one-use code and raw token semantics. |
| Tests | Changed | Added controller regressions, raw auth validation server test, and Windows keyring round-trip test. |
| Documentation | Changed | README, roadmap, task, report, and time log updated. |
| Build/release/config | Verified | No packaging/config change; normal portable release target built. |
| Bootstrap sync | Not applicable | No process rule change. |
| Time tracking | Changed | Iteration 0030 recorded. |
| Project tracking | Changed | Task 0030 and matching report added. |

## Changed Files

- `src-tauri/src/companion.rs`
- `src-tauri/src/lib.rs`
- `src/domain/playback/connectionMachine.ts`
- `src/domain/playback/controller.ts`
- `src/domain/playback/controller.test.ts`
- `tests/domain/playback/controller.test.ts`
- `README.md`
- `project-tracking/tasks/0030-restore-companion-auth-baseline.md`
- `project-tracking/reports/0030-restore-companion-auth-baseline.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Baseline history audit | Passed | `de61ccf` had no implicit credential deletion; `66e4ef0` introduced it. |
| Upstream source audit | Passed | Checked YTMDesktop v2.0.11 tag commit `3d49f521` auth schema, one-use code removal, token issuance, raw auth middleware, and realtime namespace. |
| TDD RED/GREEN | Passed | Stored-token loop, consumed-code, and fresh raw-token validation tests failed before their fixes and passed afterward. |
| Rust tests | Passed | `cargo test --quiet -j1`: 14 passed. |
| Frontend verification | Passed | `npm run verify`: lint, 31 tests, TypeScript, and Vite build passed. |
| Native check | Passed | `cargo check -j1` completed successfully. |
| Portable build | Passed | `npm run build:desktop` built `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Security review | Passed | No token value was logged; keyring remains the only persistent token store; temporary probe credential was deleted. |
| Rust formatting | Not available | `cargo fmt --check` could not run because `rustfmt` is not installed; `git diff --check` is used in final verification. |
| Time tracking review | Passed | Task, report, and time log use the same tracked 40-minute interval. |

## Not Verified

- The final user-driven Allow click with this exact executable still requires one manual run because YTMDesktop currently reports new authorization requests disabled after the previous successful approval.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| What changed from the pre-week baseline? | Commit `66e4ef0` added automatic keyring deletion on any authenticated `401`; the baseline retained credentials until explicit clear. |
| Did YTMDesktop v2.0.11 change its API? | No relevant server contract change was found. The exact v2.0.11 source confirms one-use codes, raw tokens, raw `Authorization`, and `/api/v1/realtime` namespace semantics. |
| Can the Windows keyring hold the issued token? | Yes. A 512-character token round-tripped byte-for-byte in the real Windows credential backend. |
| Why did later preserve-auth fixes not stop the loop? | They protected only selected post-auth calls. A later ordinary reconnect still reached the deletion branch from `66e4ef0`. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the final normal-path executable complete the live round-trip? | User | Enable one new Companion authorization request in YTMDesktop, run the newly built primary exe, and approve once. |

## Residual Risks

- A genuinely revoked stored token now remains until the user presses `Clear auth`; this is intentional to prevent transient server responses from destroying credentials.
- A realtime-only failure can still show reconnecting while the validated REST token remains stored; it can no longer force a new pairing loop.
- The YTMDesktop installation currently runs from a `.bak-20260707-022742` directory, although its process and source version report v2.0.11. This did not change the verified local API behavior but remains an environment irregularity.
- `src-tauri/Cargo.toml` has a pre-existing unstaged line-ending-only change and remains excluded.

## Next Steps

- Run the normal release executable and perform one final live Allow round-trip after enabling authorization requests in YTMDesktop.
