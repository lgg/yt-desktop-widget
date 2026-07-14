# 0046 - Add opt-in local playback history, favorites, and export

## Status

Deferred

## Context

Windows Media Session does not expose Like/Dislike. After adding WMS as a playback source in task `0045`, the user wants a future opt-in local history so a Like action can mark the current WMS track as a local favorite by title and later provide a convenient copy/export list.

Listening history is personal data. This task must define explicit consent, retention, deduplication, storage, deletion, and export behavior before implementation.

## Goal

Provide an optional local-only WMS playback history with local favorite marking and convenient copy/export, while keeping history fully disabled by default and preserving safe no-op Like behavior when it is off.

## Scope

Included:

- Add a WMS-only setting to enable or disable local playback history; default Disabled.
- Record normalized track identity and useful display metadata only after opt-in.
- Define when a track counts as played and how duplicate/repeated sessions are handled.
- When WMS history is enabled, allow Like to toggle a local favorite for the current history item.
- When history is disabled, keep WMS Like/Dislike non-operable safe no-ops.
- Add a history/favorites view with search/filter where appropriate.
- Add one-click copy and file export for favorited tracks in a documented text/CSV/JSON format selected during design.
- Provide clear/delete-all controls and retention/size limits.
- Keep all data local; add no cloud sync or telemetry.
- Add migration, corruption recovery, privacy/security review, tests, docs, task/report, and time tracking.

Out of scope:

- Sending likes back to Spotify, Apple Music, Yandex Music, or other source services.
- Cloud synchronization, accounts, telemetry, or sharing history automatically.
- Scraping source application UIs or private databases.
- Companion-mode replacement for the official Like/Dislike API.

## Affected Areas

- Backend/native: local history storage, bounded retention, atomic writes, export/copy bridge if needed.
- Frontend: opt-in setting, history/favorites view, local Like state and disabled-state messaging.
- Domain/API contracts: track identity, history entry, favorite state, export model.
- Tests: consent/default-off, dedupe, retention, favorite toggle, corruption, deletion, export, source switching.
- Documentation: privacy/data behavior, README, architecture, decision, roadmap, task/report.
- Build/release/config: no network or packaging change expected.
- Project tracking: task/report and roadmap status.
- Other: user data/privacy and data-loss expectations.

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

- [ ] History is disabled by default and no media metadata is written before explicit opt-in.
- [ ] Enabling/disabling history is WMS-specific, persisted, localized, and clearly explains local personal-data storage.
- [ ] A documented played-track threshold and stable normalized identity prevent noisy duplicates.
- [ ] WMS Like toggles a local favorite only while history is enabled; otherwise Like/Dislike remain safe no-ops.
- [ ] Favorite state survives restarts and is associated with enough track metadata to remain useful without a service-specific ID.
- [ ] Users can review, copy, export, un-favorite, and delete their local data.
- [ ] Retention/size is bounded and corrupted storage recovers safely without losing app startup.
- [ ] Source switches do not write Companion metadata into WMS history or interfere with official Companion Like/Dislike.
- [ ] No cloud sync, telemetry, external network traffic, or secret storage is introduced.
- [ ] Privacy/security review and full frontend/native/E2E/release checks pass.
- [ ] Related docs, decision, roadmap, task/report, and time log are updated.

## Verification Plan

- [ ] Architecture/privacy decision covering consent, schema, retention, deletion, and export.
- [ ] RED/GREEN unit tests for history lifecycle, identity, dedupe, favorite toggle, default-off, and corruption recovery.
- [ ] Component/E2E tests for settings, history view, copy/export, clear flow, and source switching.
- [ ] Native atomic-storage and bounded-retention tests.
- [ ] Security audit confirming local-only behavior and no metadata logging/network transmission.
- [ ] Full `npm run verify`, Rust, E2E, version, and portable build checks.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Is history enabled by default? | Resolved | No; explicit opt-in is required. |
| Does WMS Like call the source app? | Resolved | No; it marks the local history record only when history is enabled. |
| What happens when history is disabled? | Resolved | WMS rating actions remain disabled/safe no-ops. |
| Which fields form track identity? | Open | Decide after sampling Apple Music, Spotify, and Yandex Music WMS metadata; likely normalized title + artist + duration with source app as supporting data. |
| When is a track counted as played? | Open | Define a threshold that avoids recording brief previews/skips. |
| Which export formats are required? | Open | Select copy-friendly text plus at least one structured format during design. |
| What retention limit should apply? | Open | Define a bounded entry count and deletion semantics before implementation. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| History stores personal listening data unexpectedly. | High | Default off, explicit explanation/consent, local-only storage, delete-all, no telemetry. |
| Title-based identity merges different tracks or splits the same track. | Medium | Normalize carefully, include artist/duration/source hints, expose history editing/removal. |
| Unbounded history grows indefinitely. | Medium | Fixed retention/size policy and tested pruning. |
| Export leaks data unintentionally. | Medium | User-initiated export only, clear destination/content, no automatic sharing. |
| Local Like conflicts with official Companion rating. | High | Feature only applies in WMS mode with history enabled; keep source-specific capability routing. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Parent/source task: [`0045-add-windows-media-session-playback-source.md`](0045-add-windows-media-session-playback-source.md)
- Related decision: [`0006-separate-product-playback-source-from-development-source-mode.md`](../decisions/0006-separate-product-playback-source-from-development-source-mode.md)
- Related reports: `pending`
- Time log: `pending`
- PR/commit: `pending`
