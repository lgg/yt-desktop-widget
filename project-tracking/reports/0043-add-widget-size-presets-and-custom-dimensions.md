# 0043 - Add widget size presets and custom dimensions report

## Summary

The widget now supports Compact (85%), unchanged Default (100%), Large (125%), and Custom (75%-150%) size modes from a separate Settings block. Custom width and height are linked through the canonical `336 x 438` proportion: editing either dimension recalculates the other. The complete widget content and its state-dependent native window height use one uniform scale, so artwork, typography, controls, spacing, progress UI, hit targets, background, and window bounds remain proportional instead of leaving fixed-size child elements inside a larger surface.

Legacy settings migrate to Default at 100%. The Settings window is unaffected, free border resizing remains disabled, and TypeScript plus Rust independently normalize and clamp persisted/native values. Component, repository, full frontend, native, security/dependency, browser geometry, and release-link checks passed. A newly rebuilt portable executable still needs a short physical Windows smoke check after the currently running old executable is closed.

## Done

- Added the `WidgetSizeMode` settings contract and persisted `customWidgetScalePercentage` in frontend and native models.
- Added one canonical sizing module for preset scales, safe custom bounds, linked width/height conversion, base intrinsic-height bounds, and native window dimensions.
- Added a localized, keyboard-accessible Widget Size Settings section with Compact, Default, Large, and Custom controls.
- Made both Custom dimensions editable while storing one canonical percentage; values save on blur or Enter to avoid racing disk writes during typing.
- Preserved the existing Default rendering path at scale `1` without a transform.
- Measured state-dependent content at the canonical width and applied the selected uniform scale to the complete content layer and native window.
- Replaced the height-only Tauri command with a width-and-height command, scoped its permission, and added defense-in-depth finite-value validation and clamping in Rust.
- Expanded Tauri main-window min/max bounds while keeping `resizable: false` and portable-only packaging policy unchanged.
- Added English and Russian locale strings and retained locale parity/no-literal-copy coverage.
- Added RED/GREEN calculation, persistence, component, E2E geometry, and Rust migration/bounds tests.
- Updated README, architecture notes, historical decisions, roadmap, parent task `0006`, decision `0004`, task/report, and time log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0043-a` |
| Started at | `2026-07-14T02:06:04.2429391+03:00` |
| Finished at | `2026-07-14T02:56:22.7783024+03:00` |
| Time spent minutes | `51` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-14-0043-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Updated | Persisted size settings, safe native width/height sizing command, tests, permission, and window bounds. |
| Frontend | Updated | Separate Settings controls and uniform full-widget scaling with unchanged Default mode. |
| Domain/API contracts | Updated | `UiSettings`, bridge payload, repository normalization, and cross-window equality include the new size fields. |
| Tests | Updated | New calculation, persistence, component, browser geometry/persistence, and Rust coverage. |
| Documentation | Updated | README, architecture, historical decision note, ADR, roadmap, parent/child task, report, and time log. |
| Build/release/config | Updated | Safe main-window bounds expanded; free resize stays disabled and portable-only policy stays unchanged. |
| Security/dependencies | Verified | Inputs are clamped in TypeScript and Rust; no network, file, shell, token, or broader permission surface was introduced; npm audit is clean. |
| Bootstrap sync | Not applicable | No shared process rule changed; `bootstrap-sync.md` remains current. |
| Time tracking | Updated | Exact timestamps and rounded-up duration agree across task, report, and time log. |
| Project tracking | Updated | Task `0043` and migrated parent `0006` completed; roadmap now has 43 tasks, 38 completed, 0 active, and 5 deferred. |

## Changed Files

- `src/app/widgetSize.ts`, `src/app/widgetSize.test.ts`
- `src/app/SettingsWindow.tsx`, `src/app/SettingsWindow.test.tsx`
- `src/app/WidgetWindow.tsx`, `src/app/WidgetWindow.test.tsx`
- `src/app/AppProvider.tsx`, `src/app/defaults.ts`, `src/app/settingsRepository.ts`, `src/app/settingsRepository.test.ts`, `src/app/windowController.ts`
- `src/domain/playback/types.ts`, `src/integration/companion/tauriBridge.ts`
- `src/locales/en.json`, `src/locales/ru.json`, `src/styles/global.css`
- `tests/app/AppProvider.test.tsx`, `tests/e2e/widget.spec.ts`
- `src-tauri/src/lib.rs`, `src-tauri/src/models.rs`, `src-tauri/permissions/default.toml`, `src-tauri/tauri.conf.json`
- `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- project-tracking task, report, decision, roadmap, and time log files for `0006`/`0043`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Targeted frontend RED | Passed | New sizing tests initially failed because the size module, settings fields/UI, and native width contract did not yet exist. |
| Targeted Rust RED | Passed | The new bounds test initially failed because `clamp_main_window_size` did not yet exist. |
| Targeted frontend GREEN | Passed | 42/42 calculation, repository, Settings, and Widget component tests passed. |
| `npm run verify` | Passed | Version `2.0.0` synchronized; ESLint passed; 16 files / 86 tests passed; TypeScript and Vite production build passed. |
| Playwright full suite | Assertions passed with cleanup caveat | 13/13 scenarios printed `ok`, including proportional child geometry and Custom persistence; the wrapper timed out only because the preview child process remained alive after completion, matching the documented local orchestration caveat. |
| Focused sizing E2E | Assertions passed with cleanup caveat | The final proportional-scaling scenario printed `ok` in 585 ms; the same preview cleanup issue kept the wrapper alive. |
| Rust tests | Passed | 23/23 native tests passed, including legacy defaults, Custom persistence, invalid-value clamping, and native bounds. |
| `cargo check -j1` | Passed | Native debug compilation succeeded. |
| `npm audit` | Passed | Zero npm vulnerabilities. |
| Security/permission review | Passed | The new command accepts numeric width/height only, validates finite values, clamps both dimensions, and is the only added Tauri permission. |
| `cargo rustc --release -j1 --bin ytm-desktop-widget -- -C extra-filename=-verify0043` | Passed | Release code linked successfully to `src-tauri/target/release/deps/ytm_desktop_widget-verify0043.exe` (15,437,312 bytes). |
| `npm run build:desktop` | Frontend passed; standard output locked | Vite completed; Windows could not replace `src-tauri/target/release/ytm-desktop-widget.exe` because the currently running widget process (PID 29012 during verification) held it open. The alternate release-link check above isolates this as an output-file lock, not a compile/link defect. |
| `cargo fmt --check` | Baseline mismatch | Existing Rust sources use repository-wide two-space formatting and are not rustfmt-clean; no unrelated mass-format rewrite was made. |
| Documentation/time review | Passed | README, architecture, decision, roadmap, tasks, report, and time log agree; bootstrap sync is unaffected. |

## Not Verified

- Physical resizing/interaction in a freshly rebuilt frameless WebView2 portable executable was not observed in this pass because the user's currently running widget locked the standard release output.
- Live YTMDesktop Companion auth/playback was not repeated because this pass does not change Companion endpoints, tokens, realtime events, commands, progress mapping, or playback state.
- Playwright completed every assertion but did not exit cleanly on this Windows runner because its preview child process remained alive.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Should built-in modes remain? | Yes: Compact 85%, unchanged Default 100%, and Large 125%, plus Custom. |
| Can Custom width and height distort the widget independently? | No. Editing either dimension recalculates the other from `336 x 438`; one canonical percentage is persisted. |
| What scales? | The complete widget content layer and native window use the same factor, including dynamic intrinsic height. |
| Does this enable free border resize? | No. The Settings controls provide deliberate proportional sizing while the frameless window remains `resizable: false`. |
| Does Default change the approved current layout? | No. Missing/legacy settings normalize to Default and the scale-1 path keeps the prior canonical rendering without a transform. |

## Open Questions

None for implementation.

## Residual Risks

- CSS-transformed WebView2 hit testing is covered by browser geometry and component interaction tests, but one short physical Windows smoke pass is still the strongest confirmation for native pointer behavior at the minimum and maximum sizes.
- Custom values are intentionally rounded to whole pixels/percent-compatible geometry; tiny input differences can normalize to the nearest representable proportional size.
- Full-repository rustfmt remains a pre-existing baseline mismatch outside this scoped change.

## Next Steps

- Close the currently running widget, rebuild the portable executable, then smoke Compact, Default, Large, Custom minimum/maximum, artwork play/pause, progress seeking, dragging, Settings, and close controls.
- Continue with the remaining deferred roadmap items only when explicitly prioritized: macOS, installer packaging, visual/alternate-window refinement, and richer runtime diagnostics.
