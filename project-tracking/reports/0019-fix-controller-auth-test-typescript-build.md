# 0019 - Fix Controller Auth Test TypeScript Build Report

## Summary

Fixed the TypeScript build failure reported from a local Windows `npm run build:portable` run.

Error fixed:

```text
tests/domain/playback/controller.test.ts:94:5 - error TS2349: This expression is not callable.
Type 'never' has no call signatures.
```

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `2026-07-07-0019-a` |
| Started at | `2026-07-07T02:48:24+02:00` |
| Finished at | `2026-07-07T02:49:31+02:00` |
| Time spent minutes | `2` |
| Tracking status | `tracked` |

## Root Cause

The auth regression test stored a Promise resolver in a local nullable variable initialized to `null`. TypeScript's control-flow analysis does not treat assignment inside the Promise executor as proving the variable is callable later, so the optional call was narrowed to `never`.

## Fix

`tests/domain/playback/controller.test.ts` now stores the resolver on a typed `DeferredAuth` object property:

- preserves the pending auth exchange test behavior;
- keeps the duplicate confirm assertion intact;
- avoids the `never` optional-call narrowing that broke `tsc -b`.

## Verification

| Check | Status | Notes |
| --- | --- | --- |
| Static review | Done | Re-read updated test through GitHub App. |
| Local build | Not run here | User should rerun `npm run build:portable` locally after pulling the fix. |
