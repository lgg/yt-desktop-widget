# 0049 - Add supported packaged WMS delivery

## Status

Deferred

## Context

Live Apple Music testing of the portable version `3.1.0` originally showed `Media-session access is unavailable`. Investigation isolated the failure to `GlobalSystemMediaTransportControlsSessionManager::RequestAsync().get()` before any player/session lookup.

A later same-binary comparison in task `0051` identified the missing variable: the Codex sandbox token returned `0x80070005`, while the same unpackaged MTA-initialized executable in the normal interactive Windows user session enumerated three sessions and returned current Apple Music. Microsoft desktop examples and working standalone Rust applications corroborate that package identity is not a general prerequisite.

This task remains deferred only if the project later chooses an installer, signing, update, or Store-style delivery model. It is not the fix for WMS access and must not describe portable as Companion-only.

## Goal

Design and deliver an optional supported signed Windows package while preserving the fully capable portable WMS path.

## Scope

Included:

- Decide between full MSIX and a supported sparse-package architecture.
- Define signing, certificate trust, sideload/update, and release artifact behavior without committing private keys.
- Declare `uap7:Capability Name="globalMediaControl"` in the package manifest.
- Keep the full-trust Tauri app functional and preserve Companion behavior.
- Keep WMS behavior consistent across portable and packaged launches; package identity must not become an artificial product gate.
- Validate against current Apple Music, Spotify, and Yandex Music in an interactive Windows session.
- Update the current portable-only policy, packaging documentation, decision records, security/privacy notes, and release checks.

Out of scope:

- Undocumented activation-factory or other capability-check bypasses.
- Local WMS history/favorites/export (`0046`).
- WMS service-specific Like/Dislike or numeric volume.

## Affected Areas

- Backend/native: WMS availability/error classification and package identity behavior.
- Frontend: capability-aware source availability/recovery copy.
- Tests: packaged/unpackaged paths and live player compatibility.
- Documentation/build/release: MSIX/sparse manifest, signing, installation, updates, portable coexistence.
- Security/privacy: restricted system capability and trusted artifact delivery.
- Project tracking: task/report `0049`, roadmap, packaging decision record.

## Time Tracking

| Field              | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Iteration ID       | `not started`                                                         |
| Started at         | `not started`                                                         |
| Finished at        | `not started`                                                         |
| Time spent minutes | `0`                                                                   |
| Tracking status    | `not_tracked`                                                         |
| Time log row       | Investigation time remains under task `0048`; implementation pending. |

## Acceptance Criteria

- [ ] The user approves the packaging, signing/trust, and portable coexistence model before implementation.
- [ ] WMS runs through the documented `globalMediaControl` capability with no operating-system check bypass.
- [ ] Packaged and portable source availability is explicit and cannot trap users in an impossible reconnect loop.
- [ ] Signing material and private keys are never committed.
- [ ] Apple Music, Spotify, and Yandex Music are smoke-tested in an interactive Windows session.
- [ ] Companion, settings migration, runtime lifecycle, privacy bounds, documentation, and release verification do not regress.

## Verification Plan

- [ ] Record an architecture/release decision.
- [ ] Add package identity/capability detection tests.
- [ ] Build/install/launch the signed package on a clean Windows user profile.
- [ ] Run live player metadata, progress, seek, transport, reconnect, and source-switch smoke tests.
- [ ] Run full frontend/native/E2E/security/release checks.

## Questions and Answers

| Question                                                                        | Status | Answer / Decision                                                            |
| ------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Should delivery use full MSIX or a sparse package?                              | Open   | User/product decision required after a concrete artifact/signing comparison. |
| Should portable remain available alongside packaged delivery? | Resolved | Yes. Portable WMS works in a normal interactive user session and remains a first-class delivery path. |
| How will release certificates be issued, trusted, rotated, and protected?       | Open   | Must be resolved before distributable package implementation.                |

## Risks

| Risk                                                   | Impact | Mitigation                                                                                 |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------ |
| Package/signing changes break current portable users.  | High   | Keep a parallel portable path until migration/update behavior is proven and approved.      |
| Capability is declared but artifact lacks valid trust. | High   | Add install/identity/capability verification and never distribute unsigned release claims. |
| A workaround circumvents Windows security policy.      | High   | Use only documented package capability; explicitly reject undocumented bypasses.           |

## Links

- Roadmap: [`0000-roadmap.md`](../roadmap/0000-roadmap.md)
- Originating UI task: [`0048-unify-settings-visibility-controls-and-layout.md`](0048-unify-settings-visibility-controls-and-layout.md)
- WMS implementation task: [`0045-add-windows-media-session-playback-source.md`](0045-add-windows-media-session-playback-source.md)
- Audit report: [`0047-deep-audit-windows-media-session-release.md`](../reports/0047-deep-audit-windows-media-session-release.md)
- Microsoft API: <https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager.requestasync>
- Microsoft capability schema: <https://learn.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-uap7-capability>
- PR/commit: pending
