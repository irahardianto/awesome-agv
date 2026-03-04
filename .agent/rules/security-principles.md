---
trigger: model_decision
description: When implementing authentication, authorization, input validation, cryptographic operations, or handling user input and sensitive data
version: 1.1.0
---

## Security Principles

### OWASP Top 10 Enforcement

- **Broken Access Control:** Deny by default. Validate permissions _server-side_ for every request. Do not rely on UI state.
- **Cryptographic Failures:** Use TLS 1.2+ everywhere. Encrypt PII/Secrets at rest. Use standard algorithms (AES-256, RSA-2048, Ed25519). _Never_ roll your own crypto.
- **Injection:** ZERO TOLERANCE for string concatenation in queries. Use Parameterized Queries (SQL) or ORM bindings. Sanitize all HTML/JS output.
- **SSRF Prevention:** Validate all user-provided URLs against an allowlist. Disable HTTP redirects in fetch clients. Block requests to internal IPs (metadata services, localhost).
- **Insecure Design:** Threat model every new feature. Fail securely (closed), not openly.
- **Vulnerable Components:** Pin dependency versions. Scan for CVEs in CI/CD (see DevSecOps below).

---

### Authentication & Authorization

- **Passwords:** Hash with Argon2id or Bcrypt (min cost 12). Never plain text.
- **Tokens:**
  - _Access Tokens:_ Short-lived (15-30 mins). HS256 or RS256.
  - _Refresh Tokens:_ Long-lived (7-30 days). Rotate on use. Store in `HttpOnly; Secure; SameSite=Strict` cookies.
- **Rate Limiting:** Enforce strictly on public endpoints (Login, Register, Password Reset). Standard: 5 attempts / 15 mins.
- **MFA:** Required for Admin and Sensitive Data access.
- **RBAC:** Map permissions to Roles, not Users. Check permissions at the Route AND Resource level.

---

### Input Validation & Sanitization

- **Principle:** "All Input is Evil until Proven Good."
- **Validation:** Validate against a strict Schema (Zod/Pydantic) at the _Controller/Port_ boundary.
- **Allowlist:** Check for "Good characters" (e.g., `^[a-zA-Z0-9]+$`), do not try to filter "Bad characters."
- **Sanitization:** Strip dangerous tags from rich text input using a proven library (e.g., DOMPurify equivalent).

---

### Logging & Monitoring (Security Focus)

- **Redaction:** SCRUB all PII, Secrets, Tokens, and Passwords from logs _before_ writing.
- **Events:** Log all _failed_ auth attempts, access denied events, and input validation failures.
- **Format:** JSON structured logs with `correlationId`, `user_id`, and `event_type`.
- **Anti-Tamper:** Logs should be write-only for the application.

---

### Secrets Management

**Never commit secrets to source control.** This is an absolute rule — no exceptions.

**Hierarchy of trust (use the highest level available):**

1. **Cloud-native secrets managers** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) — preferred for production
2. **HashiCorp Vault** — for multi-cloud or on-premise
3. **Kubernetes Secrets** (encrypted at rest) — acceptable for K8s workloads
4. **Environment variables** injected at runtime — acceptable for non-cloud
5. **`.env` files** — **local development only**, never mounted in production containers

**Rotation requirements:**

- All secrets must have a defined TTL and rotation schedule
- Application must handle secret rotation without restart (dynamic credentials via Vault leases or AWS Secrets Manager rotation)
- Detect and alert on secrets that are within 30 days of expiry

**Access:**

```
# ✅ Correct: read from secrets manager at startup
const dbPassword = await secretsManager.getSecretValue('prod/db/password');

# ❌ Wrong: hardcoded or in source
const dbPassword = "super_secret_password_123";
```

**Pre-commit protection:**

- Install `git-secrets` or `trufflehog` or `gitleaks` as pre-commit hooks
- Run automated secret scanning in CI/CD pipeline (fail the build on detection)
- If a secret is leaked: **rotate immediately** — history cannot be safely rewritten for public repos

---

### Security Headers

Every HTTP service response **MUST** include these headers:

```
# Transport security
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Content protection
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'

# Cache control (for authenticated responses)
Cache-Control: no-store

# Remove information-leaking headers
# Server: <suppress>
# X-Powered-By: <suppress>

# Correlation (always echo back)
X-Request-Id: {correlationId}
```

**CSP Principles:**

- Start with `default-src 'none'` and allowlist only what's needed
- Never use `unsafe-inline` or `unsafe-eval` in production
- Use CSP nonces for inline scripts when unavoidable

---

### Supply Chain & DevSecOps

**Dependency scanning in CI/CD (mandatory):**

```yaml
# Example: GitHub Actions security gate
- name: Audit dependencies
  run: npm audit --audit-level=high # Fail on HIGH+ CVEs

- name: Scan container image
  run: trivy image --severity HIGH,CRITICAL myapp:${{ github.sha }}

- name: Scan for secrets
  run: trufflehog git --since-commit HEAD~1
```

**SBOM (Software Bill of Materials):**

- Generate SBOM on every production build (`syft` for containers, `cyclonedx` for packages)
- Store SBOM as build artifact alongside the image
- Required for regulatory compliance (EO 14028) and incident response

**Image hardening:**

- Run containers as **non-root** user (UID > 1000)
- Use **read-only** root filesystem (`readOnlyRootFilesystem: true` in K8s)
- Set resource limits (CPU and memory) on all containers
- Use minimal base images (distroless, alpine scratch)
- Never run `--privileged` containers in production

---

### Zero-Trust Networking Principles

**Assume breach.** Every service-to-service call is treated as if it comes from an untrusted network.

**Rules:**

- All internal service-to-service communication uses **mTLS** (mutual TLS)
- No "internal network" exceptions — internal callers authenticate the same as external
- Services expose only the ports they need; all else is blocked by default
- Use **short-lived service tokens** (SPIFFE/SPIRE, Istio SVID) not long-lived API keys between services
- Implement **network policies** (Kubernetes NetworkPolicy) to restrict which services can communicate

---

### Security Checklist

- [ ] Passwords hashed with Argon2id or Bcrypt?
- [ ] Tokens are short-lived; refresh tokens rotate on use?
- [ ] Rate limiting on all auth endpoints?
- [ ] All queries use parameterized statements?
- [ ] Input validated with schema at boundary?
- [ ] Security headers set on all responses?
- [ ] CSP uses `default-src 'none'` baseline?
- [ ] Secrets stored in managed vault (not env files in prod)?
- [ ] Secret scanning configured in pre-commit and CI/CD?
- [ ] SBOM generated on every production build?
- [ ] Container runs as non-root with read-only filesystem?
- [ ] Internal services use mTLS?
- [ ] Network policies restrict inter-service communication?

---

### Related Principles

- Error Handling Principles @error-handling-principles.md
- API Design Principles @api-design-principles.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Configuration Management Principles @configuration-management-principles.md
