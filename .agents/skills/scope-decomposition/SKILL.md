---
name: scope-decomposition
description: >-
  Project and mission decomposition techniques. Vertical slicing, dependency
  graph construction, MECE validation, scope sizing, and integration point
  identification. Load when decomposing work into missions or sub-tasks.
---

## Vertical Slicing

Cut by **user-facing feature**, never by technical layer.

A vertical slice includes all layers needed to deliver one capability:
- API endpoint + business logic + data access + tests + UI (if applicable)

Each mission MUST be independently deployable and testable. If a mission cannot be verified in isolation, the slice is wrong — re-cut.

> **Anti-pattern: layer-based splitting.** Grouping all controllers into one mission, all services into another, and all repositories into a third creates cross-cutting dependencies. Every mission blocks every other mission. Never do this.

## Dependency Graph Construction

1. List all missions as nodes
2. Identify blocking relationships between them
3. Classify each dependency:
   - **Hard** — must complete first (e.g., mission B imports types defined in mission A)
   - **Soft** — beneficial but not blocking (e.g., mission B's tests are more realistic with mission A's seed data)
4. Identify the **critical path** — the longest chain of hard dependencies
5. Independent missions run in parallel; dependent missions run in sequence

Produce a **DAG** (directed acyclic graph). If cycles exist, the decomposition is wrong — break the cycle by extracting shared work into a prerequisite mission.

## MECE Validation

Validate that missions are **Mutually Exclusive, Collectively Exhaustive**.

- **Mutually Exclusive:** No file appears in two missions' write scopes.
- **Collectively Exhaustive:** Every deliverable is assigned to exactly one mission.

### Validation Checklist

1. List all files that will be created or modified across the project
2. Assign each file to exactly one mission
3. **Check for overlaps** — if a file appears in two missions:
   - Extract the shared file into a prerequisite mission, OR
   - Reassign ownership to one mission and make the other a consumer (read-only)
4. **Check for gaps** — if a deliverable is unassigned:
   - Assign to the most relevant existing mission, OR
   - Create a new mission to own it

## Scope Sizing Heuristics

| Signal | Action |
|---|---|
| Mission requires **>4 workers** | Too large — split into sub-missions |
| Mission is **1 worker editing ≤3 files** | Too small — merge with adjacent mission |
| Mission spans **>8 files** | Too broad — find a natural seam to split |
| Mission touches **<1 file** | Phantom mission — remove or merge |

**Sweet spot:** 3–8 files per mission, 1–3 workers, completable by 1 mission-lead with ≤4 workers.

## Integration Point Identification

Integration points are where missions touch each other:
- Shared API contracts (request/response types, proto files)
- Database schemas and migrations
- Event bus topics and message formats
- Configuration files and environment variables

### Rules

1. Identify ALL integration points **before** dispatch — never discover them mid-build
2. Assign integration work to `@tech-lead[integration]`, which runs **after** all missions pass
3. Shared contracts are **read-only during BUILD** — no mission may modify a shared contract unilaterally
4. If a contract needs changes, **STOP and escalate** to the coordinator for re-planning

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|---|---|---|
| Layer-based splitting | Missions named "all controllers", "all services" | Re-cut as vertical feature slices |
| Overlapping write scopes | Two missions modify the same file | Extract shared file to prerequisite mission |
| Orphan mission | No dependencies and no dependents | Suspicious — verify it delivers user-facing value or merge |
| Mission too broad | >8 files, >4 workers needed | Split along natural feature seams |
| Mission too narrow | ≤1 file, 1 worker, trivial scope | Merge with adjacent mission |
| Missing integration plan | Shared contracts discovered mid-build | Map all integration points before dispatch |
