---
trigger: model_decision
description: When writing tests, organizing test files, implementing test doubles, or setting up testing infrastructure
---

## Testing Strategy Mandate

### Test-Driven Development (Mandatory)

All production code is written using TDD. Red-Green-Refactor cycle:
1. **Red:** Write a failing test first
2. **Green:** Write minimal code to pass
3. **Refactor:** Clean up while keeping tests green

Code without a corresponding test does not exist.

### Test Structure (Mandatory)

All tests follow the **AAA pattern: Arrange → Act → Assert.** No exceptions.

### Test Pyramid

- **Unit (70%):** Domain logic in isolation, mocked I/O. <100ms/test. >85% coverage.
- **Integration (20%):** Adapters against real infrastructure (Testcontainers). All adapter implementations covered.
- **E2E (10%):** Complete user journeys. Happy paths and critical business flows.

### Test Co-location

- **Unit & integration tests:** Co-located next to the file they test
- **E2E tests:** Separate `e2e/` directory (single-app) or `apps/e2e/` (monorepo)
- Language-specific test location conventions (Flutter, Rust) override co-location default — see the relevant idiom skill.

### Test Naming

Follow `should [expected behavior] when [condition]` pattern. Use the language-specific file naming convention from the idiom skill.

For detailed test doubles strategy, infrastructure setup (Testcontainers, Firebase emulator), and language-specific conventions, load the `testing-strategy` skill.