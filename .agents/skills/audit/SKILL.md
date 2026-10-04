---
name: audit
description: >-
  Runs a multi-dimensional code quality, security, and integrity review with parallel subagents. User-invoked entry point via /audit; not for autonomous or subagent use.
disable-model-invocation: true
---

# Audit Skill

> **Entry-point guard:** This is a user-invoked command skill (`/audit`). If you are a spawned subagent, do NOT execute this skill — return to your assigned scope card.

## Purpose
Comprehensive, multi-dimensional code audit of existing code. Dispatches parallel subagents across orthogonal code quality, architectural, security, and integrity dimensions for maximum coverage. This skill identifies issues — it does not write new features or fixes.

## When to Use
- After another agent's feature is committed (cross-agent review)
- Periodic quality gates on the codebase
- Before releases or deployments
- When user wants assurance without writing new code
- After addressing review findings, to verify the fixes

## When NOT to Use
- Deep security-only vulnerability scan → `/security-audit`
- When writing new features → `/workflow-solo` or `/workflow-team`
- When fixing known bugs → `/bugfix`
- When restructuring code → `/refactor`

## References
`references/audit-dimensions.md` and `references/audit-report-template.md` — contains dimension scope cards, subagent prompt template, and report template.

## Pre-Audit Checklist
Before starting the audit, you MUST:
1. **Scan `.agents/rules/` directory** — these form the baseline review criteria
2. **Read `rule-priority.md`** — for conflict resolution and severity classification
3. **Identify audit scope** — determine whether auditing a specific feature, module, or full codebase

---

## Phase 0: Reconnaissance

Before dispatching subagents, understand the codebase structure and scope.

### 0.1 — Stack & Architecture Detection
Scan for language/framework/infrastructure markers:
- **Languages:** `go.mod`, `package.json`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `*.csproj`, `Gemfile`, `composer.json`
- **Frameworks:** HTTP frameworks, ORMs, UI frameworks, state management
- **Architecture:** Directory layout, monorepo structure (`apps/`), feature slice organization

### 0.2 — Codebase Inventory
Map key components within the audit scope:
- [ ] API endpoints and public entry points
- [ ] Business logic modules & pure domain functions
- [ ] Storage adapters & database interactions
- [ ] External service integrations & HTTP clients
- [ ] Logging, monitoring & observability setup
- [ ] Configuration and environment variable usage
- [ ] Test suite structure (unit, integration, E2E)

### 0.3 — Dimension Selection

Activate the applicable dimensions for the codebase under audit. State your selection explicitly:

| Dim | Scope | Activate When |
|---|---|---|
| **A** | Security & Configuration | Always |
| **B** | Reliability & Error Handling | Always |
| **C** | Testability & Architecture | Always |
| **D** | Observability & Operations Logging | Always |
| **E** | Code Quality & Patterns | Always |
| **F** | Integration Contracts & Database | Project has API boundaries or database |
| **G** | Dependencies & Test Coverage Gaps | Always |

State your selection:
> "Activating dimensions: A, B, C, D, E, G. Skipping F (no API boundaries or database in this scope)."

---

## Phase 1: Multi-Dimensional Audit Scan

Dispatch parallel subagents — one per activated dimension. Each operates independently with no cross-talk.

### Dispatch Protocol

Use `invoke_subagent` to spawn all activated dimension agents in a **single call**.

**Per-dimension fields:**
- **TypeName:** `self` (universal spawn mechanism — ensures subagents inherit full toolsets per `agent-protocols` §3)
- **Role:** `Code Auditor — Dimension {KEY}` (e.g., `Code Auditor — Dimension A`)
- **Workspace:** `inherit`
- **Prompt:** Build from the system prompt template in `references/audit-dimensions.md`. Fill in: dimension name, scope card, and reconnaissance context from Phase 0.

Each subagent receives in its prompt:
1. **Dimension scope card** — from `references/audit-dimensions.md`
2. **Reconnaissance context** — stack + codebase inventory from Phase 0
3. **Output target** — `.agentwork/findings-audit-{dimension-key}.md`

When all subagents message `findings ready`, proceed to Phase 2.

---

## Phase 2: Automated Verification

> Run **after** all Phase 1 subagents report back. Run tools yourself as coordinator.

Run the full validation suite for the project:
1. **Linters and static analysis:** Run language lint checks (`npm run lint`, `golangci-lint run`, `cargo clippy`, `ruff check`).
2. **Full test suite:** Execute unit and integration tests (`npm test`, `go test ./...`, `cargo test`, `pytest`).
3. **Build check:** Build the project binaries or bundles (`npm run build`, `go build`, `cargo build`).
4. **Coverage report:** Check test coverage if tooling is available.

Write results to `.agentwork/findings-audit-verification.md`:

```markdown
## Verification Suite Summary
- **Lint:** PASS / FAIL (details)
- **Tests:** PASS / FAIL (N passed, N failed)
- **Build:** PASS / FAIL (details)
- **Coverage:** N%
```

---

## Phase 3: Synthesis & Prioritization

### 3.1 — Collect
Read all `.agentwork/findings-audit-*.md` files from Phase 1 and Phase 2.

### 3.2 — Deduplicate
Consolidate findings reported by multiple dimensions (same root cause). Note which dimensions flagged each.

### 3.3 — Severity Ranking
Classify all findings using the standardized 4-level taxonomy:
- **CRITICAL** — vulnerabilities, data loss, app crashes; must fix immediately
- **MAJOR** — structural violations, missing I/O error handling, broken contracts; fix before release
- **MINOR** — code maintainability, function length violations, minor test gaps; fix near term
- **ENHANCEMENT** — non-critical improvements, defense-in-depth, documentation; backlog

### 3.4 — Cross-Dimension Correlation
When findings from 2+ dimensions converge on the same module or function, **escalate severity by one level** (MINOR → MAJOR, MAJOR → CRITICAL):
- Hardcoded secret (A) + secrets exposed in log output (D) → escalate to CRITICAL
- Missing error handling (B) + unlogged operation (D) on same endpoint → escalate to MAJOR
- Missing DB adapter test (G) + un-indexed foreign key (F) → escalate to MAJOR

---

## Phase 4: Audit Findings Report

**Output location:** `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

You MUST save the report to the repo (not just as a conversation artifact) so it can be:
- Referenced from other conversations/agents
- Tracked in version control
- Passed as context to fix workflows

**Steps:**
1. Create the `docs/audits/` directory if it doesn't exist
2. Read the report template from `references/audit-report-template.md`
3. Fill all sections with Phase 3 findings
4. Write the report to `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md`

> **Zero-Findings Guard:** If the audit produces fewer than 3 findings, you MUST complete the "Dimensions Covered" attestation section in the report before declaring a clean result. This proves cross-boundary coverage was not skipped.

---

## Feedback Loop

After the audit produces findings, choose the right workflow based on finding type and severity:

| Finding Type / Severity | Example | Workflow |
|---|---|---|
| **CRITICAL** | Hardcoded secret, SQL injection, data loss risk | `/bugfix` — immediate priority |
| **MAJOR / Structural** | Swallowed I/O errors, missing interfaces, pattern drift | `/bugfix` or `/refactor` |
| **MINOR / Small fix** | Missing operation log, function length > 50 lines | `/bugfix` or direct fix |
| **ENHANCEMENT** | Defense-in-depth, doc comment, type branding | `/workflow-solo` or backlog |
| **Missing capability** | New endpoint missing, missing auth check | `/workflow-solo` in a new conversation |

### Using Findings in Other Contexts
When starting a fix workflow in a new conversation, reference the persisted report:

> "Fix the critical and major issues in `docs/audits/review-findings-gatekeeper-2026-02-16-1430.md`"

The agent in the new context can read the file directly from the repo — no need to copy-paste findings.

---

## Completion Criteria
- [ ] Pre-Audit Checklist completed (rules scanned, priority understood, scope set)
- [ ] Reconnaissance completed (stack detected, codebase mapped, dimensions selected)
- [ ] All activated dimensions scanned by parallel subagents
- [ ] Automated verification suite executed (lint, tests, build, coverage)
- [ ] Findings synthesized, deduplicated, and severity-ranked
- [ ] Cross-dimension correlations identified and severity escalated
- [ ] Findings document saved to `docs/audits/` in the repo
- [ ] Remediation action plan documented
- [ ] `.agentwork/` directory cleaned up (`rm -rf .agentwork/`)
