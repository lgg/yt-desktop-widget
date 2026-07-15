# 0007 - Add macOS platform support

## Status

Deferred

## Historical Source

- Migrated from Beads issue `ytw-5v6.2` on 2026-07-05.
- Originally captured future macOS window, tray, and startup planning.
- Re-scoped on 2026-07-15 to the real post-Linux platform phase.

## Context

Music Desktop Widget is Windows-first today. Linux/MPRIS is the first cross-platform target (`0056`), followed by GitHub CI/releases (`0057`) and localization scale-up (`0058`). macOS follows those foundations so its native services, artifacts, and release verification can use established platform boundaries and automation rather than one-off conditional code.

## Goal

Deliver a supported macOS build with native credential storage, window/tray/startup behavior, packaging/signing guidance, and an explicit playback-adapter matrix based only on supported public contracts.

## Scope

Included:

- Make the Tauri/Rust application compile and run on the documented macOS baseline.
- Adapt transparent windows, always-on-top behavior, drag regions, tray/menu-bar lifecycle, close semantics, and position persistence.
- Store credentials through macOS Keychain.
- Add launch-at-login through a supported macOS mechanism.
- Validate Companion and Cider local adapters where their upstream macOS applications/APIs support them.
- Research a public supported system media-session contract; ship no system adapter if none is suitable.
- Define application bundle, signing, notarization, entitlements, artifact, and clean-machine installation behavior.
- Add macOS tests/manual smoke and preserve Windows/Linux behavior.

Out of scope:

- Reusing Windows GSMTC or Linux MPRIS as if they were macOS APIs.
- Private framework calls, accessibility scraping, OCR, window-title parsing, or player injection.
- Committing Apple certificates, private keys, profiles, or credentials.
- Starting before the Linux/platform boundary and CI release prerequisites are complete.

## Affected Areas

- Backend/native: target-specific services, keychain, startup, tray, window lifecycle.
- Frontend: platform-aware source availability and recovery copy.
- Domain/API contracts: macOS adapter/capability matrix.
- Tests: macOS native build, UI lifecycle, supported adapter smoke, cross-platform regressions.
- Documentation/build/release: prerequisites, signing/notarization, artifacts, support tables.
- Security/privacy: keychain, entitlements, signing secrets, metadata boundaries.
- Project tracking: task/report, decision, roadmap, time log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `not started` |
| Started at | `pending` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `not_tracked` until implementation starts |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] The documented macOS baseline builds, launches, and exposes platform-appropriate lifecycle behavior.
- [ ] Credentials use Keychain and no secret enters frontend/plaintext storage or release artifacts.
- [ ] Window, tray/menu-bar, startup, close, position, and always-on-top behavior are verified on macOS.
- [ ] Every listed macOS playback adapter is live-verified through an official public contract.
- [ ] Unsupported system playback is stated clearly rather than implemented through private/scraping fallbacks.
- [ ] Signing/notarization secrets remain external and the artifact installs on a clean supported machine.
- [ ] Windows/Linux regressions, macOS checks, docs, task/report, roadmap, and time log pass.

## Verification Plan

- [ ] Record a macOS platform/release/security decision before implementation.
- [ ] RED/GREEN platform service tests and target-specific compile checks.
- [ ] Run frontend, Rust, and E2E suites on macOS through CI introduced by `0057`.
- [ ] Live-test each claimed adapter and all window/tray/startup flows.
- [ ] Verify signing/notarization and clean-machine install without exposing secret material.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| When does macOS work start? | Resolved | After Linux/MPRIS, GitHub CI/releases, and localization scale-up. |
| Which system-wide macOS playback API will be used? | Open | Use only a supported public contract found during design; otherwise ship Companion/Cider-only support. |
| Is Apple signing material committed? | Resolved | No; certificates/keys/profiles remain in protected external secret storage. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No suitable public system media API exists | Reduced adapter coverage | Publish the honest adapter matrix; do not use private or scraping fallbacks. |
| Platform conditionals regress Windows/Linux | Cross-platform instability | Shared service interfaces, target compile checks, CI matrix, live platform smoke. |
| Signing/notarization is misconfigured | Unlaunchable or untrusted artifacts | Dedicated decision/runbook and clean-machine verification. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Historical umbrella: [`0005`](0005-track-deferred-post-v1-roadmap-items.md)
- Linux prerequisite: [`0056`](0056-add-linux-build-and-mpris-support.md)
- CI prerequisite: [`0057`](0057-add-github-ci-builds-and-releases.md)
- Localization prerequisite: [`0058`](0058-scale-localization-and-language-selection.md)
- Raw Beads archive: [`beads-export-2026-07-05.jsonl`](../archive/beads-export-2026-07-05.jsonl)
- Report: `pending`
- Time log: `pending`
- PR/commit: `pending`
