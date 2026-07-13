# 0035 - Fix hover controls, playback progress, and connection badge visibility report

## Summary

Fixed all four reported regressions: the hover-only setting can now be switched off and persists, playback controls no longer resize or jitter the widget on hover, Companion progress uses elapsed seconds instead of treating the value as a percentage, and the connection-status badge has its own optional hide-until-hover setting with stable reserved space.

## Done

- Added the missing native settings fields with backward-compatible defaults so explicit `false` values survive save/load round trips.
- Made the decorative toggle visual ignore pointer events, allowing the real checkbox to receive mouse clicks.
- Kept enabled transport controls mounted in a stable footer row and switched hover behavior to opacity/interactivity only.
- Added `Hide connection status until hover`, defaulting to off, with persisted cross-window settings behavior.
- Corrected the Companion mapping boundary: `player.videoProgress` is elapsed seconds and `durationSeconds` is total seconds.
- Added finite-value and duration clamps so invalid or oversized elapsed values cannot pin the scrubber beyond the track end.
- Updated the simulator to advance elapsed playback by one second per wall-clock second and to seek in seconds.
- Added RED/GREEN Rust, domain, component, provider, simulator, and Playwright regressions.
- Updated README, roadmap, related stabilization/live-validation tasks, and the superseded task `0034` documentation.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-13-0035-a` |
| Started at | `2026-07-13T19:32:38+03:00` |
| Finished at | `2026-07-13T19:57:47+03:00` |
| Time spent minutes | `26` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Added persisted hover-controls and connection-badge fields plus serde defaults and a round-trip test. |
| Frontend | Changed | Fixed real toggle hit-testing, stable controls/badge visibility, settings UI, copy, and accessibility state. |
| Domain/API contracts | Changed | Corrected `videoProgress` from percent to elapsed seconds and clamped timing values. |
| Tests | Changed | Added/updated Rust, Vitest, and six Playwright smoke scenarios. |
| Documentation | Changed | README now records stable hover geometry and the upstream timing unit. |
| Build/release/config | Verified | Portable-only policy and Tauri permissions are unchanged; release exe rebuilt. |
| Bootstrap sync | Not applicable | No shared process rule changed. |
| Time tracking | Changed | Task, report, and time log use iteration `2026-07-13-0035-a`. |
| Project tracking | Changed | Roadmap snapshot, task `0035`, and related task/report history are synchronized. |

## Changed Files

- `src-tauri/src/models.rs`
- `src/app/AppProvider.tsx`
- `src/app/SettingsWindow.tsx`
- `src/app/WidgetWindow.tsx`
- `src/app/WidgetWindow.test.tsx`
- `src/app/defaults.ts`
- `src/components/widget/TransportControls.tsx`
- `src/domain/playback/controller.test.ts`
- `src/domain/playback/mapping.ts`
- `src/domain/playback/mapping.test.ts`
- `src/domain/playback/types.ts`
- `src/integration/simulator/simulatorGateway.ts`
- `src/integration/simulator/simulatorGateway.test.ts`
- `src/locales/en.json`
- `src/styles/global.css`
- `tests/app/AppProvider.test.tsx`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`
- `project-tracking/tasks/0034-fix-playback-controls-hover-mode.md`
- `project-tracking/reports/0034-fix-playback-controls-hover-mode.md`
- `project-tracking/tasks/0035-fix-hover-progress-and-connection-badge.md`
- `project-tracking/reports/0035-fix-hover-progress-and-connection-badge.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Root-cause evidence | Passed | Rust schema omitted the hover field; toggle decoration intercepted clicks; hover drove native resize; upstream YTMDesktop v2.0.11 source proves `videoProgress` is elapsed seconds. |
| Focused RED/GREEN | Passed | New mapping, widget, simulator, native settings, and E2E assertions failed on the old behavior and passed after the fixes. |
| Frontend verify | Passed | `npm run verify`: ESLint clean, Vitest 10 files / 47 tests passed, TypeScript and Vite production build passed. |
| Browser smoke | Passed | `npm run test:e2e`: 6/6 scenarios passed, including persisted settings clicks, stable hover height, badge visibility, and wall-clock progress. |
| Native tests | Passed | `cargo test --quiet -j1`: 16/16 tests passed. |
| Native static check | Passed | `cargo check -j1` completed successfully. |
| Portable build | Passed | `npm run build:desktop` rebuilt `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Executable metadata | Passed | Size `15644160`; SHA-256 `7E0EF42789A87761354D9A954148542000CE33FE9C4B6A809DAD45ADD5B83118`; built `2026-07-13T19:57:35+03:00`. |
| Browser manual QA | Passed | Settings labels/state, real checkbox clicks, badge/control classes, and stable `500px` preview height were inspected interactively. |
| Formatting | Baseline limitation | Repository-wide `npm run format:check` still reports 133 pre-existing files; no bulk formatting was performed. `cargo fmt --check` is unavailable because the rustfmt component is not installed. |
| Docs/config review | Passed | README and tracking agree; portable-only packaging, permissions, credentials, and bootstrap rules are unchanged. |
| Time tracking | Passed | Task, report, and time log use the same tracked 26-minute interval. |

## Not Verified

- The rebuilt portable executable was not attached to the user's live YTMDesktop/WebView2 session during this pass, so real-track timing, DPI-specific pointer boundaries, and subjective feel still need the user's confirmation.
- Previous/play-pause/next and live seek against the new portable build remain tracked by task `0008`.
- Ads and livestream timing shapes remain part of live Companion edge-case validation.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why could the hover-only setting not be switched off? | The Rust settings schema dropped the field, defaults restored `true`, and the decorative switch also intercepted mouse clicks. Both paths are fixed and covered. |
| Should hover-hidden controls resize the widget? | No. Live feedback proved the resize feedback loop is unstable; the row now remains reserved. |
| What caused progress to run about 2-4x too fast? | Companion sent elapsed seconds, but the mapper divided the value by 100 as though it were a percentage of the track. |
| How should the connection badge hide? | A separate opt-in preference fades it until widget hover while preserving its footprint; default remains visible. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the rebuilt portable executable behave correctly with live YTMDesktop tracks and the user's DPI/pointer movement? | User | Run the new exe and confirm progress rate, toggle persistence, and hover feel. |

## Residual Risks

- Browser/Chromium coverage cannot completely prove native WebView2 pointer behavior at every Windows scale factor.
- Live Companion ads or livestreams may expose timing payload variants not represented by the simulator; values are now finite/clamped, but those modes still need observation.
- Repository-wide formatting debt remains outside this scoped fix.

## Next Steps

- User smoke-test the rebuilt portable executable against several normal tracks, including one longer than 100 seconds.
- Continue open live command/seek coverage in task `0008` and the broader portable smoke pass in task `0012`.
