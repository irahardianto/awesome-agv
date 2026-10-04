---
name: security-audit
description: >-
  Runs a security-focused audit and multi-dimensional vulnerability assessment with parallel subagents. User-invoked entry point via /security-audit; not for autonomous or subagent use.
disable-model-invocation: true
---

# Security Audit Skill

> **Entry-point guard:** This is a user-invoked command skill (`/security-audit`). If you are a spawned subagent, do NOT execute this skill — return to your assigned scope card.

## Purpose
Deep, multi-dimensional security audit of existing code. Dispatches parallel subagents across orthogonal security dimensions for comprehensive coverage. This skill identifies vulnerabilities — it does not write fixes.

## When to Use
- Security review before release or deployment
- After introducing auth, payments, or security-sensitive features
- Periodic security health check
- Compliance or regulatory audit preparation

## When NOT to Use
- General code quality review → `/audit`
- Writing security features → `/workflow-solo` or `/workflow-team`
- Fixing known vulnerabilities → `/bugfix`

## References
`references/security-dimensions.md` and `references/security-audit-report-template.md` — contains dimension scope cards, subagent prompt template, and report template.

---

## Phase 0: Reconnaissance

Before dispatching subagents, understand the attack surface.

### 0.1 — Stack Detection
Scan for language/framework/infrastructure markers:
- **Languages:** `go.mod`, `package.json`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `*.csproj`, `Gemfile`, `composer.json`
- **Frameworks:** HTTP frameworks, ORMs, auth libraries
- **Infrastructure:** `Dockerfile`, `docker-compose.yml`, Kubernetes manifests, Terraform/Pulumi

### 0.2 — Attack Surface Inventory
Map security-relevant components:
- [ ] API endpoints (routes + HTTP methods)
- [ ] Authentication mechanism (JWT, session, OAuth, API keys)
- [ ] Database access patterns (ORM, raw queries, migrations)
- [ ] External service integrations (HTTP clients, message queues)
- [ ] File upload/download handlers
- [ ] User input entry points (forms, query params, headers, body)
- [ ] Secrets and configuration sources (.env, config files, env vars)
- [ ] Dependencies (count, lock file presence, last audit date)

### 0.3 — Dimension Selection

| Dim | Scope | Activate When |
|---|---|---|
| **A** | OWASP Code Patterns | Always |
| **B** | Authentication & Authorization | Project has authentication |
| **C** | Secrets & Configuration | Always |
| **D** | Supply Chain & Dependencies | Always |
| **E** | Data Protection & Privacy | Project handles user data |
| **F** | Infrastructure Hardening | Project has HTTP server |

State your selection:
> "Activating dimensions: A, C, D. Skipping B (no auth), E (no user data), F (no HTTP server)."

---

## Phase 1: Multi-Dimensional Security Scan

Dispatch parallel subagents — one per activated dimension. Each operates independently with no cross-talk.

### Dispatch Protocol

Use `invoke_subagent` to spawn all activated dimension agents in a **single call**.

**Per-dimension fields:**
- **TypeName:** `self` (universal spawn mechanism — ensures subagents inherit full toolsets per `agent-protocols` §3)
- **Role:** `Security Auditor — Dimension {KEY}` (e.g., `Security Auditor — Dimension A`)
- **Workspace:** `inherit`
- **Prompt:** Build from the system prompt template in `references/security-dimensions.md`. Fill in: dimension name, scope card, and reconnaissance context from Phase 0.

Each subagent receives in its prompt:
1. **Role file reference** — `.agents/agents/security-engineer.md` (agent reads FIRST)
2. **Dimension scope card** — from `references/security-dimensions.md`
3. **Reconnaissance context** — stack + attack surface from Phase 0
4. **Output target** — `.agentwork/findings-security-{dimension-key}.md`

When all subagents message `findings ready`, proceed to Phase 2.

---

## Phase 2: Automated Security Tooling

> Run **after** all Phase 1 subagents report back. Run tools yourself as coordinator.

### Language-Specific Scanners
Load the `supply-chain-security` skill for the CVE scanner table. Run the appropriate scanner for the detected stack.

### Universal Checks
Regardless of language:
1. **Secret scanning** — `grep -rn` for API keys, passwords, tokens, private keys
2. **Lock file verification** — confirm lock files exist and are committed
3. **Git history scan** — check for accidentally committed secrets (`git log -p` for .env, key patterns)

### Output Format
Write results to `.agentwork/findings-security-tooling.md`:

```markdown
## {Tool Name} v{version}
- **Command:** {exact command}
- **Result:** PASS / FAIL / ERROR
- **Findings:** {N} (CRITICAL: {N}, HIGH: {N}, MEDIUM: {N})
- **Excerpt:** (relevant lines only)
```

---

## Phase 3: Synthesis & Prioritization

### 3.1 — Collect
Read all `.agentwork/findings-security-*.md` files from Phase 1 and Phase 2.

### 3.2 — Deduplicate
Consolidate findings reported by multiple dimensions (same root cause). Note which dimensions flagged each.

### 3.3 — Severity Ranking
Force-rank using the Severity Taxonomy from `.agents/agents/security-engineer.md`:
- **CRITICAL** — actively exploitable, blocks release
- **HIGH** — exploitable with effort, fix before release
- **MEDIUM** — increases attack surface, fix near term
- **ENHANCEMENT** — defense-in-depth, backlog

### 3.4 — Cross-Dimension Correlation
When findings from 2+ dimensions converge on the same attack vector, **escalate severity by one level** (MEDIUM → HIGH, HIGH → CRITICAL):
- Hardcoded secret (C) + logged in output (E) → escalate to CRITICAL
- Missing auth on endpoint (B) + SQL injection (A) → escalate both
- Dependency CVE (D) in auth library (B) → cross-reference severity

---

## Phase 4: Security Audit Report

**Output:** `docs/audits/security-audit-{scope}-{YYYY-MM-DD}-{HHmm}.md`

Save to repo (not just conversation artifact) for version control and cross-conversation reference.

1. Create `docs/audits/` if it doesn't exist
2. Read the report template from `references/security-audit-report-template.md`
3. Fill all sections with Phase 3 findings

> **Zero-Findings Guard:** If fewer than 3 findings, you MUST complete the "Dimensions Covered" attestation section to prove comprehensive coverage was not skipped.

---

## Feedback Loop

| Severity | Workflow |
|---|---|
| **CRITICAL** | `/bugfix` — immediate, critical priority |
| **HIGH** | `/bugfix` or `/workflow-solo` — pre-release |
| **MEDIUM** | `/bugfix` — near-term |
| **ENHANCEMENT** | `/workflow-solo` — backlog |
| **Structural** (auth redesign, missing middleware layer) | `/refactor` or `/workflow-team` |

Reference persisted reports in new conversations:
> "Fix the critical findings in `docs/audits/security-audit-backend-2026-06-29-1430.md`"

---

## Completion Criteria
- [ ] Reconnaissance completed (stack detected, attack surface mapped)
- [ ] All activated dimensions scanned by parallel subagents
- [ ] Automated security tools run for detected stack
- [ ] Findings synthesized, deduplicated, and severity-ranked
- [ ] Cross-dimension correlations identified
- [ ] Security audit report saved to `docs/audits/`
- [ ] Remediation priority order documented
- [ ] `.agentwork/` directory cleaned up (`rm -rf .agentwork/`)
