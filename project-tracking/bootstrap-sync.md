# Bootstrap Sync

source_repository: `https://github.com/lgg/chatgpt-coding-projects-bootstrap`
synced_through: `0002`
last_synced_at: `2026-07-07T02:11:05+02:00`
last_sync_task: `project-tracking/tasks/0016-sync-bootstrap-rules-to-0002.md`
last_sync_report: `project-tracking/reports/0016-sync-bootstrap-rules-to-0002.md`

## Purpose

This file records which shared process rules from `lgg/chatgpt-coding-projects-bootstrap` have been adapted into this repository.

This repository is a Windows-first Tauri v2 desktop app for YTMDesktop. Bootstrap rules are adapted to that context instead of copied mechanically.

## Current Status

| Field | Value |
| --- | --- |
| Source bootstrap current version | `0002` |
| Synced through | `0002` |
| Sync mode | Legacy sync brought up to current version |
| Tracking status | Complete for process/docs; no runtime code changes required |

## Sync History

| Version | Date Applied | Status | Notes |
| --- | --- | --- | --- |
| `0001` | 2026-07-07 | Applied | Added downstream sync marker workflow via this file. Existing AGENTS/project-tracking rules already covered much of the baseline; they were normalized to point at `bootstrap-sync.md`. |
| `0002` | 2026-07-07 | Applied | Added AI iteration time tracking through `project-tracking/time-log.md`, task/report template sections, DoD checks, PR checklist, README notes, and AGENTS rules. |

## Files Updated During Latest Sync

- `AGENTS.md`
- `README.md`
- `.github/pull_request_template.md`
- `project-tracking/README.md`
- `project-tracking/bootstrap-sync.md`
- `project-tracking/time-log.md`
- `project-tracking/templates/task-template.md`
- `project-tracking/templates/report-template.md`
- `project-tracking/checklists/0000-definition-of-done.md`
- `project-tracking/tasks/0016-sync-bootstrap-rules-to-0002.md`
- `project-tracking/reports/0016-sync-bootstrap-rules-to-0002.md`
- `project-tracking/roadmap/0000-roadmap.md`

## Project-Specific Adaptations

- Docker/Coolify rules are recorded as conditional future rules only. This project currently has no Docker/Coolify deployment surface.
- Build/release language stays focused on Tauri, portable Windows builds, and Companion Server validation.
- Backend references are adapted to native Tauri/Rust backend and Companion API contracts.
- Frontend validation is adapted to widget/settings windows, frameless drag regions, and desktop runtime behavior.
- Time tracking is repository-native markdown only; no billing or external time system is introduced.

## Pending Bootstrap Items

None for bootstrap version `0002`.

Future syncs must read the source `bootstrap-versioning/VERSION.md` and apply only versions newer than `synced_through`, unless the user asks for a full sync audit.