---
trigger: always_on
---

## Architectural Patterns — Testability-First Design

### Core Principle
All code must be independently testable without running the full application or external infrastructure.

### Universal Architecture Rules

#### Rule 1: I/O Isolation
Abstract ALL I/O behind interfaces/contracts — database queries, HTTP calls, file system, time/randomness, message queues. Implement a production adapter AND a test adapter for every I/O boundary. For language-specific patterns and examples, see the `testability-patterns` skill.

#### Rule 2: Pure Business Logic
Extract calculations, validations, and transformations into pure functions (input → output, no side effects, no I/O). The three-step pattern is always: **fetch dependencies → pure logic → persist result**. Never call I/O from inside business logic functions.

#### Rule 3: Dependency Direction
Dependencies point inward toward business logic. Infrastructure implements interfaces defined by the business layer — never the reverse.

```
┌──────────────────────────────────────┐
│  Infrastructure Layer                │
│  (DB, HTTP, Files, External APIs)    │
│  Depends on ↓                        │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Contracts/Interfaces Layer          │
│  (Abstract ports — no implementation)│
│  Depends on ↓                        │
└──────────────────────────────────────┘
↓
┌──────────────────────────────────────┐
│  Business Logic Layer                │
│  (Pure functions, domain rules)      │
│  NO dependencies on infrastructure   │
└──────────────────────────────────────┘
```

**Never:** Business logic imports database driver, domain entities import HTTP framework, core calculations import config files.

**Always:** Infrastructure implements interfaces defined by the business layer. Business logic receives dependencies via injection, wired at `main`.

### Pattern Discovery Protocol

**Before implementing ANY feature:**

1. **Search existing patterns** (MANDATORY): Search the codebase for symbols named `Interface`, `Repository`, `Service`, `Store`, `Mock` using Pathfinder or grep.
2. **Examine 3 existing modules** for consistency — how do they handle database access, where are pure functions vs I/O, what testing patterns exist?
3. **Document pattern** (>80% consistency required): "Following pattern from [task, user, auth] modules."
4. **If consistency <80%**: STOP and report fragmentation to the human.

### Testability Compliance

**Unit testability (non-negotiable):**
- Unit tests MUST run without starting any database, external service, or network call
- All I/O dependencies MUST be abstractable so a mock can replace them
- Business logic MUST be exercisable in isolation from infrastructure

**Integration testability:**
- Every I/O adapter MUST be independently testable against real infrastructure
- Adapters must be replaceable — never hard-wire a specific implementation

**Test co-location:**
- Unit and integration tests co-locate with their implementation
- E2E tests isolated in `e2e/` (single-app) or `apps/e2e/` (monorepo)
- Language-specific exceptions: Flutter mirrors `test/` layout; Rust uses inline `#[cfg(test)]`

> For code examples in Go, TypeScript, Python, Rust, and Dart, see the `testability-patterns` skill.
> For test pyramid ratios, naming conventions, and tooling, see `testing-strategy` rule.

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