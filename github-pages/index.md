---
layout: default
title: Home
nav_order: 1
permalink: /
---

# Awesome AGV
{: .fs-9 }

A rugged, high-quality configuration suite for AI Agents.
{: .fs-6 .fw-300 }

[Get Started](/awesome-agv/getting-started){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/irahardianto/awesome-agv){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## What is Awesome AGV?

Awesome AGV is a comprehensive set of standards and practices designed to elevate the capabilities of AI coding agents. Instead of just generating code that works, the rules and skills ensure agents generate code that **survives** — code that is secure, defensible, and maintainable.

The setup is built on the [Rugged Software Manifesto](https://ruggedsoftware.org/), ensuring every line of generated code is treated as if it will be attacked, maintained by strangers, and running in production for years.

## At a Glance

| Component     | Count | Purpose                                                                           |
| ------------- | ----- | --------------------------------------------------------------------------------- |
| **Rules**     | 42    | Security, reliability, architecture, maintainability, language idioms, and DevOps |
| **Skills**    | 8     | Specialized capabilities for debugging, design, performance optimization, and more |
| **Workflows** | 11    | End-to-end development processes from research to ship                             |

## Core Philosophy

> "I recognize that my code will be attacked."

The setup embodies three commitments from the [Rugged Software Constitution](https://github.com/irahardianto/awesome-agv/blob/main/.agents/rules/rugged-software-constitution.md):

1. **I Am Responsible** — No "happy path" code. Every input is assumed malformed or malicious.
2. **I Am Defensible** — Code validates its own state. Failures are secure (closed), never undefined.
3. **I Am Maintainable** — Clarity over cleverness. Code is written for the human reading it next year.

## How It Works

The setup uses a **two-tier rule system** to minimize noise while maximizing coverage:

### Mandates (Always-On)
Non-negotiable constraints loaded in every session. These fire regardless of context:
- Security Mandate
- Rugged Software Constitution
- Code Completion Mandate
- Logging & Observability Mandate
- Concurrency & Threading Mandate

### Principles (Contextual)
Detailed guidance activated only when the agent is working on relevant areas:
- Database rules activate when writing queries
- CI/CD rules activate when editing pipelines
- Accessibility rules activate when building UIs

This means the agent isn't overwhelmed with 42 rules on every task — it gets the critical mandates always, and the contextual principles only when they matter.

## Opinionated Defaults

Awesome AGV ships with **opinionated technology choices** for each layer of the stack. Each has a dedicated idiom file with patterns, tooling, and verification commands:

| Stack            | Default Choice                                      |
| ---------------- | --------------------------------------------------- |
| **Backend**      | Go — vanilla stdlib, minimal deps                   |
| **Frontend**     | TypeScript + Vue 3 — Composition API, Pinia, Vitest |
| **Mobile**       | Flutter + Riverpod — freezed models, go_router      |
| **Systems**      | Rust — tokio, thiserror/anyhow, clippy pedantic     |
| **Scripting/AI** | Python — ruff, mypy strict, pytest, Pydantic        |

These are starting points, not constraints. Idiom files are modular — swap or edit them to match your stack. See [Adapting](/awesome-agv/adapting) for details.

## Compatibility

While originally designed for **Antigravity**, the setup is built on standard markdown-based context protocols that are easily portable:

| Tool             | How to Use                                        |
| ---------------- | ------------------------------------------------- |
| **Antigravity**  | Native support via `.agents/` directory           |
| **Roo Code**     | Drop `.agents/` into project root                 |
| **Claude Code**  | Drop `.agents/` into project root                 |
| **Gemini CLI**   | Ingest rules as custom instructions               |
| **Other agents** | Load `.agents/rules/**` as system prompt context  |

## What's Inside

<div class="code-example" markdown="1">

```
.agents/
├── rules/             # 42 rules (mandates + principles + language idioms)
├── skills/            # 8 specialized skills
└── workflows/         # 11 development workflows
```

</div>

Explore each component in detail:

- [**Rules Reference**](/awesome-agv/rules) — All 42 rules organized by category
- [**Skills Reference**](/awesome-agv/skills) — All 8 specialized skills
- [**Workflows Reference**](/awesome-agv/workflows) — All 11 development workflows
- [**Architecture**](/awesome-agv/architecture) — How the rule system is designed
- [**Best Practices**](/awesome-agv/best-practices) — Tips for getting the most out of the setup
- [**Adapting**](/awesome-agv/adapting) — Customize for your project type
