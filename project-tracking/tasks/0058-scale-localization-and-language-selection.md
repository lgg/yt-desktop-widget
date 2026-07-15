# 0058 - Scale localization and language selection

## Status

Deferred

## Context

English and Russian are complete and the current two-option segmented control is appropriate for that small catalog. More locales will make the control noisy and inaccessible, and contributions need a repeatable key-parity, naming, fallback, and layout-validation workflow.

Task `0010`/report `0036` completed the original English-to-Russian localization milestone. This is the next, separate scale-up phase.

## Goal

Add a maintainable larger locale catalog and replace the two-button language selector with an accessible control that scales without degrading Settings layout or persistence.

## Scope

Included:

- Choose and add the next complete locale bundles based on contributor/user priority.
- Define locale identifiers, native language names, ordering, fallback, and missing-key policy.
- Replace the segmented language buttons with an accessible select/combobox or equivalent scalable picker.
- Preserve the current locale setting and migration behavior.
- Add translator guidance and automated locale key/schema parity checks.
- Validate long strings, font coverage, truncation, focus/keyboard behavior, and Settings responsiveness.

Out of scope:

- Machine-translated partial bundles presented as complete.
- macOS implementation (`0007`).
- A general Settings redesign unrelated to locale scale.

## Affected Areas

- Frontend: i18n registry, Settings language control, layout/accessibility.
- Tests: key parity, fallback, persistence, keyboard selection, long-copy geometry.
- Documentation: supported languages and contributor translation workflow.
- Project tracking: task/report, roadmap, time log.

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

- [ ] New locale bundles are complete, reviewed, and exactly match the canonical key schema.
- [ ] The picker remains usable by keyboard, screen reader, mouse, and at the shipped Settings width with a larger catalog.
- [ ] Existing English/Russian preferences migrate without reset; English remains the fallback.
- [ ] Native language names and locale ordering are consistent and documented.
- [ ] Long translations do not clip critical controls or create horizontal overflow.
- [ ] README support tables, translator guidance, tests, task/report, roadmap, and time log agree.

## Verification Plan

- [ ] RED/GREEN tests for the scalable picker, persistence, and fallback.
- [ ] Automated locale key/schema parity for every bundle.
- [ ] Component/E2E keyboard and reload-persistence checks.
- [ ] Visual geometry pass with longest representative strings.
- [ ] Full frontend/native build and documentation review.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Which locales are next? | Open | Prioritize from real contributors/users before implementation. |
| Should the control remain segmented buttons? | Resolved | No. The next phase uses a scalable accessible picker designed for many locales. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Partial or low-quality translations ship as supported | Poor UX and trust | Require complete key parity and human review before listing support. |
| Larger language names break Settings layout | Clipping/overflow | Responsive control, long-string fixtures, real geometry checks. |
| Locale identifiers drift | Broken persistence/fallback | Central typed registry and explicit migration tests. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Completed baseline: [`0010`](0010-expand-localization-beyond-the-english-only-v1-bundle.md), [`0036`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
- Report: `pending`
- Time log: `pending`
- PR/commit: `pending`
