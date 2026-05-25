---
layout: default
title: Workflows Reference
nav_order: 5
---

# Workflows Reference
{: .no_toc }

All 12 development workflows — from feature delivery to code audits.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What Are Workflows?

Workflows are structured, multi-phase development processes defined in `.agents/workflows/`. They chain rules and skills together into repeatable, quality-enforced development cycles.

Each workflow is invoked as a **slash command** (e.g., `/workflow-solo`, `/bugfix`) and guides the agent through specific phases with completion criteria at each step.

### Choosing the Right Workflow

| Situation                      | Workflow                            |
| ------------------------------ | ----------------------------------- |
| Building a new feature         | `/workflow-solo`                     |
| Fixing a bug                   | `/bugfix`                           |
| Restructuring code             | `/refactor`                         |
| Reviewing code quality         | `/audit`                            |
| Optimizing performance         | `/perf-optimize`                    |
| Multi-agent orchestration      | `/workflow-team`                            |

---

## 🏭 Feature Workflow — Single Agent (`/workflow-solo`)

**File:** `.agents/workflows/workflow-solo.md`

The primary workflow for building features. Treats the development lifecycle as a **state machine** — no phase can be skipped.

### Flow

```
Research → Implement (TDD) → Integrate → E2E (conditional) → Verify → Ship
```

### Phases

| Phase             | Gate                         | Output                                |
| ----------------- | ---------------------------- | ------------------------------------- |
| Research          | Research log created         | `task.md` + `docs/research_logs/*.md` |
| Implement         | Unit tests pass              | Production code + unit tests          |
| Integrate         | Integration tests pass       | Integration tests (Testcontainers)    |
| E2E (conditional) | E2E tests pass + screenshots | E2E tests + screenshots               |
| Verify            | All linters pass             | Coverage report                       |
| Ship              | Committed                    | Git commit                            |

### Key Rules
- **FORBIDDEN from skipping phases** — each phase must complete before the next starts
- Agent acts as a "Senior Principal Engineer with a mandate for strict protocol adherence"
- Pre-implementation: scan `.agents/rules/`, identify applicable rules, READ them
- Tasks marked `[x]` only after Phase 4 (Verify) passes


### Error Handling
If a phase fails:
1. Document the failure in task summary
2. Do not proceed to next phase
3. Fix the issue within current phase
4. Re-run phase completion criteria
5. Then proceed

---

## Phase 1: Research

**File:** `.agents/workflows/phase-research.md`

Understand the request context and gather knowledge before writing any code.

### Steps
1. **Analyze Request** — parse requirements, identify scope
2. **Review Current Implementation** — understand existing architecture
3. **Build Mental Model** — requirements, constraints, integration points
4. **Define Scope** — create `task.md` with atomic tasks
5. **Identify Research Topics** — list all technologies involved
6. **Search Documentation** — use Qurio or web search for each topic
7. **Document Findings** — create `docs/research_logs/{feature}.md`
8. **Document Architecture Decisions** — create ADRs using ADR Skill if needed
9. **Fallback** — web search if documentation search fails

### Skills Used
- **Sequential Thinking** — for complex design decisions
- **ADR** — for significant architecture decisions

---

## Phase 2: Implement

**File:** `.agents/workflows/phase-implement.md`

Write production code following Test-Driven Development (TDD).

### TDD Cycle
1. **Red** — write a failing test
2. **Green** — write minimal code to make it pass
3. **Refactor** — improve structure while keeping tests green

### Unit Test Requirements
- Mock all dependencies (interfaces)
- Test happy path, error paths, AND edge cases
- Target >85% coverage on domain logic

### Skills Used
- **Sequential Thinking** — for complex refactoring
- **Debugging Protocol** — for non-obvious test failures
- **Guardrails** — pre-flight checklist before writing code

---

## Phase 3: Integrate

**File:** `.agents/workflows/phase-integrate.md`

Test adapter implementations with real infrastructure using Testcontainers.

### When Required
- Code that touches database (storage implementations)
- Code that calls external APIs
- Code that uses message queues, caches, etc.

### Steps
1. Setup Testcontainers (PostgreSQL, Redis, NSQ, etc.)
2. Write integration tests (`*_integration_test.go` or `*.integration.spec.ts`)
3. Run integration tests
4. Optional manual verification

---

## Phase 3.5: E2E Test

**File:** `.agents/workflows/phase-e2e.md`

Validate complete user journeys through the full system using Playwright MCP.

### When Required
- UI components were added or modified
- API endpoints interact with frontend
- Critical user-facing flows were changed

### When to Skip
- Pure backend/infrastructure changes
- Internal library refactoring
- Test-only changes

### Steps
1. Start services (docker compose or local dev)
2. Create E2E test plan
3. Execute with Playwright MCP (navigate, interact, screenshot)
4. Document results with screenshots in `docs/e2e-screenshots/`

---

## Phase 4: Verify

**File:** `.agents/workflows/phase-verify.md`

Run all linters, static analysis, and tests to ensure code quality.

### Backend Validation (Go)
```bash
gofumpt -l -e -w . && go vet ./... && staticcheck ./... && gosec -quiet ./... && go test -race ./...
```

### Frontend Validation (TypeScript/Vue)
```bash
pnpm run lint --fix && npx vue-tsc --noEmit && pnpm run test
```

### Build Check
```bash
# Backend
go build ./...

# Frontend
pnpm run build
```

### Coverage Target
>85% on domain logic.

### If This Phase Fails
1. Do NOT proceed to Ship
2. Fix the issue (go back to Phase 2 or 3)
3. Re-run full verification
4. Only proceed when ALL checks pass

---

## Phase 5: Ship

**File:** `.agents/workflows/phase-commit.md`

Commit completed work with proper conventional commit format.

### Conventional Commit Format
```
<type>(<scope>): <description>
```

### Types
| Type       | Purpose                          |
| ---------- | -------------------------------- |
| `feat`     | New feature                      |
| `fix`      | Bug fix                          |
| `docs`     | Documentation only               |
| `refactor` | Code change (no new feature/fix) |
| `test`     | Adding or updating tests         |
| `chore`    | Maintenance, dependencies        |
| `perf`     | Performance improvement          |
| `ci`       | CI/CD configuration changes      |

---

## 🔧 Bug-Fix Workflow (`/bugfix`)

**File:** `.agents/workflows/bugfix.md`

Fix bugs of any size — from hotfixes to complex debugging sessions — without the overhead of a full feature workflow.

### When to Use
- Bug fixes (any size, any complexity)
- Hotfixes for production issues
- Addressing review findings from `/audit`
- Regression fixes after deployments
- Flaky test fixes

### Phases
1. **Diagnose** — identify the bug, locate affected code, assess blast radius. Use **Debugging Protocol** for non-obvious causes, **Sequential Thinking** for multi-hypothesis evaluation
2. **Fix + Test (TDD)** — write failing test, apply fix, verify existing tests pass, update integration tests if boundaries touched
3. **Verify + Ship** — full validation suite, E2E if UI was touched, commit with `fix` type

---

## 🔧 Refactor Workflow (`/refactor`)

**File:** `.agents/workflows/refactor.md`

Safely restructure existing code while preserving behavior.

### When to Use
- Code restructuring (moving, renaming, splitting modules)
- Pattern migration (e.g., callbacks → async/await)
- Dependency upgrades with breaking changes
- Addressing tech debt or architectural improvements

### Requires a Specific Goal
- ✅ `/refactor extract storage interface in task feature`
- ✅ `/refactor split user handler into separate auth handler`
- ❌ `/refactor apps/backend` (too vague — use `/audit` first)

### Phases
1. **Impact Analysis** — map blast radius, document existing behavior, identify risks
2. **Incremental Change (TDD)** — one change at a time, tests pass at each step
3. **Parity Verification** — full validation, compare coverage (equal or better)
4. **Ship** — commit with `refactor` type

### Key Principle
Never break the build for more than one step at a time.

---

## 🔧 Audit Workflow (`/audit`)

**File:** `.agents/workflows/audit.md`

Inspect existing code quality without writing new features. Produces structured findings for subsequent fix workflows.

### When to Use
- After another agent's feature is committed (cross-agent review)
- Periodic quality gates
- Before releases or deployments
- Verification without new code

### Phases

1. **Code Review** — invoke the Code Review Skill against specified files
1.5. **Cross-Boundary Review** — check integration seams that live between components, not inside any single file
2. **Automated Verification** — full lint/test/build validation
3. **Findings Report** — saved to `docs/audits/review-findings-{feature}-{date}-{HHmm}.md`

### Phase 1.5: Cross-Boundary Review

A **menu of dimensions** — activate only those that apply to the project, and state which you skipped and why.

| Dimension | Activate When |
| --- | --- |
| **A. Integration Contracts** | Project has both frontend and backend |
| **B. Database & Schema** | Project uses a relational/document database |
| **C. Configuration & Environment** | Always — universal |
| **D. Dependency Health** | Always — universal |
| **E. Test Coverage Gaps** | Always — universal |
| **F. Mobile ↔ Backend** | Project has a mobile app and a backend |

**Zero-Findings Guard:** If the audit produces fewer than 3 findings, you MUST complete a "Dimensions Covered" attestation table proving each dimension was explicitly examined before declaring a clean result.

### Findings Triage

| Finding Type       | Example                        | Follow-Up                           |
| ------------------ | ------------------------------ | ----------------------------------- |
| Nit / minor        | "Rename `x` to `userCount`"    | Fix directly                        |
| Small isolated fix | "Add input validation"         | `/bugfix` in new conversation    |
| Structural change  | "Storage not behind interface" | `/refactor` in new conversation     |
| Missing capability | "No auth on admin routes"      | `/workflow-solo` in new conversation |

### Best Practice
Run audits in a **fresh conversation** (not the one that wrote the code) to avoid confirmation bias.

---

## 🔧 Performance Optimization Workflow (`/perf-optimize`)

**File:** `.agents/workflows/perf-optimize.md`

Profile-driven performance optimization. Always measure before optimizing — one fix at a time, independently benchmarked and committed.

### When to Use
- User provides profiling data (pprof, flamegraph, Lighthouse)
- Benchmarks show regression
- User asks to optimize a specific component

### Phases

| Phase | Output | Gate |
| --- | --- | --- |
| Profile | Raw data + extracted markdown | Data collected |
| Analyze | `docs/research_logs/{component}-perf-analysis.md` | Top offenders identified |
| Prioritize | Implementation plan | User approved |
| Implement | Tests + code + benchmark per fix | Each fix passes tests |
| Verify | Full benchmark comparison | All checks pass |
| Ship | Conventional commits (`perf(scope): ...`) | User notified |

### Key Rules
- **One fix per commit** — never batch optimizations
- **TDD for each fix** — write test, implement, benchmark
- **Stop when** remaining cost is in runtime internals, hardware-optimized assembly, or when improvement < 5%
- Loads the **perf-optimization** skill and relevant language module before starting

---

## 🏭 Multi-Agent Pipeline (`/workflow-team`)

**File:** `.agents/workflows/workflow-team.md`

Dispatches specialized sub-agents across layers (research, design, build, review) with parallel execution support. The Pipeline Manager orchestrates — it never writes code itself.

### When to Use
- Features requiring multiple specializations (backend + frontend + database)
- Tasks benefiting from parallel development
- Scenarios needing specialized review (security audit + QA + UX review)
- Large features that can be decomposed into independent work streams

### Agent Roster (15 Personas)

Agents are organized into four layers with strict boundaries:

#### Research Layer (Read-only)

| Agent | Domain |
| --- | --- |
| `@scout` | Codebase exploration, pattern discovery, technology research |

#### Design Layer (Read-only — produces decisions and contracts)

| Agent | Domain |
| --- | --- |
| `@architect` | System design, ADRs, API contracts, dependency strategy |

Cross-layer participants can join DESIGN when needed: `@ux-reviewer`, `@database-expert`, `@security-engineer`, `@performance-engineer`.

#### Builder Layer (Write — run in Git worktrees)

| Agent | Domain |
| --- | --- |
| `@backend-engineer` | APIs, business logic, concurrency, observability |
| `@frontend-engineer` | Web UI, components, state management, a11y |
| `@mobile-engineer` | Flutter/RN, widgets, platform APIs, offline-first |
| `@database-expert` | Schema, migrations, queries, indexes |
| `@devops-engineer` | CI/CD, containers, IaC, monitoring |
| `@technical-writer` | Docs, API docs, changelogs, README |
| `@test-automation-engineer` | E2E (UI+API), Playwright, test infra |
| `@performance-engineer` | Profiling, benchmarks, load tests, optimization |
| `@refactoring-specialist` | Code smell detection, safe transformation |

#### Reviewer Layer (Read-only — post-merge)

| Agent | Domain |
| --- | --- |
| `@qa-analyst` | Code review, testing coverage, quality gates |
| `@security-engineer` | Threats, vulnerabilities, auth, input validation |
| `@ux-reviewer` | Design heuristics, interaction, a11y, responsive |
| `@incident-responder` | Triage, RCA, mitigation, postmortems |

### Composable Primitives

Workflows are built from composable primitives — each a stage in the pipeline:

| Primitive | Agents | Dependency |
| --- | --- | --- |
| **SCOUT** | scout or domain agent | None |
| **DESIGN** | architect + optional experts | After SCOUT |
| **PRE-MORTEM** | incident-responder + optional experts | After DESIGN |
| **BUILD** | Implementation agents | After DESIGN |
| **TEST** | test-automation-engineer | After DESIGN |
| **REVIEW** | qa-analyst + security-engineer + optional | After BUILD/TEST |
| **REMEDIATE** | Fix agents | After REVIEW |
| **OPTIMIZE** | performance-engineer | After BUILD |
| **REFACTOR** | refactoring-specialist | After REVIEW/SCOUT |
| **INCIDENT** | incident-responder + engineers | Standalone |
| **VERIFY** | qa-analyst | After final merge |
| **DOCUMENT** | technical-writer | After VERIFY |

### Workflow Templates

| Template | Pipeline |
| --- | --- |
| **A: Full Feature** | SCOUT → DESIGN → PRE-MORTEM → BUILD → REVIEW → REMEDIATE → VERIFY → DOCUMENT |
| **B: Bug Fix** | SCOUT → BUILD → REVIEW → VERIFY |
| **C: Audit & Remediation** | SCOUT(review) → REVIEW → REMEDIATE → REVIEW → VERIFY |
| **D: Mobile Feature** | SCOUT → DESIGN → BUILD → REVIEW → VERIFY |
| **E: Performance** | SCOUT(profile) → OPTIMIZE → BUILD → REVIEW → VERIFY |
| **F: Security Hardening** | SCOUT(security) → REMEDIATE → REVIEW → VERIFY |
| **G: Infrastructure** | DESIGN → BUILD → REVIEW → VERIFY |
| **H: Documentation** | SCOUT → DOCUMENT → REVIEW |
| **I: Incident Response** | INCIDENT → REMEDIATE → REVIEW → VERIFY → DOCUMENT |
| **J: Tech Debt** | SCOUT → REFACTOR → REVIEW → VERIFY |
| **K: Security + Perf Audit** | SCOUT → REVIEW → REMEDIATE → REVIEW → VERIFY |
| **L: Pre-Mortem** | DESIGN → PRE-MORTEM → DOCUMENT |

### Parallel Execution

Two types of parallelism are supported:

- **Cross-domain**: Different agent types in parallel (e.g., `@backend-engineer` + `@frontend-engineer`). Always safe — disjoint domains.
- **Intra-domain**: Multiple instances of the same agent type (e.g., `@backend-engineer[auth]` + `@backend-engineer[tasks]`). Requires MECE decomposition via parallel-dispatch skills.

```
# Single instance
@backend-engineer Build the auth feature

# Scoped parallel instances
@backend-engineer[auth] Implement auth handlers per scope card
@backend-engineer[tasks] Implement task CRUD per scope card
```

### Git Worktree Lifecycle

BUILD agents work in isolated Git worktrees to prevent conflicts:

```bash
# Setup (before dispatch)
git worktree add .wt/<agent-name>-<scope> -b wt/<agent-name>-<scope>-$(date +%s) HEAD

# Merge (in dependency order, per parallel-dispatch-merge skill)
git merge --squash wt/<agent-name>-<scope>-<ts>
git commit -m "<type>(<scope>): <description>"

# Cleanup
git worktree remove .wt/<agent-name>-<scope>
git branch -D wt/<agent-name>-<scope>-<ts>
```

### Circuit Breaker
- Sub-agent fails → retry ONCE with clarified context
- Fails again → STOP: `"BLOCKED: {agent_type}[{scope}] failed 2x on {task}. Need human input."`
- Max 2 attempts per sub-agent per task — non-negotiable
