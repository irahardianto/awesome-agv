---
layout: default
title: Skills Reference
nav_order: 4
---

# Skills Reference
{: .no_toc }

All 7 specialized skills that extend your agent's capabilities.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What Are Skills?

Skills are folders in `.agent/skills/` that contain structured instructions for specialized tasks. Each skill has a `SKILL.md` file with YAML frontmatter and detailed guidance. More complex skills may include scripts, examples, and resources.

Skills differ from rules in that they are **procedural** — they describe a *process* to follow, not just constraints to respect.

---

## Debugging Protocol

**File:** `.agent/skills/debugging-protocol/SKILL.md`

A systematic protocol for validating root causes of software issues. Instead of guessing, the agent forms hypotheses and tests them methodically.

### When to Use
- Complex bugs with non-obvious causes
- Flaky tests
- Unknown system behavior
- When a quick fix attempt has already failed

### How It Works
1. Observe the symptoms
2. Form hypotheses about root cause
3. Design specific tests for each hypothesis
4. Execute tests and collect evidence
5. Validate the root cause before applying a fix

---

## Frontend Design

**File:** `.agent/skills/frontend-design/SKILL.md`

Guidelines for creating distinctive, production-grade web interfaces. Based on [Anthropic's Frontend-Design Skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design).

### When to Use
- Building websites or landing pages
- Creating dashboards and admin interfaces
- Styling or beautifying existing UIs
- Any frontend work requiring visual polish

### Key Principles
- **Design Thinking** — understand context, audience, and constraints before coding
- **Typography** — distinctive, readable fonts with clear hierarchy
- **Creative Color Palettes** — harmonious, purposeful color use
- **Subtle Animations** — meaningful motion for state changes and interactions
- **Responsive Layouts** — mobile-first, fluid grids

---

## Mobile Design

**File:** `.agent/skills/mobile-design/SKILL.md`

Guidelines for creating distinctive, production-grade mobile interfaces for Flutter and React Native.

### When to Use
- Building mobile app screens or widgets
- Styling mobile interfaces
- Creating visually striking mobile UIs
- Working with Flutter or React Native

### Key Principles
- **Platform Conventions** — iOS (Cupertino) vs Android (Material 3) patterns
- **Typography** — readable at mobile sizes (16px+ body), support dynamic type
- **Light & Dark Themes** — always support both
- **Motion** — meaningful animations under 300ms, respect `reduceMotion`
- **One-Handed Use** — critical actions in thumb-reach zone (bottom 60%)
- **Performance** — `const` constructors, `ListView.builder`, cached images

---

## Sequential Thinking

**File:** `.agent/skills/sequential-thinking/SKILL.md`

A tool for dynamic, reflective problem-solving through iterative thought chains. Adapted from the [Sequential Thinking MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking).

### When to Use
- Complex planning requiring revision
- Multi-step analysis where context maintenance is needed
- Problems requiring branching or backtracking
- Hypothesis verification
- Full scope isn't initially clear

### How It Works
The agent breaks down a complex problem into sequential thoughts, where each thought can:
- Revise previous conclusions
- Branch into alternative approaches
- Backtrack if a path isn't working
- Maintain context across the entire reasoning chain

---

## Code Review

**File:** `.agent/skills/code-review/SKILL.md`

A structured protocol for inspecting code quality against the full awesome-agv rule set. Catches issues that linters miss: architectural violations, missing observability, business logic errors, and pattern inconsistencies.

### When to Use
- During the `/audit` workflow (Phase 1)
- When asked for a code review outside any workflow
- **Best practice:** use in a fresh conversation to avoid confirmation bias

### Review Categories (Priority Order)

| Priority     | Category                                                 | Issues Found                                       |
| ------------ | -------------------------------------------------------- | -------------------------------------------------- |
| **Critical** | Security, Data Loss, Resource Leaks                      | Injection, hardcoded secrets, unclosed connections |
| **Major**    | Testability, Observability, Error Handling, Architecture | Missing interfaces, no logging, empty catch blocks |
| **Minor**    | Pattern Consistency, Naming, Code Organization           | Deviation from codebase patterns, unclear names    |
| **Nit**      | Style, Documentation                                     | Formatting, missing comments                       |

### Severity Tags

| Tag      | Category            |
| -------- | ------------------- |
| `[SEC]`  | Security            |
| `[DATA]` | Data integrity      |
| `[RES]`  | Resource leak       |
| `[TEST]` | Testability         |
| `[OBS]`  | Observability       |
| `[ERR]`  | Error handling      |
| `[ARCH]` | Architecture        |
| `[PAT]`  | Pattern consistency |

### Output
Produces a structured findings document saved to `docs/audits/review-findings-{feature}-{date}.md`.

---

## Guardrails

**File:** `.agent/skills/guardrails/SKILL.md`

Pre-flight checklist and post-implementation self-review protocol. Catches issues that would otherwise only surface during verification.

### When to Use
- **Pre-Flight:** Before writing any code (start of Phase 2: Implement)
- **Self-Review:** After writing code but before verification (end of Phase 2)

### Pre-Flight Checklist
Before writing any code:
- [ ] Identified all applicable rules
- [ ] Searched for existing patterns (Pattern Discovery Protocol)
- [ ] Confirmed project structure alignment
- [ ] Identified I/O boundaries needing abstraction
- [ ] Determined test strategy (unit/integration/E2E)
- [ ] Reviewed rule-priority for potential conflicts

### Post-Implementation Self-Review
After writing code:
- **Security** — no hardcoded secrets, input validated, parameterized queries
- **Testability** — I/O behind interfaces, pure business logic, injected dependencies
- **Observability** — operations logged, structured logging, appropriate levels
- **Error Handling** — explicit error paths, context in errors, resources cleaned up
- **Testing** — happy path, 2+ error paths, edge cases
- **Consistency** — matches codebase patterns (>80%), naming conventions

---

## Architecture Decision Records (ADR)

**File:** `.agent/skills/adr/SKILL.md`

Document significant architectural decisions so institutional knowledge persists across conversations and team members. ADRs capture the **why**, not just the **what**.

### When to Use
- During Research phase when choosing between approaches
- When explicitly asked to document a decision
- When choosing between 2+ viable approaches
- When introducing a new dependency or pattern
- When changing existing architecture

### ADR Template

Each ADR is stored in `docs/decisions/NNNN-short-title.md` and includes:

1. **Context** — what problem are we solving?
2. **Options Considered** — each with pros, cons, and effort
3. **Decision** — which option was chosen and why
4. **Consequences** — positive, negative, and risks

### Process Rules
- Number sequentially
- Never delete ADRs — mark as `Superseded by NNNN`
- Status lifecycle: `Proposed` → `Accepted` → `Deprecated` or `Superseded`
