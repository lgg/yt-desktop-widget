# 0007 - Run Windows Media on a dedicated MTA worker

## Status

Accepted

## Context

The initial Windows Media Session adapter created WinRT async operations and synchronously waited on them from arbitrary Tauri/Tokio worker threads. Those threads were not explicitly initialized for WinRT, blocking `.get()` calls occupied async runtime workers, connect/disconnect relied on aborting an async polling task, and Windows errors discarded their HRESULT.

Microsoft metadata marks GSMTC manager/session objects as Agile and both-threaded, so strict COM object affinity is not assumed. The requirement is instead to guarantee an initialized apartment for every blocking WinRT call and isolate those waits from the async/UI runtime.

## Decision

- Lazily create one named `std::thread` when WMS is first used.
- Initialize that thread with `RoInitialize(RO_INIT_MULTITHREADED)` and balance successful initialization with `RoUninitialize` through an RAII guard.
- Own the manager, current connection state, last snapshot, polling state, and Tauri event target on that thread.
- Send discovery, connect, disconnect, and command requests through a typed channel and return results through Tokio one-shot channels.
- Poll with the worker channel's 750 ms receive timeout while connected; no WinRT `.get()` runs in Tokio.
- Treat manager access as the connection boundary. Do not make initial metadata, timeline, controls, artwork, session count, or current-session detail prerequisites for attaching the frontend.
- On a live poll failure, retain the last snapshot, clear the possibly stale manager, publish the structured diagnostic, and reacquire through the next worker cycle. A successful poll clears the error state.
- Bound caller waits to 15 seconds. Ignore requests already cancelled before execution and commit a prepared connection only after its result receiver accepts the response.
- Keep public error messages generic and attach an optional non-sensitive diagnostic containing only stage, HRESULT, and category.
- Persist WMS failures as a bounded whitelist-only JSONL log and surface the same safe diagnostic in localized recovery UI. Never record media metadata, artwork, source-app identity, credentials, or tokens.
- Continue following only the Windows current session; do not pick an arbitrary session from `GetSessions()`.
- Treat a normal interactive Windows user session as the supported portable execution context. Do not attempt to escape or relaunch out of restricted launchers; instruct the user to start the portable EXE directly instead.

## Consequences

- Companion-only launches do not start the WMS thread.
- WMS operations and lifecycle mutations are serialized without sharing WinRT objects across arbitrary runtime tasks.
- A blocked Windows call cannot block a Tokio worker, although the OS call itself cannot be forcibly cancelled; later queued work may time out until the actor recovers.
- A transient player/session transition can delay a snapshot but cannot fail the manager-level attach or permanently leave the frontend in `Waiting`.
- A 2026-07-14 same-binary comparison proved that unpackaged access is available: the restricted Codex sandbox failed at `request_manager.await` with `0x80070005`, while the normal interactive-user launch enumerated three sessions and returned the active Apple Music session.
- Package identity is not a prerequisite for the supported portable path. Task `0049` remains deferred only as a future installer/product-delivery choice, not as a WMS access fix.
- Full widget metadata/transport behavior still requires a direct-launch smoke after meaningful WMS changes because automated tests cannot reproduce every player implementation.

## Links

- Task: `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`
- Report: `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- Follow-up task: `project-tracking/tasks/0051-diagnose-unpackaged-windows-media-access.md`
- Recovery task/report: `project-tracking/tasks/0052-fix-live-windows-media-session-snapshot-failure.md`, `project-tracking/reports/0052-fix-live-windows-media-session-snapshot-failure.md`
- Related decision: `project-tracking/decisions/0006-separate-product-playback-source-from-development-source-mode.md`
