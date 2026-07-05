# YTM Desktop Widget

A premium Windows desktop widget for YTMDesktop built with Tauri v2, React, TypeScript, and Vite.

Before working on this repository, read [AGENTS.md](./AGENTS.md). It defines the project workflow, validation expectations, and markdown project-tracking rules.

The app integrates with YTMDesktop only through the official Companion Server API. It does not scrape UI, inject scripts, parse window titles, use OCR, or fall back to platform media sessions.

## What it does

- Shows current cover art, blurred art-derived background, title, artists, elapsed time, duration, and progress.
- Supports previous, play/pause, next, reconnect, auth, and settings flows.
- Persists window position, always-on-top, launch-on-startup, and display preferences.
- Hides to tray instead of quitting by default.
- Ships with a real Companion client and a separate simulator for local development and tests.
- Uses i18n JSON messages from day one, with English wired as the default locale.

## Stack

- Tauri v2 for a lightweight Windows desktop shell, tray integration, custom windows, and native storage access.
- React 19 + TypeScript for UI composition and stateful interactions.
- Vite for fast development and production builds.
- Rust backend bridge for Companion API networking, keyring-backed token storage, and Windows-specific behavior.
- Vitest + Testing Library for unit/component coverage.
- Playwright for browser-level simulator smoke coverage.

## Why Tauri

Tauri keeps the widget small, fast, and close to the platform while still letting the UI stay in React. That matters here because the product needs:

- a frameless transparent widget window,
- tray behavior,
- launch-on-startup,
- always-on-top,
- native credential storage,
- and clean future paths toward macOS support.

## Companion API research and verified assumptions

Integration design was based on the official YTMDesktop Companion documentation and examples:

- Official wiki page: <https://github.com/ytmdesktop/ytmdesktop/wiki/Companion-Server>
- Raw wiki source used during implementation: <https://raw.githubusercontent.com/wiki/ytmdesktop/ytmdesktop/Companion-Server.md>

Verified from upstream docs before implementation:

- Base API path: `http://<host>:<port>/api/v1`
- Metadata endpoint: `GET /api/v1/metadata`
- Auth code endpoint: `POST /api/v1/auth/requestcode`
- Auth completion endpoint: `POST /api/v1/auth/request`
- Playback state endpoint: `GET /api/v1/state`
- Playback commands:
  - `POST /api/v1/previous`
  - `POST /api/v1/play-pause`
  - `POST /api/v1/pause`
  - `POST /api/v1/play`
  - `POST /api/v1/next`
  - `POST /api/v1/seek-to/<seconds>`
- Realtime socket namespace: `/api/v1/realtime`
- Realtime event: `state-update`
- Socket auth payload contains the bearer token
- Upstream guidance prefers `127.0.0.1` over `localhost`

The real client is written so any unconfirmed response-shape differences are isolated to the backend bridge and mapping layer.

## Tauri MCP support

This project is configured for the Tauri MCP server named `tauri`.

- MCP server repo: <https://github.com/hypothesi/mcp-server-tauri>
- Debug builds register `tauri-plugin-mcp-bridge`
- `withGlobalTauri` is enabled in `src-tauri/tauri.conf.json`
- `mcp-bridge:default` is granted in `src-tauri/capabilities/default.json`

Current debug MCP and dev-tool port configuration in this repo:

- Tauri MCP bridge base port: `39223`
- Vite dev server port: `31420`
- Vite preview port: `34173`
- Playwright preview port: `34174`

## Windows development setup

### Prerequisites

- Node.js 24+
- Rust stable toolchain with the MSVC target
- WebView2 runtime on Windows
- YTMDesktop, if you want to test the real Companion flow

### Install

```bash
npm install
```

### Run in desktop mode

```bash
npm run dev:desktop
```

### Run the browser-only preview

```bash
npm run dev
```

The browser preview automatically falls back to the simulator unless you override the source mode.

## Real source vs simulator

The app supports three source modes in settings:

- `auto`: uses the real Companion bridge in Tauri and the simulator in browser preview
- `real`: always use the Tauri/Rust Companion bridge
- `simulator`: always use the development simulator

You can also override source mode during development:

- query string: `?source=real` or `?source=simulator`
- env for web preview / Playwright: `VITE_YTM_DATA_SOURCE=simulator`

## Current rebuild policy

For the near-term testing cycle, rebuilds are intentionally portable-only.

- `npm run build:desktop` builds only the portable release executable
- `npm run build:portable` is the same portable-only build path
- installer / setup artifacts are intentionally disabled in default config for now

## Scripts

- `npm run dev` - browser preview
- `npm run dev:desktop` - Tauri desktop development
- `npm run build` - TypeScript + Vite production build
- `npm run build:desktop` - portable Tauri release build without bundling
- `npm run build:portable` - portable Tauri release build without bundling
- `npm run lint` - ESLint
- `npm test` - Vitest
- `npm run test:e2e` - Playwright simulator smoke test
- `npm run verify` - lint + tests + web build

## Build outputs

Current Windows testing output:

- Portable executable: `src-tauri/target/release/ytm-desktop-widget.exe`

Installer outputs are intentionally not produced by default right now.

## Architecture map

- High-level architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Key engineering decisions: [DECISIONS.md](./DECISIONS.md)
- Project tracking, roadmap, tasks, reports, decisions, and checklists: [project-tracking/README.md](./project-tracking/README.md)

## Project tracking

Markdown files under `project-tracking/` are the source of truth for work planning and reports.

- Roadmap: [project-tracking/roadmap/0000-roadmap.md](./project-tracking/roadmap/0000-roadmap.md)
- Current tasks: [project-tracking/tasks/](./project-tracking/tasks/)
- Completion and verification reports: [project-tracking/reports/](./project-tracking/reports/)
- Decisions: [project-tracking/decisions/](./project-tracking/decisions/)
- Definition of Done: [project-tracking/checklists/0000-definition-of-done.md](./project-tracking/checklists/0000-definition-of-done.md)

Beads was removed as the active tracker. Its full migration archive is preserved in [project-tracking/archive/beads-export-2026-07-05.jsonl](./project-tracking/archive/beads-export-2026-07-05.jsonl), with the ID-to-file map in [project-tracking/archive/beads-migration-map.md](./project-tracking/archive/beads-migration-map.md).

## Auth and storage

- Companion tokens are stored through the Rust `keyring` crate, which maps to Windows Credential Manager on Windows.
- App settings are persisted in the Tauri app config directory as JSON.
- Browser preview stores settings in `localStorage` only for local development.

## Validation completed

Validated in this workspace:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run verify`
- `npm run test:e2e`
- `cargo check -j1` for the Tauri/Rust backend
- Tauri MCP attach via the `tauri` server against a live `tauri dev` process

Because this machine was low on free disk space during Rust validation, the Rust checks were run with:

- `CARGO_INCREMENTAL=0`
- `CARGO_PROFILE_DEV_DEBUG=0`
- `CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=off`

Those environment variables were only a local validation workaround. They are not required by the project itself.

## What could not be validated against a live Companion API here

A live YTMDesktop Companion instance was not available during this session, so these paths were implemented from upstream docs and left clearly isolated for later real-world verification:

- the full auth approval round-trip inside a running YTMDesktop instance
- realtime updates from a live Companion socket
- command behavior against a live player
- live seek success and failure behavior
- edge cases like ads, livestreams, and transient Companion restarts

## Known limitations and intentional v1 deferrals

- Single widget size and layout only
- No manual resize yet
- Windows-only delivery focus for v1
- English-only locale bundle, though the i18n structure is ready for more JSON locales
- Seek UI is implemented as a best-effort path because the endpoint is documented, but live seek behavior was not verified against a local YTMDesktop instance here
- No macOS packaging work yet
- Further visual refinements and alternate window modes are intentionally deferred
