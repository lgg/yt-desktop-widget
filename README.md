# YTM Desktop Widget

A premium Windows desktop media widget built with Tauri v2, React, TypeScript, and Vite. It supports YTMDesktop through its Companion API and contains an optional Windows Media Session integration for compatible players.

Before working on this repository, read [AGENTS.md](./AGENTS.md). It defines the project workflow, validation expectations, bootstrap-sync status, time tracking, and markdown project-tracking rules.

The app never scrapes player UI, injects scripts, parses window titles, or uses OCR. YTMDesktop integration uses only the official Companion Server API; the optional multi-player mode uses only the official Windows Global System Media Transport Controls session selected by Windows.

## What it does

- Shows current cover art, blurred art-derived background, title, artists, elapsed time, duration, and progress.
- Provides a first-class playback-source selector: full YTMDesktop Companion integration or the current Windows Media Session published by a compatible player such as Apple Music, Spotify, or Yandex Music. The unpackaged portable WMS runtime works in a normal interactive Windows user session and does not require MSIX installation.
- Supports previous, play/pause, next, mute/unmute, Like/Dislike, reconnect, auth, and settings flows.
- Persists window position, always-on-top, launch-on-startup, and display preferences.
- Provides persisted window-surface, artwork-background, and gradient-overlay opacity controls with one-click reset to the original appearance.
- Provides Compact (85%), unchanged Default (100%), Large (125%), and linked Custom widget sizing; artwork, text, controls, spacing, progress UI, background, and intrinsic window height scale together.
- Track details, progress, Like/Dislike, and playback controls each support four display modes: always visible, hover/focus with reserved space, hover/focus with dynamic window height, or fully hidden.
- The six primary widget blocks can be reordered vertically from Settings without changing the controls inside each block.
- Mute is an optional header action with always, hover/focus, and hidden modes. It delegates mute/unmute restoration to YTMDesktop and never writes a numeric volume.
- Settings and Close header actions can each remain always visible or appear only on hover/focus, using the same segmented Settings control style as the other visibility preferences.
- Windows Media Session exposes source-specific capabilities: unsupported buttons are disabled, and Like/Dislike/Mute are also safe no-ops at both gateway boundaries.
- The full artwork can optionally act as an accessible play/pause control whose standalone semi-transparent action glyph appears on hover or keyboard focus.
- The connection-status badge can stay visible, appear only on hover or keyboard focus, or remain fully hidden while its non-interactive area stays draggable.
- Top-level Settings sections can be collapsed, and their collapsed state persists between launches.
- Hides to tray instead of quitting by default.
- Ships with real Companion and Windows Media Session clients plus a separate simulator for local development and tests.
- Uses matching English and Russian i18n JSON bundles, with English as the default and a persisted language selector in Settings.

## Stack

- Tauri v2 for a lightweight Windows desktop shell, tray integration, custom windows, and native storage access.
- React 19 + TypeScript for UI composition and stateful interactions.
- Vite for fast development and production builds.
- Rust backend bridge for Companion API networking, Windows Media Session/WinRT access, keyring-backed token storage, and Windows-specific behavior.
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
  - body examples: `{ "command": "playPause" }`, `{ "command": "next" }`, `{ "command": "mute" }`, `{ "command": "toggleLike" }`, `{ "command": "seekTo", "data": 42 }`
- Realtime Socket.IO base URL: `http://<host>:<port>`
- Realtime Socket.IO namespace: `/api/v1/realtime`
- Realtime transport: websocket only
- Realtime auth payload contains the token at `auth.token`
- Realtime event: `state-update`
- Upstream guidance prefers `127.0.0.1` over `localhost` to avoid IPv6 localhost issues on some systems

The real client is written so any unconfirmed response-shape differences are isolated to the backend bridge and mapping layer.

## Windows Media Session mode

Version 3.1.0 contains a source adapter that can follow the current system-preferred session returned by Windows `GlobalSystemMediaTransportControlsSessionManager`. The app reads the metadata, artwork, timeline, playback state, and control capabilities published by that session. Windows—not the widget—chooses the current session, and feature completeness varies by player.

The portable runtime creates one lazy, long-lived MTA worker and performs manager discovery, session reads, polling, artwork reads, and playback commands only on that worker. Blocking WinRT futures do not run on arbitrary Tokio threads. Requests have a 15-second frontend-facing bound, cancelled connects cannot become late ghost connections, and safe diagnostics retain only the failing stage, HRESULT, and category.

Delivery status: the same unpackaged Rust diagnostic executable was run in two execution contexts on the same Windows machine while Apple Music was active. A restricted Codex sandbox token failed at `request_manager.await` with `0x80070005`; a normal interactive-user launch succeeded, enumerated three sessions, and returned a current session. Microsoft also publishes a normal desktop console example for this API, and multiple Rust/Tauri projects call the same contract without requiring MSIX. Package identity is therefore not a portable WMS prerequisite. Do not launch the widget from Codex or another restricted sandbox; close the old process and start the portable EXE directly from File Explorer.

When WMS fails, Settings and the widget show the safe stage/HRESULT/category. The native backend also appends the same whitelist-only diagnostic to `%LOCALAPPDATA%\io.github.lgg.ytm-desktop-widget\logs\windows-media-diagnostics.jsonl`, rotating at 256 KiB to `windows-media-diagnostics.previous.jsonl`. These files contain no title, artist, artwork, source-app ID, command payload, credential, or token. Logging failures never block playback or Companion mode.

- Supported when published by the player: artwork/metadata, progress, seek, previous, play/pause, and next.
- Not provided by this Windows contract: application volume/mute and service-specific Like/Dislike. Those controls remain safely disabled/no-op in this mode even if their display preference is enabled.
- Timeline positions are normalized against the session start and clamped to the published seek range, so non-zero-origin sessions cannot make the progress clock run fast or seek outside the player contract.
- External text and artwork are bounded in memory; oversized or active/non-raster artwork payloads are rejected, and an accepted artwork payload is sent only when resolving a new track rather than on every polling tick.
- No playback metadata or artwork is persisted, logged, or transmitted by WMS mode in 3.1.0.
- Local WMS history, local favorites, copy/export, retention, and deletion are deferred to the separately designed, default-off roadmap task `0046`.

References: [Microsoft session manager documentation](https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager), [Microsoft desktop console example](https://devblogs.microsoft.com/oldnewthing/20231108-00/?p=108980), [Windows app capability declarations](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/app-capability-declarations), [win-gsmtc Rust wrapper](https://docs.rs/win-gsmtc/latest/gsmtc/), and [Current Song 2 standalone Windows releases](https://github.com/Nerixyz/current-song2/releases).

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
- YTMDesktop, if you want to test the Companion flow
- A Windows Media Session-compatible player, if you want to validate the portable multi-player mode; launch the EXE in a normal interactive Windows user session rather than through a restricted sandbox

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

## Playback source vs development source mode

The first Settings section stores the user-facing production source:

- `YTMDesktop Companion` (default and migration-safe): full Companion auth, realtime, mute, Like, and Dislike behavior
- `Windows Media Session`: current Windows-selected compatible player session without pairing

Development builds retain three internal runtime modes:

- `auto`: uses the selected production source in Tauri and the simulator in browser preview
- `real`: always uses the selected Tauri/Rust production bridge
- `simulator`: use the development simulator in development/browser workflows

The Developer section and its About-page mock-mode shortcut are omitted from native release builds. A legacy persisted `sourceMode: simulator`, query override, or environment override cannot supersede the selected production source in a native release; browser preview and development builds keep simulator support.

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
- `npm run test:e2e` - deterministic serial Playwright simulator suite; its Windows wrapper owns and always stops the temporary Vite preview process
- `npm run version:sync` - synchronize Cargo/lock metadata from the root `package.json` version
- `npm run version:check` - fail if any required version copy or Tauri version source is out of sync
- `npm run verify` - version consistency + lint + tests + web build

## Version source

The root `package.json` is the only version value edited manually. The UI imports it directly, Tauri resolves its version from that file, and the Companion client reports Cargo's package version. After changing the root version, run `npm run version:sync`; `npm run verify` includes `version:check` so drift cannot pass normal validation.

Read the current application version from the root `package.json`. The Settings
window and native build metadata consume the same centralized value.

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

- Widget sizing is intentionally proportional and controlled from Settings; free non-proportional border dragging remains disabled.
- Windows-only delivery focus
- English and Russian are the only bundled locales
- No macOS packaging work yet
- The unpackaged WMS manager path is confirmed against an active Apple Music session from a normal interactive-user process. The complete widget metadata and transport flow still needs a direct File Explorer launch smoke after each meaningful WMS runtime change.
- Further visual refinements and alternate window modes are intentionally deferred
