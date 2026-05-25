---
name: parallel-dispatch-dag
description: >-
  Constructs, validates, and traverses a Directed Acyclic Graph (DAG) from
  scope cards for safe level-based parallel dispatch. Determines execution
  order via topological sort. Detects cycles and invalid dependencies.
---

# Parallel Dispatch: Dependency Graph

Build a DAG from scope cards. Topological sort into levels. Dispatch all nodes at the same level in parallel.

## When to Invoke
- After scope cards are produced by `parallel-dispatch-decomposition`
- Before dispatching any agents within a primitive
- When re-planning after a sub-task failure

## Graph Construction

### Nodes
Each scope card becomes a node in the DAG:
- **ID**: `@<agent-type>[<scope>]`
- **Type**: `write` (modifies files) or `read` (read-only analysis)
- **Phase**: The primitive this node belongs to (SCOUT, DESIGN, BUILD, REVIEW, etc.)

### Edges
Each "Blocked By" or "Hard Dependencies" entry in a scope card becomes a directed edge:
- Edge direction: dependency → dependent (producer → consumer)
- Only hard dependencies create edges. Soft dependencies are advisory.

### Construction Algorithm
1. Create a node for each scope card
2. For each node, read its "Hard Dependencies" and "Blocked By" fields
3. Create an edge from each dependency to this node
4. Validate: every referenced dependency exists as a node (no dangling references)

## Topological Sort

Group nodes into **levels** based on their depth in the dependency graph:

- **Level 0**: Nodes with zero incoming edges (no dependencies). These execute first.
- **Level N**: Nodes whose dependencies are all in levels 0 through N-1.

All nodes at the same level are independent of each other and can be dispatched in parallel.

### Sort Algorithm
```
1. Initialize in-degree count for each node
2. Enqueue all nodes with in-degree = 0 → Level 0
3. For each node in current level:
   a. Remove its outgoing edges (decrement in-degree of dependents)
   b. If any dependent's in-degree reaches 0 → add to next level
4. Repeat until all nodes assigned
5. If unassigned nodes remain → cycle detected → ABORT
```

## DAG Output Format

Present the execution plan as a leveled dispatch table:

```markdown
## Execution DAG

### Level 0 (no dependencies — dispatch in parallel)
| Node | Agent | Scope | Type | Deliverables |
|------|-------|-------|------|-------------|
| 1 | @scout | [auth] | read | Auth pattern research |
| 2 | @scout | [tasks] | read | Task engine research |
| 3 | @scout | [infra] | read | Infrastructure research |

### Level 1 (depends on Level 0 — dispatch after Level 0 completes)
| Node | Agent | Scope | Type | Blocked By | Deliverables |
|------|-------|-------|------|-----------|-------------|
| 4 | @architect | [api-contracts] | write | 1, 2 | API contract definitions |
| 5 | @architect | [data-model] | write | 1, 2, 3 | Data model design |

### Level 2 (depends on Level 1 — dispatch after Level 1 completes)
| Node | Agent | Scope | Type | Blocked By | Deliverables |
|------|-------|-------|------|-----------|-------------|
| 6 | @backend-engineer | [auth] | write | 4 | Auth feature implementation |
| 7 | @backend-engineer | [tasks] | write | 4, 5 | Task feature implementation |
| 8 | @frontend-engineer | [auth-ui] | write | 4 | Auth UI components |
| 9 | @frontend-engineer | [task-ui] | write | 4, 5 | Task UI components |

### Level 3 (depends on Level 2 — dispatch after Level 2 completes + merges)
| Node | Agent | Scope | Type | Blocked By | Deliverables |
|------|-------|-------|------|-----------|-------------|
| 10 | @backend-engineer | [integration] | write | 6, 7 | Router wiring, app entry |
| 11 | @frontend-engineer | [integration] | write | 8, 9 | Route registration, app shell |
```

## Validation Rules

### Pre-Dispatch Validation
Run these checks before dispatching any level:

1. **No Cycles**: Topological sort completes without leftover nodes
2. **No Dangling References**: Every "Blocked By" references an existing node
3. **MECE Write Scopes**: No two write-nodes at the same level share file allowlists (delegate to `parallel-dispatch-ownership`)
4. **Phase Ordering**: Phase ordering follows orchestrate.toml Composition Rules (DESIGN before BUILD, BUILD before REVIEW, REVIEW before REMEDIATE)
5. **Integration Last**: Integration sub-tasks have edges from all same-type parallel nodes

### Cycle Detection
If topological sort leaves unassigned nodes:
1. Identify the cycle (nodes with remaining in-degree > 0)
2. Report: "CYCLE DETECTED: @agent[scope-A] ↔ @agent[scope-B]. Re-decompose to break circular dependency."
3. Return to `parallel-dispatch-decomposition` for re-clustering
4. Never dispatch with a cycle present

## Level Execution Protocol

For each level in order:

```
1. Validate all nodes at this level (pre-dispatch checks)
2. Create git worktrees for all write-nodes at this level
3. Dispatch all nodes at this level in parallel
4. Wait for all nodes to complete
5. If any node fails:
   a. Retry once with clarified context (per Circuit Breaker in orchestrate command)
   b. If still fails → assess downstream impact
   c. If failure changes scope → re-decompose affected sub-tree only
   d. If failure blocks downstream → STOP, escalate
6. Merge completed write-node branches (per parallel-dispatch-merge)
7. Run quality gates (per Code Completion Mandate)
8. Proceed to next level
```

## Cross-Phase Dependencies

The DAG spans multiple phases. Standard phase ordering per orchestrate.toml Composition Rules:

```
Feature pipeline:
  SCOUT → DESIGN → PRE-MORTEM (optional) → BUILD ∥ TEST → REVIEW → REMEDIATE → VERIFY → DOCUMENT

Standalone pipelines:
  OPTIMIZE:  After BUILD (or standalone)
  REFACTOR:  After REVIEW or SCOUT
  INCIDENT:  Standalone (production issues) → REMEDIATE → REVIEW → VERIFY → DOCUMENT
  PRE-MORTEM: After DESIGN (standalone risk assessment via Template L)
```

Phase ordering rules (from orchestrate.toml):
1. DESIGN before BUILD
2. PRE-MORTEM after DESIGN, before BUILD (optional but recommended for high-risk features)
3. BUILD before REVIEW
4. REVIEW before REMEDIATE
5. VERIFY after final merge
6. DOCUMENT always last (optional)
7. SCOUT can appear anywhere
8. OPTIMIZE can follow BUILD directly or run standalone
9. REFACTOR can follow REVIEW or SCOUT
10. INCIDENT is always standalone
11. PRE-MORTEM findings are advisory — BUILD proceeds with risk-aware context

Within each phase, levels are determined by intra-phase dependencies. Between phases, the entire preceding phase must complete before the next phase starts.

**Exception**: SCOUT and DESIGN within the same phase can interleave if specific scout findings feed specific design decisions (model as explicit edges).

## Dynamic Re-Planning

If a node fails and changes the scope of downstream work:

1. Mark failed node and all downstream dependents as `invalidated`
2. Re-run `parallel-dispatch-decomposition` on the invalidated sub-tree only
3. Rebuild the DAG from the invalidation point
4. Resume execution from the re-planned level
5. Already-completed nodes outside the invalidated sub-tree are preserved

## Merge Points

After each level completes, write-node branches must be merged before the next level starts. This is the **merge point**. The `parallel-dispatch-merge` skill handles the merge protocol.

Read-only nodes do not produce branches — they produce documents/findings that are passed as context to downstream nodes.

## Related Skills
- parallel-dispatch-decomposition — produces scope cards consumed by this skill
- parallel-dispatch-ownership — validates MECE file boundaries at each level
- parallel-dispatch-merge — merges branches at each merge point
