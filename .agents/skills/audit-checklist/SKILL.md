---
name: audit-checklist
description: >
  Consolidated audit checklists for code review and verification.
  Load during /workflow-team REVIEW/VERIFY primitives, /audit workflow,
  or when spawning an audit subagent via dynamic recursive provisioning.
  Contains all enforcement checklists previously embedded in rules.
---

# Audit Checklist Skill

Use this skill to perform comprehensive code audits against the project's governance rules.
Each section maps to a rule in `.agents/rules/`. Check ALL applicable sections based on
what the code touches.

## Architecture & Testability
*(from architectural-pattern.md)*
- [ ] Can unit tests run without database/external services?
- [ ] All I/O operations behind an abstraction?
- [ ] Business logic pure (no side effects)?
- [ ] Integration tests exist for all adapters?
- [ ] Pattern matches existing codebase (>80% consistency)?

## Accessibility
*(from accessibility-principles.md)*
- [ ] All interactive elements reachable via keyboard?
- [ ] Focus indicators visible?
- [ ] Semantic HTML elements used?
- [ ] Heading hierarchy correct?
- [ ] Color contrast meets AA (4.5:1)?
- [ ] Images have appropriate alt text?
- [ ] Form inputs have associated labels?
- [ ] ARIA used correctly (native first)?

## Command Execution
*(from command-execution-principles.md)*
- [ ] User input sanitized before use in commands?
- [ ] Arguments passed as lists (not string concatenation)?
- [ ] Minimum necessary permissions?
- [ ] Exit codes checked, errors handled?
- [ ] Timeouts set? stderr captured?
- [ ] Commands non-interactive?

## Database
*(from database-design-principles.md)*
- [ ] Schema follows naming conventions?
- [ ] All tables have id, created_at, updated_at?
- [ ] Foreign keys have constraints and indexes?
- [ ] Queries parameterized (no SQL injection)?
- [ ] Indexes for frequent query patterns?
- [ ] Migrations reversible?
- [ ] Transactions short and focused?
- [ ] N+1 queries avoided?

## Dependencies
*(from dependency-management-principles.md)*
- [ ] Production dependencies pinned to exact versions?
- [ ] Lock file committed?
- [ ] Each dependency justified (not <50 lines of custom code)?
- [ ] Imports organized (stdlib → external → internal)?

## Error Handling
*(from error-handling-principles.md)*
- [ ] All error paths explicitly handled?
- [ ] Errors include correlation IDs?
- [ ] Sensitive details sanitized before returning to client?
- [ ] Resources cleaned up in all error scenarios?
- [ ] Error tests written?

## Git
*(from git-workflow-principles.md)*
- [ ] Branch named with correct type prefix?
- [ ] Commits follow conventional format?
- [ ] No debug code or secrets committed?
- [ ] All tests pass before committing?
- [ ] Commit messages explain why?

## Monitoring
*(from monitoring-and-alerting-principles.md)*
- [ ] Health check endpoints (/health and /ready)?
- [ ] Liveness has no dependency checks?
- [ ] Readiness checks all critical dependencies?
- [ ] Key operations instrumented with RED/USE metrics?
- [ ] No high-cardinality metric labels?
- [ ] Circuit breakers on external dependencies?
- [ ] Timeouts on all external calls?

## Performance
*(from performance-optimization-principles.md)*
- [ ] Measured performance problem (not a guess)?
- [ ] Profiled to find actual bottleneck?
- [ ] Appropriate data structures for access pattern?
- [ ] Expensive operations cached with proper invalidation?
- [ ] Batch operations used instead of N+1?
