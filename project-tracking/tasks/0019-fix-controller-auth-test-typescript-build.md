# 0019 - Fix Controller Auth Test TypeScript Build

## Status

Completed

## Context

A local Windows `npm run build:portable` run failed during `tsc -b` with `TS2349` in `tests/domain/playback/controller.test.ts`. The issue was in the newly added auth regression test: TypeScript narrowed a nullable local resolver variable to `never` because the assignment happened inside a Promise executor.

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
| Finished at | `2026-07-07T02:49:31+02:00` |
| Time spent minutes | `2` |
| Tracking status | `tracked` |
| Time log row | `project-tracking/time-log.md` |

## Acceptance Criteria

- [x] `TS2349` in `tests/domain/playback/controller.test.ts` is fixed.
- [x] Auth regression test still asserts duplicate `completeAuth` calls are deduplicated.
- [x] Task, report, roadmap, and time-log are updated.

## Verification Plan

- [x] Static review of updated test.
- [ ] User reruns `npm run build:portable` locally after pulling the fix.

## Fix Summary

The test now stores the deferred resolver on a typed object property instead of a nullable local variable. This avoids TypeScript's local control-flow narrowing to `never` while preserving the pending-auth-exchange assertion.

## Links

- Report: `project-tracking/reports/0019-fix-controller-auth-test-typescript-build.md`
- Related task: `project-tracking/tasks/0018-fix-companion-auth-completion-flow.md`
