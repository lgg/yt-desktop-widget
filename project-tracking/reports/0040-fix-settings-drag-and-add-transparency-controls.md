# 0040 - Fix settings drag and add transparency controls report

## Summary

Made the persistent Settings header initiate native window dragging independently of the scrolled cards and added a localized transparency section immediately before Window / Behavior. Window surface, artwork-derived background, and gradient overlay now have persisted `0–100%` controls, live percentage feedback, and individual reset actions. All three default to `100%`, preserving the existing appearance.

## Done

- Confirmed that `.settings-window__header` is a fixed flex sibling of the only scroll container, so scrolling does not move or replace the visible header.
- Replaced the header anchor's passive drag marker with an explicit primary-mouse `startDragging()` call; the close button remains a separate sibling and never enters the drag handler.
- Added only `core:window:allow-start-dragging`, the least-privilege Tauri capability required for the explicit window API.
- Added `windowSurfaceOpacity`, `artworkBackgroundOpacity`, and `artworkGradientOpacity` to TypeScript defaults/contracts, browser normalization, Rust defaults, serialization, and legacy settings compatibility.
- Added clamped integer normalization for invalid and out-of-range persisted percentages.
- Isolated the base glass surface in a pointer-transparent pseudo-layer, so changing surface opacity does not fade text, artwork controls, or settings controls.
- Applied the three CSS multipliers live and consistently to both the widget and Settings roots.
- Added a dedicated accessible range-control layout with values, descriptions, and individual reset buttons.
- Added matching English and Russian JSON messages.
- Found and fixed a provider integration defect during browser smoke: appearance-only updates were initially discarded because `areSettingsEqual` did not compare the new fields.
- Preserved version `2.0.0`, portable-only packaging, themes, playback behavior, and Companion contracts.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0040-a`                              |
| Started at         | `2026-07-13T23:40:05.7243175+03:00`              |
| Finished at        | `2026-07-14T00:11:51.5559961+03:00`              |
| Time spent minutes | `32`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0040-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                                                   |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| Backend/native       | Updated        | Added three defaulted Rust settings fields and the narrow start-dragging capability.                    |
| Frontend             | Updated        | Explicit Settings header drag, range controls, shared appearance variables, and isolated surface layer. |
| Domain/API contracts | Updated        | Extended persisted `UiSettings`; Companion playback/API contracts are unchanged.                        |
| Tests                | Updated        | Added RED/GREEN component, provider, repository, Rust, and Playwright regressions.                      |
| Documentation        | Updated        | README, task, report, roadmap, and time log synchronized.                                               |
| Build/release/config | Verified       | Tauri capability compiled; portable-only `2.0.0` EXE rebuilt.                                           |
| Bootstrap sync       | Not applicable | No shared process rule changed; sync remains through `0002`.                                            |
| Time tracking        | Updated        | Exact start/finish and rounded-up duration recorded.                                                    |
| Project tracking     | Updated        | Task `0040` completed; roadmap now shows 40 tracked and 34 completed.                                   |

## Changed Files

- `README.md`
- `playwright.config.ts` (EOF normalization only; runtime behavior unchanged)
- `src/app/appearance.ts`
- `src/app/AppProvider.tsx`
- `src/app/defaults.ts`
- `src/app/settingsRepository.ts`
- `src/app/SettingsWindow.tsx`
- `src/app/WidgetWindow.tsx`
- `src/app/windowController.ts`
- `src/domain/playback/types.ts`
- Settings/widget component tests and application/provider tests
- `src/locales/en.json`
- `src/locales/ru.json`
- `src/styles/global.css`
- `src-tauri/capabilities/default.json`
- `src-tauri/src/models.rs`
- `tests/e2e/widget.spec.ts`
- project-tracking task, report, roadmap, and time log

## Verification

| Check                     | Result            | Notes                                                                                                                                      |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend RED              | Passed            | Four Settings/repository cases, one widget-style case, and the provider-only update case failed for the intended missing behavior.         |
| Native RED                | Passed            | Legacy Rust JSON serialized missing appearance fields as `Null`, proving the compatibility test detected the gap.                          |
| Focused GREEN             | Passed            | 27 Settings/repository/widget tests, provider-only update test, and focused Rust legacy test passed.                                       |
| `npm run verify`          | Passed            | Version `2.0.0` synchronized; ESLint passed; 15 files / 70 tests passed; TypeScript and Vite production build passed.                      |
| Playwright smoke          | Passed            | 10/10 scenarios passed; header geometry/hit area stayed stable after scroll and `72/48/35` values persisted through reload/reset.          |
| Rust tests                | Passed            | 19/19 native tests passed.                                                                                                                 |
| `cargo check -j1`         | Passed            | Native application and the new settings/capability integration compiled.                                                                   |
| `npm run build:desktop`   | Passed            | Portable Tauri release built with `--no-bundle`.                                                                                           |
| EXE metadata              | Passed            | `FileVersion=2.0.0`, `ProductVersion=2.0.0`, size `15657984`, SHA-256 `845A0A5EDE26DA0406F6D5D1E5C84CEFE0DF60A54DB6B7E1970B91B4EC032F3D`.  |
| `git diff --check`        | Passed            | No whitespace errors.                                                                                                                      |
| `cargo fmt --check`       | Baseline mismatch | The repository's existing Rust sources use a project-wide two-space style and are not rustfmt-clean; no broad formatting rewrite was made. |
| Documentation/time review | Passed            | README, task, report, roadmap, and time log agree; bootstrap sync is unaffected.                                                           |

## Not Verified

- Browser automation confirms the header remains geometrically fixed, receives pointer hits after scroll, and invokes the explicit helper in component tests. Physical movement of the compiled frameless WebView2 window cannot be automated by the browser suite and remains one short user-side portable smoke check.
- No live YTMDesktop Companion session was repeated because playback/network/auth code did not change; the full simulator, Rust, and portable builds passed.

## Questions Resolved

| Question                                      | Resolution                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why did drag fail only after scrolling?       | The visible header did not move, but it relied only on the passive WebView drag marker. An explicit native start-drag call on the persistent anchor removes dependence on scroll/compositor drag-region state. |
| Should window opacity fade controls and text? | No. It controls the base window surface layer; artwork and gradient are separate, while foreground UI stays legible.                                                                                           |
| What preserves the previous look?             | Every multiplier defaults to `100%`, and the original background, filters, gradients, themes, and shadows remain the source layers.                                                                            |
| How are legacy settings handled?              | Missing fields receive `100%`; invalid primitives fall back; finite out-of-range numbers clamp to `0–100`.                                                                                                     |

## Open Questions

None for implementation. User confirmation of physical Settings-window dragging after scroll is the final runtime observation.

## Residual Risks

- WebView2 physical drag behavior can only be fully confirmed in the portable app, although the explicit Tauri API, least-privilege capability, unit handler, native compilation, and post-scroll hit test are all verified.
- Range movement persists through the existing settings path on each change; rapid changes are protected by request IDs, but they still intentionally create multiple small settings saves.
- Repository-wide `cargo fmt --check` remains a pre-existing style/tool mismatch outside this scoped pass.

## Next Steps

- In the new portable build, scroll Settings down and drag once from the blank/title area of the header; confirm the window moves and the close button still only closes.
- Adjust each transparency control, close/reopen Settings, and confirm the values persist and reset as expected.
