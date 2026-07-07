# 0019 - Fix Controller Auth Test TypeScript Build

## Status

In Progress

## Context

A local Windows `npm run build:portable` run failed during `tsc -b` with `TS2349` in `tests/domain/playback/controller.test.ts`. The issue is in the newly added auth regression test: TypeScript narrows a nullable local resolver variable to `never` because the assignment happens inside a Promise executor.

## Goal

Fix the TypeScript build failure without weakening the Companion auth regression coverage.

## Scope

Included:

- Update the controller auth test to avoid the `never` optional-call narrowing.
- Keep duplicate confirm / pending auth exchange coverage intact.
- Update tracking and report.

Out of scope:

- Changing runtime auth behavior again unless a new issue is found.
- Claiming local build success from the connector-only environment.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0019-a` |
| Started at | `2026-07-07T02:48:24+02:00` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `tracked` |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] `TS2349` in `tests/domain/playback/controller.test.ts` is fixed.
- [ ] Auth regression test still asserts duplicate `completeAuth` calls are deduplicated.
- [ ] Task, report, roadmap, and time-log are updated.

## Verification Plan

- [ ] Static review of updated test.
- [ ] User reruns `npm run build:portable` locally after pulling the fix.

## Links

- Report: `project-tracking/reports/0019-fix-controller-auth-test-typescript-build.md`
- Related task: `project-tracking/tasks/0018-fix-companion-auth-completion-flow.md`
