# 0059 - Fix source-aware warning and mute behavior report

## Summary

The main widget now derives authorization and recovery presentation from the selected playback source instead of treating every `auth_required` or error state as YTMDesktop Companion. Cider receives token-specific guidance and an **Open settings** recovery action, Windows Media Session receives its own recovery card, and Companion pairing controls remain Companion-only.

Mute is now rendered only when the active playback snapshot advertises `canMute`. This removes the inert Cider/WMS control in both `Always` and `On hover` modes while preserving the existing hover/focus behavior and the state-driven Mute/Unmute flow for Companion.

## Done

- Traced persisted source selection through `AppProvider`, the resolved gateway, connection state, capability mapping, widget presentation, and command dispatch.
- Confirmed that source switching/controller replacement was correct and localized the warning defect to presentation/message fallback logic.
- Added a complete Cider connection-message namespace in English and Russian.
- Restricted YTMDesktop pairing cards, pairing-code chips, and pairing actions to Companion.
- Added Cider token recovery and defensive WMS recovery for authorization-shaped states.
- Made Settings use the same selected-source message mapping as the main widget.
- Omitted mute entirely for snapshots without `canMute`, including live Cider and WMS snapshots.
- Preserved supported Companion mute as separate `mute`/`unmute` commands driven by returned playback state.
- Added component, localization/message, Settings, and E2E regressions, including a two-click mute/unmute round trip.
- Built and inspected a new Windows portable executable.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-15-0059-a` |
| Started at | `2026-07-15T08:31:45+03:00` |
| Finished at | `2026-07-15T09:04:40+03:00` |
| Time spent minutes | `33` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md#2026-07-15-0059-a` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Inspected, unchanged | Cider/WMS correctly publish `canMute: false`; Companion already maps distinct mute/unmute commands and publishes returned state. |
| Frontend | Changed | Source-specific warning cards/actions, capability-gated mute, and source-aware Settings status detail. |
| Domain/API contracts | Presentation mapping changed | Shared message keys are now translated within the active adapter namespace; native command contract is unchanged. |
| Tests | Changed | 16 new/updated source, hover, capability, Settings, and mute round-trip assertions. |
| Documentation | Changed | Task, report, roadmap, time log, and README effort snapshot reconciled; public capability tables remain correct. |
| Build/release/config | Verified, unchanged | Rebuilt portable-only `3.1.0` artifact; no packaging or version policy change. |
| Bootstrap sync | Not applicable | No shared process-rule change. |
| Time tracking | Changed | One tracked iteration added. |
| Project tracking | Changed | Task `0059` completed and roadmap snapshot updated. |

## Changed Files

- `src/app/connectionMessage.ts`
- `src/app/connectionMessage.test.ts`
- `src/app/WidgetWindow.tsx`
- `src/app/WidgetWindow.test.tsx`
- `src/app/SettingsWindow.tsx`
- `src/app/SettingsWindow.test.tsx`
- `src/locales/en.json`
- `src/locales/ru.json`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/tasks/0059-fix-source-aware-warning-and-mute-behavior.md`
- `project-tracking/reports/0059-fix-source-aware-warning-and-mute-behavior.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Focused RED | Passed as evidence | 16 expected failures covered Cider/WMS message leakage, wrong recovery actions, Settings copy, and unsupported mute. |
| Focused GREEN | Passed | 3 files, 67 tests. |
| `npm run verify` | Passed | Version sync, ESLint, 19 files / 143 tests, TypeScript, and Vite production build. |
| `npm run test:e2e` | Passed | 16/16 Playwright scenarios; mute changed to Unmute and returned to Mute after the second click. |
| `cargo test -j1 --target-dir target/qa-0059` | Passed | 48/48 Rust tests. The first cold attempt reached the 300-second compile limit; the resumed identical command completed successfully. |
| `cargo clippy -j1 --all-targets --target-dir target/qa-0059 -- -D warnings` | Passed | No warnings. |
| `cargo check -j1 --target-dir target/qa-0059` | Passed | Native crate compiled successfully. |
| `cargo fmt --all -- --check` | Baseline failure | Reports repository-wide pre-existing Rust indentation differences, including files untouched by this pass; no broad reformat was applied. |
| `npm audit --omit=dev` | Passed | 0 vulnerabilities. |
| Changed-tree privacy scan | Passed | No private Windows/macOS/Linux home path or token-like credential value found; the provided test credential was not persisted in repository files. |
| `git diff --check` | Passed | No whitespace errors; only expected Git line-ending notices. |
| `npm run build:desktop` | Passed | `music-desktop-widget.exe`, 16,463,872 bytes, SHA-256 `F3108E1B764D2A439990ABF50649232968D91F505B7A941525839D43B119D2F4`. |
| Live portable QA | Passed | With Cider selected and live playback present, hover exposed no Mute/Unmute control and no YTMDesktop pairing copy/actions; main actions were Settings, Close, and Play. |
| Docs/release review | Passed | README capability matrix already says Cider/WMS mute is unsupported; no native, permission, manifest, version, or packaging change was needed. |

## Not Verified

- A live Companion mute/unmute cycle was not sent to the user's real YTMDesktop instance because it was not authorized in the diagnostic portable session. The exact two-command/state-feedback cycle is covered by component, simulator, E2E, gateway, and native mapping tests.
- A live Cider missing-token card was not forced by deleting the user's keyring credential. The state is covered by component and Settings regressions without mutating credentials.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Why did Cider show YTMDesktop pairing? | The generic `auth_required` card and message fallback were Companion-specific and ignored the selected adapter. |
| Why was mute visible but inert in Cider? | Rendering depended only on the display preference, while command dispatch was disabled by Cider's correct `canMute: false` capability. |
| Was the hover boundary itself broken? | No. A characterization test proved supported hover-only mute already appears and disappears correctly; capability gating was missing. |
| Should Cider/WMS synthesize mute? | No. Unsupported controls are omitted; the adapter capability remains the source of truth. |

## Open Questions

None.

## Residual Risks

- Real player behavior can still differ between YTMDesktop versions, but the implementation follows the current official separate mute/unmute command and realtime state-update contract.
- The repository-wide Rust formatting baseline remains outside this focused frontend repair.

## Next Steps

- Ask the user to confirm the rebuilt portable artifact against their normal Cider and YTMDesktop sessions.
- Keep future adapters responsible for publishing accurate capabilities so unsupported actions remain absent automatically.
