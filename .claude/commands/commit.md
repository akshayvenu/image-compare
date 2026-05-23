---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
description: Stage all changes and commit with a conventional commit message
---

## Context

- Git status: !`git status`
- Staged + unstaged diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits (style reference): !`git log --oneline -6`

## Your task

1. Analyze the diff and pick the **type**:
   - `feat` — new feature
   - `fix` — bug fix
   - `refactor` — restructure without behavior change
   - `style` — formatting / visual tweaks, no logic change
   - `docs` — documentation only
   - `chore` — build, deps, config, tooling
   - `perf` — performance improvement
   - `test` — adding or fixing tests

2. Pick an optional **scope** if the change is clearly scoped to one area (e.g. `panel`, `overlay`, `pdf`, `excel`, `dpi`).

3. Write a **subject line** (max 72 chars):
   ```
   <type>(<scope>): <imperative short description>
   ```
   - Imperative mood: "add", "fix", "remove" — not "added" / "fixes"
   - No trailing period
   - No filler words

4. Add a **body** if the change is complex (one blank line after subject):
   - Explain what changed and why, not how
   - Bullet points OK, max 72 chars per line

5. Run `git add .` to stage everything, then run `git commit -m "<message>"` using a HEREDOC so multi-line messages are formatted correctly. Do not include any Co-Authored-By trailer.

Do not print anything — only make the tool calls.
