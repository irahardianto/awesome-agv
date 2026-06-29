---
description: Security-focused audit workflow — multi-dimensional vulnerability assessment with parallel subagents
---

# Security Audit Workflow

## Purpose
Deep, multi-dimensional security audit of existing code. Dispatches parallel `@security-engineer` subagents across orthogonal security dimensions to achieve comprehensive coverage that a single-pass review cannot match. This workflow does not write fixes — it identifies vulnerabilities for subsequent fix workflows.

## When to Use
- Dedicated security review before a release or deployment
- After introducing auth, payments, or other security-sensitive features
- Periodic security health check on the codebase
- Compliance or regulatory audit preparation
- When the generic `/audit` workflow's security section (4 bullet points) is insufficient

## When NOT to Use
- General code quality review (use `/audit`)
- Writing security features (use `/workflow-solo` or `/workflow-team` Template E)
- Fixing known vulnerabilities (use `/bugfix`)
- Incident response (use `/workflow-team` Template I)

## Prerequisite Skills
Before starting, read:
- `.agents/agents/security-engineer.md` — the agent role file you will dispatch as subagents
- `.agents/rules/security-principles.md` — OWASP Top 10 enforcement criteria
- `.agents/rules/security-mandate.md` — universal security philosophy
- `.agents/rules/rugged-software-constitution.md` — defensive coding constitution

---

## Phases

### Phase 0: Reconnaissance
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

Before dispatching subagents, you MUST understand the attack surface.

#### 0.1 — Stack Detection
Identify the project's technology stack:
- **Languages:** Scan for `go.mod`, `package.json`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `*.csproj`, `Gemfile`, `composer.json`
- **Frameworks:** Identify HTTP frameworks, ORMs, auth libraries
- **Infrastructure:** Check for `Dockerfile`, `docker-compose.yml`, Kubernetes manifests, Terraform/Pulumi files

#### 0.2 — Attack Surface Inventory
Map the security-relevant components:
- [ ] API endpoints (list routes + HTTP methods)
- [ ] Authentication mechanism (JWT, session, OAuth, API keys)
- [ ] Database access patterns (ORM, raw queries, migration files)
- [ ] External service integrations (HTTP clients, message queues)
- [ ] File upload/download handlers
- [ ] User input entry points (forms, query params, headers, body)
- [ ] Secrets and configuration sources (.env, config files, env vars)
- [ ] Dependencies (count, lock file presence, last audit date)

#### 0.3 — Dimension Selection

| Dimension | Scope | Activate When |
|---|---|---|
| **A. OWASP Code Patterns** | Injection, XSS, SSRF, insecure deserialization, broken access control | Always |
| **B. Authentication & Authorization** | Auth flows, token management, RBAC, session handling, rate limiting | Project has authentication |
| **C. Secrets & Configuration** | Hardcoded secrets, env var hygiene, config validation, startup fail-fast | Always |
| **D. Supply Chain & Dependencies** | CVE scanning, license compliance, lock files, dependency pinning | Always |
| **E. Data Protection & Privacy** | PII handling, encryption at rest/transit, log redaction, data retention | Project handles user data |
| **F. Infrastructure Hardening** | Security headers, CORS, TLS, rate limiting, CSP, cookie attributes | Project has HTTP server |

At the start of this phase you MUST state:
> "Activating dimensions: A, B, C, D, E, F. Skipping none."

or:
> "Activating dimensions: A, C, D. Skipping B (no auth), E (no user data), F (CLI tool, no HTTP server)."

---

### Phase 1: Multi-Dimensional Security Scan
**Set Mode:** Continue in **PLANNING**

Dispatch parallel `@security-engineer` subagents — one per activated dimension. Each subagent operates independently with no cross-talk, following the AAD (All-Agents Drafting) protocol from `/workflow-team`.

#### Dispatch Protocol

Use `invoke_subagent` to spawn all activated dimension agents in a **single call** (AAD — All-Agents Drafting: parallel, no cross-talk).

**invoke_subagent fields per dimension:**
- **TypeName:** `security-engineer`
- **Role:** `Security Auditor — Dimension {KEY}` (e.g., `Security Auditor — Dimension A`)
- **Workspace:** `inherit` (read-only agents share the main workspace; no branch needed)
- **Prompt:** Use the system prompt template below, filled with dimension-specific scope card

Each agent receives in its prompt:

1. **Role file reference** — `file:///{workspace}/.agents/agents/security-engineer.md` (agent reads this FIRST)
2. **Dimension scope** — the specific MECE slice of the security surface
3. **Reconnaissance context** — stack detection and attack surface inventory from Phase 0
4. **Output target** — scope-qualified findings file

**System prompt template for each subagent:**

```
Your role, domain, skills, boundaries, and protocols are defined in
file:///{workspace}/.agents/agents/security-engineer.md.
Read this file FIRST before beginning any work.

Your workspace is: {workspace}

SECURITY AUDIT CONTEXT: You are operating as one of N parallel security
auditors, each covering a MECE dimension of the security surface. Your
dimension is scoped below. Stay strictly within your dimension — other
agents cover the remaining dimensions.

Your dimension: {DIMENSION NAME}
Your scope: {specific scope description from the dimension table below}

Stack context:
{paste reconnaissance findings from Phase 0}

Scan every file in the codebase relevant to your dimension. For each
finding, classify severity using the Severity Taxonomy in your role file
(CRITICAL / HIGH / MEDIUM / ENHANCEMENT).

When complete:
1. Write findings to .agentwork/findings-security-{dimension-key}.md
2. Message @coordinator (the main agent running this /security-audit workflow): 'findings ready'

Do NOT fix issues. Do NOT review code quality outside your security
dimension. Produce findings with evidence and remediation guidance only.

Use this output format for your findings file:

# Security Findings: Dimension {KEY} — {Dimension Name}
Date: {date}
Scope: {one-line scope description}

## Findings

### [{SEVERITY}-{NNN}] {Title}
- **File:** [{file}:{line}](file:///path)
- **Severity:** CRITICAL / HIGH / MEDIUM / ENHANCEMENT
- **Vulnerability:** {what the issue is}
- **Evidence:** {code snippet or grep output demonstrating the issue}
- **Impact:** {what an attacker could do}
- **Remediation:** {specific fix guidance with code example if applicable}

(Repeat for each finding)

## Summary
- Total findings: {N}
- CRITICAL: {N}, HIGH: {N}, MEDIUM: {N}, ENHANCEMENT: {N}
- Files examined: {N}
- Key areas scanned: {list}
```

#### Dimension Scope Definitions

Each subagent receives exactly one of these scope cards:

##### Dimension A: OWASP Code Patterns
```
Scope: Code-level vulnerability patterns from the OWASP Top 10.
Scan for:
- SQL/NoSQL injection via string concatenation or interpolation
- Cross-site scripting (XSS) in templated/rendered output
- Server-side request forgery (SSRF) — user-controlled URLs in fetch/HTTP clients
- Insecure deserialization from untrusted sources
- Broken access control — missing permission checks on endpoints
- Command injection — unsanitized input in shell/process execution
- Path traversal — user input in file system paths without canonicalization
- Insecure direct object references (IDOR) — sequential/guessable resource IDs
Load: code-review skill (language anti-pattern file for detected language)
Output: .agentwork/findings-security-owasp.md
```

##### Dimension B: Authentication & Authorization
```
Scope: Auth flow correctness and authorization model integrity.
Scan for:
- Auth bypass vectors — endpoints missing auth middleware
- Token management — expiration, rotation, storage (HttpOnly/Secure/SameSite)
- Password handling — hashing algorithm (Argon2id/Bcrypt required), salt, cost factor
- Session management — fixation, hijacking, invalidation on logout
- RBAC/permission model — checks at both route AND resource level
- Rate limiting — presence on login, register, password reset endpoints
- MFA implementation — required for admin and sensitive operations
- OAuth/OIDC flows — state parameter, nonce, redirect URI validation
- CSRF protection — token validation on state-changing endpoints (cross-ref: also checked from HTTP layer in Dimension F)
Load: security-principles.md § Authentication & Authorization
Output: .agentwork/findings-security-auth.md
```

##### Dimension C: Secrets & Configuration
```
Scope: Secrets hygiene and configuration security.
Scan for:
- Hardcoded secrets, API keys, passwords, tokens in source code
- Secrets in version control history (git log/blame on config files)
- .env.template completeness — every env var referenced in code is documented
- Startup validation — app fails fast on missing required config (no silent defaults)
- Secrets in logs — debug/error messages that could expose credentials
- Default credentials — unchanged default passwords or API keys
- Config injection — user input reaching configuration values
Load: configuration-management-principles.md
Output: .agentwork/findings-security-secrets.md
```

##### Dimension D: Supply Chain & Dependencies
```
Scope: Dependency security, license compliance, and supply chain integrity.
Scan for:
- Known CVEs — review existing audit reports if present; inspect dependency manifests for
  known-vulnerable version ranges (automated CVE scanning runs in Phase 2, cross-reference results there)
- License compliance — flag GPL/AGPL/no-license dependencies
- Lock file presence — package-lock.json, go.sum, Cargo.lock committed and up-to-date
- Dependency pinning — no floating version ranges in production (^, ~, *, latest)
- Unused dependencies — increase attack surface without value
- Dependency review — new/unfamiliar packages (low downloads, unmaintained, recently transferred)
- Typosquatting risk — package names suspiciously similar to popular packages
Load: supply-chain-security skill
Output: .agentwork/findings-security-supply-chain.md
```

##### Dimension E: Data Protection & Privacy
```
Scope: PII handling, encryption, and data privacy.
Scan for:
- PII in logs — user emails, names, IPs, or other identifiable data written to logs
- Encryption at rest — sensitive data stored in plaintext (database fields, files)
- Encryption in transit — TLS configuration, certificate validation
- Log redaction — presence of scrubbing middleware/filters for PII
- Data retention — unbounded storage of sensitive data without cleanup
- Error response leakage — internal state, stack traces, or PII in error responses
- Backup security — database dumps or exports without encryption
- Data minimization — collecting more user data than necessary
Load: logging-implementation skill (see §4 Security under Logging Standards)
Output: .agentwork/findings-security-data-protection.md
```

##### Dimension F: Infrastructure Hardening
```
Scope: HTTP security controls and runtime hardening.
Scan for:
- Security headers — CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
- CORS configuration — overly permissive origins, credentials handling
- Cookie attributes — HttpOnly, Secure, SameSite on auth cookies
- TLS configuration — minimum version (TLS 1.2+), weak cipher suites
- Rate limiting — global and per-endpoint limits on non-auth routes
- Request size limits — unbounded body/upload size (DoS risk)
- CSRF protection — HTTP-level token/header validation (cross-ref Dimension B for auth-level checks)
- Error pages — custom error pages that don't leak server info (version, framework, stack traces)
- Timeout configuration — connection, read, write timeouts on both server and outbound clients
Load: security-principles.md § OWASP Top 10 Enforcement
Output: .agentwork/findings-security-infra.md
```

---

### Phase 2: Automated Security Tooling
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

> **Sequencing:** Run Phase 2 **after** all Phase 1 subagents have reported back (`findings ready`). Phase 2 is sequential — run tools yourself as the coordinator. Do not wait for Phase 2 to finish before reading Phase 1 findings; both feed Phase 3 independently.

Run automated security tools appropriate to the detected stack. Write results to `.agentwork/findings-security-tooling.md` using this format:

```markdown
# Automated Security Tooling Results

## {Tool Name} v{version}
- **Command:** {exact command run}
- **Result:** PASS / FAIL / ERROR
- **Findings:** {N} issues
  - CRITICAL: {N} — {one-line descriptions}
  - HIGH: {N}
  - ...
- **Raw output excerpt:** (relevant lines only, not full output)
```

#### Language-Specific Security Scanners

| Language | CVE Scanner | Static Analysis | Command |
|---|---|---|---|
| Go | `govulncheck` | `staticcheck`, `gosec` | `govulncheck ./...` |
| Rust | `cargo audit` | `cargo clippy -- -D warnings` | `cargo audit` |
| Node.js | `npm audit` | ESLint security plugin | `npm audit --json` |
| Python | `pip-audit` | `bandit` | `pip-audit && bandit -r .` |
| Java | OWASP Dependency-Check | SpotBugs + Find Security Bugs | `mvn dependency-check:check` |
| .NET | Built-in | Roslyn analyzers | `dotnet list package --vulnerable` |
| Ruby | `bundle audit` | `brakeman` | `bundle audit check --update` |
| PHP | `composer audit` | `phpstan` | `composer audit` |

#### Universal Checks
Regardless of language, run:
1. **Secret scanning** — `grep -rn` for patterns: API keys, passwords, tokens, private keys
2. **Lock file verification** — confirm lock files exist and are committed
3. **Git history scan** — check for accidentally committed secrets (search for reverted .env files, key patterns in `git log -p`)

---

### Phase 3: Synthesis & Prioritization

After all subagents complete and automated tooling finishes:

#### 3.1 — Collect Findings
Read all findings files produced by Phase 1 and Phase 2:
- `.agentwork/findings-security-*.md` — one file per activated dimension (from Phase 1 subagents)
- `.agentwork/findings-security-tooling.md` — automated scanner output (from Phase 2)

#### 3.2 — Deduplicate
Identify findings reported by multiple dimensions (same root cause, different perspective). Consolidate into a single finding, noting which dimensions flagged it.

#### 3.3 — Severity Ranking (Adopted from Sentinel Analysis)
Force-rank all findings using the severity taxonomy:

| Severity | Definition | Gate Impact |
|---|---|---|
| **CRITICAL** | Actively exploitable vulnerability. Immediate fix required. | Blocks release |
| **HIGH** | Exploitable with effort or under specific conditions. Fix before release. | Should block release |
| **MEDIUM** | Weakness that increases attack surface. Fix in near term. | Track for remediation |
| **ENHANCEMENT** | Defense-in-depth improvement. No active vulnerability. | Backlog |

#### 3.4 — Cross-Dimension Correlation
Look for patterns that span dimensions:
- A secret hardcoded (Dimension C) that is also logged (Dimension E) → escalate to CRITICAL
- Missing auth on endpoint (Dimension B) combined with SQL injection (Dimension A) → escalate both
- Dependency CVE (Dimension D) in a library used for auth (Dimension B) → cross-reference severity

> **Severity escalation rule:** When findings from 2+ dimensions converge on the same attack vector, escalate the combined severity by one level (MEDIUM → HIGH, HIGH → CRITICAL).

---

### Phase 4: Security Audit Report

**Output location:** `docs/audits/security-audit-{scope}-{YYYY-MM-DD}-{HHmm}.md`

You MUST save the report to the repo (not just as a conversation artifact) so it can be:
- Referenced from other conversations/agents
- Tracked in version control
- Passed as context to fix workflows

**Steps:**
1. Create the `docs/audits/` directory if it doesn't exist
2. Write the security audit report to the path above
3. Use the template below

> **Zero-Findings Guard:** If the audit produces fewer than 3 findings, you MUST complete the "Dimensions Covered" attestation section before declaring a clean result. This proves comprehensive coverage was not skipped.

```markdown
# Security Audit: {Scope/Module Name}
Date: {date}
Auditor: AI Security Audit (multi-dimensional, {N} parallel subagents)

## Executive Summary
- **Dimensions activated:** {list, e.g., A, B, C, D, E, F}
- **Dimensions skipped:** {list with reasons, e.g., "B (no auth)"}
- **Files scanned:** {N}
- **Findings:** {N total} ({X} critical, {Y} high, {Z} medium, {W} enhancement)
- **Automated tools run:** {list tools and versions}
- **Overall risk assessment:** CRITICAL / HIGH / MODERATE / LOW (note: this is the overall project risk, not an individual finding severity)

## Critical Findings
Issues that are actively exploitable. Must be fixed immediately.
- [ ] **[CRIT-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {what the issue is}
  - **Impact:** {what an attacker could do}
  - **Evidence:** {code snippet, grep output, or tool result}
  - **Remediation:** {specific fix guidance}
  - **Fix workflow:** `/bugfix` — critical priority

## High Findings
Exploitable with effort. Must be fixed before release.
- [ ] **[HIGH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {description}
  - **Impact:** {description}
  - **Evidence:** {evidence}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix` or `/workflow-solo`

## Medium Findings
Weaknesses that increase attack surface. Fix in near term.
- [ ] **[MED-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Vulnerability:** {description}
  - **Remediation:** {guidance}
  - **Fix workflow:** `/bugfix`

## Enhancement Findings
Defense-in-depth improvements. No active vulnerability.
- [ ] **[ENH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Suggestion:** {description}
  - **Fix workflow:** `/workflow-solo` or backlog

## Automated Tooling Results
| Tool | Version | Result | Findings |
|---|---|---|---|
| {tool name} | {version} | PASS/FAIL | {N} issues ({breakdown}) |

## Cross-Dimension Correlations
Findings that span multiple dimensions, with escalated severity.
- {description of correlated findings and why severity was escalated}

## Dimensions Covered
<!-- Required when total findings < 3 -->
| Dimension | Status | Files / Queries Examined |
|---|---|---|
| A. OWASP Code Patterns | ✅ Checked / ⏭ Skipped (reason) | e.g., scanned all 42 handler files for injection patterns |
| B. Authentication & Authorization | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed auth middleware, 12 protected endpoints |
| C. Secrets & Configuration | ✅ Checked | e.g., grep for key patterns, reviewed .env.template |
| D. Supply Chain & Dependencies | ✅ Checked | e.g., ran npm audit, reviewed 87 dependencies |
| E. Data Protection & Privacy | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed logging middleware, error handlers |
| F. Infrastructure Hardening | ✅ Checked / ⏭ Skipped (reason) | e.g., reviewed CORS config, security headers middleware |

## Remediation Priority Order
Findings ranked by fix priority. Fix in this order.
1. **[CRIT-001]** — {one-line summary} → `/bugfix`
2. **[CRIT-002]** — {one-line summary} → `/bugfix`
3. **[HIGH-001]** — {one-line summary} → `/bugfix`
4. ...
```

---

## Feedback Loop

After the security audit produces findings, choose the right workflow based on finding severity:

| Finding Severity | Example | Workflow |
|---|---|---|
| **CRITICAL** | SQL injection in user query handler | `/bugfix` — immediate, critical priority |
| **HIGH** | Missing CSRF protection on state-changing endpoints | `/bugfix` or `/workflow-solo` — pre-release priority |
| **MEDIUM** | Error messages exposing internal stack traces | `/bugfix` — near-term fix |
| **ENHANCEMENT** | Add CSP headers, improve rate limiting | `/workflow-solo` — backlog priority |
| **Structural** | Auth model needs redesign, missing middleware layer | `/refactor` or `/workflow-team` Template E |

### Using Findings in Other Contexts
When starting a fix workflow in a new conversation, reference the persisted report:

> "Fix the critical findings in `docs/audits/security-audit-backend-2026-06-29-1430.md`"

The agent in the new context can read the file directly from the repo — no need to copy-paste findings.

---

## Completion Criteria
- [ ] Reconnaissance completed (stack detected, attack surface mapped)
- [ ] All activated dimensions scanned by parallel subagents
- [ ] Automated security tools run for detected stack
- [ ] Findings synthesized, deduplicated, and severity-ranked
- [ ] Cross-dimension correlations identified
- [ ] Security audit report saved to `docs/audits/` in the repo
- [ ] Remediation priority order documented
- [ ] `.agentwork/` directory cleaned up (`rm -rf .agentwork/`)
