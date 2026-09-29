---
name: git-commit
description: Create Git commits on the main branch by splitting changes into logical units following project conventions. Use when the user asks to commit.
allowed-tools: Bash
---

## Branch

This project commits directly to `main`. Do not create or switch branches.

```bash
git branch --show-current
```

If the current branch is not `main`, stop and ask the user before committing.

## Commit Message Rules

Format: `type(scope): description`

- **Types**: `add` / `update` / `fix` / `refactor` / `ci/cd` / `docs` / `test` / `merge`
- **Scope**: domain name, not file or tool name. Infer it from changed paths (`git diff --name-only`) and recent commits (`git log --oneline`).
  - `src/terrain/` → `terrain`
  - `src/main.tsx` (Canvas, lights, camera, controls) → `scene`
  - Build/tooling config affecting the whole project (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.claude/`) → `global`
- **Description**: Korean, no period, avoid endings: `~한다/~된다`, `~하기`, `~합니다/~됩니다`, `~했습니다`
  - Good examples: `협곡 깎기 로직 추가`, `계단 높이 계산 오류 수정`, `노이즈 함수 분리`
- Subject line only (no body, no trailers such as `Co-Authored-By`)

## Commit Flow

1. Inspect changes: `git status`, `git diff`
2. Categorize into logical units (feature / bug fix / refactoring / etc.)
3. Group files per unit
4. For each group:
   - Stage only relevant files with `git add <files>` (never `git add -A`)
   - `git commit -m "message"`
5. Verify with `git log --oneline -n <count>`
