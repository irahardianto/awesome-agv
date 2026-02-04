---
description: Verify phase - run full validation suite
---

# Phase 4: Verify

## Purpose
Run all linters, static analysis, and tests to ensure code quality.

## Prerequisites
- Phase 3 (Integrate) completed (or skipped if no adapters)
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
Run the FULL validation suite:

```bash
# // turbo
cd apps/backend && gofumpt -l -e -w . && go vet ./... && staticcheck ./... && gosec -quiet ./... && go test -race ./...
```

### 2. Frontend Validation
```bash
# // turbo
cd apps/frontend && pnpm run lint --fix && npx vue-tsc --noEmit && pnpm run test
```

### 3. Build Check
```bash
# Backend
cd apps/backend && go build ./...

# Frontend
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