---
name: parallel-dispatch
description: >-
  MECE task decomposition, file ownership enforcement, DAG-based execution,
  and safe merge protocol for intra-domain parallel dispatch. The safety
  invariants that prevent merge chaos when multiple agents write in parallel.
  Applies recursively at every nesting depth.
---

# Parallel Dispatch

Safe parallel execution of multiple agents within the same domain. This skill defines the **safety invariants** — the constraints that, if maintained, guarantee conflict-free merges by construction.

> **Recursive by design.** These invariants apply at every nesting depth. A `@backend-engineer[auth]` that spawns sub-subagents for `[auth-login]` and `[auth-registration]` must apply the same decomposition, ownership, and merge rules internally.

## When to Invoke

- Before dispatching multiple instances of the same agent type within a primitive
- When any agent (at any depth) needs to parallelize its own workload across sub-subagents
- When re-planning after a sub-task failure

## 1. Decomposition

Break work into parallelizable, MECE sub-tasks. Each gets a **scope card**.

### Protocol

1. **Inventory** — List all concrete deliverables (files, modules, endpoints, tests)
2. **Cluster by feature** — Group by vertical feature slice, not technical layer
3. **MECE validate** — No file in two clusters. No deliverable unassigned.
4. **Dependency scan** — Mark `hard` (blocks) vs `soft` (beneficial but not blocking) dependencies
5. **Produce scope cards**
6. **Cap check** — >5 instances of same agent type → prompt user

**Critical anti-pattern:** Layer-based decomposition (`handlers/`, `services/`, `repos/`) creates cross-cutting dependencies. Always use feature-based clustering (`auth/`, `tasks/`, `notifications/`).

### Scope Card Format

```markdown
### Scope Card: @<agent-type>[<scope>]
- **Deliverables**: <list of concrete outputs>
- **Write Scope**: <glob pattern for exclusive write access>
- **Shared Reads**: <glob patterns for read-only access>
- **Hard Dependencies**: <scope cards that must complete first>
- **Soft Dependencies**: <scope cards that are beneficial but not blocking>
```

Rules:
- Every card has at least one concrete deliverable
- Every card has a write scope (glob pattern)
- Write scopes between agents MUST be disjoint
- Scope names use kebab-case: `[auth]`, `[task-crud]`, `[user-profile]`
- Empty scope cards are invalid — merge with adjacent cluster

### Recursive Decomposition

When an agent receives a scope card and the work is still too broad:

1. Further decompose the scope card into sub-scope cards
2. Apply the same MECE/ownership rules within the narrower boundary
3. The parent's write scope becomes the ceiling — children cannot write outside it
4. Children inherit shared reads from parent plus parent's own outputs

```
@backend-engineer[auth]           ← scope card from orchestrator
  └─ @backend-engineer[auth-login]      ← sub-scope card (self-decomposed)
  └─ @backend-engineer[auth-register]   ← sub-scope card (self-decomposed)
  └─ @backend-engineer[auth-integration] ← wires sub-features together
```

## 2. Ownership

The safety invariant: **one writer per file**. If ownership is valid, merges are conflict-free by construction.

### Three Zones

| Zone | Access | Mutability |
|---|---|---|
| **Exclusive Write** | Read + Write by exactly one sub-task | Mutable only by owner |
| **Shared Read** | Read by any sub-task | Immutable during BUILD |
| **Contracts Layer** | Read by all BUILD agents | Produced by DESIGN, frozen for BUILD |

If a BUILD agent discovers a contract needs changes → **STOP and escalate** for DESIGN revision. Never silently modify frozen contracts.

### Integration Sub-Task

Aggregation files (routers, registries, main entry points, config) inherently collect contributions from multiple features. Handle with a dedicated `[integration]` sub-task:

- Runs **after** all parallel sub-tasks for its agent type
- Owns **only** aggregation files
- Merges **last**

This pattern applies recursively — a deeply nested agent that parallelizes can have its own integration sub-task.

### Ownership Matrix

Before dispatch, build a matrix from scope cards:

```markdown
| Sub-Task | Write Scope (exclusive) | Shared Reads |
|----------|------------------------|--------------|
| @agent[scope-1] | `features/<scope-1>/**` | `types/**`, `config/**` |
| @agent[scope-2] | `features/<scope-2>/**` | `types/**`, `config/**` |
| @agent[integration] | `router/**`, `main.*` | All feature dirs (read-only) |
```

Validate before dispatch:
- Write scopes are **disjoint** (zero file overlap between writers at same level)
- Write scopes are **exhaustive** (every file that needs modification is owned)
- No BUILD agent writes to contracts layer
- Integration sub-tasks are at a later DAG level than their parallel peers

## 3. Execution

### DAG Levels

Group scope cards into levels by dependency depth:

- **Level 0**: No dependencies — dispatch in parallel
- **Level N**: All dependencies satisfied by levels 0 through N-1

All nodes at the same level are independent — dispatch in parallel. Between levels: merge completed branches, run quality gate, then proceed to next level.

If a node fails, it follows the Escalation Ladder in the `fault-recovery` skill. If failure changes scope, re-decompose the affected sub-tree only — already-completed nodes outside the failure are preserved.

### Merge Order

Within a level, merge in this priority:
1. **Dependency order** — merge nodes that downstream work depends on first
2. **Smallest diff first** — for independent nodes, merge smaller changes first (less conflict surface)
3. **Integration last** — `[integration]` sub-tasks always merge after feature branches

### Conflict Classification

| Type | Description | Resolution |
|---|---|---|
| **Textual** | Same line modified by two branches | Analyze intent, pick correct or combine |
| **Semantic** | Different changes that interact logically | Requires understanding both; may need new code |
| **Structural** | File reorganization conflicts | Re-apply changes on new structure |
| **Integration** | Both add routes/config entries | Combine additions, order by convention |

> If the same conflict pattern repeats across merges, the **decomposition was flawed** — re-decompose, don't keep patching conflicts.

## 4. Read-Only Agents

Read-only agents (scout, qa-analyst, security-engineer, ux-craftsman, incident-responder) use MECE scoping for **coverage guarantees**, not conflict prevention:

- Each instance covers a disjoint area
- Union covers 100% of relevant scope
- No merge step — they produce documents/findings passed as context to downstream agents

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Layer-based decomposition | Cross-cutting deps, every sub-task touches every feature | Feature-based clustering |
| Shared write access | Merge conflicts guaranteed | One writer per file, extract to contract layer |
| Scope too small (<1 file) | Overhead exceeds benefit | Merge into adjacent cluster |
| Scope too broad (entire domain) | No parallelism gained | Break into feature slices |
| Decomposing without DESIGN output | No contracts → incompatible assumptions | DESIGN before BUILD decomposition |
| Modifying frozen contracts in BUILD | Downstream agents built against wrong interface | STOP, escalate for DESIGN revision |
| Skipping MECE validation | Gaps → missed work, overlaps → conflicts | Always validate before dispatch |

## 5. Hierarchical Decomposition

When work spans multiple missions or epics, decompose into coordinator subtrees — not a flat fan-out of executors.

### Decision: Flat vs. Hierarchical

| Signal | Dispatch Model |
|---|---|
| ≤5 scope cards, single mission | Flat (direct executor dispatch) |
| >5 scope cards OR multi-mission | Hierarchical (@mission-lead per mission) |
| Cross-cutting dependencies between missions | Hierarchical with @tech-lead[integration] |

### Coordinator Pattern

A coordinator agent (@rally-lead, @mission-lead):
1. Owns a subtree of executors
2. Loads the `convergence-loop` skill
3. Has its own `.agentwork/briefing.md`, `.agentwork/progress.md`, `.agentwork/handoff.md` lifecycle
4. Reports upward to its parent coordinator, not to the root
5. Never writes code or runs tests — only dispatches, evaluates, and re-plans

### Nesting Budget

| Layer | Role | Max Agents |
|---|---|---|
| 1-2 | @overseer + @rally-lead | ≤2 |
| 3 | @mission-lead instances + @tech-lead[integration] | ≤5 recommended |
| 4 | Execution teams (scouts, workers, reviewers, adversaries, arbiter) | As needed per mission |
| 5-6 | Sub-decomposition within workers | As needed |
| 7+ | Reserved for extreme decomposition | Rare |

Total budget: **10 layers max**. Recommended: **5-7** for typical features.

### Workspace Strategy by Layer

| Layer | Workspace Mode | Rationale |
|---|---|---|
| 1-2 | `inherit` | Overseer and rally-lead read the main workspace |
| 3 | `branch` | Mission isolation — independent failure domains |
| 4+ (writers) | `share` within mission branch | Parallel executors within a mission share its branch |
| 4+ (readers) | `inherit` from mission branch | Reviewers read the mission's work |

### Integration Between Missions

After all missions pass their individual arbiter gates:
1. @rally-lead dispatches @tech-lead[integration] with all mission handoffs
2. @tech-lead[integration] owns aggregation files (routers, registries, configs)
3. Integration runs on the main branch, merging mission branches
4. A final @arbiter runs cross-mission verification before completion

