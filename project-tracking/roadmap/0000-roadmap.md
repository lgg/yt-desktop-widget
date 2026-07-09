# 0000 - Roadmap

## Purpose

This roadmap is the top-level planning document for the YTM Desktop Widget project. It replaces Beads as the project planning entrypoint together with the task files in `project-tracking/tasks/`.

## Current Tracking Snapshot

- Source migrated from Beads export: `project-tracking/archive/beads-export-2026-07-05.jsonl`
- Total migrated issues: 15
- Open: 5
- In progress: 1
- Blocked: 0
- Deferred: 6
- Completed: 3

## Current Stabilization Work

- Open P1: ytw-l48 - [`0001-stabilize-current-widget-interaction-regressions.md`](../tasks/0001-stabilize-current-widget-interaction-regressions.md)
- Open P1: ytw-l48.1 - [`0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md`](../tasks/0002-resize-the-main-widget-window-to-fit-reconnect-and-error-state-cards.md)
- Completed P1: ytw-l48.2 - [`0003-fix-main-widget-close-button-honoring-the-configured-action.md`](../tasks/0003-fix-main-widget-close-button-honoring-the-configured-action.md)
- Completed P2: ytw-l48.3 - [`0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md`](../tasks/0004-keep-connection-state-and-authorization-cards-on-one-row-in-settings.md)
- Open P2: ytw-l48.4 - [`0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md`](../tasks/0012-run-a-widget-regression-smoke-pass-after-current-stabilization-fixes.md)
- In Progress P2: ytw-l48.5 - [`0014-restore-settings-window-dragging-on-empty-frame-areas.md`](../tasks/0014-restore-settings-window-dragging-on-empty-frame-areas.md)

## Companion / Audit Work

- Open P2: ytw-5v6.3 - [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md) - protocol audit/code-doc alignment completed on 2026-07-07; live YTMDesktop validation still open
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

## Deferred Post-v1 Roadmap

- Open P3: ytw-5v6 - [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md)
- Deferred P3: ytw-5v6.1 - [`0006-add-future-widget-size-presets-and-manual-resize-support.md`](../tasks/0006-add-future-widget-size-presets-and-manual-resize-support.md)
- Deferred P4: ytw-5v6.2 - [`0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md`](../tasks/0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md)
- Deferred P3: ytw-5v6.4 - [`0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md`](../tasks/0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md)
- Deferred P4: ytw-5v6.5 - [`0010-expand-localization-beyond-the-english-only-v1-bundle.md`](../tasks/0010-expand-localization-beyond-the-english-only-v1-bundle.md)
- Deferred P3: ytw-5v6.6 - [`0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md`](../tasks/0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md)
- Deferred P3: ytw-5v6.7 - [`0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md`](../tasks/0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md)

## Process Migration

- Completed P2: ytw-yk4 - [`0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md`](../tasks/0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md)
- Completed P2: bootstrap sync - [`0016-sync-bootstrap-rules-to-0002.md`](../tasks/0016-sync-bootstrap-rules-to-0002.md) - adapted bootstrap `0001`/`0002`, added `bootstrap-sync.md`, `time-log.md`, and time-tracking workflow
- Completed P1: branch-per-pass git workflow - [`0024-adopt-branch-per-pass-commit-merge-push-workflow.md`](../tasks/0024-adopt-branch-per-pass-commit-merge-push-workflow.md) - default AI workflow is now branch per pass, audit/validate, commit, merge to `master`, and push in the same pass

## Delivery Policy

- The app is Windows-first for the current delivery cycle.
- Manual test builds are portable-only unless a task explicitly re-enables installer packaging.
- Live YTMDesktop Companion behavior must be validated on a real local YTMDesktop instance before treating Companion integration as fully verified.
- Markdown files under `project-tracking/` are now the source of truth for roadmap, tasks, reports, decisions, checklists, bootstrap sync, and AI iteration time log.

## Review Rhythm

- Update this roadmap when a task changes priority, status, or delivery phase.
- Create a report when a task is completed or a meaningful verification pass is finished.
- Create a decision record when a durable architecture, product, release, or process rule changes.
- Update `project-tracking/bootstrap-sync.md` when importing newer bootstrap rules.
- Update `project-tracking/time-log.md` for substantial AI work iterations.
