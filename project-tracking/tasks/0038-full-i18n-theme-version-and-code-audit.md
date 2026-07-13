# 0038 - Full i18n, theme, version, and code audit

## Status

Completed

## Context

Tasks `0036` and `0037` introduced English/Russian JSON localization, centralized application version `2.0.0`, theme/display controls, and the artwork playback refinement. The user requested a deep repository-wide audit to prove these contracts are complete, identify latent UI/native/runtime defects, fix every confirmed issue, and deliver the verified result directly through the normal branch-to-master workflow.

## Goal

Establish evidence that user-facing text, localization fallback/parity, light and dark theme behavior, application-version propagation, Companion/security boundaries, and the general codebase are internally consistent. Fix every reproducible defect found during the audit and add regression coverage that prevents recurrence.

## Scope

Included:

- Inventory every React/UI string source and verify user-facing static copy comes from locale JSON, with documented exceptions only for external track data, technical values, and the centrally imported application version.
- Verify English/Russian locale key and value-shape parity, default/fallback behavior, persistence, interpolation, and runtime switching.
- Verify a real light theme and dark theme across widget/settings, all major connection/auth/error/loading states, controls, focus/disabled/hover states, artwork backgrounds, and system preference changes.
- Verify version `2.0.0` fan-out from the root `package.json` to UI, Tauri, Cargo, Companion metadata, lockfiles, build scripts, tests, docs, and Windows executable metadata.
- Audit frontend/domain/native code for correctness, state/data-flow defects, unsafe token handling, hardcoded secrets, permission drift, error leakage, unhandled promises, and release-policy mismatch.
- Add focused RED/GREEN tests and make minimal fixes for every confirmed finding.
- Run complete frontend, browser, Rust, security/dependency, version, and desktop/portable validation.

Out of scope:

- New roadmap features unrelated to confirmed audit defects.
- Re-enabling installer packaging, macOS support, telemetry, or network exposure.
- Changing the official Companion protocol unless a local implementation mismatch is proven.

## Affected Areas

- Backend/native: Full read-only audit; changes only if a concrete defect is found.
- Frontend: i18n, theme, settings/widget behavior, accessibility, and error-state coverage.
- Domain/API contracts: Playback/settings/Companion mappings audited; changes only for proven mismatches.
- Tests: Locale/theme/version regression expansion plus focused tests for each fix.
- Documentation: README, roadmap, task, report, and version/theme/i18n guidance if gaps are found.
- Build/release/config: Version and portable-only configuration audited; no packaging-policy change intended.
- Project tracking: New task/report `0038`, roadmap status/counts, and time log.
- Other: Keyring/token confidentiality, Tauri permissions, dependency audit, and compiled executable metadata.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0038-a`                              |
| Started at         | `2026-07-13T21:59:30+03:00`                      |
| Finished at        | `2026-07-13T22:50:42+03:00`                      |
| Time spent minutes | `52`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0038-a` |

## Acceptance Criteria

- [x] English and Russian JSON bundles have identical nested key/value shapes and every translation is a non-empty string.
- [x] All static user-facing interface copy is sourced from locale JSON; exceptions are explicit and justified by tests/audit notes.
- [x] English is the deterministic default/fallback for missing, invalid, or legacy locale values, while English/Russian persistence and live switching work.
- [x] Light and dark themes are both intentionally selectable or deterministically system-driven, use complete tokens, and render every audited widget/settings state accessibly without dark-only leakage.
- [x] Root `package.json` remains the sole manually edited version source; all UI/native/Companion/lock/build consumers and executable metadata agree on `2.0.0`.
- [x] No confirmed frontend/domain/native correctness, auth-storage, permission, secret, logging, or release/config defect remains unfixed.
- [x] Each confirmed defect has a focused regression test observed failing before the fix and passing after it where automation is practical.
- [x] Full frontend, E2E, Rust, dependency/security, version, desktop, and portable checks pass or any external limitation is explicitly documented.
- [x] README, roadmap, task, report, time log, and any affected decision/config documentation agree.
- [x] No unrelated refactor, installer work, network exposure, telemetry, or user credential is introduced.

## Verification Plan

- [x] Repository inventory: enumerate source/config/scripts/tests/native files and search UI literals, locale usage, colors/theme selectors, version literals, TODO/FIXME/panic/unwrap/log/token patterns, permissions, and build scripts.
- [x] i18n static audit: compare JSON trees, map all `t()` keys to bundle keys, scan JSX/TSX for user-facing literals, and test fallback/interpolation/persistence.
- [x] Theme static/visual audit: inspect token architecture and media/data-theme selectors; exercise both themes and representative states in browser screenshots/DOM styles.
- [x] Version audit: run/check sync tooling, enumerate version literals, validate all consumers, and inspect final Windows executable metadata.
- [x] Security/runtime audit: inspect Companion/token/keyring/error/logging/Tauri-permission paths and run dependency/native checks.
- [x] TDD fixes: RED/GREEN focused tests for every confirmed issue.
- [x] Full validation: `npm run verify`, `npm run test:e2e`, `cargo test -j1`, `cargo check -j1`, `npm audit`, `npm run build:desktop`, `npm run build:portable`, focused formatting, and `git diff --check`.
- [x] Documentation/time review: roadmap/task/report/time log and release/security notes agree before commit.

## Questions and Answers

| Question                                                    | Status   | Answer / Decision                                                                                                     |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| Does the request authorize fixing confirmed audit findings? | Resolved | Yes. The user explicitly requested all discovered bugs/errors be fixed and delivered.                                 |
| Should unproven broad refactors be included?                | Resolved | No. Changes remain minimal and evidence-driven.                                                                       |
| Is installer packaging part of the audit delivery?          | Resolved | No. Verify portable-only policy; do not re-enable deferred installer work.                                            |
| Can light-theme gaps be corrected as product behavior?      | Resolved | Yes. The user explicitly requires real light-theme support everywhere; preserve existing dark/system behavior safely. |

## Risks

| Risk                                                            | Impact | Mitigation                                                                                          |
| --------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| A broad audit creates unrelated churn.                          | High   | Require a reproducible finding and focused test before code changes; avoid opportunistic refactors. |
| Static string scans misclassify technical/external content.     | Medium | Review findings manually and document justified exceptions.                                         |
| Theme checks miss native WebView/system preference differences. | Medium | Combine token inspection, browser media emulation, screenshots, and desktop build checks.           |
| Version checks validate text but miss compiled metadata.        | High   | Inspect Cargo/Tauri inputs and the final Windows executable version resource.                       |
| Security review accidentally exposes a token in output.         | High   | Search patterns/structure only; never print keyring values or real credentials.                     |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0036-add-display-controls-localization-and-central-versioning.md`](0036-add-display-controls-localization-and-central-versioning.md)
- Related report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
- Version decision: [`0003-use-package-json-as-central-version-source.md`](../decisions/0003-use-package-json-as-central-version-source.md)
- Time log: [`time-log.md`](../time-log.md)
- Report: [`0038-full-i18n-theme-version-and-code-audit.md`](../reports/0038-full-i18n-theme-version-and-code-audit.md)
- PR/commit: branch `codex/0038-full-i18n-theme-version-audit`; commit/merge pending at report write
