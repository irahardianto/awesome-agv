---
trigger: always_on
---

## Architectural Patterns - Testability-First Design

### Core Principle
All code must be independently testable without running the full application or external infrastructure.

### Universal Architecture Rules

#### Rule 1: I/O Isolation
**Problem:** Tightly coupled I/O makes tests slow, flaky, and environment-dependent.

**Solution:** Abstract all I/O behind interfaces/contracts:
- Database queries
- HTTP calls (to external APIs)
- File system operations
- Time/randomness (for determinism)
- Message queues

**Implementation Discovery:**
1. Search for existing abstraction patterns: `find_symbol("Interface")`, `find_symbol("Mock")`, `find_symbol("Repository")`
2. Match the style (interface in Go, Protocol in Python, interface in TypeScript)
3. Implement production adapter AND test adapter

**Example (Go):**

```Go

// Contract
type UserStore interface {
  Create(ctx context.Context, user User) error
  GetByEmail(ctx context.Context, email string) (*User, error)
}

// Production adapter
type PostgresUserStore struct { /* ... */ }

// Test adapter
type MockUserStore struct { /* ... */ }
```

**Example (TypeScript/Vue):**
```typescript

// Contract (service layer)
export interface TaskAPI {
  createTask(title: string): Promise<Task>;
  getTasks(): Promise<Task[]>;
}

// Production adapter
export class BackendTaskAPI implements TaskAPI { /* ... */ }

// Test adapter (vi.mock or manual)
export class MockTaskAPI implements TaskAPI { /* ... */ }

```

#### Rule 2: Pure Business Logic
**Problem:** Business rules mixed with I/O are impossible to test without infrastructure.

**Solution:** Extract calculations, validations, transformations into pure functions:
- Input → Output, no side effects
- Deterministic: same input = same output
- No I/O inside business rules

**Examples:**
```

// ✅ Pure function - easy to test
func calculateDiscount(items []Item, coupon Coupon) (float64, error) {
// Pure calculation, returns value
}

// ❌ Impure - database call inside
func calculateDiscount(ctx context.Context, items []Item, coupon Coupon) (float64, error) {
validCoupon, err := db.GetCoupon(ctx, coupon.ID) // NO!
}

```

**Correct approach:**
```

// 1. Fetch dependencies first (in handler/service)
validCoupon, err := store.GetCoupon(ctx, coupon.ID)

// 2. Pass to pure logic
discount, err := calculateDiscount(items, validCoupon)

// 3. Persist result
err = store.SaveOrder(ctx, order)

```

#### Rule 3: Dependency Direction
**Principle:** Dependencies point inward toward business logic.

```

┌──────────────────────────────────────┐
│  Infrastructure Layer                │
│  (DB, HTTP, Files, External APIs)    │
│                                      │
│  Depends on ↓                        │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Contracts/Interfaces Layer          │
│  (Abstract ports - no implementation)│
│                                      │
│  Depends on ↓                        │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Business Logic Layer                │
│  (Pure functions, domain rules)      │
│  NO dependencies on infrastructure   │
└──────────────────────────────────────┘

```

**Never:**
- Business logic imports database driver
- Domain entities import HTTP framework
- Core calculations import config files

**Always:**
- Infrastructure implements interfaces defined by business layer
- Business logic receives dependencies via injection

### Pattern Discovery Protocol

**Before implementing ANY feature:**

1. **Search existing patterns** (MANDATORY):
```

find_symbol("Interface") OR find_symbol("Repository") OR find_symbol("Service")

```

2. **Examine 3 existing modules** for consistency:
- How do they handle database access?
- Where are pure functions vs I/O operations?
- What testing patterns exist?

3. **Document pattern** (>80% consistency required):
- "Following pattern from [task, user, auth] modules"
- "X/Y modules use interface-based stores"
- "All tests use [MockStore, vi.mock, TestingPinia] pattern"

4. **If consistency <80%**: STOP and report fragmentation to human.

### Testing Requirements

**Unit Tests (must run without infrastructure):**
- Mock all I/O dependencies
- Test business logic in isolation
- Fast (<100ms per test)
- >85% coverage of business paths

**Integration Tests (Testcontainers):**
- Use real dependencies (via Testcontainers, Firebase emulator)
- Test adapter implementations
- Verify contracts work end-to-end
- Cover all I/O adapters

**Test Organization:**
- Unit/Integration tests: Co-located with implementation
- E2E tests: Separate `/e2e` directory

### Language-Specific Idioms

**How to achieve testability in each ecosystem:**

| Language/Framework | Abstraction Pattern | Test Strategy |
|-------------------|---------------------|---------------|
| **Go** | Interface types, dependency injection | Table-driven tests, mock implementations |
| **TypeScript/Vue** | Interface types, service layer, Pinia stores | Vitest with `vi.mock`, `createTestingPinia` |
| **TypeScript/React** | Interface types, service layer, Context/hooks | Jest with mock factories, React Testing Library |
| **Python** | `typing.Protocol` or abstract base classes | pytest with fixtures, monkeypatch |
| **Rust** | Traits, dependency injection | Unit tests with mock implementations, `#[cfg(test)]` |
| **Flutter/Dart** | Abstract classes, dependency injection | `mockito` package, widget tests |

### Enforcement Checklist

Before marking code complete, verify:
- [ ] Can I run unit tests without starting database/external services?
- [ ] Are all I/O operations behind an abstraction?
- [ ] Is business logic pure (no side effects)?
- [ ] Do integration tests exist for all adapters?
- [ ] Does pattern match existing codebase (>80% consistency)?

### Related Principles
- Core Design Principles @core-design-principles.md
- Testing Strategy @testing-strategy.md
- Avoid Circular Dependencies @avoid-circular-dependencies.md
- Code Organization Principles @code-organization-principles.md
- Project Structure @project-structure.md