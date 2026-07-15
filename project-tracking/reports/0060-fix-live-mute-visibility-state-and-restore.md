# 0060 - Fix live mute visibility, state, and restore report

## Summary

Companion mute is now a reversible stateful action in the widget. After the official `mute` command succeeds, the icon and accessible action immediately change to **Unmute**; the next activation sends the official `unmute` command instead of repeating mute. The widget does not overwrite, persist, or guess a volume level: current YTMDesktop owns preservation and restoration of its player volume.

The idle `On hover` mute control is now fully non-rendering and non-interactive (`opacity: 0`, `visibility: hidden`, `pointer-events: none`, and `tabIndex: -1`) without becoming disabled solely because it is hidden. Windows Media Session and Cider remain capability-safe: Settings explains that their current official adapter contracts do not expose mute/unmute and disables the misleading visible modes while retaining the saved preference for Companion.

## Done

- Reproduced the idle ghost control and traced it to the later `.icon-button:disabled` opacity rule overriding the hidden action opacity.
- Verified the current official YTMDesktop Companion API and source behavior: state includes volume but no muted flag, while `mute` and `unmute` are separate commands and YTMDesktop preserves the player volume internally.
- Added bounded Companion command reconciliation only after a successful command on the active live connection.
- Kept the pre-mute volume as a comparison reference without sending or persisting a numeric restore value.
- Cleared the local override when an external volume change indicates that returned player state has moved on.
- Added mute-only CSS visibility protection so Settings and Close retain their existing keyboard-focus behavior.
- Verified that GSMTC exposes no mute or volume control and that the current media session cannot be mapped deterministically to exactly one Core Audio session without unsafe guessing.
- Added source-specific Settings guidance and disabled unsupported `Always` / `On hover` choices for WMS and Cider.
- Added domain, component, Settings, computed-style E2E, and live portable/debug regressions.
- Built and inspected a fresh Windows portable executable.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-15-0060-a`                              |
| Started at         | `2026-07-15T09:12:53+03:00`                      |
| Finished at        | `2026-07-15T09:57:09+03:00`                      |
| Time spent minutes | `45`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-15-0060-a` |

## Changed Areas

| Area                 | Status               | Notes                                                                                                            |
| -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Backend/native       | Inspected, unchanged | Existing Companion command mapping already sends official `mute` / `unmute`; WMS remains explicitly unsupported. |
| Frontend             | Changed              | Correct hover visibility/accessibility, stateful icon/action feedback, and source-aware Settings controls.       |
| Domain/API contracts | Changed              | Live Companion controller now owns a bounded mute override because the external v1 state has no muted field.     |
| Tests                | Changed              | Added controller, Widget, Settings, and Playwright regressions plus live Companion inspection.                   |
| Documentation        | Changed              | README, locales, task, report, roadmap, and time log reconciled with actual adapter capabilities.                |
| Build/release/config | Verified, unchanged  | Portable-only `3.1.0` artifact rebuilt; no manifest, permission, version, or packaging change.                   |
| Bootstrap sync       | Not applicable       | No shared process rule changed.                                                                                  |
| Time tracking        | Changed              | One tracked iteration added.                                                                                     |
| Project tracking     | Changed              | Task `0060` completed and roadmap snapshot advanced.                                                             |

## Changed Files

- `src/domain/playback/controller.ts`
- `src/domain/playback/controller.test.ts`
- `src/app/WidgetWindow.tsx`
- `src/app/WidgetWindow.test.tsx`
- `src/app/SettingsWindow.tsx`
- `src/app/SettingsWindow.test.tsx`
- `src/styles/global.css`
- `src/locales/en.json`
- `src/locales/ru.json`
- `tests/e2e/widget.spec.ts`
- `README.md`
- `project-tracking/tasks/0060-fix-live-mute-visibility-state-and-restore.md`
- `project-tracking/reports/0060-fix-live-mute-visibility-state-and-restore.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check                                                                       | Result             | Notes                                                                                                                                                                         |
| --------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused RED                                                                 | Passed as evidence | New assertions failed against the previous Companion state, hidden-button, and WMS Settings behavior before production changes.                                               |
| Focused GREEN                                                               | Passed             | 71/71 focused tests.                                                                                                                                                          |
| `npm run verify`                                                            | Passed             | Version sync, ESLint, 19 files / 146 Vitest tests, TypeScript, and Vite production build.                                                                                     |
| `npm run test:e2e`                                                          | Passed             | 17/17 Playwright scenarios, including computed idle/hover mute styles.                                                                                                        |
| `cargo test -j1 --target-dir target/qa-0060`                                | Passed             | 48/48 Rust tests; the first cold attempt reached the 300-second compile limit and the resumed identical command passed.                                                       |
| `cargo clippy -j1 --all-targets --target-dir target/qa-0060 -- -D warnings` | Passed             | No warnings.                                                                                                                                                                  |
| `cargo check -j1 --target-dir target/qa-0060`                               | Passed             | Native crate compiled successfully.                                                                                                                                           |
| `cargo fmt --all -- --check`                                                | Baseline failure   | Reports repository-wide pre-existing Rust indentation differences in untouched native files; no broad reformat was applied.                                                   |
| Changed-file Prettier check                                                 | Passed             | All files changed before tracking close-out passed Prettier. Full repository `format:check` still reports the existing 199-file baseline.                                     |
| `npm audit --audit-level=high`                                              | Passed             | 0 vulnerabilities.                                                                                                                                                            |
| Changed-tree privacy/credential scan                                        | Passed             | No private home paths or literal credentials were found; the user-provided Cider test token was not persisted.                                                                |
| `git diff --check`                                                          | Passed             | No whitespace errors; only expected line-ending notices.                                                                                                                      |
| `npm run build:desktop`                                                     | Passed             | `music-desktop-widget.exe`, 16,463,872 bytes, SHA-256 `27334F01D73CD1A19348B99E7073A5FB481796BE4322E23FF9FC0E449FD7B8A1`.                                                     |
| Live Companion QA                                                           | Passed             | Idle computed styles were fully hidden; hover restored interaction; a real saved Companion connection completed `Mute` -> `Unmute` -> `Mute` through the UI without fallback. |
| Docs/release review                                                         | Passed             | README and Settings agree with the current contracts; no native permission, manifest, identifier, or release-policy change was needed.                                        |

## Not Verified

- Automated QA cannot measure the user's audible output level in decibels. It did verify that YTMDesktop accepted both official commands and that the UI returned to **Mute** through the normal unmute path; volume preservation itself remains owned by YTMDesktop's official implementation.
- WMS mute was not live-tested because GSMTC has no such command and the app deliberately does not mutate global output or guess a Core Audio process/session.

## Questions Resolved

| Question                                             | Resolution                                                                                                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why was the idle hover-only button still visible?    | Its hidden opacity was overridden by the generic disabled opacity rule. Mute now has an explicit `visibility` boundary and is not disabled merely for being hidden.                                |
| Why did the second click repeat mute?                | Companion API v1 does not return a muted field, so external state reset `isMuted`. The controller now reflects its own successful command until unmute or an external volume change reconciles it. |
| Should the widget store the previous numeric volume? | No. Current YTMDesktop preserves its own volume across `mute()` / `unMute()`; storing or resending a guessed value risks overwriting a user change.                                                |
| Can WMS mute the selected media player safely?       | No through GSMTC. Core Audio has per-session mute, but the GSMTC session does not provide a deterministic one-to-one audio-session identity, so guessing would risk muting unrelated audio.        |

## Open Questions

None.

## Residual Risks

- A future YTMDesktop API revision could add an explicit muted field; the local override should then be replaced by that authoritative field.
- If volume is changed externally while muted, the widget deliberately clears its local override because the official API cannot report whether mute itself remains active.
- The repository-wide Rust and Prettier formatting baselines remain outside this focused repair.

## Next Steps

- Ask the user to confirm the rebuilt portable artifact against their normal listening session and preferred volume.
- Keep future adapter actions capability-driven and expose mute only when the official contract can both mute and unmute the intended player safely.
