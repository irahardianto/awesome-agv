---
trigger: always_on
---

## Code Completion Mandate

### Universal Requirement

**Before marking any code task as complete, you MUST run automated quality checks and remediate all issues.**

This is NOT OPTIONAL. Delivering code without validation violates the Rugged Software Constitution @rugged-software-constitution.md.

### The Completion Checklist

Every code generation task follows this workflow:

1. **Generate** - Write the code based on requirements
2. **Validate** - Run language-appropriate quality checks (see below)
3. **Remediate** - Fix all detected issues
4. **Verify** - Re-run checks to confirm fixes
5. **Deliver** - Mark task complete only after all checks pass

**Never skip validation "to save time." Validation IS the work.**

### Language-Specific Quality Commands

The authoritative commands for each language live in the corresponding idiom file — this keeps the work of maintaining them close to the language expertise. Load the relevant file to get the exact commands to run:

| Language             | Idiom File                         | Commands Section                 |
| -------------------- | ---------------------------------- | -------------------------------- |
| **Go**               | @go-idioms-and-patterns.md         | § Formatting and Static Analysis |
| **TypeScript / Vue** | @typescript-idioms-and-patterns.md | § Formatting and Static Analysis |
| **Vue 3**            | @vue-idioms-and-patterns.md        | § Linting and Type Checking      |
| **Flutter / Dart**   | @flutter-idioms-and-patterns.md    | § Linting and Formatting         |
| **Rust**             | @rust-idioms-and-patterns.md       | § Clippy and Formatting          |

### Failure Protocol

**If any quality check fails:**

1. Read the error output completely
2. Fix the identified issues in the code
3. Re-run the failing command
4. Do not proceed until all checks pass

> Never disable a lint rule or suppress a warning to make checks pass. Fix the root cause.

### Related Principles
- Rugged Software Constitution @rugged-software-constitution.md
- Code Idioms and Conventions @code-idioms-and-conventions.md