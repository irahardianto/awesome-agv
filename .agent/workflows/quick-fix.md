---
description: Quick-fix workflow for hotfixes and small bug fixes - skip research, minimal verify
---

# Quick-Fix Workflow

## Purpose
Fast-track bug fixes and small changes that don't require full research or integration phases.

## When to Use
- Bug fixes with a known root cause
- Small, isolated changes (< 50 lines)
- Hotfixes for production issues
- Addressing review findings from `/audit`

## When NOT to Use
- New features (use `/orchestrator`)
- Refactoring (use `/refactor`)
- Changes touching multiple features or modules

## Pre-Implementation Checklist
Before starting, you MUST:
1. Scan `.agent/rules/` directory for applicable rules
2. Read `rule-priority.md` for conflict resolution
3. Confirm the fix scope is truly small and isolated

## Phases

### Phase 1: Diagnose
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

1. Identify the bug or issue
2. Locate the affected code
3. If the cause is not immediately obvious, activate the **Debugging Protocol** skill
4. Define the fix in `task.md` (1-3 items max)

### Phase 2: Fix + Test (TDD)
**Set Mode:** Use `task_boundary` to set mode to **EXECUTION**

1. **Write a failing test** that reproduces the bug
2. **Apply the minimal fix** to make the test pass
3. **Verify existing tests** still pass
4. Follow applicable rules:
   - Error Handling Principles @error-handling-principles.md
   - Logging and Observability Mandate @logging-and-observability-mandate.md

### Phase 3: Verify + Ship
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

1. Run the full validation suite (same as `/4-verify`)
2. If all checks pass, commit with conventional format (same as `/5-commit`)
3. Use commit type `fix(<scope>): <description>`

## Completion Criteria
- [ ] Bug reproduced with a test
- [ ] Fix applied and test passes
- [ ] Full verification suite passes
- [ ] Committed with `fix` type
