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

| Component     | Count | Purpose                                                                    |
| ------------- | ----- | -------------------------------------------------------------------------- |
| **Rules**     | 30    | Security, reliability, architecture, maintainability, and DevOps standards |
| **Skills**    | 7     | Specialized capabilities for debugging, design, code review, and more      |
| **Workflows** | 10    | End-to-end development processes from research to ship                     |

## Core Philosophy

> "I recognize that my code will be attacked."

The setup embodies three commitments from the [Rugged Software Constitution](https://github.com/irahardianto/awesome-agv/blob/main/.agent/rules/rugged-software-constitution.md):

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

This means the agent isn't overwhelmed with 30 rules on every task — it gets the critical mandates always, and the contextual principles only when they matter.

## Compatibility

While originally designed for **Antigravity**, the setup is built on standard markdown-based context protocols that are easily portable:

| Tool             | How to Use                                      |
| ---------------- | ----------------------------------------------- |
| **Antigravity**  | Native support via `.agent/` directory          |
| **Roo Code**     | Drop `.agent/` into project root                |
| **Claude Code**  | Drop `.agent/` into project root                |
| **Gemini CLI**   | Ingest rules as custom instructions             |
| **Other agents** | Load `.agent/rules/**` as system prompt context |

## What's Inside

<div class="code-example" markdown="1">

```
.agent/
├── rules/             # 30 rules (mandates + principles)
├── skills/            # 7 specialized skills
└── workflows/         # 10 development workflows
```

</div>

Explore each component in detail:

- [**Rules Reference**](/awesome-agv/rules) — All 30 rules organized by category
- [**Skills Reference**](/awesome-agv/skills) — All 7 specialized skills
- [**Workflows Reference**](/awesome-agv/workflows) — All 10 development workflows
- [**Architecture**](/awesome-agv/architecture) — How the rule system is designed
- [**Best Practices**](/awesome-agv/best-practices) — Tips for getting the most out of the setup
- [**Adapting**](/awesome-agv/adapting) — Customize for your project type
