# 0036 - Add display controls, localization, and central versioning report

## Summary

Delivered the version `2.0.0` display/localization pass and reconciled the active roadmap. The widget can now remove title/artist from layout, optionally use the full artwork as a play/pause control, and switch persistently between complete English and Russian UI bundles. Theme selection is first in UI Display. The root `package.json` is the single manually edited version source, with automated sync/drift checks and verified `2.0.0` UI, Companion, Cargo, Tauri, and Windows executable metadata.

The user's 2026-07-13 live Companion/portable confirmation closes the remaining stabilization, live-validation, smoke, and settings-drag tasks. Future-only resize, macOS, installer, alternate-mode, and diagnostics work remains explicitly deferred.

## Done

- Added persisted `hideTrackDetails`, default off, with intrinsic-height resynchronization.
- Added persisted `useArtworkAsPlaybackControl`, default off, preserving existing artwork behavior until enabled.
- Implemented the artwork as a native full-area button with localized play/pause label, mouse and keyboard activation, hover/focus action indicator, focus ring, disabled state, and no-drag behavior.
- Moved theme mode to the first UI Display setting.
- Added persisted `locale`, English default/fallback, a Settings language selector, complete `ru.json`, matching locale-key tests, and localized remaining transport/progress/developer copy.
- Centralized version edits in root `package.json`; Tauri and React consume it directly, Companion uses `CARGO_PKG_VERSION`, and required Cargo/lock copies are synchronized by `scripts/sync-version.mjs`.
- Added `version:sync` and `version:check`; `npm run verify` now rejects version drift before other checks.
- Bumped the app to `2.0.0` and verified the compiled Windows executable reports `FileVersion` and `ProductVersion` `2.0.0`.
- Added focused RED/GREEN component, i18n, version, Rust settings, and browser regressions.
- Fixed a pre-existing flaky badge E2E assumption by moving the pointer outside the widget before asserting idle hover state.
- Completed tasks `0001`, `0002`, `0008`, `0010`, `0012`, and `0014`; moved umbrella `0005` to Deferred; updated roadmap counts to zero active tasks.
- Added decision `0003` for the central version model and synchronized README/architecture/decision documentation.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0036-a`                              |
| Started at         | `2026-07-13T20:26:55+03:00`                      |
| Finished at        | `2026-07-13T21:10:42+03:00`                      |
| Time spent minutes | `44`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | [`project-tracking/time-log.md`](../time-log.md) |

## Changed Areas

| Area                 | Status         | Notes                                                                                                                  |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Changed        | Added backward-compatible persisted UI fields and compile-time Companion version metadata.                             |
| Frontend             | Changed        | Added track-details hiding, artwork playback control, theme-first ordering, locale selection, and localized UI copy.   |
| Domain/API contracts | Changed        | UI settings add two display booleans and `en`/`ru` locale; Companion wire behavior is unchanged.                       |
| Tests                | Changed        | Added/expanded component, locale parity, version consistency, native settings, and eight-scenario Playwright coverage. |
| Documentation        | Changed        | README, architecture, decisions, roadmap, related tasks/reports, and central version workflow are synchronized.        |
| Build/release/config | Changed        | Bumped to `2.0.0`, centralized versioning, and verified portable Tauri build; installer policy remains deferred.       |
| Bootstrap sync       | Not applicable | No shared process or bootstrap rule changed.                                                                           |
| Time tracking        | Changed        | Task, report, and time log use iteration `2026-07-13-0036-a`.                                                          |
| Project tracking     | Changed        | Active backlog closed; six future tasks remain deferred; no open/in-progress/blocked task remains.                     |

## Changed Files

- `package.json`, `package-lock.json`, `scripts/sync-version.mjs`, `eslint.config.js`
- `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`
- `src-tauri/src/companion.rs`, `src-tauri/src/models.rs`
- `src/app/AppProvider.tsx`, `src/app/AppRoot.tsx`, `src/app/defaults.ts`, `src/app/i18n.tsx`
- `src/app/SettingsWindow.tsx`, `src/app/SettingsWindow.test.tsx`
- `src/app/WidgetWindow.tsx`, `src/app/WidgetWindow.test.tsx`, `src/app/i18n.test.tsx`
- `src/components/settings/SettingsSection.tsx`
- `src/components/widget/CoverCard.tsx`, `ProgressScrubber.tsx`, `TransportControls.tsx`
- `src/domain/playback/types.ts`, `src/locales/en.json`, `src/locales/ru.json`, `src/styles/global.css`
- `tests/app/AppProvider.test.tsx`, `tests/app/version.test.ts`, `tests/e2e/widget.spec.ts`
- `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`
- `project-tracking/decisions/0003-use-package-json-as-central-version-source.md`
- related roadmap/task/report/time-log files under `project-tracking/`

## Verification

| Check                           | Result                 | Notes                                                                                                                                                                               |
| ------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture/version/i18n audit | Passed                 | Mapped every UI setting persistence boundary, locale consumer, user-facing string site, version literal, Tauri version capability, and widget height trigger before implementation. |
| Focused RED                     | Passed                 | Seven expected Vitest failures and one Rust settings failure proved the new behavior/version/locale coverage failed before implementation.                                          |
| Focused GREEN                   | Passed                 | 20/20 focused Vitest checks passed after implementation.                                                                                                                            |
| Version consistency             | Passed                 | `npm run version:check` reports `Version 2.0.0 is synchronized.`                                                                                                                    |
| Frontend verify                 | Passed                 | Final `npm run verify` passed version check, ESLint, 55/55 Vitest tests, TypeScript, and Vite production build.                                                                     |
| Browser smoke                   | Passed                 | `npm run test:e2e`: 8/8 scenarios passed, including settings order/locale/version and artwork/details behavior.                                                                     |
| Native tests                    | Passed                 | `cargo test -j1`: 16/16 passed.                                                                                                                                                     |
| Native static check             | Passed                 | `cargo check -j1` completed successfully for `ytm-desktop-widget v2.0.0`.                                                                                                           |
| Portable build                  | Passed                 | `npm run build:desktop` built `src-tauri/target/release/ytm-desktop-widget.exe`.                                                                                                    |
| Executable metadata             | Passed                 | Size `15653376`; SHA-256 `F06E8E808EDF6A245D021A56B0C369A76C23F24211CF9D4960540BA68112F216`; `FileVersion` and `ProductVersion` are `2.0.0`.                                        |
| Manual browser QA               | Passed                 | Playwright CLI verified English/Russian Settings, theme-first ordering, `2.0.0`, details removal, and artwork hover indication. Only a non-functional missing favicon 404 appeared. |
| Formatting                      | Passed with limitation | Prettier was applied to changed frontend/docs files and `git diff --check` is clean. `cargo fmt --check` was unavailable because rustfmt is not installed.                          |
| Docs/config review              | Passed                 | Portable-only packaging and security/permission behavior are unchanged; version release config is documented in decision `0003`.                                                    |
| Time tracking                   | Passed                 | Task, report, and time log use the same tracked 44-minute interval.                                                                                                                 |

## Not Verified

- The user built and confirmed the prior portable Companion behavior; this pass's newly built `2.0.0` executable was validated by automated browser/native/build checks but was not launched against the user's live YTMDesktop session during this AI iteration.
- Ads, livestreams, and every transient Companion restart variant were not exhaustively forced; these remain normal future regression cases rather than an open delivery task.
- Installer generation remains intentionally disabled and deferred under task `0009`.

## Questions Resolved

| Question                                       | Resolution                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Should the new controls affect existing users? | No. Both settings default off, so existing title/artwork behavior remains unchanged.                            |
| Should hiding details reserve space?           | No. It removes the block like the progress preference and triggers intrinsic-height sync.                       |
| How is artwork play/pause exposed?             | A full-area native button appears only in opt-in mode; the action icon follows widget hover and keyboard focus. |
| What is the default language?                  | English, with persisted Russian selection and English fallback.                                                 |
| Where is the version changed?                  | Only root `package.json`; sync/check tooling handles required concrete copies.                                  |
| Is the previous active roadmap still open?     | No. User-confirmed delivered work is completed; only six future/deferred tasks remain.                          |

## Open Questions

None blocking this task.

## Residual Risks

- Very long future translations may require additional layout tuning; English and Russian pass current browser coverage.
- Tauri/Cargo inherently retain concrete generated version copies, so the release gate depends on `version:check` remaining in `verify`.
- Live upstream payload variants can change after a YTMDesktop upgrade; rerun live smoke after meaningful Companion changes.

## Next Steps

- Keep the remaining six roadmap items deferred until explicitly prioritized.
- For the next release bump, edit root `package.json`, run `npm run version:sync`, then run the normal verification/build gates.
- Delivery commit/merge/push: pending.
