# 0008 - Validate live Companion auth, realtime, commands, and seek against a real YTMDesktop instance

## Status

Open

## Source

- Migrated from Beads issue: `ytw-5v6.3`
- Type: Task
- Priority: P2
- Created: 2026-03-11T03:29:00Z
- Updated: 2026-03-11T03:29:00Z
- Assignee: Unassigned
- Created by: unknown

## Context

Run the implemented integration against a live local YTMDesktop Companion instance and verify the auth round-trip, realtime state updates, playback commands, reconnect behavior, and actual seek behavior. Capture any protocol mismatches or follow-up fixes as linked issues.

A 2026-07-07 protocol audit found that the implementation and README still described parts of an older Companion API contract. The backend bridge and documentation were updated to the official YTMDesktop v2 Companion Server API v1 contract before live validation.

A follow-up audit found two hardening gaps in the v2 update: stale keyring tokens could survive an `auth_required` response after the `appId` correction, and malformed seek values could still be serialized into command payloads if a caller bypassed normal UI constraints.

A deeper full-code audit found two product-runtime issues outside the Companion wire protocol: progress smoothing mixed incompatible clocks, and saved settings did not propagate from the Settings webview to the main widget webview immediately.

## Goal

Preserve and continue the work described by the migrated Beads issue in the markdown project-tracking system. Keep the code and docs aligned with the current Companion Server v2 API, then complete live validation against a real YTMDesktop instance.

## Scope

Included:

- Keep the original Beads context, status, priority, dependencies, and history visible in markdown.
- Continue or verify the product work described by this task according to the current project rules.
- Audit and correct Companion Server v2 API assumptions in native backend code and documentation.
- Harden stale-token and command-payload edge cases found during follow-up review.
- Audit and fix runtime regressions that would affect the Companion-backed widget experience.

Out of scope:

- Reopening Beads as the source of truth.
- Expanding scope beyond the migrated issue without creating or updating another markdown task.
- Treating Companion integration as fully verified without a live YTMDesktop Companion instance.

## Affected Areas

- Backend: Companion HTTP auth, metadata discovery, state requests, command requests, realtime socket setup, stale-token cleanup, settings-change event emission.
- Frontend: Tauri bridge, AppProvider settings synchronization, progress smoothing, and domain command surface reviewed.
- Database/migrations: Not applicable.
- API/contracts: YTMDesktop Companion API v2 contract is affected.
- Tests: Native unit tests added for appId constraints, v2 command payload mapping, and invalid seek clamping; Vitest regression coverage added for progress smoothing.
- Documentation: README, architecture notes, decisions, and reports must stay aligned with the current API contract.
- Deploy/config: Not applicable.
- Other: Windows-first Tauri runtime behavior remains relevant for live validation.

## Acceptance Criteria

- [x] The original Beads issue state is represented in markdown.
- [x] Companion API docs in README point to the current v2 wiki page.
- [x] Native backend uses public `GET /metadata` for discovery.
- [x] Native backend sends auth request bodies required by v2 docs.
- [x] Native backend uses a lowercase-alphanumeric `appId` that satisfies v2 constraints.
- [x] Native backend sends REST auth as the raw `Authorization` header value.
- [x] Native backend sends playback commands through `POST /api/v1/command` with `{ command, data }` payloads.
- [x] Native backend clears stale stored tokens when Companion returns auth-required during connect or command execution.
- [x] Native backend clamps invalid `seekTo` seconds to a safe `0` payload.
- [x] Progress smoothing uses the same timestamp source as Companion snapshots.
- [x] Settings saved in one Tauri webview are propagated to the other app webview.
- [x] Relevant implementation, documentation, and verification notes are captured or linked.
- [x] Live YTMDesktop Companion auth approval and durable reconnect are verified on YTMDesktop v2.0.11.
- [x] Live realtime state updates are verified on a real local instance.
- [ ] Previous, play/pause, and next commands are verified with the task `0032` portable build.
- [ ] Live seek is verified on a real local instance.
- [ ] If new work is done, update related code, tests, documentation, config, roadmap, task, and report files together.
- [ ] No known mismatch remains between UI, native backend, Companion API assumptions, tests, and docs after live validation.

## Verification Plan

- [ ] Lint/static checks: run `npm run lint` or `npm run verify` when code changes.
- [ ] Tests: run `npm test`; add targeted tests for changed logic.
- [ ] Build: run `npm run build:desktop` for release/runtime-sensitive changes.
- [ ] Manual QA: verify the affected widget/settings/Companion scenario on Windows when automation cannot cover it.
- [ ] Deploy/config review: review Tauri permissions, startup behavior, packaging, and env/config docs when touched.
- [x] Documentation review: update README, ARCHITECTURE, decisions, roadmap, tasks, and reports as applicable.

## Progress History

- 2026-07-07: Audited the implementation against the official v2 Companion Server API v1 wiki. Found outdated assumptions in README and Rust bridge: old metadata path, old command endpoints, missing auth-code request body, invalid dotted/hyphenated `appId`, and Bearer-style REST auth. Updated `src-tauri/src/companion.rs`, README, architecture notes, and decision notes to the v2 contract. Live YTMDesktop validation remains open.
- 2026-07-07: Follow-up audit found and fixed stale keyring token handling after auth-required failures and invalid seek payload edge cases. Updated `src-tauri/src/lib.rs`, `src-tauri/src/companion.rs`, and this tracking set.
- 2026-07-07: Deep full-code audit found and fixed progress smoothing clock drift and cross-window settings propagation. Updated `src/domain/playback/progress.ts`, `tests/domain/playback/progress.test.tsx`, `src/integration/companion/tauriBridge.ts`, `src/app/AppProvider.tsx`, `src-tauri/src/lib.rs`, and this tracking set.
- 2026-07-09: User confirmed successful Allow, durable authorization after reconnect, and live realtime playback state against YTMDesktop v2.0.11 after task `0031`. Task `0032` then fixed compact window sizing and realtime render churn; live command and seek confirmation remain open.
- 2026-07-13: Task `0035` traced the user's accelerated/pinned progress report to a frontend contract mismatch: official YTMDesktop v2.0.11 source treats `player.videoProgress` as elapsed seconds, while the mapper treated it as a percentage. The mapper and simulator now use elapsed seconds consistently, with unit/component/browser coverage. Live command, seek, and real-track timing confirmation remain open.

## Dependencies

- parent-child: ytw-5v6 (created 2026-03-11T06:29:00Z)
- blocks: ytw-l48.4 (created 2026-03-11T07:35:42Z)

## Related Markdown Links

- parent-child: ytw-5v6 -> [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md)
- blocks: ytw-l48.4 -> [`0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`](../tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md)

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Are there missing details from the Beads issue? | Open | Use the raw archive in `project-tracking/archive/beads-export-2026-07-05.jsonl` as the source fallback. |
| Is live Companion validation complete? | Open | Partially. Auth, durable reconnect, and realtime state are confirmed on v2.0.11; commands after task `0032` and seek remain to be confirmed. |
| Does the auth `appId` change affect existing users? | Resolved | The app now uses `ytmdesktopwidget` because v2 requires lowercase alphanumeric `appId`. If a stored token becomes invalid, the native bridge now clears it when Companion returns auth-required. |
| Can malformed seek seconds reach Companion? | Resolved | The UI already constrains normal seek input; the native command payload builder now also clamps negative or non-finite seconds to `0`. |
| Why did progress fail to move smoothly between socket updates? | Resolved | `useSmoothedProgress` compared `performance.now()` to `Date.now()` snapshot timestamps. It now uses `Date.now()` consistently. |
| What unit does Companion use for `player.videoProgress`? | Resolved | Official YTMDesktop v2.0.11 source divides `videoProgress` by `durationSeconds`, proving that `videoProgress` is elapsed seconds rather than a percentage. Task `0035` corrected the frontend mapping and simulator contract. |
| Do Settings-window changes affect the main widget immediately? | Resolved | Saved settings now emit a backend event and each Tauri webview applies the new settings payload. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migrated task loses subtle Beads context. | Medium | Keep the raw JSONL archive and the progress history in this file. |
| Runtime behavior differs from documented assumptions. | Medium | Verify with portable Windows build and live YTMDesktop Companion where required. |
| Existing stored Companion token was created under the previous invalid appId assumption. | Low | Clear stale tokens automatically on auth-required connect/command failures and use the existing re-auth flow. |
| `rust_socketio` payload shape differs from live Companion `state-update` events. | Medium | Keep realtime payload mapping isolated and verify against a live YTMDesktop instance. |
| Cross-window settings synchronization behaves differently in packaged Tauri than in static review. | Medium | Manually verify settings changes with both windows open in the portable Windows build. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Raw Beads export: [`beads-export-2026-07-05.jsonl`](../archive/beads-export-2026-07-05.jsonl)
- Report: [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../reports/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md)
