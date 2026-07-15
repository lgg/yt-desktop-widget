# 0059 - Fix source-aware warning and mute behavior

## Status

Complete

## Context

With **Cider App** selected, the main widget can show the YTMDesktop Companion authorization card and `Generate code` action even though the Settings window correctly reports that Cider needs an application token. The same Cider-backed widget can render the mute button despite Cider not exposing mute, and the mute control has also been reported as ignoring `On hover` visibility and not reliably reflecting/restoring the muted state.

This pass follows the live adapter stabilization in tasks `0053` and `0054`. The defects cross the selected-source, connection-state, capability, presentation, and command/state feedback boundaries, so they must be traced together rather than patched as isolated labels.

## Goal

Make every main-widget warning/action match the selected playback adapter, and make mute render, reveal, toggle, and update only when the active adapter actually supports it.

## Scope

Included:

- Trace selected source, connection/auth state, widget warning rendering, capability mapping, mute visibility, command dispatch, and returned muted state.
- Restrict Companion pairing UI and pairing-code actions to YTMDesktop Companion.
- Provide source-appropriate Cider and Windows Media warning/recovery presentation without exposing credential details.
- Hide mute completely for adapters/snapshots that do not support it.
- Honor `Always`, `On hover`, and `Hidden` semantics for supported mute controls, including keyboard focus/accessibility behavior.
- Ensure supported mute toggles use the current playback state, update the icon/accessible label, and can restore sound.
- Add focused component/domain/E2E regressions and update relevant documentation/tracking.

Out of scope:

- Adding mute support to Cider or Windows Media Session when their current official adapter contracts do not expose it.
- Changing token storage, Cider authentication transport, Companion pairing protocol, or Windows GSMTC behavior.
- Redesigning unrelated widget blocks or Settings controls.

## Affected Areas

- Backend/native: inspect only unless evidence shows an adapter capability/state/command defect.
- Frontend: main-widget warning/action card, mute rendering and visibility classes, accessible labels/icons.
- Domain/API contracts: selected-source-aware connection presentation and capability-safe command handling.
- Tests: WidgetWindow/controller regressions and browser hover/source scenarios; native tests if backend changes.
- Documentation: task/report and roadmap status; README only if the public capability matrix changes.
- Build/release/config: portable release rebuild; no packaging-policy change.
- Project tracking: task/report `0059`, roadmap, and time log.
- Security/privacy: Cider/Companion warning copy must never reveal tokens or raw backend errors.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0059-a` |
| Started at | `2026-07-15T08:31:45+03:00` |
| Finished at | `2026-07-15T09:04:40+03:00` |
| Time spent minutes | `33` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0059-a` |

## Acceptance Criteria

- [x] Companion pairing copy and `Generate code` render only while YTMDesktop Companion is the selected source and requires authorization.
- [x] Cider auth/unavailable states show Cider-specific guidance and a safe recovery action; Windows Media states never show Companion/Cider authorization actions.
- [x] Main and Settings windows derive warning meaning from the same persisted selected source after source changes/reconnects.
- [x] Mute is not rendered when the active snapshot reports mute unsupported, including Cider and Windows Media Session.
- [x] For a mute-capable source, `On hover` keeps the control visually collapsed until pointer hover or keyboard focus, while `Always` and `Hidden` retain their documented behavior.
- [x] A supported mute action toggles from the current `muted` state, updates its icon/accessible label when state returns, and a second action restores sound.
- [x] Token/credential values remain keyring-only and absent from UI copy, logs, tests, fixtures, and repository changes.
- [x] Related tests, docs, roadmap, report, time log, and portable artifact are reconciled.
- [x] No mismatch remains between frontend, native adapter capabilities, command behavior, tests, docs, and release configuration.

## Verification Plan

- [x] Root-cause evidence: trace source/state/capability values from gateway/controller into `WidgetWindow` and command dispatch.
- [x] RED/GREEN tests: focused source-aware warning, unsupported mute, hover-only mute, icon/label, and mute/unmute command cases.
- [x] Full frontend: `npm run verify` and focused E2E source/hover coverage.
- [x] Native: `cargo test`, `cargo clippy --all-targets -- -D warnings`, and `cargo check -j1` if native code or shared contracts are affected.
- [x] Security: dependency audit plus token/error-copy and changed-file secret scan.
- [x] Build: `npm run build:desktop` and inspect the portable executable metadata/hash.
- [x] Manual QA: reproduce selected Cider warning and mute visibility in the real WebView when live attachment is safe.
- [x] Time tracking: reconcile task/report/time-log totals before commit.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should Cider/WMS receive synthetic mute commands? | Resolved | No. Capability-safe UI must hide unsupported mute rather than pretend the action exists. |
| Should the generic auth-required state imply Companion pairing? | Resolved | No. Presentation and actions must also inspect the selected source. |
| Should raw adapter errors be placed in the warning card? | Resolved | No. Use localized bounded source-specific guidance and keep token/backend details out of user-facing copy. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Fixing only the card copy leaves a wrong pairing action callable | Cross-adapter auth confusion | Gate both rendering and action paths by selected source; test absence and presence. |
| Stale capabilities survive a source switch | Unsupported mute remains visible or callable | Trace controller reset/snapshot replacement and test Cider/WMS after a mute-capable source. |
| Optimistic mute state diverges from player state | Wrong icon or failure to restore audio | Use returned adapter state as truth and test two sequential toggles. |
| Hover CSS hides the button from keyboard users | Accessibility regression | Preserve focus-within/focus-visible reveal and cover it in component/E2E tests. |
| Auth regression exposes credential contents | Security/privacy breach | Keep existing keyring boundary, generic errors, and scan changed content for token-like values. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related tasks: `project-tracking/tasks/0053-fix-windows-media-and-add-cider-adapter.md`, `project-tracking/tasks/0054-fix-live-wms-and-cider-token-auth.md`
- Related decisions: `project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md`
- Related report: `project-tracking/reports/0059-fix-source-aware-warning-and-mute-behavior.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex/0059-source-aware-warning-mute`; final commit/merge recorded in handoff
