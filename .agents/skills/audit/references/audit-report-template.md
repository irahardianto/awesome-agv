# Code Audit Report Template

Use this template when writing the Phase 4 code audit report.
Fill all `{placeholders}` with actual data from the audit findings.

**Output location:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

---

```markdown
# Code Audit: {Feature/Module Name}
Date: {date}
Auditor: AI Code Audit (multi-dimensional, {N} parallel subagents)

## Executive Summary
- **Dimensions activated:** {list, e.g., A, B, C, D, E, F, G}
- **Dimensions skipped:** {list with reasons, e.g., "F partial (no mobile app)"}
- **Files scanned:** {N}
- **Findings:** {N total} ({X} critical, {Y} major, {Z} minor, {W} enhancement)
- **Automated verification:** Lint: PASS/FAIL | Tests: PASS/FAIL ({N} passed, {N} failed) | Build: PASS/FAIL | Coverage: {N}%
- **Overall codebase health:** HEALTHY / NEEDS ATTENTION / HIGH RISK / CRITICAL

## Critical Issues
Vulnerabilities or severe defects that cause active security breaches, data loss, or system failure. Must be fixed immediately.
- [ ] **[CRIT-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F/G}
  - **Rule Source:** {rule or skill reference}
  - **Description:** {what the issue is}
  - **Impact:** {consequence if left unfixed}
  - **Evidence:** {code snippet or grep output}
  - **Remediation:** {specific fix guidance}
  - **Fix workflow:** `/bugfix` — immediate priority

## Major Issues
Structural violations, missing I/O error handling, untested critical paths, or broken contracts. Must be fixed before release.
- [ ] **[MAJ-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F/G}
  - **Rule Source:** {rule or skill reference}
  - **Description:** {description}
  - **Impact:** {impact}
  - **Evidence:** {evidence}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix` or `/refactor`

## Minor Issues
Code maintainability issues, function length/complexity violations, or minor test gaps. Fix in near term.
- [ ] **[MIN-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F/G}
  - **Description:** {description}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix` or direct edit

## Enhancement Issues
Non-critical suggestions, defense-in-depth, documentation, or minor clarity refactorings.
- [ ] **[ENH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F/G}
  - **Suggestion:** {description}
  - **Fix workflow:** `/workflow-solo` or backlog

## Verification Suite Results
- **Linter & Static Analysis:** PASS / FAIL ({details})
- **Automated Tests:** PASS / FAIL ({N} passed, {N} failed, {N} skipped)
- **Build Verification:** PASS / FAIL ({details})
- **Test Coverage:** {N}%

## Cross-Dimension Correlations
Findings that span multiple dimensions, with escalated severity.
- {description of correlated findings and why severity was escalated}

## Dimensions Covered
<!-- Required when total findings < 3 -->
| Dimension | Status | Files / Queries Examined |
|---|---|---|
| A. Security & Configuration | ✅ Checked / ⏭ Skipped (reason) | e.g., scanned all 14 handler files for injection & secret leaks |
| B. Reliability & Error Handling | ✅ Checked / ⏭ Skipped (reason) | e.g., verified error handling & resource cleanup on all I/O adapters |
| C. Testability & Architecture | ✅ Checked / ⏭ Skipped (reason) | e.g., checked I/O isolation & dependency direction across 6 modules |
| D. Observability & Logging | ✅ Checked / ⏭ Skipped (reason) | e.g., checked operation entry point logging on 22 routes & queue workers |
| E. Code Quality & Patterns | ✅ Checked / ⏭ Skipped (reason) | e.g., audited function complexity & pattern consistency across core services |
| F. Integration Contracts & DB | ✅ Checked / ⏭ Skipped (reason) | e.g., mapped 26 backend routes against frontend adapters, reviewed DB schema |
| G. Dependencies & Tests | ✅ Checked / ⏭ Skipped (reason) | e.g., ran npm audit, checked test coverage on storage adapters |

## Rules Applied
List of project rules referenced and verified during this audit.
- `security-mandate.md` / `security-principles.md`
- `rugged-software-constitution.md`
- `error-handling-principles.md`
- `architectural-pattern.md`
- `logging-and-observability-mandate.md`
- `code-organization-principles.md`
- `api-design-principles.md` / `database-design-principles.md`
- `dependency-management-principles.md` / `testing-strategy.md`

## Remediation Action Plan
Findings ranked by priority for resolution.
1. **[CRIT-001]** — {one-line summary} → `/bugfix`
2. **[MAJ-001]** — {one-line summary} → `/bugfix` or `/refactor`
3. **[MIN-001]** — {one-line summary} → `/bugfix`
```
