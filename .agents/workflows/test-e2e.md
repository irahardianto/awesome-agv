---
description: E2E testing workflow — plan, author, and execute end-to-end tests for mobile and web platforms
---

# End-to-End Testing — Mobile & Web

## Purpose
Platform-adaptive E2E testing for complete user journeys. Covers web (desktop and mobile browsers) and native mobile (iOS, Android). Use `/test-unit` for unit tests and `/test-integration` for integration tests.

## When to Use
- New feature affecting user-facing flows
- Pre-release E2E verification
- Critical user journey regression testing
- Cross-platform feature parity validation

## When NOT to Use
- Unit test gaps — use `/test-unit`
- Integration test gaps — use `/test-integration`
- Need test scenarios first — use `/test-scenarios`

## Phases

### Phase 1: PLAN
**Objective:** Identify critical user journeys and map to platforms.

1. Identify critical user journeys from requirements, PRD, or existing user flows
2. For each journey, determine target platforms:
   - **Web:** desktop browsers (Chrome, Firefox, Safari), mobile browsers (Chrome Android, Safari iOS)
   - **Mobile native:** iOS, Android
3. Define test matrix (journey × platform). Prioritize: P0 journeys tested on all target platforms
4. Present plan to user for confirmation

**Gate:** User-approved journey list with platform mapping.

### Phase 2: SETUP
**Objective:** Configure E2E test infrastructure per platform.

#### Web Setup
1. Load `browser-automation` skill
2. Configure Playwright: browsers, viewport sizes, base URL
3. Set up auth state management (login once, reuse across tests)
4. Configure screenshot and recording capture for evidence

#### Mobile Setup
1. Load `mobile-testing` skill
2. Configure test framework based on stack:
   - **Flutter:** `integration_test` + Patrol for native interactions
   - **React Native:** Detox or Maestro
   - **Native iOS/Android:** XCUITest/Espresso or Maestro (cross-platform)
3. Configure device/emulator targets
4. Set up golden file baseline if visual regression testing is needed

#### Shared Setup
1. API fixtures for test data seeding — create test users, seed DB state via API
2. Environment configuration — staging URL, test API keys
3. State reset mechanism between tests to ensure isolation

**Skills to consider:** `browser-automation`, `mobile-testing`

**Gate:** Test infrastructure configured. Smoke test passes on at least one platform.

### Phase 3: AUTHOR
**Objective:** Write E2E tests for each planned journey.

1. **Web tests:** Use Page Object Model per `browser-automation` skill
   - One page object per page or major component
   - Tests compose page objects into user journeys
2. **Mobile tests:** Use Screen Object Model per `mobile-testing` skill
   - One screen object per screen
   - Tests compose screen objects into user flows
3. For each journey:
   - Set up test data via API fixtures
   - Execute user flow step-by-step
   - Assert expected outcomes at critical checkpoints
   - Capture screenshots at key points for evidence
   - Clean up test data after test completes
4. Test file location per @testing-strategy.md:
   - Single app: `e2e/` directory
   - Monorepo: `apps/e2e/` directory

**Skills to consider:** `browser-automation`, `mobile-testing`, `testing-strategy`

**Gate:** E2E tests written for all P0 journeys.

### Phase 4: EXECUTE
**Objective:** Run E2E tests against target environment.

1. Ensure target environment is running (local dev server, staging, or Docker Compose)
2. Run web E2E tests across browser matrix
3. Run mobile E2E tests across device/emulator matrix
4. Capture evidence for all runs:
   - Screenshots at key checkpoints
   - Video recordings of test runs
   - Accessibility snapshots where applicable
5. On failure:
   - Capture full error context (stack trace, console logs)
   - Take screenshot at exact failure point
   - Record the step that failed within the journey

**Gate:** All P0 journey tests pass. Evidence captured for all runs.

### Phase 5: REPORT
**Objective:** Produce E2E coverage report.

1. Produce **E2E Coverage Report** artifact containing:
   - Pass/fail status per journey per platform
   - Screenshots as visual evidence
   - Failure details with reproduction steps
   - Coverage ratio: journeys tested / total identified
2. Identify gaps:
   - Untested journeys (P1/P2 that were deferred)
   - Uncovered platforms (e.g., mobile browser not tested)
3. Recommendations for next iteration

**Gate:** Report generated and presented to user.

## Completion Criteria
- [ ] User-approved journey plan with platform mapping
- [ ] E2E infrastructure configured (web + mobile as applicable)
- [ ] E2E tests authored for all P0 journeys
- [ ] All P0 tests pass with evidence captured
- [ ] E2E coverage report generated
