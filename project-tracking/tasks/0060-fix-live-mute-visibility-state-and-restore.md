# 0060 - Fix live mute visibility, state, and restore

## Status

Completed

## Context

Live user validation after task `0059` exposed three remaining mute defects:

1. `On hover` leaves a visibly translucent mute button when the widget is idle instead of hiding it completely.
2. YTMDesktop Companion accepts the mute command and drops volume to zero, but the returned playback snapshot does not switch the widget to its muted icon/action, so subsequent clicks repeat `mute` rather than sending `unmute` and restoring sound.
3. Windows Media Session currently publishes `canMute: false`, so the capability-safe widget omits mute even when the preference is `Always`. The official Windows control surface and any safe process/audio-session correlation must be verified before claiming support or exposing the button.

## Goal

Make the mute control visually correct and operational in live use: completely hidden while idle in `On hover`, stateful and reversible for Companion, and either genuinely functional for WMS through a supported public Windows contract or explicitly unavailable without a misleading control.

## Scope

Included:

- Trace mute visibility through React state, accessibility attributes, and CSS computed styles.
- Trace Companion `mute`/`unmute`, volume fields, realtime events, controller snapshots, and UI state feedback against the official YTMDesktop implementation.
- Preserve or restore the pre-mute Companion level using the official command contract where available; add bounded local reconciliation only if the external state does not report mute reliably.
- Investigate documented Windows GSMTC and Core Audio session APIs for safe WMS mute/unmute targeting.
- Implement WMS mute only if the current media session can be mapped deterministically to the correct audio session without scraping, injection, title parsing, or global system-volume mutation.
- Reconcile Settings help/capability presentation so `Always` never promises a control the selected adapter cannot provide.
- Add RED/GREEN component, domain/native, E2E, and live portable regressions.
- Rebuild the portable artifact and update tracking/docs.

Out of scope:

- Muting the Windows master output as a fallback for one media player.
- Guessing a target process from window titles, OCR, executable-name heuristics, or broad audio-session mutation.
- Adding Cider mute where its current official local API adapter does not expose a verified mute/unmute contract.
- Changing unrelated widget controls or playback-source behavior.

## Affected Areas

- Backend/native: Companion command/state mapping; possible Windows Core Audio integration after feasibility proof.
- Frontend: hover visibility CSS, mute state/action rendering, capability/help presentation.
- Domain/API contracts: mute capability and state reconciliation.
- Tests: WidgetWindow computed-style/component cases, controller/gateway flow, E2E round trip, Rust tests if WMS changes.
- Documentation: README capability matrix/help text if WMS support status changes; task/report/roadmap/time log.
- Security/privacy: do not log tokens, raw Companion responses, process lists, media metadata, or machine-specific identifiers.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-15-0060-a`                              |
| Started at         | `2026-07-15T09:12:53+03:00`                      |
| Finished at        | `2026-07-15T09:57:09+03:00`                      |
| Time spent minutes | `45`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-15-0060-a` |

## Acceptance Criteria

- [x] With mute set to `On hover`, the idle button has no visible pixels and cannot receive pointer interaction; hover/focus reveals it normally.
- [x] A successful Companion mute changes the icon and accessible action to Unmute even though Companion API v1 does not publish a distinct muted field.
- [x] The next activation sends the official restore/unmute operation rather than repeating mute or remaining at zero.
- [x] External Companion volume/state changes reconcile the widget without leaving a stale optimistic icon.
- [x] WMS mute is exposed only if the selected Windows media session can be safely and deterministically connected to an official per-application audio-session mute control.
- [x] Because WMS cannot meet that boundary, the Settings UI explains the limitation and never presents an inert button as supported.
- [x] Cider remains capability-safe and does not receive a fake mute control.
- [x] No credential, raw response, private path, process inventory, or media metadata is added to tracked diagnostics.
- [x] Frontend, Rust, E2E, security, portable build, and live QA are reconciled in report `0060`.

## Verification Plan

- [x] Capture current CSS/computed-style and live Companion state/command evidence before editing production code.
- [x] Compare the exact YTMDesktop command and state implementation with local mapping.
- [x] Verify WMS/GSMTC/Core Audio feasibility from official Microsoft APIs and current native session data.
- [x] Add focused tests and watch them fail for idle opacity, mute state transition, restore, and WMS capability decision.
- [x] Implement the minimal confirmed fixes and make focused tests green.
- [x] Run `npm run verify`, Playwright E2E, Rust tests/clippy/check as applicable, and dependency/security scans.
- [x] Build `npm run build:desktop`, record executable hash, and inspect the real WebView/adapter behavior.
- [x] Reconcile task/report/roadmap/time log before commit.

## Questions and Answers

| Question                                                    | Status   | Answer / Decision                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does Companion publish the field our UI uses for `isMuted`? | Resolved | No. The official v1 state contains `player.volume` but no muted flag. YTMDesktop dispatches a separate internal `SET_MUTED`, so the widget must reconcile its own successful commands.                                                                                                                      |
| Does Companion `unmute` restore the previous level itself?  | Resolved | Yes. Current official source calls `playerApi.mute()` and `playerApi.unMute()` without rewriting volume. The widget must not send or persist a guessed numeric level.                                                                                                                                       |
| Can WMS mute the current player through GSMTC?              | Resolved | No. The published GSMTC session/control surface has transport, seek, repeat, shuffle, and related controls but no volume or mute. Core Audio can mute an audio session, but the current GSMTC contract does not provide a deterministic safe mapping to exactly that session; WMS mute remains unavailable. |

## Risks

| Risk                                               | Impact                                         | Mitigation                                                                                         |
| -------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Optimistic UI diverges from player state           | Wrong icon/action after external volume change | Reconcile optimistic state with bounded returned state and command failures.                       |
| Restoring a guessed volume overwrites user changes | Unexpected loudness                            | Prefer official unmute/previous-volume behavior; never store a volume without a verified contract. |
| WMS process correlation targets the wrong app      | Muting unrelated audio                         | Require deterministic supported identity mapping or keep WMS mute unavailable.                     |
| Hidden hover control remains faintly visible       | Repeated UX defect                             | Assert computed opacity/visibility/pointer-events, not only accessibility queries.                 |
| Debugging leaks token or media/process data        | Privacy/security issue                         | Use bounded field-shape diagnostics and redact all values from reports/tests.                      |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related task/report: `project-tracking/tasks/0059-fix-source-aware-warning-and-mute-behavior.md`, `project-tracking/reports/0059-fix-source-aware-warning-and-mute-behavior.md`
- Related decisions: `project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md`
- Report: `project-tracking/reports/0060-fix-live-mute-visibility-state-and-restore.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0060-fix-live-mute-behavior`; final commit and merge recorded in handoff
