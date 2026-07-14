# 0044 - Add v3 customizable widget blocks and playback actions report

## Summary

Delivered the version `3.0.0` widget-customization pass. The widget now supports optional mute and rating actions, independent four-state visibility for content/action rows, persisted ordering for all six primary UI blocks, and persisted collapse state for every top-level Settings section. Legacy v2 preferences migrate to the approved pre-v3 layout and behavior.

The audit also fixed an initially found reserved-progress opacity defect, kept one stable hover/focus boundary for dynamic rows, validated new persisted values in both TypeScript and Rust, and preserved the existing keyring, Tauri-permission, portable-packaging, theme, localization, sizing, drag, progress, and reconnect boundaries.

## Done

- Added an optional header mute button with Always, Hover, and Hidden modes.
- Derived mute state from Companion `player.volume` and dispatch only official `mute`/`unmute` commands; the widget never writes or stores a numeric volume.
- Added Like/Dislike controls that reflect `video.likeStatus` and dispatch `toggleLike`/`toggleDislike`.
- Added Always, Hover with reserved space, Hover with dynamic height, and Hidden modes for Track details, Progress, Like/Dislike, and Playback controls.
- Added a keyboard-accessible order editor for Header actions, Artwork, Track details, Like/Dislike, Playback controls, and Progress.
- Added semantic, persisted collapse/expand behavior for all Settings sections.
- Added frontend and native migration/normalization for malformed, duplicate, missing, and legacy values.
- Added English/Russian locale parity for all new interface copy.
- Centralized and synchronized application version `3.0.0` across package, Cargo, runtime, Settings/About, and Windows EXE metadata.
- Updated README, architecture, roadmap, task, decision, report, and time tracking.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0044-a` |
| Started at | `2026-07-14T03:09:01.0970440+03:00` |
| Finished at | `2026-07-14T04:11:57.4635562+03:00` |
| Time spent minutes | `63` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md), iteration `2026-07-14-0044-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Added closed mute/rating command variants plus native settings migration and normalization. |
| Frontend | Changed | Added ordered blocks, visibility modes, header mute, rating controls, section collapse UX, and layout styles. |
| Domain/API contracts | Changed | Extended playback snapshot, commands, UI settings, block IDs, visibility modes, and Settings section IDs. |
| Tests | Changed | Added/updated mapping, controller, simulator, settings repository, component, migration, geometry, interaction, and E2E coverage. |
| Documentation | Changed | Updated README, architecture, ADR, roadmap, task, and this report. |
| Build/release/config | Changed | Synchronized version `3.0.0`; portable-only packaging and Tauri permission surface are unchanged. |
| Bootstrap sync | Not applicable | No shared process/bootstrap rule changed in this pass. |
| Time tracking | Changed | Recorded iteration `2026-07-14-0044-a` in task, report, and time log. |
| Project tracking | Changed | Closed task `0044`, accepted decision `0005`, and updated roadmap totals. |

## Changed Files

- Native/API: `src-tauri/src/companion.rs`, `src-tauri/src/models.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`.
- Domain/integration: `src/domain/playback/`, `src/integration/simulator/`.
- App/UI: `src/app/`, `src/components/icons.tsx`, `src/components/settings/SettingsSection.tsx`, `src/components/widget/RatingControls.tsx`, `src/styles/global.css`.
- Localization: `src/locales/en.json`, `src/locales/ru.json`.
- Tests: colocated frontend tests plus `tests/app/`, `tests/domain/`, and `tests/e2e/widget.spec.ts`.
- Version/docs/tracking: `package.json`, lockfiles, `README.md`, `ARCHITECTURE.md`, and task/decision/roadmap/report/time-log files under `project-tracking/`.

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| TDD / targeted checks | Passed | New contracts and UI behavior were introduced with failing tests, then brought to green; targeted Widget/Settings suites reached 41/41 before the full pass. |
| `npm run verify` | Passed | Version check, ESLint, 17 Vitest files / 102 tests, TypeScript, and Vite production build all exited 0. |
| Playwright E2E | Passed | 15/15 browser scenarios, including v3 persistence/actions/order, reserved vs dynamic geometry, light theme, localization, progress timing, Settings scrolling, and hover/focus behavior. |
| `cargo test -j1` | Passed | 25/25 tests, including command payloads, migrations, normalization, keyring, error confidentiality, settings durability, and window sizing. |
| `cargo check -j1` | Passed | Tauri/native code compiled as `ytm-desktop-widget v3.0.0`. |
| `npm audit --omit=dev` | Passed | 0 production vulnerabilities. |
| `git diff --check` | Passed | No whitespace errors after normalizing the changed Rust model file. |
| `npm run build:desktop` | Passed | Release build produced `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Windows EXE metadata | Passed | `FileVersion` and `ProductVersion` are `3.0.0`; SHA-256 `B6B8BA451B76E4A83195FEC5D6DFC979BFE0DB71E97F8A950B028F7836254E9C`. |
| Localization/theme/version audit | Passed | English/Russian key parity and light-theme/version E2E passed; `version:check` reports synchronized `3.0.0`. |
| Security/integration audit | Passed | Companion commands remain closed typed variants, no numeric-volume command exists, token/keyring code is unchanged, response-body confidentiality tests pass, and no permission expansion was added. |
| Documentation/release review | Passed | README/architecture/ADR/tracking updated; portable-only policy and bootstrap sync remain unchanged. |

Notes:

- The repository-wide `npm run format:check` and default `cargo fmt --check` still report the longstanding project-wide formatting/line-ending baseline outside this scoped pass. They are not part of `npm run verify`; applying them globally would rewrite unrelated user-owned files. The changed Rust model was locally normalized and `git diff --check` is clean.
- The normal Playwright managed `webServer` process does not terminate reliably in this Codex shell after assertions. The same production build was therefore served separately and the complete suite was run with a temporary no-webServer audit config, which was removed immediately after the clean 15/15 result.

## Not Verified

- Live clicks against a separately running YTMDesktop Companion instance were not available inside the automated environment. Official payload mapping, simulator behavior, native request serialization, and browser dispatch are covered; a user-side portable smoke remains recommended for actual mute restoration and live like-status refresh timing.
- Native WebView visual feel for Hover-dynamic height changes still benefits from the same portable smoke. Browser geometry and native size-compilation paths passed, with no known blocking defect.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| How is the previous YTMDesktop volume preserved? | The widget sends only `mute` or `unmute`; YTMDesktop owns and restores its numeric volume. |
| How are legacy booleans migrated? | Details/progress become Always; old hover-only controls become Hover-reserved; new rating and mute controls default Hidden; canonical order preserves v2 appearance. |
| How can keyboard users reorder blocks? | Every row has localized Move up/Move down buttons with disabled boundary actions and descriptive accessible labels. |
| What happens to malformed persisted arrays? | Both frontend and Rust whitelist, deduplicate in order, and append missing canonical identifiers. |
| Does this change packaging or permissions? | No. The release remains portable-only and no Tauri permission/capability was added. |

## Open Questions

None blocking. Live YTMDesktop behavior is a release-smoke activity rather than an unresolved implementation decision.

## Residual Risks

- Companion state refresh timing after mute/rating commands is controlled by YTMDesktop realtime updates; automated coverage verifies dispatch and mapping, not every live client build.
- Arbitrary user ordering intentionally permits unconventional but valid compositions.
- Hover-dynamic mode intentionally changes native window height; the stable interaction boundary and regression coverage prevent the previously observed stuck-hover loop, but final subjective motion should be confirmed in the portable app.

## Next Steps

- Run a brief portable smoke with live YTMDesktop: mute/unmute restoration, like/dislike state refresh, two or three block reorder permutations, and one Hover-dynamic row.
- Continue only the explicitly deferred roadmap items (macOS, installer return, visual refinement/window modes, and reconnect/runtime diagnostics) when prioritized.
