---
description: Git commit with conventional format
---

# Ship: Commit

## Purpose
Commit completed work with proper conventional commit format.

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

# Or stage selectively
git add apps/backend/internal/features/task/
```

### 3. Commit with Conventional Format

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, semicolons, etc.
- `refactor`: Code change (no new feature/fix)
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
git commit -m "feat(task): add CRUD API endpoints"
git commit -m "feat(auth): implement JWT authentication"
git commit -m "fix(task): correct status validation"
git commit -m "test(task): add unit tests for service layer"
```

### 4. Update task.md
Mark completed items as `[x]` in the task checklist.

## Commit Scope Guidelines

| Feature Area | Scope |
|--------------|-------|
| Task management | `task` |
| User/Auth | `auth` |
| Lists | `list` |
| API layer | `api` |
| Database | `db` |
| Frontend | `ui` |

## Completion Criteria
- [ ] Changes committed with proper format
- [ ] task.md updated to reflect completion
