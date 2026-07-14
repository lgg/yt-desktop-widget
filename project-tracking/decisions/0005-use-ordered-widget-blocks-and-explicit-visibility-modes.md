# 0005 - Use ordered widget blocks and explicit visibility modes

## Status

Accepted

## Context

Version 3 adds user-controlled ordering for six primary widget areas and four different visibility/geometry behaviors for content rows. The existing widget mixes artwork and metadata in one hero and controls/progress in one footer, which cannot represent arbitrary order without fragile CSS exceptions. Existing boolean settings must migrate without changing the approved v2 default.

## Decision

Represent the main widget as an ordered list of six stable block identifiers:

1. `header`
2. `artwork`
3. `trackDetails`
4. `likeDislike`
5. `playbackControls`
6. `progress`

Persist one normalized permutation. Invalid identifiers are discarded, duplicates keep their first occurrence, and missing canonical blocks are appended. The legacy/default order places Like/Dislike between Track details and Playback controls, but its default Hidden visibility preserves the v2 visual layout.

Use one shared four-state visibility model for Track details, Like/Dislike, Playback controls, and Progress:

- `always`: rendered and visible.
- `hoverReserved`: rendered at all times; opacity/pointer access follows the widget hover-or-keyboard-focus boundary, so geometry is reserved.
- `hoverDynamic`: rendered only while the widget hover-or-keyboard-focus boundary is active, so intrinsic/native height changes.
- `hidden`: not rendered and contributes no height.

Header children retain focused preferences: status badge and mute use Always/Hover/Hidden, while existing settings/close hover behavior remains backward compatible. Artwork remains present because it carries playback and connection states.

Settings ordering uses explicit Move up/Move down buttons. This avoids a drag-only accessibility dependency and makes persistence tests deterministic. All top-level Settings sections use semantic expand/collapse buttons and persist a normalized set of collapsed section IDs.

## Alternatives Considered

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Independent ordered blocks | Direct mapping to user intent; predictable persistence and testing | Requires decomposing hero/footer CSS | Chosen. |
| CSS `order` on existing hero/footer children | Smaller initial diff | Cannot move children across container boundaries; special cases multiply | Too fragile for arbitrary order. |
| HTML drag-and-drop only | Familiar visual interaction | Weak keyboard/WebView accessibility and harder deterministic tests | Explicit buttons are more inclusive and reliable. |
| Store numeric positions per block | Simple individual updates | Duplicates/gaps and migration ambiguity | A normalized permutation is a stronger invariant. |
| Keep legacy booleans plus new modes indefinitely | Easy initial migration | Two competing sources of truth | Migrate once into explicit modes and serialize only the new contract. |

## Consequences

Positive:

- Every supported layout is derived from one validated order.
- Visibility semantics are consistent across content/action rows.
- Reserved and dynamic hover behaviors are explicit rather than accidental CSS side effects.
- Keyboard users can configure the same ordering as pointer users.
- Legacy settings have a deterministic migration path.

Negative / tradeoffs:

- Dynamic hover mode intentionally resizes the widget and therefore needs native WebView smoke coverage.
- Arbitrary ordering can produce unconventional layouts; the app preserves proportions and spacing but does not override user choices.
- Artwork and fallback state cards are not fully hideable/reorderable because they are required for connection/auth usability.

## Implementation Notes

- Centralize block IDs, visibility IDs, order normalization, and visibility derivation in a pure frontend module with unit tests.
- Mirror whitelist normalization in Rust before settings are rewritten to disk.
- Keep `interactionActive` as the single pointer/keyboard boundary for all hover modes.
- Give every rendered block a stable `data-widget-block` hook for deterministic E2E order/geometry checks.
- Keep all interactive block descendants excluded from native window dragging.

## Review Date

Review if future work adds drag handles, hiding Artwork, alternate responsive compositions, or more primary blocks.

## Links

- Related task: [`0044-add-v3-customizable-widget-blocks-and-playback-actions.md`](../tasks/0044-add-v3-customizable-widget-blocks-and-playback-actions.md)
- Related report: [`0044-add-v3-customizable-widget-blocks-and-playback-actions.md`](../reports/0044-add-v3-customizable-widget-blocks-and-playback-actions.md)
- Related decision: [`0004-use-uniform-widget-scaling-for-size-modes.md`](0004-use-uniform-widget-scaling-for-size-modes.md)
