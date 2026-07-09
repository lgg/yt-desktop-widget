# 0034 - Fix playback controls hover mode report

## Summary

Added a separate playback-controls hover mode and removed transform-based transport-control motion that made the buttons appear to jitter. Enabled controls can now either stay mounted all the time or mount only while the widget is hovered; hover-hidden controls are absent from layout so the widget can shrink.

## Done

- Added `showPlaybackControlsOnHover` to persisted UI settings with default `true` for backward-compatible behavior.
- Updated settings equality and defaults so cross-window settings sync notices the new field.
- Added a settings toggle: `Show playback controls only on hover`.
- Kept `Hide playback controls` as the stronger mode that removes controls entirely.
- Changed `WidgetWindow` so hover-only controls mount only while hovered and unmount on pointer leave.
- Added hover/render state to auto-height sync dependencies.
- Removed `visible` from `TransportControls`; rendered controls are directly visible and interactive.
- Removed transform/translate animations from the transport row and transport button hover/active states.
- Kept hover feedback through background and border changes.
- Added component and browser regression coverage for hidden, hover-only, and always-visible controls.
- Rebuilt the portable executable.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-09-0034-a` |
| Started at | `2026-07-09T22:15:39.6297837+03:00` |
| Finished at | `2026-07-09T22:34:55.6234565+03:00` |
| Time spent minutes | `20` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Verified | No native code changes; Tauri release build passed. |
| Frontend | Changed | Widget render conditions, Settings UI, transport-control component, and CSS motion changed. |
| Domain/API contracts | Changed | Settings type gained `showPlaybackControlsOnHover`; Companion API unchanged. |
| Tests | Changed | Component and Playwright simulator coverage expanded. |
| Documentation | Changed | README, roadmap, task, report, and time log updated. |
| Build/release/config | Verified | Portable-only policy unchanged; release exe rebuilt. |
| Bootstrap sync | Not applicable | No process-rule changes. |
| Time tracking | Changed | Task, report, and time log updated. |
| Project tracking | Changed | Task/report `0034`, roadmap, and smoke task notes updated. |

## Changed Files

- `src/domain/playback/types.ts`
- `src/app/defaults.ts`
- `src/app/AppProvider.tsx`
- `src/app/SettingsWindow.tsx`
- `src/app/WidgetWindow.tsx`
- `src/components/widget/TransportControls.tsx`
- `src/styles/global.css`
- `src/locales/en.json`
- `src/app/WidgetWindow.test.tsx`
- `tests/app/AppProvider.test.tsx`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`
- `project-tracking/tasks/0034-fix-playback-controls-hover-mode.md`
- `project-tracking/reports/0034-fix-playback-controls-hover-mode.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Component RED/GREEN | Passed | New tests first failed because controls stayed mounted outside hover and height did not resync; after the fix `WidgetWindow.test.tsx` passed `11` tests. |
| Browser smoke | Passed with cleanup caveat | `npm run test:e2e -- --workers=1` reported `ok 1` through `ok 4`; the Windows wrapper timed out after successful assertions because the child preview process kept running. |
| Frontend verify | Passed | `npm run verify`: ESLint clean, Vitest `10` files / `45` tests passed, TypeScript and Vite production build passed. |
| Native check | Passed | `cargo check -j1` finished successfully through `C:\Users\fgcod\.cargo\bin\cargo.exe`. |
| Portable build | Passed | `npm run build:desktop` rebuilt `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Executable metadata | Passed | Final exe size `15645696`; SHA256 `B5BB538FCD2EC0AD36B26DBCF4F4D2FB72067F47BA5CF6AB654E6C5A67BB5F37`. |
| Release/config review | Passed | No installer, Docker, permissions, or packaging-policy changes. |
| Time tracking | Passed | Task, report, and time log use the same tracked 20-minute interval. |

## Not Verified

- Live WebView2/Tauri visual behavior on the user's monitor/DPI still needs user confirmation in the rebuilt portable executable.
- This task did not change live Companion commands, auth, seek, ads, or livestream behavior.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Should hover-only visibility be separate from hiding controls entirely? | Yes. `hidePlaybackControls` removes controls entirely; `showPlaybackControlsOnHover` controls hover-only mounting when controls are enabled. |
| Should hover-hidden controls reserve height? | No. Hover-hidden controls unmount, so intrinsic auto-height can shrink the widget. |
| What caused the jitter impression? | The previous implementation combined parent-row translate transitions with per-button transform hover/active transitions. Transport controls now avoid transform motion. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Does the new hover-only/always-visible behavior feel right in the live Tauri widget? | User | Run the rebuilt portable executable and toggle `Show playback controls only on hover`. |

## Residual Risks

- Browser smoke validates Chromium behavior; WebView2/Tauri should match, but live DPI/window-boundary pointer leave still needs user confirmation.
- Existing settings JSON receives the new setting through defaults merge; no migration file is needed.

## Next Steps

- Create the PR for branch `codex/0034-fix-playback-controls-hover-mode`, merge to `master`, and push `master`.
