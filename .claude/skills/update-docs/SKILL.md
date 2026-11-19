---
name: update-docs
description: Update frontend docs after code changes. Use after changing routes/pages, API calls, env vars, dependencies, scripts, setup or deploy steps, or when the user asks to update docs.
---

# Update docs

1. See what changed: `git diff main...HEAD --stat` and `git status` (include uncommitted changes).
2. Update only the affected docs:
   - `README.md` — setup, scripts, features
   - `doc.md` — architecture, API usage
   - `CLAUDE.md` — commands, conventions
   - `.env.example` — added/removed env vars
3. Nothing to update → say so and stop.
4. End with: files changed, one line per change.

## Rules

- Short and to the point: bullets over paragraphs, no filler, no marketing tone.
- Document only what the code does; never invent.
- Touch only affected sections; keep each file's structure and style.
- Remove docs for deleted features.
