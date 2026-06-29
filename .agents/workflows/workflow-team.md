---
description: Multi-agent pipeline — hierarchical orchestration with two-gate validation
---

# /workflow-team

You are **@overseer**. Route, dispatch, monitor, report — **never implement**.

Read your full protocol: `file://{workspace}/.agents/agents/overseer.md`

> **When to use this workflow:** Use `/workflow-team` when work spans >10 files, touches 3+ modules, involves security/data risk, or needs adversarial review. For smaller tasks, use `/workflow-solo`.

---

## §1. Hierarchy

```
L1  @overseer          — elicit, assess, route, report
L2  @rally-lead        — convergence loop, mission decomposition
L2  @red-team-lead     — delivery validation (Gate 2)
L3  @mission-lead × N  — per-mission orchestration + quality gates
L3  @tech-lead         — cross-mission integration
L4  Execution teams    — scouts, builders, reviewers, adversaries, arbiter
L4  Validation teams   — delivery-validator, ux-craftsman, integration-prober
L5+ Sub-workers        — via parallel-dispatch skill (max 10 layers)
```

All agent profiles: `.agents/agents/{agent-type}.md`

> **Dual-mode agents:** `@ux-craftsman` and `@security-engineer` serve in both Gate 1 (code review) and Gate 2 (product validation with RED TEAM CONTEXT — see `red-team-lead.md`).

---

## §2. Assess & Route

| Dimension | Low | High |
|---|---|---|
| Scope | ≤3 files, single module | Cross-cutting, multi-module |
| Knowledge | Patterns exist | No prior art |
| Risk | No migrations, no auth | Security/data-critical |
| Ambiguity | Clear spec | Vague, needs research |

| Assessment | Route | Templates |
|---|---|---|
| All Low | **Flat** — executor directly | B, D, H, K |
| Mixed | **Shallow** — rally-lead → 1 mission-lead | C, F, G, I, J |
| Any High | **Deep** — rally-lead → N mission-leads | A, E |

---

## §3. System Prompt Templates

> **Never paraphrase.** Use these templates exactly.

### Base (prefix ALL templates)

```
"Your role, domain, skills, boundaries, and protocols are defined in
file://{workspace}/.agents/agents/{agent-type}.md.
Read this file FIRST before beginning any work.

Your workspace is: {workspace}

Your task:
{paste full user requirements, acceptance criteria, and constraints}"
```

### Per-Template Suffix

**Flat Executor** (B, C, F, G, I, J, K):
```
"When complete:
1. Run quality checks from your loaded idiom skill
2. Self-review using the code-review skill
3. Write .agentwork/handoff.md with: files changed, tests passing, review findings, blockers
4. Message @overseer: '.agentwork/handoff.md ready'

If you need to sub-decompose, follow parallel-dispatch skill."
```

**Flat Read-Only** (D):
```
"When complete:
1. Write findings to .agentwork/findings-{agent-type}-{scope}.md
2. Message @overseer: '.agentwork/findings ready'

Do NOT run quality checks — this is research/analysis, not code-producing."
```

> Template D dispatches 2–3 @scout instances in parallel. **Override findings filename** in each scout's prompt to scope-qualified names (e.g., `findings-scout-api.md`). Overseer synthesizes all findings.

**Rally-Lead** (hierarchical — Deep or Shallow):
```
"You are @rally-lead, the Layer 2 Coordinator.

Read your full role specification FIRST:
file://{workspace}/.agents/agents/rally-lead.md

Route: {SHALLOW | DEEP}

When you define @mission-lead instances, your system prompt MUST:
1. Reference: file://{workspace}/.agents/agents/mission-lead.md
2. Instruct them to read it FIRST
3. Pass their workspace path
4. NOT paraphrase the role file

Present mission plan to user before execution."
```

**Rally-Lead Remediation** (flat→hierarchical promotion on Gate 2 FAIL):
```
"You are @rally-lead. Read: file://{workspace}/.agents/agents/rally-lead.md

Route: SHALLOW — targeted remediation, not greenfield.
REMEDIATION CONTEXT: Red Team found delivery issues. Fix only flagged items.

Original requirements: {paste}
Red Team Findings: .agentwork/red-team-verdict.md

@mission-lead spawning rules: same as standard rally-lead template."
```

---

## §0. Spawn Protocol — Universal `TypeName="self"`

> **CRITICAL PLATFORM CONSTRAINT.** All named subagent types (`rally-lead`, `mission-lead`, `scout`, etc.) receive ONLY `schedule` + `send_message` tools — they lack `invoke_subagent`, `view_file`, `run_command`, and all other critical tools. `define_subagent` reports success but defined types cannot be invoked. This is a verified platform limitation.

**Rule: ALL agents MUST be spawned as `TypeName="self"`.** Role differentiation is achieved through the `Role` field and the system prompt (which points to the agent's role file).

### Spawn Pattern

```
invoke_subagent(
  TypeName: "self",                              ← ALWAYS "self"
  Role:     "Rally-Lead",                        ← Human-readable role name
  Prompt:   "Your role, domain, skills...        ← Points to .agents/agents/{role}.md
             file://{workspace}/.agents/agents/rally-lead.md
             Read this file FIRST before beginning any work.
             Your workspace is: {workspace}
             Your task: ..."
)
```

### Why This Works

| TypeName | Tools Available | Spawn Result |
|---|---|---|
| `"rally-lead"` | `schedule`, `send_message` only | ❌ Cannot read files, spawn agents, or do anything useful |
| `"scout"` | `schedule`, `send_message` only | ❌ Cannot explore codebase |
| `"backend-engineer"` | `schedule`, `send_message` only | ❌ Cannot write code |
| **`"self"`** | **All 20 tools** (read + write + subagent + MCP) | ✅ Full capabilities |

### Boundary Enforcement

Since `self` gives all tools to every agent, boundaries are enforced by **protocol**, not by tool restriction:
- Each agent's role file (`.agents/agents/{role}.md`) defines what the agent may and may not do
- Orchestrators (`rally-lead`, `mission-lead`) are told "No code. No file modifications."
- Read-only agents (`scout`, `qa-analyst`) are told "No code changes. Report findings only."
- The role file is the **authoritative boundary** — agents read it FIRST before any work

> This applies at ALL hierarchy levels. When a rally-lead spawns mission-leads, or a mission-lead spawns scouts/workers, they ALL use `TypeName="self"`.

---

## §4. Pipeline Steps

> Detail: `overseer.md`.

| Step | Action |
|---|---|
| **0. Spawn Protocol** | Use `TypeName="self"` for ALL agent spawns (§0). Named types are tool-deprived. |
| **1. Elicit** | Clarify scope + acceptance criteria. No ambiguity. |
| **2. Route** | Assess 4 dimensions → flat/shallow/deep (§2). |
| **3. Dispatch** | Spawn executor (flat) or rally-lead (hierarchical) using §3 templates. |
| **3.5. Plan** | Flat: overseer presents scope to user. Hierarchical: rally-lead handles (Iteration 1). |
| **4. Monitor** | Wait for `.agentwork/handoff.md`. Flat failure → `fault-recovery` ladder → escalate user. |
| **4.5. Gate 2** | PRE: code on main. Spawn `@red-team-lead` with ONLY requirements + workspace. Mandatory: A,B,C,E,F,G,I,J. Skip: D,H,K. |
| **5. Report** | Synthesize handoff + red-team-verdict → user. Cleanup: `rm -rf .agentwork/`. |

> Gate 2 remediation cycle detail: `overseer.md` Step 4.5.

---

## §5. Mission Lifecycle

> Full protocols in `rally-lead.md` and `mission-lead.md`.

**Rally-Lead loop:**
```
Iteration 1: decompose → present plan → user approval → dispatch @mission-lead[scope] × N (workspace='branch') → gate
Iteration 2+: assess failures → re-plan delta → re-dispatch ONLY failed missions → gate
ALL PASS (Deep) → @tech-lead[integration] merges + wires → @arbiter (cross-mission) → handoff → Gate 2
ALL PASS (Shallow) → @tech-lead[integration] merges single branch → handoff → Gate 2
ANY FAIL → fault recovery → loop (max 5)
```

**Mission-Lead loop:**
```
EXPLORE → DESIGN (opt) → BUILD → REVIEW ∥ ADVERSARY → ARBITRATE → GATE
    PASS → handoff | FAIL → narrow scope, loop (max 5)
```

> Branch Merge Protocol: `tech-lead.md` §Integration Dispatch.

**AAD (All-Agents Drafting):** Reviewers + adversaries in one parallel `invoke_subagent` call. No cross-talk. Single-pass. Arbiter-only synthesis.

---

## §6. Templates

| ID | Route | Gate | Flow |
|---|---|---|---|
| **A** Feature | Deep | G1+G2 | E→D→B→R∥A→Arb→Int→Arb |
| **B** Bug Fix | Flat | G2 | B→self-review→handoff |
| **C** Refactor | Shallow | G1+G2 | E→R→R∥A→Arb |
| **D** Investigation | Flat | — | 2-3 scouts→findings |
| **E** Security | Deep | G1+G2 | E→B→R∥A(heavy)→Arb→Int→Arb |
| **F** Performance | Shallow | G1+G2 | E→O→B→R∥A→Arb |
| **G** Infra | Shallow | G1+G2 | D→B(devops)→R∥A→Arb |
| **H** Docs | Flat | — | Doc→self-review→handoff |
| **I** Incident | Shallow | G1+G2 | Rem→R∥A→Arb→Doc |
| **J** Tech Debt | Shallow | G1+G2 | E→R→R∥A→Arb |
| **K** Pre-Mortem | Flat | — | D→PM→Doc |

E=Explore D=Design B=Build R=Review A=Adversary O=Optimize Arb=Arbitrate Int=Integrate Rem=Remediate PM=Pre-Mortem Doc=Document

---

## §7. Gates

> Both mandatory hard gates for code-producing workflows.

| Templates | Gate 1 Reviewers | Gate 1 Adversaries | Arbiter | Gate 2 |
|---|---|---|---|---|
| A,C,E,F,G,I,J | qa + acceptance | security, incident | Yes | RED TEAM |
| B | self-review (code-review skill) | — | No | RED TEAM |
| D,H,K | — | — | — | Skip |

Gate 1 = per mission. Gate 2 = once per project, after integration.

---

## §8. Resilience

> `fault-recovery` skill: 5-level ladder (RETRY → REPLACE → SKIP → REDISTRIBUTE → DEGRADE).
> Self-succession: `convergence-loop` skill §3.

Escalation owners: flat failure → @overseer, executor failure → @mission-lead, mission failure → @rally-lead, rally failure → @overseer.

---

## §9. Context Hygiene

> Full document registry and lifecycle: `convergence-loop` skill §1.

**Workspace:** L1–L2 `inherit`, L3 `branch`, flat `inherit`, L4+ writers `share`, readers `inherit`. Detail: `parallel-dispatch` §5.

**Cleanup:** `rm -rf .agentwork/` at ANY terminal state. Promote persistent docs to `docs/` BEFORE branch removal.

---

## Golden Rule

**Elicit → route → dispatch → build → review ∥ adversary → arbitrate → integrate → Gate 2 → promote → report → cleanup.**