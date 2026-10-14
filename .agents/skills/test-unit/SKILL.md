---
name: test-unit
description: >-
  Analyzes gaps, prioritizes by risk, and systematically improves unit test coverage on existing code. User-invoked entry point via /test-unit; not for autonomous or subagent use.
disable-model-invocation: true
---

# Improve Unit Test Coverage

> **Entry-point guard:** This is a user-invoked command skill (`/test-unit`). If you are a spawned subagent, do NOT execute this skill — return to your assigned scope card.

## Purpose
Retroactive unit test coverage improvement for existing codebases. For greenfield development, use `/workflow-solo` — TDD is built in.

## When to Use
- Existing codebase with insufficient unit test coverage
- Post-mortem finding: "we need more tests"
- Pre-release hardening
- Quality improvement initiative

## When NOT to Use
- Greenfield development (use `/workflow-solo` — TDD is built in)
- Integration test gaps (use `/test-integration` skill)
- E2E test gaps (use `/test-e2e` skill)
- Need test scenarios first (use `/test-scenarios` skill)

## Phases

### Phase 1: ANALYZE
**Objective:** Map current coverage gaps.

1. Load applicable idiom skill(s) — each defines the coverage tool (e.g., Go: `go test -coverprofile`, TS: `vitest --coverage`, Python: `pytest-cov`)
2. Run coverage tool against the full codebase
3. Parse coverage report — identify files and functions with lowest coverage
4. Produce **Coverage Gap Map** artifact with: file path, current coverage %, lines uncovered, module/feature area. Sort by coverage ascending.

**Gate:** Coverage gap map artifact created with baseline metrics.

### Phase 2: PRIORITIZE
**Objective:** Rank gaps by business impact for user review.

Prioritization criteria (highest → lowest):
1. **Critical business logic** — payment, auth, core domain rules
2. **High-churn files** — use `git log --format='%H' --follow <file> | wc -l` to find frequently changed files
3. **Public API surface** — exported functions/methods used by other modules
4. **Error handling paths** — catch/error blocks with no test coverage
5. **Utilities and helpers** — lowest priority unless widely imported

Steps:
1. Cross-reference coverage gaps with git churn data
2. Categorize each gap by criteria above
3. Present prioritized list to user for confirmation
4. User selects which gaps to address in this iteration

**Gate:** User-approved prioritized gap list.

### Phase 3: REFACTOR-FOR-TESTABILITY (Conditional)
**Only if** target code isn't testable (tight coupling, no interfaces, I/O mixed into business logic).

**Objective:** Make code testable without changing behavior.

1. Assess testability against I/O isolation rules in @architectural-pattern.md
2. If refactoring needed:
   a. Write **characterization tests** first — lock current behavior
   b. Apply `refactoring-patterns` skill for safe transformations
   c. Extract interfaces per `testability-patterns` skill
   d. Verify characterization tests still pass
3. Load `guardrails` skill for pre-flight checks

**Skills to consider:** `testability-patterns`, `refactoring-patterns`, `guardrails`

**Gate:** Target code is testable. Characterization tests pass.

### Phase 4: TEST
**Objective:** Write unit tests for prioritized gaps.

1. Follow @testing-strategy.md rule: AAA pattern, meaningful names, co-located test files
2. For each prioritized gap: write tests for happy path, error paths, edge cases / boundary values
3. Use test doubles per `testing-strategy` skill (stubs for queries, mocks for commands)
4. Run tests incrementally — verify each batch passes before moving to next gap

**Skills to consider:** `testing-strategy`

**Gate:** All new tests pass. Each prioritized gap has test coverage.

### Phase 5: VERIFY
**Objective:** Measure improvement and report.

1. Re-run coverage tool
2. Compare against Phase 1 baseline
3. Produce **Coverage Improvement Report** artifact: before/after per file, total coverage delta, remaining gaps
4. Run full quality checks per idiom skill

**Gate:** Coverage improved. Quality checks pass. Report generated.

## Completion Criteria
- [ ] Coverage gap map created with baseline metrics
- [ ] Gaps prioritized by risk and approved by user
- [ ] Characterization tests written (if refactoring was needed)
- [ ] Unit tests written for all approved gaps
- [ ] Coverage improvement report generated (before vs after)
- [ ] All quality checks pass
