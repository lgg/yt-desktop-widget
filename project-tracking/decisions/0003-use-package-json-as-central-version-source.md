# 0003 - Use package.json as the central application version source

## Status

Accepted

## Context

Version `1.0.0` was independently duplicated in the root package, npm lockfile, Cargo manifest/lockfile, Tauri config, React UI constant, and Companion metadata. A partial bump could therefore show or transmit a different version from the Windows executable.

## Decision

The root `package.json` version is the only application version edited manually. Tauri references that file directly, React imports it for interface display, and the Companion client uses Cargo's compile-time package version. `npm run version:sync` updates the unavoidable Cargo and lockfile copies, while `npm run version:check` is the first gate in `npm run verify`.

## Alternatives Considered

| Option                                | Pros                                                                           | Cons                                                                         | Reason Not Chosen                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| Keep manual copies                    | No tooling required                                                            | Easy to ship mismatched UI, executable, and Companion versions               | Already caused six independent version values.           |
| Generate every consumer at build time | Can eliminate most copies                                                      | Cargo requires a concrete manifest version before the application build runs | Adds fragile pre-Cargo build ordering.                   |
| Use `package.json` plus sync/check    | One human-edited source, direct Tauri/UI consumption, deterministic validation | Cargo and lockfiles still contain generated copies                           | Best fit for the existing npm + Tauri + Cargo toolchain. |

## Consequences

Positive:

- One deliberate version edit controls the application release identity.
- Normal verification fails immediately when metadata drifts.
- Settings, Companion requests, Cargo logs, and Windows executable metadata report `2.0.0` consistently.

Negative / tradeoffs:

- Contributors must run `npm run version:sync` after editing the root version.
- The synchronization script is release-critical and must stay covered by version tests.

## Implementation Notes

- Authoritative source: `package.json`.
- Synchronizer/checker: `scripts/sync-version.mjs`.
- Tauri config: `"version": "../package.json"`.
- Frontend: `src/app/defaults.ts` imports the root package version.
- Native Companion metadata: `env!("CARGO_PKG_VERSION")`.
- Verification: `tests/app/version.test.ts` and `npm run version:check`.

## Review Date

Review if the repository moves away from npm/Tauri, adopts an automated release tool, or becomes a multi-package Cargo/npm workspace.

## Links

- Related task: [`0036-add-display-controls-localization-and-central-versioning.md`](../tasks/0036-add-display-controls-localization-and-central-versioning.md)
- Related report: [`0036-add-display-controls-localization-and-central-versioning.md`](../reports/0036-add-display-controls-localization-and-central-versioning.md)
