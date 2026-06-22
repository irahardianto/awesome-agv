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

The authoritative commands for each language live in the corresponding idiom skill. Load the relevant skill to get the exact commands to run:

| Language             | Skill                                        | Commands Section                 |
| -------------------- | -------------------------------------------- | -------------------------------- |
| **Go**               | `.agents/skills/go-idioms/SKILL.md`          | § Formatting and Static Analysis |
| **TypeScript / Vue** | `.agents/skills/typescript-idioms/SKILL.md`  | § Formatting and Static Analysis |
| **Vue 3**            | `.agents/skills/vue-idioms/SKILL.md`         | § Linting and Type Checking      |
| **Flutter / Dart**   | `.agents/skills/flutter-idioms/SKILL.md`     | § Linting and Formatting         |
| **Rust**             | `.agents/skills/rust-idioms/SKILL.md`        | § Clippy and Formatting          |
| **Python**           | `.agents/skills/python-idioms/SKILL.md`      | § Formatting and Static Analysis |

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