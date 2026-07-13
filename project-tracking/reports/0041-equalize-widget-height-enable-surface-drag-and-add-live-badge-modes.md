# 0041 - Equalize widget height, enable surface drag, and add LIVE badge modes report

## Summary

Equalized the compact widget envelope with and without the progress row, made the blank lower widget surface initiate native dragging, and replaced the ambiguous LIVE badge boolean with accessible `Always`, `On hover`, and `Hidden` modes. Legacy browser and native settings migrate without losing hover-only behavior. A repository-wide frontend/native/localization/theme/version/security/dependency audit found and fixed stale equality propagation, test type escapes, three patchable RustSec findings, and inaccurate historical settings-write wording. All frontend, E2E, Rust, and portable desktop checks pass.

## Done

- Reproduced the reported geometry in Playwright: artwork-only requested `380` CSS px while progress-only requested `375` CSS px.
- Added a compact progress-only spacing rule that distributes the missing five pixels evenly above and below the progress footer, preserving the taller balanced artwork-only envelope.
- Marked the whole non-interactive layout surface as a native drag region and added explicit primary-button dragging for direct blank-surface hits.
- Kept buttons, the optional artwork playback control, progress slider, links, and all other interactive descendants as no-drag targets.
- Replaced `hideConnectionBadge` with typed `connectionBadgeVisibility: 'always' | 'hover' | 'hidden'` across TypeScript, React, browser storage, Rust serialization, and provider equality.
- Migrated legacy `false` to `always` and legacy `true` to `hover`; invalid explicit values safely fall back to `always`.
- Kept the invisible header anchor and stable geometry in hidden mode while removing the actual badge from rendering even on hover.
- Added an accessible three-button segmented control and matching English/Russian JSON messages.
- Added RED/GREEN component, repository, provider, E2E geometry/interaction, and Rust migration regressions.
- Rechecked locale parity/static UI copy, explicit light theme, centralized `2.0.0` propagation, Tauri permissions, portable-only configuration, keyring usage, Companion boundaries, and build metadata.
- Removed temporary `unknown` test casts so the new settings contract is statically checked.
- Corrected task `0038`/roadmap wording from transactional write to the implemented disk-first/cache-safe settings behavior.
- Updated compatible vulnerable transitive patches in `Cargo.lock`: `anyhow 1.0.102 -> 1.0.103`, `rand 0.8.5 -> 0.8.6`, and `rand 0.9.2 -> 0.9.3`.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-14-0041-a`                              |
| Started at         | `2026-07-14T00:22:58.2728382+03:00`              |
| Finished at        | `2026-07-14T00:58:58.2820189+03:00`              |
| Time spent minutes | `37`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-14-0041-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                                                           |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Updated        | Added explicit badge-mode serialization/defaults and backward-compatible boolean deserialization.               |
| Frontend             | Updated        | Stable compact height, lower-surface drag handling, three badge visibility modes, accessible Settings control.  |
| Domain/API contracts | Updated        | Replaced one persisted UI boolean with a typed three-value enum; Companion protocol contracts remain unchanged. |
| Tests                | Updated        | Added component, repository, provider, Rust, and E2E migration/geometry/interaction regressions.                |
| Documentation        | Updated        | README, task, report, roadmap, time log, and one historical wording mismatch synchronized.                      |
| Build/release/config | Verified       | Portable-only `2.0.0` release rebuilt; permissions and central version sources unchanged and consistent.        |
| Dependencies         | Updated        | Applied three compatible Rust security patch releases; npm audit remains clean.                                 |
| Bootstrap sync       | Not applicable | No process rule changed; bootstrap sync remains through `0002`.                                                 |
| Time tracking        | Updated        | Exact start/finish and rounded-up duration recorded consistently.                                               |
| Project tracking     | Updated        | Task `0041` completed; roadmap now has 41 tracked, 35 completed, 0 active, and 6 explicitly deferred tasks.     |

## Changed Files

- `README.md`
- `src/domain/playback/types.ts`
- `src/app/defaults.ts`
- `src/app/settingsRepository.ts`
- `src/app/AppProvider.tsx`
- `src/app/SettingsWindow.tsx`
- `src/app/WidgetWindow.tsx`
- `src/styles/global.css`
- `src/locales/en.json`
- `src/locales/ru.json`
- related frontend/provider/repository tests under `src/` and `tests/`
- `src-tauri/src/models.rs`
- `src-tauri/Cargo.lock`
- `tests/e2e/widget.spec.ts`
- project-tracking task, report, roadmap, and time log

## Verification

| Check                              | Result            | Notes                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend RED                       | Passed            | Seven focused failures proved the missing enum/migration, hover/hidden render modes, lower drag surface, segmented control, and provider propagation.                                                                                  |
| Native RED                         | Passed            | Legacy `hideConnectionBadge: true` serialized without the required explicit `hover` value before implementation.                                                                                                                       |
| Geometry RED                       | Passed            | Playwright measured `380` versus `375` CSS px and found no lower-surface drag marker.                                                                                                                                                  |
| Focused GREEN                      | Passed            | 34 focused frontend tests, focused Rust migration test, and focused geometry E2E passed.                                                                                                                                               |
| `npm run verify`                   | Passed            | Version `2.0.0` synchronized; ESLint passed; 15 files / 75 tests passed; TypeScript and Vite production build passed.                                                                                                                  |
| Playwright                         | Passed            | 10/10 scenarios passed, including equal compact heights, lower drag hit area, all badge modes, progress timing, light theme, localization, fixed Settings header, and artwork playback.                                                |
| `cargo clippy -D warnings`         | Passed            | All targets passed with no warnings after implementation and again after dependency patch updates.                                                                                                                                     |
| Rust tests                         | Passed            | 20/20 native tests passed after the lockfile updates, including legacy migration and Windows keyring round-trip coverage.                                                                                                              |
| `cargo check -j1`                  | Passed            | Native application compiled successfully.                                                                                                                                                                                              |
| `npm audit --audit-level=moderate` | Passed            | Zero npm vulnerabilities.                                                                                                                                                                                                              |
| `cargo audit`                      | Passed with notes | No blocking vulnerabilities; compatible `anyhow`/`rand` fixes applied. Twenty-two allowed transitive warnings remain (primarily non-Windows GTK3/unmaintained parser graph, old `rand 0.7`, and yanked target-specific `uds_windows`). |
| `npm run build:desktop`            | Passed            | Tauri portable release built with `--no-bundle`.                                                                                                                                                                                       |
| EXE metadata                       | Passed            | `FileVersion=2.0.0`, `ProductVersion=2.0.0`, size `15629312`, SHA-256 `C0A55F02338BA8B414E17EEF783840FE6DC5E1C16F8270B240F035A3DC486A83`.                                                                                              |
| Prettier / `git diff --check`      | Passed            | All changed frontend/docs files match Prettier; no whitespace errors.                                                                                                                                                                  |
| `cargo fmt --check`                | Baseline mismatch | Existing Rust sources intentionally use repository-wide two-space formatting and are not rustfmt-clean; no unrelated whole-native-tree rewrite was made.                                                                               |
| Documentation/time review          | Passed            | README, task, report, roadmap, and time log agree; bootstrap sync is unaffected.                                                                                                                                                       |

## Not Verified

- Browser automation proves the blank lower surface is the hit target and component tests prove it calls the native drag helper only for direct primary-button hits. Physical movement of the compiled frameless WebView2 window still requires one short user-side portable smoke check.
- Live YTMDesktop Companion auth/playback was not repeated because Companion, keyring, realtime, command, and progress logic did not change; its existing native and simulator regressions all passed.

## Questions Resolved

| Question                                        | Resolution                                                                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which compact height is retained?               | The taller artwork-only envelope is retained; the progress-only state receives five balanced pixels and now requests exactly the same height.                              |
| How do old badge preferences migrate?           | `false` maps to `always`, `true` maps to `hover`; `hidden` is available only through the new explicit setting.                                                             |
| Does hidden mode collapse the header?           | No. The visible badge is omitted, but its empty draggable anchor remains so layout and window height do not shift.                                                         |
| Can the parent drag region steal control input? | No. Explicit dragging runs only for a direct primary-button hit on the layout itself, while interactive descendants remain CSS/Tauri no-drag regions.                      |
| Were all audit warnings blindly upgraded?       | No. Compatible security patch releases were applied; platform-stack/major-upgrade warnings are documented because changing those dependencies would expand risk and scope. |

## Open Questions

None for implementation. User confirmation of physical lower-surface dragging in the portable app is the final runtime observation.

## Residual Risks

- Physical WebView2 window movement is not browser-automatable, though the native permission already existed, the helper path is unit-tested, the blank surface is E2E hit-tested, and the compiled executable succeeded.
- `cargo audit` still reports 22 allowed transitive warnings. Most GTK3 entries are inactive on Windows; the remaining old parser/random/socket dependencies require upstream or major dependency migrations and should be reassessed in a dedicated dependency-modernization task rather than silently ignored.
- Repository-wide `cargo fmt --check` remains a pre-existing style/tool mismatch outside this scoped pass.

## Next Steps

- In the new portable build, drag once from the blank area below the artwork/progress row and confirm the frameless window moves while the artwork playback control and progress slider remain interactive.
- In Settings, switch the connection badge through `Always`, `On hover`, and `Hidden`; reopen the app once to confirm persistence and legacy-compatible behavior.
- Schedule a separate Tauri/Socket.IO dependency-modernization task only if removing the remaining RustSec informational warnings becomes a release requirement.
