# 0017 - Full Code Audit Against Latest YTMDesktop Report

## Summary

Completed a full connector-first audit of the known project code, config, docs, and tracking files against the latest available upstream YTMDesktop release information and the official Companion Server API v1 documentation for YTMDesktop v2.0.0+.

Latest upstream release checked: YTMDesktop `v2.0.11`.

Official Companion docs checked: `https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1`.

Final HEAD after fixes: `e8e1285a3c95eaf0c68a26bd137a2460b11a2d6a` before tracking closeout commits.

## Time Tracking

| Field              | Value                       |
| ------------------ | --------------------------- |
| Iteration ID       | `2026-07-07-0017-a`         |
| Started at         | `2026-07-07T02:21:27+02:00` |
| Finished at        | `2026-07-07T02:31:34+02:00` |
| Time spent minutes | `11`                        |
| Tracking status    | `tracked`                   |

## Reviewed Areas

| Area                    | Result                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Companion REST contract | Aligned with documented `/metadata`, `/api/v1/auth/requestcode`, `/api/v1/auth/request`, `/api/v1/state`, and `/api/v1/command` paths. |
| Companion auth          | `appId` remains lowercase alphanumeric and within 2-32 characters; token is sent as raw `Authorization`.                               |
| Companion realtime      | Uses `/api/v1/realtime`, websocket transport, `auth.token`, and `state-update`. One socket-error state bug fixed.                      |
| Native Tauri backend    | Settings, tray, startup, window lifecycle, token storage, command mapping, and MCP debug bridge reviewed.                              |
| Frontend app lifecycle  | Settings load/save/sync, controller lifecycle, source mode resolution, window visibility, and UI state reviewed.                       |
| Domain mapping/progress | Playback mapping, queue fallback, progress smoothing, and seek behavior reviewed.                                                      |
| UI components           | Artwork, cover, controls, scrubber, settings sections, i18n copy, and CSS reviewed.                                                    |
| Tests                   | Existing Vitest/Playwright coverage reviewed; new focused regression tests added.                                                      |
| Docs/tracking           | README Companion wiki link and project tracking reviewed; this report/task/time log updated.                                           |

## Fixes Applied

| File                                              | Fix                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/integration/companion/realGateway.ts`        | `socket_error` now stays in the reconnect path instead of calling `onError` after scheduling reconnect.                              |
| `src/app/endpoint.ts`                             | Added a pure Companion endpoint parser/formatter that accepts `host:port` and local `http://...` URLs, including explicit port `80`. |
| `src/app/SettingsWindow.tsx`                      | Uses the endpoint helper so pasted Companion URLs do not become invalid backend hosts.                                               |
| `src/locales/en.json`                             | Clarified endpoint validation copy.                                                                                                  |
| `src/utils/css.ts`                                | Added a CSS URL escaping helper.                                                                                                     |
| `src/components/ArtworkBackground.tsx`            | Escapes external artwork URLs before placing them in CSS `backgroundImage`.                                                          |
| `src/components/widget/CoverCard.tsx`             | Escapes external cover URLs before placing them in CSS `backgroundImage`.                                                            |
| `src/components/widget/ProgressScrubber.tsx`      | Guards pointer math when the scrubber track has zero width.                                                                          |
| `tests/app/endpoint.test.ts`                      | Added parser/formatter coverage.                                                                                                     |
| `tests/integration/companion/realGateway.test.ts` | Added regression coverage for realtime socket-error handling.                                                                        |

## Verification

| Check                                | Status  | Notes                                                                                    |
| ------------------------------------ | ------- | ---------------------------------------------------------------------------------------- |
| Upstream release/docs review         | Done    | Latest release page showed `v2.0.11`; official wiki confirmed Companion API v1 contract. |
| Static code audit                    | Done    | Performed through GitHub App file reads and commit comparison.                           |
| GitHub status checks                 | Checked | No status checks were reported for the new HEAD at audit time.                           |
| `npm run verify`                     | Not run | No local checkout/toolchain execution was available in this connector-only workflow.     |
| `cargo check -j1`                    | Not run | No local checkout/toolchain execution was available in this connector-only workflow.     |
| `npm run build:desktop`              | Not run | No local checkout/toolchain execution was available in this connector-only workflow.     |
| Live YTMDesktop Companion validation | Not run | Requires a real local YTMDesktop instance and remains tracked by task `0008`.            |

## Remaining Risk

This audit verifies code/docs alignment with official upstream documentation and fixes issues found by static review. At the time it did not prove real-world auth approval, realtime socket updates, command execution, seek behavior, ads, livestreams, or transient restart behavior against a running local YTMDesktop Companion Server. The ordinary live auth/realtime/command/seek paths were later confirmed and task `0008` closed on 2026-07-13; uncommon ads/livestream/restart variants remain future regression coverage.
