---
layout: default
title: Best Practices
nav_order: 8
---

# Best Practices
{: .no_toc }

Tips for getting the most out of Awesome AGV.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Conversation Management

### Use Fresh Conversations for Different Tasks

Each conversation should have a single, focused purpose:

| Task                  | Conversation                                      |
| --------------------- | ------------------------------------------------- |
| Building a feature    | New conversation with `/workflow-solo`             |
| Fixing a bug          | New conversation with `/bugfix`                |
| Reviewing code        | New conversation with `/audit`                    |
| Fixing audit findings | New conversation with `/bugfix` or `/refactor` |

**Why?** Fresh conversations avoid confirmation bias. An agent reviewing code it just wrote will be less effective than one seeing it for the first time.

### Reference Persisted Artifacts

When starting a fix workflow from audit findings, reference the persisted report:

> "Fix the critical issues in `docs/audits/review-findings-auth-2026-02-15-1430.md`"

The agent can read the file directly — no need to copy-paste findings.

---

## Workflow Selection

### Decision Tree

```
Is this a new feature?
├── Yes → /workflow-solo
└── No
    ├── Is it a bug fix?
    │   ├── Bug fix? → /bugfix
    │   └── Complex or unknown root cause? → /workflow-solo (with debugging)
    ├── Is it restructuring?
    │   ├── Specific goal? → /refactor
    │   └── "Find what to improve"? → /audit first, then /refactor
    └── Is it a review? → /audit
```

### Don't Skip the Research Phase

The Research phase (`/phase-research`) exists because:
- AI agents produce better code when they understand the full context
- Documentation search prevents relying on stale training data
- Research logs create institutional knowledge for future conversations

### Trust the TDD Cycle

The Implement phase enforces Red → Green → Refactor. This isn't ceremonial:
- **Red** — confirms your test actually tests something
- **Green** — delivers the simplest working solution
- **Refactor** — improves structure with confidence (tests catch regressions)

---

## Rule Customization

### Modifying Rules for Your Team

Rules are plain markdown files. To customize:

1. **Edit existing rules** — adjust thresholds, add team-specific conventions
2. **Add new rules** — create new `.md` files in `.agents/rules/`
3. **Remove rules** — delete files you don't need (but be careful with mandates)

### Rule Trigger Types

Choose the right trigger for custom rules:

| Trigger          | Use When                                                |
| ---------------- | ------------------------------------------------------- |
| `always_on`      | The rule should NEVER be violated regardless of context |
| `model_decision` | The rule only matters for certain types of work         |

**Example:** A "never use `eval()`" rule should be `always_on`. A "use GraphQL pagination" rule should be `model_decision` with a description mentioning GraphQL.

### Customizing Language-Specific Rules

Awesome AGV already includes dedicated idiom files for Go, TypeScript, Vue, Flutter, Rust, and Python. To customize:

1. **Edit the existing idiom file** — e.g., `go-idioms-and-patterns.md` to add team-specific conventions
2. **Replace an idiom file** — swap `vue-idioms-and-patterns.md` for a React file if you use React
3. **Add a new language** — create `.agents/rules/{lang}-idioms-and-patterns.md` with `trigger: model_decision`
4. **Register in** `code-idioms-and-conventions.md` — add a row to the language table so the agent knows when to activate it

See [Adapting — Changing the Default Framework](/awesome-agv/adapting#changing-the-default-framework) for a full guide.

---

## Skill Usage

### When to Invoke Skills

Skills are not auto-activated — they're procedural guides that the agent follows when certain conditions are met:

| Situation                          | Skill                     |
| ---------------------------------- | ------------------------- |
| Debugging a non-obvious failure    | Debugging Protocol        |
| Making a significant design choice | Sequential Thinking + ADR |
| Writing code (pre/post checklists) | Guardrails                |
| Reviewing existing code            | Code Review               |
| Building web UIs                   | Frontend Design           |
| Building mobile UIs                | Mobile Design             |

### Combining Skills with Workflows

Some workflows automatically suggest skills:

- `/workflow-solo` Phase 1 → **Sequential Thinking** for complex decisions
- `/workflow-solo` Phase 2 → **Guardrails** (pre-flight + self-review)
- `/workflow-solo` Phase 2 → **Debugging Protocol** if tests fail unexpectedly
- `/audit` Phase 1 → **Code Review** (always)
- `/refactor` Phase 1 → **Sequential Thinking** for multi-step refactoring

---

## Quality Enforcement

### The Code Completion Mandate

Every code task follows: Generate → Validate → Remediate → Verify → Deliver.

**Never skip validation.** The agent will run linters, tests, and builds automatically before marking a task as complete. If you notice it skipping these steps, remind it:

> "Run the full validation suite before marking this complete."

### Coverage Targets

| Layer                         | Target                     |
| ----------------------------- | -------------------------- |
| Domain logic (business rules) | >85%                       |
| Handlers / Controllers        | >70%                       |
| Integration (adapters)        | Tested with Testcontainers |
| E2E (critical flows)          | At least 1 per feature     |

### Testing Hierarchy

```
E2E Tests (few, expensive, full stack)
    ↑
Integration Tests (some, Testcontainers)
    ↑
Unit Tests (many, fast, mocked I/O)
```

Most tests should be unit tests. Integration tests verify adapters. E2E tests verify user journeys.

---

## Project Structure

### Feature-Based Organization

The setup enforces **feature-based organization** (vertical slices), not layer-based:

```
# ✅ Correct: Feature-based
features/
  task/
    handler.go
    logic.go
    storage.go
    models.go
  order/
    handler.go
    logic.go
    storage.go

# ❌ Wrong: Layer-based
controllers/
  task_controller.go
  order_controller.go
models/
  task.go
  order.go
services/
  task_service.go
```

### Why Feature-Based?

- Each feature is a self-contained vertical slice
- Changes to "task" don't touch "order" directories
- Features can have different testing strategies
- Features can be independently deployed (microservices)
- Feature boundaries are clear public APIs

---

## Common Pitfalls

### 1. Overriding Mandates
Don't override `always_on` rules without understanding the consequences. Security and logging mandates exist for critical reasons.

### 2. Skipping Phases for Speed
The `/workflow-solo` workflow forbids phase-skipping. If a phase feels unnecessary, use a specialized workflow instead:
- Bug fix, not a new feature? Use `/bugfix` (lean 3-phase flow without research overhead)

### 3. Mixing Concerns in Conversations
One conversation = one workflow = one purpose. Don't audit and fix in the same conversation.

### 4. Ignoring Research Logs
Research logs in `docs/research_logs/` serve as institutional memory. Future conversations can reference them instead of re-researching the same topics.

### 5. Not Running Verification
The verify phase catches issues that are invisible during implementation:
- Linter errors
- Type errors (in TypeScript)
- Race conditions (with `-race` flag in Go)
- Security vulnerabilities (with `gosec`)

Always run full verification before shipping.

---

## Multi-Agent Orchestration

### When to Use `/workflow-team` vs `/workflow-solo`

| Situation | Recommendation |
| --- | --- |
| Single-domain feature (backend only, frontend only) | `/workflow-solo` |
| Cross-domain feature (backend + frontend + database) | `/workflow-team` |
| Feature needing specialized review (security, UX) | `/workflow-team` |
| Bug fix (any complexity) | `/bugfix` |
| Solo developer, quick iteration | `/workflow-solo` |
| Team project, parallel work streams | `/workflow-team` |

### Parallel Dispatch Tips

- **Start small:** Use 2-3 parallel agents before scaling to 5+
- **MECE is non-negotiable:** Every file must be assigned to exactly one write-agent. Overlap = merge conflicts
- **Integration tasks are separate:** After parallel agents complete, dispatch a dedicated `[integration]` agent to wire modules together
- **Review in parallel too:** Dispatch `@qa-analyst[auth]` + `@qa-analyst[tasks]` to review parallel branches simultaneously

### Agent Composition

- **Always SCOUT first** — research agents provide context that makes build agents more effective
- **DESIGN before BUILD** — architect produces contracts, builders consume them. Skipping DESIGN leads to integration failures
- **PRE-MORTEM for high-risk features** — `@incident-responder` identifies failure modes before code is written, saving expensive rework
- **Cross-layer experts in DESIGN** — pull `@database-expert` or `@security-engineer` into the design phase for data-heavy or security-sensitive features

