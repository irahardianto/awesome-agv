---
trigger: always_on
---

## Code Idioms and Conventions

Write idiomatic code for the target language. **Before writing code in any language, load the corresponding idiom skill** from `.agents/skills/{language}-idioms/SKILL.md`. The skill is the authoritative source for that ecosystem's patterns, tooling, formatting commands, and quality checks.

### Code Completion Workflow

Every code task follows this sequence — no exceptions:

1. **Generate** — Write code following loaded idiom skill
2. **Validate** — Run language-appropriate quality checks from the skill
3. **Remediate** — Fix all detected issues
4. **Verify** — Re-run checks to confirm fixes
5. **Deliver** — Mark complete only after all checks pass

**Failure protocol:** If any quality check fails, read the error output completely, fix the root cause, and re-run. Never disable a lint rule or suppress a warning to make checks pass.
