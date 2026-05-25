---
description: Refactor workflow for safely restructuring existing code
---

# Refactor Workflow

## Purpose
Safely restructure existing code while preserving behavior. Uses a different mindset than greenfield feature development: understand first, then change structure.

## Requirement Elicitation

Determine refactoring source before proceeding:

### Path A — Human-Specified
User provides a specific, actionable target:
- ✅ `/refactor extract storage interface in task feature`
- ✅ `/refactor split user handler into separate auth handler`
- ✅ `/refactor migrate callbacks to async/await in notification service`
→ Proceed directly to Phase 1

### Path B — Tool-Driven
User references a static analysis tool as the requirement source:
- ✅ `/refactor from-deepsource` — read DeepSource MCP findings
- ✅ `/refactor from-clippy` — parse `cargo clippy` output
- ✅ `/refactor from-lint` — parse linter output (ESLint, golangci-lint, ruff)
→ Parse tool findings → present summary → user approves scope → proceed to Phase 1

Supported tools:

| Tool | Integration |
|---|---|
| DeepSource MCP | Read findings via `deepsource` MCP tools |
| cargo clippy | Parse `cargo clippy --message-format json` |
| golangci-lint | Parse `golangci-lint run --out-format json` |
| ESLint | Parse `npx eslint . --format json` |
| ruff | Parse `ruff check . --output-format json` |
| SonarQube | Read via API if available |

### Path C — Discovery
User doesn't know what to refactor, or provides vague request:
- ✅ `/refactor discover` — audit first, then refactor
- ❌ `/refactor apps/backend` — too vague
- ❌ `/refactor improve code quality` — what specific issue?
→ **Multi-agent mode** (`/workflow-team`): Dispatch SCOUT(@scout + @qa-analyst, code smell audit)
→ **Single-agent mode**: Run `/audit` on the target area first, then use findings as input
→ Present findings → user approves scope → proceed to Phase 1

Vague request without path → "Run `/refactor discover` to find issues, or specify a target like `/refactor extract storage interface in task feature`."

## When to Use
- Code restructuring (moving, renaming, splitting modules)
- Pattern migration (e.g., switching from callbacks to async/await)
- Dependency upgrades with breaking changes
- Addressing tech debt or architectural improvements
- Tool-driven cleanup from static analysis findings

## When NOT to Use
- New features (use `/workflow-solo`)
- Small bug fixes (use `/bugfix`)
- "Find what to improve" without `/refactor discover` (use `/audit` first)

## Pre-Implementation Checklist
Before starting, you MUST:
1. Scan `.agents/rules/` directory for applicable rules
2. Read `architectural-pattern.md` and `project-structure.md`
3. Read `rule-priority.md` for conflict resolution

## Phases

### Phase 1: Impact Analysis
**Set Mode:** Use `task_boundary` to set mode to **PLANNING**

1. **Map the blast radius** — what files, modules, and tests are affected?
2. **Document existing behavior** — what tests currently pass? what contracts exist?
3. **Identify risks** — can this be done incrementally or is a big-bang needed?
4. **Create refactoring plan** in `task.md` with incremental steps
5. If decision involves trade-offs, create an ADR using the **ADR Skill**

**Skills to consider:**
- **Sequential Thinking** — for multi-step refactoring with interdependencies

### Phase 2: Incremental Change (TDD)
**Set Mode:** Use `task_boundary` to set mode to **EXECUTION**

For each step in the refactoring plan:
1. **Ensure existing tests pass** before making any change
2. **Make one incremental change** — move, rename, or restructure
3. **Run tests after each change** — behavior must be preserved
4. **Add new tests** if the refactoring exposes untested behavior
5. Follow applicable rules:
   - Architectural Patterns @architectural-pattern.md
   - Code Organization Principles @code-organization-principles.md (includes circular dependency guidance)

**Key principle:** Never break the build for more than one step at a time.

### Phase 3: Parity Verification
**Set Mode:** Use `task_boundary` to set mode to **VERIFICATION**

1. Run the full validation suite (same as `phase-verify.md`)
2. **Compare test coverage** — coverage should be equal to or better than before
3. **Verify no behavior changes** — same inputs produce same outputs
4. If applicable, run E2E tests (`phase-e2e.md`)

### Phase 4: Ship
Follow `phase-commit.md` with commit type `refactor(<scope>): <description>`

## Completion Criteria
- [ ] Requirement source identified (Path A, B, or C)
- [ ] Impact analysis documented
- [ ] All changes made incrementally with tests passing at each step
- [ ] Full verification suite passes
- [ ] Test coverage is equal to or better than before
- [ ] Committed with `refactor` type
