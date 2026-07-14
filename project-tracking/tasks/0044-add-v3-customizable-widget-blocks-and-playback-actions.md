# 0044 - Add v3 customizable widget blocks and playback actions

## Status

Complete

## Context

After the proportional sizing pass in task [`0043`](0043-add-widget-size-presets-and-custom-dimensions.md), the user requested a version 3.0 customization pass: optional mute and like/dislike controls, configurable ordering for the six primary widget blocks, four explicit visibility behaviors for content/action rows, persisted collapsing of Settings sections, and a full audit. The current approved layout and legacy preferences must migrate without visual or interaction regressions.

The official YTMDesktop Companion API documents `player.volume`, `video.likeStatus`, and the whitelisted commands `mute`, `unmute`, `toggleLike`, and `toggleDislike`. The widget will not set or persist a numeric volume; it delegates mute/unmute restoration to YTMDesktop.

## Goal

Deliver version `3.0.0` with a persisted, accessible widget-layout editor and optional playback actions while preserving the current v2 layout as the migration default and keeping all Companion/token boundaries safe.

## Scope

Included:

- Add an optional mute button beside the status/settings/close controls, with Always, Hover, and Hidden modes.
- Derive muted presentation from Companion `player.volume`; send only `mute` or `unmute` and never set a numeric volume.
- Add a Like/Dislike block using Companion `video.likeStatus`, `toggleLike`, and `toggleDislike`.
- Replace the legacy title/progress/controls toggles with four visibility modes: Always, Hover with reserved space, Hover with dynamic/collapsed space, and Hidden.
- Apply the same four modes to the new Like/Dislike block.
- Add a persisted order for Header actions, Artwork, Track details, Progress, Like/Dislike, and Playback controls.
- Provide keyboard-accessible move-up/move-down ordering controls rather than drag-only interaction.
- Allow all top-level Settings sections to collapse and persist their collapsed state.
- Preserve the existing order and visual behavior for legacy settings.
- Validate, normalize, deduplicate, and migrate all new persisted values in TypeScript and Rust.
- Localize all new user-facing copy in matching English/Russian JSON bundles.
- Bump the centralized application version from `2.0.0` to `3.0.0`.
- Perform a full frontend/native/Companion/security/i18n/theme/version/layout/accessibility audit and fix scoped defects found.

Out of scope:

- Numeric volume adjustment or storage in the widget.
- Arbitrary/custom Companion command strings.
- Drag-only block ordering without accessible buttons.
- Hiding the Artwork block or the complete Header block; their children retain their own visibility preferences.
- Changing portable-only packaging policy, installer work, macOS support, or free border resize.

## Affected Areas

- Backend/native: Companion command enum/payload whitelist, settings model/migration, tests.
- Frontend: Settings layout editor/collapse UX, widget block composition, visibility behavior, mute and rating controls.
- Domain/API contracts: playback snapshot volume/like state, new command variants, visibility/order/settings types.
- Tests: domain mapping/controller, simulator, repository, components, localization/version, E2E geometry/order/interaction, Rust.
- Documentation: README, architecture, decisions, roadmap, task/report.
- Build/release/config: centralized version copies only; Tauri command permissions and packaging policy remain unchanged.
- Project tracking: task/report `0044`, decision `0005`, roadmap, and time log.
- Other: accessibility, hover/focus stability, frameless drag exclusions, and security review of external commands.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0044-a` |
| Started at | `2026-07-14T03:09:01.0970440+03:00` |
| Finished at | `2026-07-14T04:11:57.4635562+03:00` |
| Time spent minutes | `63` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md) iteration `2026-07-14-0044-a` |

## Acceptance Criteria

- [x] Legacy v2 settings migrate to the same order and appearance: Header, Artwork/track details, Playback controls, Progress; controls remain hover-only with reserved space.
- [x] Mute button supports Always/Hover/Hidden, reflects `player.volume`, and sends only `mute`/`unmute` without setting or persisting volume.
- [x] Like/Dislike buttons reflect `video.likeStatus`, support toggling, and use an independent four-mode visibility preference.
- [x] Track details, Progress, Like/Dislike, and Playback controls each support Always, Hover-reserved, Hover-dynamic, and Hidden.
- [x] Hover-reserved keeps geometry stable; Hover-dynamic adds/removes the row and resynchronizes native height without stuck-hover/control jitter.
- [x] The six requested blocks can be reordered, persist across reloads/windows, and malformed orders are safely normalized.
- [x] Ordering controls are keyboard accessible, localized, and clearly communicate block position and movement.
- [x] Every top-level Settings section can be collapsed/expanded and its state persists; headings remain operable after scrolling.
- [x] Default size/scaling, drag exclusions, artwork playback, themes, locales, transparency, tray/window behavior, auth, progress, and reconnect behavior remain intact.
- [x] English/Russian locale key parity and no raw user-facing copy regressions are verified.
- [x] Version `3.0.0` is synchronized through package, Cargo/lock, Tauri, Settings/About, and Companion metadata sources.
- [x] Companion commands remain a closed typed/serde enum; tokens stay keyring-backed and no sensitive details are exposed.
- [x] Targeted RED/GREEN, full frontend, Rust, E2E, dependency/security, and desktop/release checks pass or documented environment-only limitations are isolated.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Lint/static checks: targeted TypeScript plus `npm run verify`, locale/static search, `git diff --check`.
- [x] Tests: observed targeted Vitest/Rust RED, targeted GREEN, full Vitest, Rust tests, and Playwright E2E.
- [x] Build: `cargo check -j1` and release/portable `npm run build:desktop` completed.
- [x] Manual QA coverage: simulator/browser scenarios cover the four modes, ordering, collapse persistence, and command dispatch; live YTMDesktop smoke remains explicitly documented because it is unavailable in the automated environment.
- [x] Documentation review: README, architecture, decisions, roadmap, task/report, bootstrap sync, and time log.
- [x] Release/config review: centralized 3.0.0, unchanged portable-only policy, unchanged Tauri command permission surface.
- [x] Time tracking review: matching iteration fields in task, report, and time log.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| How should mute preserve the YTMDesktop volume? | Resolved | Send official `mute`/`unmute` only; derive direction from `player.volume` and never send `setVolume`. YTMDesktop owns restoration. |
| What are the legacy migration defaults? | Resolved | Details/progress Always, controls Hover-reserved when the old hover flag was enabled, Like/Dislike Hidden, Mute Hidden, and the current visual block order. |
| Should block ordering be drag-and-drop? | Resolved | Use visible Move up/Move down controls so mouse and keyboard users receive the same functionality; no drag-only dependency. |
| Which Settings sections collapse? | Resolved | Every top-level Settings section, including dev-only when present, with a normalized persisted list of collapsed section IDs. |
| Does ordering affect connection/auth fallback cards? | Resolved | The six primary blocks follow the configured order when applicable; transient auth/state cards remain functional fallback content and are not exposed as reorderable blocks. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Dynamic hover rows recreate stuck-hover/window-height jitter. | High | Keep one stable outer pointer/focus boundary, render dynamic rows only inside it, observe intrinsic layout, and add repeated-boundary E2E geometry tests. |
| Legacy booleans are lost before frontend migration. | High | Add explicit native and frontend migration tests before changing persisted models. |
| Malformed order duplicates/drops blocks. | Medium | Whitelist, deduplicate in order, and append every missing canonical block in both runtimes. |
| Incorrect command changes volume or rating unexpectedly. | High | Closed command enum; official payload tests; mute direction from current snapshot; simulator and live-smoke documentation. |
| Reordering breaks cover/state/footer spacing. | High | Replace special-case footer/hero coupling with independent ordered block wrappers and geometry regressions at Default/Custom sizes. |
| Collapsible headers lose actions or drag behavior. | Medium | Keep header toggle semantic, separate action click handling, and test reconnect/close/scroll/keyboard paths. |
| Version copies drift. | Medium | Edit root version only, run sync, and require `version:check` in the full verification. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related decisions: [`0005-use-ordered-widget-blocks-and-explicit-visibility-modes.md`](../decisions/0005-use-ordered-widget-blocks-and-explicit-visibility-modes.md)
- Related reports: [`0044-add-v3-customizable-widget-blocks-and-playback-actions.md`](../reports/0044-add-v3-customizable-widget-blocks-and-playback-actions.md)
- Official Companion API: <https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1>
- Time log: [`time-log.md`](../time-log.md), iteration `2026-07-14-0044-a`
- PR/commit: branch `codex/0044-v3-customizable-widget-blocks`
