---
description: Test scenario generator — systematically derive test scenarios from requirements using structured analysis and mutation-informed expansion
---

# Test Scenario Generator

## Purpose
Systematically derive test scenarios from requirements, code, or specifications. Uses a hybrid of structured derivation techniques and mutation-informed expansion to maximize coverage. Output feeds into `/test-unit`, `/test-integration`, or `/test-e2e` after human review.

## When to Use
- Starting testing on a new feature or module
- Comprehensive test planning before implementation
- Auditing test completeness on existing code
- Preparing test plans for QA handoff

## When NOT to Use
- You already have scenarios and need to write tests — use `/test-unit`, `/test-integration`, or `/test-e2e` directly

## Phases

### Phase 1: INPUT
**Objective:** Establish the requirements source.

1. Accept input from one or more sources:
   - **PRD / User Story** — extract acceptance criteria, business rules
   - **API Specification** — extract endpoints, schemas, error codes
   - **Existing Code** — extract public API, business logic, state transitions
   - **UI Designs** — extract user flows, validations, navigation paths
2. Document the input source and scope boundaries

**Gate:** Input source identified and accessible.

### Phase 2: INVENTORY
**Objective:** Map all existing test coverage across the codebase.

1. Crawl the codebase for existing tests:
   - **Unit tests:** Find all test files (`*_test.*`, `*.spec.*`, `*.test.*`). Extract test names/descriptions. Map to source modules.
   - **Integration tests:** Find all integration test files. Map to adapters/services under test.
   - **E2E tests:** Find all E2E test files. Extract journey/scenario descriptions.
2. Produce **Existing Coverage Inventory** artifact as a structured table:

   **Unit Tests:**

   | Module | Test File | Test Count | Scenarios Covered |
   |--------|-----------|------------|-------------------|
   | _discovered_ | _path_ | _count_ | _summary_ |

   **Integration Tests:**

   | Adapter | Test File | Test Count | Scenarios Covered |
   |---------|-----------|------------|-------------------|
   | _discovered_ | _path_ | _count_ | _summary_ |

   **E2E Tests:**

   | Journey | Test File | Platform | Scenarios Covered |
   |---------|-----------|----------|-------------------|
   | _discovered_ | _path_ | _platform_ | _summary_ |

3. Identify areas with NO test coverage — these are priority targets for scenario generation

**Gate:** Existing coverage inventory artifact created.

### Phase 3: ANALYZE
**Objective:** Extract testable behaviors from requirements.

1. For each requirement or feature, identify:
   - **Actors** — who triggers the behavior
   - **Actions** — what operations are performed
   - **Inputs** — data with types, ranges, and constraints
   - **Outputs** — responses, side effects, state changes
   - **State transitions** — e.g., order: pending → confirmed → shipped
   - **Business rules** — conditional logic, validation rules, authorization checks
   - **Error conditions** — invalid input, unauthorized, not found, conflict, timeout
2. Cross-reference against Phase 2 inventory to identify gaps — behaviors with no corresponding tests

**Skills to consider:** `sequential-thinking` for complex requirement analysis

**Gate:** All testable behaviors extracted. Gaps against existing coverage identified.

### Phase 4: DERIVE
**Objective:** Apply systematic test design techniques to generate scenarios.

Apply these techniques in order:

1. **Equivalence Partitioning** — Group inputs into valid and invalid classes. Generate one representative test per class.
2. **Boundary Value Analysis** — For each partition boundary, test: at the boundary, just inside, and just outside.
3. **Decision Table Testing** — For complex conditional logic: enumerate all condition combinations and map to unique action combinations.
4. **State Transition Testing** — For stateful workflows: test all valid transitions (should succeed) and all invalid transitions (should fail with appropriate error).
5. **Error Guessing** — Apply common failure patterns:
   - Null, undefined, empty values
   - Concurrent access to shared resources
   - Network timeouts and partial failures
   - Resource exhaustion (disk full, memory limit)
   - Unicode, special characters, extremely long strings

**Gate:** Structured scenarios derived from each technique.

### Phase 5: EXPAND
**Objective:** Mutation-informed creative expansion — generate scenarios that structured techniques miss.

For each scenario derived in Phase 4, consider these mutation categories:

| Mutation Type | Question | Example |
|---------------|----------|---------|
| **Comparison flip** | What if `<` were `<=`? | Pagination: page=0, page at exact boundary |
| **Boolean negation** | What if this check were inverted? | Auth: `isAdmin` check negated |
| **Null removal** | What if null check were removed? | Request without optional-but-expected field |
| **Default swap** | What if default value differed? | Timeout defaulting to 0 instead of 30s |
| **Off-by-one** | What if index were ±1? | Array: first element, last element, one-past-end |
| **Type coercion** | What if type were unexpected? | String `"0"` vs integer `0` vs boolean `false` |
| **Order dependency** | What if operations ran in different order? | Create-then-delete vs delete-then-create |
| **Timing** | What if this happened concurrently? | Two users updating the same resource simultaneously |

Steps:
1. For each scenario from Phase 4, apply the mutation table above
2. Generate additional scenarios for mutations that could reveal real bugs
3. Mark mutation-derived scenarios with `Mutation: <type>` in the Derivation column

**Gate:** Expanded scenario list with mutation-derived additions.

### Phase 6: ORGANIZE
**Objective:** Structure scenarios into a prioritized, categorized format.

1. **Categorize** each scenario:
   - Happy Path — expected successful flows
   - Edge Case — boundary and unusual-but-valid inputs
   - Error Path — expected failure conditions
   - Security/Abuse — malicious input, authorization bypass attempts
   - Performance/Stress — load, concurrency, resource limits
2. **Assign priority:**
   - **P0** — must test: core business logic, security, data integrity
   - **P1** — should test: important edge cases, common error paths
   - **P2** — nice to have: uncommon edges, cosmetic validations
   - **P3** — exploratory: mutation-derived, unusual combinations
3. **Assign recommended test level:**
   - **Unit** — pure logic, validation rules, calculations
   - **Integration** — adapter behavior, database queries, external service calls
   - **E2E** — full user journeys, cross-service flows

**Gate:** All scenarios categorized, prioritized, and assigned a test level.

### Phase 7: OUTPUT
**Objective:** Produce the final scenario document and feed-ready checklists.

The output artifact contains these sections:

#### 1. Existing Coverage Inventory
From Phase 2 — provides baseline context.

#### 2. New Scenarios Table

| ID | Category | Scenario | Input | Expected | Priority | Level | Derivation |
|----|----------|----------|-------|----------|----------|-------|------------|
| S001 | _category_ | _description_ | _input_ | _expected outcome_ | P0–P3 | Unit/Int/E2E | _technique or Mutation: type_ |

#### 3. 🧑‍💻 Recommended Manual Testing
Scenarios requiring human judgment, physical devices, or exploratory thinking:

| ID | Scenario | Why Manual | Priority |
|----|----------|------------|----------|
| M001 | _description_ | _reason automation is insufficient_ | P0–P3 |

#### 4. Feed-Ready Checklists
Scenarios pre-organized as checklists for downstream workflows:
- **For `/test-unit`:** Unit-level scenarios grouped by module
- **For `/test-integration`:** Integration-level scenarios grouped by adapter
- **For `/test-e2e`:** E2E-level scenarios grouped by user journey

**Gate:** Test scenario document produced.

**Persistent output:** Save the test scenario document to `docs/testing/test-scenarios-{feature}-{YYYY-MM-DD}.md` so it can be referenced by downstream `/test-unit`, `/test-integration`, and `/test-e2e` workflows. Create the `docs/testing/` directory if it doesn't exist.

### Phase 8: HUMAN REVIEW (Mandatory Gate)
**This gate is mandatory. Do not feed scenarios into testing workflows without user approval.**

1. Present the full Test Scenario Document to the user
2. Highlight key metrics:
   - Total scenarios by category and priority
   - Coverage gaps discovered vs existing tests
   - Recommended manual testing scenarios
   - Suggested first batch for implementation
3. User can:
   - **Approve** and select which workflow to feed into (`/test-unit`, `/test-integration`, `/test-e2e`)
   - **Adjust** priorities up or down
   - **Add/remove** scenarios based on domain knowledge
   - **Request** deeper analysis on specific areas

**Gate:** User has reviewed and approved the scenario document.

## Completion Criteria
- [ ] Input source identified
- [ ] Existing coverage inventory created
- [ ] Testable behaviors extracted and gaps identified
- [ ] Scenarios derived using structured techniques
- [ ] Scenarios expanded with mutation-informed analysis
- [ ] Scenarios organized by category, priority, and test level
- [ ] Manual testing recommendations included
- [ ] User has reviewed and approved the scenario document
