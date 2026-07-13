# 0036 - Add display controls, localization, and central versioning

## Status

Completed

## Context

After task `0035`, the user confirmed the rebuilt widget works correctly against a real YTMDesktop Companion instance and requested the remaining validation backlog be reconciled. The same pass adds compact-layout control over track details, optional play/pause control across the artwork, Russian localization with English remaining the default, a UI Display ordering correction, and a centralized application version bump to `2.0.0`.

## Goal

Make the widget more configurable without changing existing defaults, complete English/Russian UI localization, ensure every version consumer derives from one authoritative value, and close or defer the stale roadmap backlog according to verified state.

## Scope

Included:

- Add a persisted setting that removes the title/artist block from layout and resynchronizes intrinsic widget height.
- Add an opt-in artwork-wide play/pause button whose action icon appears on widget hover and remains keyboard accessible.
- Move the theme selector to the first position in `UI Display`.
- Keep English as the default locale, add persisted English/Russian selection, add `ru.json`, and audit user-facing interface strings for localization coverage.
- Make the root package version authoritative, show that version in the interface, synchronize required Tauri/Cargo metadata, and add an automated version-consistency check.
- Bump the application version to `2.0.0`.
- Record the user's live Companion/portable confirmation and reconcile tasks `0001`, `0002`, `0005`, `0008`, `0010`, `0012`, and `0014`.
- Add focused component/native/version tests and browser smoke coverage.

Out of scope:

- Re-enabling installer packaging.
- Implementing the remaining post-v1 deferred features such as manual resize, macOS, alternate window modes, or richer diagnostics.
- Changing Companion authentication, token storage, or wire endpoints.

## Affected Areas

- Backend/native: persisted settings schema and Cargo/Tauri version metadata.
- Frontend: Settings ordering and controls, widget layout, artwork interaction, locale selection, version presentation.
- Domain/API contracts: UI settings gain track-details, artwork-control, and locale fields; Companion command contract is unchanged.
- Tests: Rust settings round-trip, React component/provider tests, locale/version checks, Playwright smoke.
- Documentation: README, roadmap, related tasks/reports, central version workflow.
- Build/release/config: version `2.0.0`, portable build verification, packaging policy unchanged.
- Project tracking: task/report/time log and reconciliation of the active backlog.
- Other: accessibility, localized layout length, WebView2 hover/keyboard behavior.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0036-a`                              |
| Started at         | `2026-07-13T20:26:55+03:00`                      |
| Finished at        | `2026-07-13T21:10:42+03:00`                      |
| Time spent minutes | `44`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | [`project-tracking/time-log.md`](../time-log.md) |

## Acceptance Criteria

- [x] `Hide track title and artist` is persisted, defaults off, removes the details block from layout, and allows intrinsic widget height to shrink.
- [x] `Use artwork as play/pause control` is persisted, defaults off, and leaves current artwork behavior unchanged when disabled.
- [x] When artwork control is enabled, the full artwork is clickable/focusable and invokes the existing play/pause command exactly once.
- [x] The artwork shows the correct play or pause action icon only while the widget is hovered or the artwork control is keyboard-focused.
- [x] The artwork control has an accessible action label and visible focus treatment.
- [x] Theme selection is the first setting in the `UI Display` section.
- [x] English remains the default locale and English/Russian can be selected and persisted from Settings.
- [x] English and Russian locale files have matching keys and all identified user-facing UI copy is sourced from locale JSON.
- [x] The root package version is the documented source of truth, all required consumers are synchronized/validated, and the displayed/build version is `2.0.0`.
- [x] User-confirmed live/portable backlog tasks are completed, future-only post-v1 work remains explicitly deferred, and roadmap counts match task files.
- [x] Focused tests are observed failing before implementation and passing afterward.
- [x] `npm run verify`, `npm run test:e2e`, `cargo test -j1`, `cargo check -j1`, and `npm run build:desktop` pass; unavailable rustfmt is documented in the report.
- [x] Related code, docs, tests, config, roadmap, task, report, decision, and time-log files are updated; bootstrap sync is not applicable.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`.
- [x] No mismatch remains between frontend, native backend, Companion API assumptions, tests, docs, and release/config.

## Verification Plan

- [x] Architecture audit: map settings persistence, widget auto-height, artwork interaction, i18n key usage, and version consumers.
- [x] TDD: focused RED/GREEN tests for every new setting, locale behavior/key parity, theme order, artwork commands, and version consistency.
- [x] Lint/static checks: `npm run verify`, version consistency check, and `cargo check -j1`.
- [x] Tests: focused Vitest/native suites, full Vitest, `npm run test:e2e`, and `cargo test -j1`.
- [x] Build: `npm run build:desktop` and inspect the final executable/version metadata where available.
- [x] Manual QA: browser preview in English/Russian, compact layout combinations, artwork hover/focus/click, and Settings ordering.
- [x] Documentation review: README, roadmap, related tasks/reports, decision record, and time log.
- [x] Release/config review: version source/sync, portable-only packaging, Tauri permissions, and bootstrap impact.
- [x] Time tracking review: task, report, and time-log values match.

## Questions and Answers

| Question                                                          | Status   | Answer / Decision                                                                                                                              |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Should the new display controls change existing users by default? | Resolved | No. Track details stay visible and artwork stays non-interactive until the user opts in.                                                       |
| Does hiding track details reserve space?                          | Resolved | No. Match the progress-row preference: remove the block from layout and resync intrinsic height.                                               |
| When should the artwork action icon appear?                       | Resolved | On widget hover, and also on keyboard focus so the control remains discoverable without a pointer.                                             |
| What is the default language?                                     | Resolved | English. Russian is selectable and persisted explicitly.                                                                                       |
| What is the authoritative version source?                         | Resolved | Root `package.json`; other required metadata is synchronized and checked against it.                                                           |
| How should old roadmap tasks be handled?                          | Resolved | Complete work confirmed by the user's live/portable test; keep unimplemented post-v1 items deferred rather than pretending they are delivered. |

## Risks

| Risk                                                            | Impact | Mitigation                                                                                             |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Removing track details creates unexpected spacing combinations. | Medium | Test details/progress/controls combinations and browser heights.                                       |
| Artwork click conflicts with window drag or image semantics.    | Medium | Use a real button only in opt-in mode, preserve no-drag interaction, and test click/keyboard behavior. |
| Russian copy overflows the existing Settings layout.            | Medium | Inspect both locales at the target window width and preserve wrapping.                                 |
| Persisted locale cannot update both Tauri webviews immediately. | Medium | Reuse the existing settings event path and test provider rerender behavior.                            |
| Version duplication drifts again.                               | High   | Define one source, add sync/check automation, and run it inside `npm run verify`.                      |
| Closing migrated tasks hides unresolved future work.            | Medium | Close only confirmed/delivered tasks; keep post-v1 child tasks and their umbrella explicitly deferred. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Related task: [`0035-fix-hover-progress-and-connection-badge.md`](0035-fix-hover-progress-and-connection-badge.md)
- Localization task: [`0010-expand-localization-beyond-the-english-only-v1-bundle.md`](0010-expand-localization-beyond-the-english-only-v1-bundle.md)
- Live validation task: [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md)
- Time log: [`time-log.md`](../time-log.md)
- Report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
- Decision: [`0003-use-package-json-as-central-version-source.md`](../decisions/0003-use-package-json-as-central-version-source.md)
- PR/commit: pending
