---
trigger: always_on
---

## Rule Priority (When Rules Conflict)

When two rules pull in opposite directions, use this priority to decide:

### Priority Order (Highest to Lowest)

1. **Security Mandate** — always wins. Never compromise security for velocity, simplicity, or convenience.
2. **Rugged Software Constitution** — foundational philosophy. Code must be defensible.
3. **Code Completion Mandate** and **Logging and Observability Mandate** — both are always-on enforcement rules. Validation and instrumentation are non-negotiable; neither can be skipped to ship faster.
4. **Testability-First Design** — maintainability enables future improvements.
5. **Feature-specific principles** — context-dependent guidance for the task at hand. This includes language-specific idiom files (`go-idioms-and-patterns.md`, `typescript-idioms-and-patterns.md`, `vue-idioms-and-patterns.md`, `flutter-idioms-and-patterns.md`, `rust-idioms-and-patterns.md`). When an idiom conflicts with a higher-priority rule (e.g., security or testability), the higher-priority rule always wins.
6. **YAGNI / KISS** — only when no security, reliability, or maintainability trade-off exists.

### Common Conflict Resolutions

| Conflict                                                              | Resolution                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| YAGNI vs Security ("don't add input validation, it's not needed yet") | **Security wins.** Input validation is always needed.                           |
| KISS vs Testability ("adding an interface makes it more complex")     | **Testability wins.** Interfaces enable testing, which enables maintainability. |
| Performance vs YAGNI ("should I optimize this now?")                  | **Measure first.** Only optimize after profiling shows a real bottleneck.       |
| DRY vs Clarity ("should I abstract this into a shared utility?")      | **Clarity wins** until duplication reaches 3+ instances (Rule of Three).        |
| Speed vs Logging ("skip logging to ship faster")                      | **Logging wins.** Silent failures are the enemy.                                |

### Guiding Principle

When in doubt, ask: *"Which choice makes the code more defensible and maintainable?"*

If both options are equally defensible, choose the simpler one (KISS).

### Related Principles
- Security Mandate @security-mandate.md
- Rugged Software Constitution @rugged-software-constitution.md
- Code Completion Mandate @code-completion-mandate.md
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
