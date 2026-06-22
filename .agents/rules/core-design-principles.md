---
trigger: always_on
---

## Core Design Principles

Apply SOLID, DRY, KISS, and Separation of Concerns. Below are **project-specific decisions** where reasonable approaches differ — these override default model judgment:

### Design Decisions

**Maintainability > UX:** When they conflict, prefer maintainable code. Poor UX from clean code can be fixed; poor code from UX pressure compounds into permanent tech debt.

**Composition over inheritance — always.** Use interfaces/traits for polymorphism. Deep inheritance hierarchies are rejected.

**DRY threshold — Rule of Three.** Don't abstract until 3+ instances. Premature abstraction is worse than duplication.

**YAGNI/KISS ceiling.** Maintainability always wins. Never use YAGNI or KISS to justify skipping security, testability, or error handling.

**Principle of Least Astonishment.** Follow established conventions in the language and codebase. Clever code that surprises maintainers is rejected in review.

**SRP signal.** If explaining what something does requires "and", it likely violates SRP. Split it.

### Related Principles
- Architectural Patterns @architectural-pattern.md
- Code Organization Principles @code-organization-principles.md
- Documentation Principles @documentation-principles.md
- Accessibility Principles @accessibility-principles.md