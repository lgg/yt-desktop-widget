# 0039 - Balance widget vertical spacing and header alignment

## Status

Completed

## Context

The user tested the version `2.0.0` portable widget with track details and playback controls hidden in several combinations. Three related visual regressions are visible in the supplied screenshots: the progress row sits closer to the artwork than to the lower widget edge, the `Live` status badge is not vertically centered against the settings/close buttons, and artwork-only layouts leave visibly more space above the artwork than below it. The artwork also needs an objective centering check rather than relying on visual estimation.

## Goal

Give every compact widget configuration a deliberate, balanced vertical rhythm: align all header controls on one center line, center the artwork within the available content area, and give the progress row equal visual breathing room above and below.

## Scope

Included:

- Measure rendered geometry for the three supplied display configurations.
- Align the connection badge and window action buttons on one vertical center line.
- Balance artwork top/bottom spacing when details, controls, and/or progress are hidden.
- Balance the progress row between the artwork and the bottom widget edge.
- Add automated layout regressions and preserve hover-only visibility behavior.

Out of scope:

- Artwork size, corner radius, playback behavior, progress timing, themes, or localization changes.
- Manual widget resizing or new size presets.
- Native backend, Companion API, packaging, or settings-schema changes.

## Affected Areas

- Backend/native: Not expected.
- Frontend: Widget layout CSS and, only if required by root-cause evidence, minimal widget markup classes.
- Domain/API contracts: Not expected.
- Tests: Playwright geometry assertions and focused component regressions if markup changes.
- Documentation: Task, report, roadmap, and time log.
- Build/release/config: No policy/config changes; validate the portable desktop build.
- Project tracking: Task/report `0039`, roadmap status/counts, and iteration time.
- Other: Supplied screenshots are the visual reference for intended balance.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0039-a`                              |
| Started at         | `2026-07-13T23:11:58+03:00`                      |
| Finished at        | `2026-07-13T23:31:44+03:00`                      |
| Time spent minutes | `20`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0039-a` |

## Acceptance Criteria

- [x] The `Live` badge and settings/close buttons share the same vertical center line within one CSS pixel.
- [x] Artwork-only and header-visible compact layouts have balanced artwork top/bottom breathing room rather than a visibly top-heavy composition.
- [x] When only artwork and progress remain, the progress row is visually centered between the artwork bottom and widget bottom edge.
- [x] Artwork remains horizontally centered and retains its existing dimensions and corner radius.
- [x] All existing hidden/hover-only display combinations remain stable without widget-height jitter.
- [x] Focused layout tests fail against the current geometry and pass after the minimal fix.
- [x] `npm run verify`, `npm run test:e2e`, and `npm run build:desktop` pass, or any limitation is recorded.
- [x] Roadmap, task, report, and time log agree before handoff.

## Verification Plan

- [x] Inspect current widget DOM/CSS and measure bounding boxes for header, artwork, progress, and widget content in the three reproduced configurations.
- [x] Add Playwright assertions for header center alignment, artwork centering/balanced gaps, and progress vertical rhythm; run them RED before production changes.
- [x] Run focused Playwright tests after the CSS fix and capture the new numeric geometry.
- [x] Run `npm run verify` and the complete `npm run test:e2e` suite.
- [x] Run `npm run build:desktop` and confirm the portable EXE output.
- [x] Run focused formatting and `git diff --check`.
- [x] Reconcile task/report/roadmap/time-log timestamps and Git delivery state.

## Questions and Answers

| Question                                                   | Status   | Answer / Decision                                                                                                                         |
| ---------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Should the artwork dimensions change to create balance?    | Resolved | No. Preserve artwork geometry and correct the surrounding layout rhythm.                                                                  |
| Should hidden header controls collapse their reserved row? | Resolved | Preserve current hover behavior; balance both visible and fully hidden states without pointer-triggered size changes.                     |
| Is the centering issue visual only?                        | Resolved | No. The header used top-edge alignment, producing a measured `3.70px` center delta; the artwork itself was already horizontally centered. |

## Risks

| Risk                                                                | Impact | Mitigation                                                                               |
| ------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| A global padding change fixes one configuration but breaks another. | High   | Reproduce all three configurations and assert each geometry independently.               |
| Collapsing reserved space reintroduces hover jitter.                | High   | Keep visibility transitions layout-stable and test hovered/unhovered dimensions.         |
| Pixel-perfect assertions become platform-fragile.                   | Medium | Assert stable geometric relationships with a one-pixel tolerance, not screenshot hashes. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0033-fix-widget-display-preference-layout.md`](0033-fix-widget-display-preference-layout.md)
- Related task: [`0035-fix-hover-progress-and-connection-badge.md`](0035-fix-hover-progress-and-connection-badge.md)
- Related task: [`0037-remove-artwork-playback-icon-background.md`](0037-remove-artwork-playback-icon-background.md)
- Time log: [`time-log.md`](../time-log.md)
- Report: [`0039-balance-widget-vertical-spacing-and-header-alignment.md`](../reports/0039-balance-widget-vertical-spacing-and-header-alignment.md)
- PR/commit: branch `codex/0039-balance-widget-spacing`; commit/merge pending at report write
