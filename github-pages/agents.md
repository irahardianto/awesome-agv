---
layout: default
title: Agent Personas
nav_order: 6
---

# Agent Personas
{: .no_toc }

16 specialized agent personas for multi-agent orchestration via `/workflow-team`.
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

Personas are consumed by the `/workflow-team` pipeline manager, which dispatches them as sub-agents. They enforce **MECE** (Mutually Exclusive, Collectively Exhaustive) boundaries — every agent knows exactly what it owns and what it must not touch.

---

## Layer Architecture

Agents are organized into five layers:

```
┌─────────────────────────────────────────────────────┐
│  Orchestration Layer                                │
│  @tech-lead                                         │
├─────────────────────────────────────────────────────┤
│  Research Layer (Read-only)                         │
│  @scout                                             │
├─────────────────────────────────────────────────────┤
│  Design Layer (Read-only, produces decisions)       │
│  @architect + cross-layer experts                   │
├─────────────────────────────────────────────────────┤
│  Builder Layer (Write, run in worktrees)            │
│  @backend-engineer, @frontend-engineer,             │
│  @mobile-engineer, @database-expert,                │
│  @devops-engineer, @technical-writer,               │
│  @test-automation-engineer,                         │
│  @performance-engineer, @refactoring-specialist     │
├─────────────────────────────────────────────────────┤
│  Reviewer Layer (Read-only, post-merge)             │
│  @qa-analyst, @security-engineer,                   │
│  @ux-reviewer, @incident-responder                  │
└─────────────────────────────────────────────────────┘
```

---

## Orchestration Layer

### Tech Lead

**File:** `.agents/agents/tech-lead.md`

Anchor persona for multi-agent orchestration. Elicits requirements, composes workflow primitives, enforces standards, and owns all quality gates. **Present at every pipeline stage.**

| Attribute | Details |
| --- | --- |
| **Domain** | Codebase integrity, architectural alignment, contract validation, merge/conflict resolution |
| **Boundaries** | No production code, no tests — pure orchestration and quality gating |
| **Skills** | code-review, guardrails, sequential-thinking |

---

## Research Layer

### Scout

**File:** `.agents/agents/scout.md`

Read-only research agent. Codebase exploration. Pattern discovery. Technology evaluation. **Never writes code.**

| Attribute | Details |
| --- | --- |
| **Domain** | Codebase exploration, technology research, requirement decomposition, feasibility assessment, pattern discovery |
| **Boundaries** | No code, no tests, no architecture decisions, no reviews, no security audits |
| **Skills** | research-methodology, sequential-thinking |
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
| **Skills** | research-methodology, adr |
| **Output** | Architecture decisions, interface contracts, ADRs |

Cross-layer experts (`@ux-reviewer`, `@database-expert`, `@security-engineer`, `@performance-engineer`) can join DESIGN workflows when invoked.

---

## Builder Layer

### Backend Engineer

**File:** `.agents/agents/backend-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | APIs, business logic, concurrency, observability |
| **Boundaries** | No frontend, no mobile, no infrastructure, no security audits |

### Frontend Engineer

**File:** `.agents/agents/frontend-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Web UI, components, state management, a11y |
| **Boundaries** | No backend, no mobile, no infrastructure, no security audits |

### Mobile Engineer

**File:** `.agents/agents/mobile-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Flutter/RN, widgets, platform APIs, offline-first |
| **Boundaries** | No backend, no web frontend, no infrastructure |

### Database Expert

**File:** `.agents/agents/database-expert.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Schema design, migrations, queries, indexes, ERD |
| **Boundaries** | No application code, no UI, no CI/CD |

### DevOps Engineer

**File:** `.agents/agents/devops-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | CI/CD pipelines, containers, IaC, monitoring |
| **Boundaries** | No application code, no UI, no security audits beyond infra |

### Technical Writer

**File:** `.agents/agents/technical-writer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Docs, API documentation, changelogs, README, user guides |
| **Boundaries** | No production code, no tests, no architecture decisions |

### Test Automation Engineer

**File:** `.agents/agents/test-automation-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | E2E tests (UI + API), Playwright, test infrastructure |
| **Boundaries** | No production code, no architecture decisions, no security audits |

### Performance Engineer

**File:** `.agents/agents/performance-engineer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Profiling, benchmarking, load testing, optimization implementation |
| **Boundaries** | No feature code, no architecture decisions, no security audits |
| **Skills** | perf-optimization, research-methodology, chaos-testing |

### Refactoring Specialist

**File:** `.agents/agents/refactoring-specialist.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Code smell detection, safe transformation, pattern application, metrics tracking |
| **Boundaries** | No new features, no security audits, no architecture *decisions* |
| **Skills** | refactoring-patterns, code-review, guardrails, sequential-thinking |

---

## Reviewer Layer

### QA Analyst

**File:** `.agents/agents/qa-analyst.md`

Senior QA analyst. Quality gate authority. **Read-only — produces findings, never code.**

| Attribute | Details |
| --- | --- |
| **Domain** | Code review, quality gates, defect analysis, performance data review, test coverage verification |
| **Boundaries** | No production code, no test code (review only), no architecture decisions |
| **Skills** | code-review, debugging-protocol, perf-optimization, sequential-thinking |

### Security Engineer

**File:** `.agents/agents/security-engineer.md`

Senior security engineer. Security gate authority. **Read-only — produces findings and remediation guidance.**

| Attribute | Details |
| --- | --- |
| **Domain** | Threat modeling, vulnerability assessment, auth review, input validation, security architecture |
| **Boundaries** | No production code, no test code, no CI/CD, no non-security architecture |
| **Skills** | research-methodology, sequential-thinking, supply-chain-security |

### UX Reviewer

**File:** `.agents/agents/ux-reviewer.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Design heuristics, interaction patterns, a11y, responsive design |
| **Boundaries** | No production code, no backend, no security |

### Incident Responder

**File:** `.agents/agents/incident-responder.md`

| Attribute | Details |
| --- | --- |
| **Domain** | Triage, root cause analysis, mitigation, postmortems, pre-mortem analysis |
| **Boundaries** | No feature code, no architecture decisions beyond incident scope |
| **Skills** | incident-response, debugging-protocol, sequential-thinking |

---

## How Agents Collaborate

### Handoff Patterns

Agents reference each other explicitly for handoffs:

- **Discovery → Flagging → Elimination:**
  `@scout` discovers anti-patterns → `@qa-analyst` flags them with severity → `@refactoring-specialist` eliminates them

- **Research → Design → Build:**
  `@scout` gathers context → `@architect` produces contracts → `@backend-engineer` implements

- **Review → Fix:**
  `@qa-analyst` produces findings → engineering agents fix issues

- **Profile → Analyze → Optimize:**
  `@performance-engineer` profiles → `@qa-analyst` reviews data → `@performance-engineer` implements fixes

### Parallel Dispatch

Each agent persona includes a `Parallel Dispatch` section defining:
- **Scope Axis** — how to partition work (by feature, by concern, by module)
- **Write Scope** — files the agent instance owns exclusively
- **Shared Reads** — files the agent can read but not write
- **Constraint** — what prevents cross-instance conflicts
- **Integration** — how parallel results are reconciled

This enables multiple instances of the same agent type to work in parallel without file conflicts.
