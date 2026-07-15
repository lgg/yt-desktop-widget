# 0000 - Definition of Done

Use this checklist before closing any non-trivial task.

## Task Understanding

- [ ] The task goal is clear.
- [ ] Acceptance criteria are clear.
- [ ] Scope and out-of-scope items are clear.
- [ ] Open questions are recorded.
- [ ] Blocking product, security, data, packaging, or irreversible migration questions are clarified before implementation.
- [ ] Iteration start time is recorded in the task before implementation, or the report explains why tracking is approximate or missing.
- [ ] The pass branch is identified, or a documented exception explains why work stayed on the current branch.

## Implementation

- [ ] Implementation matches the task.
- [ ] Changes are minimal and scoped.
- [ ] No unrelated refactors were introduced.
- [ ] Existing architecture and decisions were respected or an updated decision was added.
- [ ] User-facing behavior is unchanged unless the task explicitly changes it.

## Consistency

- [ ] Frontend is updated if user-facing behavior changed.
- [ ] Native backend is updated if Tauri/runtime behavior changed.
- [ ] Domain types and Companion API contracts are updated if behavior changed.
- [ ] Tests are updated when logic or UI behavior changes.
- [ ] Documentation is updated.
- [ ] Roadmap/task/report are updated.
- [ ] `project-tracking/bootstrap-sync.md` is updated when bootstrap rules are synced.
- [ ] `project-tracking/time-log.md` is updated for substantial AI iterations.
- [ ] Build/release/config files are updated if launch, packaging, permissions, or runtime configuration changed.
- [ ] `.env.example` is updated if environment variables are introduced later.

## Time Tracking

- [ ] `started_at` is recorded in the task file.
- [ ] `finished_at` is recorded before final commit, push, or handoff.
- [ ] `time_spent_minutes` is an integer number of minutes rounded up.
- [ ] `tracking_status` is `tracked`, `approximate`, or `not_tracked`.
- [ ] Task, report, and `project-tracking/time-log.md` use matching core values.
- [ ] Approximate or missing tracking is explained in the report and time-log.

## Desktop, Runtime, and Release

- [ ] Widget and settings windows still behave correctly on Windows when affected.
- [ ] Tauri permissions match invoked commands.
- [ ] Tray, startup, close/hide, drag regions, and persisted window state are checked when touched.
- [ ] Companion API assumptions are isolated and documented when live validation is unavailable.
- [ ] Portable-only build policy is respected unless a task changes release packaging.
- [ ] Installer/Coolify/Docker/deploy files are not added unless a task explicitly introduces them.

## Tests and Checks

- [ ] Lint/static checks were run, if available.
- [ ] Tests were run, if available.
- [ ] Build was run for build/runtime-sensitive changes.
- [ ] Manual QA was performed for desktop/runtime behavior that automation cannot cover.
- [ ] Errors and edge cases were checked where important.
- [ ] Skipped checks are explained in the report.

## Security

- [ ] No secrets, tokens, private keys, real passwords, or user credentials are committed.
- [ ] No personal absolute paths, local usernames, temporary clipboard paths, or private machine-specific locations are published in tracked documentation or fixtures.
- [ ] Companion tokens remain in OS keyring-backed storage, not frontend storage.
- [ ] Auth, token storage, Tauri permissions, external integrations, and startup changes include risk notes.
- [ ] No internal service, local port, or telemetry is exposed without explicit task and decision.

## Report

- [ ] A report exists or was updated.
- [ ] The report describes what was done.
- [ ] The report lists changed files/areas.
- [ ] The report records verification commands and results.
- [ ] The report records what could not be verified.
- [ ] The report includes Time Tracking.
- [ ] Residual risks and next steps are recorded.

## Git Completion

- [ ] Work is committed on the pass branch.
- [ ] The pass branch was audited and validated before merge.
- [ ] The pass branch is merged into `master` when checks have no blocking failures.
- [ ] `master` is pushed after a successful merge.
- [ ] Any skipped commit, push, or merge step is explained in the report.
