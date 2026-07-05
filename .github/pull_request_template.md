# Pull Request

## Summary

- ...

## Task / Report

- Task: `project-tracking/tasks/NNNN-...md`
- Report: `project-tracking/reports/NNNN-...-report.md`

## Checklist

### Implementation

- [ ] Implementation matches the task and acceptance criteria.
- [ ] Changes are minimal and scoped.
- [ ] No user changes were overwritten or removed without permission.

### Consistency

- [ ] Frontend updated if user-facing behavior changed.
- [ ] Native backend updated if Tauri/runtime behavior changed.
- [ ] Domain/API contracts updated if Companion behavior changed.
- [ ] Tests updated if logic or UI behavior changed.
- [ ] Documentation updated.
- [ ] Roadmap/task/report updated.
- [ ] Decisions updated if architecture, product, process, packaging, or release rules changed.

### Desktop Runtime

- [ ] Widget/settings windows checked when affected.
- [ ] Tauri permissions checked when backend commands changed.
- [ ] Tray/startup/close-hide/drag behavior checked when affected.
- [ ] Portable-build policy respected unless the task changes packaging.

### Tests and Verification

- [ ] Lint/static checks run or skipped with reason.
- [ ] Tests run or skipped with reason.
- [ ] Build run or skipped with reason.
- [ ] Manual QA run for key desktop scenarios or skipped with reason.

### Env, Deploy, and Security

- [ ] No secrets, tokens, private keys, real passwords, or user credentials committed.
- [ ] `.env.example` updated if env variables were introduced.
- [ ] Docker/Coolify files updated only if the task explicitly introduced deployment config.
- [ ] Internal services or local ports were not exposed without explicit task and decision.
- [ ] Auth/token/Tauri permission/external integration risks are described when relevant.

### Open Questions

- [ ] Open questions are recorded in task/report/decision.
- [ ] Residual risks are described.

## Verification Details

```text
Paste commands/results or manual QA notes here.
```
