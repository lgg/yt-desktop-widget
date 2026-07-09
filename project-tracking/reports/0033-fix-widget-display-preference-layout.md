# 0033 - Fix widget display preference layout report

## Summary

Fixed the remaining connected-widget footer layout regression. `Hide playback controls` and `Hide progress bar` now remove those sections from the compact layout instead of leaving invisible space behind, display-preference changes explicitly resync intrinsic window height, and the progress row now has safer horizontal and bottom spacing.

## Done

- Split footer section rendering from hover visibility in `WidgetWindow`.
- Stopped rendering transport controls when `hidePlaybackControls` is enabled.
- Stopped rendering the progress scrubber and timings when `hideProgressBar` is enabled.
- Removed the footer entirely when both display sections are hidden.
- Added `hidePlaybackControls` and `hideProgressBar` to the auto-height resync dependencies.
- Increased the widget bottom padding and progress-row inset so timing labels stay away from rounded corners.
- Updated settings copy to match the new layout-removal behavior.
- Added RED-GREEN component coverage and browser smoke coverage for hidden sections, compact height, and progress-row spacing.
- Rebuilt the portable executable.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0033-a` |
| Started at | `2026-07-09T17:43:36.7001326+03:00` |
| Finished at | `2026-07-09T18:00:17.0361401+03:00` |
| Time spent minutes | `17` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Verified | No native code change; Tauri release build recompiled successfully. |
| Frontend | Changed | Connected widget footer render conditions and progress row spacing were updated. |
| Domain/API contracts | Not applicable | No Companion API, auth, command, or playback data contract changes. |
| Tests | Changed | Component and Playwright simulator coverage expanded. |
| Documentation | Changed | README and project-tracking files updated. |
| Build/release/config | Verified | Portable-only policy unchanged; release exe rebuilt. |
| Bootstrap sync | Not applicable | No process-rule changes. |
| Time tracking | Changed | Task, report, and time log updated. |
| Project tracking | Changed | Task/report `0033`, roadmap, and related stabilization task notes updated. |

## Changed Files

- `src/app/WidgetWindow.tsx`
- `src/styles/global.css`
- `src/locales/en.json`
- `src/app/WidgetWindow.test.tsx`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/tasks/0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md`
- `project-tracking/tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`
- `project-tracking/tasks/0033-fix-widget-display-preference-layout.md`
- `project-tracking/reports/0033-fix-widget-display-preference-layout.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Component RED/GREEN | Passed | New tests first failed because hidden controls and progress remained in the DOM and settings changes did not resync height; after the fix, `src/app/WidgetWindow.test.tsx` passed `8` tests. |
| Browser smoke | Passed with cleanup caveat | `npm run test:e2e -- --workers=1` reported `ok 1` and `ok 2`; the Windows command wrapper timed out after successful assertions because the child preview process kept the command alive. |
| Frontend verify | Passed | `npm run verify`: ESLint clean, Vitest `10` files / `42` tests passed, TypeScript and Vite production build passed. |
| Native check | Passed | `cargo check -j1` finished successfully through `C:\Users\fgcod\.cargo\bin\cargo.exe`. |
| Portable build | Passed | `npm run build:desktop` rebuilt `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Executable metadata | Passed | Final exe size `15645696`; SHA256 `98285233BAEEC53C41FEB030B7B1144A6563B5087BDAE19778B573D8782C3039`. |
| Release/config review | Passed | No installer, Docker, permissions, or packaging-policy changes. |
| Time tracking | Passed | Task, report, and time log use the same tracked 17-minute interval. |

## Not Verified

- The rebuilt portable executable still needs live visual confirmation in the user's actual Windows/Tauri widget window against YTMDesktop v2.0.11.
- Live Companion command/seek edge cases remain under task `0008`; this task did not change Companion behavior.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why did `Hide playback controls` leave empty height? | The controls component was still rendered and only hidden with opacity/pointer-events. |
| Why did `Hide progress bar` look like it did nothing? | The progress row was always rendered; its base opacity was `0.9`, so hiding only removed the `--visible` class and left the row effectively visible and fully in layout. |
| Should hidden display sections stay mounted for animation? | No. The setting is a layout preference, so hidden sections are unmounted to allow intrinsic height shrink. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the rebuilt Tauri window visually match the user's live monitor/DPI setup? | User | Run the new portable executable and toggle both Hide settings once. |

## Residual Risks

- Browser smoke verifies layout geometry in Chromium, while the live app uses WebView2 and Tauri logical sizing; the portable build is ready for the final live check.
- Controls still reserve height when controls are enabled but not currently hovered, preserving the existing hover-reveal behavior.

## Next Steps

- User runs the rebuilt portable executable and verifies bottom progress spacing plus both Hide toggles in the live widget.
