# 0048 - Unify Settings visibility controls and layout report

## Summary

Implemented the two requested Settings presentation fixes without changing runtime widget behavior or the persisted settings contract. Settings and Close now use accessible `Always` / `On hover` segmented choices with no `Hidden` option, and every four-mode widget-block visibility selector uses two intentional rows: `Always` + `Hidden`, followed by both hover variants.

Focused component, complete frontend, browser geometry, native, dependency, and desktop release checks pass. Windows Media Session runtime work was explicitly excluded after the user deferred it; the capability evidence and supported packaging work are preserved in task `0049`, and README/architecture now accurately state that the current portable artifact is Companion-only in practice.

## Done

- Replaced the two legacy Settings/Close switches with Mute-style segmented controls while mapping directly to the existing `hideSettingsButton` and `hideCloseButton` booleans.
- Added explicit semantic row wrappers for four-mode controls so line placement does not depend on incidental flex wrapping.
- Kept the original visibility values, defaults, repository normalization, native model, widget hover/focus behavior, and storage format unchanged.
- Updated English and Russian labels/descriptions exclusively through locale JSON.
- Added RED/GREEN component regressions for both legacy boolean states, click mapping, option count, absence of `Hidden`, and exact four-mode row order.
- Added Playwright persistence and geometry coverage at 720 px and the supported 620 px minimum, including Russian long labels and horizontal-overflow checks.
- Audited light/dark theme token use, keyboard semantics, Settings scrolling/dragging, collapsible sections, block order, version sync, native contracts, permissions, privacy, and release output.
- Corrected README and architecture claims so the deferred WMS packaging limitation is explicit rather than presenting portable WMS as operational.
- Split supported WMS package delivery into deferred task `0049`; no WMS runtime or packaging code changed in this pass.
- Committed the verified implementation as `f4103a8`, pushed the pass branch, merged it into `master` as `1d515ba`, and pushed `master`.

## Time Tracking

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Iteration ID       | `2026-07-14-0048-a`                                  |
| Started at         | `2026-07-14T06:59:46.0008978+03:00`                  |
| Finished at        | `2026-07-14T07:52:03.6061767+03:00`                  |
| Time spent minutes | `53`                                                 |
| Tracking status    | `tracked`                                            |
| Time log row       | `project-tracking/time-log.md` (`2026-07-14-0048-a`) |

## Changed Areas

| Area                 | Status         | Notes                                                                                                           |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Audited        | No Rust change; existing boolean settings contract and defaults remain compatible.                              |
| Frontend             | Changed        | Settings/Close segmented presentation and deterministic four-mode row layout.                                   |
| Domain/API contracts | Unchanged      | Existing booleans and `WidgetBlockVisibility` values remain authoritative.                                      |
| Tests                | Changed        | Added component state/mapping coverage and responsive English/Russian Playwright geometry/persistence coverage. |
| Documentation        | Changed        | Documented header visibility choices and corrected portable WMS delivery claims.                                |
| Build/release/config | Audited        | Version stays centralized at `3.1.0`; no permission, packaging, lockfile, or Tauri configuration changes.       |
| Bootstrap sync       | Not applicable | No durable process rule changed.                                                                                |
| Time tracking        | Changed        | Task/report/time-log use iteration `2026-07-14-0048-a`.                                                         |
| Project tracking     | Changed        | Added task/report `0048`, deferred WMS task `0049`, and reconciled the roadmap snapshot.                        |

## Changed Files

- UI and styles: `src/app/SettingsWindow.tsx`, `src/styles/global.css`
- Localization: `src/locales/en.json`, `src/locales/ru.json`
- Tests: `src/app/SettingsWindow.test.tsx`, `tests/e2e/widget.spec.ts`
- Product/architecture docs: `README.md`, `ARCHITECTURE.md`
- Tracking: roadmap, task/report `0048`, deferred task `0049`, and `project-tracking/time-log.md`

## Verification

| Check                                           | Result               | Notes                                                                                                                                                                                                     |
| ----------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused Settings RED                            | Passed as RED        | 3 expected failures: missing explicit row wrappers and missing Settings/Close segmented groups; 15 pre-existing tests passed.                                                                             |
| Focused Settings GREEN                          | Passed               | 18/18 component tests.                                                                                                                                                                                    |
| `npm run verify`                                | Passed               | Version `3.1.0` synchronized; ESLint, 19 Vitest files / 119 tests, TypeScript, and Vite production build passed.                                                                                          |
| `npm run test:e2e`                              | Passed               | 16/16 Playwright scenarios, including both locales, explicit light theme, persistence, Settings drag/scroll behavior, minimum-width row geometry, and no horizontal overflow.                             |
| `cargo test -j1`                                | Passed               | 33 passed, 1 ignored manual WMS integration smoke, 0 failed.                                                                                                                                              |
| `cargo check -j1`                               | Passed               | Clean isolated-target dev check.                                                                                                                                                                          |
| `cargo clippy -j1 --all-targets -- -D warnings` | Passed               | No warnings.                                                                                                                                                                                              |
| `npm audit --omit=dev`                          | Passed               | 0 vulnerabilities.                                                                                                                                                                                        |
| `cargo audit`                                   | Passed with warnings | Exit 0; 22 allowed upstream/transitive maintenance, unsoundness, or yanked warnings and no blocking vulnerability. This matches the documented repository baseline.                                       |
| Static security/privacy review                  | Passed               | No backend, command, persistence, permission, capability, network, telemetry, credential, dependency, or lockfile change.                                                                                 |
| `npm run build:desktop`                         | Passed               | Portable `--no-bundle` release built successfully.                                                                                                                                                        |
| EXE metadata/hash                               | Passed               | FileVersion/ProductVersion `3.1.0`; 15,945,216 bytes; SHA-256 `272A42DE9DA6CE4F9FEB42B8CF13CC61A85650B5BE531EF53805AB965C24F3F7`.                                                                         |
| `git diff --check`                              | Passed               | No whitespace errors.                                                                                                                                                                                     |
| Global `npm run format:check`                   | Baseline-blocked     | The repository-wide command scans local Rust targets and treats the Windows CRLF worktree as unformatted (661 files). Only scoped changed-file formatting is used; no unrelated mass rewrite was applied. |
| Git delivery                                    | Passed               | Branch commit `f4103a8` by `lgg <lgg@users.noreply.github.com>` was pushed and merged into pushed `master` as `1d515ba`.                                                                                  |

## Not Verified

- The built desktop executable was compiled and its metadata/hash inspected, but a second GUI instance was not launched so it would not interfere with the user's live desktop state.
- WMS access and player compatibility were deliberately not retested or changed after the user deferred that work to task `0049`.

## Questions Resolved

| Question                                                    | Resolution                                                                                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Should Settings/Close gain a `Hidden` mode?                 | No. They expose exactly `Always` and `On hover`, as requested.                                                                      |
| Should the stored booleans become a new enum?               | No. `false=Always` and `true=On hover` preserve all existing data and runtime behavior without migration.                           |
| Should four-option placement rely on flex wrapping?         | No. Two semantic row containers guarantee the requested order at supported widths and across locales.                               |
| Should portable WMS be fixed inside this UI pass?           | No. The user deferred it; supported package identity/capability delivery requires a separate product/release decision under `0049`. |
| Should formatting rewrite hundreds of unrelated CRLF files? | No. The baseline command issue is documented; scoped formatting avoids noisy unrelated changes.                                     |

## Open Questions

| Question                                                  | Owner        | Next Step                                                                          |
| --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| Full MSIX or supported sparse package for WMS capability? | User/project | Decide signing, trust/update, and portable coexistence under deferred task `0049`. |

## Residual Risks

- RustSec continues to report 22 allowed warnings in upstream/transitive dependencies; future Tauri/Companion dependency upgrades should keep reassessing them.
- Repository-wide Prettier checking is not currently a reliable Windows gate because it includes generated target trees and conflicts with the CRLF worktree. The changed files are scoped and validated; fixing the global policy should be a separate process/tooling pass.
- WMS remains unavailable in the current portable/unpackaged artifact until supported packaged delivery is designed and implemented.

## Next Steps

- Handle supported WMS package identity and live player validation only when task `0049` is resumed.
