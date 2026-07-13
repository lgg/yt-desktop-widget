# 0038 - Full i18n, theme, version, and code audit report

## Summary

Completed a repository-wide frontend, domain, native, security, dependency, version, and release audit. Every confirmed functional or security defect found in scope was fixed and protected by focused tests where automation was practical. The application now has explicit Dark, Light, and System theme modes; all audited static UI and runtime connection-state copy is sourced from the English/Russian JSON bundles; malformed persisted settings are normalized; native Companion errors cannot echo response-body secrets; failed settings writes cannot mutate the in-memory cache; version propagation is checked dynamically from root `package.json`; and known npm/Rust vulnerability findings were removed from the lockfiles.

## Done

- Inventoried UI strings, translation calls, locale trees, theme selectors/tokens, version literals and consumers, Tauri permissions, Companion/keyring/error flows, settings persistence, release scripts, and dependency advisories.
- Added explicit `light` to the persisted cross-language theme contract and ThemeProvider resolution; Dark and Light are fixed selections while System alone follows the OS preference.
- Replaced dark-only surface, artwork, control, progress, toggle, input, segmented-control, status, and focus colors with complete light/dark tokens while preserving high-contrast artwork overlays.
- Added exact English/Russian key parity, non-empty message, interpolation-token parity, static `t()` reference, JSX text, and literal accessibility-copy regression checks.
- Introduced typed connection message keys and JSON translations so internal/Companion error details are retained for logic but never rendered as untranslated UI copy.
- Added defensive settings normalization for malformed/legacy nested objects, booleans, enums, endpoints, ports, locales, themes, close actions, and window positions at every load/save/event boundary.
- Made native settings saves disk-first so a failed write does not report unsaved values through the cache.
- Removed Companion response bodies from native error strings to prevent tokens or other server data from entering UI/logging paths.
- Made version tests derive the expected value from root `package.json` and compare UI, Cargo manifest/lock, npm lock, Tauri config, Companion metadata, and compiled Windows metadata without duplicating `2.0.0` in test code or README prose.
- Updated npm dependencies and Rust transitive crates, removing all known vulnerability findings: Vite/Vitest lock updates plus `rustls-webpki 0.103.13`, `quinn-proto 0.11.15`, `plist 1.10.0`, and `quick-xml 0.41.0`.
- Removed Clippy findings in touched native code and added focused frontend, controller, E2E, version, and Rust regression coverage.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0038-a`                              |
| Started at         | `2026-07-13T21:59:30+03:00`                      |
| Finished at        | `2026-07-13T22:50:42+03:00`                      |
| Time spent minutes | `52`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0038-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                                                                                                                    |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend/native       | Updated        | Secret-safe Companion errors, transactional settings save, light-theme native round-trip test, Clippy cleanup.                                                           |
| Frontend             | Updated        | Explicit Light mode, complete color tokens, localized connection messages, defensive settings normalization.                                                             |
| Domain/API contracts | Updated        | Added typed connection-message keys without changing the official Companion protocol.                                                                                    |
| Tests                | Updated        | Added i18n completeness/static scans, theme/settings tests, controller regressions, dynamic version tests, E2E light-theme coverage, and Rust security/durability tests. |
| Documentation        | Updated        | Central-version guidance, roadmap, task, report, and time log reconciled.                                                                                                |
| Build/release/config | Updated        | Lockfiles only; portable-only release policy and Tauri config remain unchanged.                                                                                          |
| Bootstrap sync       | Not applicable | No shared process rule changed.                                                                                                                                          |
| Time tracking        | Updated        | Exact iteration timestamps and rounded-up duration recorded consistently.                                                                                                |
| Project tracking     | Updated        | Task `0038` completed; roadmap totals now show 38 tracked and 32 completed.                                                                                              |

## Changed Files

- `README.md`
- `package-lock.json`
- `src/locales/en.json`, `src/locales/ru.json`
- `src/styles/global.css`
- `src/app/AppProvider.tsx`, `src/app/SettingsWindow.tsx`, `src/app/WidgetWindow.tsx`
- `src/app/connectionMessage.ts`, `src/app/settingsRepository.ts`, `src/app/theme.tsx`
- `src/domain/playback/connectionMachine.ts`, `src/domain/playback/controller.ts`, `src/domain/playback/types.ts`
- `src-tauri/Cargo.lock`
- `src-tauri/src/companion.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/models.rs`, `src-tauri/src/settings.rs`
- Focused frontend, domain, E2E, version, and Rust tests
- `project-tracking/roadmap/0000-roadmap.md`, task/report `0038`, and `project-tracking/time-log.md`

## Verification

| Check                                           | Result | Notes                                                                                                                                                               |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TDD RED                                         | Passed | New frontend tests initially produced 6 expected failures; native response-confidentiality and settings-cache tests each failed before their fixes.                 |
| `npm run verify`                                | Passed | Version synchronized; ESLint passed; 15 files / 64 tests passed; TypeScript and Vite production build passed.                                                       |
| `npm run test:e2e`                              | Passed | 8/8 Playwright scenarios passed, including explicit Light mode, locale persistence, centralized version, wall-clock progress, hover stability, and compact layouts. |
| `cargo clippy -j1 --all-targets -- -D warnings` | Passed | No native warnings remain under the strict Clippy gate.                                                                                                             |
| `cargo test -j1`                                | Passed | 18/18 Rust tests passed, including token-confidentiality and failed-write cache rollback.                                                                           |
| `cargo check -j1`                               | Passed | Native debug graph compiled successfully.                                                                                                                           |
| `npm audit --audit-level=moderate`              | Passed | 0 vulnerabilities.                                                                                                                                                  |
| `cargo audit`                                   | Passed | Exit 0 and 0 vulnerabilities after lock updates; 25 allowed warnings remain for transitive unmaintained/unsound/yanked crates.                                      |
| `npm run build:desktop`                         | Passed | Tauri v2 Windows release compiled with `--no-bundle`.                                                                                                               |
| `npm run build:portable`                        | Passed | Public portable-only command built `src-tauri/target/release/ytm-desktop-widget.exe`; no installer was introduced.                                                  |
| EXE metadata                                    | Passed | `FileVersion=2.0.0`, `ProductVersion=2.0.0`, `ProductName=YTM Desktop Widget`.                                                                                      |
| `git diff --check`                              | Passed | No whitespace errors.                                                                                                                                               |
| Documentation/time review                       | Passed | README, roadmap, task, report, and time-log state and timestamps agree.                                                                                             |

## Not Verified

- A live YTMDesktop Companion session was not repeated during this audit. The user had already confirmed the current Companion behavior before this pass; protocol paths were covered by unit/integration tests and a successful native release build.
- `npm run format:check` remains unsuitable as a repository gate because 125 pre-existing files outside this task do not match the current Prettier configuration. All touched frontend/JSON files were formatted directly and lint/build gates pass.
- Repository-wide `cargo fmt --check` still proposes a broad conversion from the established two-space Rust style plus pre-existing wrapping changes. This audit intentionally avoided an unrelated native-layer reformat; strict Clippy, Rust tests, check, and release compilation all pass.

## Questions Resolved

| Question                                                           | Resolution                                                                                                                         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Is Light only an implicit System result?                           | No. Added an explicit persisted Light option while retaining System OS-following behavior.                                         |
| Can raw native/Companion details be rendered for diagnostic value? | No. UI now selects typed JSON-localized messages; raw details remain internal and response bodies are excluded from native errors. |
| Is `2.0.0` duplicated as a release truth?                          | No. Root `package.json` is the manual source; tests and docs dynamically consume or describe it.                                   |
| Does portable validation produce an installer?                     | No. The command remains an alias of `tauri build --no-bundle`.                                                                     |

## Open Questions

None for the audited scope.

## Residual Risks

- `cargo audit` reports 25 allowed warnings (not vulnerabilities) in transitive dependencies. Most are Linux GTK3 bindings reached by Tauri's all-target dependency graph; the remainder are unmaintained/unsound/yanked transitive crates without a compatible direct project-level fix. Continue monitoring upstream Tauri and crate releases.
- Automated tests substantially reduce regression risk but cannot prove the absence of every possible defect. A future live Companion smoke remains appropriate after upstream YTMDesktop protocol or runtime changes.
- The existing repository-wide Prettier/Rustfmt backlog remains process debt; resolving it should be an isolated formatting-only task to avoid obscuring functional changes.

## Next Steps

- No open product task remains from this audit.
- Monitor upstream Tauri/Rust crates and rerun `cargo audit` during the next dependency-maintenance pass.
- Treat any repository-wide formatting normalization as a dedicated task and review-only commit.
