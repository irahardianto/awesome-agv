---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Install and configure Awesome AGV in minutes.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Prerequisites

- An AI Coding Assistant (Antigravity, Roo Code, Claude Code, Cline, etc.)
- A project where you want to enforce high standards

## Installation

### Option 1: Copy the `.agent` folder

Clone this repository or copy the `.agent` folder into the root of your project:

```sh
# Clone the repo
git clone https://github.com/irahardianto/awesome-agv.git

# Copy the .agent folder into your project
cp -r awesome-agv/.agent /path/to/your-project/
```

### Option 2: Git submodule

Add as a submodule for easy updates:

```sh
cd your-project
git submodule add https://github.com/irahardianto/awesome-agv.git .awesome-agv
ln -s .awesome-agv/.agent .agent
```

## Configuration

### Antigravity / Roo Code / Claude Code

These tools read from the `.agent` directory by default. No additional configuration is needed — just drop the folder in and start coding.

### Gemini CLI

Ingest the rules as custom system prompt context. You can reference individual rule files:

```sh
# Point Gemini CLI to the rules directory
# Refer to Gemini CLI documentation for custom instructions
```

### Other AI Coding Assistants

For any tool that supports custom system prompts or context loading:

1. Load all files from `.agent/rules/` into the system prompt
2. Optionally load `.agent/skills/` for specialized capabilities
3. Optionally load `.agent/workflows/` for structured development processes

## Verifying Installation

After installation, test that your agent is picking up the rules:

1. Ask your agent: *"What rules are you following?"*
2. Check that it mentions the **Rugged Software Constitution** or **Security Mandate**
3. Try writing code and watch for:
   - Automatic input validation on API handlers
   - Structured logging at operation entry points
   - Interface-based I/O abstraction

## What Happens Next?

Once installed, the setup activates automatically:

| Component      | Activation     | Effect                                                                                      |
| -------------- | -------------- | ------------------------------------------------------------------------------------------- |
| **Mandates**   | Always loaded  | Agent always validates code, adds logging, follows security rules                           |
| **Principles** | Contextual     | Agent applies database rules when writing queries, CI/CD rules when editing pipelines, etc. |
| **Skills**     | On demand      | Agent uses debugging protocol when stuck, guardrails before/after writing code              |
| **Workflows**  | Slash commands | Use `/orchestrator` for features, `/quick-fix` for bugs, `/audit` for reviews               |

## Quick Tour

### Try the Feature Workflow

Start building a feature with the structured workflow:

```
/orchestrator
```

This chains the full development lifecycle:
1. **Research** — understand context, search documentation
2. **Implement** — TDD cycle (Red → Green → Refactor)
3. **Integrate** — test with real infrastructure (Testcontainers)
4. **Verify** — full lint, test, and build validation
5. **Ship** — git commit with conventional format

### Try a Quick Fix

For a small bug fix:

```
/quick-fix
```

This skips research and integration, going straight to: Diagnose → Fix + Test → Verify → Ship.

### Try an Audit

Review existing code quality:

```
/audit
```

This produces a structured findings report graded by severity (Critical → Major → Minor → Nit).

## Next Steps

- [**Rules Reference**](/awesome-agv/rules) — Explore all 30 rules
- [**Skills Reference**](/awesome-agv/skills) — Learn about specialized skills
- [**Workflows Reference**](/awesome-agv/workflows) — Understand the development workflows
- [**Adapting**](/awesome-agv/adapting) — Customize for your project type
