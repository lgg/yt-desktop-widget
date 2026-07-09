# 0031 - Fix Companion auth persistence report

## Summary

Found and fixed the actual persistence failure behind the repeated Companion authorization loop.

The project depended on `keyring` without its `windows-native` feature. `store_token()` could read a token back through the same in-memory `Entry`, but `load_token()` created a new entry and returned `None`. This exactly matched the live screenshots: post-Allow displayed a synthetic `Stored securely`, then manual reconnect performed a real backend probe and returned to `Not authorized`.

The Windows Credential Manager backend is now enabled, writes are verified through a fresh read path, and the frontend cannot claim stored authorization unless the backend confirms it.

## Done

- Reproduced the persistence failure with production `store_token` / `load_token` functions on Windows.
- Observed the RED result repeatedly: write succeeded, a new entry returned `None`.
- Enabled the `keyring` `windows-native` feature and updated `Cargo.lock`.
- Verified GREEN: a 512-character Companion-sized token survives a new-entry read.
- Added keyring write/read equality verification and atomic cleanup on verification failure.
- Classified all keyring open/read/write/verify/delete failures as `credential_storage`.
- Stopped `realGateway.hasStoredAuth()` from converting backend failures to `false`.
- Removed `preserveAuthOnFailure`, synthetic post-auth authorization, and redundant protected retry machinery.
- Required a real persisted credential before normal or cross-window post-auth connection.
- Added manual reconnect regression coverage.
- Cleared stale consumed pairing codes when credential probing fails after approval.
- Corrected inaccurate keyring claims in task/report 0030.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0031-a` |
| Started at | `2026-07-09T07:47:42.0717020+03:00` |
| Finished at | `2026-07-09T08:07:42.3174887+03:00` |
| Time spent minutes | `21` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Real Windows keyring backend enabled; durable read-back and typed errors added. |
| Frontend | Changed | Backend credential state is authoritative; storage errors remain visible. |
| Domain/API contracts | Changed | Removed obsolete connect preservation option and synthetic post-auth retries. |
| Tests | Changed | Added production keyring durability, false-storage, error propagation, and manual reconnect coverage. |
| Documentation | Changed | README, roadmap, 0030 correction, task/report, and time log updated. |
| Build/release/config | Changed | Cargo feature and lockfile changed; portable exe rebuilt. |
| Bootstrap sync | Not applicable | No process rule changes. |
| Project tracking | Changed | Task/report 0031 added. |

## Changed Files

- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/src/companion.rs`
- `src-tauri/src/lib.rs`
- `src/domain/playback/controller.ts`
- `src/domain/playback/controller.test.ts`
- `src/domain/playback/types.ts`
- `src/integration/companion/realGateway.ts`
- `src/integration/companion/tauriBridge.ts`
- `tests/domain/playback/controller.test.ts`
- `tests/integration/companion/realGateway.test.ts`
- `README.md`
- `project-tracking/tasks/0030-restore-companion-auth-baseline.md`
- `project-tracking/reports/0030-restore-companion-auth-baseline.md`
- `project-tracking/tasks/0031-fix-companion-auth-persistence.md`
- `project-tracking/reports/0031-fix-companion-auth-persistence.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| TDD persistence RED | Passed | Production new-entry test repeatedly returned `None` without `windows-native`. |
| TDD persistence GREEN | Passed | Same test passed after enabling `windows-native`. |
| Rust tests | Passed | `cargo test --quiet -j1`: 15 passed. |
| Frontend verification | Passed | `npm run verify`: lint, 33 tests, TypeScript, and Vite build passed. |
| Native check | Passed | `cargo check -j1` completed successfully. |
| Portable build | Passed | Normal primary release path built successfully. |
| Security review | Passed | No token/hash logging or frontend persistence; explicit clear remains the only production deletion path. |
| Diff review | Passed | `git diff --check` passed; final staged scope review remains part of delivery. |
| Time tracking | Passed | Task, report, and time log use the same tracked 21-minute interval. |

## Not Verified

- The final user-driven Allow click against the rebuilt executable remains a manual action.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why did `Stored securely` disappear on reconnect? | The frontend synthesized the first state, while the next command created a new non-persistent keyring entry and found no token. |
| Why did prior keyring tests pass? | They reused the same `Entry`, so they tested in-object memory rather than durable Windows storage. |
| What makes persistence durable now? | `keyring/windows-native`, production write/read verification, and backend-only authorization state. |
| Are storage failures still hidden as unauthenticated? | No. They propagate as `credential_storage` and produce an error state. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the rebuilt exe complete the final live Allow round-trip? | User | Run the new primary executable and approve once. |

## Residual Risks

- YTMDesktop still disables new authorization requests after successful issuance by design; another pairing requires enabling requests again.
- The currently installed YTMDesktop path remains under a `.bak-20260707-022742` directory, although the local API reports v2.0.11.
- Rust formatting cannot be checked with `cargo fmt` until `rustfmt` is installed; `git diff --check` is used.

## Next Steps

- Run the rebuilt primary executable and perform one live approval.
