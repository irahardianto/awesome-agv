---
description: Git commit with conventional format
---

# Ship: Commit

## Purpose
Commit completed work with proper conventional commit format.

> **Note:** For detailed conventions (branch naming, commit types, PR size, merge strategy), 
> see `git-workflow-principles.md` in `.agent/rules/`.

## Prerequisites
- All verification checks pass
- Code is ready for review/merge

## Steps

### 1. Review Changes
```bash
git status
git diff --staged
```

### 2. Stage Changes
```bash
# Stage all changes
git add .

# Or stage selectively (adjust path per project-structure.md)
git add apps/backend/internal/features/task/
```

### 3. Commit with Conventional Format

Follow the format from `git-workflow-principles.md`:

```bash
git commit -m "<type>(<scope>): <description>"
```

**Examples:**
```bash
git commit -m "feat(task): add CRUD API endpoints"
git commit -m "fix(auth): correct token expiry validation"
git commit -m "refactor(storage): extract interface for storage layer"
git commit -m "test(task): add integration tests for storage adapter"
```

### 4. Update task.md
Mark completed items as `[x]` in the task checklist.

## Completion Criteria
- [ ] Changes committed with proper format
- [ ] task.md updated to reflect completion
