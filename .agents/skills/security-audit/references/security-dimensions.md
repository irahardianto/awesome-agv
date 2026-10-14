# Security Audit Dimensions

This file defines the 6 MECE security dimensions and the subagent system prompt template used by the `/security-audit` skill.

## Subagent System Prompt Template

Use this template when dispatching each dimension subagent via `invoke_subagent`:

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
Your scope: {paste the scope card for this dimension from below}

Stack context:
{paste reconnaissance findings from Phase 0}

Scan every file in the codebase relevant to your dimension. For each
finding, classify severity using the Severity Taxonomy in your role file
(CRITICAL / HIGH / MEDIUM / ENHANCEMENT).

When complete:
1. Write findings to .agentwork/findings-security-{dimension-key}.md
2. Message @coordinator (the main agent running this /security-audit skill): 'findings ready'

Do NOT fix issues. Do NOT review code quality outside your security
dimension. Produce findings with evidence and remediation guidance only.
```

## Findings Output Format

Each subagent writes findings using this format:

```markdown
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

---

## Dimension Scope Cards

Each subagent receives exactly one scope card.

### Dimension A: OWASP Code Patterns

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

### Dimension B: Authentication & Authorization

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

### Dimension C: Secrets & Configuration

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

### Dimension D: Supply Chain & Dependencies

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

### Dimension E: Data Protection & Privacy

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

### Dimension F: Infrastructure Hardening

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
