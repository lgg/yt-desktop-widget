# 0055 - Public repository rename and documentation audit report

## Summary

The public product, repository metadata, Settings/About copy, native binary, and active documentation now use **Music Desktop Widget** / `music-desktop-widget`. The README was rebuilt as a concise public project page with Windows/Linux/macOS and playback-adapter matrices, setup and security guidance, contributor workflow links, the requested cross-platform roadmap, and a time-log-derived effort snapshot. A repository and history audit found no committed high-confidence credentials; five historical documentation paths were sanitized. Compatibility-sensitive keyring, settings, startup, and Companion identifiers remain deliberately stable so existing installations do not lose credentials or preferences.

## Done

- Renamed the npm package, Rust package/library, Tauri product/window titles, release executable, tray/error text, current repository links, and localized Settings/About copy.
- Added RED/GREEN regressions for public naming across package, Tauri, Cargo, repository metadata, and Settings.
- Preserved and documented the legacy Tauri/keyring service, browser settings key, Windows startup value, and Companion application ID.
- Rewrote the README around current product capability, supported operating systems and adapters, source builds, privacy/security, workflow, roadmap, limitations, and resource summary.
- Replaced the historical-status-heavy roadmap with one ordered forward plan: Linux/MPRIS, GitHub CI/releases, localization scaling, then macOS.
- Added detailed deferred tasks `0056`, `0057`, and `0058`, and reconciled the existing macOS task with the new sequence.
- Condensed the decision index, updated architecture/current-state documentation, strengthened repository privacy rules, and kept `AGENTS.md` discoverable from README.
- Sanitized private absolute paths from five historical task/report locations without rewriting their technical facts.
- Added ignore rules for local environment files and common private-key/certificate formats.
- Updated the Git remote to `git@github.com:lgg/music-desktop-widget.git`.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0055-a` |
| Started at | `2026-07-15T07:39:07+03:00` |
| Finished at | `2026-07-15T08:16:38+03:00` |
| Time spent minutes | `38` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0055-a` |

The authoritative log now totals 1,077 tracked minutes, or 17 hours 57 minutes. README rounds that to about two working days and two hours.

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Renamed safely | Rust/Tauri public naming and binary changed; persistent runtime identifiers remain stable. |
| Frontend | Updated | Settings/About and document title now use Music Desktop Widget. |
| Domain/API contracts | Preserved | No adapter behavior or wire contract changed. |
| Tests | Added/updated | Public-name coverage added; full frontend, Rust, and E2E suites passed. |
| Documentation | Rebuilt | README, architecture, decisions, roadmap, tracking entry points, contributor/privacy rules, and affected history updated. |
| Build/release/config | Updated | npm/Cargo/Tauri metadata, lockfiles, binary name, and Git remote match the new repository. |
| Bootstrap sync | Reviewed | No upstream bootstrap version was synchronized; only current project naming/capability wording changed. |
| Time tracking | Updated | Task, report, README snapshot, and time log agree on 1,077 total minutes. |
| Project tracking | Updated | Task `0055` completed; future tasks `0056`-`0058` and the macOS dependency chain are recorded. |

## Changed Files

- Public entry points: `README.md`, `index.html`, `package.json`, `package-lock.json`.
- Native/build metadata: `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`, and affected Rust naming references.
- Frontend/locales/tests: `src/app/defaults.ts`, `src/locales/en.json`, `src/locales/ru.json`, Settings/version tests.
- Engineering docs: `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `.gitignore`.
- Project tracking: roadmap, task/report `0055`, future tasks `0056`-`0058`, decision `0009`, macOS task `0007`, time log, and sanitized historical records.

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Naming RED/GREEN | Passed | Focused test first failed on the old package and Settings label, then passed 22/22 after implementation. |
| `npm run version:check` | Passed | Version `3.1.0` is synchronized. |
| `npm run verify` | Passed | ESLint, 19 Vitest files / 127 tests, TypeScript, and Vite production build passed. |
| `cargo test --target-dir target/qa-0055 -j1` | Passed | 48 Rust tests passed; the first clean compile exceeded the 240-second runner timeout, then the same build completed successfully. |
| `cargo clippy --target-dir target/qa-0055 --all-targets -j1 -- -D warnings` | Passed | No warnings. |
| `cargo check --target-dir target/qa-0055 -j1` | Passed | Native crate checked under the new package/library names. |
| `npm run test:e2e` | Passed | 16 Playwright simulator tests passed. |
| `npm audit --omit=dev` | Passed | 0 vulnerabilities. |
| `npm run build:desktop` | Passed | Built `src-tauri/target/release/music-desktop-widget.exe`; 16,463,872 bytes; SHA-256 `7DB069FD0717B748C084C7414E03C5E50B85EE8BE9644D51B01684D885DE1133`. |
| Windows release metadata | Passed | ProductName/FileDescription `Music Desktop Widget`; FileVersion/ProductVersion `3.1.0`. |
| Markdown link check | Passed | 0 broken relative targets across all 124 tracked and relevant untracked Markdown files after tracking reconciliation. |
| Current private-path scan | Passed | No tracked personal Windows/POSIX path, local username, temp clipboard path, or stale repository URL remains. |
| Secret scan | Passed | No PEM marker, high-confidence provider token, assigned credential, JWT, embedded URL credential, or user-supplied test token is present in tracked text. |
| Git-history secret spot check | Passed | No high-confidence secret pattern found in reachable history. |
| `git diff --check` | Passed | No whitespace errors. |
| Documentation/capability review | Passed | README, architecture, decisions, roadmap, package/Tauri/Cargo configuration, adapter support, localization, and portable-only policy agree. |

## Not Verified

- A live Settings window was not reopened solely for a static product-label change; the accessible Settings label is covered by the focused component regression and the built executable's Windows metadata was inspected directly.
- Linux, GitHub CI release publication, additional locales, and macOS remain roadmap work and were not represented as current support.
- `npm run format:check` still reports the repository's existing broad CRLF/style baseline; this pass did not mass-format 195 unrelated files. Changed content passes `git diff --check` and all required verification.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Should every old identifier be replaced? | No. Public names and links changed; state-bearing runtime IDs remain until a tested migration exists. |
| Where should the roadmap live? | `project-tracking/roadmap/0000-roadmap.md` remains the sole authoritative roadmap; README contains only a short linked summary. |
| How should effort/cost be presented? | Time uses the authoritative log; tokens/cost are explicitly rounded estimates using official GPT-5.6 Sol standard API pricing as of 2026-07-15. |
| Should historical old executable names be erased? | No. Accurate historical artifact evidence remains in old reports; active guidance and current links use the new name. |

## Open Questions

None for this pass.

## Residual Risks

- The GitHub repository must exist at the new remote and accept the final push; local metadata and all public links already target it.
- A future full application-identifier rename requires explicit migration of keyring credentials, settings, startup registration, and Companion authorization.
- The API-equivalent token/cost figure is an intentionally rounded communication estimate, not an invoice or a claim of exact historical token accounting.

## Next Steps

- Begin task `0056` when Linux build and MPRIS work is approved.
- Add CI/release automation through `0057` only after the supported platform matrix is ready.
- Keep README support tables and the dedicated roadmap synchronized as phases ship.
