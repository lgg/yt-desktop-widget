# 0000 - Roadmap

## Purpose

This roadmap is the top-level planning document for the YTM Desktop Widget project. It replaces Beads as the project planning entrypoint together with the task files in `project-tracking/tasks/`.

## Current Tracking Snapshot

- Source migrated from Beads export: `project-tracking/archive/beads-export-2026-07-05.jsonl`
- Migrated Beads issues: 15
- Total tracked tasks: 53
- Open: 0
- In progress: 0
- Blocked: 0
- Deferred: 7
- Completed: 46

## Current Stabilization Work

- Completed P1: Fix Windows Media and add a Cider adapter - [`0053-fix-windows-media-and-add-cider-adapter.md`](../tasks/0053-fix-windows-media-and-add-cider-adapter.md) - fixes first-empty/partial WMS snapshots and adds a loopback-only, keyring-backed Cider source.

- Completed P1: Fix live Windows Media Session snapshot failure - [`0052-fix-live-windows-media-session-snapshot-failure.md`](../tasks/0052-fix-live-windows-media-session-snapshot-failure.md) - decouples manager attach from the initial snapshot, reacquires after transient poll failures, preserves live diagnostics end to end, passes full verification, and produces a fresh healthy WMS-selected portable build.
- Completed P1: Diagnose unpackaged Windows Media access - [`0051-diagnose-unpackaged-windows-media-access.md`](../tasks/0051-diagnose-unpackaged-windows-media-access.md) - proved the same unpackaged WMS probe fails only under the restricted Codex sandbox and succeeds against active Apple Music in the normal interactive user session, then added localized direct-launch recovery, safe rotating diagnostics, regressions, and a fresh portable artifact.
- Completed P1: Fix portable Windows Media Session runtime - [`0050-fix-portable-windows-media-session-runtime.md`](../tasks/0050-fix-portable-windows-media-session-runtime.md) - moved all blocking GSMTC work to a dedicated MTA worker, preserved safe HRESULT diagnostics, prevented release simulator overrides, and was validated by task `0051` in the normal interactive Windows context.
- Completed P1: Unify Settings visibility controls and layout - [`0048-unify-settings-visibility-controls-and-layout.md`](../tasks/0048-unify-settings-visibility-controls-and-layout.md) - replaced Settings/Close switches with two-choice segmented controls while preserving booleans, made four-mode selectors use deterministic two-row grouping, and completed branch plus `master` delivery.
- Completed P1: Deep completion audit for Windows Media Session version 3.1.0 - [`0047-deep-audit-windows-media-session-release.md`](../tasks/0047-deep-audit-windows-media-session-release.md) - verified lifecycle, concurrency, capabilities, error handling, migrations, UI, security/privacy, E2E/release behavior, fixed all confirmed defects with regressions, and completed branch plus `master` delivery.
- Completed P1: Windows Media Session playback source and version 3.1.0 - [`0045-add-windows-media-session-playback-source.md`](../tasks/0045-add-windows-media-session-playback-source.md) - keeps Companion as the default, adds a first Settings source choice and current-session GSMTC adapter, capability-safe WMS controls, docs, migration, and a full audit; a normal interactive Windows/app compatibility smoke remains a release activity.
- Completed P1: Version 3 customizable blocks and playback actions - [`0044-add-v3-customizable-widget-blocks-and-playback-actions.md`](../tasks/0044-add-v3-customizable-widget-blocks-and-playback-actions.md) - adds mute and Like/Dislike controls, explicit four-mode visibility, persisted block ordering, collapsible Settings sections, centralized `3.0.0`, and a full audit while preserving the v2 migration default.
- Completed P3: Widget size presets and custom dimensions - [`0043-add-widget-size-presets-and-custom-dimensions.md`](../tasks/0043-add-widget-size-presets-and-custom-dimensions.md) - preserves the current 336 x 438 layout as Default, adds Compact/Large presets and linked Custom width/height controls, uniformly scales the full widget plus its intrinsic window height, and closes migrated parent task [`0006`](../tasks/0006-add-future-widget-size-presets-and-manual-resize-support.md).
- Completed P1: Fix stuck hover and control jitter - [`0042-fix-stuck-hover-and-control-jitter.md`](../tasks/0042-fix-stuck-hover-and-control-jitter.md) - removed conflicting native drag regions from the hover boundary, stabilized pointer/focus/blur visibility and button geometry, added reduced-motion handling, and completed a fresh frontend/native/dependency audit.
- Completed P1: Widget height, drag surface, LIVE badge modes, and full audit - [`0041-equalize-widget-height-enable-surface-drag-and-add-live-badge-modes.md`](../tasks/0041-equalize-widget-height-enable-surface-drag-and-add-live-badge-modes.md) - equalized compact progress/artwork-only height, restored lower-surface dragging, added explicit always/hover/hidden status modes with migration, and completed a fresh repository-wide audit.
- Completed P1: Settings drag and transparency controls - [`0040-fix-settings-drag-and-add-transparency-controls.md`](../tasks/0040-fix-settings-drag-and-add-transparency-controls.md) - keeps the Settings header draggable after scrolling and adds persisted surface, artwork-background, and gradient-overlay transparency controls with current visuals as defaults.
- Completed P1: ytw-l48 - [`0001-stabilize-current-widget-interaction-regressions.md`](../tasks/0001-stabilize-current-widget-interaction-regressions.md) - all child regressions closed after the user's 2026-07-13 portable/live confirmation and task `0036` verification.
- Completed P1: ytw-l48.1 - [`0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md`](../tasks/0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md)
- Completed P1: ytw-l48.2 - [`0003-fix-main-widget-close-button-honoring-the-configured-action.md`](../tasks/0003-fix-main-widget-close-button-honoring-the-configured-action.md)
- Completed P2: ytw-l48.3 - [`0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md`](../tasks/0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md)
- Completed P2: ytw-l48.4 - [`0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`](../tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md) - user confirmation plus 55 Vitest, 8 Playwright, 16 Rust, static, and desktop-build checks passed in task `0036`.
- Completed P2: ytw-l48.5 - [`0014-restore-settings-window-dragging-on-empty-frame-areas.md`](../tasks/0014-restore-settings-window-dragging-on-empty-frame-areas.md)
- Completed P1: Widget display preferences layout - [`0033-fix-widget-display-preference-layout.md`](../tasks/0033-fix-widget-display-preference-layout.md) - display preferences now remove controls/progress from the compact layout, trigger auto-height resync, and add safe progress-row spacing.
- Completed P1: Playback controls hover mode - [`0034-fix-playback-controls-hover-mode.md`](../tasks/0034-fix-playback-controls-hover-mode.md) - introduced the separate hover-only setting and transform-free buttons; its height-collapse behavior was superseded by task `0035` after live feedback exposed pointer-boundary jitter.
- Completed P1: Hover, progress, and status-badge stabilization - [`0035-fix-hover-progress-and-connection-badge.md`](../tasks/0035-fix-hover-progress-and-connection-badge.md) - fixed persisted false settings, made hover visibility layout-stable, corrected Companion elapsed-seconds mapping, and added optional hover-only connection-badge visibility.
- Completed P1: Version 2.0 display/localization pass - [`0036-add-display-controls-localization-and-central-versioning.md`](../tasks/0036-add-display-controls-localization-and-central-versioning.md) - added track-details hiding, artwork-wide play/pause, English/Russian localization, theme-first ordering, centralized version `2.0.0`, and reconciled the remaining active backlog.
- Completed P1: Artwork playback icon refinement - [`0037-remove-artwork-playback-icon-background.md`](../tasks/0037-remove-artwork-playback-icon-background.md) - removed the circular glass/tint treatment, enlarged the standalone semi-transparent play/pause glyph to 78 px, and retained contrast with a glyph-only drop shadow.
- Completed P1: Full i18n/theme/version/code audit - [`0038-full-i18n-theme-version-and-code-audit.md`](../tasks/0038-full-i18n-theme-version-and-code-audit.md) - completed the repository-wide audit, added a real explicit light theme, enforced JSON-localized connection states and settings normalization, hardened secret-safe native errors and disk-first/cache-safe settings writes, synchronized version checks, and removed known dependency vulnerabilities.
- Completed P1: Balance widget vertical spacing and header alignment - [`0039-balance-widget-vertical-spacing-and-header-alignment.md`](../tasks/0039-balance-widget-vertical-spacing-and-header-alignment.md) - centered the Live badge against window controls, balanced artwork-only top/bottom space, and centered the progress-only row between the artwork and lower edge with measured Playwright geometry.

## Companion / Audit Work

- Completed P2: ytw-5v6.3 - [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md) - auth, durable reconnect, realtime, playback commands, seek/progress timing, and latest portable behavior were confirmed live by 2026-07-13.
- Completed P2: full audit - [`0017-full-code-audit-latest-ytmdesktop.md`](../tasks/0017-full-code-audit-latest-ytmdesktop.md) - checked latest YTMDesktop v2.0.11 docs/release state, fixed endpoint parsing, realtime reconnect state, artwork CSS URL escaping, and scrubber edge case
- Completed P1: Companion auth UX - [`0018-fix-companion-auth-completion-flow.md`](../tasks/0018-fix-companion-auth-completion-flow.md) - code generation now starts `/auth/request` token exchange automatically and duplicate confirm clicks are deduplicated
- Completed P1: TypeScript build fix - [`0019-fix-controller-auth-test-typescript-build.md`](../tasks/0019-fix-controller-auth-test-typescript-build.md) - fixed `TS2349` in the controller auth regression test after local build feedback
- Completed P1: Live Companion auth post-approval fix - [`0020-fix-live-companion-auth-post-approval-stall.md`](../tasks/0020-fix-live-companion-auth-post-approval-stall.md) - after successful Allow, the controller now attempts `companion_connect` directly and records successful real connects as authorized
- Completed P1: Full code audit after auth fixes - [`0021-full-code-audit-after-auth-fixes.md`](../tasks/0021-full-code-audit-after-auth-fixes.md) - fixed multi-window Companion socket lifecycle conflict and made Playwright smoke test build before preview
- Completed P1: Live Companion auth still stuck after Allow - [`0022-fix-live-companion-auth-still-stuck-after-allow.md`](../tasks/0022-fix-live-companion-auth-still-stuck-after-allow.md) - fresh tokens are preserved through transient post-Allow validation failures, post-auth connect retries were added, and auth polling no longer locks the shared socket manager
- Completed P1: Live Companion auth cross-window sync - [`0023-audit-and-fix-live-companion-auth-after-latest-pull.md`](../tasks/0023-audit-and-fix-live-companion-auth-after-latest-pull.md) - after Settings completes or clears Companion auth, the main widget now receives an auth-change event and reconnects instead of staying in the old authorization state
- Completed P1: Live Companion auth external reconnect fix - [`0025-fix-live-companion-auth-reconnects-back-to-auth-required.md`](../tasks/0025-fix-live-companion-auth-reconnects-back-to-auth-required.md) - main-window auth-change reconnect now uses the safe post-approval path so a transient `401/403` cannot clear a freshly approved token
- Completed P1: Live Companion auth post-Allow authorized state - [`0026-fix-companion-auth-post-allow-authorized-state.md`](../tasks/0026-fix-companion-auth-post-allow-authorized-state.md) - protected post-auth reconnects now keep the fresh token marked authorized and clear the stale pairing code while retrying validation
- Completed P1: Live Companion auth disabled-request diagnosis - [`0027-fix-companion-auth-infinite-post-allow-loop.md`](../tasks/0027-fix-companion-auth-infinite-post-allow-loop.md) - `AUTHORIZATION_DISABLED` is now surfaced as a real Companion setting blocker, and fresh-token validation retries for longer before falling back
- Completed P1: Live Companion stored-token reconnect loop - [`0028-fix-stored-token-reconnect-loop.md`](../tasks/0028-fix-stored-token-reconnect-loop.md) - REST auth now falls back from `Bearer`-prefixed stored values to raw tokens, and realtime Socket.IO connects to the documented `/api/v1/realtime` endpoint with raw `auth.token`
- Completed P1: Live Companion Socket.IO namespace fix - [`0029-fix-companion-post-approval-loop-after-realtime-url.md`](../tasks/0029-fix-companion-post-approval-loop-after-realtime-url.md) - corrected `rust_socketio` usage so the Engine.IO base URL remains `http://<host>:<port>` and `/api/v1/realtime` is used as the namespace
- Completed P1: Restore Companion auth baseline - [`0030-restore-companion-auth-baseline.md`](../tasks/0030-restore-companion-auth-baseline.md) - compared the pre-week baseline with YTMDesktop v2.0.11 source, removed implicit token deletion, validated fresh tokens before keyring storage, and stopped reuse of consumed pairing codes
- Completed P1: Fix Companion auth persistence - [`0031-fix-companion-auth-persistence.md`](../tasks/0031-fix-companion-auth-persistence.md) - enabled the actual Windows Credential Manager backend for `keyring`, added durable write/read verification, removed synthetic stored-auth state, and surfaced credential errors
- Completed P1: Widget layout and playback stability - [`0032-fix-widget-layout-and-playback-stability.md`](../tasks/0032-fix-widget-layout-and-playback-stability.md) - restored shrinkable intrinsic window sizing, removed the paused card, filtered progress-only realtime churn, and expanded transport/browser regression coverage

## Deferred Roadmap

- Deferred P3: Optional packaged Windows delivery - [`0049-add-supported-packaged-wms-delivery.md`](../tasks/0049-add-supported-packaged-wms-delivery.md) - package identity is not required for portable WMS; retain this only for a future user-approved installer, signing, update, or Store-style delivery pass that preserves portable as a first-class option.
- Deferred P2: Opt-in local WMS playback history, favorites, and export - [`0046-add-opt-in-local-playback-history-favorites-and-export.md`](../tasks/0046-add-opt-in-local-playback-history-favorites-and-export.md) - default-off local history enables local favorite marking for WMS tracks plus review/copy/export/delete flows; consent, identity, retention, corruption recovery, and privacy require a dedicated design pass.
- Deferred P3: ytw-5v6 - [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md) - umbrella retained only for the explicitly deferred future children below.
- Deferred P4: ytw-5v6.2 - [`0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md`](../tasks/0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md)
- Deferred P3: ytw-5v6.4 - [`0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md`](../tasks/0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md)
- Deferred P3: ytw-5v6.6 - [`0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md`](../tasks/0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md)
- Deferred P3: ytw-5v6.7 - [`0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md`](../tasks/0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md)

## Process Migration

- Completed P2: ytw-yk4 - [`0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md`](../tasks/0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md)
- Completed P2: bootstrap sync - [`0016-sync-bootstrap-rules-to-0002.md`](../tasks/0016-sync-bootstrap-rules-to-0002.md) - adapted bootstrap `0001`/`0002`, added `bootstrap-sync.md`, `time-log.md`, and time-tracking workflow
- Completed P1: branch-per-pass git workflow - [`0024-adopt-branch-per-pass-commit-merge-push-workflow.md`](../tasks/0024-adopt-branch-per-pass-commit-merge-push-workflow.md) - default AI workflow is now branch per pass, audit/validate, commit, merge to `master`, and push in the same pass

## Delivery Policy

- The app is Windows-first for the current delivery cycle.
- Manual test builds are portable-only unless a task explicitly re-enables installer packaging.
- Live YTMDesktop Companion behavior was confirmed through playback commands and seek/progress in the 2026-07-13 portable pass; repeat smoke after meaningful Companion/runtime changes.
- Markdown files under `project-tracking/` are now the source of truth for roadmap, tasks, reports, decisions, checklists, bootstrap sync, and AI iteration time log.

## Review Rhythm

- Update this roadmap when a task changes priority, status, or delivery phase.
- Create a report when a task is completed or a meaningful verification pass is finished.
- Create a decision record when a durable architecture, product, release, or process rule changes.
- Update `project-tracking/bootstrap-sync.md` when importing newer bootstrap rules.
- Update `project-tracking/time-log.md` for substantial AI work iterations.
