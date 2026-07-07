# 0002 - Adopt Branch-Per-Pass Commit Merge Push Workflow

## Status

Accepted

## Context

The repository previously required explicit user permission before commits or pushes. In practice, that allowed completed AI work to remain only in the working tree, which made it easy to miss whether fixes were actually merged and available on `master`.

The user clarified the desired repository process on 2026-07-07: every pass should use a separate branch, perform audit/validation, then merge into `master` and push when there are no blocking problems.

## Decision Drivers

- Completed fixes should not be left only as local uncommitted changes.
- Each AI pass should be reviewable as a coherent branch before merge.
- `master` should receive only work that has passed the relevant audit and validation checks.
- Exceptions still need to protect against failed checks, unavailable credentials, safety concerns, or explicit user instructions.

## Considered Options

### Option 1: Keep explicit commit/push permission required

- Pros: minimizes unexpected remote writes.
- Cons: completed fixes can remain local and unmerged; user has to remember to ask for push every time.

### Option 2: Always commit and push directly to `master`

- Pros: simple and fast.
- Cons: removes the branch/audit boundary and makes it easier to put unchecked work directly on `master`.

### Option 3: Branch per pass, audit, merge to `master`, push

- Pros: gives each pass an isolated branch, keeps validation before `master`, and still ensures completed work reaches the remote.
- Cons: adds a few git steps to every pass and requires clear exception handling when checks fail.

## Decision

Use **branch per pass, audit, merge to `master`, and push** as the default repository workflow.

Each substantial AI work iteration should:

1. Create or switch to a dedicated pass branch before edits whenever possible.
2. Implement the scoped change and update project tracking.
3. Run the relevant audit/review and validation checks.
4. Commit the branch.
5. Merge into `master` when checks have no blocking failures.
6. Push `master` in the same pass.

If checks fail or the pass is blocked, do not merge to `master`; document the blocker and push the branch only when useful for handoff. Explicit user instructions, unavailable credentials/remote access, or safety concerns can override the default flow.

## Consequences

### Positive

- The user can rely on completed work being committed and pushed.
- `master` reflects validated completed work after each pass.
- Branches provide a clear boundary for audit before merge.
- Project tracking can link work to a branch/commit/merge outcome.

### Negative

- Small tasks now include git overhead.
- Failed validation requires explicit blocked handling instead of a simple local handoff.
- Agents must be careful not to merge when checks identify blocking issues.

## Implementation Notes

- `AGENTS.md` section 2 records the primary rule.
- `project-tracking/README.md` documents the workflow for tracking.
- `project-tracking/checklists/0000-definition-of-done.md` includes branch, commit, merge, and push checks.

## Links

- Task: `project-tracking/tasks/0024-adopt-branch-per-pass-commit-merge-push-workflow.md`
- Report: `project-tracking/reports/0024-adopt-branch-per-pass-commit-merge-push-workflow.md`
- Roadmap: `project-tracking/roadmap/0000-roadmap.md`
