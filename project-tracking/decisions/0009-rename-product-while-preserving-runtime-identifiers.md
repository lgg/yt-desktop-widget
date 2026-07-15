# 0009 - Rename the product while preserving runtime identifiers

## Status

Accepted

## Context

The public repository and product are now named **Music Desktop Widget** / `music-desktop-widget`. Several older strings are also durable machine identifiers: the Tauri application identifier determines native config/log directories, the keyring service locates stored credentials, the Companion `appId` identifies an authorized client, the browser-preview storage key preserves local development settings, and the Windows startup registry value identifies the existing startup entry.

Blindly replacing those identifiers would make existing users appear to lose settings or authorization and could leave duplicate startup entries.

## Decision

- Rename all user-visible product text, current repository URLs, root package metadata, Rust package/library names, native window/tray titles, and the portable executable to Music Desktop Widget / `music-desktop-widget`.
- Retain the following compatibility-sensitive identifiers until a dedicated migration reads/moves/verifies old state before deleting it:
  - Tauri identifier and keyring service: `io.github.lgg.ytm-desktop-widget`
  - Companion authorization `appId`: `ytmdesktopwidget`
  - browser-preview settings key: `ytm-desktop-widget.settings`
  - Windows startup registry value: `YTMDesktopWidget`
- Historical reports may retain the exact old artifact/product names they verified. Active product guidance and links use the new name.
- Any later full identifier migration requires explicit rollback/data-loss analysis and tests for settings, both credential accounts, startup, logs, and Companion reauthorization behavior.

## Consequences

- The built executable becomes `music-desktop-widget.exe`, and Settings opens `https://github.com/lgg/music-desktop-widget`.
- Existing native settings, logs, Companion tokens, Cider tokens, and startup configuration continue to resolve.
- A source search still finds a small, documented set of old strings; those are compatibility data, not stale user-facing branding.
- Cross-platform work can choose new platform-native identifiers only through an explicit migration/compatibility decision.

## Links

- Task: `project-tracking/tasks/0055-public-repository-rename-and-documentation-audit.md`
- Report: `project-tracking/reports/0055-public-repository-rename-and-documentation-audit.md`
- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
