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

### Option 1: Quick Install (Recommended)

```sh
npx awesome-agv
```

This launches an interactive installer where you choose your installation mode:

| Mode | Description |
|---|---|
| 🚀 **Default** | Install everything — the full arsenal (recommended) |
| 🎯 **Curated** | Pick your languages & frameworks. Core rules and skills always included. |
| ⚙️ **Advanced** | Full granular control over every component. |

In **Curated** and **Advanced** modes, the installer auto-detects your project's tech stack from files like `go.mod`, `Cargo.toml`, `tsconfig.json`, `pubspec.yaml`, etc. and pre-selects matching stacks.

**CLI Flags:**

| Flag | Description |
| --- | --- |
| `--stacks <list>` | Comma-separated stacks to include (**additive** with existing config) |
| `--all` | Install everything (equivalent to Default mode) |
| `--force, -f` | Skip the overwrite prompt and ignore the saved `.agvrc` (fresh selection). The existing `.agents/` is still backed up and your custom items are still carried over. |
| `--help, -h` | Show help |

**Environment variable:** set `AGV_LOCAL_TARBALL=/path/to/archive.tar.gz` to install from a local archive instead of downloading from GitHub (offline or air-gapped setups, testing a fork). The archive must contain `awesome-agv-main/.agents/` and `awesome-agv-main/agv.config.json`, which is the layout of GitHub's branch download.

**Examples:**

```bash
# Interactive — choose your mode
npx awesome-agv

# Non-interactive: specific stacks, core always included
npx awesome-agv --stacks go,python

# Add React to existing installation (additive)
npx awesome-agv --stacks react

# Full install, no prompts
npx awesome-agv --all --force

# CI/CD: specific stacks, no prompts
npx awesome-agv --stacks typescript,vue --force
```

Re-running the installer on a project that already has `.agents/` is safe: the previous copy is backed up first and your own skills, rules and agents are kept. See [Upgrading from v3.x](#upgrading-from-v3x) for details.

### Option 2: Copy the `.agents` folder

Clone this repository or copy the `.agents` folder into the root of your project:

```sh
# Clone the repo
git clone https://github.com/irahardianto/awesome-agv.git

# Copy the .agents folder into your project
cp -r awesome-agv/.agents /path/to/your-project/
```

### Option 3: Git submodule

Add as a submodule and symlink `.agents` to it:

```sh
cd your-project
git submodule add https://github.com/irahardianto/awesome-agv.git .awesome-agv
ln -s .awesome-agv/.agents .agents
```

Update with `git submodule update --remote .awesome-agv`.

{: .warning }
> Don't run `npx awesome-agv` in a submodule setup. The installer refuses to write through a symlinked `.agents/` and exits without changing anything. This setup always gives you every stack, and custom skills have to live outside the symlinked folder.

## Upgrading from v3.x

v4.0.0 turns the 11 workflows into **command skills**. Antigravity has deprecated workflows (the `.agents/workflows` folder) and retires them on November 1, 2026; recent `agy` CLI builds no longer register them as slash commands.

**What stays the same:** you run every command the same way, e.g. `/workflow-solo`, `/workflow-team`, `/audit`, `/bugfix`. Rules, agents, knowledge skills and the phases inside each command are unchanged.

**What changes:**

| v3.x | v4.0.0 |
| --- | --- |
| `<name>.md` in the `.agents/workflows` folder | `.agents/skills/<name>/SKILL.md` |
| Workflow frontmatter: `description` only | `name`, `description`, `disable-model-invocation: true` |
| `code-audit` skill (audit reference material) | Folded into `.agents/skills/audit/references/` |
| `// turbo` / `// turbo-all` auto-run markers | Removed. They have no effect in skills; use Antigravity's command permission settings instead. |

`disable-model-invocation: true` keeps command skills out of the model's skill catalog, so agents and subagents never start a command on their own. Each command skill also opens with an entry-point guard telling spawned subagents not to execute it. Only you can start one.

### Upgrade with the installer

```sh
npx awesome-agv@latest
```

`@latest` avoids an older copy cached by `npx`. If a saved `.agvrc` is found, the installer offers to reinstall with the same stacks; non-interactive runs update automatically. Then it:

1. **Backs up** your current `.agents/` to `.agv-backup/agents-<timestamp>/`. The 5 most recent backups are kept; older ones are deleted.
2. **Installs** the new `.agents/` and replaces each built-in workflow with the command skill of the same name.
3. **Carries over** your own skills, rules and agents, meaning anything whose name isn't shipped upstream. They're listed as "Preserved custom items".
4. **Lists custom workflows** it found but did not carry over. They stay in the backup; see [converting them](#converting-a-custom-workflow) below.
5. **Adds** `.agentwork/` and `.agv-backup/` to `.gitignore`, creating the file if needed.

{: .important }
> Edits you made to **shipped** files (for example, a tweaked rule or a modified `workflow-solo`) are **not** carried over; the new version replaces them. Your edited copies are in the backup, so re-apply them from there.

The new `.agents/` is built in a staging folder and swapped in at the end, so a failed install leaves your existing `.agents/` untouched.

**Installed by copying or as a submodule?** From `.agents`, delete the old `workflows` folder and the retired `code-audit` skill folder, then copy the new `.agents/` over the old one. With a submodule, `git submodule update --remote .awesome-agv` is enough. Neither path makes a backup, so commit or copy your edits first.

### Converting a custom workflow

For each workflow the installer listed (find the originals in `.agv-backup/agents-<timestamp>/workflows/`):

1. Create `.agents/skills/<name>/` and move the workflow file there as `SKILL.md`.
2. Replace its frontmatter with:
   ```yaml
   ---
   name: <name>
   description: >-
     What it does, in the third person. User-invoked entry point via /<name>; not for autonomous or subagent use.
   disable-model-invocation: true
   ---
   ```
3. Add the entry-point guard right after the H1 title, and delete any `// turbo` lines:
   ```markdown
   > **Entry-point guard:** This is a user-invoked command skill (`/<name>`). If you are a spawned subagent, do NOT execute this skill — return to your assigned scope card.
   ```

`/<name>` then works as before. The full template is in [Adding a New Command Skill](/awesome-agv/architecture#adding-a-new-command-skill).

### Rolling back

```sh
rm -rf .agents
mv .agv-backup/agents-<timestamp> .agents
```

The restored v3 workflows will only run as slash commands on Antigravity builds that still support workflows.

{: .note }
> **Antigravity's built-in `/migrate-workflows` isn't needed.** Antigravity ships it as a generic converter for the workflow deprecation, but for awesome-agv the installer *is* the migration. The generic conversion leaves out `disable-model-invocation` and the entry-point guards, so agents could start converted commands on their own; a subagent that starts `/workflow-team`, for example, takes on the `@overseer` role. If you already ran `/migrate-workflows`, just run `npx awesome-agv@latest`: the shipped command skills are replaced with the guarded versions, and anything else it created shows up under "Preserved custom items" for you to keep or delete.

## Configuration

### Antigravity / Roo Code / Claude Code

These tools read from the `.agents` directory by default. No additional configuration is needed — just drop the folder in and start coding.

### Gemini CLI

Ingest the rules as custom system prompt context. You can reference individual rule files:

```sh
# Point Gemini CLI to the rules directory
# Refer to Gemini CLI documentation for custom instructions
```

### Other AI Coding Assistants

For any tool that supports custom system prompts or context loading:

1. Load all files from `.agents/rules/` into the system prompt
2. Optionally load `.agents/skills/` for specialized capabilities
3. Optionally invoke command skills in `.agents/skills/` for structured development processes

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

| Component          | Activation     | Effect                                                                                      |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------- |
| **Mandates**       | Always loaded  | Agent always validates code, adds logging, follows security rules                           |
| **Principles**     | Contextual     | Agent applies database rules when writing queries, CI/CD rules when editing pipelines, etc. |
| **Skills**         | On demand      | Agent uses debugging protocol when stuck, guardrails before/after writing code              |
| **Command Skills** | Slash commands | Use `/workflow-solo` for features, `/bugfix` for bugs, `/audit` for reviews                 |

{: .note }
> **Everything is modular.** Rules and skills work independently — you don't need command skills to benefit from them. Use only the rules you want, build your own command skills, or skip them entirely. The setup is a toolkit, not a framework.

## Quick Tour

### Build a Feature

Describe the feature after the command:

```
/workflow-solo add CSV export to the reports page
```

The agent first rates the task on scope, risk and familiarity, then picks a track:

| Track | When | Phases |
| --- | --- | --- |
| **Light** | Small, low-risk, familiar | Implement → Verify → Commit |
| **Standard** | Any dimension medium or high | Research → Implement → Verify → Commit |
| **Thorough** | Several dimensions high | Research → Implement → Verify (plus integration tests if adapters changed, E2E if UI changed) → Commit |

Implement is a TDD cycle (Red → Green → Refactor), Verify runs your stack's linters, tests and build, and Commit uses conventional commit format. For larger work spanning many files or modules, use `/workflow-team`.

### Try a Quick Fix

For a bug fix of any size:

```
/bugfix the login form accepts empty passwords
```

Three phases: Diagnose → Fix + Test (a failing test first) → Verify + Ship.

### Try an Audit

Review existing code quality:

```
/audit
```

Parallel subagents review the code across up to 7 dimensions. The agent then runs your linters, tests and build, and saves a report to `docs/audits/` with findings graded CRITICAL, MAJOR, MINOR or ENHANCEMENT.

## Next Steps

- [**Rules Reference**](/awesome-agv/rules) — Explore all 25 rules
- [**Skills Reference**](/awesome-agv/skills) — Learn about 68 skills (including 11 command skills)
- [**Command Skills Reference**](/awesome-agv/workflows) — Understand the 11 command skills (formerly workflows)
- [**Adapting**](/awesome-agv/adapting) — Customize for your project type
