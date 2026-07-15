# 0055 - Public repository rename and documentation audit

## Status

Completed

## Context

The public repository has moved from `lgg/yt-desktop-widget` to `lgg/music-desktop-widget`, while the Settings UI, package metadata, build output, README, architecture documents, and historical tracking still contain a mixture of the old public name, legacy runtime identifiers, implementation notes, and internal validation detail. The repository also needs a concise public-facing README, explicit OS and adapter support matrices, an honest forward roadmap, and a repository-wide sensitive-data audit.

This task is the implementation plan for the pass. It lives in `project-tracking/` instead of a parallel `docs/plans/` tracker, as required by the repository workflow.

## Goal

Present the project consistently as **Music Desktop Widget**, make the README and active documentation suitable for a public repository without losing contributor rules or audit history, publish a realistic phased roadmap, and verify that tracked content contains no credentials or private machine paths.

## Scope

Included:

- Rename user-visible Settings/About text, package/product metadata, build output, and current repository URLs.
- Preserve legacy credential/config/Companion identifiers where changing them would silently lose user state; record that compatibility boundary.
- Rewrite README structure around public product value, support matrices, setup, security, contribution workflow, roadmap, and a concise development-resource snapshot.
- Replace the historical-status-heavy roadmap view with a dedicated forward roadmap linked to the detailed task/report archive.
- Add the requested sequence: Linux foundation and MPRIS, Linux builds, GitHub CI/releases, expanded localization and scalable language selection, then macOS.
- Audit tracked and relevant untracked text for secrets, credentials, private absolute paths, local usernames, stale repository URLs, and unsupported capability claims.
- Reconcile architecture, decisions, contributor rules, project tracking, report, roadmap, and time log.

Out of scope:

- Implementing Linux, MPRIS, CI release publishing, new translations, or macOS support in this pass.
- Renaming stable keyring/config/Companion identifiers without a migration design.
- Rewriting immutable historical task/report content solely to erase accurate historical names, unless it contains a stale active link, secret, or private path.
- Adding an installer, signing, updater, or GitHub Actions workflow.

## Affected Areas

- Backend/native: package/product naming and compatibility-sensitive application identifiers.
- Frontend: Settings/About product name and related tests/localization.
- Domain/API contracts: no behavior change; stable Companion and keyring identifiers remain migration-safe.
- Tests: naming assertions, repository/documentation checks, existing full verification.
- Documentation: README, architecture/decision docs, active project-tracking entry points, roadmap, contributor guidance.
- Build/release/config: package metadata, Tauri product/binary naming, repository remote.
- Project tracking: task `0055`, report `0055`, roadmap snapshot, time log.
- Security/privacy: repository-wide secret and private-path scan; no credential contents may be printed or committed.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0055-a` |
| Started at | `2026-07-15T07:39:07+03:00` |
| Finished at | `2026-07-15T08:16:38+03:00` |
| Time spent minutes | `38` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0055-a` |

## Acceptance Criteria

- [x] The public product/repository name is `Music Desktop Widget` / `music-desktop-widget` in Settings, package metadata, build output, active docs, and current links.
- [x] Compatibility-sensitive legacy identifiers are either migrated safely or deliberately retained and documented outside user-facing copy.
- [x] README opens as a normal public repository page and contains concise OS and playback-adapter support tables.
- [x] README keeps `AGENTS.md` and the project workflow discoverable without dominating the product documentation.
- [x] README reports the time-log-derived effort snapshot and a clearly labelled approximate GPT-5.6 Sol API-equivalent token/cost estimate with an official pricing link and snapshot date.
- [x] The dedicated roadmap reflects current completed capability and lists Linux/MPRIS, Linux builds, GitHub CI/releases, localization/language-picker scaling, and macOS in the requested order.
- [x] Active documentation and linked configuration agree with actual platform, adapter, packaging, credential-storage, and localization support.
- [x] No tracked secret, token, private key, personal absolute path, temporary clipboard path, or local username is exposed.
- [x] Historical records remain auditable and are not misleadingly rewritten as current product guidance.
- [x] Full relevant verification, build, dependency audit, documentation/link checks, and time-tracking reconciliation pass before delivery.

## Verification Plan

- [x] Lint/static checks: `npm run verify`, naming/path searches, Markdown link/structure review, `git diff --check`.
- [x] Tests: focused Settings/name tests, full Vitest and Playwright suites, and Rust tests.
- [x] Build: `cargo check -j1` and `npm run build:desktop`; verify the renamed portable artifact.
- [x] Manual QA: Settings/About naming is covered by the focused component regression and release metadata check; no live playback session was disturbed for a text-only rename.
- [x] Documentation review: line-by-line README/support/roadmap/AGENTS/current-state consistency checklist.
- [x] Release/config review: package, Cargo, Tauri, lockfile, binary name, remote URL, stable legacy identifiers.
- [x] Security review: high-signal secret patterns, PEM/private-key markers, credentials, absolute Windows/POSIX paths, usernames, temp paths, and git-history spot checks without printing secret values.
- [x] Time tracking review: compute total minutes from the authoritative log and reconcile task/report/time-log.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should the old Tauri/keyring/config identifiers be renamed immediately? | Resolved | No silent breakage. User-visible/package naming changes now; compatibility identifiers remain until a migration can preserve settings and credentials. |
| Is GPT-5.6 Sol Extra High a separate API price? | Resolved | No separate effort-tier tariff is needed for the estimate. Use the official GPT-5.6 Sol standard token rates current on 2026-07-15 and label the project figure approximate. |
| Should completed historical tasks be deleted from the roadmap? | Resolved | No. The forward roadmap becomes concise; detailed completed history remains available through tasks/reports and archive links. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Renaming the application identifier loses settings or credentials | Existing users appear reset or unauthenticated | Keep stable legacy runtime identifiers and add a future explicit migration task if full identifier migration is desired. |
| Bulk replacement corrupts historical facts or API IDs | Broken authentication, inaccurate audit history | Classify occurrences by user-visible name, current link, package metadata, or compatibility identifier before editing. |
| Public effort/cost figure appears exact | Misleading project claim | Derive time from `time-log.md`, label tokens/cost approximate, include snapshot date and official model-pricing link. |
| Secret scan prints or persists a real credential | Credential exposure during remediation | Search filenames/pattern classes and report locations/redacted classifications only; never echo credential values. |
| Roadmap promises unsupported dates | Misleading public expectations | Use ordered phases without dates and mark future platforms/features as planned, not supported. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md`
- Related report: `project-tracking/reports/0055-public-repository-rename-and-documentation-audit.md`
- Time log: `project-tracking/time-log.md`
- Public repository: `https://github.com/lgg/music-desktop-widget`
- PR/commit: branch `codex/0055-public-repository-refresh`; final commit and merge recorded in handoff
