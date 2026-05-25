---
name: parallel-dispatch-decomposition
description: >-
  Decomposes broad tasks into MECE, parallelizable sub-tasks with explicit
  scope cards. Core skill for intra-domain parallel dispatch. Produces
  scope cards consumed by parallel-dispatch-dag, parallel-dispatch-ownership,
  and parallel-dispatch-merge skills.
---

# Parallel Dispatch: Task Decomposition

Break a broad task into parallelizable, MECE sub-tasks. Each sub-task gets a **scope card** that defines its boundaries, deliverables, and dependencies.

## When to Invoke
- Before dispatching multiple instances of the same agent type within a primitive
- When a single agent's workload spans multiple independent feature slices
- When the orchestrator identifies >1 natural cluster of work within a domain

## Decomposition Strategies by Phase

| Phase | Decomposition Axis | Example Scopes |
|-------|--------------------|----------------|
| SCOUT | Investigation area (feature, subsystem, technology) | `[auth]`, `[tasks]`, `[notifications]` |
| DESIGN | Architectural concern (contracts, data model, boundaries) | `[api-contracts]`, `[data-model]`, `[component-boundaries]` |
| PRE-MORTEM | Risk domain (failure modes, blast radius, recovery) | `[failure-modes]`, `[blast-radius]`, `[recovery-paths]`, `[threat-model]` |
| BUILD | Feature slice (vertical feature boundaries) | `[auth]`, `[tasks]`, `[lists]` |
| TEST | Test suite domain (E2E suite, contract suite) | `[auth-e2e]`, `[task-e2e]`, `[api-contract]` |
| REVIEW | Review dimension or feature scope | `[auth-review]`, `[security-dim]`, `[test-coverage]` |
| REMEDIATE | Mirrors BUILD decomposition (fix what you built) | Same scopes as BUILD findings |
| OPTIMIZE | Performance domain (CPU, memory, I/O, queries) | `[query-opt]`, `[cache]`, `[concurrency]` |
| REFACTOR | Module boundary or code smell cluster | `[user-module]`, `[task-module]` |

## Decomposition Protocol

### Step 1: Inventory
List all concrete deliverables for this primitive. Be specific: files, modules, endpoints, tests.

### Step 2: Cluster
Group deliverables by natural boundaries. Prefer **feature-based** clustering over technical-layer clustering.

**Correct** (feature-based):
```
Cluster: auth → handler, service, repository, middleware, tests
Cluster: tasks → handler, service, repository, tests
```

**Wrong** (layer-based):
```
Cluster: handlers → auth handler, task handler, list handler
Cluster: services → auth service, task service, list service
```

Feature-based clustering produces naturally independent sub-tasks. Layer-based creates cross-cutting dependencies.

### Step 3: MECE Validate

- **Mutually Exclusive**: No file appears in two clusters. Check by listing all files per cluster and verifying zero intersection.
- **Collectively Exhaustive**: Union of all clusters equals total scope. No deliverable left unassigned.

If either check fails → re-cluster.

### Step 4: Dependency Scan

For each cluster, identify:
1. **Inputs**: What must exist before this sub-task can start? (API contracts, types, schemas)
2. **Outputs**: What does this sub-task produce that others consume?
3. **Shared reads**: Files this sub-task reads but does not modify (types, interfaces, configs)

Mark dependencies as:
- `hard` → cannot start without this input (blocks parallel execution)
- `soft` → benefits from this input but can proceed with assumptions (parallelizable)

### Step 5: Scope Card

Produce one scope card per sub-task:

```markdown
### Scope Card: @<agent-type>[<scope>]
- **Deliverables**: <list of concrete outputs>
- **File Allowlist**: <glob pattern for exclusive write access>
- **Shared Reads**: <glob patterns for read-only access>
- **Hard Dependencies**: <scope cards that must complete first>
- **Soft Dependencies**: <scope cards that are beneficial but not blocking>
- **Blocked By**: <list of scope card names>
- **Blocks**: <list of downstream scope card names>
```

### Step 6: Parallelism Cap Check

Count sub-tasks per agent type. If >5 instances of the same agent type:
1. Warn the user: "Decomposition produced N instances of @<agent-type>. This exceeds the soft cap of 5."
2. Present options:
   - Continue with N instances (maximum parallelism)
   - Cap at 5 (merge smallest clusters)
   - Cap at custom number
3. Wait for user decision before proceeding.

## Scope Card Rules

1. Every scope card MUST have at least one concrete deliverable
2. Every scope card MUST have a file allowlist (even if broad)
3. File allowlists between write-agents MUST be disjoint (enforced by parallel-dispatch-ownership)
4. Scope names use kebab-case: `[auth]`, `[task-crud]`, `[user-profile]`
5. Scope cards for read-only agents define read scope, not write scope
6. Empty scope cards are invalid → merge with adjacent cluster

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| Layer-based decomposition | Creates cross-cutting deps, every sub-task touches every feature | Use feature-based clustering |
| Shared write access | Two agents editing same file → merge conflicts guaranteed | One writer per file, extract shared code to contract layer |
| Scope too small (<1 file) | Overhead exceeds benefit, context fragmentation | Merge into adjacent cluster |
| Scope too broad (entire domain) | No parallelism gained, single bottleneck | Break into feature slices |
| Missing MECE validation | Gaps → missed deliverables, overlaps → conflicts | Always run Step 3 |
| Decomposing without design output | No contracts → agents make incompatible assumptions | DESIGN before BUILD decomposition |

## Read-Only Agent Decomposition

Read-only agents (scout, qa-analyst, security-engineer, ux-reviewer, incident-responder) use MECE scoping for **coverage guarantees**, not conflict prevention:
- Each instance covers a disjoint area of the codebase or investigation space
- Union of all instances covers 100% of the relevant scope
- If deeper perspective is needed on a specific topic, add another parallel agent for that topic specifically

## Integration Sub-Task Pattern

Some files inherently aggregate contributions from multiple features (routers, registries, main entry points, config files). Handle with a dedicated integration sub-task:

```markdown
### Scope Card: @<agent-type>[integration]
- **Deliverables**: Wire all feature modules into application entry point
- **File Allowlist**: <aggregation files only>
- **Hard Dependencies**: All parallel sub-tasks for this agent type
- **Blocks**: REVIEW phase
```

Integration sub-tasks always run after all parallel sub-tasks complete. They merge last.

## Related Skills
- parallel-dispatch-dag — consumes scope cards, builds execution DAG
- parallel-dispatch-ownership — validates MECE file boundaries from scope cards
- parallel-dispatch-merge — merges completed worktree branches
- research-methodology — topic decomposition for SCOUT phase
