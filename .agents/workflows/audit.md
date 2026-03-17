---
description: Code audit workflow - structured code review and quality verification
---

# Audit Workflow

## Purpose
Inspect existing code quality and produce structured findings. This workflow does not write new features — it identifies issues for subsequent fix workflows.

## When to Use
- After another agent's feature is committed (cross-agent review)
- Periodic quality gates on the codebase
- Before releases or deployments
- When user wants assurance without writing new code
- After addressing review findings, to verify the fixes

## When NOT to Use
- When writing new features (use `/orchestrator`)
- When fixing known bugs (use `/quick-fix`)
- When restructuring code (use `/refactor`)

## Pre-Audit Checklist
Before starting, you MUST:
1. Scan `.agent/rules/` directory — these form the review criteria
2. Read `rule-priority.md` for conflict resolution
3. Identify the scope of the audit (specific feature, module, or full codebase)

## Phases

### Phase 1: Code Review
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

Invoke the **Code Review Skill** against the specified files/features.

Review against these categories (in priority order from `rule-priority.md`):

#### 1. Security
- Input validation on all boundaries
- No hardcoded secrets or credentials
- Parameterized queries (no SQL injection)
- Proper authentication/authorization checks

#### 2. Reliability
- Error handling on all I/O operations (no empty catch blocks)
- All resources cleaned up (connections, files, locks)
- Timeouts on external calls
- Graceful degradation patterns

#### 3. Testability
- I/O operations behind interfaces/abstractions
- Business logic is pure (no side effects)
- Dependencies injected, not hardcoded
- Test coverage on critical paths

#### 4. Observability
- All operation entry points logged (start/success/failure)
- Structured logging with correlation IDs
- Appropriate log levels

#### 5. Code Quality
- Follows existing codebase patterns (>80% consistency)
- Functions are focused and small (10-50 lines)
- Clear naming that reveals intent
- No code duplication (DRY)

### Phase 2: Automated Verification
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

Run the full validation suite (same as `/4-verify`):
1. Linters and static analysis
2. Full test suite
3. Build check
4. Coverage report

### Phase 3: Findings Report

**Output location:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

You MUST save the report to the repo (not just as a conversation artifact) so it can be:
- Referenced from other conversations/agents
- Tracked in version control
- Passed as context to fix workflows

**Steps:**
1. Create the `docs/audits/` directory if it doesn't exist
2. Write the findings report to `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`
3. Use the template below

```markdown
# Code Audit: {Feature/Module Name}
Date: {date}

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor)
- **Test coverage:** N%

## Critical Issues
Issues that must be fixed before deployment.
- [ ] {description} — {file}:{line}

## Major Issues
Issues that should be fixed in the near term.
- [ ] {description} — {file}:{line}

## Minor Issues
Style, naming, or minor improvements.
- [ ] {description} — {file}:{line}

## Verification Results
- Lint: PASS/FAIL
- Tests: PASS/FAIL (N passed, N failed)
- Build: PASS/FAIL
- Coverage: N%
```

## Feedback Loop
After the audit produces findings, choose the right workflow based on finding type:

| Finding Type                                                                        | Example                              | Workflow                              |
| ----------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| **Nit / minor** (naming, formatting, missing comment)                               | "Rename `x` to `userCount`"          | Fix in this conversation directly     |
| **Small isolated fix** (missing log, error handling, validation)                    | "Add input validation on handler"    | `/quick-fix` in a new conversation    |
| **Structural change** (wrong abstraction, missing interface, pattern inconsistency) | "Storage not behind interface"       | `/refactor` in a new conversation     |
| **Missing capability** (new endpoint, feature, auth check)                          | "No auth middleware on admin routes" | `/orchestrator` in a new conversation |

### Using Findings in Other Contexts
When starting a fix workflow in a new conversation, reference the persisted report:

> "Fix the critical issues in `docs/audits/review-findings-gatekeeper-2026-02-16-1430.md`"

The agent in the new context can read the file directly from the repo — no need to copy-paste findings.

## Completion Criteria
- [ ] All specified files/features reviewed
- [ ] Full verification suite run
- [ ] Findings document saved to `docs/audits/` in the repo
