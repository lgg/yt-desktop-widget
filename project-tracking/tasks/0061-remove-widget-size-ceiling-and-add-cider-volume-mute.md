# 0061 - Remove Widget Size Ceiling and Add Cider Volume Mute

## Status

Completed

Implementation, documentation, audits, fresh local verification, SSH branch publication, and merge into the pushed `master` branch are complete. The user explicitly authorized direct console Git push and merge on 2026-07-21, superseding the earlier draft-PR handoff while GitHub CLI authentication remained unavailable.

## Context

The custom widget size is currently constrained by the old 75-150% contract in the frontend, Rust normalization, native window clamping, and Tauri configuration. A 150% scale caps the reference width at 504 px, so users cannot create a large widget even when their desktop and preferred layout can accommodate it.

The Cider adapter added in tasks 0053-0054 intentionally reported a synthetic 100% volume and disabled mute because its official volume contract had not yet been implemented. Task 0060 fixed Companion mute behavior but accurately left Cider unsupported. Cider exposes official local REST and Socket.IO volume contracts, so the adapter can now use real volume state and reversible mute/unmute without scraping or frontend-held credentials.

This pass was explicitly requested as a separate branch with a public pull request and includes implementation, regression coverage, documentation, and two focused audits.

## Goal

Allow custom proportional widget widths of at least 2000 px while keeping native and frontend sizing contracts aligned. Implement truthful, reversible, keyring-safe Cider mute/unmute backed by Cider's official local volume API and realtime volume events.

## Scope

Included:

- raise the proportional custom-size ceiling so an exact 2000 px reference width is accepted;
- align frontend validation, settings controls, Rust normalization, native clamping, tests, and Tauri window limits;
- fetch and validate Cider's real volume on connect and normalize it from 0-1 to the shared 0-100 contract;
- consume `playerStatus.volumeDidChange` safely across supported primitive/object payload shapes;
- preserve the last reliable non-zero Cider volume and implement idempotent mute plus safe reversible unmute;
- prevent failed REST calls from producing false local state and keep now-playing usable when the volume endpoint is temporarily unavailable;
- ensure native manager locks are not held across volume network requests and synchronize successful REST/socket volume changes across windows;
- keep Cider tokens in the OS keyring and the `apptoken` header only;
- update source-specific UI visibility/copy, English/Russian locales, architecture/decisions, capability matrices, and project tracking;
- add backend, frontend, regression, malformed-input, error-path, multi-window/convergence, and size-boundary coverage;
- run two post-implementation audits and all practical automated/manual checks;
- commit, push, and open a pull request.

Out of scope:

- independent width and height distortion; custom sizing remains proportional;
- volume sliders or arbitrary volume editing in the widget;
- enabling mute for Windows Media Session, whose current official adapter contract remains read/control-limited;
- scraping, injection, OCR, title parsing, or non-official Cider integrations;
- installer/release packaging changes.

## Affected Areas

- Backend/native: `src-tauri/src/cider.rs`, Tauri command bridge, native window clamping, Cider REST/socket state and tests.
- Frontend: custom-size repository/helpers, settings controls/copy, mute capability visibility, Cider event mapping and controller integration.
- Domain/API contracts: Cider volume 0-1 REST/socket data normalized to shared 0-100 state; source capability truthfulness.
- Tests: Vitest, Rust unit/integration-style loopback tests, Playwright/settings regressions where applicable.
- Documentation: README support matrix, architecture, existing sizing/Cider decisions, locale copy.
- Build/release/config: Tauri main-window maximum bounds only; no packaging-policy change.
- Project tracking: roadmap, this task, report 0061, and time log.
- Other: security review for keyring/token/error handling and concurrency audit for shared native state.

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
| Finished at | `2026-07-21T18:48:39.5057515+03:00` |
| Time spent minutes | `22` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) (`2026-07-21-0061-b`) |

## Acceptance Criteria

- [x] Entering a 2000 px custom width is accepted, persists through normalization/restart, produces the proportional height, and is not reduced by frontend, Rust, or native Tauri limits.
- [x] Existing minimum/custom/preset sizing and dynamic-height behavior remain covered and compatible.
- [x] Cider connection fetches real finite volume in the 0-1 range and exposes normalized 0-100 state with truthful `canMute` capability.
- [x] A temporary/malformed/unauthorized/missing volume response does not break now-playing connection, panic, leak the token, or permanently prevent a later valid volume update from enabling capability.
- [x] Socket volume events accept the documented number/object/string forms, reject invalid/out-of-range/non-finite values, and update only volume-related state.
- [x] Cider mute remembers a reliable non-zero level, posts zero idempotently, and changes local/shared state only after successful REST confirmation.
- [x] Cider unmute restores the last reliable non-zero level, then a remembered manager-level value, then a documented conservative fallback below full volume.
- [x] Multiple windows share one authoritative Cider volume state, REST and socket updates converge, and no native playback-state or Tauri manager mutex is held while a playback command waits on the network.
- [x] Cider token storage/transmission remains OS-keyring plus `apptoken` header only, with no token in URLs, frontend persistence, logs, user-facing errors, tests, or committed fixtures.
- [x] Companion mute/unmute remains reversible, Cider mute becomes available when supported, and Windows Media Session remains explicitly unsupported rather than falsely actionable.
- [x] English/Russian UI copy, README matrices, architecture/decisions, roadmap, task/report, and time log match the delivered behavior.
- [x] Two post-implementation audits cover capability truthfulness/data flow and concurrency/security/backward compatibility respectively, with findings resolved or recorded.
- [x] Relevant Rust/Vitest/Playwright/static/build checks pass, and any unavailable live Cider test is stated rather than implied.
- [x] Changes are committed on `codex/0061-large-widget-cider-volume`, pushed, and merged into pushed `master` through the user-authorized direct Git workflow.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant. Bootstrap rules did not change, so `bootstrap-sync.md` required no edit.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: `npm run verify`; `cargo check -j1`.
- [x] Tests: focused Vitest sizing/controller/settings tests; focused Rust Cider/native-size tests; full `npm run test` and `cargo test -j1` where practical.
- [x] Build: `npm run build:desktop`.
- [ ] Manual QA: exact 2000 px behavior is covered by frontend/native boundary tests; live Cider mute/unmute could not be exercised because this environment denied the credential-access smoke attempt before it ran.
- [x] Documentation review: searched capability matrices, Cider mute restrictions, old 150% limits, and source-specific copy for contradictions.
- [x] Release/config review: compared effective frontend/Rust/Tauri min/max sizing and confirmed packaging is unchanged.
- [x] Security audit: reviewed token storage/header/error/log paths plus malformed and unauthorized response handling.
- [x] Concurrency audit: reviewed manager lock lifetime, shared state, multi-window commands, and REST/socket convergence.
- [x] Time tracking review: task, report, and time-log values agree before handoff.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| How should a 2000 px width fit the existing proportional sizing model? | Resolved | Raise the maximum scale to 600%; this allows an exact 2000 px width (595.238...%) and a maximum reference width of 2016 px without introducing independent-axis distortion. |
| What should unmute use when neither the connection nor manager has a reliable non-zero level? | Resolved | Use 25%. The official Android remote confirms the endpoint and zero-as-mute but falls back to full volume; this project deliberately chooses 25% to avoid an unexpected maximum-volume jump. |
| Can live Cider behavior be verified in this environment? | Resolved with limitation | The local Cider endpoint was reachable and correctly returned `403` without credentials. A keyring-backed round-trip smoke test was prepared, but the environment rejected the required elevated access before execution because the Codex usage limit was reached. No token was read and no playback volume was changed. |
| How should publication continue while GitHub CLI authentication remains invalid? | Resolved | On 2026-07-21 the user explicitly authorized console Git push and merge. The SSH remote was verified with `git ls-remote origin HEAD`, so publication proceeds through Git without `gh`. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Very large transparent windows can extend off-screen or increase GPU/memory use. | Poor usability or rendering cost. | Keep proportional bounds finite at 600%, preserve resize guards, and document the expanded range. |
| Invalid or stale Cider volume could make mute state dishonest or unmute loudly. | Incorrect UI/audio behavior. | Strict finite/range validation, epsilon comparison, last-reliable tracking, and conservative fallback. |
| Concurrent commands or socket events race with REST completion. | State divergence across windows. | Release native manager/state locks before I/O, serialize or version commands without holding state locks, and treat validated updates as authoritative with convergence tests. |
| Volume endpoint failure accidentally breaks now-playing. | Adapter appears disconnected despite usable playback data. | Fetch volume as best effort, retain now-playing connection, and allow later REST/socket recovery. |
| Token appears in diagnostics or frontend state. | Credential exposure. | Keep keyring ownership native, use `apptoken` header only, sanitize errors, and audit repository/log paths. |
| Expanded bounds differ between frontend, Rust, and Tauri config. | Values clamp after save/restart or native resize. | Central boundary tests and explicit config/code cross-check during release audit. |

## Links

- Roadmap: [`project-tracking/roadmap/0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related decisions: [`0004-use-uniform-widget-scaling-for-size-modes.md`](../decisions/0004-use-uniform-widget-scaling-for-size-modes.md), [`0008-use-a-loopback-keyring-backed-cider-adapter.md`](../decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md)
- Related reports: [`0060-fix-live-mute-visibility-state-and-restore.md`](../reports/0060-fix-live-mute-visibility-state-and-restore.md), [`0061-remove-widget-size-ceiling-and-add-cider-volume-mute.md`](../reports/0061-remove-widget-size-ceiling-and-add-cider-volume-mute.md)
- Time log: [`project-tracking/time-log.md`](../time-log.md) (`2026-07-15-0061-a`)
- Commit/merge: implementation `405533f3ec23a233167f231bfdce3b9fae77750a`; merge `90598a9214e5e98ae2c3ef19fdc3363816fb23ea`; branch and `master` pushed to `origin`
