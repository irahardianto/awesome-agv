---
trigger: model_decision
description: When executing external commands, shell scripts, or system processes
---

## Command Execution Principles

### Security

**Never execute user input directly:**

- ❌ `exec(userInput)`  
- ❌ `shell("rm " + userFile)`  
- ✅ Use argument lists, not shell string concatenation  
- ✅ Validate and sanitize all arguments

**Run with minimum permissions:**

- Never run commands as root/admin without explicit human approval. If elevated permissions are absolutely required, STOP and request authorization.
- Use least-privilege service accounts

### Portability

**Use language standard library:**

- Avoid shell commands when standard library provides functionality  
- Example: Use file I/O APIs instead of `cat`, `cp`, `mv`

**Test on all target OS:**

- Windows, Linux, macOS have different commands and behaviors  
- Use path joining functions (don't concatenate with /)

### Error Handling

**Check exit codes:**

- Non-zero exit code = failure  
- Capture and log stderr  
- Set timeouts for long-running commands  
- Handle "command not found" gracefully

### Command Execution Checklist

- [ ] Is user input sanitized/validated before use in commands?
- [ ] Are arguments passed as lists (not shell string concatenation)?
- [ ] Are commands running with minimum necessary permissions?
- [ ] Are exit codes checked and errors handled?
- [ ] Are timeouts set for long-running commands?
- [ ] Is stderr captured and logged?

### Related Principles
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md