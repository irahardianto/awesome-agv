# Performance Analysis Report Template

Use this template when writing the Phase 3 analysis report and updating it with Phase 6 results.
Fill all `{placeholders}` with actual data from the analysis findings and benchmarks.

**Output location:** `docs/audits/perf-analysis-{component}-{YYYY-MM-DD}-{HHmm}.md`

---

```markdown
# Performance Analysis: {Component/Module Name}
Date: {date}
Analyst: AI Performance Optimizer (multi-dimensional, {N} parallel subagents)
Language: {language/runtime}
Profiling Tool: {tool, e.g., pprof, py-spy, Chrome DevTools}

## Executive Summary
- **Dimensions activated:** {list, e.g., A, B, C, D, E}
- **Dimensions skipped:** {list with reasons, e.g., "F (no frontend bundles)"}
- **Hot paths analyzed:** {N}
- **Findings:** {N total} ({X} critical, {Y} high, {Z} medium, {W} low)
- **Estimated cumulative impact:** {e.g., "~65% reduction in hot-path allocations, ~30% latency improvement"}
- **Baseline benchmarks:** {benchmark name(s) and baseline numbers}
- **Overall performance health:** OPTIMAL / HEALTHY / NEEDS OPTIMIZATION / CRITICAL BOTTLENECK

## Baseline Profile Summary
Brief overview of the profiling data that drove this analysis.
- **CPU profile:** Top 5 functions by cum%, top 5 by flat%
- **Heap profile:** Top allocators by allocs/op and B/op
- **Trace/mutex profile:** (if collected) Key contention points
- **Benchmark baseline:** {benchmark command and results — ns/op, B/op, allocs/op}

## Critical Findings
Algorithmic or resource issues causing non-linear degradation. Must be fixed immediately.
- [ ] **[CRIT-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Profiler Evidence:** {cum%, flat%, allocs, or measurable indicator}
  - **Description:** {what the performance issue is}
  - **Estimated Impact:** {expected improvement}
  - **Pattern:** {matching SKILL.md pattern, e.g., "Result Caching"}
  - **Optimization Guidance:** {specific fix approach}
  - **Benchmark Target:** {which benchmark verifies this fix}
  - **Risk:** LOW / MEDIUM / HIGH
  - **Fix workflow:** Phase 4 of the `/perf-optimize` skill, or `/refactor` if > 100 lines

## High Findings
Significant measurable waste in hot paths. Fix before release.
- [ ] **[HIGH-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Profiler Evidence:** {evidence}
  - **Description:** {description}
  - **Estimated Impact:** {impact}
  - **Pattern:** {pattern}
  - **Optimization Guidance:** {guidance}
  - **Benchmark Target:** {target}
  - **Risk:** LOW / MEDIUM / HIGH
  - **Fix workflow:** Phase 4 of the `/perf-optimize` skill, or `/refactor` if > 100 lines

## Medium Findings
Moderate waste detectable in profiles. Fix near term.
- [ ] **[MED-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Profiler Evidence:** {evidence}
  - **Description:** {description}
  - **Estimated Impact:** {impact}
  - **Optimization Guidance:** {guidance}
  - **Risk:** LOW / MEDIUM / HIGH

## Low Findings
Minor optimization opportunities. Backlog.
- [ ] **[LOW-001]** {title} — [{file}:{line}](file:///path)
  - **Dimension:** {A/B/C/D/E/F}
  - **Suggestion:** {description}

## Cross-Dimension Correlations
Findings that span multiple dimensions, with escalated severity.
- {description of correlated findings and why severity was escalated}

## Implementation Priority Matrix

Findings ranked by impact/risk ratio for implementation order.

| Priority | ID | Title | Impact | Risk | Approach |
|---|---|---|---|---|---|
| 1 | {ID} | {title} | {HIGH/MED} | {LOW} | {one-line approach} |
| 2 | {ID} | {title} | {HIGH} | {MED} | {one-line approach} |
| Skip | {ID} | {title} | {LOW} | {HIGH} | {reason for skipping} |

**Priority rules:**
- Low risk, high impact → do first
- Medium risk, high impact → do second
- High risk, high impact → do last
- Any risk, low impact → skip (below noise floor)

## Dimensions Covered
<!-- Required when total findings < 3 -->
| Dimension | Status | Scope Examined |
|---|---|---|
| A. CPU & Computation | ✅ Analyzed / ⏭ Skipped (reason) | e.g., analyzed top 10 CPU functions, scanned 8 hot-path modules |
| B. Memory & Allocation | ✅ Analyzed / ⏭ Skipped (reason) | e.g., reviewed heap profile, scanned all handler allocations |
| C. I/O & Network | ✅ Analyzed / ⏭ Skipped (reason) | e.g., traced database queries, reviewed HTTP client patterns |
| D. Concurrency & Parallelism | ✅ Analyzed / ⏭ Skipped (reason) | e.g., analyzed mutex profile, reviewed goroutine patterns |
| E. Serialization & Data Structures | ✅ Analyzed / ⏭ Skipped (reason) | e.g., profiled JSON parsing, reviewed data structure selection |
| F. Build, Bundle & Deployment | ✅ Analyzed / ⏭ Skipped (reason) | e.g., analyzed bundle size, reviewed Docker layer caching |

## Rules Applied
List of project rules referenced and verified during this analysis.
- `performance-optimization-principles.md`
- `resources-and-memory-management-principles.md`
- `concurrency-and-threading-principles.md`
- `database-design-principles.md`
- `data-serialization-and-interchange-principles.md`

---

## Implementation Results
<!-- Fill this section AFTER Phase 4 implementation is complete -->

### Before/After Benchmark Comparison

| Benchmark | Metric | Before | After | Δ | Δ% |
|---|---|---|---|---|---|
| {BenchmarkName} | ns/op | {N} | {N} | {N} | {N}% |
| {BenchmarkName} | B/op | {N} | {N} | {N} | {N}% |
| {BenchmarkName} | allocs/op | {N} | {N} | {N} | {N}% |

### Optimizations Applied
| Commit | ID | Title | Measured Improvement |
|---|---|---|---|
| {sha} | {ID} | {title} | {actual benchmark delta} |

### Optimizations Skipped
| ID | Title | Reason |
|---|---|---|
| {ID} | {title} | {reason — risk too high, impact below noise, requires refactor} |

### Failed Optimizations
Optimizations that were tried but did not improve performance. Documented to prevent future sessions from repeating.
| Attempt | Expected Gain | Actual Result | Why It Failed |
|---|---|---|---|
| {what was tried} | {expected} | {actual} | {explanation} |

### Surprising Findings
Unexpected profiler results that reveal codebase-specific performance characteristics.
- {finding and implications}

### Remaining Opportunities
Optimization opportunities deferred to future sessions.
- {opportunity and estimated impact}

## Verification Suite Results
- **Full Benchmark Suite:** PASS / FAIL (run with `-count=3` minimum)
- **Test Suite:** PASS / FAIL ({N} passed, {N} failed) — run with `-race` or equivalent
- **Quality Checks:** Lint: PASS/FAIL | Build: PASS/FAIL | Security: PASS/FAIL
```
