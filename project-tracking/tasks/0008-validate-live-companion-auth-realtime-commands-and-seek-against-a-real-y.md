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

## Goal

Preserve and continue the work described by the migrated Beads issue in the markdown project-tracking system. Keep the code and docs aligned with the current Companion Server v2 API, then complete live validation against a real YTMDesktop instance.

## Scope

Included:

- Keep the original Beads context, status, priority, dependencies, and history visible in markdown.
- Continue or verify the product work described by this task according to the current project rules.
- Audit and correct Companion Server v2 API assumptions in native backend code and documentation.
- Harden stale-token and command-payload edge cases found during follow-up review.

Out of scope:

- Reopening Beads as the source of truth.
- Expanding scope beyond the migrated issue without creating or updating another markdown task.
- Treating Companion integration as fully verified without a live YTMDesktop Companion instance.

## Affected Areas

- Backend: Companion HTTP auth, metadata discovery, state requests, command requests, realtime socket setup, stale-token cleanup.
- Frontend: Tauri bridge and domain command surface reviewed; no UI contract change required in this audit.
- Database/migrations: Not applicable.
- API/contracts: YTMDesktop Companion API v2 contract is affected.
- Tests: Native unit tests added for appId constraints, v2 command payload mapping, and invalid seek clamping.
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
- [x] Relevant implementation, documentation, and verification notes are captured or linked.
- [ ] Live YTMDesktop Companion auth, realtime, commands, and seek are verified on a real local instance.
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
| Is live Companion validation complete? | Open | No. The code now matches the official v2 docs, but a real local YTMDesktop Companion instance is still required for auth, realtime, commands, and seek verification. |
| Does the auth `appId` change affect existing users? | Resolved | The app now uses `ytmdesktopwidget` because v2 requires lowercase alphanumeric `appId`. If a stored token becomes invalid, the native bridge now clears it when Companion returns auth-required. |
| Can malformed seek seconds reach Companion? | Resolved | The UI already constrains normal seek input; the native command payload builder now also clamps negative or non-finite seconds to `0`. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migrated task loses subtle Beads context. | Medium | Keep the raw JSONL archive and the progress history in this file. |
| Runtime behavior differs from documented assumptions. | Medium | Verify with portable Windows build and live YTMDesktop Companion where required. |
| Existing stored Companion token was created under the previous invalid appId assumption. | Low | Clear stale tokens automatically on auth-required connect/command failures and use the existing re-auth flow. |
| `rust_socketio` payload shape differs from live Companion `state-update` events. | Medium | Keep realtime payload mapping isolated and verify against a live YTMDesktop instance. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Raw Beads export: [`beads-export-2026-07-05.jsonl`](../archive/beads-export-2026-07-05.jsonl)
- Report: [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../reports/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md)
