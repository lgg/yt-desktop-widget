# 0021 - Full Code Audit After Auth Fixes

## Summary

Completed a connector-only full project audit after the recent live Companion authorization fixes. The review covered the known frontend, domain, Tauri backend, Companion integration, tests, build config, documentation, and project tracking files available through the GitHub App connector.

Two confirmed defects were fixed:

- A multi-window lifecycle bug where opening or closing Settings could tear down the shared real Companion backend socket used by the main widget.
- A Playwright smoke-test reliability bug where `npm run test:e2e` could run `vite preview` without first building `dist` on a clean checkout.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0021-a` |
| Started at | `2026-07-07T03:12:23+02:00` |
| Finished at | `2026-07-07T03:24:02+02:00` |
| Time spent minutes | `12` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Files Reviewed

Representative audited areas:

- Project rules/tracking: `AGENTS.md`, `README.md`, `project-tracking/time-log.md`, `project-tracking/roadmap/0000-roadmap.md`
- Build/config: `package.json`, `vite.config.ts`, `playwright.config.ts`, `eslint.config.js`, TypeScript configs, Tauri config/capabilities
- Tauri backend: `src-tauri/src/lib.rs`, `models.rs`, `settings.rs`, `startup.rs`, `companion.rs`
- App/domain: `src/app/*`, `src/domain/playback/*`, `src/integration/companion/*`
- UI/utilities/tests: widget/settings components, utility helpers, Vitest and Playwright smoke tests

## Changes Made

| Area | File | Change |
| --- | --- | --- |
| Domain contract | `src/domain/playback/types.ts` | Added disconnect options so frontend listeners can detach without necessarily closing the shared backend Companion connection. |
| Controller lifecycle | `src/domain/playback/controller.ts` | Added dispose options and routed disconnect ownership through the controller. |
| App lifecycle | `src/app/AppProvider.tsx` | Settings windows in real mode now dispose their local controller without closing the shared backend Companion socket; main window still owns real backend disconnect. |
| Real Companion gateway | `src/integration/companion/realGateway.ts` | Always removes the frontend event listener on disconnect, but only calls `companion_disconnect` when the caller owns backend shutdown. |
| Tauri backend | `src-tauri/src/companion.rs` | Made `connect()` idempotent for the same endpoint/token and added a connection-key unit test. |
| Tests | `tests/domain/playback/controller.test.ts` | Added regression coverage for disposing a frontend listener without closing a shared backend connection. |
| E2E config | `playwright.config.ts` | Made Playwright web server run `npm run build` before `vite preview`, so clean checkouts do not depend on a pre-existing `dist`. |

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Static source audit | Passed with fixes | Reviewed core architecture and changed flows through GitHub App file reads. |
| Recent-change comparison | Passed | Compared audit start `d6bd5618bb5621806883cbf1c2d89798c9843544` through code-fix HEAD `5afcea3c12f056df53afd6365693a1926b74ee5e`. |
| Auth/window lifecycle reasoning | Passed with fix | Settings no longer closes the shared real backend socket; backend connect is idempotent for the same endpoint/token. |
| TypeScript/Vitest local run | Not run here | Local clone/build was blocked by sandbox policy; connector-only environment cannot execute repo tests. |
| Rust/Cargo local run | Not run here | Same environment limitation. |
| Live YTMDesktop Companion QA | Not run here | Requires a local Windows YTMDesktop instance and Companion Server. |

## Required Local Follow-Up

Run these on the working machine before treating the audit as release-verified:

```bash
npm run verify
npm run test:e2e
cargo check -j1
npm run build:portable
```

Then validate the live Companion flow manually:

1. Open the widget and Settings.
2. Generate the Companion auth code.
3. Click Allow in YTMDesktop.
4. Confirm the widget transitions to authorized/connected without needing a restart.
5. Close and reopen Settings while playback is active and confirm the main widget keeps receiving live state.

## Residual Risks

- The environment could not mechanically enumerate or execute the full repository tree because local cloning was blocked and GitHub App broad tree/search access was limited. The audit focused on known project architecture and critical files.
- `companion_complete_auth` still waits for YTMDesktop approval while holding the backend manager mutex. That is acceptable for the current serialized auth flow, but it remains a candidate for future lifecycle hardening.
- Live Companion behavior is still the source of truth for runtime verification; this pass removes clear code-level issues but cannot replace Windows/YTMDesktop QA.

## Outcome

The project is in a better state after the audit. The most likely remaining cause of the user's reported authorization stall, after the previous token/connect fix, was the Settings window competing with the main widget over one backend Companion socket. That ownership conflict is now fixed in both frontend lifecycle code and backend connection reuse logic.
