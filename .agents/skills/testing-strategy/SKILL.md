---
name: testing-strategy
description: >
  Detailed testing reference material: test doubles strategy, integration test
  infrastructure (Testcontainers, Firebase emulator), naming conventions per
  language, test organization patterns. Load when writing tests or setting up
  test infrastructure. The core mandates (TDD, AAA, pyramid) are in the
  testing-strategy rule — this skill provides implementation details.
---

# Testing Strategy Skill

This skill provides detailed implementation guidance for testing. The core mandates
(TDD, AAA, test pyramid ratios) are in the `testing-strategy` rule and are always active.
Load this skill when you need specific patterns, tools, or language conventions.

## Test Doubles Strategy

**Unit Tests:** Use mocks/stubs for all driven ports
- Mock repositories return pre-defined data
- Mock external APIs return successful responses
- Mock time/random for deterministic tests
- Control test environment completely

**Integration Tests:** Use real infrastructure
- Testcontainers spins up PostgreSQL, Redis, message queues
- Firebase emulator spins up Firebase Authentication, Cloud Firestore, Realtime Database, Cloud Storage for Firebase, Firebase Hosting, Cloud Functions, Pub/Sub, and Firebase Extensions
- Test actual database queries, connection handling, transactions
- Verify adapter implementations work with real services

**Best Practice:** Generate at least 2 implementations per driven port:
1. Production adapter (PostgreSQL, GCP GCS, etc.)
2. Test adapter (in-memory, fake implementation)

## Test Organization

### Co-located Tests (Unit & Integration)
Place tests **next to the file** they test. This keeps tests visible, encourages maintenance, and supports refactoring.

**Naming Conventions by Language:**

| Language | Unit | Integration |
|---|---|---|
| TS/JS | `*.spec.ts` | `*.integration.spec.ts` |
| Go | `*_test.go` | `*_integration_test.go` |
| Dart/Flutter | `*_test.dart` (in `test/` mirroring `lib/`) | `*_integration_test.dart` |
| Python | `test_*.py` | `test_*_integration.py` |
| Java | `*Test.java` | `*IT.java` |
| Rust | `#[cfg(test)] mod tests` inline | `tests/` at crate root |

> Strictly follow the convention for the target language. Do not mix `test` and `spec` suffixes in the same application context.

### Language-Specific Overrides

**Flutter:** Tests live in `test/` mirroring `lib/` layout (Flutter's default convention, discovered by `flutter test`). See the flutter-idioms skill's project-structure reference.

**Rust:** Unit tests are **inline** (`#[cfg(test)] mod tests` at the bottom of each `.rs` file). This is the official Rust convention — it enables testing private functions and is how `cargo test` discovers unit tests. Integration tests go in `tests/` at the crate root, compiled as separate crates. See the rust-idioms skill.

### E2E Tests (Separate)
Place in a dedicated `e2e/` folder:
- **Single app:** `e2e/` at project root
- **Monorepo:** `apps/e2e/` subdivided by scope: `apps/e2e/api/` and `apps/e2e/ui/`
- **Naming:** `{feature}-{ui/api}.e2e.test.{ext}`

For interactive E2E testing, see the `browser-automation` skill.

## Test Quality Standards

**AAA Pattern Example:**
```
// Arrange: Set up test data and mocks
const user = { id: '123', email: 'test@example.com' };
const mockRepo = createMockRepository();

// Act: Execute the code under test
const result = await userService.createUser(user);

// Assert: Verify expected outcome
expect(result.id).toBe('123');
expect(mockRepo.save).toHaveBeenCalledWith(user);
```

**Test Naming:** `should [expected behavior] when [condition]`
- `should return 404 when user not found`
- `should hash password before saving to database`
- `should reject email with invalid format`

**Coverage Requirements:**
- Unit tests: >85% code coverage
- Integration tests: All adapter implementations
- E2E tests: Critical user journeys

**Test doubles co-location:** Place mocks next to interface (e.g., `storage_mock.go`, `taskAPI.mock.ts`)
