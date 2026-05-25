---
name: api-documentation
description: >-
  OpenAPI 3.1 specification writing, request/response examples, error
  documentation, versioning, and interactive API portal patterns.
---

# API Documentation Principles

Guidelines for creating comprehensive, developer-friendly API documentation.

## When to Invoke
- Writing or updating OpenAPI/Swagger specs
- Documenting API endpoints, schemas, and errors
- Creating SDK documentation and integration guides
- API versioning and migration documentation

## OpenAPI Specification

### Structure
```yaml
openapi: 3.1.0
info:
  title: Task API
  version: 1.0.0
paths:
  /api/v1/tasks:
    post:
      summary: Create a task
      operationId: createTask
      tags: [Tasks]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskRequest'
            example:
              title: "Deploy fix"
              priority: "high"
      responses:
        '201':
          description: Task created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

### Principles
1. **Every endpoint has `operationId`** — used for SDK generation.
2. **Every endpoint has examples** — request and response.
3. **Reusable components** — `$ref` for schemas, responses, parameters.
4. **Error responses documented** — every possible error code with description.

## Error Documentation

### Standard Error Format
```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'abc123' not found",
    "details": [
      { "field": "id", "issue": "No task exists with this ID" }
    ]
  }
}
```

### Error Code Catalog
Document every error code with:
- **Code** — machine-readable identifier
- **HTTP Status** — corresponding status code
- **Description** — what caused the error
- **Resolution** — how to fix it

## Versioning Documentation

1. **Changelog** — every API version change documented.
2. **Migration guides** — step-by-step upgrade instructions.
3. **Deprecation notices** — minimum 6 months warning.
4. **Breaking changes** — clearly marked with migration path.

## Documentation Checklist
- [ ] All endpoints documented with summaries and descriptions
- [ ] Request/response schemas with examples
- [ ] Authentication documented (how to obtain and use credentials)
- [ ] Error responses with codes and resolution steps
- [ ] Rate limiting documented (limits, headers, retry strategy)
- [ ] Pagination documented (cursor vs offset, parameters)
- [ ] Versioning strategy documented

## Related
- API Design Principles @.agents/rules/api-design-principles.md
- Documentation Principles .agents/rules/documentation-principles.md
