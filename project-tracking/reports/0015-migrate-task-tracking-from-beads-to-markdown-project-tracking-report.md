# 0015 - Migrate task tracking from Beads to markdown project-tracking Report

## Summary

Migrated the repository from Beads to markdown project tracking based on lgg/chatgpt-coding-projects-bootstrap conventions, adapted for this Windows-first Tauri/React desktop widget.

## Done

- Created project-tracking structure: roadmap, tasks, reports, decisions, checklists, templates, and archive.
- Exported the full Beads state to project-tracking/archive/beads-export-2026-07-05.jsonl.
- Converted all 15 exported Beads issues into markdown task files.
- Created report files for the 2 tasks that were already completed in Beads.
- Added a migration map from Beads IDs to markdown files.
- Added markdown tracking rules to AGENTS.md and README.md.
- Removed the Beads npm script and Beads/Dolt ignore rules.
- Removed Beads project files and the local bootstrap clone after verification.
- Re-audited the migration against the bootstrap repository and added the adapted PR template, Docker/Coolify applicability rules, and expanded Definition of Done checklist.

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Not applicable | No runtime code changed. |
| Frontend | Not applicable | No UI code changed. |
| Domain/API contracts | Not applicable | No Companion API behavior changed. |
| Tests | Not applicable | Documentation/process migration only. |
| Documentation | Updated | README, AGENTS, project-tracking files, and PR template now describe the adapted workflow. |
| Build/release/config | Updated | Removed the Beads npm script from package.json. |

## Changed Files

- AGENTS.md
- README.md
- .gitignore
- package.json
- project-tracking/**
- .github/pull_request_template.md
- .beads/** removed
- .tools/** removed

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Beads raw export | Passed | Exported 15 issues before removing Beads. |
| Task count | Passed | 15 markdown task files exist for 15 exported issues. |
| Completed reports | Passed | 2 completed Beads issues have report files, plus this migration report. |
| Migration map | Passed | project-tracking/archive/beads-migration-map.md maps every Beads ID. |
| Beads references | Passed | Remaining references are historical migration notes only. |
| Bootstrap audit | Passed | Required workflow, task/report, DoD, documentation, security, and Docker/Coolify rules were checked and adapted for this desktop app. |
| `npm run verify` | Passed | Lint, 9 Vitest tests, and production web build passed after migration. |

## Not Verified

- No desktop runtime behavior was tested because the migration changed tracking/docs/process files only.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| What is the source of truth after migration? | Markdown files in project-tracking/. |
| How is Beads history preserved? | Raw JSONL archive plus generated markdown tasks, reports, and migration map. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| None. | Project maintainer | Continue future work in markdown tasks. |

## Residual Risks

- Future agents must keep markdown task/report status current manually.

## Next Steps

- Use project-tracking/tasks/ for all future task state.
