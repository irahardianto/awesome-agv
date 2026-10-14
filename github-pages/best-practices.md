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

When starting a fix (`/bugfix` or `/refactor`) from audit findings, reference the persisted report:

> "Fix the critical issues in `docs/audits/review-findings-auth-2026-02-15-1430.md`"

The agent can read the file directly — no need to copy-paste findings.

---

## Choosing a Command Skill

Command skills (formerly workflows) are the slash-command entry points listed in the [Command Skills Reference](/awesome-agv/workflows).

### Decision Tree

```
Is this a new feature?
├── Yes
│   ├── >10 files, 3+ modules, security/data risk, or needs adversarial review? → /workflow-team
│   └── Otherwise → /workflow-solo
└── No
    ├── Is it a bug fix (any size, incl. unknown root cause)? → /bugfix
    ├── Is it restructuring?
    │   ├── Specific goal? → /refactor
    │   └── "Find what to improve"? → /audit first, then /refactor
    ├── Is it a review?
    │   ├── General quality review → /audit
    │   └── Security-only deep dive → /security-audit
    ├── Is it a performance problem? → /perf-optimize
    └── Is it test coverage on existing code? → /test-unit, /test-integration, /test-e2e, /test-scenarios
```

### Don't Skip the Research Phase

The RESEARCH phase (inside `/workflow-solo`) runs on the Standard and Thorough tracks — only the Light track (small, low-risk, familiar work) skips it. It exists because:
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

Awesome AGV already includes dedicated idiom skills for Go, TypeScript, Vue, Flutter, Rust, and Python, plus 21 community language and framework skills. To customize:

1. **Edit the existing idiom skill** — e.g., `.agents/skills/go-idioms/SKILL.md` to add team-specific conventions
2. **Swap an idiom skill** — e.g., use the bundled `react-idioms` instead of `vue-idioms` if you use React
3. **Add a new language** — create `.agents/skills/{lang}-idioms/SKILL.md` with appropriate sections
4. **Follow the naming convention** — `code-idioms-and-conventions.md` loads `.agents/skills/{language}-idioms/SKILL.md` by convention, so no registration table is needed; give the skill a clear `description` so the agent knows when to load it

See [Adapting — Changing the Default Framework](/awesome-agv/adapting#changing-the-default-framework) for a full guide.

---

## Skill Usage

### When to Invoke Skills

Knowledge skills are loaded on demand — the agent reads one when its `description` matches the task. Command skills are different: they set `disable-model-invocation: true` and only run when you type their slash command. Typical matches:

| Situation                          | Skill                     |
| ---------------------------------- | ------------------------- |
| Debugging a non-obvious failure    | Debugging Protocol        |
| Making a significant design choice | Sequential Thinking + ADR |
| Writing code (pre/post checklists) | Guardrails                |
| Reviewing existing code            | Code Review               |
| Building web UIs                   | Frontend Design           |
| Building mobile UIs                | Mobile Design             |

### Combining Skills with Command Skills

Command skills point to knowledge skills at specific phases:

- `/workflow-solo` RESEARCH → **Research Methodology**, **Sequential Thinking**, **ADR**
- `/workflow-solo` IMPLEMENT → **Guardrails** (pre-flight + self-review), **Sequential Thinking**, **Debugging Protocol** if tests fail unexpectedly
- `/workflow-solo` VERIFY (Thorough track) → **Testing Strategy** for integration infrastructure, **Browser Automation** for E2E
- `/bugfix` Diagnose → **Debugging Protocol** for non-obvious root causes
- `/audit` Multi-Dimensional Audit Scan → dimension subagents load **Code Review** language modules for anti-patterns
- `/refactor` Impact Analysis → **Sequential Thinking** for multi-step refactoring

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
`/workflow-solo` already right-sizes the process: it routes each task to a Light, Standard, or Thorough track (only Light skips RESEARCH), and every phase has a gate that must pass before the next one starts. Don't skip phases beyond what the track allows. If the process still feels too heavy, use a leaner command skill instead:
- Bug fix, not a new feature? Use `/bugfix` (lean 3-phase flow without research overhead)

### 3. Mixing Concerns in Conversations
One conversation = one command skill = one purpose. Don't audit and fix in the same conversation.

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
| Work spans >10 files or touches 3+ modules | `/workflow-team` |
| Involves security or data risk (auth, migrations, public API) | `/workflow-team` |
| Needs adversarial review (independent `@reviewer` + Red Team) | `/workflow-team` |
| Smaller feature (single module, familiar patterns) | `/workflow-solo` |
| Bug fix (any complexity) | `/bugfix` |

### Parallel Dispatch Tips

- **Stagger dispatch:** The pipeline dispatches at most 3 agents at once; 4+ go out in batches of 3
- **MECE is non-negotiable:** Every file must be assigned to exactly one write-agent. All agents share one workspace (`inherit`), so overlapping write scopes clobber each other
- **Integration belongs to the tech-lead:** Builders implement domain logic; the card's `@tech-lead` writes the wiring (DI, routes, module config)
- **Partition large reviews:** `@reviewer` runs a single pass, but can be dispatched as `@reviewer[auth]` + `@reviewer[tasks]` over MECE partitions of the codebase

### Agent Composition

- **SCOUT when the domain is unclear** — EXPLORE is optional; scouts give build agents context they would otherwise lack
- **DESIGN before BUILD** (Tier 2+) — `@architect`, `@database-expert`, and `@ux-craftsman` produce contracts that are frozen before builders start. Skipping DESIGN leads to integration failures
- **PRE-MORTEM for high-risk features** — `@incident-responder` identifies failure modes in proposed designs before code is written, saving expensive rework
- **Security validation at Tier 3** — for security-critical work, the Red Team includes `@security-engineer`

