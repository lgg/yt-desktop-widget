# 0032 - Fix widget layout and playback stability report

## Summary

Fixed the oversized main window, removed the redundant paused playback card, and reduced realtime playback render churn without changing the official Companion API command contract.

The height bug measured containers whose CSS height was the current viewport height, so an expanded Tauri window could grow but never shrink. The playback controller also published every full YTMDesktop `state-update`, including progress updates already represented by the local smooth clock. In addition, the height mutation observer reacted to progress-bar style changes every animation frame.

## Done

- Measured only the intrinsic widget layout height, allowing the Tauri window to shrink after transient content disappears.
- Removed the paused state card while preserving the play button state.
- Preserved one documented `playPause`, `previous`, or `next` command per activation.
- Suppressed progress-only realtime snapshots that match the local playback clock.
- Kept track, metadata, playback-state, ad/live, and significant seek corrections immediate.
- Stopped auto-height mutation observation from reacting to progress-bar style attributes.
- Added component/controller RED-GREEN regression coverage.
- Expanded Playwright smoke coverage for compact playing/paused layouts and transport controls.
- Fixed the stale E2E expectation for the Settings heading.
- Recorded the user's successful live auth, durable reconnect, and realtime confirmation from task `0031`.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0032-a` |
| Started at | `2026-07-09T16:01:47.0225655+03:00` |
| Finished at | `2026-07-09T16:30:39.3959097+03:00` |
| Time spent minutes | `29` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Reviewed | Tauri resize command and official v2.0.11 command payloads were audited; no native code change was required. |
| Frontend | Changed | Intrinsic auto-height and paused connected layout were corrected. |
| Domain/API contracts | Changed | Playback publication now filters clock-equivalent progress snapshots; Companion wire commands are unchanged. |
| Tests | Changed | Component, controller, and Playwright regression coverage expanded. |
| Documentation | Changed | README live-validation status and related tracking files updated. |
| Build/release/config | Verified | Portable-only release policy unchanged; final executable rebuilt. |
| Bootstrap sync | Not applicable | No process-rule changes. |
| Time tracking | Changed | Task, report, and time log updated. |
| Project tracking | Changed | Task/report `0032` and related open stabilization tasks updated. |

## Changed Files

- `src/app/WidgetWindow.tsx`
- `src/app/WidgetWindow.test.tsx`
- `src/domain/playback/controller.ts`
- `src/domain/playback/controller.test.ts`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/tasks/0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md`
- `project-tracking/tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`
- `project-tracking/tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`
- `project-tracking/tasks/0032-fix-widget-layout-and-playback-stability.md`
- `project-tracking/reports/0031-fix-companion-auth-persistence.md`
- `project-tracking/reports/0032-fix-widget-layout-and-playback-stability.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Height RED/GREEN | Passed | Old implementation requested `702px`; fixed implementation requests intrinsic `440px` in the regression fixture. |
| Paused-card RED/GREEN | Passed | Old component rendered the card; fixed component keeps only the compact track and controls. |
| Realtime churn RED/GREEN | Passed | Clock-equivalent progress no longer publishes; pause and significant seek still publish immediately. |
| Frontend verify | Passed | `npm run verify`: lint, 39 tests, TypeScript, and Vite production build passed. |
| Rust tests | Passed | `cargo test --quiet -j1`: 15 passed. |
| Native check | Passed | `cargo check -j1` completed successfully. |
| Browser visual QA | Passed | Playing and paused intrinsic layout both measured `490px`; no paused card or overlap; controls were enabled. |
| Transport browser QA | Passed | Pause switched to Play, Next selected `Soft Signal`, Previous returned `Night Train Window`. |
| Playwright smoke | Passed with cleanup caveat | Scenario passed in 684ms; the Windows command wrapper retained the child preview process until the outer timeout. |
| Portable build | Passed | `src-tauri/target/release/ytm-desktop-widget.exe` rebuilt successfully. |
| Diff review | Passed | `git diff --check` passed; scope was reviewed against the task. |
| Time tracking | Passed | Task, report, and time log use the same tracked 29-minute interval. |

## Not Verified

- The rebuilt portable executable still needs user confirmation for actual Tauri window shrink and live previous/play-pause/next commands against YTMDesktop v2.0.11.
- Live seek, ads, livestreams, and transient Companion restart behavior remain under task `0008`.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why could the window grow but not shrink? | The measurement included `height: 100%` viewport containers, so the current window height became a lower bound. |
| Why did the UI appear to refresh constantly? | YTMDesktop emits a full state for each player-store change, the controller published each one, and the height observer also reacted to progress style attributes. |
| Were transport command names wrong? | No. The implementation matches YTMDesktop v2.0.11 source and sends one official command per activation. |
| Should play/pause be optimistic? | No. YTMDesktop remains authoritative; meaningful realtime state changes are applied immediately. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the portable Tauri window now shrink to the intrinsic compact height? | User | Run the new executable and observe playing plus paused states. |
| Do all three live transport commands respond normally after churn filtering? | User | Test previous, play/pause, and next once each against YTMDesktop v2.0.11. |

## Residual Risks

- Browser layout and unit coverage cannot fully emulate Windows WebView2 logical/physical DPI conversion; the Tauri command still clamps to configured min/max bounds.
- Progress corrections below `0.75s` are intentionally handled by the local smooth clock; larger drift and seeks remain server-authoritative.
- The Playwright web-server child cleanup issue is specific to this Windows command environment and does not invalidate the passed browser assertions.

## Next Steps

- Run the rebuilt portable executable against the existing authorized YTMDesktop v2.0.11 instance.
- Record live command/seek results under task `0008`.
