# 0061 - Remove Widget Size Ceiling and Add Cider Volume Mute Report

## Summary

The widget's proportional custom-size ceiling now permits an exact 2000 px width and scales safely up to a 2016 x 4680 native window. Cider now exposes truthful live volume and mute capability, performs reversible mute/unmute through its official loopback REST API, shares authoritative state across windows, and retains a conservative 25% recovery fallback. Implementation, documentation, two focused audits, and the complete local verification suite succeeded. On 2026-07-21 the user explicitly authorized direct SSH Git push and merge while GitHub CLI authentication remained unavailable.

## Done

- Raised the shared custom size range from 75-150% to 75-600% and aligned frontend normalization, Rust models, native clamping, Tauri configuration, and boundary tests.
- Verified that exact 2000 px width maps to the proportional scale without being clamped and retained the existing proportional size model.
- Replaced Cider's synthetic volume with validated official `GET /api/v1/playback/volume` data normalized from 0-1 to 0-100.
- Added official `POST /api/v1/playback/volume` mute/unmute with idempotent zero mute, reliable non-zero restoration, manager-level restoration across reconnects, and a 25% last-resort fallback.
- Added `playerStatus.volumeDidChange` handling for supported primitive and object payloads while rejecting malformed, non-finite, and out-of-range values.
- Made Cider playback commands run through one sequential native actor shared by the widget and Settings windows; native and cache mutexes are released before network I/O.
- Kept now-playing usable when the volume endpoint is unavailable and allowed later REST or socket recovery to enable mute capability truthfully.
- Kept credentials native-only in the OS keyring and `apptoken` header and removed raw remote payloads from user-visible errors.
- Updated Settings behavior/copy, English and Russian locales, README capability matrices, architecture, sizing/Cider decisions, roadmap, task, and time tracking.
- Completed capability/data-flow and concurrency/security/backward-compatibility audits and resolved their findings.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0061-a` |
| Started at | `2026-07-15T10:26:47.7054579+03:00` |
| Finished at | `2026-07-15T11:01:06.8905772+03:00` |
| Time spent minutes | `35` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) (`2026-07-15-0061-a`) |

### Publication Continuation

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-21-0061-b` |
| Started at | `2026-07-21T18:26:52.3114665+03:00` |
| Finished at | `2026-07-21T18:41:26.6154352+03:00` |
| Time spent minutes | `15` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) (`2026-07-21-0061-b`) |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Added Cider volume REST/socket state, serialized command actor, lock-safe updates, native 600% bounds, and Rust coverage. |
| Frontend | Changed | Enabled Cider mute only when the backend reports support, updated source-specific copy, and expanded custom-size validation. |
| Domain/API contracts | Changed | Cider volume is now authoritative 0-100 shared state derived from the official 0-1 contract; WMS remains mute-unsupported. |
| Tests | Changed | Added frontend gateway/controller/settings/size regressions and extensive Rust API, malformed-input, failure, convergence, and lock-lifetime coverage. |
| Documentation | Changed | Updated README, architecture, ADRs, locale copy, roadmap, task, and report. |
| Build/release/config | Changed | Increased only the Tauri main-window maximum bounds; portable-only packaging policy is unchanged. |
| Bootstrap sync | Not applicable | No shared process rule changed. |
| Time tracking | Changed | Recorded iteration `2026-07-15-0061-a` consistently. |
| Project tracking | Changed | Added task/report 0061 and marked publication blocked. |

## Changed Files

- `src-tauri/src/cider.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/models.rs`
- `src-tauri/tauri.conf.json`
- `src/app/SettingsWindow.tsx`
- `src/app/widgetSize.ts`
- `src/integration/cider/ciderGateway.test.ts`
- `src/domain/playback/controller.test.ts`
- `src/app/SettingsWindow.test.tsx`
- `src/app/settingsRepository.test.ts`
- `src/app/widgetSize.test.ts`
- `src/locales/en.json`
- `src/locales/ru.json`
- `README.md`
- `ARCHITECTURE.md`
- `project-tracking/decisions/0004-use-uniform-widget-scaling-for-size-modes.md`
- `project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0061-remove-widget-size-ceiling-and-add-cider-volume-mute.md`
- `project-tracking/reports/0061-remove-widget-size-ceiling-and-add-cider-volume-mute.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| TDD red phase | Passed | Existing targeted frontend tests failed in 4 expected old-limit/unsupported-Cider assertions; targeted Rust compile exposed 25 intentionally missing volume design symbols/contracts before implementation. |
| Focused frontend tests | Passed | 35/35 targeted tests, followed by 86/86 extended size/settings/controller/gateway/widget tests. |
| Focused Rust tests | Passed | Expanded Cider and native-size target passed 15/15. |
| `npm run verify` | Passed | Fresh 2026-07-21 run: version sync, ESLint, 20 Vitest files/150 tests, and production web build all passed. |
| `cargo test -j1` | Passed | Fresh 2026-07-21 run: 59 passed, 0 failed. The sandbox-owned Cargo lock required the approved unsandboxed runner; code/tests then passed unchanged. |
| `cargo check -j1` | Passed | Fresh 2026-07-21 run: native code compiles cleanly. |
| `npm run test:e2e` | Passed | Fresh 2026-07-21 run: 17 Playwright tests passed. |
| `npm run build:desktop` | Passed | Fresh 2026-07-21 run built `src-tauri/target/release/music-desktop-widget.exe`. |
| `git diff --check` | Passed | No whitespace errors. |
| Credential/private-path scan | Passed | The supplied test token, personal Windows paths, temp clipboard paths, and clipboard filenames were not found in the publish scope. |
| Manual/live Cider QA | Limited | Loopback endpoint was reachable and returned the expected credential-protected `403`; the environment denied the keyring-backed round-trip attempt before it executed. |
| Docs review | Passed | Current support matrices/copy no longer advertise the old 150% ceiling or unsupported Cider mute. Historical completed reports were intentionally preserved. |
| Release/config review | Passed | Frontend, Rust, native intrinsic bounds, and Tauri maximums agree; packaging behavior is unchanged. |
| Time tracking review | Passed | Task, report, and time-log values agree. |

## Audit Results

### Capability and Data Flow

- Traced volume and `canMute` from Cider REST/socket input through the native cache, shared actor, gateway, domain controller, Settings, and widget visibility/state.
- Found that the lower-level Cider transport mapper still represented `Mute`/`Unmute` as an ambiguous silent `None`; changed it to an explicit safe error because volume commands must be intercepted by the stateful volume path.
- Confirmed Companion retains its existing reversible behavior and Windows Media Session remains explicitly unsupported rather than displaying a non-functional control.

### Concurrency, Security, and Backward Compatibility

- Reviewed every relevant lock/await boundary and added a delayed-loopback test proving the shared playback cache remains lockable while HTTP is in flight.
- Confirmed the Tauri command releases the manager guard before awaiting the actor and that successful REST/socket updates converge through one shared native state.
- Reviewed token, URL, request body, event, log, and error paths. Tokens remain keyring-backed and header-only; synthetic token values occur only inside tests.
- Found and removed an `unreachable!()` panic assumption in command routing, returning a safe command error instead.
- Confirmed no release packaging policy, Companion command contract, or WMS capability was broadened by this pass.

## Not Verified

- A live authenticated Cider mute/unmute/reconnect round trip was not executed. The required elevated credential access was rejected before the test ran because the environment reported its Codex usage limit; no credential was read and no volume was changed.
- GitHub CLI remains unauthenticated, so no PR is created through `gh`. The user explicitly authorized direct SSH Git push and merge for this continuation.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| How can exact 2000 px fit proportional sizing? | Use 600% as the finite ceiling; exact 2000 px maps to 595.238095% and maximum reference width becomes 2016 px. |
| What should unmute do without a reliable remembered value? | Restore connection-level last non-zero, then manager-level remembered non-zero, then 25% to avoid an unexpected full-volume jump. |
| Should a volume endpoint outage disconnect now-playing? | No. Now-playing stays connected with mute capability disabled until a valid REST/socket volume update arrives. |
| Which Cider contract is authoritative? | Cider's official local v1 volume REST endpoint and `playerStatus.volumeDidChange` Socket.IO event, verified against `ciderapp/Cider-Remote-RN` commit `8ef100f17973e86d390b6155a659bb765d642f1e`. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Can the exact installed Cider version be live-smoked before merge? | User/Codex | Optionally run the portable build against Cider after publication/authentication; automated official-contract coverage is already green. |

## Residual Risks

- A 600% transparent widget can extend off-screen and consume more GPU/memory; the range remains finite and documented.
- The installed Cider build was not exercised with authenticated volume mutation in this pass, so compatibility confidence comes from the official upstream contract plus loopback/malformed/error/convergence tests.
- The deliberate 25% fallback is audible but avoids the official remote's more dangerous 100% fallback when no reliable non-zero history exists.

## Next Steps

- Commit as `lgg`, push `codex/0061-large-widget-cider-volume` through the verified SSH remote, and merge it into `master` as explicitly requested.
- Optionally perform a live Cider mute/unmute/reconnect smoke before merge.
