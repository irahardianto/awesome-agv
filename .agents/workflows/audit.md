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
1. Scan `.agents/rules/` directory — these form the review criteria
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

### Phase 1.5: Cross-Boundary Review
**Set Mode:** Continue in **PLANNING**

Cross-boundary issues live at the seams between components, not inside any single file. This phase defines a **menu of dimensions** — activate only those that apply to the project under audit, and explicitly state which you skipped and why.

#### Dimension Selection

| Dimension | Activate When |
|---|---|
| **A. Integration Contracts** | Project has both a frontend and a backend |
| **B. Database & Schema** | Project uses a relational/document database |
| **C. Configuration & Environment** | Always — universal |
| **D. Dependency Health** | Always — universal |
| **E. Test Coverage Gaps** | Always — universal |
| **F. Mobile ↔ Backend** | Project has a mobile app and a backend |

At the start of this phase you MUST state:
> "Activating dimensions: A, B, C, D, E. Skipping F (no mobile app)."

---

#### Dimension A: Integration Contracts
*Applies to: full-stack projects with frontend + backend*

- [ ] Map every backend endpoint (route + method) against its frontend adapter — flag any unmapped endpoints in either direction
- [ ] Verify request/response field names, types, and status codes match across the boundary
- [ ] Verify all outbound HTTP calls use the project's centralized API client (not raw `fetch`/`axios`) — see `typescript-idioms-and-patterns.md § Centralized HTTP Client`
- [ ] Build an auth coverage matrix: which endpoints require auth, do the frontend adapters send tokens for each?
- [ ] Check error contract alignment: does the frontend handle the full set of error codes the backend can return?

#### Dimension B: Database & Schema
*Applies to: projects using a relational or document database*

- [ ] Verify all tables have required base columns (`id`, `created_at`, `updated_at`)
- [ ] Check all foreign keys have corresponding indexes
- [ ] If using Supabase or Postgres RLS: verify RLS policies exist on every table storing user data
- [ ] Cross-reference the application's struct/model field names against actual DB column names — flag any drift
- [ ] Check migrations are reversible (up + down) and follow the additive-first strategy
- [ ] Scan storage adapters for N+1 query patterns

#### Dimension C: Configuration & Environment
*Always active*

- [ ] No hardcoded secrets, tokens, URLs, or credentials in source code
- [ ] `.env.template` exists and covers every env var referenced in the codebase
- [ ] Startup validation fails fast on missing required config (does not silently fall back to bad defaults)
- [ ] Secrets are never logged (not in debug, not in error messages)

#### Dimension D: Dependency Health
*Always active*

- [ ] No unused top-level dependencies in `go.mod` / `package.json` / `Cargo.toml`
- [ ] No circular dependencies between feature modules
- [ ] Cross-module imports only use each module's public API (not internal files)
- [ ] Run `npm audit` / `go list -m -json all | nancy` / `cargo audit` — flag high-severity CVEs

#### Dimension E: Test Coverage Gaps
*Always active*

- [ ] A handler/controller test exists for every API endpoint
- [ ] An integration test exists for every storage/database adapter
- [ ] Every error path (catch block, error return) has at least one test that exercises it
- [ ] E2E tests cover the primary user journeys (login, main feature flow, error states)

#### Dimension F: Mobile ↔ Backend
*Applies to: projects with a mobile app and a backend*

- [ ] API version compatibility — mobile must not call endpoints that no longer exist
- [ ] Offline data sync: conflict resolution and retry logic are tested
- [ ] Auth token refresh flows work correctly when the access token expires mid-session

---

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

> **Zero-Findings Guard:** If the audit produces fewer than 3 findings, you MUST complete the "Dimensions Covered" attestation section in the report before declaring a clean result. This proves cross-boundary coverage was not skipped.

```markdown
# Code Audit: {Feature/Module Name}
Date: {date}

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor)
- **Test coverage:** N%
- **Dimensions activated:** A, B, C, D, E (list which were skipped and why)

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

## Dimensions Covered
<!-- Required when total findings < 3 -->
| Dimension | Status | Files / Queries Examined |
|---|---|---|
| A. Integration Contracts | ✅ Checked / ⏭ Skipped (reason) | e.g., all 26 backend routes cross-referenced against 11 frontend adapters |
| B. Database & Schema | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed all 8 Supabase tables + 4 storage adapters |
| C. Configuration & Environment | ✅ Checked | e.g., scanned for raw secrets, verified .env.template |
| D. Dependency Health | ✅ Checked | e.g., ran npm audit, checked go.mod for unused deps |
| E. Test Coverage Gaps | ✅ Checked | e.g., verified handler tests for all 26 endpoints |
| F. Mobile ↔ Backend | ⏭ Skipped | No mobile app in this project |
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
