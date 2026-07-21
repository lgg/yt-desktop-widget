# Music Desktop Widget

A customizable desktop music widget built with Tauri, React, TypeScript, and Rust. It presents artwork, track details, progress, and playback controls in a compact always-on-top window while keeping player integrations explicit and local.

The current release is **Windows-first** and supports three production playback adapters: YTMDesktop Companion, Windows Media Session, and Cider. Linux/MPRIS and macOS support are planned in the [roadmap](./project-tracking/roadmap/0000-roadmap.md).

> Current version: **3.1.0**. Distribution is portable-only for now; automated GitHub builds and releases are planned but not yet available.

## Highlights

- Artwork-driven glass UI with dark, light, and system themes.
- Compact, Default, Large, and linked Custom size modes; Custom accepts proportional widths up to 2016 px, including an exact 2000 px width.
- Reorderable widget blocks and per-block always/hover/hidden visibility.
- Previous, play/pause, next, seek, mute, and rating controls when the selected adapter exposes them.
- Configurable transparency for the window surface, artwork background, and gradient.
- Always-on-top, launch-on-startup, close behavior, tray lifecycle, and remembered window positions.
- English and Russian UI with persisted language selection.
- Local simulator for UI development and deterministic tests.
- No player scraping, DOM injection, OCR, or window-title parsing.

## Operating-system support

| Operating system | Status        | Current support                                                                                 |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| Windows 11       | Supported     | Primary tested platform; portable executable, tray, startup, keyring, and all current adapters. |
| Windows 10       | Supported     | Uses WebView2 and Windows GSMTC; exact adapter capabilities still depend on the player.         |
| Linux            | Planned       | Linux build foundation and MPRIS playback adapter are the first cross-platform milestone.       |
| macOS            | Planned later | Scheduled after Linux, release automation, and localization scaling.                            |

Browser preview is a development surface backed by the simulator, not a supported end-user web edition.

## Playback-adapter support

| Adapter               | Status               | Metadata / artwork                         | Transport / seek     | Mute                                 | Like / Dislike | Authentication               |
| --------------------- | -------------------- | ------------------------------------------ | -------------------- | ------------------------------------ | -------------- | ---------------------------- |
| YTMDesktop Companion  | Supported            | Yes                                        | Yes                  | Yes                                  | Yes            | YTMDesktop Companion pairing |
| Windows Media Session | Supported on Windows | Yes, when published by the current session | Capability-dependent | No                                   | No             | None                         |
| Cider App             | Supported            | Yes                                        | Yes                  | Yes, through the official volume API | Yes            | Cider application token      |
| Linux MPRIS           | Planned              | Planned                                    | Planned              | To be defined by player capabilities | To be defined  | None expected                |

Windows Media Session follows the current session selected by Windows. Apple Music, Spotify, Yandex Music, browsers, and other compatible players may work through that system contract, but they are not separate first-class adapters and may expose different capabilities.

## Adapter setup

### YTMDesktop Companion

1. Start YTMDesktop 2.0 or newer.
2. Enable its Companion Server.
3. Select **YTMDesktop Companion** in Music Desktop Widget.
4. Generate a pairing code and approve the matching request inside YTMDesktop.

The integration uses only the official [Companion Server API](https://github.com/ytmdesktop/ytmdesktop/wiki/v2-%E2%80%90-Companion-Server-API-v1). Its token is stored in Windows Credential Manager. Companion API v1 exposes separate `mute` and `unmute` commands but no muted-state field, so the widget reflects its successful mute action locally while YTMDesktop itself preserves and restores the player's volume through those official commands.

### Windows Media Session

Select **Windows Media Session** and start playback in a compatible player. Windows chooses the current media session; the widget reads the metadata, artwork, timeline, playback state, and capability flags published through Global System Media Transport Controls.

Like/Dislike, mute, and application volume are not part of this Windows contract, so those actions remain disabled in this mode. Run the portable executable from the normal interactive Windows session rather than a restricted automation sandbox.

### Cider App

1. In Cider, enable **WebSockets API** under Connectivity.
2. Open **Manage External Application Access to Cider** and create an application token.
3. Select **Cider App** in the widget and save that token in Settings.

The adapter is fixed to Cider's loopback service at `127.0.0.1:10767`. The token is validated by Rust, stored only in Windows Credential Manager, sent only in the `apptoken` header, and never written to frontend settings or logs. Main and Settings windows share one native Socket.IO session and one serialized command worker.

The widget reads the actual `0..1` level from Cider's official `GET /api/v1/playback/volume` endpoint, follows `playerStatus.volumeDidChange`, and normalizes the value to the shared `0..100` UI contract. Mute posts `0`; unmute restores the last reliable non-zero level from the current connection, then the manager's remembered level after reconnect. If neither exists, it uses a conservative 25% fallback instead of jumping to full volume. A temporary volume-endpoint failure does not break now-playing; mute stays capability-disabled until a later valid REST response or socket event recovers it.

## Build from source

### Prerequisites

- Windows 10 or 11
- Node.js 24 or newer
- Rust stable with the MSVC target
- Microsoft WebView2 Runtime

### Install and run

```powershell
npm install
npm run dev:desktop
```

Browser-only simulator preview:

```powershell
npm run dev
```

Build the current portable executable:

```powershell
npm run build:desktop
```

Output: `src-tauri/target/release/music-desktop-widget.exe`.

Installers, signing, automatic updates, and GitHub release publication are intentionally not part of the current build path.

## Development commands

| Command                 | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Vite browser preview with simulator fallback   |
| `npm run dev:desktop`   | Tauri desktop development                      |
| `npm run build`         | TypeScript and Vite production build           |
| `npm run build:desktop` | Portable Tauri release build without bundling  |
| `npm run lint`          | ESLint                                         |
| `npm test`              | Vitest unit/component suite                    |
| `npm run test:e2e`      | Serial Playwright simulator smoke suite        |
| `npm run verify`        | Version sync check, lint, tests, and web build |
| `cargo check -j1`       | Native Rust check from `src-tauri/`            |

The root `package.json` is the only manually edited application-version source. Run `npm run version:sync` after a version change; `npm run verify` rejects version drift.

## Privacy and security

- Companion and Cider credentials stay in the OS keyring, not `localStorage`, `settings.json`, diagnostics, or source files.
- Player metadata and artwork are not persisted by the current production adapters.
- Cider is loopback-only; the app does not expose a LAN control endpoint.
- Windows Media diagnostics contain only a bounded stage/category/HRESULT allowlist and rotate at 256 KiB.
- External text and artwork are bounded before they cross the native/frontend bridge.
- No telemetry, accounts, cloud sync, scraping, injection, OCR, or window-title parsing is included.

Please report security issues without publishing credentials, tokens, personal listening data, or diagnostic files that have not been reviewed.

## Architecture and project workflow

- [Architecture](./ARCHITECTURE.md)
- [Engineering decisions](./DECISIONS.md)
- [Roadmap](./project-tracking/roadmap/0000-roadmap.md)
- [Project tracking](./project-tracking/README.md)
- [Definition of Done](./project-tracking/checklists/0000-definition-of-done.md)

Before making a substantial change, read [AGENTS.md](./AGENTS.md). It preserves the repository's branch, validation, security, project-tracking, and time-accounting rules. Work is tracked through numbered tasks and reports under `project-tracking/`; that history is intentionally kept separate from this public product overview.

## Roadmap summary

The ordered cross-platform path is:

1. Linux foundation, native build support, and MPRIS.
2. GitHub CI builds and release automation.
3. More locales and a language selector designed for a larger catalog.
4. macOS platform support.

The detailed roadmap also records deferred Windows packaging, optional local WMS history/favorites, diagnostics, and future visual work. See the [dedicated roadmap file](./project-tracking/roadmap/0000-roadmap.md) for current status and acceptance boundaries.

## Development effort snapshot

As of 2026-07-15, the repository records **about 2 working days and 3 hours (19 hours 15 minutes tracked)** of focused AI-assisted implementation, debugging, live validation, and documentation work.

The same history is roughly estimated at **about 10 million text tokens** and **approximately USD 100** if performed through the standard GPT-5.6 Sol API, including repeated context reads and tool-driven development loops. This is a deliberately rounded project estimate rather than a billing record; the pricing reference is the official [GPT-5.6 Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol), captured on 2026-07-15.

That development effort is already invested in the public project. Build it, use it, improve it, and enjoy the result without a project usage fee; third-party music services may still have their own terms or subscriptions.

## Current limitations

- End-user support is Windows-only today.
- Builds are portable-only and are not yet published automatically through GitHub Releases.
- Windows Media capabilities vary by player and current session.
- Cider requires its local WebSockets API and an application token.
- Only English and Russian are currently bundled.
- Local playback history, cloud sync, telemetry, and automatic updating are not implemented.
