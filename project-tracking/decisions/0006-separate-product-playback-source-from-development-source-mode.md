# 0006 - Separate product playback source from development source mode

## Status

Accepted

## Context

The application historically has `api.sourceMode` values `auto`, `real`, and `simulator`. That setting selects the real YTMDesktop Companion bridge or the local simulator and is also used by browser/E2E development. Version 3.1 adds a user-facing product choice between YTMDesktop Companion and Windows Media Session. Reusing or extending the development enum would mix user intent, runtime availability, browser fallbacks, and test overrides.

Windows Media Session also exposes a different capability set: metadata, transport, and timeline are available when the source app publishes them, while rating and volume/mute are not.

## Decision

Add a separate persisted `playbackSource` with two production values:

1. `companion` (default and migration value)
2. `windowsMediaSession`

Keep the existing `sourceMode` only as a development/runtime selector. In production Tauri:

- `playbackSource=companion` resolves to the existing real Companion gateway unless an explicit simulator override is active in a development/browser workflow. Native release builds ignore legacy persisted or query/env simulator overrides.
- `playbackSource=windowsMediaSession` resolves to a new WMS gateway and never touches Companion auth/network/keyring behavior.
- Browser preview remains simulator-backed even if persisted WMS data appears, because WinRT is unavailable there.

Extend playback snapshots with explicit capability flags. UI availability is derived from capabilities rather than source-name conditionals. The WMS gateway additionally treats unsupported rating and mute command variants as successful no-ops, providing defense in depth against stale UI, direct calls, or migrated settings.

The WMS native adapter uses the Windows-selected current GSMTC session and keeps media data in memory only. Task `0050` supersedes the original async-poll-task implementation with the dedicated MTA-worker architecture recorded in decision `0007`.

## Alternatives Considered

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Separate product source plus dev mode | Preserves current tests/preview; clear UX and migration; independent evolution | Adds one persisted field and resolution step | Chosen. |
| Extend `sourceMode` with WMS | Smallest type diff | Mixes product and test concerns; ambiguous `auto`; harder browser fallback | Rejected. |
| Replace the controller with source-specific React state | Direct WMS implementation | Duplicates reconnect/progress/window behavior and risks Companion regressions | Rejected. |
| Pretend rating/mute are supported | Keeps buttons active | Commands cannot be fulfilled and would mislead users or create loops | Rejected. |
| Hide rating block by mutating its saved setting | Removes unusable controls | Destroys the user's layout preference when switching back to Companion | Rejected. |
| Persist media history immediately | Enables local favorites | Introduces personal-data storage/export scope before consent and schema are designed | Deferred to task `0046`. |

## Consequences

Positive:

- Companion remains behaviorally stable and the default.
- WMS can support multiple compatible Windows media apps through one OS contract.
- Unsupported actions are explicit, testable, and safe.
- Future playback sources can reuse the same product-source and capability model.
- Browser/E2E simulator workflows remain available.

Negative / tradeoffs:

- Internal legacy names such as `CompanionRawState` remain around the shared adapter boundary in this scoped pass.
- Windows determines the current session; users cannot pick among multiple active sessions yet.
- WMS completeness varies by source application.
- Portable Win32 behavior is validated in the normal interactive user session; task `0051` proves a restricted launcher can still deny the same unpackaged API independently of package identity.

## Security and Privacy

- WMS reads only the current media session selected by Windows.
- Metadata/artwork remain in memory and are not logged, transmitted, or persisted.
- No Companion token or keyring behavior changes.
- No telemetry, new listening port, or external network request is added.
- Local history/favorites require a separate opt-in design and task because they persist personal listening data.

## Review Date

Review when adding local history, manual session selection, a third production source, macOS media sessions, or installer/MSIX packaging.

## Links

- Related task: [`0045-add-windows-media-session-playback-source.md`](../tasks/0045-add-windows-media-session-playback-source.md)
- Future history task: [`0046-add-opt-in-local-playback-history-favorites-and-export.md`](../tasks/0046-add-opt-in-local-playback-history-favorites-and-export.md)
- Related report: [`0045-add-windows-media-session-playback-source.md`](../reports/0045-add-windows-media-session-playback-source.md)
