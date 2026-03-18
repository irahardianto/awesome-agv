---
trigger: always_on
---

## Architectural Patterns — Testability-First Design

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
1. Search the codebase for existing abstraction patterns by looking for symbols named: `Interface`, `Mock`, `Repository`, `Store`, `Adapter` (use your available codebase search tool — Pathfinder, grep, IDE symbol search, etc.)
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
   Search the codebase for symbols named: `Interface`, `Repository`, `Service`, `Store`, `Mock`
   (use your available codebase search tool — Pathfinder, grep, IDE symbol search, etc.)

2. **Examine 3 existing modules** for consistency:
- How do they handle database access?
- Where are pure functions vs I/O operations?
- What testing patterns exist?

3. **Document pattern** (>80% consistency required):
- "Following pattern from [task, user, auth] modules"
- "X/Y modules use interface-based stores"
- "All tests use [MockStore, vi.mock, TestingPinia] pattern"

4. **If consistency <80%**: STOP and report fragmentation to human.

### Testability Compliance

These are **architectural** requirements that the code structure must satisfy — not testing mechanics. A design that cannot meet them is not compliant with this architecture.

**Unit testability (non-negotiable):**
- Unit tests MUST run without starting any database, external service, or network call
- All I/O dependencies MUST be abstractable to the point where a mock can replace them
- Business logic MUST be exercisable in isolation from infrastructure (enforced by Rules 1 & 2)

**Integration testability:**
- Every I/O adapter MUST be independently testable against real infrastructure
- Adapters must be replaceable — the application must not hard-wire a specific implementation

**Test co-location (structural rule):**
- Default: Unit and integration tests co-locate with the implementation they test (test lives next to the code)
- E2E tests: isolated in a dedicated directory — `e2e/` at the project root for single-app projects, or `apps/e2e/` for monorepos. They cross feature boundaries and belong to none. See Testing Strategy @testing-strategy.md for the complete E2E directory layout.
- **Language overrides:** Some ecosystems have different conventions (e.g., Flutter uses a mirrored `test/` directory, Rust uses inline `#[cfg(test)]` blocks). When a language-specific project structure file exists, its test location rules take precedence over this default. See the relevant `project-structure-*` file for authoritative guidance.

> For test pyramid proportions, naming conventions, tool choices, and language-specific tooling, see Testing Strategy @testing-strategy.md.

### Language-Specific Idioms

For language-specific abstraction patterns and test tooling, see the dedicated idiom files listed in `code-idioms-and-conventions.md`. Those files contain the authoritative guidance per ecosystem and are independently maintainable.

**Universal rule:** In every language, the testability pattern is the same — I/O is behind an interface, business logic is pure, and tests inject a mock/fake implementation. The idiom files describe *how* to express this pattern in each ecosystem's syntax.

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
- Code Organization Principles @code-organization-principles.md
- Project Structure @project-structure.md
- Database Design Principles @database-design-principles.md