---
trigger: model_decision
description: When managing project dependencies, configuring package files, or organizing module imports
---

## Dependency Management Principles

### Version Pinning

**Production:** Pin exact versions (1.2.3, not ^1.2.0)

- Prevents supply chain attacks  
- Prevents unexpected breakage from patch updates  
- Ensures reproducible builds

**Use lock files:**

- package-lock.json (Node.js)  
- Cargo.lock (Rust)  
- go.sum (Go)  
- requirements.txt (Python)

### Minimize Dependencies

**Every dependency is a liability:**

- Potential security vulnerability  
- Increased build time and artifact size  
- Maintenance burden (updates, compatibility)

**Ask before adding dependency:**

- "Can I implement this in 50 lines?"  
- "Is this functionality critical?"  
- "Is this dependency actively maintained?"  
- "Is this the latest stable version?"

### Organize Imports

**Grouping:**

1. Standard library  
2. External dependencies  
3. Internal modules

**Sorting:** Alphabetical within groups

**Cleanup:** Remove unused imports (use linter/formatter)

### Dependency Management Checklist

- [ ] Are production dependencies pinned to exact versions?
- [ ] Is the lock file committed to version control?
- [ ] Can each dependency be justified (not implementable in <50 lines)?
- [ ] Are all dependencies actively maintained and on latest stable versions?
- [ ] Are imports organized by group (stdlib → external → internal)?
- [ ] Are unused imports removed?

### Related Principles
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md