# 0049 - Add supported packaged WMS delivery

## Status

Deferred

## Context

Live Apple Music testing of the portable version `3.1.0` showed `Media-session access is unavailable`. Investigation during task `0048` isolated the failure to `GlobalSystemMediaTransportControlsSessionManager::RequestAsync().get()` before any player/session lookup.

A temporary two-process diagnostic called the same API without apartment initialization and after successful `RoInitialize(RO_INIT_MULTITHREADED)`. Both returned `0x80070005` (`E_ACCESSDENIED`). Microsoft documents `globalMediaControl` for this manager and defines it as a package-manifest capability. Follow-up task `0050` found that the real production adapter nevertheless ran blocking WinRT work on arbitrary uninitialized Tokio threads, discarded HRESULT details, and could be silently overridden by the simulator. The short-lived diagnostic did not exercise that corrected interactive runtime, so packaging remains a contingency rather than a proven prerequisite until the new portable build is tested.

The user explicitly deferred the packaging decision on 2026-07-14 and then requested a corrected portable attempt based on an external audit. Task `0050` owns that attempt; this task remains deferred unless the corrected executable still receives access denied or the project later chooses package identity for release guarantees.

## Goal

Design and deliver a supported signed package-identity path for Windows Media Session, while deciding how portable Companion-only and packaged WMS-capable builds coexist.

## Scope

Included:

- Decide between full MSIX and a supported sparse-package architecture.
- Define signing, certificate trust, sideload/update, and release artifact behavior without committing private keys.
- Declare `uap7:Capability Name="globalMediaControl"` in the package manifest.
- Keep the full-trust Tauri app functional and preserve Companion behavior.
- Make WMS availability/source UI accurately reflect whether package identity and capability are present.
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
| Should portable remain available alongside packaged delivery if package identity is still required for reliable WMS? | Open | Recommended: preserve Companion and the corrected best-effort portable WMS path, but obtain explicit user approval before packaging work. |
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
