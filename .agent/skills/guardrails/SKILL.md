---
name: guardrails
description: Pre-flight checklist and post-implementation self-review protocol. Use before generating any code (pre-flight) and after writing code but before verification (self-review) to catch issues early.
---

# Agent Guardrails Skill

## Purpose
Structured checklists that ensure the agent considers all applicable rules before and after writing code. Catches issues that would otherwise only surface during verification.

## When to Invoke
- **Pre-Flight:** At the start of Phase 2 (Implement), before writing any code
- **Self-Review:** At the end of Phase 2 (Implement), after writing code but before Phase 3/4

---

## Pre-Flight Checklist

Run through this checklist **before writing any code**:

- [ ] Identified all applicable rules from `.agent/rules/`
- [ ] Searched for existing patterns in codebase (Pattern Discovery Protocol from `architectural-pattern.md`)
- [ ] Confirmed project structure alignment (`project-structure.md`)
- [ ] Identified I/O boundaries that need abstraction
- [ ] Determined test strategy (unit/integration/E2E)
- [ ] Reviewed `rule-priority.md` for any potential conflicts

If any item cannot be checked, **stop and resolve** before proceeding.

---

## Post-Implementation Self-Review

Run through this checklist **after writing code, before verification**:

### Security
- [ ] No hardcoded secrets or configuration values
- [ ] All user input validated at system boundaries
- [ ] Parameterized queries (no string concatenation for SQL)

### Testability
- [ ] All I/O operations behind interfaces/abstractions
- [ ] Business logic is pure (no side effects in calculations)
- [ ] Dependencies injected, not hardcoded

### Observability
- [ ] All public operation entry points logged (start/success/failure)
- [ ] Structured logging with correlation IDs
- [ ] Appropriate log levels (not everything is INFO)

### Error Handling
- [ ] Error paths handled explicitly (no empty catch blocks)
- [ ] Errors provide context (wrapped with additional info)
- [ ] Resources cleaned up in error paths (defer/finally)

### Testing
- [ ] Tests cover happy path
- [ ] Tests cover at least 2 error paths
- [ ] Tests cover edge cases relevant to the domain

### Consistency
- [ ] Follows existing codebase patterns (>80% consistency)
- [ ] Naming conventions match the codebase
- [ ] File organization matches `project-structure.md`

## Rule Compliance
This skill enforces:
- All mandates (always-on rules)
- Architectural Patterns @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Rule Priority @rule-priority.md
