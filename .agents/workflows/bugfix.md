---
description: Bug-fix workflow for all bug fixes — from hotfixes to complex debugging
---

# Bug-Fix Workflow

## Purpose
Fix bugs of any size — from one-line hotfixes to multi-file debugging sessions — without the overhead of a full feature workflow.

## When to Use
- Bug fixes (any size, any complexity)
- Hotfixes for production issues
- Addressing review findings from `/audit`
- Regression fixes after deployments
- Flaky test fixes

## When NOT to Use
- New features (use `/workflow-solo`)
- Refactoring (use `/refactor`)
- Code quality audits (use `/audit`)

## Pre-Implementation Checklist
Before starting, you MUST:
1. Scan `.agents/rules/` directory for applicable rules
2. Read `rule-priority.md` for conflict resolution

## Phases

### Phase 1: Diagnose
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

1. Identify the bug or issue
2. Locate the affected code — trace from symptoms to root cause
3. If the cause is not immediately obvious, activate the **Debugging Protocol** skill
4. Assess blast radius — which files, features, and tests are affected?
5. Define the fix in `task.md`

**Skills to consider:**
- **Debugging Protocol** — for non-obvious root causes, flaky tests, or multi-component bugs
- **Sequential Thinking** — when multiple hypotheses need systematic evaluation

### Phase 2: Fix + Test (TDD)
**Set Mode:** Use `task_boundary` to set mode to **EXECUTION**

1. **Write a failing test** that reproduces the bug
2. **Apply the fix** to make the test pass
3. **Verify existing tests** still pass
4. If the fix touches integration boundaries (database queries, API calls, external services), write or update integration tests
5. Follow applicable rules:
   - Error Handling Principles @error-handling-principles.md
   - Logging and Observability Mandate @logging-and-observability-mandate.md

### Phase 3: Verify + Ship
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

1. Run the full validation suite (same as `phase-verify.md`)
2. If the fix touched UI or user-facing flows, run E2E validation (same as `phase-e2e.md`)
3. If all checks pass, commit with conventional format (same as `phase-commit.md`)
4. Use commit type `fix(<scope>): <description>`

## Completion Criteria
- [ ] Root cause identified and documented
- [ ] Bug reproduced with a test
- [ ] Fix applied and test passes
- [ ] Integration tests updated (if applicable)
- [ ] Full verification suite passes
- [ ] Committed with `fix` type
