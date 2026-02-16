---
trigger: model_decision
description: When implementing error handling, working with error types, or designing error recovery strategies (validation errors, business rule violations, infrastructure failures, resource cleanup)
---

## Error Handling Principles

**1. Never Fail Silently:**

- All errors must be handled explicitly (no empty catch blocks)  
- If you catch an error, do something with it (log, return, transform, retry)

**2. Fail Fast:**

- Detect and report errors as early as possible  
- Validate at system boundaries before processing  
- Don't process invalid data hoping it'll work out

**3. Provide Context:**

- Include error codes, correlation IDs, actionable messages  
- Enough information for debugging without exposing sensitive details  
- Example: "Database query failed (correlation-id: abc-123)" not "SELECT * FROM users WHERE..."

**4. Separate Concerns:**

- Different handlers for different error types  
- Business errors ≠ technical errors ≠ security errors

**5. Resource Cleanup:**

- Always clean up in error scenarios (close files, release connections, unlock resources)  
- Use language-appropriate patterns (defer, finally, RAII, context managers)

**6. No Information Leakage:**

- Sanitize error messages for external consumption  
- Don't expose stack traces, SQL queries, file paths, internal structure to users  
- Log full details internally, show generic message externally

### Application Error Object (Internal/Log Format)
```
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "User-friendly error message",
  "correlationId": "uuid-for-tracking",
  "details": {
    "field": "email",
    "issue": "Invalid email format",
    "provided": "invalid-email",
    "expected": "valid email format (user@example.com)"
  }
}
```

### Error Handling Checklist

- [ ] Are all error paths explicitly handled (no empty catch blocks)?  
- [ ] Do errors include correlation IDs for debugging?  
- [ ] Are sensitive details sanitized before returning to client?  
- [ ] Are resources cleaned up in all error scenarios?  
- [ ] Are errors logged at appropriate levels (warn for 4xx, error for 5xx)?  
- [ ] Are error tests written (negative test cases)?  
- [ ] Is error handling consistent across application?

### Related Principles
- API Design Principles @api-design-principles.md - API Error Response Format section
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
- Testing Strategy @testing-strategy.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Concurrency and Threading Implementation Principles @concurrency-and-threading-principles.md
