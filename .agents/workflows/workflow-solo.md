---
description: Single-agent feature workflow — lean sequential pipeline with adaptive complexity
---

# Workflow Solo — Lean Feature Pipeline

## Purpose

Single-agent workflow for feature development. Execute phases sequentially with complexity-appropriate depth.

- For multi-agent orchestration with parallel dispatch and review layers, use `/workflow-team`.
- Subagent spawning is a native capability — use it when beneficial, but this workflow doesn't prescribe a multi-agent hierarchy.

## Complexity Assessment

Assess the task on 3 dimensions before starting:

| Dimension | Low | High |
|-----------|-----|------|
| **Scope** | 1–3 files, single module | 4+ files, cross-module |
| **Risk** | No breaking changes, internal only | Public API changes, data migrations |
| **Knowledge** | Familiar patterns exist in codebase | New technology, no precedent |

Route to a track:

| Track | When | Phases |
|-------|------|--------|
| **Light** | All dimensions Low | IMPLEMENT → VERIFY → COMMIT |
| **Standard** | Any dimension Medium/High | RESEARCH → IMPLEMENT → VERIFY → COMMIT |
| **Thorough** | Multiple dimensions High | RESEARCH → IMPLEMENT → VERIFY (full) → COMMIT |

---

## Phase: RESEARCH

> **Track:** Standard, Thorough only. Skip for Light.

**Objective:** Understand context, discover patterns, define scope.

1. Load applicable idiom skill(s) per @code-idioms-and-conventions.md
2. Search codebase for existing patterns per Pattern Discovery Protocol in @architectural-pattern.md
3. Examine 3+ existing modules for consistency (>80% required)
4. Search external documentation for unfamiliar technologies
5. Create `task.md` with atomic, testable tasks
6. Document findings in research artifact
7. If a significant architecture decision is made, create an ADR using the `adr` skill

**Skills to consider:** `research-methodology`, `sequential-thinking`, `adr`

**Gate:** Research artifact created. Task list defined. Patterns documented with >80% consistency.

---

## Phase: IMPLEMENT

**Objective:** Write production code and unit tests using TDD.

1. Load applicable idiom skill(s) per @code-idioms-and-conventions.md
2. Follow TDD cycle per @testing-strategy.md: Red → Green → Refactor
3. Apply I/O isolation per @architectural-pattern.md:
   - Extract pure business logic (no side effects, no I/O)
   - Abstract I/O behind interfaces with production and test implementations
   - Wire dependencies at `main` — business logic receives dependencies via injection
4. Add structured logging per @logging-and-observability-mandate.md at operation entry points (start/success/failure with correlationId, duration)
5. Handle errors per @error-handling-principles.md — no silent failures, fail closed
6. Follow Code Completion Workflow per @code-idioms-and-conventions.md: Generate → Validate → Remediate → Verify → Deliver

**Applicable rules:** @testing-strategy.md, @architectural-pattern.md, @code-idioms-and-conventions.md, @logging-and-observability-mandate.md, @error-handling-principles.md, @code-organization-principles.md

**Skills to consider:** `sequential-thinking`, `debugging-protocol`, `guardrails`

**Gate:** Unit tests pass. Code follows idiom skill quality checks. Logging added to all operations.

---

## Phase: VERIFY

**Objective:** Full validation — lint, test, build, coverage.

1. Run all quality checks defined by the loaded idiom skill (linter, formatter, type checker, static analysis)
2. Run all unit tests
3. **If adapters were modified (Thorough track):**
   - Write and run integration tests per @architectural-pattern.md
   - Use `testing-strategy` skill for Testcontainers/infrastructure patterns
4. **If UI was modified (Thorough track):**
   - Run E2E tests per `browser-automation` skill
   - Capture screenshots as evidence
5. Run build to ensure no compilation/bundling errors
6. Report coverage (target per @testing-strategy.md)
7. Fix any failures, re-run until all pass

**Applicable rules:** @code-idioms-and-conventions.md, @testing-strategy.md, @architectural-pattern.md

**Gate:** All linters pass. All tests pass. Build succeeds. Coverage reported.

---

## Phase: COMMIT

**Objective:** Git commit with conventional format.

1. Stage changes
2. Review changes (`git diff --staged`)
3. Commit following conventions in @git-workflow-principles.md
4. Update `task.md` — mark completed items as `[x]`

**Applicable rules:** @git-workflow-principles.md

**Gate:** Committed with conventional format. `task.md` updated.

> **Document hygiene:** If `decision-log.md` was used during implementation, it should follow the `.agentwork/` → `docs/decisions/` promotion pattern defined in `workflow-team.md` §7.5. For significant architectural decisions, use the `adr` skill to write directly to `docs/decisions/`.

---

## Error Handling

If any phase fails:
1. Document the failure
2. Fix within current phase
3. Re-run gate criteria
4. Proceed only when gate passes

If stuck after 3 attempts on the same failure, stop and report to the user with:
- What failed, what was tried, and current state of the codebase.

---

## Quick Reference

| Phase | Output | Gate |
|-------|--------|------|
| Research | Research artifact + `task.md` | Scope defined, patterns documented |
| Implement | Code + unit tests | Unit tests pass, quality checks pass |
| Verify | Full validation report | All checks pass, coverage reported |
| Commit | Git commit | Conventional format committed |