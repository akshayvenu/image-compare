---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)Bash(git commit:*)
description: Stage and commit changes with a conventional commit message
---

## Context

- Git status: !`git status`
- Staged + unstaged diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits (style reference): !`git log --oneline -6`

## Your task

1. Analyze the diff and determine the **type** of change:
   - `feat` — new feature or capability
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `style` — formatting, naming, visual tweaks (no logic change)
   - `docs` — documentation only
   - `chore` — build, deps, config, tooling
   - `perf` — performance improvement
   - `test` — adding or fixing tests

2. Pick an optional **scope** (e.g. `panel`, `overlay`, `pdf`, `excel`, `dpi`) if the change is clearly scoped to one area.

3. Write a **subject line** (max 72 chars):
   ```
   <type>(<scope>): <imperative short description>
   ```
   - Use imperative mood: "add", "fix", "remove", not "added" or "fixes"
   - No period at the end
   - No filler words ("just", "some", "a few changes")

4. If the change warrants it, add a **body** (one blank line after subject):
   - What changed and why (not how — the diff shows how)
   - Bullet points are fine for multi-part changes
   - Keep each line under 72 chars

5. Always end with:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

6. Stage all relevant modified/new files (avoid `.env`, secrets, binaries). Then commit.

Do not print anything else — only make the tool calls to stage and commit.
