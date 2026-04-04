# CLAUDE.md

This file is the Claude-facing adapter for the `Ask/` workspace.

For work inside the main UIUC housing app, use this order of precedence:

1. `app/AGENTS.md`
2. `app/docs/FILE_RULES.md`
3. `app/docs/ARCHITECTURE.md`

If these sources conflict, the project-level `AGENTS.md` wins.

## Active App

The main active web app is:

- `app/`

Most frontend, dorm-data, and app-structure work should happen there.

## Claude-Specific Notes

- Prefer the current runtime structure over future-state reorganization docs.
- Do not assume scripts exist unless they are present in `package.json`.
- Keep structural edits consistent across code, docs, and imports.
