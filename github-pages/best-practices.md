---
layout: default
title: Best Practices
nav_order: 7
---

# Best Practices
{: .no_toc }

Tips for getting the most out of Antigravity Setup.
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

| Task | Conversation |
|------|-------------|
| Building a feature | New conversation with `/orchestrator` |
| Fixing a bug | New conversation with `/quick-fix` |
| Reviewing code | New conversation with `/audit` |
| Fixing audit findings | New conversation with `/quick-fix` or `/refactor` |

**Why?** Fresh conversations avoid confirmation bias. An agent reviewing code it just wrote will be less effective than one seeing it for the first time.

### Reference Persisted Artifacts

When starting a fix workflow from audit findings, reference the persisted report:

> "Fix the critical issues in `docs/audits/review-findings-auth-2026-02-15.md`"

The agent can read the file directly — no need to copy-paste findings.

---

## Workflow Selection

### Decision Tree

```
Is this a new feature?
├── Yes → /orchestrator
└── No
    ├── Is it a bug fix?
    │   ├── Known root cause, <50 lines? → /quick-fix
    │   └── Complex or unknown root cause? → /orchestrator (with debugging)
    ├── Is it restructuring?
    │   ├── Specific goal? → /refactor
    │   └── "Find what to improve"? → /audit first, then /refactor
    └── Is it a review? → /audit
```

### Don't Skip the Research Phase

The Research phase (`/1-research`) exists because:
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
2. **Add new rules** — create new `.md` files in `.agent/rules/`
3. **Remove rules** — delete files you don't need (but be careful with mandates)

### Rule Trigger Types

Choose the right trigger for custom rules:

| Trigger | Use When |
|---------|----------|
| `always_on` | The rule should NEVER be violated regardless of context |
| `model_decision` | The rule only matters for certain types of work |

**Example:** A "never use `eval()`" rule should be `always_on`. A "use GraphQL pagination" rule should be `model_decision` with a description mentioning GraphQL.

### Adding Language-Specific Rules

The current rule set is language-agnostic. To add language-specific guidance:

1. Create `.agent/rules/go-specific.md` (or `python-specific.md`, etc.)
2. Set `trigger: model_decision`
3. Add a description like: "When writing Go code"
4. Include language idioms, common pitfalls, and preferred patterns

---

## Skill Usage

### When to Invoke Skills

Skills are not auto-activated — they're procedural guides that the agent follows when certain conditions are met:

| Situation | Skill |
|-----------|-------|
| Debugging a non-obvious failure | Debugging Protocol |
| Making a significant design choice | Sequential Thinking + ADR |
| Writing code (pre/post checklists) | Guardrails |
| Reviewing existing code | Code Review |
| Building web UIs | Frontend Design |
| Building mobile UIs | Mobile Design |

### Combining Skills with Workflows

Some workflows automatically suggest skills:

- `/orchestrator` Phase 1 → **Sequential Thinking** for complex decisions
- `/orchestrator` Phase 2 → **Guardrails** (pre-flight + self-review)
- `/orchestrator` Phase 2 → **Debugging Protocol** if tests fail unexpectedly
- `/audit` Phase 1 → **Code Review** (always)
- `/refactor` Phase 1 → **Sequential Thinking** for multi-step refactoring

---

## Quality Enforcement

### The Code Completion Mandate

Every code task follows: Generate → Validate → Remediate → Verify → Deliver.

**Never skip validation.** The agent will run linters, tests, and builds automatically before marking a task as complete. If you notice it skipping these steps, remind it:

> "Run the full validation suite before marking this complete."

### Coverage Targets

| Layer | Target |
|-------|--------|
| Domain logic (business rules) | >85% |
| Handlers / Controllers | >70% |
| Integration (adapters) | Tested with Testcontainers |
| E2E (critical flows) | At least 1 per feature |

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
The `/orchestrator` workflow forbids phase-skipping. If a phase feels unnecessary, use a specialized workflow instead:
- No integration needed? Use `/quick-fix` (skips integration phase)
- No research needed? Use `/quick-fix` (skips research phase)

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
