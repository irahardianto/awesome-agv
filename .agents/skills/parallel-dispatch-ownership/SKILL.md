---
name: parallel-dispatch-ownership
description: >-
  Enforces MECE file boundaries for parallel write-agents. Validates that
  no two writers share file access. Manages the contracts layer (shared
  reads) and integration sub-task patterns. The safety invariant that
  prevents merge chaos.
---

# Parallel Dispatch: File Ownership

Enforce exclusive write access per parallel sub-task. This is the **safety invariant** — if ownership is valid, merges are conflict-free by construction.

## When to Invoke
- After scope cards are produced, before DAG dispatch
- At each merge point to verify no ownership violations occurred
- When re-decomposing after a failure

## Ownership Model

### Three Zones

| Zone | Access | Who | Immutability |
|------|--------|-----|-------------|
| **Exclusive Write** | Read + Write | Exactly one sub-task | Mutable only by owner |
| **Shared Read** | Read only | Any sub-task | Immutable during BUILD phase |
| **Contracts Layer** | Read only | All BUILD agents | Produced by DESIGN phase, frozen for BUILD |

### Exclusive Write
Each writing sub-task owns a disjoint set of files or directories. No two writers may touch the same file. This is enforced at the glob-pattern level from scope cards.

### Shared Read
Any sub-task can read files outside its write scope. Common shared reads:
- Type definitions and interfaces
- Configuration templates
- Middleware and utility packages
- Test helpers and fixtures

Shared read files MUST NOT be modified by any BUILD-phase sub-task. If a BUILD agent needs to modify a shared file, it must be assigned to exactly one sub-task's write scope or handled by an integration sub-task.

### Contracts Layer
Files produced during DESIGN phase that define interfaces between features:
- API contracts (endpoint definitions, request/response types)
- Database schemas (table definitions, migration files)
- Shared type definitions

These are **frozen** during BUILD. If a BUILD agent discovers the contract needs changes → STOP and escalate to orchestrator for a DESIGN revision.

## Ownership Matrix

Build a matrix from scope cards before dispatch. This is a dynamic output, not a static template. Actual paths come from the project's real structure discovered during decomposition.

```markdown
## File Ownership Matrix

| Sub-Task | Write Scope (exclusive) | Shared Reads |
|----------|------------------------|--------------|
| @<agent>[<scope-1>] | `<path/to/feature-1>/**` | `<path/to/types>/**`, `<path/to/config>/**` |
| @<agent>[<scope-2>] | `<path/to/feature-2>/**` | `<path/to/types>/**`, `<path/to/config>/**` |
| @<agent>[integration] | `<path/to/router>/**`, `<path/to/main>.*` | All feature directories (read-only) |
```

## Validation Protocol

### Pre-Dispatch Validation (MANDATORY)

Run before dispatching any level of the DAG:

#### 1. Intersection Test
For each pair of write scopes at the same DAG level:
```
For scope_A, scope_B in all_write_scopes:
    overlap = files_matching(scope_A) ∩ files_matching(scope_B)
    if overlap is not empty:
        ABORT: "Ownership conflict: {scope_A} and {scope_B} both claim write access to {overlap}"
```

#### 2. Coverage Test
```
union_of_write_scopes = ∪ all_write_scopes
required_modifications = all files that need changes (from deliverables)
uncovered = required_modifications - union_of_write_scopes
if uncovered is not empty:
    ABORT: "Coverage gap: files {uncovered} need modification but no sub-task owns them"
```

#### 3. Contract Immutability Test
```
for each BUILD sub-task:
    if write_scope intersects contracts_layer:
        ABORT: "Contract violation: {sub-task} attempts to write to contract file {file}"
```

#### 4. Integration Sub-Task Placement
```
for each integration sub-task:
    if integration sub-task is at same DAG level as parallel sub-tasks:
        ABORT: "Integration sub-task must run AFTER all parallel sub-tasks"
```

### Post-Merge Validation
After each merge, verify no ownership violation occurred during execution:
```
for each merged branch:
    modified_files = git diff --name-only HEAD~1
    for each file in modified_files:
        if file not in sub-task's write_scope AND file not in sub-task's shared_reads:
            WARNING: "Agent modified file outside its write scope: {file}"
```

## Conflict Scenarios and Resolutions

| Scenario | Resolution |
|----------|------------|
| Two features need the same file | **Merge clusters**: combine into one sub-task. OR **Extract**: move shared code into a contract file produced during DESIGN. |
| Router/config aggregation files | **Integration sub-task**: designate a single sub-task that runs after all parallel tasks, owns only the aggregation files. |
| Shared types need new fields | **DESIGN phase**: types are produced and frozen before BUILD. If BUILD discovers missing fields → escalate for DESIGN revision. |
| Test helpers shared across features | **Shared read zone**: test utils in read-only zone. Feature-specific tests in each sub-task's write scope. |
| Migration files with ordering deps | **Single owner**: one `@database-expert` sub-task owns all migrations. OR **Sequential migrations**: each sub-task creates independently-ordered migrations with explicit ordering contracts. |
| CSS/style aggregation | **Integration sub-task**: one frontend sub-task merges global styles after all component sub-tasks complete. |

## Integration Sub-Task Pattern

For files that aggregate contributions from multiple features:

```markdown
### Integration Sub-Task: @<agent-type>[integration]
- **Runs After**: All parallel sub-tasks for this agent type at this DAG level
- **Write Scope**: Only aggregation files (router, registry, main entry, global config)
- **Purpose**: Wire up all feature modules produced by parallel sub-tasks
- **Merge Order**: Always merges LAST within its agent type
```

Common integration files by domain:

| Domain | Typical Integration Files |
|--------|--------------------------|
| Backend (Go) | `cmd/server/main.go`, `internal/router/*.go`, `internal/app.go` |
| Backend (Node) | `src/index.ts`, `src/routes/index.ts`, `src/app.ts` |
| Frontend (Vue) | `src/router/index.ts`, `src/App.vue`, `src/main.ts` |
| Frontend (React) | `src/App.tsx`, `src/routes.tsx`, `src/index.tsx` |
| Mobile (Flutter) | `lib/main.dart`, `lib/router.dart`, `lib/app.dart` |
| DevOps | `docker-compose.yml`, `Makefile`, CI pipeline config |

## Read-Only Agent Ownership

Read-only agents (scout, qa-analyst, security-engineer, ux-reviewer, incident-responder) don't modify files, so ownership serves a different purpose: **coverage guarantee**.

- Each read-only instance gets a disjoint **read scope** (MECE for exhaustiveness)
- No conflict risk from overlapping reads
- The ownership matrix tracks read scopes to ensure 100% coverage:

```markdown
| Sub-Task | Read Scope (MECE) | Output |
|----------|-------------------|--------|
| @qa-analyst[auth-review] | `apps/backend/features/auth/**`, `apps/frontend/src/features/auth/**` | Findings document |
| @qa-analyst[task-review] | `apps/backend/features/tasks/**`, `apps/frontend/src/features/task/**` | Findings document |
```

## Related Skills
- parallel-dispatch-decomposition — produces scope cards with file allowlists
- parallel-dispatch-dag — uses ownership validation before dispatching levels
- parallel-dispatch-merge — sequential merge ensures ownership integrity
- guardrails — pre-flight checks can include ownership verification
