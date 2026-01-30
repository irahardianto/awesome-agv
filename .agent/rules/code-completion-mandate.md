---
trigger: always_on
---

## Code Completion Mandate

### Universal Requirement

**Before marking any code task as complete, you MUST run automated quality checks and remediate all issues.**

This is NOT OPTIONAL. Delivering code without validation violates the Rugged Software Manifesto @rugged-software-manifesto.

### The Completion Checklist

Every code generation task follows this workflow:

1. **Generate** - Write the code based on requirements
2. **Validate** - Run language-appropriate quality checks
3. **Remediate** - Fix all detected issues
4. **Verify** - Re-run checks to confirm fixes
5. **Deliver** - Mark task complete only after all checks pass

**Never skip validation "to save time." Validation IS the work.**

### Language-Specific Quality Commands

When you complete code, run these commands based on the language:

#### Go
```bash
# Format
gofumpt -l -w .

# Static Analysis
go vet ./...
staticcheck ./...

# Security
gosec -quiet ./...

# Tests
go test -race ./...
```

**If any command fails:**

1. Read the error output 
2. Fix the identified issues in the code
3. Re-run the command
4. Do not proceed until all pass

#### TypeScript/Vue
```bash
# Format & Lint
pnpm run lint --fix

# Type Check
npx vue-tsc --noEmit

# Tests
pnpm run test
```

**If any command fails:**

1. Read the error output
2. Fix the identified issues
3. Re-run the command
4. Do not proceed until all pass