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
- Bound caller waits to 15 seconds. Ignore requests already cancelled before execution and commit a prepared connection only after its result receiver accepts the response.
- Keep public error messages generic and attach an optional non-sensitive diagnostic containing only stage, HRESULT, and category.
- Continue following only the Windows current session; do not pick an arbitrary session from `GetSessions()`.

## Consequences

- Companion-only launches do not start the WMS thread.
- WMS operations and lifecycle mutations are serialized without sharing WinRT objects across arbitrary runtime tasks.
- A blocked Windows call cannot block a Tokio worker, although the OS call itself cannot be forcibly cancelled; later queued work may time out until the actor recovers.
- An interactive portable smoke remains necessary because apartment correctness does not guarantee that Windows will grant session-manager access to an unpackaged process.
- Packaged delivery task `0049` remains a fallback if the corrected portable process receives `E_ACCESSDENIED`.

## Links

- Task: `project-tracking/tasks/0050-fix-portable-windows-media-session-runtime.md`
- Report: `project-tracking/reports/0050-fix-portable-windows-media-session-runtime.md`
- Related decision: `project-tracking/decisions/0006-separate-product-playback-source-from-development-source-mode.md`
