---
trigger: model_decision
description: When writing tests, organizing test files, implementing test doubles, or setting up testing infrastructure
---

## Testing Strategy

### Test Pyramid

**Unit Tests (70% of tests):**

- **What:** Test domain logic in isolation with mocked dependencies  
- **Speed:** Fast (<100ms per test)  
- **Scope:** Single function, class, or module  
- **Dependencies:** All external dependencies mocked (repositories, APIs, time, random)  
- **Coverage Goal:** >85% of domain logic

**Integration Tests (20% of tests):**

- **What:** Test adapters against real infrastructure  
- **Speed:** Medium (100ms-5s per test)  
- **Scope:** Component interaction with infrastructure (database, cache, message queue)  
- **Dependencies:** Real infrastructure via Testcontainers  
- **Coverage Goal:** All adapter implementations, critical integration points

**End-to-End Tests (10% of tests):**

- **What:** Test complete user journeys through all layers  
- **Speed:** Slow (5s-30s per test)  
- **Scope:** Full system from HTTP request to database and back  
- **Dependencies:** Entire system running (or close approximation)  
- **Coverage Goal:** Happy paths, critical business flows

### Test-Driven Development (TDD)

**Red-Green-Refactor Cycle:**

1. **Red:** Write a failing test for next bit of functionality  
2. **Green:** Write minimal code to make test pass  
3. **Refactor:** Clean up code while keeping tests green  
4. **Repeat:** Next test

**Benefits:**

- Tests written first ensure testable design  
- Comprehensive test coverage (code without test doesn't exist)  
- Faster development (catch bugs immediately, not in QA)  
- Better design (forces thinking about interfaces before implementation)

### Test Doubles Strategy

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

**Best Practice:**

- Generate at least 2 implementations per driven port:  
  1. Production adapter (PostgreSQL, GCP GCS, etc.)  
  2. Test adapter (in-memory, fake implementation)

### Test Organization

**Universal Rule: Co-locate implementation tests; Separate system tests.**

**1. Unit & Integration Tests (Co-located)**
- **Rule:** Place tests **next to the file** they test.
- **Why:** Keeps tests visible, encourages maintenance, and supports refactoring (moving a file moves its tests).
- **Naming Convention Example:**
  - **TS/JS:** `*.spec.ts` (Unit), `*.integration.spec.ts` (Integration)
  - **Go:** `*_test.go` (Unit), `*_integration_test.go` (Integration)
  - **Python:** `test_*.py` (Unit), `test_*_integration.py` (Integration)
  - **Java:** `*Test.java` (Unit), `*IT.java` (Integration)
  > You must strictly follow the convention for the target language. Do not mix `test` and `spec` suffixes in the same application context.

**2. End-to-End Tests (Separate)**
- **Rule:** Place in a dedicated `e2e/` folder
  - **Single Service:** `e2e/` at project root
  - **Monorepo:** `apps/e2e/` subdivided by test scope:
    - `apps/e2e/api/` for full API flow E2E tests (HTTP → Database)
    - `apps/e2e/ui/` for full-stack E2E tests (Browser → Backend → Database)
- **Why:** E2E tests cross boundaries and don't belong to a single feature.
- **Naming:** Follow `{feature}-{ui/api}.e2e.test.{ext}` (Universal - configure test runner to match this pattern `**/*.e2e.test.*`)
  - Example: 
    - `user-registration-api.e2e.test.ts`       # Full API flow: HTTP → DB
    - `user-registration-ui.e2e.test.ts`        # Full-stack: Browser → Backend → DB

**Using Playwright MCP for UI E2E Tests:**

When running E2E tests interactively (during development or verification), use Playwright MCP:

```
# Navigate to the page
mcp_playwright_browser_navigate(url="http://localhost:5173/login")

# Capture accessible state (better than screenshot for assertions)
mcp_playwright_browser_snapshot()

# Interact with elements by ref from snapshot
mcp_playwright_browser_type(ref="<ref>", text="test@example.com")
mcp_playwright_browser_click(ref="<ref>")

# Wait for results
mcp_playwright_browser_wait_for(text="Welcome")

# Take screenshot for walkthrough documentation
mcp_playwright_browser_take_screenshot(filename="login-success.png")
```

**E2E Test Requirements:**
- Take screenshot at each major step
- Save screenshots to walkthrough as proof of functionality
- Test happy path AND at least one error path
- Clean up test data after test (or use unique identifiers)

**Key Principles:**
- **Unit/Integration tests**: Co-located with implementation
- **E2E tests**: Separate directory (crosses boundaries)
- **Test doubles**: Co-located with interface (mock_store.go, taskAPI.mock.ts)
- **Pattern consistency**: All features follow same structure  

### Test Quality Standards

**AAA Pattern (Arrange-Act-Assert):**
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
**Test Naming:**

- Descriptive: `should [expected behavior] when [condition]`  
- Examples:  
  - `should return 404 when user not found`  
  - `should hash password before saving to database`  
  - `should reject email with invalid format`

**Coverage Requirements:**

- Unit tests: >85% code coverage  
- Integration tests: All adapter implementations  
- E2E tests: Critical user journeys

### Related Principles
- Architectural Patterns - Testability-First Design @architectural-pattern.md
- Error Handling Principles @error-handling-principles.md
- Project Structure @project-structure.md