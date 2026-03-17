---
trigger: always_on
---

## Security Mandate

**Security is a foundational requirement, not a feature.**

### Universal Security Principles

1. **Never trust user input:** All data from users, APIs, or external sources must be validated server-side
2. **Deny by default:** Require explicit permission grants, never assume access
3. **Fail securely:** When errors occur, fail closed (deny access) rather than open
4. **Defense in depth:** Multiple layers of security, never rely on a single control

**When implementing security-sensitive features (auth, validation, queries), see Security Principles @security-principles.md for detailed implementation guidance.**

### Related Principles
- Security Principles @security-principles.md