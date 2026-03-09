---
trigger: always_on
---

## Code Organization Principles

- Generate small, focused functions with clear single purposes (typically 10-50 lines)  
- Keep cognitive complexity low (cyclomatic complexity < 10 for most functions)  
- Maintain clear boundaries between different layers (presentation, business logic, data access)  
- Design for testability from the start, avoiding tight coupling that prevents testing  
- Apply consistent naming conventions that reveal intent without requiring comments

### Module Boundaries
**Problem:** Cross-module coupling makes changes ripple across codebase.

**Solution:** Feature-based organization with clear public interfaces:
- One feature = one directory
- Each module exposes a public API (exported functions/classes)
- Internal implementation details are private
- Cross-module calls only through public API

**Directory Structure (Language-Agnostic):**

> Paths below are illustrative examples following `project-structure.md` — the single source of truth for project layout.
> **Note:** The generic filenames below are illustrative. Always use language-specific naming conventions from the relevant `project-structure-*` file (e.g., `storage.go` in Go, `task.api.ts` in TypeScript, `task_repository.dart` in Dart).

```
/task

- public_api.{ext}      # Exported interface
- business.{ext}        # Pure logic
- store.{ext}           # I/O abstraction (interface)
- postgres.{ext}        # I/O implementation
- mock.{ext}            # Test implementation
- test.{ext}            # Unit tests (mocked I/O)
- integration.test.{ext} # Integration tests (real I/O)
```

**Go Example:**
```
apps/backend/internal/features/task/

- service.go            # Public API of this feature (Service struct)
- handler.go            # HTTP handlers
- logic.go              # Pure domain logic
- storage.go            # interface Storage
- storage_pg.go         # implements Storage (PostgreSQL)
- storage_mock.go       # Mock implementation for testing
- logic_test.go         # Unit tests with MockStorage
- postgres_integration_test.go # Integration test with Testcontainers
```

**Vue Example:**
```
/apps/frontend/src/features/task

- index.ts              # Public exports
- task.service.ts       # Business logic
- task.api.ts           # interface TaskAPI
- task.api.backend.ts   # implements TaskAPI
- task.store.ts         # Pinia store (uses TaskAPI)
- task.service.spec.ts  # Unit tests (mock API)
```

### Feature Interaction Patterns

**Direct Import**

When a feature needs another feature's capabilities, import its Service directly:

```go
// In features/order/logic.go
import "yourapp/internal/features/task"

type Logic struct {
    taskService *task.Service  // Direct dependency injection
}

func (l *Logic) CreateOrder(ctx context.Context, req CreateOrderRequest) error {
    // Use task service directly
    task, err := l.taskService.GetTask(ctx, req.TaskID)
    // ... rest of logic
}
```

**Rules**

- Only import Service (public API), never internal files like logic.go or storage.go
- Declare dependency in the dependent feature's Service constructor
- Wire dependencies in cmd/api/main.go

**Wiring Example**
```go
// cmd/api/main.go
taskService := task.NewService(taskStorage)
orderService := order.NewService(orderStorage, taskService) // Pass task service
```

### Avoid Circular Dependencies

**Problem:** Module A imports B, B imports A

- Causes build failures, initialization issues
- Indicates poor module boundaries

**Solution:**

- Extract shared code to third module
- Restructure dependencies (A→C, B→C)
- Use dependency injection

### Related Principles
- Core Design Principles @core-design-principles.md
- Project Structure @project-structure.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md