# 0024 - Adopt Branch Per Pass Commit Merge Push Workflow

## Status

Completed

## Context

The user asked to update the current repository rules so every work pass is handled as a separate branch, then audited, merged into `master` when clean, and pushed in the same pass.

This supersedes the previous default rule that commits and pushes required explicit user permission. The immediate reason is that the prior auth fix was implemented and verified locally but was not yet committed or pushed.

## Goal

Make the branch-per-pass commit/merge/push workflow the default repository rule and apply it to the current pass.

## Scope

Included:

- Update `AGENTS.md`.
- Update project tracking docs/checklist.
- Add a decision record.
- Add task/report/time-log/roadmap entries.
- Commit the current pass on a dedicated branch, validate, merge to `master`, and push.

Out of scope:

- Rewriting historical commits.
- Changing remote branch protection.
- Creating a GitHub PR unless needed by remote policy.

## Affected Areas

- Backend/native: none directly
- Frontend: none directly
- Domain/API contracts: none directly
- Tests: validation only
- Documentation: `AGENTS.md`, project tracking docs
- Build/release/config: none
- Project tracking: task, report, decision, roadmap, checklist, time-log
- Other: git workflow

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0024-a` |
| Started at | `2026-07-07T05:27:21+03:00` |
| Finished at | `2026-07-07T05:33:12+03:00` |
| Time spent minutes | `6` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] `AGENTS.md` requires branch-per-pass commit/merge/push workflow by default.
- [x] Project tracking docs/checklist reflect the workflow.
- [x] A decision record captures context, options, decision, and consequences.
- [x] Current pass is committed on a dedicated branch.
- [x] Relevant validation passes before merge.
- [x] Pass branch is merged to `master` and `master` is pushed.
- [x] Related code, docs, tests, config, roadmap, task, report, bootstrap-sync, and time-log files are updated when relevant.
- [x] Time tracking is filled in task, report, and `project-tracking/time-log.md`, or the reason for approximate/missing tracking is explicit.

## Verification Plan

- [x] Lint/static checks: `npm run verify`
- [x] Build/native check: `cargo check -j1`
- [x] Documentation review: ensure README/project-tracking docs do not contradict `AGENTS.md`
- [x] Git verification: branch commit, merge to `master`, push, and final status
- [x] Time tracking review

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Should every pass push directly to `master` without branch review? | Resolved | No. Use a branch first, then audit/validate, merge to `master`, and push. |
| Can failed checks still merge? | Resolved | No. Failed required checks should block merge unless the user explicitly overrides after being told the risk. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Commit/push happens when the user wanted only local changes. | Unexpected remote write. | Document explicit user instruction as an exception to the default workflow. |
| Failed validation is ignored to satisfy push requirement. | Broken `master`. | Require audit/validation before merge and record blockers. |

## Links

- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
- Related decisions: `project-tracking/decisions/0002-adopt-branch-per-pass-commit-merge-push-workflow.md`
- Related reports: `project-tracking/reports/0024-adopt-branch-per-pass-commit-merge-push-workflow.md`
- Time log: `project-tracking/time-log.md`
- PR/commit: branch `codex-0024-git-workflow-rules`
