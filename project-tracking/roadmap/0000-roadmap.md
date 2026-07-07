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

## Deferred Post-v1 Roadmap

- Open P3: ytw-5v6 - [`0005-track-deferred-post-v1-roadmap-items.md`](../tasks/0005-track-deferred-post-v1-roadmap-items.md)
- Deferred P3: ytw-5v6.1 - [`0006-add-future-widget-size-presets-and-manual-resize-support.md`](../tasks/0006-add-future-widget-size-presets-and-manual-resize-support.md)
- Deferred P4: ytw-5v6.2 - [`0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md`](../tasks/0007-plan-future-macos-support-for-window-tray-and-startup-behavior.md)
- Open P2: ytw-5v6.3 - [`0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md`](../tasks/0008-validate-live-companion-auth-realtime-commands-and-seek-against-a-real-y.md) - protocol audit/code-doc alignment completed on 2026-07-07; live YTMDesktop validation still open
- Deferred P3: ytw-5v6.4 - [`0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md`](../tasks/0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md)
- Deferred P4: ytw-5v6.5 - [`0010-expand-localization-beyond-the-english-only-v1-bundle.md`](../tasks/0010-expand-localization-beyond-the-english-only-v1-bundle.md)
- Deferred P3: ytw-5v6.6 - [`0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md`](../tasks/0011-plan-deferred-visual-refinement-pass-and-alternate-widget-window-modes.md)
- Deferred P3: ytw-5v6.7 - [`0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md`](../tasks/0013-add-richer-diagnostics-and-logging-around-companion-reconnects-and-runti.md)

## Process Migration

- Completed P2: ytw-yk4 - [`0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md`](../tasks/0015-migrate-task-tracking-from-beads-to-markdown-project-tracking.md)
- Completed P2: bootstrap sync - [`0016-sync-bootstrap-rules-to-0002.md`](../tasks/0016-sync-bootstrap-rules-to-0002.md) - adapted bootstrap `0001`/`0002`, added `bootstrap-sync.md`, `time-log.md`, and time-tracking workflow

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