---
description: Refactor workflow for safely restructuring existing code
---

# Refactor Workflow

## Purpose
Safely restructure existing code while preserving behavior. Uses a different mindset than greenfield feature development: understand first, then change structure.

## When to Use
- Code restructuring (moving, renaming, splitting modules)
- Pattern migration (e.g., switching from callbacks to async/await)
- Dependency upgrades with breaking changes
- Addressing tech debt or architectural improvements

**Requires a specific goal.** Invoke with a clear target, not an open directory:
- ✅ `/refactor extract storage interface in task feature`
- ✅ `/refactor split user handler into separate auth handler`
- ❌ `/refactor apps/backend` (too vague — use `/audit` first to find specific issues)

## When NOT to Use
- New features (use `/orchestrator`)
- Small bug fixes (use `/quick-fix`)
- "Find what to improve" (use `/audit` first, then `/refactor` for structural findings)

## Pre-Implementation Checklist
Before starting, you MUST:
1. Scan `.agent/rules/` directory for applicable rules
2. Read `architectural-pattern.md` and `project-structure.md`
3. Read `rule-priority.md` for conflict resolution

## Phases

### Phase 1: Impact Analysis
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

1. **Map the blast radius** — what files, modules, and tests are affected?
2. **Document existing behavior** — what tests currently pass? what contracts exist?
3. **Identify risks** — can this be done incrementally or is a big-bang needed?
4. **Create refactoring plan** in `task.md` with incremental steps
5. If decision involves trade-offs, create an ADR using the **ADR Skill**

**Skills to consider:**
- **Sequential Thinking** — for multi-step refactoring with interdependencies

### Phase 2: Incremental Change (TDD)
**Set Mode:** Use `task_boundary` to set mode to **EXECUTION**

For each step in the refactoring plan:
1. **Ensure existing tests pass** before making any change
2. **Make one incremental change** — move, rename, or restructure
3. **Run tests after each change** — behavior must be preserved
4. **Add new tests** if the refactoring exposes untested behavior
5. Follow applicable rules:
   - Architectural Patterns @architectural-pattern.md
   - Code Organization Principles @code-organization-principles.md
   - Avoid Circular Dependencies @avoid-circular-dependencies.md

**Key principle:** Never break the build for more than one step at a time.

### Phase 3: Parity Verification
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

1. Run the full validation suite (same as `/4-verify`)
2. **Compare test coverage** — coverage should be equal to or better than before
3. **Verify no behavior changes** — same inputs produce same outputs
4. If applicable, run E2E tests (`/e2e-test`)

### Phase 4: Ship
Follow `/5-commit` with commit type `refactor(<scope>): <description>`

## Completion Criteria
- [ ] Impact analysis documented
- [ ] All changes made incrementally with tests passing at each step
- [ ] Full verification suite passes
- [ ] Test coverage is equal to or better than before
- [ ] Committed with `refactor` type
