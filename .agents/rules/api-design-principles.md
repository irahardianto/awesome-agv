---
trigger: model_decision
description: When implementing REST/HTTP APIs (endpoints, handlers, middleware, or response formatting)
---

## API Design Principles

### RESTful API Standards

**Resource-Based URLs:**

- Use plural nouns for resources: `/api/{version}/users`, `/api/{version}/orders`  
- Hierarchical relationships: `/api/{version}/users/:userId/orders`  
- Avoid verbs in URLs: `/api/{version}/getUser` ❌ → `/api/{version}/users/:id` ✅

**HTTP Methods:**

- GET: Read/retrieve resource (safe, idempotent, cacheable)  
- POST: Create new resource (not idempotent)  
- PUT: Replace entire resource (idempotent)  
- PATCH: Partial update (idempotent)  
- DELETE: Remove resource (idempotent)

**Versioning:**

- URL path versioning: `/api/{version}/users` e.g.`/api/v1/users` (explicit, clear)

**Pagination:**

- Limit results per page (default 20, max 100)  
- Cursor-based: `?cursor=abc123` (better for real-time data)  
- Offset-based: `?page=2&limit=20` (simpler, less accurate for changing data)

**Filtering and Sorting:**

- Filtering: `?status=active&role=admin`  
- Sorting: `?sort=created_at:desc,name:asc`  
- Searching: `?q=search+term`

### HTTP Status Codes and Error Categories

**Success Codes:**
- 200 OK: Success (GET, PUT, PATCH)
- 201 Created: Resource created successfully (POST)
- 204 No Content: Success with no response body (DELETE)

**Client Error Codes (4xx) - User Can Fix:**

**Validation Errors (400 Bad Request):**
- User input doesn't meet requirements
- Examples: Invalid email, password too short, required field missing
- Response: Detailed field-level errors
- User action: Correct input and retry

**Authentication Errors (401 Unauthorized):**
- Identity verification failed
- Examples: Invalid credentials, expired token, missing token
- User action: Provide valid credentials

**Authorization Errors (403 Forbidden):**
- Permission denied (user identified but lacks permission)
- User action: Contact admin for permission

**Not Found Errors (404 Not Found):**
- Resource doesn't exist or user lacks permission to know it exists
- User action: None (doesn't exist)

**Business Rule Violations (409 Conflict / 422 Unprocessable Entity):**
- Domain rule violations
- Examples: Insufficient balance, duplicate email, order already shipped
- Response: Business rule explanation
- User action: Depends on business context

**Rate Limiting (429 Too Many Requests):**
- Too many requests in time window
- User action: Wait and retry

**Server Error Codes (5xx) - System Issue:**

**Infrastructure Errors (500/502/503):**
- Database down, network timeout, external service failure
- Response: Generic message with correlation ID
- User action: None (system issue, retry later)

### API Success Response Format
```
{
  "data": { /* resource or array of resources */ },
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2",
    "prev": null
  }
}
```

### API Error Response Format

All API errors must follow a consistent envelope structure, matching the success format where possible or using a standard error envelope.
```
{
  "status": "error",                      // Transport: Always "error" or "fail"
  "code": 400,                            // Transport: Redundant HTTP Status
  "error": {                              // Domain: The actual business problem
    "code": "VALIDATION_ERROR",           // Machine-readable business code (UPPER_SNAKE)
    "message": "Invalid email format",    // Human-readable message
    "details": {                          // Optional: Structured context
      "field": "email",
      "reason": "Must be a valid address"
    },
  "correlationId": "req-1234567890",      // Ops: Traceability
  "doc_url": "https://..."                // Optional: Help link
  }
}
```

### Related Principles
- Error Handling Principles @error-handling-principles.md
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Data Serialization and Interchange Principles @data-serialization-and-interchange-principles.md