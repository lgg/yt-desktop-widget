## Git

- If you create a git commit in this repository, use:
  - `user.name = lgg`
  - `user.email = lgg@users.noreply.github.com`
- Do not commit, amend, or push unless the user explicitly asks.

## Issue Tracking

This project uses **bd (beads)** for all task tracking.
Do not keep parallel markdown TODO lists for implementation work.

## Beads Workflow

- Before changing code for a non-trivial request, make sure the work exists in beads first.
- If the user describes new work that is not tracked yet, create or update the relevant beads issue(s) before implementation.
- After task creation, share the issue ID(s) with the user, confirm scope if needed, and only then proceed with code changes.
- If you discover extra work while implementing, create a linked follow-up issue instead of hiding it in prose.

Recommended flow:
1. `npm run bd -- ready --json`
2. `npm run bd -- create ... --json` or `npm run bd -- update <id> ... --json`
3. `npm run bd -- show <id>`
4. Implement the task
5. `npm run bd -- close <id> --reason "..." --json` when done

## How To Run Beads Here

Use the project wrapper instead of calling `bd` directly:

- `npm run bd -- <command> ...`
- or `powershell -NoProfile -ExecutionPolicy Bypass -File .tools/beads.ps1 <command> ...`

Why the wrapper exists:
- `bd.exe` is stored locally under `.tools/bd/`
- Dolt is installed system-wide but needs repo-local environment variables in this sandbox
- the wrapper sets `PATH`, `HOME`, and `USERPROFILE` so beads and Dolt work reliably for agents

Local helper paths:
- wrapper: [C:\projects\yt-desktop-widget\.tools\beads.ps1](C:/projects/yt-desktop-widget/.tools/beads.ps1)
- local bd binary cache: `.tools/bd/` (git-ignored)
- local dolt home: `.tools/dolt-home/` (git-ignored)

## Execution Style

For requests with 2 or more meaningful steps:
- start with a task list / plan widget
- keep the task list updated as work progresses
- show important commands and validation results in the transcript
- reconcile all tasks before finishing

## Project Notes

- This is a Windows-first Tauri v2 + React + TypeScript desktop widget app.
- Current manual test builds are **portable-only**.
- Preferred validation commands:
  - `npm run verify`
  - `cargo check -j1`
  - `npm run build:desktop`
- Respect existing project docs before broad changes:
  - [README.md](C:/projects/yt-desktop-widget/README.md)
  - [ARCHITECTURE.md](C:/projects/yt-desktop-widget/ARCHITECTURE.md)
  - [DECISIONS.md](C:/projects/yt-desktop-widget/DECISIONS.md)

## Agent Rules

- Inspect the repository before major changes.
- Prefer safe, incremental refactors over rewrites.
- Avoid destructive git commands.
- Keep UX behavior unchanged unless the task explicitly calls for it.
- When using beads programmatically, prefer `--json` output.