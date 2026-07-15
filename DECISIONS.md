# Music Desktop Widget Decisions

This file is the public index of durable engineering decisions. The numbered records under [`project-tracking/decisions/`](./project-tracking/decisions/) contain the detailed context, consequences, and links used during implementation.

## Current decision summary

| Area | Decision |
| --- | --- |
| Application stack | Use Tauri v2 with a React/TypeScript frontend and a Rust native backend. |
| Playback integrations | Use only official contracts: YTMDesktop Companion, Windows GSMTC, Cider's local API, and future Linux MPRIS. No scraping, injection, OCR, or window-title parsing. |
| Runtime sources | Keep the user-selected production adapter separate from the development simulator mode. |
| Credentials | Keep Companion/Cider secrets in the OS keyring; never frontend settings or logs. |
| Windows Media | Run WinRT/GSMTC work on one lazy dedicated MTA worker and expose source capability flags. |
| Cider | Keep the endpoint loopback-only and share one native Socket.IO lifecycle across application windows. |
| Settings/versioning | Use `package.json` as the manually edited version source and normalize persisted settings at the boundary. |
| Widget layout | Scale the complete widget uniformly and persist an explicit ordered block model with visibility modes. |
| Delivery | Keep the current Windows test build portable-only until the roadmap introduces CI/releases and approved packaging/signing. |
| Product rename | Present the product as Music Desktop Widget while retaining compatibility-sensitive legacy runtime identifiers until a real migration can preserve credentials/settings. |
| Project process | Use numbered Markdown tasks/reports/decisions, tracked iteration time, branch-per-pass delivery, and the repository rules in `AGENTS.md`. |

## Numbered records

- [`0000` — Markdown project tracking](./project-tracking/decisions/0000-use-markdown-project-tracking.md)
- [`0001` — Current architecture decisions](./project-tracking/decisions/0001-current-architecture-decisions.md)
- [`0002` — Branch-per-pass commit/merge/push workflow](./project-tracking/decisions/0002-adopt-branch-per-pass-commit-merge-push-workflow.md)
- [`0003` — Root package version source](./project-tracking/decisions/0003-use-package-json-as-central-version-source.md)
- [`0004` — Uniform widget scaling](./project-tracking/decisions/0004-use-uniform-widget-scaling-for-size-modes.md)
- [`0005` — Ordered blocks and explicit visibility modes](./project-tracking/decisions/0005-use-ordered-widget-blocks-and-explicit-visibility-modes.md)
- [`0006` — Product playback source vs development source mode](./project-tracking/decisions/0006-separate-product-playback-source-from-development-source-mode.md)
- [`0007` — Dedicated MTA worker for Windows Media](./project-tracking/decisions/0007-run-windows-media-on-a-dedicated-mta-worker.md)
- [`0008` — Loopback keyring-backed Cider adapter](./project-tracking/decisions/0008-use-a-loopback-keyring-backed-cider-adapter.md)
- [`0009` — Public rename with stable runtime identifiers](./project-tracking/decisions/0009-rename-product-while-preserving-runtime-identifiers.md)

## How decisions change

When a durable product, architecture, security, release, or workflow choice changes, update the relevant numbered record or add the next one. Link it from the active task/report and keep this index concise. Historical decisions are amended or superseded, not silently erased.
