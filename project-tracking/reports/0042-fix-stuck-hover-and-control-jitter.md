# 0042 - Fix stuck hover and control jitter report

## Summary

The stuck hover and control jitter were traced to two interacting regressions: task `0041` made the complete hover container a native Tauri drag region, so WebView2 non-client hit testing competed with React pointer boundaries when child controls became interactive; hidden settings/close buttons also moved vertically by two pixels when made visible. The widget now has one stable React pointer/focus boundary and delegates explicit native dragging only from non-interactive primary-button targets. Hover state is reset on window blur, recoverable on pointer movement, accessible from keyboard focus, and respects reduced-motion preferences. All frontend, browser, native, dependency, and portable-build checks completed; no additional product-code defects were found in the related settings, localization, theme, version, permissions, or Companion boundaries.

## Done

- Reproduced the baseline with Playwright and computed styles: the layout reported `app-region: drag`; hidden window actions were at `top=10` and visible actions at `top=12`.
- Confirmed ordinary Chromium pointer leave was deterministic, isolating the stuck state to native frameless-window hit testing rather than playback progress or conditional remounting.
- Removed every `data-tauri-drag-region`/`.drag-region` marker from `WidgetWindow` while leaving the independently tested Settings drag region unchanged.
- Replaced direct-layout-only dragging with one delegated primary-button handler that permits blank/header/artwork surfaces and rejects links, buttons, inputs, sliders, editable fields, roles, and `.no-drag` descendants.
- Removed the two-pixel visibility transform from settings/close actions, so opacity and pointer-events change without moving their hit rectangles.
- Unified hover-only controls, window actions, artwork overlay, and the LIVE badge around `interactionActive` (`pointer hover || keyboard focus`).
- Reset interaction state when the native window loses focus and restore pointer state on movement inside the window, preventing a stale stuck-on state.
- Added input-modality tracking so pointer clicks do not pin hover UI after the pointer leaves, while keyboard focus keeps hidden controls accessible.
- Added a global `prefers-reduced-motion: reduce` override for transitions and animations.
- Added RED/GREEN component and E2E regressions for native drag-marker removal, repeated boundary crossings, fixed action geometry, focus, blur, pointer modality, reduced motion, and safe interactive descendants.
- Re-audited settings persistence, three LIVE modes, progress timing, theme/locale behavior, locale parity, version propagation, Tauri permissions, dependency advisories, Rust behavior, and portable output.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-14-0042-a`                              |
| Started at         | `2026-07-14T01:08:40.6070516+03:00`              |
| Finished at        | `2026-07-14T01:44:20.9521561+03:00`              |
| Time spent minutes | `36`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-14-0042-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                                                                          |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Backend/native       | Verified       | No Rust change required; existing `allow-start-dragging` permission and helper remain the explicit window-drag boundary.       |
| Frontend             | Updated        | Stable pointer/focus/blur state, delegated safe dragging, fixed action geometry, and reduced-motion support.                   |
| Domain/API contracts | Verified       | Companion, playback progress, and persisted settings contracts are unchanged and covered by the full regression suite.         |
| Tests                | Updated        | Component and E2E coverage now guards hover cycles, native marker absence, drag exclusions, focus, blur, geometry, and motion. |
| Documentation        | Updated        | README now describes hover-or-focus behavior and the non-interactive draggable badge area.                                     |
| Build/release/config | Verified       | Central version, Tauri permissions, portable-only policy, and release EXE metadata remain consistent at `2.0.0`.               |
| Dependencies         | Verified       | npm is vulnerability-free; Rust audit has no blocking vulnerability and retains 22 documented transitive warnings.             |
| Bootstrap sync       | Not applicable | No process rules changed; bootstrap sync remains through `0002`.                                                               |
| Time tracking        | Updated        | Exact start/finish and rounded-up duration are consistent in task, report, and time log.                                       |
| Project tracking     | Updated        | Task `0042` completed; roadmap has 42 tracked, 36 completed, 0 active, and 6 explicitly deferred tasks.                        |

## Changed Files

- `src/app/WidgetWindow.tsx`
- `src/styles/global.css`
- `src/app/WidgetWindow.test.tsx`
- `tests/e2e/widget.spec.ts`
- `README.md`
- project-tracking task, report, roadmap, and time log

## Verification

| Check                              | Result            | Notes                                                                                                                                                                                            |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component RED                      | Passed            | The new drag regression failed with two remaining native markers; focus/blur regressions also failed before implementation.                                                                      |
| Browser/geometry RED               | Passed            | Baseline layout computed as a drag app-region, hidden/visible action tops differed by two pixels, and reduced-motion/focus expectations failed before the fix.                                   |
| Focused GREEN                      | Passed            | `WidgetWindow.test.tsx`: 22/22; focused drag regression passed after native marker removal and safe delegation.                                                                                  |
| `npm run verify`                   | Passed            | Version `2.0.0` synchronized; ESLint passed; 15 files / 78 tests passed; TypeScript and Vite production build passed.                                                                            |
| Playwright                         | Passed            | 12/12 scenarios passed in 5.1 s, including four repeated enter/leave cycles, fixed geometry, focus, reduced motion, all LIVE modes, progress timing, both themes/locales, Settings, and artwork. |
| `cargo clippy -D warnings`         | Passed            | All targets completed without warnings.                                                                                                                                                          |
| Rust tests                         | Passed            | 20/20 native tests passed, including settings migration, error confidentiality, keyring round-trip, auth, realtime, command, and seek contracts.                                                 |
| `cargo check -j1`                  | Passed            | Native application compiled successfully.                                                                                                                                                        |
| `npm audit --audit-level=moderate` | Passed            | Zero npm vulnerabilities.                                                                                                                                                                        |
| `cargo audit`                      | Passed with notes | Exit code 0; no blocking vulnerabilities, 22 allowed upstream/transitive warnings (GTK3/unmaintained, `glib`/`rand`, and yanked `uds_windows`).                                                  |
| Locale/static audit                | Passed            | EN/RU each contain 146 matching keys; no missing keys, new raw UI copy, widget drag markers, or active TODO/FIXME/HACK/debugger markers.                                                         |
| Permission/version review          | Passed            | Tauri exposes `allow-start-dragging` to `main`/`settings`; package/Cargo/Tauri/UI version chain is synchronized at `2.0.0`.                                                                      |
| Desktop build                      | Passed            | `ytm-desktop-widget.exe`: size `15632896`, File/Product version `2.0.0`, SHA-256 `121409888ED625239A81E8D261613E7765016695AFD25D7690E9D7300F3F3571`.                                             |
| Changed-file Prettier/diff check   | Passed            | All changed frontend/docs files match Prettier; `git diff --check` has no whitespace errors.                                                                                                     |
| Repository `format:check`          | Baseline mismatch | Pre-existing CRLF/style mismatch affects 150 historical files; no unrelated repository-wide rewrite was made.                                                                                    |
| `cargo fmt --check`                | Baseline mismatch | Existing Rust sources use repository-wide two-space formatting and are not rustfmt-clean; no Rust source changed in this pass.                                                                   |
| Documentation/time review          | Passed            | README, task, report, roadmap, and time log agree; bootstrap sync is unaffected.                                                                                                                 |

## Not Verified

- Browser automation and component tests prove the pointer lifecycle, hit geometry, explicit helper call, and interactive exclusions, but physical movement and hover behavior of the compiled frameless WebView2 window still require one short user-side portable smoke check.
- Live YTMDesktop Companion auth/playback was not repeated because no Companion, token, realtime, command, mapping, or progress code changed; all existing simulator/native contract regressions passed.

## Questions Resolved

| Question                                             | Resolution                                                                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Was playback progress causing repeated redraws?      | No. Controls remain mounted and geometry stays fixed across visibility/progress updates; the visible jerk was the action transform plus native hit-testing transition. |
| Why could hover remain stuck in the portable window? | The hover owner was also a native drag app-region, so WebView2 switched between client/non-client hit testing as interactive descendants appeared.                     |
| How is broad dragging preserved without app-regions? | One explicit handler starts native dragging from primary-button non-interactive descendants and rejects every interactive target/ancestor.                             |
| How do keyboard users reach opacity-hidden controls? | A keyboard-focus state reveals the same UI; focus leaving or window blur clears it, while pointer focus alone does not pin it after pointer leave.                     |
| Does the fix change settings or Companion contracts? | No. Stored preferences, three LIVE modes, themes, locales, versioning, permissions, and Companion contracts remain unchanged and verified.                             |

## Open Questions

None for implementation. User confirmation in the fresh portable executable is the final native runtime observation.

## Residual Risks

- WebView2 frameless-window movement cannot be fully automated by browser Playwright, though the native permission/helper path is unit-tested and the release executable builds successfully.
- `cargo audit` retains 22 allowed upstream/transitive warnings; removing them requires Tauri/platform/dependency modernization outside this scoped UI fix.
- Full-repository Prettier and rustfmt checks remain pre-existing baseline mismatches; all files changed in this pass are Prettier-clean.
- On this Windows runner, Playwright's child `webServer` orchestration stalled despite the preview returning HTTP 200; the final 12/12 run used the same built preview started separately, and the committed Playwright configuration was restored unchanged.

## Next Steps

- Smoke the new portable executable by moving the pointer rapidly in/out several times and confirming controls/LIVE reliably hide again without movement.
- Drag once from the artwork and blank lower/header areas, then confirm the artwork playback button, progress slider, settings button, and close button remain interactive and do not move the window.
