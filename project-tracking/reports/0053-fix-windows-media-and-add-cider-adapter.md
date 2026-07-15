# 0053 - Fix Windows Media and add a Cider adapter report

## Summary

Fixed two concrete WMS defects behind endless `Waiting`/recovery churn and added Cider as a separate loopback-only playback source. WMS now publishes its first empty result and treats metadata, timeline, playback-info, and controls as independent best-effort reads. Cider uses port `10767`, Socket.IO `API:Playback`, `/api/v1/playback/*`, and a Windows Credential Manager token.

## What Was Done

- Added RED/GREEN native regressions for first-empty WMS polls and optional snapshot fallback.
- Removed the all-or-nothing WMS snapshot chain while retaining manager/current-session failures as diagnostics.
- Added native Cider discovery, initial state, realtime mapping, commands, token validation/keyring storage, and cross-window auth events.
- Added source selection, Cider gateway/token controls, source-specific EN/RU UI, documentation, and decision `0008`.

## Checks and Results

| Check | Result |
| --- | --- |
| WMS and Cider RED tests | Failed first for the missing behavior, as expected |
| `npm run verify` | Passed: lint, 125 tests, TypeScript, Vite build |
| Rust tests / Clippy | Passed: 45 tests; `-D warnings` clean |
| `npm run test:e2e` | Passed: 16 tests |
| `npm audit --omit=dev` | Passed: 0 vulnerabilities |
| `npm run build:desktop` | Passed; portable `3.1.0` EXE built |
| `git diff --check` | Passed; only line-ending notices |

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0053-a` |
| Started at | `2026-07-15T06:02:38+03:00` |
| Finished at | `2026-07-15T06:22:53+03:00` |
| Time spent minutes | `21` |
| Tracking status | `tracked` |
| Time log | `project-tracking/time-log.md#2026-07-15-0053-a` |

## Not Verified

- Cider and the widget were not running in the work session, so a real Cider 4 token/realtime/control round trip remains a direct-launch smoke.
- Visible WMS metadata and commands remain a normal interactive-session smoke; deterministic regressions cover the corrected state-policy defects.

## Residual Risks and Next Steps

- Cider 4 may evolve response details beyond the official Remote-client v1 shapes; parsing is defensive and isolated in `cider.rs`.
- Create a token in Cider, select `Cider App`, save it, and verify title/artwork/progress and controls in the fresh EXE.
