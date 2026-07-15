# 0057 - Add GitHub CI builds and releases

## Status

Deferred

## Context

The project currently relies on local portable builds and manual verification. GitHub Actions should be introduced after the Linux foundation so CI starts with the intended Windows/Linux support matrix and release artifacts reflect supported platforms.

## Goal

Provide reproducible pull-request validation and controlled GitHub release publication for supported Windows and Linux artifacts, with clear versioning, checksums, permissions, and secret handling.

## Scope

Included:

- Add least-privilege GitHub Actions for frontend, Rust, and platform builds.
- Define cache keys and deterministic dependency installation from lockfiles.
- Run required checks on pull requests and protected branches.
- Build clearly named Windows and Linux artifacts.
- Publish versioned GitHub Releases from an explicit tag/manual policy with checksums and release notes.
- Define artifact retention, failure behavior, and rollback/re-run procedure.
- Add signing only after a separate approved secret/certificate decision.

Out of scope:

- macOS artifacts before task `0007` is implemented.
- Committing credentials, certificates, private keys, or personal access tokens.
- Automatic updates inside the app unless separately designed.

## Affected Areas

- Build/release/config: `.github/workflows`, version/tag policy, artifacts, checksums.
- Tests: CI matrix and release dry runs.
- Documentation: README downloads/builds, contribution workflow, release runbook.
- Security: workflow permissions, dependency pinning, secret/signing boundaries.
- Project tracking: decision, task/report, roadmap, time log.

## Time Tracking

| Field | Value |
| --- | --- |
| Iteration ID | `not started` |
| Started at | `pending` |
| Finished at | `pending` |
| Time spent minutes | `pending` |
| Tracking status | `not_tracked` until implementation starts |
| Time log row | `pending` |

## Acceptance Criteria

- [ ] Pull requests run the documented frontend, Rust, and supported-platform checks from lockfiles.
- [ ] Workflow permissions are least-privilege and third-party actions are pinned appropriately.
- [ ] Windows and Linux artifacts have unambiguous names, versions, and checksums.
- [ ] Release publication is intentional, repeatable, and cannot expose repository secrets.
- [ ] A failed matrix job cannot produce a misleading successful release.
- [ ] README and release documentation distinguish supported artifacts from planned platforms.
- [ ] Workflow validation, security review, release dry run, task/report, roadmap, and time log are complete.

## Verification Plan

- [ ] Review workflow threat model and permissions before enabling release writes.
- [ ] Validate workflows on a branch/PR with Windows and Linux jobs.
- [ ] Run a non-production artifact/release dry run.
- [ ] Verify checksums, version metadata, artifact contents, and clean-machine launch.
- [ ] Confirm no secret value appears in logs or artifacts.

## Questions and Answers

| Question | Status | Answer / Decision |
| --- | --- | --- |
| Which event publishes a release? | Open | Compare protected tags, manual dispatch, and release creation before implementation. |
| Is signing included automatically? | Resolved | No. Signing requires a separate decision covering issuance, protection, rotation, and trust. |

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Over-permissioned workflows expose write access | Repository compromise | Least privilege, pinned actions, protected environments, explicit release job. |
| CI artifacts differ from local support claims | Broken downloads | Clean-machine smoke and metadata/checksum verification per platform. |
| Release triggers publish partial matrices | Incomplete release | Gate publication on all required build/verification jobs. |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Linux prerequisite: [`0056`](0056-add-linux-build-and-mpris-support.md)
- Packaging tasks: [`0009`](0009-re-enable-installer-packaging-after-the-portable-only-test-cycle.md), [`0049`](0049-add-supported-packaged-wms-delivery.md)
- Report: `pending`
- Time log: `pending`
- PR/commit: `pending`
