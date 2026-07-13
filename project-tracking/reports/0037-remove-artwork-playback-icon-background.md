# 0037 - Remove artwork playback icon background report

## Summary

The optional artwork-wide play/pause control now shows only a large semi-transparent action glyph. The circular glass container, artwork-wide tint, border, radius, wrapper shadow, and backdrop blur are gone. The SVG is 78 px and uses only a glyph-following drop shadow to stay legible on bright covers.

## Done

- Removed the artwork-wide hover tint from the playback indicator.
- Removed the icon wrapper's circular background, border, radius, shadow, and backdrop blur.
- Increased the play/pause SVG from 38 px to 78 px while keeping its white color at 72% opacity.
- Added a glyph-only SVG drop shadow for contrast without recreating a background shape.
- Preserved the full-artwork click target, keyboard activation, focus outline, hover/focus reveal, and localized accessible labels.
- Extended the browser regression with computed-style assertions for transparent wrappers, no decorations, glyph size, opacity, and filter.

## Time Tracking

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| Iteration ID       | `2026-07-13-0037-a`                              |
| Started at         | `2026-07-13T21:28:35+03:00`                      |
| Finished at        | `2026-07-13T21:47:36+03:00`                      |
| Time spent minutes | `20`                                             |
| Tracking status    | `tracked`                                        |
| Time log row       | `project-tracking/time-log.md#2026-07-13-0037-a` |

## Changed Areas

| Area                 | Status         | Notes                                                                       |
| -------------------- | -------------- | --------------------------------------------------------------------------- |
| Backend/native       | Not applicable | No Rust, Tauri runtime, permissions, or Companion behavior changed.         |
| Frontend             | Changed        | Refined only the artwork playback indicator presentation.                   |
| Domain/API contracts | Unchanged      | Artwork activation still sends the existing `playPause` command.            |
| Tests                | Changed        | Added browser computed-style coverage for the standalone glyph.             |
| Documentation        | Changed        | README now describes the standalone glyph.                                  |
| Build/release/config | Unchanged      | Central version remains `2.0.0`; portable-only release policy is unchanged. |
| Bootstrap sync       | Not applicable | No project rules were synchronized or changed.                              |
| Time tracking        | Changed        | Task, report, and time log record iteration `2026-07-13-0037-a`.            |
| Project tracking     | Changed        | Task `0037` completed; roadmap returns to zero active tasks.                |

## Changed Files

- `README.md`
- `src/styles/global.css`
- `tests/e2e/widget.spec.ts`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/tasks/0037-remove-artwork-playback-icon-background.md`
- `project-tracking/reports/0037-remove-artwork-playback-icon-background.md`
- `project-tracking/time-log.md`

## Verification

| Check                        | Result     | Notes                                                                                                  |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Focused Playwright RED/GREEN | Passed     | Old circle failed no-decoration assertions; missing glyph filter failed before the final CSS change.   |
| `npm run verify`             | Passed     | Version `2.0.0` synchronized; ESLint passed; 55/55 Vitest tests passed; TypeScript/Vite build passed.  |
| `npm run test:e2e`           | Passed     | 8/8 browser regression scenarios passed.                                                               |
| `npm run build:desktop`      | Passed     | Release Tauri executable built at `src-tauri/target/release/ytm-desktop-widget.exe`.                   |
| Manual QA                    | Passed     | Headed Chromium at 336×520 confirmed no circle/tint and a visible standalone glyph on hover.           |
| Focused Prettier check       | Passed     | Six scoped files match Prettier; `time-log.md` kept its existing table style to avoid unrelated churn. |
| Repository Prettier baseline | Known debt | Repository-wide check reports 143 pre-existing formatting warnings; no mass reformat was performed.    |
| Docs/release review          | Passed     | Roadmap/task/report agree; version/package/native configuration were not edited.                       |
| Time tracking review         | Passed     | Task, report, and time log use the same tracked 20-minute iteration.                                   |

## Not Verified

- A new portable archive was not packaged; the user had already built the portable package in the preceding pass and this CSS-only change was verified with a production desktop binary.
- Live Companion behavior was not repeated because command/data/native paths were unchanged and the user already confirmed the preceding pass live.

## Questions Resolved

| Question                                          | Resolution                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Should any circular or artwork-wide layer remain? | No. Only the SVG glyph and its glyph-following contrast shadow remain. |
| How large should the glyph be?                    | 78 px, matching the removed circle's CSS diameter.                     |
| Should the artwork interaction change?            | No. The entire artwork remains the same accessible play/pause target.  |

## Open Questions

None.

## Residual Risks

- Extremely high-contrast artwork can still affect perceived glyph contrast, but the drop shadow follows only the symbol and preserves the requested background-free treatment.
- The repository-wide Prettier baseline remains noisy and should be handled in a dedicated formatting task if desired.

## Next Steps

- No active roadmap work remains after this refinement; continue with user-driven QA or explicitly deferred roadmap items when prioritized.
