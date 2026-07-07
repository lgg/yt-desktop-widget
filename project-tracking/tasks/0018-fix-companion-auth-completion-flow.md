# 0018 - Fix Companion Auth Completion Flow

## Status

In Progress

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

- Domain controller: In progress.
- Settings/widget auth UI: In progress.
- Tests: In progress.
- Project tracking: In progress.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0018-a` |
| Started at | `2026-07-07T02:36:36+02:00` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] Pairing code generation starts the documented `/auth/request` token exchange automatically.
- [ ] Pressing Allow in YTMDesktop can complete auth without requiring an additional unclear widget action.
- [ ] Manual confirm remains safe as a retry path.
- [ ] Auth failure returns to an actionable state with detail.
- [ ] Regression tests are added.
- [ ] Task, report, roadmap, and time-log are updated.

## Verification Plan

- [x] Re-check official Companion auth docs.
- [ ] Static code review.
- [ ] Add/update tests.
- [ ] Run local checks if available; otherwise record not-run status.

## Links

- Source Companion docs: `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`
- Related task: `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- Report: `project-tracking/reports/0018-fix-companion-auth-completion-flow.md`
