---
trigger: model_decision
description: When implementing authentication, authorization, input validation, cryptographic operations, or handling user input and sensitive data
---

## Security Principles

### OWASP Top 10 Enforcement

* **Broken Access Control:** Deny by default. Validate permissions *server-side* for every request. Do not rely on UI state.  
* **Cryptographic Failures:** Use TLS 1.2+ everywhere. Encrypt PII/Secrets at rest. Use standard algorithms (AES-256, RSA-2048, Ed25519). *Never* roll your own crypto.  
* **Injection:** ZERO TOLERANCE for string concatenation in queries. Use Parameterized Queries (SQL) or ORM bindings. Sanitize all HTML/JS output.  
* **SSRF Prevention:** Validate all user-provided URLs against an allowlist. Disable HTTP redirects in fetch clients. Block requests to internal IPs (metadata services, localhost).  
* **Insecure Design:** Threat model every new feature. Fail securely (closed), not openly.  
* **Vulnerable Components:** Pin dependency versions. Scan for CVEs in CI/CD.

### Authentication & Authorization

* **Passwords:** Hash with Argon2id or Bcrypt (min cost 12). Never plain text.  
* **Tokens:**  
  * *Access Tokens:* Short-lived (15-30 mins). HS256 or RS256.  
  * *Refresh Tokens:* Long-lived (7-30 days). Rotate on use. Store in `HttpOnly; Secure; SameSite=Strict` cookies.  
* **Rate Limiting:** Enforce strictly on public endpoints (Login, Register, Password Reset). Standard: 5 attempts / 15 mins.  
* **MFA:** Required for Admin and Sensitive Data access.  
* **RBAC:** Map permissions to Roles, not Users. Check permissions at the Route AND Resource level.

### Input Validation & Sanitization

* **Principle:** "All Input is Evil until Proven Good."  
* **Validation:** Validate against a strict Schema (Zod/Pydantic) at the *Controller/Port* boundary.  
* **Allowlist:** Check for "Good characters" (e.g., `^[a-zA-Z0-9]+$`), do not try to filter "Bad characters."  
* **Sanitization:** Strip dangerous tags from rich text input using a proven library (e.g., DOMPurify equivalent).

### Logging & Monitoring (Security Focus)

* **Redaction:** SCRUB all PII, Secrets, Tokens, and Passwords from logs *before* writing.  
* **Events:** Log all *failed* auth attempts, access denied events, and input validation failures.  
* **Format:** JSON structured logs with `correlationId`, `user_id`, and `event_type`.  
* **Anti-Tamper:** Logs should be write-only for the application.

### Secrets Management

* **Storage:** Never commit secrets to git. Use `.env` (local) or Secret Managers (Prod - e.g., Vault/GSM).

### Related Principles
- Error Handling Principles @error-handling-principles.md
- API Design Principles @api-design-principles.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Configuration Management Principles @configuration-management-principles.md
- Command Execution Principles @command-execution-principles.md