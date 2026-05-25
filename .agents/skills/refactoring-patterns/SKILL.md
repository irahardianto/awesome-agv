---
name: refactoring-patterns
description: >-
  Safe refactoring pattern catalog: code smell taxonomy, transformation
  techniques, behavior preservation strategies, and metrics tracking.
---

# Refactoring Patterns

Catalog of safe, incremental code transformation patterns.

## When to Invoke
- Executing `/refactor` command
- Technical debt remediation
- Pattern migration (e.g., callbacks → async/await)
- Code smell resolution from static analysis findings

## Code Smell Taxonomy

### Structural Smells
| Smell | Detection | Refactoring |
|---|---|---|
| **Long method** | >30 lines | Extract method |
| **Large class** | >300 lines or >5 responsibilities | Extract class |
| **Long parameter list** | >4 parameters | Introduce parameter object |
| **Feature envy** | Method uses another class's data more than its own | Move method |
| **Data clumps** | Same fields appear together repeatedly | Extract class |
| **Primitive obsession** | Primitives where domain types belong | Introduce value object |

### Coupling Smells
| Smell | Detection | Refactoring |
|---|---|---|
| **God class** | One class knows/does too much | Extract classes by responsibility |
| **Circular dependency** | A → B → A | Introduce interface, dependency inversion |
| **Inappropriate intimacy** | Classes access each other's internals | Move method, extract interface |
| **Shotgun surgery** | One change requires touching many files | Move related code together |

## Safe Transformation Techniques

### 1. Characterization Tests
Before refactoring, write tests that capture current behavior:
```
Run existing code → record outputs → assert in tests → now refactor safely
```

### 2. Strangler Fig Pattern
Gradually replace old implementation with new:
```
Old Code ← requests
         ↓ gradually route to
New Code ← requests (eventually all traffic)
Old Code ← delete
```

### 3. Branch by Abstraction
1. Create abstraction (interface) over existing implementation
2. Modify all clients to use abstraction
3. Create new implementation behind abstraction
4. Switch to new implementation
5. Remove old implementation

### 4. Parallel Run
Run old and new implementations simultaneously, compare outputs:
```
Request → Old Implementation → Response (returned to user)
       → New Implementation → Response (logged, compared)
```

## Behavior Preservation Checklist

- [ ] Tests pass before starting
- [ ] Each step is a single, atomic change
- [ ] Tests pass after each step
- [ ] Same inputs produce same outputs
- [ ] Coverage ≥ pre-refactoring level
- [ ] No new public API surface (unless intentional)
- [ ] Complexity metrics improved or unchanged

## Metrics

| Metric | Tool | Target |
|---|---|---|
| Cyclomatic complexity | SonarQube, radon, gocyclo | ≤ 10 per function |
| Cognitive complexity | SonarQube | ≤ 15 per function |
| Coupling (afferent/efferent) | JDepend, NDepend | Decreasing trend |
| Duplication | SonarQube, jscpd | < 3% |
| Test coverage | lcov, coverage.py | ≥ pre-refactoring |

## Related
- Code Review @.agents/skills/code-review/SKILL.md
- Guardrails @.agents/skills/guardrails/SKILL.md
- Testing Strategy .agents/rules/testing-strategy.md
