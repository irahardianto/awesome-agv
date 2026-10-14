---
layout: default
title: Command Skills Reference
nav_order: 5
---

# Command Skills Reference
{: .no_toc }

All 11 command skills, from feature delivery to code audits.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What Are Command Skills?

Command skills are structured, multi-phase development processes that you start with a slash command, such as `/workflow-solo` or `/bugfix`. Each one chains rules and skills into a repeatable process with a gate at the end of every phase.

Each lives in `.agents/skills/<name>/SKILL.md`, like any other skill, with two differences:

- **`disable-model-invocation: true`** in the frontmatter keeps it out of the model's skill catalog, so an agent never starts one on its own.
- **An entry-point guard** at the top tells spawned subagents not to execute it. This prevents recursion, such as a subagent restarting `/workflow-team` and taking over the `@overseer` role.

Only you can start a command skill. Add your task after the command, e.g. `/bugfix the login form accepts empty passwords`.

{: .note }
> **Formerly workflows.** Until v3.x these were Antigravity workflows in the `.agents/workflows` folder. Antigravity has deprecated workflows, so v4.0.0 ships them as command skills. The commands and their phases are unchanged. To upgrade, see [Upgrading from v3.x](/awesome-agv/getting-started#upgrading-from-v3x). To write your own, see [Adding a New Command Skill](/awesome-agv/architecture#adding-a-new-command-skill).

### Choosing the Right Command Skill

| Situation                      | Command Skill       |
| ------------------------------ | ------------------- |
| Building a feature             | `/workflow-solo`    |
| Large or risky feature (>10 files, 3+ modules, security/data risk) | `/workflow-team` |
| Fixing a bug                   | `/bugfix`           |
| Restructuring code             | `/refactor`         |
| Reviewing code quality         | `/audit`            |
| Security vulnerability review  | `/security-audit`   |
| Optimizing performance         | `/perf-optimize`    |
| Retroactive unit test coverage | `/test-unit`        |
| Integration adapter testing    | `/test-integration` |
| End-to-end user journeys       | `/test-e2e`         |
| Test scenario derivation       | `/test-scenarios`   |

---

## 🏭 Feature Pipeline — Single Agent (`/workflow-solo`)

**File:** [`.agents/skills/workflow-solo/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/workflow-solo/SKILL.md)

The default way to build a feature with one agent. Each phase points to the rules and skills it applies instead of restating them. The agent may spawn subagents when useful, but no hierarchy is prescribed.

### Complexity Assessment

Before starting, the agent rates the task on three dimensions:

| Dimension     | Low                                | High                                 |
| ------------- | ---------------------------------- | ------------------------------------ |
| **Scope**     | 1–3 files, single module           | 4+ files, cross-module               |
| **Risk**      | No breaking changes, internal only | Public API changes, data migrations  |
| **Knowledge** | Familiar patterns exist in codebase | New technology, no precedent        |

It then routes to a track:

| Track        | When                        | Phases                                         |
| ------------ | --------------------------- | ---------------------------------------------- |
| **Light**    | All dimensions Low          | IMPLEMENT → VERIFY → COMMIT                    |
| **Standard** | Any dimension Medium/High   | RESEARCH → IMPLEMENT → VERIFY → COMMIT         |
| **Thorough** | Multiple dimensions High    | RESEARCH → IMPLEMENT → VERIFY (full) → COMMIT  |

### Phases

| Phase | What happens | Gate |
| --- | --- | --- |
| **RESEARCH** (Standard, Thorough) | Load idiom skills; discover existing patterns (examine 3+ modules, >80% consistency); search docs for unfamiliar tech; write `task.md`; record an ADR for significant decisions | Research artifact and task list; patterns documented |
| **IMPLEMENT** | TDD (Red → Green → Refactor); I/O behind interfaces, pure business logic; structured logging at entry points; fail-closed error handling | Unit tests pass; idiom quality checks pass; logging added |
| **VERIFY** | Linters, formatter, type checker; all unit tests; build; coverage. Thorough track adds integration tests if adapters changed and E2E tests (with screenshots) if UI changed | All checks pass; coverage reported |
| **COMMIT** | Review the staged diff; conventional commit; mark `task.md` items `[x]` | Committed |

**Skills it draws on:** `research-methodology`, `sequential-thinking`, `adr`, `guardrails`, `debugging-protocol`, `testing-strategy`, `browser-automation`, plus your stack's idiom skills.

### Error Handling

If a phase fails, the agent documents the failure, fixes it within the phase, and re-runs the gate. After 3 failed attempts on the same problem it stops and reports what failed, what it tried, and the current state of the codebase.

---

## 🤖 Multi-Agent Pipeline (`/workflow-team`)

**File:** [`.agents/skills/workflow-team/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/workflow-team/SKILL.md)

For work that spans more than 10 files, touches 3+ modules, carries security or data risk, or needs adversarial review. Your agent becomes **`@overseer`**: it spawns a `@conductor` to run the build, relays your approvals, spawns the Red Team, and delivers the final report. It never writes code itself.

### Hierarchy

```
L0  @overseer               — pipeline supervisor
        │
        └── L1  @conductor              — build orchestrator (elicit → assess → decompose → dispatch → report)
                │
                ├── L2  @tech-lead × N      — scope card owner (multi-domain cards)
                │         └── L3  builders + @test-automation-engineer
                │
                ├── L2  Specialized Builder  — direct dispatch (single-domain cards)
                ├── L2  @scout × N          — optional EXPLORE phase (read-only)
                └── L2  @reviewer           — post-build quality gate (single pass)

L0  @overseer (also spawns, for information isolation):
        │
        └── L1  @red-team-lead      — delivery validation (Tier 2+)
                  └── L2  @delivery-validator, @integration-prober, @security-engineer, @ux-craftsman
```

The overseer spawns the Red Team, not the conductor. The overseer never sees the development context, so the Red Team validates against your original requirements only. See [Agent Personas](/awesome-agv/agents) for each role.

### Tiers

| Signal | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- |
| Files | ≤5 | 6+ | Any |
| Scope | Single module | Cross-module | Any |
| Risk | No auth/migration/API | Internal API | Security-critical, public API, data migration |

| Tier | Pipeline | Validation |
| --- | --- | --- |
| **1** | Overseer → Conductor → Builder | Self-review + tests |
| **2** | Overseer → Conductor → Tech-Leads/Builders → Reviewer → Red Team | Reviewer + Red Team |
| **3** | Tier 2 + enhanced security focus | Red Team with `@security-engineer` |

Tiers only escalate upward.

### Pipeline Steps

| Step | Owner | Action |
| --- | --- | --- |
| **1. Elicit** | Conductor | Clarify scope and acceptance criteria |
| **2. Assess** | Conductor | Route to a tier using the 3 signals |
| **3. Explore** | Conductor | Optional: dispatch scouts |
| **4. Decompose** | Conductor | MECE scope cards → `.agentwork/brief.md` |
| **4a. Approve** | Overseer | Present the brief to you and relay your approval |
| **5. Design** | Conductor | Tier 2+: `@architect`, `@database-expert`, `@ux-craftsman` freeze contracts |
| **6. Build** | Conductor | Foundation wave (greenfield), then parallel feature waves |
| **7. Review** | Conductor | Tier 2+: `@reviewer`, single pass |
| **8. Remediate** | Conductor | Route FAIL findings and re-validate (max 2 cycles) |
| **9. Red Team** | Overseer | Tier 2+: spawn `@red-team-lead` with only the original requirements |
| **9a. Remediate** | Conductor | Fix Red Team failures; the overseer re-runs it (max 1 cycle) |
| **10. Report** | Conductor | Synthesize results for the overseer |
| **10a. Deliver** | Overseer | Present the report, promote docs to `docs/`, remove `.agentwork/` |

### Coordination and Resilience

- **Shared documents:** `brief.md` (scope, tier, scope cards, frozen contracts), `verdict.md` (PASS/FAIL and findings), and `handoff.md` (status and a compressed summary) in `.agentwork/`.
- **Parallel dispatch:** scope cards have exclusive file ownership (see the `parallel-dispatch` skill). Dispatch is staggered: at most 3 at once, larger batches in groups of 3.
- **Watchdog timers:** overseer → conductor and overseer → Red Team every 15 min; conductor → agents every 10 min, each followed by a status check before escalating.
- **Fault recovery:** retry → re-assign → escalate, with backoff on rate limits.
- **Succession:** when the conductor's context degrades, it hands off (or the overseer's watchdog forces it), up to 5 times per run.

---

## 🔧 Bug Fix (`/bugfix`)

**File:** [`.agents/skills/bugfix/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/bugfix/SKILL.md)

Fixes bugs of any size, from one-line hotfixes to multi-file debugging sessions, without the overhead of the full feature pipeline.

### When to Use
- Bug fixes of any size or complexity
- Hotfixes for production issues
- Findings from `/audit` or `/security-audit`
- Regressions and flaky tests

### Phases
1. **Diagnose:** trace from symptom to root cause, assess blast radius, and define the fix in `task.md`. Uses **Debugging Protocol** for non-obvious causes and **Sequential Thinking** for competing hypotheses.
2. **Fix + Test (TDD):** write a failing test that reproduces the bug, apply the fix, confirm existing tests pass, and update integration tests if boundaries were touched.
3. **Verify + Ship:** full validation suite, E2E if user-facing flows changed, and a `fix(<scope>): …` commit.

---

## 🔧 Refactor (`/refactor`)

**File:** [`.agents/skills/refactor/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/refactor/SKILL.md)

Restructures existing code while preserving behavior: understand first, then change structure.

### Give It a Target

| Path | Example |
| --- | --- |
| **A. You specify it** | `/refactor extract storage interface in task feature` |
| **B. A tool finds it** | `/refactor from-lint`, `/refactor from-clippy`, `/refactor from-deepsource` |
| **C. Discovery** | `/refactor discover` runs an audit first; you approve the scope |

Vague requests like `/refactor apps/backend` are rejected with a prompt to pick a path.

### Phases
1. **Impact Analysis:** map the blast radius, document existing behavior, identify risks, and plan incremental steps in `task.md`.
2. **Incremental Change (TDD):** tests pass before the first change and after every change; add tests where the refactor exposes untested behavior.
3. **Parity Verification:** full validation; coverage equal or better; same inputs produce the same outputs.
4. **Ship:** `refactor(<scope>): …` commit.

---

## 🔍 Code Audit (`/audit`)

**File:** [`.agents/skills/audit/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/audit/SKILL.md)

A multi-dimensional review of existing code by parallel subagents. It finds issues; it doesn't fix them.

### Phases

| Phase | What happens |
| --- | --- |
| **0. Reconnaissance** | Detect stack and architecture, inventory the codebase, select dimensions |
| **1. Multi-Dimensional Scan** | One subagent per active dimension, in parallel, each writing `.agentwork/findings-audit-<dim>.md` |
| **2. Automated Verification** | The coordinator runs linters, the full test suite, the build and coverage |
| **3. Synthesis** | Deduplicate, rank by severity, escalate findings that correlate across dimensions |
| **4. Report** | Saved to `docs/audits/review-findings-{feature}-{YYYY-MM-DD}-{HHmm}.md` |

### Dimensions

| Dim | Scope | Active when |
| --- | --- | --- |
| **A** | Security & Configuration | Always |
| **B** | Reliability & Error Handling | Always |
| **C** | Testability & Architecture | Always |
| **D** | Observability & Logging | Always |
| **E** | Code Quality & Patterns | Always |
| **F** | Integration Contracts & Database | Project has API boundaries or a database |
| **G** | Dependencies & Test Coverage Gaps | Always |

Scope cards and the report template are in `.agents/skills/audit/references/`. If an audit returns fewer than 3 findings, the report must include a "Dimensions Covered" attestation.

### Acting on Findings

| Severity | Example | Follow-up |
| --- | --- | --- |
| **CRITICAL** | Hardcoded secret, SQL injection | `/bugfix`, immediately |
| **MAJOR** | Swallowed I/O errors, missing interfaces | `/bugfix` or `/refactor` |
| **MINOR** | Missing operation log, long function | `/bugfix` or a direct fix |
| **ENHANCEMENT** | Defense in depth, doc comments | `/workflow-solo` or backlog |

Run audits in a **fresh conversation**, not the one that wrote the code, and point the follow-up conversation at the saved report.

---

## 🛡️ Security Audit (`/security-audit`)

**File:** [`.agents/skills/security-audit/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/security-audit/SKILL.md)

A security-only audit by parallel subagents. It identifies vulnerabilities; it doesn't write fixes.

### Phases

| Phase | What happens |
| --- | --- |
| **0. Reconnaissance** | Detect stack, inventory the attack surface, select dimensions |
| **1. Multi-Dimensional Scan** | One subagent per active dimension, in parallel |
| **2. Automated Tooling** | CVE scanner for your stack (via `supply-chain-security`), plus secret scanning, lock-file checks and a git-history secrets scan |
| **3. Synthesis** | Deduplicate, rank, escalate when 2+ dimensions converge on one attack vector |
| **4. Report** | Saved to `docs/audits/security-audit-{scope}-{YYYY-MM-DD}-{HHmm}.md` |

### Dimensions

| Dim | Scope | Active when |
| --- | --- | --- |
| **A** | OWASP Code Patterns | Always |
| **B** | Authentication & Authorization | Project has authentication |
| **C** | Secrets & Configuration | Always |
| **D** | Supply Chain & Dependencies | Always |
| **E** | Data Protection & Privacy | Project handles user data |
| **F** | Infrastructure Hardening | Project has an HTTP server |

Findings are graded **CRITICAL** (actively exploitable), **HIGH** (fix before release), **MEDIUM** (fix near term) or **ENHANCEMENT** (backlog).

---

## ⚡ Performance Optimization (`/perf-optimize`)

**File:** [`.agents/skills/perf-optimize/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/perf-optimize/SKILL.md)

Profile-driven optimization: measure first, then fix one thing at a time, each change tested, benchmarked and committed on its own. It loads the `perf-optimization` knowledge skill (methodology, pattern catalog, per-language tooling) before starting.

### Phases

| Phase | Output | Gate |
| --- | --- | --- |
| **0. Reconnaissance** | Stack, performance inventory, dimension selection | Dimensions selected |
| **1. Profile** | Raw profiling data + baseline benchmarks | Data collected |
| **2. Multi-Dimensional Analysis** | Parallel subagents, `.agentwork/findings-perf-*.md` | All subagents report back |
| **3. Synthesis** | `docs/audits/perf-analysis-{component}-{date}.md` + implementation plan | **You approve the plan** |
| **4. Implement** | Test + fix + benchmark per change | Each fix passes tests and improves the benchmark |
| **5. Verify** | Full benchmark comparison + test suite | All checks pass |
| **6. Document & Ship** | Updated report + `perf(<scope>): …` commits | You're notified |

Dimensions: CPU & Computation, Memory & Allocation, I/O & Network, Concurrency & Parallelism, Serialization & Data Structures, Build/Bundle & Deployment Artifacts.

### Key Rules
- **One fix per commit.** Never batch optimizations.
- **Stop** when the remaining cost is in hardware-optimized code or the language runtime, when the gain is under 5% (within noise), or when the fix needs an architectural refactor. Hand that to `/refactor`.
- Security is never traded for speed.

---

## 🧪 Testing Command Skills

Retroactive test improvement for existing codebases. For new features, `/workflow-solo` already uses TDD.

### Unit Testing (`/test-unit`)

**File:** [`.agents/skills/test-unit/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/test-unit/SKILL.md)

Coverage-gap-first unit test improvement: analyze gaps, prioritize by business risk and git churn, and refactor for testability where needed.

- **Phases:** ANALYZE → PRIORITIZE → REFACTOR-FOR-TESTABILITY (conditional) → TEST → VERIFY
- **When to use:** raising coverage on critical business logic, or reducing regression risk in high-churn code.

### Integration Testing (`/test-integration`)

**File:** [`.agents/skills/test-integration/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/test-integration/SKILL.md)

Adapter audit: find I/O boundaries, set up Testcontainers or test adapters, and write contract-compliance tests.

- **Phases:** AUDIT → INFRASTRUCTURE → TEST → VERIFY
- **When to use:** database, HTTP-client, file-system or message-queue adapters that lack tests against real dependencies.

### End-to-End Testing (`/test-e2e`)

**File:** [`.agents/skills/test-e2e/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/test-e2e/SKILL.md)

Platform-adaptive, journey-based E2E testing for web (Playwright) and mobile (Flutter integration_test, Patrol, Maestro), with screenshot and artifact evidence.

- **Phases:** PLAN → SETUP → AUTHOR → EXECUTE → REPORT
- **When to use:** new or changed user-facing flows, and cross-platform parity checks.

### Test Scenarios (`/test-scenarios`)

**File:** [`.agents/skills/test-scenarios/SKILL.md`](https://github.com/irahardianto/awesome-agv/blob/main/.agents/skills/test-scenarios/SKILL.md)

Structured derivation plus mutation-informed expansion: generates prioritized test scenarios from requirements or code, saved to `docs/testing/`, as input for the three testing command skills above.

- **Phases:** INPUT → INVENTORY → ANALYZE → DERIVE → EXPAND → ORGANIZE → OUTPUT → HUMAN REVIEW (mandatory approval gate)
- **When to use:** before writing tests for a new feature or module, to find edge cases, boundary values and regression vectors.
