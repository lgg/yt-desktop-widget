# YTM Desktop Widget

A premium Windows desktop widget for YTMDesktop built with Tauri v2, React, TypeScript, and Vite.

Before working on this repository, read [AGENTS.md](./AGENTS.md). It defines the project workflow, validation expectations, bootstrap-sync status, time tracking, and markdown project-tracking rules.

The app integrates with YTMDesktop only through the official Companion Server API. It does not scrape UI, inject scripts, parse window titles, use OCR, or fall back to platform media sessions.

## What it does

- Shows current cover art, blurred art-derived background, title, artists, elapsed time, duration, and progress.
- Supports previous, play/pause, next, reconnect, auth, and settings flows.
- Persists window position, always-on-top, launch-on-startup, and display preferences.
- Display preferences can remove playback controls, the progress row, or the title/artist block from the compact layout, allowing the widget height to shrink.
- Playback controls can be kept always visible or faded out until hover; the controls keep a stable reserved row so pointer leave cannot resize or jitter the widget.
- The full artwork can optionally act as an accessible play/pause control whose action icon appears on hover or keyboard focus.
- The connection-status badge can optionally fade out until hover while keeping its layout footprint reserved.
- Hides to tray instead of quitting by default.
- Ships with a real Companion client and a separate simulator for local development and tests.
- Uses matching English and Russian i18n JSON bundles, with English as the default and a persisted language selector in Settings.

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

Integration design is based on the official YTMDesktop Companion Server API documentation for YTMDesktop v2.0.0 and higher:

- Official wiki page: <https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1>

Verified from upstream docs during the latest protocol audit:

- Base API path: `http://<host>:<port>/api/v1`
- Public metadata endpoint: `GET /metadata` without the `/api/v1` prefix
- Auth code endpoint: `POST /api/v1/auth/requestcode`
  - request body: `appId`, `appName`, `appVersion`
  - `appId` must be lowercase alphanumeric, without spaces, 2-32 characters
- Auth completion endpoint: `POST /api/v1/auth/request`
  - request body: `appId`, `code`
- Authenticated REST requests pass the token as the raw `Authorization` header value
- Pairing codes are single-use once `POST /api/v1/auth/request` begins
- A newly issued token is verified against `GET /api/v1/state` before it is stored
- Stored Companion credentials are removed only by the explicit `Clear auth` action, not by a transient `401`
- Playback state endpoint: `GET /api/v1/state`
- Companion `player.videoProgress` is elapsed playback time in seconds, while `videoDetails.durationSeconds` is total duration in seconds; the frontend derives the progress ratio from those two values.
- Playback command endpoint: `POST /api/v1/command`
  - body examples: `{ "command": "playPause" }`, `{ "command": "next" }`, `{ "command": "seekTo", "data": 42 }`
- Realtime Socket.IO base URL: `http://<host>:<port>`
- Realtime Socket.IO namespace: `/api/v1/realtime`
- Realtime transport: websocket only
- Realtime auth payload contains the token at `auth.token`
- Realtime event: `state-update`
- Upstream guidance prefers `127.0.0.1` over `localhost` to avoid IPv6 localhost issues on some systems

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
- `npm run version:sync` - synchronize Cargo/lock metadata from the root `package.json` version
- `npm run version:check` - fail if any required version copy or Tauri version source is out of sync
- `npm run verify` - version consistency + lint + tests + web build

## Version source

The root `package.json` is the only version value edited manually. The UI imports it directly, Tauri resolves its version from that file, and the Companion client reports Cargo's package version. After changing the root version, run `npm run version:sync`; `npm run verify` includes `version:check` so drift cannot pass normal validation.

The current application version is `2.0.0`.

## Build outputs

Current Windows testing output:

- Portable executable: `src-tauri/target/release/ytm-desktop-widget.exe`

Installer outputs are intentionally not produced by default right now.

## Architecture map

- High-level architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Key engineering decisions: [DECISIONS.md](./DECISIONS.md)
- Project tracking, roadmap, tasks, reports, decisions, checklists, bootstrap sync, and time log: [project-tracking/README.md](./project-tracking/README.md)

## Project tracking

Markdown files under `project-tracking/` are the source of truth for work planning and reports.

- Roadmap: [project-tracking/roadmap/0000-roadmap.md](./project-tracking/roadmap/0000-roadmap.md)
- Current tasks: [project-tracking/tasks/](./project-tracking/tasks/)
- Completion and verification reports: [project-tracking/reports/](./project-tracking/reports/)
- Decisions: [project-tracking/decisions/](./project-tracking/decisions/)
- Definition of Done: [project-tracking/checklists/0000-definition-of-done.md](./project-tracking/checklists/0000-definition-of-done.md)
- Bootstrap sync status: [project-tracking/bootstrap-sync.md](./project-tracking/bootstrap-sync.md)
- AI iteration time log: [project-tracking/time-log.md](./project-tracking/time-log.md)

Before a substantial AI iteration, record start time in the task. Before handoff, record finish time and duration in the task, matching report, and `project-tracking/time-log.md`.

Beads was removed as the active tracker. Its full migration archive is preserved in [project-tracking/archive/beads-export-2026-07-05.jsonl](./project-tracking/archive/beads-export-2026-07-05.jsonl), with the ID-to-file map in [project-tracking/archive/beads-migration-map.md](./project-tracking/archive/beads-migration-map.md).

## Auth and storage

- Companion tokens are stored through the Rust `keyring` crate with its `windows-native` backend, which maps to Windows Credential Manager.
- Fresh Companion tokens are accepted into the keyring only after an authenticated state request succeeds.
- Token writes are read back through a new keyring entry before the backend reports authorization success.
- `Stored securely` is derived only from a successful backend credential probe; the frontend never synthesizes this state.
- Reconnect and command failures never erase a stored token automatically; the user controls credential removal through `Clear auth`.
- App settings are persisted in the Tauri app config directory as JSON.
- Browser preview stores settings in `localStorage` only for local development.
- The Companion `appId` used for auth is `ytmdesktopwidget`, matching the v2 API lowercase-alphanumeric constraint.

## Bootstrap sync

This repository adapts shared process rules from <https://github.com/lgg/chatgpt-coding-projects-bootstrap>.

Current sync status is tracked in `project-tracking/bootstrap-sync.md`. The rules are adapted to this project as a Windows-first Tauri desktop app. Server-only Docker/Coolify examples from the bootstrap are not copied into the app root unless a future numbered task introduces deployment support.

## Validation history

Previously validated in earlier workspaces:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run verify`
- `npm run test:e2e`
- `cargo check -j1` for the Tauri/Rust backend
- Tauri MCP attach via the `tauri` server against a live `tauri dev` process

Because that machine was low on free disk space during Rust validation, the Rust checks were run with:

- `CARGO_INCREMENTAL=0`
- `CARGO_PROFILE_DEV_DEBUG=0`
- `CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=off`

Those environment variables were only a local validation workaround. They are not required by the project itself.

## Live Companion validation

The full auth approval round-trip, durable credential reload, reconnect, and live realtime state updates were confirmed by the user against YTMDesktop v2.0.11 on 2026-07-09. On 2026-07-13, the user also confirmed the latest portable build's playback commands, seek/progress timing, hover behavior, settings interaction, and window behavior.

Future live regression passes should still include uncommon upstream states such as:

- edge cases like ads, livestreams, and transient Companion restarts

## Known limitations and intentional deferrals

- Single widget size and layout only
- No manual resize yet
- Windows-only delivery focus
- English and Russian are the only bundled locales
- No macOS packaging work yet
- Further visual refinements and alternate window modes are intentionally deferred
