# 0039 - Balance widget vertical spacing and header alignment report

## Summary

Corrected the three vertical-rhythm defects shown in the user's screenshots. The `Live` badge now shares the exact settled center line of the settings/close controls, artwork-only layouts have equal 62px top and bottom breathing room, and progress-only layouts keep the progress row visually centered between the artwork and the lower widget edge. The artwork was measured as already horizontally centered, so its dimensions and placement logic were preserved.

## Done

- Reproduced the supplied artwork-only and progress-only settings combinations in the simulator at the widget's native logical width and minimum-height behavior.
- Measured the pre-fix geometry: `3.70px` header center delta, `20px` artwork top/bottom gap delta, and `10px` progress top/bottom gap delta.
- Changed the widget header from top-edge alignment to vertical center alignment while keeping the Settings header's original top alignment.
- Added an artwork-only layout modifier that compensates for the native `360px` minimum-height clamp and produces equal `62px` top/bottom artwork gaps.
- Added a progress-only footer modifier that moves the progress row into a balanced visual position without changing general footer spacing.
- Preserved the artwork's existing 256px logical dimensions, corner radius, horizontal center, hover action, and all visibility settings.
- Added a condition-based Playwright geometry regression that waits for the 160ms window-action transition before measuring stable button positions.
- Visually inspected fresh artwork-only and progress-only browser renders after the numeric assertions passed.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0039-a`                              |
| Started at         | `2026-07-13T23:11:58+03:00`                      |
| Finished at        | `2026-07-13T23:31:44+03:00`                      |
| Time spent minutes | `20`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0039-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                                       |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| Backend/native       | Not applicable | No Rust, Companion, Tauri command, permission, or settings-schema change.                   |
| Frontend             | Updated        | Added two narrowly scoped layout modifiers and corrected widget-header alignment.           |
| Domain/API contracts | Not applicable | Playback and Companion contracts are unchanged.                                             |
| Tests                | Updated        | Added measured Playwright coverage for header, artwork, progress, and horizontal centering. |
| Documentation        | Updated        | Roadmap, task, report, and time log reconciled. README behavior guidance remains accurate.  |
| Build/release/config | Verified       | Portable-only policy unchanged; Windows release EXE rebuilt.                                |
| Bootstrap sync       | Not applicable | No process rule changed.                                                                    |
| Time tracking        | Updated        | Exact start/finish and rounded-up 20-minute duration recorded.                              |
| Project tracking     | Updated        | Task `0039` completed; roadmap now shows 39 tracked and 33 completed.                       |

## Changed Files

- `src/app/WidgetWindow.tsx`
- `src/styles/global.css`
- `tests/e2e/widget.spec.ts`
- `project-tracking/tasks/0039-balance-widget-vertical-spacing-and-header-alignment.md`
- `project-tracking/reports/0039-balance-widget-vertical-spacing-and-header-alignment.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check                     | Result | Notes                                                                                                                                                   |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused RED               | Passed | New geometry test failed on all three reported relationships: `3.70px`, `20px`, and `10px` deltas.                                                      |
| Focused GREEN             | Passed | Stable header center within 1px; artwork gaps equal at 62px; progress gaps within 2px; artwork horizontal center delta within 1px.                      |
| `npm run verify`          | Passed | Version `2.0.0` synchronized; ESLint passed; 15 files / 64 tests passed; TypeScript and Vite production build passed.                                   |
| `npm run test:e2e`        | Passed | 9/9 Playwright scenarios passed, including compact spacing, hover stability, section hiding, progress timing, localization/theme, and artwork playback. |
| `npm run build:desktop`   | Passed | Tauri Windows release compiled with portable-only `--no-bundle`.                                                                                        |
| EXE metadata              | Passed | `FileVersion=2.0.0`, `ProductVersion=2.0.0`, size `15663616`, SHA-256 `D064B1D930F1973E6423813EF4D3A88CF13659F82E7502270A2051CFE1F97788`.               |
| Focused Prettier          | Passed | All five implementation/test/tracking files checked use the configured style.                                                                           |
| `git diff --check`        | Passed | No whitespace errors.                                                                                                                                   |
| Visual browser QA         | Passed | Fresh artwork-only and progress-only renders were inspected and match the intended balanced composition.                                                |
| Documentation/time review | Passed | Roadmap, task, report, and time-log status and timestamps agree.                                                                                        |

## Not Verified

- The rebuilt executable was not attached to the user's live WebView2/YTMDesktop session in this pass. Browser measurements use the same 336px logical width, native 360px minimum-height rule, and CSS geometry, but final DPI-specific subjective confirmation remains user-side.
- No live Companion smoke was repeated because this pass changes only DOM classes and CSS spacing; the full simulator playback/hover suite and portable release build passed.

## Questions Resolved

| Question                                       | Resolution                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Was the artwork itself off-center?             | No. Its measured horizontal-center delta was `0px`; surrounding vertical whitespace caused the optical impression.      |
| Why was `Live` high relative to the buttons?   | The header aligned differently sized children by their top edges; settled center alignment removes the offset.          |
| Why was artwork-only top-heavy?                | Header/top spacing totaled `62px`, while the native minimum-height clamp left only `42px` below the artwork.            |
| Why did progress sit too close to the artwork? | Progress-only footer spacing was `12px` above versus about `22px` below. Its scoped top margin now balances those gaps. |

## Open Questions

None for implementation. The user can confirm the rebuilt portable layout at their Windows DPI.

## Residual Risks

- Chromium and WebView2 use the same CSS geometry, but subpixel rendering can differ slightly across Windows DPI scales; the test intentionally allows 1-2px tolerance.
- Future changes to the native minimum widget height must preserve or update the artwork-only modifier and geometry test together.

## Next Steps

- User smoke-test the new portable EXE with the three supplied settings combinations.
- No additional roadmap work is required for this spacing correction unless live DPI feedback reveals a device-specific discrepancy.
