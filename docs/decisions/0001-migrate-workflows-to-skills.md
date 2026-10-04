---
$schema: "https://raw.githubusercontent.com/irahardianto/awesome-agv/main/.agents/skills/structured-spec/spec-schema.json"
spec_id: "ADR-0001-MIGRATE-WORKFLOWS-TO-SKILLS-V1"
title: "Migrate workflows to command skills"
doc_type: "adr"
status: "accepted"
version: "1.0.0"
owners: ["platform-team"]
created: "2026-10-04"
modified: "2026-10-04"
---

<!-- decision
  id: ADR-0001
  title: Migrate workflows to command skills
  status: accepted
  context: Antigravity deprecated workflows with retirement on November 1, 2026. The agy CLI 1.2.16 already dropped workflow slash commands. Workflows must migrate to skills while preserving slash command invocability and preventing subagent recursion.
  alternatives: ["built-in /migrate-workflows", "verbs plus thin aliases", "1:1 command skills with knowledge skills unchanged"]
  rationale: 1:1 migration into command skills with disable-model-invocation: true preserves all slash command names, avoids catalog token bloat, prevents subagent recursion, and avoids cycles with knowledge skills.
  consequences: Slash commands preserved; subagent recursion prevented; relies on undocumented disable-model-invocation flag; relative skills path bug in agy blocks per-persona allowlists.
  affects_requirements: []
-->

## Context

Antigravity has formally deprecated workflows (`.agents/workflows/`), with platform retirement scheduled for November 1, 2026. awesome-agv previously shipped 11 development workflows. Investigation into platform behavior (`platform_findings.md`) established the following verified facts:

- **F1 (High - CLI):** In `agy` 1.2.16, workflows are already no longer registered as slash commands (`"deprecate-workflows": true` in binary; 0/5 workflow expansions vs 5/5 for skills).
- **F2 (High):** Custom agents inherit all workspace skills by default; `skills:` alone merely appends to ambient skills.
- **F3 (High):** `inheritCustomizations: false` combined with `skills:` produces a strict allowlist.
- **F4 (High - CLI):** Relative skill paths in agent frontmatter fail in `agy` 1.2.16 (`AgentBasePath is not set`). Only absolute paths resolve.
- **F5 (High):** `tools:` frontmatter strictly enforces tool restrictions.
- **F6 (High):** Agent frontmatter schema fields verified in binary (`inheritCustomizations`, `skills`, `tools`, etc.).
- **F7 (High):** Slash command `/name` expansion occurs before prompt delivery to agents.
- **F8 (High):** `// turbo` and `// turbo-all` directives have no effect in skills; permission presets and hooks replace them.
- **Q1 / Q2 (High):** Skills take precedence over same-named legacy workflows (Q1). The undocumented frontmatter flag `disable-model-invocation: true` hides skills from the model catalog while preserving slash command execution (Q2).

Additionally, reference skill `.agents/skills/code-audit/` was tightly coupled to `/audit`, and `perf-optimize.md` suffered from a character-truncation bug exceeding the legacy 12,000-character workflow limit.

## Decision

We chose **1:1 command skills with knowledge skills unchanged** (Option C).

All 11 workflows are migrated 1:1 into `.agents/skills/<name>/SKILL.md` with `disable-model-invocation: true` and an explicit entry-point guard. Knowledge skills (`perf-optimization`, `refactoring-patterns`, `debugging-protocol`) remain separate and unchanged. Reference material in `.agents/skills/code-audit/` is consolidated into `.agents/skills/audit/references/`, retiring `code-audit`.

## Alternatives Considered

### Option A: Antigravity built-in `/migrate-workflows`
- **Pros:** Standard platform utility.
- **Cons:** Skips `security-audit` due to overwrite protection (`.bak`); creates naive copies without subagent entry-point guards; cannot separate command runbooks from reference knowledge skills.
- **Effort:** Low, but produces broken configurations.

### Option B: Verbs plus thin aliases (from initial research)
- **Pros:** Attempted to normalize catalog names.
- **Cons:** High risk of subagent recursion (C1) and identity hijacking (e.g. subagents loading `workflow-team` and assuming `@overseer`); orphans ~3,800 lines of knowledge content in `perf-optimization` creating circular redirects (`perf-optimize` ↔ `perf-optimization`); aliases don't exist as platform primitives and pollute all model catalogs with duplicate tokens.
- **Effort:** High with severe architectural defects.

### Option C: 1:1 command skills with knowledge skills unchanged (Chosen)
- **Pros:** Preserves all slash command names identically (`/workflow-solo`, `/workflow-team`, `/audit`, etc.); setting `disable-model-invocation: true` plus an entry-point guard eliminates subagent recursion and catalog token waste; knowledge skills (`perf-optimization`, `refactoring-patterns`, `debugging-protocol`) remain untouched as pure reference loaded by agents; `code-audit` cleanly folded into `audit/references/`.
- **Cons:** Relies on an undocumented frontmatter flag (`disable-model-invocation: true`).
- **Effort:** Medium.

## Rationale

Option C provides maximum backward compatibility for users accustomed to `/workflow-*` slash commands while completely eliminating subagent recursion risks. It avoids the catastrophic knowledge-skill cycles and catalog bloat of Option B, and handles `security-audit` cleanly unlike Option A.

## Consequences

### Positive
- Slash commands (`/workflow-team`, `/workflow-solo`, `/audit`, etc.) continue working seamlessly across the ecosystem.
- `disable-model-invocation: true` prevents 11 orchestration runbooks (~550 tokens) from polluting agent prompt catalogs.
- Defense-in-depth entry-point guard stops subagents from assuming orchestrator roles if skills are discovered via filesystem search.
- Knowledge skills (`perf-optimization`, `refactoring-patterns`) retain their full modular contents and scripts.

### Negative
- Relies on `disable-model-invocation: true`, which is undocumented in public Antigravity docs (verified in `agy` and app binaries).
- `agy` 1.2.16 relative skill path bug (`AgentBasePath`) prevents implementing per-persona skill allowlists in portable templates.
- Awesome-agv distributes from `main` branch HEAD, meaning updates apply directly to users on re-install.

### Risks
- If future platform releases alter `disable-model-invocation`, command skills could reappear in model catalogs (mitigated by the explicit text entry-point guard).

## Follow-ups
1. Re-evaluate per-persona allowlists (`inheritCustomizations: false` + `skills:`) once Antigravity fixes the `AgentBasePath` relative resolution bug in `agy`.
2. Verify slash command and `disable-model-invocation` behavior in the Antigravity IDE and 2.0 desktop application.

## Rule Compliance
- Architectural Patterns @architectural-pattern.md
- Core Design Principles @core-design-principles.md
- Documentation Principles @documentation-principles.md
- Project Structure @project-structure.md
