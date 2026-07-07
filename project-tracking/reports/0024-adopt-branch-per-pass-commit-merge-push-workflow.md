# 0024 - Adopt Branch Per Pass Commit Merge Push Workflow Report

## Summary

Updated repository rules so the default AI workflow is now one pass per branch, then audit/validation, commit, merge into `master`, and push `master` in the same pass when checks have no blocking failures.

This pass also applies the new workflow to the already completed Companion auth fix, so those changes are no longer left only in the working tree.

## Done

- Created branch `codex-0024-git-workflow-rules` for the current pass.
- Updated `AGENTS.md` Git/GitHub rules.
- Added `project-tracking/decisions/0002-adopt-branch-per-pass-commit-merge-push-workflow.md`.
- Updated `project-tracking/README.md` and the definition of done checklist.
- Updated task/report/roadmap/time-log tracking.
- Re-ran validation before commit/merge.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0024-a` |
| Started at | `2026-07-07T05:27:21+03:00` |
| Finished at | `2026-07-07T05:33:12+03:00` |
| Time spent minutes | `6` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Changed Areas

| Area | Status | Notes |
| --- | --- | --- |
| Backend/native | Already changed in same branch | Included the auth-change event fix from task `0023`. |
| Frontend | Already changed in same branch | Included the main-window auth-change reconnect fix from task `0023`. |
| Domain/API contracts | Already changed in same branch | Included typed Tauri auth-change bridge event from task `0023`. |
| Tests | Changed | Included auth regression test and controller test fix. |
| Documentation | Changed | Updated `AGENTS.md`, project tracking README, checklist, and decision. |
| Build/release/config | Verified | No packaging policy changes. |
| Bootstrap sync | Not applicable | Rule came from direct user instruction, not bootstrap import. |
| Time tracking | Changed | Added `0024` row and updated `0023` commit status. |
| Project tracking | Changed | Added task/report/decision and roadmap entry. |

## Changed Files

- `AGENTS.md`
- `project-tracking/README.md`
- `project-tracking/checklists/0000-definition-of-done.md`
- `project-tracking/decisions/0002-adopt-branch-per-pass-commit-merge-push-workflow.md`
- `project-tracking/tasks/0024-adopt-branch-per-pass-commit-merge-push-workflow.md`
- `project-tracking/reports/0024-adopt-branch-per-pass-commit-merge-push-workflow.md`
- `project-tracking/roadmap/0000-roadmap.md`
- `project-tracking/time-log.md`

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| Branch creation | Passed | Created `codex-0024-git-workflow-rules`. |
| Lint/static/tests/web build | Passed | `npm run verify`: ESLint ok, 10 test files / 23 tests passed, `tsc -b && vite build` ok. |
| Rust check | Passed | `cargo check -j1` finished successfully. |
| Desktop build | Passed | `npm run build:desktop` built `src-tauri/target/release/ytm-desktop-widget.exe`. |
| Documentation review | Passed | `AGENTS.md`, project tracking README, checklist, and decision align. |
| Git completion | Pending during report write | Commit, merge to `master`, push, and final status are performed after tracking is written so the commit includes this report. |

## Not Verified

- Remote branch protection behavior before push. If `master` push is rejected, the branch will remain pushed or ready for handoff depending on the failure.

## Questions Resolved

| Question | Resolution |
| --- | --- |
| Should completed AI passes remain uncommitted unless the user asks? | No. Default is now branch, validate, commit, merge to `master`, and push. |
| Should failed validation still merge to `master`? | No. Failed required checks block merge unless the user explicitly overrides after being told the risk. |

## Open Questions

| Question | Owner | Next Step |
| --- | --- | --- |
| Should a PR be mandatory instead of local merge for protected branches? | User/project | Revisit if remote `master` push is rejected or branch protection requires PRs. |

## Residual Risks

- The default workflow now writes to the remote more aggressively, so explicit user instructions not to commit/push must be respected as an exception.

## Next Steps

- Commit this branch, merge it to `master`, push `master`, and verify final status.
