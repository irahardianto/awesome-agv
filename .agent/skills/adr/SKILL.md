---
name: adr
description: Architecture Decision Record skill for documenting significant architectural decisions with context, options, and consequences. Use during the Research phase when choosing between approaches, or whenever the user asks to document an architectural decision.
---

# Architecture Decision Record (ADR) Skill

## Purpose
Document significant architectural decisions so institutional knowledge persists across conversations and team members. ADRs capture the **why**, not just the **what**.

## When to Invoke
- During Research phase (`/1-research`) when a significant architecture decision is identified
- When user explicitly asks to document a decision
- When choosing between 2+ viable approaches
- When introducing a new dependency or pattern
- When changing existing architecture

## ADR Storage
ADRs are stored in `docs/decisions/` as numbered files:
```
docs/decisions/
├── 0001-use-postgresql-for-storage.md
├── 0002-adopt-feature-based-structure.md
├── 0003-use-testcontainers-for-integration.md
└── NNNN-short-title.md
```

## ADR Template

Create the ADR file at `docs/decisions/NNNN-short-title.md`:

```markdown
# NNNN. Short Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by NNNN

## Context
What is the issue that we're seeing that is motivating this decision?
Include technical constraints, business requirements, and relevant context.

## Options Considered

### Option A: {name}
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

### Option B: {name}
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

### Option C: {name} (if applicable)
- **Pros:** ...
- **Cons:** ...
- **Effort:** Low/Medium/High

## Decision
We chose **Option X** because...

## Consequences

### Positive
- What becomes easier or possible as a result

### Negative
- What becomes harder as a result
- Technical debt introduced (if any)

### Risks
- What could go wrong with this decision
- Mitigation strategies

## Related
- Links to relevant rules, previous ADRs, or external resources
```

## Process Guidelines

1. **Number sequentially** — check existing ADRs in `docs/decisions/` for the next number
2. **Keep titles short** — descriptive enough to identify the decision at a glance
3. **Status lifecycle:** `Proposed` → `Accepted` (after approval) → optionally `Deprecated` or `Superseded`
4. **Never delete ADRs** — if a decision is reversed, mark as `Superseded by NNNN` and create a new ADR
5. **Use Sequential Thinking skill** if the trade-off analysis is complex

## Rule Compliance
ADRs should reference applicable rules:
- Architectural Patterns @architectural-pattern.md
- Core Design Principles @core-design-principles.md
- Project Structure @project-structure.md
