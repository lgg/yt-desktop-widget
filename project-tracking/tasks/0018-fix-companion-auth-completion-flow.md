# 0018 - Fix Companion Auth Completion Flow

## Status

Completed

## Context

A live user report showed that the YTMDesktop Companion authorization prompt appears and the displayed code matches, but after approving the prompt the widget remains in `Authorization needed` / `Not authorized` instead of connecting. The official Companion API docs state that `POST /auth/request` is the blocking step that prompts the user and returns a token after Allow.

## Goal

Make the Companion pairing flow complete reliably after the user approves the YTMDesktop prompt, with clear UI state and error recovery when the prompt is denied or times out.

## Scope

Included:

- Update frontend/domain auth flow so generating a pairing code starts token exchange immediately.
- Preserve manual confirm as a retry path without duplicate concurrent auth requests.
- Surface auth failure detail instead of silently returning to the same state.
- Add focused regression tests.
- Update tracking and report.

Out of scope:

- Changing the documented Companion API contract.
- Claiming full live validation without a local YTMDesktop run.
- Reworking unrelated settings/window/UI behavior.

## Affected Areas

- Domain controller: Updated.
- Settings auth UI: Updated.
- Tests: Added focused controller auth coverage.
- Project tracking: Updated.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0018-a` |
| Started at | `2026-07-07T02:36:36+02:00` |
| Finished at | `2026-07-07T02:42:35+02:00` |
| Time spent minutes | `6` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] Pairing code generation starts the documented `/auth/request` token exchange automatically.
- [x] Pressing Allow in YTMDesktop can complete auth without requiring an additional unclear widget action.
- [x] Manual confirm remains safe as a retry path.
- [x] Auth failure returns to an actionable state with detail.
- [x] Regression tests are added.
- [x] Task, report, roadmap, and time-log are updated.

## Verification Plan

- [x] Re-check official Companion auth docs.
- [x] Static code review.
- [x] Add/update tests.
- [ ] Run local checks if available; not run in this connector-only GitHub App workflow.

## Fix Summary

| Area | Change |
| --- | --- |
| `PlaybackController.requestAuthCode` | Now starts the token exchange immediately after showing the code. |
| `PlaybackController.completeAuthentication` | Reuses an active token exchange for the same code instead of creating duplicate `/auth/request` calls. |
| Auth failure state | Returns to `auth_required` with the current code and failure detail if YTMDesktop denies or times out. |
| Settings UI | Disables duplicate auth actions while `authenticating` and shows auth detail text. |
| Tests | Added controller regression coverage for auto-complete, failure recovery, and duplicate confirm protection. |

## Links

- Source Companion docs: `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`
- Related task: `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- Report: `project-tracking/reports/0018-fix-companion-auth-completion-flow.md`
