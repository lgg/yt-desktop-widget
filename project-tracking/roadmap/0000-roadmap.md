# Music Desktop Widget Roadmap

## Purpose

This is the single authoritative roadmap for Music Desktop Widget. It describes forward product work; detailed completed history remains in [`tasks/`](../tasks/), [`reports/`](../reports/), and the migrated archive rather than being repeated here.

The roadmap is ordered by dependency, not by promised date. A phase moves to `In Progress` only when its task has acceptance criteria, a verification plan, and a recorded start time.

## Current Baseline

Version `3.1.0` is a Windows-first portable Tauri application with:

- YTMDesktop Companion, Windows Media Session/GSMTC, and Cider playback adapters;
- English and Russian localization;
- keyring-backed credentials, tray/startup integration, and configurable widget layout/appearance;
- Vitest, Rust, and Playwright coverage plus live Windows adapter validation;
- portable local builds, but no automated GitHub build/release workflow yet.

Latest stabilization: [`0054-fix-live-wms-and-cider-token-auth.md`](../tasks/0054-fix-live-wms-and-cider-token-auth.md). The public-repository baseline was completed in [`0055-public-repository-rename-and-documentation-audit.md`](../tasks/0055-public-repository-rename-and-documentation-audit.md).

## Tracking Snapshot

- Total tracked tasks: 58
- In progress: 0
- Open: 0
- Deferred/planned: 10
- Blocked: 0
- Completed: 48

## Ordered Delivery Path

| Phase | Status | Task | Intended outcome |
| --- | --- | --- | --- |
| 0. Public repository baseline | Completed | [`0055`](../tasks/0055-public-repository-rename-and-documentation-audit.md) | Completed the Music Desktop Widget rename, public README, documentation/security audit, and accurate roadmap. |
| 1. Linux + MPRIS | Planned | [`0056`](../tasks/0056-add-linux-build-and-mpris-support.md) | Make the app compile and run on Linux, add an official MPRIS/D-Bus adapter, and adapt keyring, tray, startup, and window behavior. |
| 2. GitHub CI and releases | Planned after Linux | [`0057`](../tasks/0057-add-github-ci-builds-and-releases.md) | Verify Windows/Linux on GitHub Actions and publish reproducible versioned artifacts through a controlled release workflow. |
| 3. Localization scale-up | Planned after CI | [`0058`](../tasks/0058-scale-localization-and-language-selection.md) | Add more locales and replace the two-button language control with a scalable accessible language picker. |
| 4. macOS support | Planned after localization | [`0007`](../tasks/0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md) | Adapt build, window, tray, startup, keyring, packaging, signing, and supported playback adapters for macOS. |

## Phase Notes

### 1. Linux foundation and MPRIS

Linux is the first cross-platform target. The phase must first isolate Windows-only Rust dependencies and runtime services, then produce a working Linux build and add MPRIS through the official D-Bus contract. Player capabilities remain explicit; no scraping or window-title fallbacks are allowed.

### 2. GitHub CI builds and releases

CI follows the Linux foundation so the workflow starts with a real supported matrix rather than a Windows-only placeholder. Pull requests should run deterministic frontend/native checks; tagged releases should publish clearly named Windows and Linux artifacts with checksums. Signing credentials, if introduced, must remain in GitHub secrets and require a separate documented decision.

### 3. More languages and a scalable picker

English and Russian are the current baseline. The next localization phase adds more complete locale bundles, defines translator/contributor checks, and replaces the current segmented two-language UI with a control that remains usable as the catalog grows.

### 4. macOS

macOS comes after the Linux and release foundations. The phase covers native build compatibility, keychain storage, tray/menu-bar behavior, startup, transparent-window behavior, signing/notarization, and an explicit adapter support matrix. Companion/Cider portability may be reused where their official local APIs permit it; a system-wide macOS adapter must use a supported public contract or remain unavailable.

## Unscheduled Backlog

These tasks remain valid but do not interrupt the ordered cross-platform path unless reprioritized explicitly:

| Priority | Task | Boundary |
| --- | --- | --- |
| Later | [`0046` — opt-in local WMS history/favorites/export](../tasks/0046-add-opt-in-local-playback-history-favorites-and-export.md) | Personal-data design is required before implementation; default remains off. |
| Later | [`0049` — optional packaged Windows delivery](../tasks/0049-add-supported-packaged-wms-delivery.md) | Portable Windows remains first-class; signing/package model requires approval. |
| Later | [`0009` — installer packaging](../tasks/0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md) | Revisit with CI/releases rather than adding an ad-hoc local installer. |
| Later | [`0011` — visual refinement and alternate window modes](../tasks/0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md) | Preserve current configurable layout until a focused design pass. |
| Later | [`0013` — richer Companion diagnostics](../tasks/0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md) | Must remain credential-safe and bounded. |

The migrated umbrella task [`0005`](../tasks/0005-track-deferred-post-v1-roadmap-items.md) remains historical context, not an additional delivery phase.

## Roadmap Rules

- Official playback integrations only; no UI scraping, injection, OCR, or window-title parsing.
- Windows remains supported while Linux and macOS are added.
- Platform support requires a native build, documented adapter matrix, keyring/storage behavior, lifecycle verification, and a user-facing artifact.
- CI/release work may not commit certificates, tokens, signing keys, or other credentials.
- New locales require complete key parity, fallback behavior, persistence, layout checks, and contributor documentation.
- Update this file when phase order, status, dependency, or scope changes; do not maintain a second roadmap elsewhere.
