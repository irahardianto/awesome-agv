---
name: perf-optimize
description: >-
  Runs profile-driven performance optimization using multi-dimensional parallel analysis and sequential TDD fixes. User-invoked entry point via /perf-optimize; not for autonomous or subagent use.
disable-model-invocation: true
---

# Performance Optimization Skill

> **Entry-point guard:** This is a user-invoked command skill (`/perf-optimize`). If you are a spawned subagent, do NOT execute this skill — return to your assigned scope card.

**Trigger:** User provides profiling data, asks to optimize performance, or benchmarks show regression.

**Skill prerequisite:** Read `.agents/skills/perf-optimization/SKILL.md` before starting.

## Purpose
Profile-driven performance optimization using multi-dimensional parallel analysis. Dispatches subagents across orthogonal performance dimensions to analyze profiling data and scan code, then implements fixes sequentially with TDD and isolated benchmarks.

## When to Use
- User provides profiling data (pprof, flamegraph, py-spy, Chrome DevTools)
- User asks to optimize performance of a specific component
- A benchmark regression is detected
- After deploying a new feature that touches a hot path

## When NOT to Use
- General code quality review → `/audit`
- Security vulnerability scan → `/security-audit`
- Architectural restructuring → `/refactor`
- Fixing known bugs → `/bugfix`

## Prerequisite Skill
Load: `perf-optimization` skill (`.agents/skills/perf-optimization/SKILL.md`) — contains methodology, optimization pattern catalog, language modules, and orchestration references.

## Pre-Optimization Checklist
Before starting, you MUST:
1. **Load the skill** — read `.agents/skills/perf-optimization/SKILL.md`
2. **Load the language module** — read `.agents/skills/perf-optimization/languages/{language}.md`
3. **Identify optimization scope** — determine which component, module, or benchmark to optimize

---

## Phase 0: Reconnaissance

Before collecting profiles, understand the codebase structure and performance context.

### 0.1 — Stack & Architecture Detection
Scan for language/framework/infrastructure markers:
- **Languages:** `go.mod`, `package.json`, `Cargo.toml`, `pyproject.toml`, `pom.xml`, `*.csproj`, `Gemfile`, `composer.json`
- **Frameworks:** HTTP frameworks, ORMs, async runtimes, concurrency primitives
- **Build tooling:** Bundlers, Docker, CI/CD pipeline configuration

### 0.2 — Performance Inventory
Map performance-relevant components within the optimization scope:
- [ ] Hot-path entry points (API endpoints, request handlers, critical loops)
- [ ] Database access patterns (ORM, raw queries, connection pooling)
- [ ] External service integrations (HTTP clients, message queues, caches)
- [ ] Concurrency primitives (goroutines, threads, async/await, channels, locks)
- [ ] Serialization points (JSON, protobuf, XML parsing/generation)
- [ ] Build/bundle outputs (JS bundles, Docker images, compiled binaries)
- [ ] Existing benchmark suite (location, coverage, baseline numbers)

### 0.3 — Dimension Selection

Activate the applicable dimensions for the codebase under optimization. State your selection explicitly:

| Dim | Scope | Activate When |
|---|---|---|
| **A** | CPU & Computation | Always |
| **B** | Memory & Allocation | Always |
| **C** | I/O & Network | Project has database, HTTP clients, or file I/O |
| **D** | Concurrency & Parallelism | Project uses goroutines, threads, async/await, or locks |
| **E** | Serialization & Data Structures | Project serializes data or uses complex data structures in hot paths |
| **F** | Build, Bundle & Deployment | Project has frontend bundles, Docker images, or deployable artifacts |

State your selection:
> "Activating dimensions: A, B, C, D, E. Skipping F (no frontend bundles or Docker)."

---

## Phase 1: Profile

Collect profiling data using the language-appropriate tool. This step is performed by the coordinator.

**If the user provides a profile file or URL:**
- Use the language-appropriate extraction script (e.g., `scripts/go-pprof.sh cpu profile.prof`)

**If the user asks to profile from scratch:**
- Run the extraction script in `bench` mode to generate AND analyze profiles in one step:
```bash
bash .agents/skills/perf-optimization/scripts/go-pprof.sh bench ./path/to/package/... BenchmarkName
```

**Output:** Raw profiling data (CPU profile, heap profile, mutex/block profile, trace) + extracted summary.

**Establish baseline:** Record the benchmark baseline numbers (ns/op, B/op, allocs/op) that all subsequent measurements will compare against.

---

## Phase 2: Multi-Dimensional Analysis

Dispatch parallel subagents — one per activated dimension. Each analyzes the profiling data and scans the codebase within its dimension scope independently.

### Dispatch Protocol

Use `invoke_subagent` to spawn all activated dimension agents in a **single call**.

**Per-dimension fields:**
- **TypeName:** `self` (universal spawn mechanism — ensures subagents inherit full toolsets per `agent-protocols` §3)
- **Role:** `Performance Analyst — Dimension {KEY}` (e.g., `Performance Analyst — Dimension A`)
- **Workspace:** `inherit`
- **Prompt:** Build from the system prompt template in `perf-optimization` skill → `references/perf-dimensions.md`. Fill in: dimension name, scope card, reconnaissance context from Phase 0, and profiling data from Phase 1.

Each subagent receives in its prompt:
1. **Dimension scope card** — from `references/perf-dimensions.md`
2. **Reconnaissance context** — stack + performance inventory from Phase 0
3. **Profiling data** — summary or file path from Phase 1
4. **Language module** — path to the relevant `languages/{lang}.md`
5. **Output target** — `.agentwork/findings-perf-{dimension-key}.md`

When all subagents message `findings ready`, proceed to Phase 3.

---

## Phase 3: Synthesis & Prioritization

### 3.1 — Collect
Read all `.agentwork/findings-perf-*.md` files from Phase 2.

### 3.2 — Deduplicate
Consolidate findings reported by multiple dimensions (same root cause, same function). Note which dimensions flagged each.

### 3.3 — Severity Ranking
Classify all findings using the performance-specific 4-level taxonomy:
- **CRITICAL** — Algorithmic complexity causing non-linear degradation, memory leaks, unbounded resource consumption
- **HIGH** — Significant measurable waste in hot paths, missing caching, sequential I/O that could be concurrent
- **MEDIUM** — Moderate waste, suboptimal data structures, missing pre-allocation
- **LOW** — Minor micro-optimizations below noise floor

### 3.4 — Cross-Dimension Correlation
When findings from 2+ dimensions converge on the same function or module, **escalate severity by one level** (MEDIUM → HIGH, HIGH → CRITICAL):
- High allocations (B) + lock held across allocating path (D) → escalate both
- Sequential I/O (C) + redundant serialization per call (E) → escalate to HIGH
- O(n²) algorithm (A) + heap allocation per iteration (B) → escalate to CRITICAL
- Unoptimized bundle (F) + repeated serialization of static data (E) → escalate

### 3.5 — Prioritize by Impact/Risk

Create an implementation plan ranking fixes:

| Priority | Criteria |
|---|---|
| Do first | Low risk, high impact (caching, pre-allocation, fast-reject) |
| Do second | Medium risk, high impact (library swap, algorithm change) |
| Do last | High risk, high impact (major refactor, custom implementation) |
| Skip | Any risk, low impact (micro-optimization below noise floor) |

**Rule:** If a fix requires more than 1 day AND saves < 20% on the hot path, defer it.

### 3.6 — Write Analysis Report

1. Create `docs/audits/` if it doesn't exist
2. Read the report template from `perf-optimization` skill → `references/perf-report-template.md`
3. Fill all sections with Phase 2–3 findings (leave "Implementation Results" section empty for now)
4. Write to `docs/audits/perf-analysis-{component}-{YYYY-MM-DD}-{HHmm}.md`

**Present the implementation plan to the user for approval before proceeding to Phase 4.**

> **Zero-Findings Guard:** If the analysis produces fewer than 3 findings across all dimensions, you MUST complete the "Dimensions Covered" attestation section to prove comprehensive coverage was not skipped.

---

## Phase 4: Implement (one fix at a time)

> **Requires user approval** from Phase 3 before starting.

For each fix, in priority order:

1. **Write tests first** (TDD Red → Green)
2. **Implement the fix**
3. **Add `PERF:` comments** — annotate each optimization with an inline comment explaining the rationale (what the profiler showed and why the new approach is faster)
4. **Run all existing tests** (`go test -race ./...` or equivalent)
5. **Benchmark immediately** — compare ns/op, B/op, allocs/op against baseline
6. **Run quality checks** (formatter, linter, security scanner)
7. **Commit independently** with conventional format:

```
perf(scope): one-line description

What: <the optimization implemented>
Why: <what the profiler showed — the performance problem it solves>
Impact: <expected improvement, e.g., "Eliminates ~500 allocations per request">
Measurement: <how to verify, e.g., "Run BenchmarkX, compare allocs/op">
```

**Rule:** One fix per commit. Never batch optimizations.

**Size guidance:** Each fix should be focused and minimal. If a fix requires > ~100 lines or touches > 3 files, it's likely a refactor — use the `/refactor` skill instead.

---

## Phase 5: Final Verification

After all fixes are applied:
1. Run the full benchmark suite with `-count=3` minimum
2. Compare against the original baseline (before any fixes)
3. Run the complete test suite with `-race` or equivalent
4. Run all quality checks (formatter, linter, security scanner, build)

---

## Phase 6: Document & Ship

### 6.1 — Update the Analysis Report
Update the analysis document at `docs/audits/perf-analysis-{component}-{YYYY-MM-DD}-{HHmm}.md` with:
- **Before/after benchmark comparison table**
- **Optimizations applied** — commit SHA + measured improvement per fix
- **Optimizations skipped** — ID + reason
- **Failed optimizations** — For each optimization tried but didn't improve: (1) what was tried, (2) expected gain, (3) actual result, (4) why it didn't work. Prevents future sessions from repeating failed experiments.
- **Surprising findings** — Unexpected profiler results revealing codebase-specific characteristics
- **Remaining opportunities** — Deferred optimizations for future sessions
- **Verification suite results** — benchmark, tests, quality checks

### 6.2 — Ship
Present the final results to the user with:
- Cumulative benchmark improvement table
- List of commits
- Any follow-up items

---

## Feedback Loop

After analysis produces findings, choose the right workflow based on finding type:

| Finding Type | Example | Workflow |
|---|---|---|
| **CRITICAL perf issue** | O(n²) in hot path, memory leak | Implement in Phase 4 of this skill |
| **Requires architectural refactor** | Swap sync for async pipeline, restructure data flow | `/refactor` — separate session |
| **Security concern from optimization** | Wants to disable validation for speed | **REJECTED** — security is non-negotiable |
| **Code quality issue discovered** | Dead code, pattern inconsistency found during analysis | `/audit` or `/bugfix` — separate session |
| **Build/bundle optimization** | Code splitting, Docker layer caching | Implement in Phase 4 if < 100 lines, else `/workflow-solo` |

### Using Findings in Other Contexts
When starting a fix workflow in a new conversation, reference the persisted report:

> "Implement the remaining optimization opportunities in `docs/audits/perf-analysis-auth-2026-06-29-1430.md`"

The agent in the new context can read the file directly from the repo.

---

## Quick Reference

| Phase | Agent | Output | Gate |
|---|---|---|---|
| 0. Reconnaissance | Coordinator | Stack + inventory + dimension selection | Dimensions selected |
| 1. Profile | Coordinator | Raw profiling data + baseline benchmarks | Data collected |
| 2. Multi-Dim Analysis | Parallel subagents | `.agentwork/findings-perf-*.md` per dimension | All subagents report `findings ready` |
| 3. Synthesis | Coordinator | `docs/audits/perf-analysis-{component}-{date}.md` + implementation plan | User approved |
| 4. Implement | Coordinator | Tests + code + `PERF:` comments + benchmark per fix | Each fix passes tests + improves benchmark |
| 5. Verify | Coordinator | Full benchmark comparison + test suite | All checks pass |
| 6. Document & Ship | Coordinator | Updated report + conventional commits | User notified |

---

## Completion Criteria
- [ ] Pre-Optimization Checklist completed (skill loaded, language module loaded, scope set)
- [ ] Reconnaissance completed (stack detected, inventory mapped, dimensions selected)
- [ ] Profiling data collected and baseline established
- [ ] All activated dimensions analyzed by parallel subagents
- [ ] Findings synthesized, deduplicated, and severity-ranked
- [ ] Cross-dimension correlations identified and severity escalated
- [ ] Analysis report saved to `docs/audits/` with implementation plan
- [ ] User approved implementation plan
- [ ] Each fix implemented with TDD, benchmarked, and committed independently
- [ ] Final verification passed (benchmarks, tests, quality checks)
- [ ] Analysis report updated with implementation results
- [ ] `.agentwork/` directory cleaned up (`rm -rf .agentwork/`)
