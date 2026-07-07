# 0018 - Fix Companion Auth Completion Flow Report

## Summary

Fixed the Companion pairing flow after a live report where the YTMDesktop prompt displayed the matching code, but the widget stayed in `Authorization needed` after approval.

The official Companion API docs state that `POST /auth/request` is the step that opens the user prompt and may wait up to 30 seconds before returning a token. The widget now follows that UX directly: generating a code starts the token exchange immediately, so pressing Allow in YTMDesktop can complete pairing without an extra unclear action in the widget.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0018-a` |
| Started at | `2026-07-07T02:36:36+02:00` |
| Finished at | `2026-07-07T02:42:35+02:00` |
| Time spent minutes | `6` |
| Tracking status | `tracked` |

## Changes

| File | Change |
| --- | --- |
| `src/domain/playback/controller.ts` | Starts token exchange immediately after code generation, deduplicates repeat confirm clicks, and returns to actionable auth state on failure. |
| `src/app/SettingsWindow.tsx` | Disables duplicate auth actions while `authenticating` and displays auth detail messages. |
| `tests/domain/playback/controller.test.ts` | Adds regression tests for auto token exchange, failure recovery, and duplicate confirm protection. |
| `project-tracking/tasks/0018-fix-companion-auth-completion-flow.md` | Records task completion and time. |

## Verification

| Check | Status | Notes |
| --- | --- | --- |
| Official Companion auth docs reviewed | Done | Confirmed `POST /auth/request` prompts the user and returns `token` after Allow. |
| Static code review | Done | Reviewed updated controller, settings UI, and tests via GitHub App file reads. |
| Regression tests added | Done | Added focused Vitest coverage. |
| Local `npm test` / `npm run verify` | Not run | No local checkout/toolchain execution in this connector-only workflow. |
| Live YTMDesktop validation | Not run | Must be validated on the user's Windows machine with YTMDesktop running. |

## Expected User Flow After Fix

1. Click `Generate code` in the widget/settings.
2. YTMDesktop shows the matching Companion authorization prompt.
3. Click `Allow` in YTMDesktop.
4. The widget should automatically store the token, reconnect, and move to connected playback state.

If the prompt is denied or times out, the widget remains in authorization state with the same code and a visible detail message, and manual confirm remains available as a retry path.
