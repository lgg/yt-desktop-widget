# 0045 - Add Windows Media Session playback source report

## Summary

Delivered version `3.1.0` with two independent production playback sources: the existing YTMDesktop Companion integration and a Windows Media Session/GSMTC adapter for the current system-selected compatible player. Companion remains the persisted migration default, while the existing simulator mode remains a separate development override.

The first Settings section now selects the playback source. WMS maps current-session metadata, artwork, timeline, state, and published transport capabilities into the existing controller. Like/Dislike and Mute are disabled by capabilities and are successful no-ops at both TypeScript and Rust boundaries, so visible legacy/user-configured controls cannot crash, hang, reconnect, or contact Companion.

## Done

- Added persisted `playbackSource` with safe frontend/native migration to `companion`.
- Added the first `Playback Source` Settings section, localized in English and Russian.
- Hid Companion endpoint/auth UI in WMS mode and documented compatibility/limitations.
- Added a Windows-gated Rust GSMTC manager for current-session metadata, artwork, timeline, playback state, capabilities, transport, seek, lifecycle, and changed-state emission.
- Added a WMS TypeScript gateway that requires Tauri, has no pairing flow, and isolates WMS events/commands from Companion.
- Added explicit snapshot capabilities for play/pause, previous, next, seek, mute, and rating.
- Made artwork, transport, progress, rating, and mute UI capability-aware without mutating saved layout preferences.
- Added defense-in-depth no-op handling for WMS rating and mute commands in both gateway layers.
- Preserved simulator/browser behavior and Companion auth/keyring/network behavior.
- Added migration, mapping, lifecycle, Settings, Widget, gateway, native no-op, and E2E source-order/persistence coverage.
- Updated README, AGENTS, architecture, decisions, roadmap, task/report, and future history task.
- Added deferred task `0046` for default-off local WMS history, local favorites, copy/export, deletion, retention, corruption recovery, and privacy design.
- Synchronized version `3.1.0` and verified portable EXE version metadata.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-14-0045-a` |
| Started at | `2026-07-14T04:16:46.1292979+03:00` |
| Finished at | `2026-07-14T05:34:48.2025299+03:00` |
| Time spent minutes | `79` |
| Tracking status | `tracked` |
| Time log row | [`project-tracking/time-log.md`](../time-log.md), iteration `2026-07-14-0045-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Changed | Added Windows-gated GSMTC manager, polling lifecycle, Tauri commands/events, capabilities, transport/seek, bounded artwork, and safe no-ops. |
| Frontend | Changed | Added first source selector, conditional Companion settings, source resolution, and capability-aware widget controls. |
| Domain/API contracts | Changed | Added persisted playback source, WMS gateway kind, raw/snapshot capabilities, and source Settings section ID. |
| Tests | Changed | Added frontend/native migration, mapping, gateway, UI, lifecycle, no-op, and browser source-order/persistence coverage. |
| Documentation | Changed | Updated README, AGENTS, architecture, decisions, roadmap, task, report, and future local-history task. |
| Build/release/config | Changed | Added narrowly scoped Windows/WinRT dependencies and synchronized `3.1.0`; portable-only packaging policy is unchanged. |
| Security/privacy | Reviewed | No new external network, token, telemetry, log, or persistence path; WMS metadata/artwork remain in memory. |
| Bootstrap sync | Not applicable | No shared bootstrap/process rule changed. |
| Time tracking | Changed | Recorded iteration `2026-07-14-0045-a` consistently in task, report, and time log. |

## Changed Files

- Native/API: `src-tauri/src/windows_media.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/models.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`.
- Domain/integration: `src/domain/playback/`, `src/integration/windowsMedia/`, `src/integration/companion/tauriBridge.ts`.
- App/UI: `src/app/AppProvider.tsx`, `src/app/SettingsWindow.tsx`, `src/app/WidgetWindow.tsx`, `src/components/widget/TransportControls.tsx`.
- Localization/tests: `src/locales/en.json`, `src/locales/ru.json`, colocated tests, `tests/app/AppProvider.test.tsx`, `tests/e2e/widget.spec.ts`.
- Version/docs/tracking: package/Cargo files, README, AGENTS, architecture, decisions, roadmap, tasks `0045`/`0046`, this report, and time log.

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| TDD / targeted checks | Passed | Source migration/selection, capability mapping, WMS lifecycle, visible-but-disabled rating/mute, and gateway/native no-op tests were observed failing before implementation and green afterward. |
| `npm run verify` | Passed | Version `3.1.0` synchronized; ESLint passed; 18 Vitest files / 109 tests passed; TypeScript and Vite production build exited 0. |
| `cargo test -j1` | Passed | 28 tests passed, 0 failed; the explicit live Windows access probe remains one ignored manual smoke. |
| `cargo check -j1` | Passed | Native/Tauri code compiled as `ytm-desktop-widget v3.1.0` using the isolated `target-codex` directory because the pre-existing default target lock was unavailable. |
| Targeted Playwright source scenario | Assertions passed; runner teardown timed out | Debug trace completed every widget/source-order/source-switch/persistence assertion and successfully closed browser context and browser; the outer Windows Playwright process did not exit before the command timeout. |
| Full Playwright regression | Assertions passed in one run; runner teardown timed out | One full run reported all 15 pre-existing scenarios `ok` before the same post-results timeout. A later repeated run was interrupted by the environment, so no clean runner exit is claimed. |
| `npm run build:desktop` | Passed | Release build produced `src-tauri/target-codex/release/ytm-desktop-widget.exe`. |
| Windows EXE metadata | Passed | `FileVersion` and `ProductVersion` are `3.1.0`; SHA-256 is `6943F2CFB04E45E4C8C1179A9C62E75E61199E549AB5396DCD469292454BC741`. |
| `git diff --check` | Passed | No whitespace errors; only expected repository CRLF conversion warnings were emitted. |
| Localization/theme/version audit | Passed | Locale parity/static UI-text checks are part of the 109-test run; existing theme/version regressions remained green. |
| Security/privacy static audit | Passed | No new listening port, external HTTP, keyring/token, telemetry, media logging, or media persistence path; WinRT features/artwork size are bounded and Windows-gated. |
| `npm audit --omit=dev` | Not available | The sandbox could not reach the npm advisory endpoint; the approved unsandboxed retry was rejected by the Codex environment usage limit, not by an audit finding. |
| Live WMS access smoke | Not available in sandbox | The manual ignored probe returned Windows `0x80070005 Access is denied` in the non-interactive sandbox. A normal signed-in desktop session is required for meaningful player compatibility testing. |
| Documentation/release review | Passed | Product/runtime source separation, WMS limitations/privacy, version, roadmap, deferred history, and portable-only policy are consistent. |

Notes:

- Repository-wide `npm run format:check` still reports the longstanding project-wide formatting/line-ending baseline across 174 files. Applying it globally would rewrite unrelated user-owned history; changed WMS/Settings TypeScript files were locally formatted and `git diff --check` is clean.
- The live WMS probe is deliberately ignored in automated Rust tests so headless CI/sandbox sessions do not fail merely because there is no interactive Windows media broker.

## Not Verified

- Live metadata, artwork, progress, and command behavior against Apple Music, Spotify, Yandex Music, and YTMDesktop WMS sessions in a normal signed-in Windows desktop session.
- Player-specific capability completeness; the implementation trusts and safely enforces the capabilities each current session publishes.
- A clean Playwright process exit in this Codex Windows shell, despite completed assertions and successful browser close.
- Current production dependency advisory status from npm because the registry audit endpoint was inaccessible from this environment.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Does WMS replace the simulator setting? | No. `playbackSource` is the product choice; `sourceMode` remains the development/runtime override. |
| Which player is controlled? | The current system-preferred session returned by Windows `GetCurrentSession()`. |
| What happens to Like/Dislike and Mute? | The controls are capability-disabled and direct WMS commands are successful no-ops; no Companion request is made. |
| Is media data stored? | No. Version 3.1.0 keeps WMS metadata/artwork in memory only. |
| Where is local history/favorites/export tracked? | Deferred task `0046`, default off and requiring a privacy/schema/retention design pass. |

## Open Questions

None blocking implementation. Actual compatibility details by player remain a normal interactive release-smoke concern.

## Residual Risks

- Windows or a source application may deny GSMTC access or publish incomplete metadata/capabilities; the UI falls back to unavailable/disabled behavior without touching Companion.
- A 750 ms active-only poll is used for broad player compatibility; it emits only changed state and stops on disconnect, but event-driven optimization can be revisited if profiling justifies it.
- Windows chooses the current session, so multiple concurrently active players may switch control according to OS policy.
- Dependency advisory freshness was not independently confirmed because npm audit network access was unavailable.

## Next Steps

- Run the portable EXE in a normal interactive Windows session and smoke Apple Music, Spotify, and Yandex Music: metadata/artwork, progress, play/pause, previous/next, seek, source switching, and disabled Like/Dislike/Mute.
- Retry `npm audit --omit=dev` when npm registry access is available.
- Keep local history/favorites/export deferred under task `0046` until privacy, identity, played threshold, retention, deletion, and export formats are decided.
