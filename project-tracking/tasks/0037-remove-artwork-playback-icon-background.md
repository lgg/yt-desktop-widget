# 0037 - Remove artwork playback icon background

## Status

Completed

## Context

Task `0036` added an optional artwork-wide play/pause control. Live visual feedback showed that the hover indicator rendered the action inside a translucent circular glass background. The intended design is a large standalone semi-transparent play or pause glyph over the artwork, without any circle, border, background, or blur. A glyph-only drop shadow is retained for contrast on bright artwork without recreating a container or backdrop.

## Goal

Keep the entire artwork clickable while replacing the circular artwork action treatment with only a large semi-transparent play/pause icon matching the current circle's approximate 78 px size.

## Scope

Included:

- Remove the full-artwork hover tint behind the playback glyph.
- Remove the playback glyph wrapper's border, circular radius, background, shadow, and backdrop blur.
- Increase the SVG glyph from 38 px to approximately the current 78 px circle size.
- Keep a subtle drop shadow on the SVG paths only so the bare glyph remains legible on light artwork.
- Preserve hover/focus visibility, opacity transition, accessible label, focus outline, and full-artwork click/keyboard behavior.
- Add browser-level computed-style regression coverage and visually inspect the target-size widget.

Out of scope:

- Changing artwork click behavior, settings, localization, widget height, transport controls, or Companion commands.
- Changing the icon artwork itself beyond its rendered size and opacity.

## Affected Areas

- Backend/native: Not applicable.
- Frontend: Artwork playback indicator CSS only.
- Domain/API contracts: Unchanged.
- Tests: Focused Playwright computed-style assertions and existing component regressions.
- Documentation: Roadmap, task, report, and time log.
- Build/release/config: Unchanged; version remains `2.0.0` and portable-only policy remains in effect.
- Project tracking: New task/report `0037` and roadmap counts.
- Other: Visual hierarchy, hover/focus accessibility, and transparent artwork overlay.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0037-a`                              |
| Started at         | `2026-07-13T21:28:35+03:00`                      |
| Finished at        | `2026-07-13T21:47:36+03:00`                      |
| Time spent minutes | `20`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0037-a` |

## Acceptance Criteria

- [x] The artwork action has no circular background, border, radius, container shadow, or backdrop blur.
- [x] Hover does not add a tint across the full artwork.
- [x] Only the play/pause SVG and its glyph-only contrast shadow are visible over the artwork.
- [x] The play/pause SVG is approximately 78 px, matching the former circle's visual size.
- [x] The glyph remains semi-transparent and becomes visible only on widget hover or keyboard focus.
- [x] The entire artwork remains clickable/focusable and sends exactly one play/pause command.
- [x] Focus treatment and localized accessible action labels remain unchanged.
- [x] Related tests, roadmap, task, report, and time log are updated.
- [x] No unrelated or native files are included in the change.

## Verification Plan

- [x] RED: Playwright computed-style assertions failed against the old circle/tint, then a contrast assertion failed before the SVG-only drop shadow was added.
- [x] GREEN: the focused browser scenario passed after each minimum CSS change.
- [x] Static/full tests: `npm run verify` passed with 55 tests.
- [x] Browser regression: `npm run test:e2e` passed with 8 scenarios.
- [x] Desktop build: `npm run build:desktop` produced the Tauri `2.0.0` executable.
- [x] Manual QA: inspected 336×520 idle and hover screenshots in headed Chromium.
- [x] Documentation review: roadmap/task/report/time log agree.
- [x] Release/config review: version and packaging configuration are untouched.
- [x] Time tracking review: task/report/time-log values match.

## Questions and Answers

| Question                                         | Status   | Answer / Decision                                                                  |
| ------------------------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| Should the full artwork remain the click target? | Resolved | Yes. Only the visual indicator changes.                                            |
| What size should the standalone glyph use?       | Resolved | Approximately 78 px, matching the diameter of the removed circle.                  |
| Should any artwork-wide tint remain on hover?    | Resolved | No. The user asked for only the semi-transparent glyph over the unchanged artwork. |

## Risks

| Risk                                                       | Impact | Mitigation                                                                                            |
| ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| A bare 78 px glyph becomes visually dominant.              | Low    | Keep it semi-transparent and visible only during hover/focus.                                         |
| Removing the background reduces contrast on light artwork. | Low    | A subtle SVG drop shadow follows only the glyph; no background shape or artwork tint is reintroduced. |
| CSS-only regression returns later.                         | Medium | Assert computed browser styles instead of only DOM class names.                                       |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0036-add-display-controls-localization-and-central-versioning.md`](0036-add-display-controls-localization-and-central-versioning.md)
- Related report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
- Report: [`0037-remove-artwork-playback-icon-background.md`](../reports/0037-remove-artwork-playback-icon-background.md)
- Time log: [`time-log.md`](../time-log.md)
- PR/commit: pending
