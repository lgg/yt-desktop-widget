# 0008 - Use a loopback keyring-backed Cider adapter

## Status

Accepted

## Decision

Cider is a separate explicit playback source using its official local Socket.IO and REST API on `127.0.0.1:10767`. The endpoint is not user-configurable in this release. Cider external-application tokens are validated by Rust and stored only in Windows Credential Manager under a source-specific account.

## Consequences

- Cider can provide richer metadata, realtime progress, rating, seek, and transport actions without relying on GSMTC completeness.
- The widget does not weaken Cider's `apiTokensRequired` setting or edit Cider configuration.
- LAN/remote Cider control is out of scope, avoiding a new network-exposure surface.
- Cider protocol changes remain isolated to `src-tauri/src/cider.rs` and `src/integration/cider/`.
- The installed Cider 4 contract was live-confirmed on 2026-07-15: token-protected REST accepts the `apptoken` header, Socket.IO connects on the same loopback service, and the portable release maps metadata/artwork and transport state successfully.
- Tauri's custom-command ACL is part of the adapter boundary. A native command is not considered delivered unless it is both registered in `generate_handler!` and allowed by `src-tauri/permissions/default.toml`; an automated parity regression enforces this.

## Links

- Task: `project-tracking/tasks/0053-fix-windows-media-and-add-cider-adapter.md`
- Report: `project-tracking/reports/0053-fix-windows-media-and-add-cider-adapter.md`
- Live-fix task: `project-tracking/tasks/0054-fix-live-wms-and-cider-token-auth.md`
- Live-fix report: `project-tracking/reports/0054-fix-live-wms-and-cider-token-auth.md`
