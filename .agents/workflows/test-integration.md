---
description: Integration test coverage — audit I/O adapters, set up test infrastructure, and systematically improve integration test coverage
---

# Improve Integration Test Coverage

## Purpose
Audit and improve integration test coverage for I/O adapters. For unit test gaps, use `/test-unit`.

## When to Use
- I/O adapters (database, HTTP clients, file system, message queues) lack integration tests
- New infrastructure components without integration tests
- Pre-release verification of adapter reliability
- After discovering adapter bugs in production

## When NOT to Use
- Unit test gaps (use `/test-unit`)
- E2E test gaps (use `/test-e2e`)
- New feature development (use `/workflow-solo`)

## Phases

### Phase 1: AUDIT
**Objective:** Map which adapters have integration tests and which don't.

1. Scan codebase for I/O adapter patterns per @architectural-pattern.md: search for Repository, Store, Client, Adapter, Gateway, Provider in type/interface names. Also search for database drivers, HTTP clients, file system operations, message queue connections.
2. For each discovered adapter, check for corresponding integration test file. Language-specific naming conventions come from the idiom skill (e.g., Go: `*_integration_test.go`, TS: `*.integration.spec.ts`, Python: `*_integration_test.py`)
3. Produce **Adapter Coverage Map** artifact: adapter name, type (DB/HTTP/FS/Queue), has integration test (Y/N), test file path if exists

**Gate:** Adapter coverage map created. All I/O boundaries identified.

### Phase 2: INFRASTRUCTURE
**Objective:** Set up test infrastructure for untested adapters.

1. Load `testing-strategy` skill for Testcontainers and infrastructure patterns
2. For each untested adapter, set up required infrastructure:
   - Database adapters: Testcontainers with target database
   - HTTP client adapters: Mock server or test endpoint
   - File system adapters: Temp directory with cleanup
   - Message queue adapters: Testcontainers with target broker
3. Create shared test infrastructure setup (reusable across tests): container lifecycle, seed data scripts, connection factory for test environments
4. If CI pipeline exists, verify integration tests can run in CI (reference `ci-cd` skill)

**Skills to consider:** `testing-strategy`, `ci-cd`

**Gate:** Test infrastructure running. Containers start and connect successfully.

### Phase 3: TEST
**Objective:** Write integration tests for each uncovered adapter.

1. For each untested adapter from the audit:
   a. Test contract compliance — verify adapter implements its interface correctly against real infrastructure
   b. Test CRUD operations (where applicable)
   c. Test error handling — connection failures, timeouts, invalid data
   d. Test edge cases — empty results, large payloads, concurrent access
2. Use `testability-patterns` skill for adapter test structure
3. Ensure test isolation — each test manages its own state (setup + teardown)

**Skills to consider:** `testability-patterns`

**Gate:** All adapter integration tests pass against real infrastructure.

### Phase 4: VERIFY
**Objective:** Confirm coverage and CI readiness.

1. Run all integration tests end-to-end
2. Report: adapters tested vs total adapters (before/after)
3. Verify tests run in CI pipeline (if applicable)
4. Run quality checks per idiom skill

**Gate:** All integration tests pass. Adapter coverage improved. CI pipeline updated if applicable.

## Completion Criteria
- [ ] Adapter coverage map created
- [ ] Test infrastructure configured and running
- [ ] Integration tests written for all uncovered adapters
- [ ] All integration tests pass against real infrastructure
- [ ] Adapter coverage report generated (before vs after)
- [ ] CI pipeline runs integration tests (if applicable)
