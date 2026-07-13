# Decisions

Date baseline for this document: March 10, 2026.

## 1. Use Tauri v2 with React, TypeScript, and Vite

Status: accepted

Reasoning:

- Tauri gives the widget native windows, tray support, startup behavior, and low overhead.
- React + TypeScript keep the UI maintainable and fast to iterate on.
- Vite keeps the frontend development loop small and predictable.

Trade-off:

- some behavior must cross the Rust and frontend boundary cleanly
- desktop-specific integration work moves into Rust instead of staying web-only

## 2. Integrate with YTMDesktop only through the Companion Server API

Status: accepted

Reasoning:

- this is the only explicitly allowed integration path for the project
- it avoids fragile hacks like scraping, DOM injection, OCR, or window-title parsing
- it keeps the codebase aligned with upstream semantics and future API evolution

Trade-off:

- the widget is fully dependent on Companion API availability and auth behavior
- some live behavior could not be validated locally without a running YTMDesktop instance

## 3. Keep the real Companion client in Rust, not in the browser layer

Status: accepted

Reasoning:

- the Rust backend avoids browser/CORS concerns and owns native token storage cleanly
- realtime socket handling and reconnect behavior fit naturally in the backend bridge
- frontend code stays transport-agnostic and easier to test

Trade-off:

- more code spans two languages
- frontend debugging of native bridge issues requires backend-aware validation

## 4. Store auth in the OS keyring

Status: accepted

Reasoning:

- Companion auth is sensitive enough to avoid plain frontend storage
- the `keyring` crate maps naturally to Windows Credential Manager
- clearing auth and re-auth is easy to expose as explicit user actions

Trade-off:

- keyring behavior remains platform-specific under the hood
- auth flow testing in browser-only preview is intentionally limited

## 5. Keep a clean simulator that implements the same gateway interface

Status: accepted

Reasoning:

- simulator mode enables UI, tests, and polishing work without requiring a live Companion server
- the same `CompanionGateway` interface keeps simulator usage honest
- it lowers delivery risk without turning the app into a fake-only prototype

Trade-off:

- simulator parity must be maintained intentionally
- live edge cases still need real-world verification later

## 6. Use an explicit connection state machine

Status: accepted

Reasoning:

- the product has multiple user-visible connection and auth states
- a state machine keeps reconnect/auth/discovery semantics clear and debuggable
- UI components can render polished states without embedding transport logic

Trade-off:

- slightly more domain code up front
- state transitions must stay synchronized with future API behavior changes

## 7. Ship one fixed-size widget mode for v1

Status: accepted

Reasoning:

- the product brief prioritizes polish over breadth for the first release
- a fixed 256x256 cover-driven layout lets spacing, blur, and motion be tuned carefully
- future size presets can be added later without redesigning the domain layer

Trade-off:

- no manual resize in v1
- no alternate compact/expanded modes yet

## 8. Implement launch-on-startup through the Windows Run registry for v1

Status: accepted

Reasoning:

- v1 is Windows-only
- the registry path is simple, dependable, and easy to reason about
- it avoids taking on extra plugin uncertainty for the first release

Trade-off:

- this choice is intentionally Windows-specific
- future macOS support will need a different startup strategy

## 9. Support the Tauri MCP server named `tauri` in debug builds

Status: accepted

Reasoning:

- it gives a reliable way to inspect windows, DOM state, and backend metadata in a real desktop runtime
- it improved validation in this project beyond browser-only tests
- it keeps development aligned with the MCP ecosystem used in the surrounding environment

Implementation notes:

- reference repo: <https://github.com/hypothesi/mcp-server-tauri>
- `tauri-plugin-mcp-bridge` is registered in debug builds only
- `withGlobalTauri` is enabled
- `mcp-bridge:default` is granted in the desktop capability set

Trade-off:

- it is development-only plumbing and should not affect production builds
- it adds one more debug-only integration to keep configured correctly

## 10. Keep seek available in architecture, but treat live seek behavior as partially unverified

Status: accepted with caution

Reasoning:

- upstream v2 docs document `seekTo` as a `POST /api/v1/command` payload
- the UI and command model support seek cleanly today
- the feature should not block v1 delivery when a live Companion server is unavailable locally

Implementation notes:

- seek is sent as `{ "command": "seekTo", "data": seconds }`
- the REST token is sent as the raw `Authorization` header value, matching the v2 docs
- live seek behavior still needs verification against a real YTMDesktop Companion instance

Trade-off:

- seek behavior still needs live validation against a running YTMDesktop instance
- any mismatch can be isolated to the gateway/backend command path later

## 11. Use portable-only rebuilds for the current test cycle

Status: accepted

Reasoning:

- the immediate goal is fast user testing with a single portable executable
- skipping installer generation shortens rebuilds and reduces confusion about which artifact to launch
- the portable `.exe` is sufficient for the current feedback loop

Implementation notes:

- `package.json` build scripts default to `tauri build --no-bundle`
- `src-tauri/tauri.conf.json` has bundling disabled by default for now
- future installer work can be re-enabled later when packaging becomes the focus again

Trade-off:

- setup / installer artifacts are not produced in normal rebuilds right now
- release packaging validation is intentionally deferred for this test phase

## 12. Use root package.json as the application version source

Status: accepted

Reasoning:

- the UI, Tauri package metadata, Rust package, Companion identity, and lockfiles must not drift independently
- `package.json` is already visible to the frontend and can be referenced directly by Tauri v2
- Cargo manifest and lockfile copies can be synchronized and checked automatically

Implementation notes:

- edit only the root `package.json` version manually
- run `npm run version:sync` after a version change
- `npm run verify` runs `version:check` before lint, tests, and build
- React displays the imported package version, Tauri resolves `../package.json`, and Companion uses `CARGO_PKG_VERSION`

Trade-off:

- Cargo still requires a concrete manifest version, so synchronization is enforced rather than fully eliminated
- a version bump must run the sync command before validation succeeds
