---
name: agent-protocols
description: >-
  Shared protocols for all agents in the multi-agent pipeline: recursive
  nesting, pre-implementation restatement, parallel dispatch format, and
  agent definition cascade. Load this skill instead of inlining these
  protocols in every agent file.
---

# Agent Protocols

Shared behavioral protocols for all agents in the workflow-team pipeline.

## 1. Recursive Nesting Protocol

When your scope card is too broad for a single context:

1. Further decompose using `parallel-dispatch` skill (§1 Decomposition, §5 Hierarchical Decomposition)
2. Spawn sub-agents with narrower scope cards
3. Your scope becomes the ceiling — children cannot operate outside it
4. Track sub-agent progress; merge results when all complete
5. Write `.agentwork/handoff.md` for your parent coordinator

Triggers for nesting:
- Task edits >3 unrelated files
- Scope card contains >2 features
- Context approaching 50% capacity
- Secondary expertise needed (delegate to specialist)

## 2. Pre-Implementation Restatement

Before writing code, restate in your own words:
1. What the `.agentwork/briefing.md` / scope card asks you to build
2. What files you will create or modify
3. What assumptions you are making

If any assumption is uncertain, document it in `.agentwork/progress.md` and proceed with the conservative interpretation.

## 3. Agent Definition Protocol (Coordinators Only)

When spawning ANY agent type with a role file in `.agents/agents/`:

1. **Reference the role file** in the system prompt — never paraphrase:
   ```
   "Your role, domain, skills, boundaries, and protocols are defined in
   file:///{workspace}/.agents/agents/{agent-type}.md.
   Read this file FIRST before beginning any work."
   ```
2. The child agent MUST read the role file as its first action
3. Propagate this protocol recursively — if the child is a coordinator, it must follow the same rule when spawning its own children

## 4. Parallel Dispatch Format

Each agent file contains a `## Parallel Dispatch` section with role-specific values. The standard fields are:

| Field | Purpose |
|---|---|
| **Scope Axis** | The dimension used to partition work (feature, concern, domain) |
| **Write Scope** | Glob pattern for exclusive write access |
| **Shared Reads** | Glob patterns for read-only access |
| **Constraint** | Key limitation on parallel instances |
| **Integration** | How parallel results are reconciled (if applicable) |

For read-only agents, `Write Scope` becomes `Read Scope` and scoping is for coverage guarantee, not conflict prevention.
