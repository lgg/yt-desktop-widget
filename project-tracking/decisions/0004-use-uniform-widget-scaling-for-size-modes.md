# 0004 - Use uniform widget scaling for size modes

## Status

Accepted

## Context

The current widget is a carefully tuned cover-driven layout with fixed pixel geometry and intrinsic height changes when optional sections or runtime states change. Size customization must preserve that approved design, keep all hit targets and spacing proportional, and avoid a broad responsive-layout rewrite. The Settings window must remain at its normal size.

Custom mode must expose both width and height while preventing visual distortion. The canonical full widget geometry is 336 x 438, while shorter runtime/preference states continue to use their measured intrinsic height.

## Decision

Keep one canonical 336 px-wide widget layout and uniformly scale only its widget content wrapper with a top-left transform origin. The native window width is the canonical width multiplied by the selected factor. The native height is the currently measured intrinsic base height multiplied by the same factor.

Use these modes:

- Compact: 85%.
- Default: 100% and visually identical to the current widget.
- Large: 125%.
- Custom: a persisted 75%-150% percentage.

Custom width and height fields are two views of one canonical scale percentage. Editing either dimension derives and clamps the percentage, then recalculates the other dimension from the 336 x 438 reference ratio. Free non-proportional resizing is not supported.

## Alternatives Considered

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Uniform CSS transform plus native window resize | Preserves every visual proportion and existing layout; explicit measurement model; minimal default risk | Requires coordinating transformed visual size with untransformed layout measurements | Chosen. |
| CSS `zoom` | Concise and affects layout metrics | Non-standard behavior and less predictable measurement/input interoperability across webviews | Avoid unnecessary runtime ambiguity. |
| Independent X/Y scaling | Lets both dimensions be arbitrary | Distorts artwork, circles, text, icons, and hit targets | Violates proportional-scaling requirement. |
| Rewrite as a fully responsive layout | Could eventually support alternate compositions | Large scope and regression risk; size changes would not necessarily remain proportional | Does not preserve the current approved layout closely enough for this task. |
| Resize only the native window/background | Small implementation | Leaves artwork and controls unchanged and creates empty space | Explicitly rejected by the product requirement. |

## Consequences

Positive:

- Default mode remains the exact current geometry.
- All visible widget elements scale by the same factor.
- Existing dynamic show/hide and runtime-state heights remain authoritative.
- Custom inputs cannot produce stretched or internally inconsistent layouts.
- The persisted model has one numeric source of truth, avoiding width/height drift.

Negative / tradeoffs:

- The custom width/height ratio is intentionally locked.
- Text is transformed with the rest of the widget rather than reflowed at a new logical width.
- Native window bounds must cover every scaled intrinsic state.

## Implementation Notes

- Keep scale constants and conversion helpers in one frontend module.
- Apply the scale variable only in `WidgetWindow`, never in `SettingsWindow`.
- Measure base `scrollHeight` before multiplication and round native dimensions to integer physical pixels.
- Keep Tauri `resizable: false`; Settings remains the only manual size-control surface.
- Normalize legacy/malformed values to Default/100% and clamp Custom before use.

## Review Date

Review if the product introduces free border resizing, alternate window compositions, or a responsive/reflowing widget layout.

## Links

- Related tasks: [`0043-add-widget-size-presets-and-custom-dimensions.md`](../tasks/0043-add-widget-size-presets-and-custom-dimensions.md), [`0006-add-future-widget-size-presets-and-manual-resize-support.md`](../tasks/0006-add-future-widget-size-presets-and-manual-resize-support.md)
- Related reports: [`0043-add-widget-size-presets-and-custom-dimensions.md`](../reports/0043-add-widget-size-presets-and-custom-dimensions.md)
- Related PRs: branch `codex/0043-widget-size-presets-custom-dimensions`
