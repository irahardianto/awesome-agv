---
trigger: model_decision
description: When working on a Go backend project, setting up Go project structure, or organizing Go services and APIs
---

## Go Backend Layout

Use this structure for Go backend applications. The vertical slice principle applies — features are packages, not layers.

```
  apps/
    backend/                          # Backend application source code
      cmd/
        api/
          main.go                     # Entry point: Wires dependencies, router, starts server
      internal/                       # Private application code
        platform/                     # Foundational technical concerns (The "Framework")
          database/                   # DB connection logic
          server/                     # HTTP server setup (Router, Middleware)
          logger/                     # Structured logging setup
        features/                     # Business Features (Vertical Slices)
          task/                       # Task management
            # --- Interface Definition ---
            service.go                # The public API of this feature (Service struct)

            # --- Delivery (HTTP) ---
            handler.go                # HTTP Handlers
            handler_test.go           # Component tests (httptest + mock service)

            # --- Domain (Business Logic) ---
            logic.go                  # Core business logic methods
            logic_test.go             # Unit tests (Pure functions + mock storage)
            models.go                 # Domain structs (Task, NewTaskRequest)
            errors.go                 # Feature-specific errors

            # --- Storage (Data Access) ---
            storage.go                # Storage Interface definition
            storage_pg.go             # Postgres implementation
            postgres_integration_test.go # Integration tests (Real DB/Testcontainers)
            storage_mock.go           # Mock implementation
            ...
          order/                      # Order management
            handler.go
            logic.go
            storage.go
          ...
```

**Key Go conventions:**
- `cmd/` for entry points — each subdirectory is a separate binary
- `internal/` for private packages — enforced by Go compiler (cannot be imported externally)
- `platform/` for foundational concerns (database, server, logger)
- `features/` for vertical business slices — each feature is self-contained
- Tests live alongside the code they test (`_test.go` suffix)
- `go.mod` at the root — single module for the entire application

### Related Principles
- Project Structure @project-structure.md (core philosophy)
- Go Idioms and Patterns @go-idioms-and-patterns.md (coding idioms, error handling, naming)
