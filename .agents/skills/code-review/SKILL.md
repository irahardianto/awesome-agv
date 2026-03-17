---
name: code-review
description: Structured code review protocol for inspecting code quality against the full rule set. Use when auditing code written by yourself or another agent, during the /audit workflow, or when the user asks for a code review.
---

# Code Review Skill

## Purpose
Systematically review code against the full antigravity rule set. Catches issues that linters miss: architectural violations, missing observability, business logic errors, pattern inconsistencies.

## When to Invoke
- During the `/audit` workflow (Phase 1: Code Review)
- When user asks for a code review outside any workflow
- **Best practice:** Invoke in a fresh conversation (not the same one that authored the code) to avoid confirmation bias

## Review Process

### 1. Scope the Review
Identify the files/features to review. Determine the review scope:
- **Feature review** — all files in a feature directory
- **PR review** — only changed files
- **Full codebase audit** — all features

### 2. Load the Rule Set
Read all applicable rules from `.agent/rules/`. Use `rule-priority.md` for severity classification.

### 3. Review Categories (Priority Order)

Review each file/feature against these categories, in order from `rule-priority.md`:

#### Critical (Must Fix)
- **Security** — injection, hardcoded secrets, broken auth
- **Data loss** — missing error handling on writes, no transaction boundaries
- **Resource leaks** — unclosed connections, missing cleanup

#### Major (Should Fix)
- **Testability** — I/O not behind interfaces, untested error paths
- **Observability** — missing logging on operations, no correlation IDs
- **Error handling** — empty catch blocks, swallowed errors
- **Architecture** — circular dependencies, wrong layer access

#### Minor (Nice to Fix)
- **Pattern consistency** — deviation from established codebase patterns
- **Naming** — unclear variable/function names
- **Code organization** — functions too long, mixed responsibilities

#### Nit (Optional)
- **Style** — formatting issues the linter would catch
- **Documentation** — missing comments on complex logic

### 4. Produce Findings

Output a structured findings document:

```markdown
# Code Review: {Feature/Module Name}
Date: {date}
Reviewer: AI Agent (fresh context)

## Summary
- **Files reviewed:** N
- **Issues found:** N (X critical, Y major, Z minor, W nit)

## Critical Issues
- [ ] **[SEC]** {description} — [{file}:{line}](file:///path)
- [ ] **[DATA]** {description} — [{file}:{line}](file:///path)

## Major Issues
- [ ] **[TEST]** {description} — [{file}:{line}](file:///path)
- [ ] **[OBS]** {description} — [{file}:{line}](file:///path)

## Minor Issues
- [ ] **[PAT]** {description} — [{file}:{line}](file:///path)

## Nit
- [ ] {description} — [{file}:{line}](file:///path)

## Rules Applied
List of rules referenced during this review.
```

### 5. Save the Report

When invoked via the `/audit` workflow, you **MUST** persist the findings to the repo:

**Path:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

1. Create `docs/audits/` if it doesn't exist
2. Write the findings document to that path
3. This makes the report accessible from other conversations and agents

When invoked as a standalone review (not via `/audit`), saving to `docs/audits/` is recommended but optional.

### 6. Severity Tags

| Tag      | Category            | Rule Source                                        |
| -------- | ------------------- | -------------------------------------------------- |
| `[SEC]`  | Security            | `security-principles.md`                           |
| `[DATA]` | Data integrity      | `error-handling-principles.md`                     |
| `[RES]`  | Resource leak       | `resources-and-memory-management-principles.md`    |
| `[TEST]` | Testability         | `architectural-pattern.md`, `testing-strategy.md`  |
| `[OBS]`  | Observability       | `logging-and-observability-mandate.md`             |
| `[ERR]`  | Error handling      | `error-handling-principles.md`                     |
| `[ARCH]` | Architecture        | `architectural-pattern.md`, `project-structure.md` |
| `[PAT]`  | Pattern consistency | `code-organization-principles.md`                  |

## Rule Compliance
This skill enforces all rules in `.agent/rules/`. Key references:
- Rule Priority @rule-priority.md (severity classification)
- Security Principles @security-principles.md
- Architectural Patterns @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Error Handling Principles @error-handling-principles.md
