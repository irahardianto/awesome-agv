---
description: Verify phase - run full validation suite
---

# Phase 4: Verify

## Purpose
Run all linters, static analysis, and tests to ensure code quality.

> **Note:** Paths below follow the project structure defined in `project-structure.md`.
> Adjust paths to match the actual project layout (e.g. `apps/backend`, `apps/frontend`).

## Prerequisites
- Phase 3 (Integrate) completed (or skipped if no adapters)
- Phase 3.5 (E2E) completed (or skipped if no UI changes)
- All tests passing

## If This Phase Fails
If lint/test/build fails:
1. **Do not proceed** to Ship
2. Fix the issue (go back to Phase 2 or 3 as needed)
3. Re-run full verification
4. Only proceed when ALL checks pass

## Steps

**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**.

### 1. Backend Validation
Run the FULL validation suite for the backend path as defined in `project-structure.md`:

```bash
# // turbo
# Adjust path per project-structure.md (default: apps/backend)
cd apps/backend && gofumpt -l -e -w . && go vet ./... && staticcheck ./... && gosec -quiet ./... && go test -race ./...
```

### 2. Frontend Validation
```bash
# // turbo
# Adjust path per project-structure.md (default: apps/frontend)
cd apps/frontend && pnpm run lint --fix && npx vue-tsc --noEmit && pnpm run test
```

### 3. Build Check
```bash
# Backend (path per project-structure.md)
cd apps/backend && go build ./...

# Frontend (path per project-structure.md)
cd apps/frontend && pnpm run build
```

### 4. Check Coverage
Report actual coverage in task summary.

**Go:**
```bash
go test -cover ./internal/features/...
```

**Frontend:**
```bash
pnpm run test -- --coverage
```

## Completion Criteria
- [ ] All lint checks pass
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Coverage reported (target >85% on domain logic)

## On Success
Mark task as `[x]` in task.md (verification passed = task complete).

## Next Phase
Proceed to **Phase 5: Ship** (`/5-commit`)