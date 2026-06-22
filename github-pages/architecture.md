---
layout: default
title: Architecture
nav_order: 7
---

# Rule System Architecture
{: .no_toc }

How the three-tier loading system is designed and why it works.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Design Philosophy

AI coding agents have a fundamental problem: **context window is finite**. Loading 40+ detailed rule files into every session would consume precious context and overwhelm the model with irrelevant guidance.

Awesome AGV solves this with a **three-tier loading system** inspired by how operating systems handle kernel-mode vs user-mode code — critical operations always run with full privileges, while everything else activates on demand.

The three tiers are:
1. **Mandates** — always-on, loaded every session
2. **Principles** — contextual rules, agent-activated
3. **Skills** — procedural capabilities, loaded by agent or workflow when needed

---

## Tier 1: Mandates (Always-On)

**Trigger:** `always_on` in YAML frontmatter

Mandates are **non-negotiable constraints** loaded in every session. They represent the absolute minimum bar for code quality and security. The agent cannot generate code that violates a mandate.

### Current Mandates

| Mandate                         | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| Rugged Software Constitution    | Core philosophy — defensible, responsible, maintainable |
| Security Mandate                | Never trust input, deny by default, fail closed         |
| Code Completion Mandate         | Always validate code before delivery                    |
| Logging & Observability Mandate | All operations must be logged                           |
| Concurrency & Threading Mandate | Don't over-use concurrency                              |
| Core Design Principles          | SOLID, DRY, YAGNI, KISS                                 |
| Architectural Pattern           | I/O isolation, pure business logic                      |
| Code Organization Principles    | Feature-based organization                              |
| Code Idioms & Conventions       | Idiomatic code for target language                      |
| Project Structure               | Feature-based layout (single source of truth)           |
| Rule Priority                   | Conflict resolution                                     |
| Documentation Principles        | When and how to document code                           |

### Why These Are Always-On

These rules share a common property: **violating them is never acceptable regardless of context**. A SQL injection vulnerability in a database handler is just as critical as one in an API endpoint. Logging should happen whether you're building a REST API or a CLI tool.

---

## Tier 2: Principles (Contextual)

**Trigger:** `model_decision` in YAML frontmatter

Principles are **detailed guidance** activated only when the agent determines they are relevant to the current task. This reduces noise and lets the agent focus on what matters.

### Current Principles

| Principle                          | Activates When                             |
| ---------------------------------- | ------------------------------------------ |
| Security Principles                | Implementing auth, validation, crypto      |
| Error Handling Principles          | Working with error types, recovery         |
| Concurrency & Threading Principles | Writing async, threaded, or parallel code  |
| Performance Optimization           | Profiling, benchmarking, critical paths    |
| Resource & Memory Management       | Files, connections, pools, cleanup         |
| Monitoring & Alerting              | Health checks, metrics, circuit breakers   |
| Configuration Management           | Env vars, secrets, config files            |
| API Design Principles              | REST endpoints, handlers, middleware       |
| Database Design Principles         | Schema, migrations, queries, transactions  |
| Data Serialization                 | JSON, XML, YAML, protobuf                  |
| Command Execution                  | Shell scripts, external processes          |
| Testing Strategy                   | Writing tests, test organization           |
| Dependency Management              | Package management, version pinning        |
| Logging & Observability Principles | Implementation guide (via skill)           |
| Accessibility Principles           | WCAG, semantic HTML, ARIA                  |
| Git Workflow Principles            | Commits, branches, PRs                     |

{: .note }
> **Language idioms, project layouts, CI/CD, and Feature Flags are Tier 3 Skills — not Tier 2 Principles.**
> They were migrated from `.agents/rules/` to `.agents/skills/` to reduce context window pressure and improve modularity. See the [Skills Reference](/awesome-agv/skills) for details.

### How Context Activation Works

The AI agent reads the `description` field in each principle's YAML frontmatter and decides whether it's relevant to the current task:

```yaml
---
trigger: model_decision
description: When designing database schemas, writing migrations,
  creating queries, or working with transaction boundaries
---
```

If the agent is writing a database migration, it activates this principle. If it's styling a button, it doesn't.

---

## Rule Priority

When rules conflict, the priority system resolves them:

```
1. Security Mandate          ← Always wins
2. Rugged Software Constitution
3. Code Completion Mandate
4. Testability-First Design
5. Feature-specific principles
6. PRD-gated principles      ← Only when PRD requires it
7. YAGNI / KISS              ← Only when no other trade-off exists
```

### Common Conflict Examples

| Conflict                                          | Winner            | Reasoning                          |
| ------------------------------------------------- | ----------------- | ---------------------------------- |
| YAGNI vs Security ("skip input validation")       | **Security**      | Input validation is always needed  |
| KISS vs Testability ("interfaces add complexity") | **Testability**   | Interfaces enable testing          |
| Performance vs YAGNI ("optimize now?")            | **Measure first** | Only optimize after profiling      |
| DRY vs Clarity ("abstract into utility?")         | **Clarity**       | Until 3+ instances (Rule of Three) |
| Speed vs Logging ("skip logging to ship faster")  | **Logging**       | Silent failures are the enemy      |

---

## Relationship Between Components

```
┌───────────────────────────────────────────┐
│  Workflows                                  │
│  (Orchestrate the development lifecycle)    │
│                                             │
│  /workflow-solo → phases → ship            │
│  /workflow-team → agents → primitives       │
├───────────────────────────────────────────┤
│  Tier 3: Skills (50)                        │
│  (Procedural capabilities, on demand)       │
│                                             │
│  Language Idioms (24), parallel-dispatch,   │
│  debugging-protocol, code-review, adr,      │
│  ci-cd, feature-flags, perf-optimization... │
├───────────────────────────────────────────┤
│  Tier 2: Principles (16)                    │
│  (Contextual rules, agent-activated)        │
│                                             │
│  Security Principles, Database Design,      │
│  Testing Strategy, API Design...            │
├───────────────────────────────────────────┤
│  Tier 1: Mandates (12)                      │
│  (Always-on, non-negotiable constraints)    │
│                                             │
│  Security Mandate, Code Completion Mandate, │
│  Logging Mandate, Core Design Principles    │
└───────────────────────────────────────────┘
```

- **Mandates (Tier 1)** form the foundation — always active
- **Principles (Tier 2)** sit above, activated by context
- **Skills (Tier 3)** are procedural capabilities: language idioms, CI/CD patterns, parallel dispatch, debugging protocols, and more
- **Workflows** orchestrate everything into structured development cycles

---

## Extending the System

### Adding a New Rule

1. Create a markdown file in `.agents/rules/`
2. Add YAML frontmatter with `trigger: always_on` or `trigger: model_decision`
3. For conditional rules, add a `description` that tells the agent when to activate
4. Add the rule to the appropriate category

### Adding a New Skill

1. Create a directory in `.agents/skills/{skill-name}/`
2. Create `SKILL.md` with YAML frontmatter (`name`, `description`)
3. Add detailed instructions, templates, and examples
4. Optionally add `scripts/`, `examples/`, or `resources/` directories

### Adding a New Workflow

1. Create a markdown file in `.agents/workflows/`
2. Add YAML frontmatter with a `description`
3. Define phases with clear completion criteria
4. Reference applicable rules and skills
