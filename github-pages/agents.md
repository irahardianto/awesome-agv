---
layout: default
title: Agent Personas
nav_order: 6
---

# Agent Personas
{: .no_toc }

21 specialized agent personas for multi-agent orchestration via `/workflow-team`.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What Are Agent Personas?

Agent personas are pre-defined identities in `.agents/agents/` that specialize an AI agent for a specific domain. Each persona defines:

- **Domain (EXCLUSIVE)** — what the agent is responsible for
- **Boundaries (DO NOT CROSS)** — what the agent must never do
- **Skills** — which skills to load from `.agents/skills/`
- **Workflow** — step-by-step process for the agent's work
- **Parallel Dispatch** — how to run multiple instances safely

Personas are used by the `/workflow-team` command skill (formerly a workflow). Every spawned subagent reads its role file first, and each agent may only spawn what its own role file permits — layers are never bypassed. They enforce **MECE** (Mutually Exclusive, Collectively Exhaustive) boundaries — every agent knows exactly what it owns and what it must not touch.

---

## Layer Architecture

The `/workflow-team` hierarchy (from `.agents/skills/workflow-team/SKILL.md` §1):

```
L0  @overseer               — pipeline supervisor
        │
        └── L1  @conductor              — build orchestrator (elicit → assess → decompose → dispatch → report)
                │
                ├── L2  @tech-lead × N      — scope card owner (multi-domain cards)
                │         └── L3  builders + @test-automation-engineer
                │
                ├── L2  Specialized Builder  — direct dispatch (single-domain cards)
                ├── L2  @scout × N          — optional EXPLORE phase (read-only)
                └── L2  @reviewer           — post-build quality gate (single pass)

L0  @overseer (also spawns for information isolation):
        │
        └── L1  @red-team-lead      — delivery validation (Tier 2+)
                  └── L2  @delivery-validator, @integration-prober, @security-engineer, @ux-craftsman
```

The conductor routes every request to a tier:

| Tier | Pipeline | Validation |
| --- | --- | --- |
| **1** | Overseer → Conductor → Builder | Self-review + tests |
| **2** | Overseer → Conductor → Tech-Leads/Builders → Reviewer → Red Team | Reviewer + Red Team |
| **3** | Tier 2 + enhanced security focus | Red Team with `@security-engineer` |

For Tier 2+ work, the conductor's DESIGN step dispatches `@architect`, `@database-expert`, and `@ux-craftsman` to produce frozen contracts before builders start. All agents share the same workspace (Workspace `inherit`); MECE write scopes keep them from colliding.

---

## Orchestration Layer

### Overseer

**File:** `.agents/agents/overseer.md`

L0 pipeline supervisor. Spawns `@conductor`, monitors progress, handles conductor succession, spawns `@red-team-lead` (for structural information isolation), and reports final results to the user. Owns the pipeline flow loop, not the work.

| Attribute | Details |
| --- | --- |
| **Domain** | Conductor lifecycle, Red Team dispatch, pipeline flow, succession handling, escalation buffer, final reporting, `.agentwork/` cleanup |
| **Boundaries** | No code, no tests, no design or technical decisions, no scope decomposition or tier assessment; spawns only `@conductor` and `@red-team-lead` |
| **Skills** | agent-protocols |

### Conductor

**File:** `.agents/agents/conductor.md`

L1 build orchestrator, spawned by `@overseer`. Elicits requirements, assesses the tier with a 3-signal check (files, scope, risk), decomposes work into MECE scope cards, dispatches tech-leads or builders, drives the build/review convergence loop, and reports completion to `@overseer`.

| Attribute | Details |
| --- | --- |
| **Domain** | Requirement elicitation, tier assessment, scope decomposition, EXPLORE/DESIGN/BUILD/REVIEW dispatch, remediation routing, final reporting |
| **Boundaries** | No code, no tests, no design decisions, no file modifications, no direct codebase exploration (→ `@scout`) or code review (→ `@reviewer`), never spawns `@red-team-lead`, never reports directly to the user |
| **Skills** | parallel-dispatch, structured-spec, agent-protocols, code-review |

### Red Team Lead

**File:** `.agents/agents/red-team-lead.md`

Delivery validation coordinator, activated at Tier 2+ only. Spawned by `@overseer` after build and review with only the original requirements, then dispatches validators (`@delivery-validator`, `@integration-prober`, `@security-engineer`, `@ux-craftsman`) and synthesizes a single verdict.

| Attribute | Details |
| --- | --- |
| **Domain** | Delivery validation orchestration, scope-aware validator selection, cross-card regression, finding synthesis, remediation routing (via `@overseer`) |
| **Boundaries** | No code, no fixes, no development pipeline documents or builder context — pure validation orchestration |
| **Skills** | parallel-dispatch, agent-protocols |

### Delivery Validator

**File:** `.agents/agents/delivery-validator.md`

Runtime delivery verification agent. Boots applications, runs smoke tests, and verifies developer experience.

| Attribute | Details |
| --- | --- |
| **Domain** | Environment bootstrap, boot verification, smoke testing, configuration audit, developer experience, technology currency |
| **Boundaries** | No source code modifications, no test code modifications |
| **Skills** | browser-automation, research-methodology, agent-protocols |

### Integration Prober

**File:** `.agents/agents/integration-prober.md`

External service integration verifier. Validates real service connections (databases, caches, third-party APIs).

| Attribute | Details |
| --- | --- |
| **Domain** | Service connectivity, mock detection, API compatibility, credential validation |
| **Boundaries** | No source code modifications, no credential value inspection |
| **Skills** | research-methodology, agent-protocols |

### Tech Lead

**File:** `.agents/agents/tech-lead.md`

Scope card owner for multi-domain cards. Receives a scope card from `@conductor`, dispatches specialized builders (`@backend-engineer`, `@frontend-engineer`, `@mobile-engineer`, `@test-automation-engineer`) in parallel, writes the integration/wiring code itself, and runs per-card integrity checks before reporting handoff.

| Attribute | Details |
| --- | --- |
| **Domain** | Scope card execution, integration scaffolding (DI, routes, module config), architectural alignment, cross-boundary validation, conflict resolution, code quality & standards |
| **Boundaries** | No primary feature business logic (delegated to builders), no E2E tests (→ `@test-automation-engineer`), no CI/CD runners, no visual UX layouts |
| **Skills** | adr, structured-spec, code-review, sequential-thinking, debugging-protocol, research-methodology, parallel-dispatch, agent-protocols |

---

## Research Layer

### Scout

**File:** `.agents/agents/scout.md`

Read-only research agent. Codebase exploration. Pattern discovery. Technology evaluation. **Never writes code.**

| Attribute | Details |
| --- | --- |
| **Domain** | Codebase exploration, technology research, requirement decomposition, feasibility assessment, pattern discovery |
| **Boundaries** | No code, no tests, no architecture decisions, no reviews, no security audits, no infrastructure, no CI/CD, no UI/UX decisions |
| **Skills** | research-methodology, structured-spec, sequential-thinking, agent-protocols |
| **Output** | Research documents with source, finding, relevance, and confidence |

---

## Design Layer

### Architect

**File:** `.agents/agents/architect.md`

System architect. Production-grade: correct, observable, testable, secure. **Read-only — produces decisions and documentation.**

| Attribute | Details |
| --- | --- |
| **Domain** | System architecture, technical decisions (ADRs), dependency management, performance architecture, API contracts |
| **Boundaries** | No production code, no tests, no CI/CD, no security audits, no UI/UX |
| **Skills** | sequential-thinking, research-methodology, adr, structured-spec, agent-protocols |
| **Output** | Architecture decisions, interface contracts, ADRs |

In `/workflow-team`, the conductor's DESIGN step (Tier 2+) dispatches `@architect` (API contracts, project conventions), `@database-expert` (DB contracts), and `@ux-craftsman` (design spec) whenever their domain appears in the scope cards; the outputs are frozen as contracts for builders.

---

## Builder Layer

### Backend Engineer

**File:** `.agents/agents/backend-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | APIs, business logic, data access, concurrency, observability |
| **Boundaries** | No architecture decisions, no frontend/mobile code, no E2E tests, no migrations, no CI/CD, no security audits |

### Frontend Engineer

**File:** `.agents/agents/frontend-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Vue components, Pinia state management, client routing, API integration, a11y |
| **Boundaries** | No backend code, no mobile code, no database queries, no CI/CD, no security audits, no architecture decisions |

### Mobile Engineer

**File:** `.agents/agents/mobile-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Flutter widgets, Riverpod state, go_router navigation, platform APIs, offline-first data |
| **Boundaries** | No backend code, no web frontend, no database migrations, no CI/CD, no security audits, no architecture decisions |

### Database Expert

**File:** `.agents/agents/database-expert.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Schema design, migrations, query optimization, data integrity, locking/concurrency, capacity, DB-layer security (RLS) |
| **Boundaries** | No application code, no API handlers, no frontend/mobile, no CI/CD, no security audits |

### DevOps Engineer

**File:** `.agents/agents/devops-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | CI/CD pipelines, containers, IaC, monitoring infrastructure, release strategies |
| **Boundaries** | No application code, no database schemas, no frontend/mobile, no security audits, no architecture decisions, no incident response process |

### Technical Writer

**File:** `.agents/agents/technical-writer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | API documentation, architecture docs, user guides, release notes/changelogs, README |
| **Boundaries** | No production code, no test code, no architecture decisions, no security audits, no CI/CD |

### Test Automation Engineer

**File:** `.agents/agents/test-automation-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | E2E tests (UI + API), Playwright, test infrastructure |
| **Boundaries** | No production code, no unit tests (implementation teams own those), no code review, no architecture decisions, no security audits |

### Performance Engineer

**File:** `.agents/agents/performance-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Profiling, benchmarking, load testing, optimization implementation, capacity forecasting |
| **Boundaries** | No feature code, no architecture decisions, no security audits, no database schema design, no CI/CD, no UI/UX |
| **Skills** | guardrails, perf-optimization, structured-spec, research-methodology, chaos-testing, agent-protocols |

### Refactoring Specialist

**File:** `.agents/agents/refactoring-specialist.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Code smell detection, safe transformation, pattern application, metrics tracking |
| **Boundaries** | No new features, no security audits, no infrastructure, no architecture *decisions*, no database schema changes, no CI/CD |
| **Skills** | refactoring-patterns, code-review, guardrails, sequential-thinking, research-methodology, agent-protocols |

---

## Reviewer Layer

### Reviewer

**File:** `.agents/agents/reviewer.md`

Independent quality gate authority. Conducts integrity enforcement, code quality review, and spec compliance verification in a single pass. Read-only — produces verdicts, never code.

| Attribute | Details |
| --- | --- |
| **Domain** | Integrity enforcement, code quality review, spec compliance, gate decisions (PASS/FAIL) |
| **Boundaries** | No production code, no test code, no architecture or design decisions, no file modifications except verdict, no communication with builders during evaluation |
| **Skills** | code-review, structured-spec, sequential-thinking, agent-protocols |

### Security Engineer

**File:** `.agents/agents/security-engineer.md`

Senior security engineer. Security gate authority. **Read-only — produces findings and remediation guidance.**

| Attribute | Details |
| --- | --- |
| **Domain** | Threat modeling, vulnerability assessment, auth review, input validation, security architecture |
| **Boundaries** | No production code, no test code, no CI/CD, no non-security architecture |
| **Skills** | research-methodology, sequential-thinking, supply-chain-security, agent-protocols |

### UX Craftsman

**File:** `.agents/agents/ux-craftsman.md`

UI/UX excellence authority. Produces the design specification in the DESIGN step and validates UX as part of the Red Team.

| Attribute | Details |
| --- | --- |
| **Domain** | Visual craft and design systems, visual consistency, interaction design, design heuristics, accessibility design, responsive design, wireframing |
| **Boundaries** | No production code (review and advise only), no backend, no database, no CI/CD, no security audits |
| **Skills** | browser-automation, frontend-design, mobile-design, research-methodology, sequential-thinking, agent-protocols |

### Incident Responder

**File:** `.agents/agents/incident-responder.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Triage, root cause analysis, mitigation, postmortems, prevention, pre-mortem analysis |
| **Boundaries** | No production code (recommends fixes), no architecture decisions, no CI/CD changes, no security audits, no performance profiling |
| **Skills** | incident-response, debugging-protocol, sequential-thinking, research-methodology, logging-implementation, agent-protocols |

---

## How Agents Collaborate

### Handoff Patterns

Agents reference each other explicitly for handoffs:

- **Discovery → Flagging → Elimination:**
  `@scout` discovers anti-patterns → `@reviewer` flags them with severity → `@refactoring-specialist` eliminates them

- **Research → Design → Build:**
  `@scout` gathers context → `@architect` produces contracts → `@backend-engineer` implements

- **Review → Fix:**
  `@reviewer` produces findings → engineering agents fix issues

- **Profile → Analyze → Optimize:**
  `@performance-engineer` profiles → `@reviewer` reviews data → `@performance-engineer` implements fixes

### Parallel Dispatch

Every persona except the two orchestrators (`@overseer`, `@conductor`) includes a `Parallel Dispatch` section defining:
- **Scope Axis** — how to partition work (by feature, by concern, by module)
- **Write Scope** — files the agent instance owns exclusively
- **Shared Reads** — files the agent can read but not write
- **Constraint** — what prevents cross-instance conflicts
- **Integration** — how parallel results are reconciled

This enables multiple instances of the same agent type to work in parallel without file conflicts.
