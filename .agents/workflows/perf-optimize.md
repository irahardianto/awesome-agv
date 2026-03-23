---
description: Profile-driven performance optimization workflow
---

# Performance Optimization Workflow

**Trigger:** User provides profiling data, asks to optimize performance, or benchmarks show regression.

**Skill prerequisite:** Read `.agents/skills/perf-optimization/SKILL.md` before starting.

// turbo-all

## Steps

### 1. Load the Skill
Read the perf-optimization skill and the relevant language module:
```
view_file .agents/skills/perf-optimization/SKILL.md
view_file .agents/skills/perf-optimization/languages/{language}.md
```

### 2. Collect Profile Data

**If the user provides a profile file or URL:**
- Use the language-appropriate extraction script (e.g., `scripts/go-pprof.sh cpu profile.prof`)

**If the user asks to profile from scratch:**
- Run the extraction script in `bench` mode to generate AND analyze profiles in one step:
```bash
bash .agents/skills/perf-optimization/scripts/go-pprof.sh bench ./path/to/package/... BenchmarkName
```

### 3. Analyze

Create a structured analysis document:
```
docs/research_logs/{component}-perf-analysis.md
```

Follow the analysis methodology from SKILL.md:
1. Focus on cumulative, trace flat back to user-land code
2. Identify top 3-5 offenders
3. Separate benchmark artifacts from production cost
4. Identify irreducible floors (reference the language module's table)

### 4. Prioritize Fixes

Create an implementation plan ranking fixes by impact/risk:
- Low risk, high impact → do first
- High risk, any impact → do last or skip

Present the plan to the user for approval before proceeding.

### 5. Implement (one fix at a time)

For each fix, follow the orchestrator workflow:

1. **Write tests first** (TDD Red → Green)
2. **Implement the fix**
3. **Run all existing tests** (`go test -race ./...` or equivalent)
4. **Benchmark immediately** — compare ns/op, B/op, allocs/op
5. **Run quality checks** (formatter, linter, security scanner)
6. **Commit independently** with conventional format: `perf(scope): description`

**Rule:** One fix per commit. Never batch optimizations.

### 6. Final Verification

After all fixes are applied:
1. Run the full benchmark suite with `-count=3` minimum
2. Compare against the original baseline (before any fixes)
3. Run the complete test suite with `-race`
4. Run all quality checks (formatter, linter, security scanner, build)

### 7. Document Results

Update the analysis document with:
- Before/after benchmark comparison table
- Which fixes were applied and which were skipped (and why)
- Any remaining optimization opportunities for future sessions

### 8. Ship

Commit and present the final results to the user with:
- Cumulative benchmark improvement table
- List of commits
- Any follow-up items

---

## Quick Reference

| Phase | Output | Gate |
|---|---|---|
| Profile | Raw data + extracted markdown | Data collected |
| Analyze | `docs/research_logs/{component}-perf-analysis.md` | Top offenders identified |
| Prioritize | Implementation plan | User approved |
| Implement | Tests + code + benchmark per fix | Each fix passes tests |
| Verify | Full benchmark comparison | All checks pass |
| Ship | Conventional commits | User notified |
