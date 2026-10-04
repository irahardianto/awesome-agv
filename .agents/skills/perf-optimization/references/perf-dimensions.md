# Performance Optimization Dimensions

This file defines the 6 MECE performance dimensions and the subagent system prompt template used by the `/perf-optimize` skill.

## Subagent System Prompt Template

Use this template when dispatching each dimension subagent via `invoke_subagent`:

```
Your workspace is: {workspace}

PERFORMANCE ANALYSIS CONTEXT: You are operating as one of N parallel
performance analysts, each covering a MECE dimension of performance
optimization. Your dimension is scoped below. Stay strictly within your
dimension — other agents cover the remaining dimensions.

Your dimension: {DIMENSION NAME}
Your scope: {paste the scope card for this dimension from below}

Stack context:
{paste reconnaissance findings from Phase 0}

Profiling data:
{paste profiling data summary or file path from Phase 1}

Language module:
{paste language module path, e.g., .agents/skills/perf-optimization/languages/go.md}

Analyze the profiling data AND scan the codebase within your dimension's
scope. For each finding, classify severity using the Severity Taxonomy below.
Every finding MUST reference profiler evidence (function name, cum%,
flat%, allocs) or measurable code-level indicators.

Severity Taxonomy:
- CRITICAL: Algorithmic complexity causing non-linear degradation under load,
  memory leaks, unbounded resource consumption, or blocking operations on async
  runtimes. Must be fixed immediately.
- HIGH: Significant measurable waste in hot paths — unnecessary allocations,
  missing caching, sequential I/O that could be concurrent, lock contention.
  Fix before release.
- MEDIUM: Moderate waste — suboptimal data structures, missing pre-allocation,
  unnecessary copies, inefficient serialization. Fix near term.
- LOW: Minor optimization opportunities — micro-optimizations, style-level
  performance preferences. Backlog.

When complete:
1. Write findings to .agentwork/findings-perf-{dimension-key}.md
2. Message @coordinator (the main agent running this /perf-optimize skill): 'findings ready'

Do NOT implement fixes. Do NOT modify production or test code.
Produce findings with profiler evidence, estimated impact, and
optimization guidance only.
```

## Severity Taxonomy

Classify every finding using this performance-specific 4-level taxonomy:

- **CRITICAL**: Algorithmic complexity causing non-linear degradation under load (O(n²)+ in hot paths), memory leaks, unbounded resource consumption, or blocking operations on async runtimes. Must be fixed immediately — these cause production incidents at scale.
- **HIGH**: Significant measurable waste in hot paths — unnecessary allocations, missing caching for repeated expensive computations, sequential I/O that could be concurrent, lock contention under load. Fix before release — these cause noticeable latency or resource waste.
- **MEDIUM**: Moderate waste detectable in profiles — suboptimal data structures, missing pre-allocation, unnecessary copies, inefficient serialization. Fix near term — these compound into measurable overhead.
- **LOW**: Minor optimization opportunities — micro-optimizations, style-level performance preferences, defense-in-depth pre-allocation. Backlog — improvement is below noise floor or risk outweighs gain.

## Findings Output Format

Each subagent writes findings using this format:

```markdown
# Performance Findings: Dimension {KEY} — {Dimension Name}
Date: {date}
Scope: {one-line scope description}
Language: {detected language/runtime}

## Findings

### [{SEVERITY}-{NNN}] {Title}
- **File:** [{file}:{line}](file:///path)
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW
- **Profiler Evidence:** {function name, cum%, flat%, allocs/op, B/op — or code-level indicator}
- **Description:** {what the performance issue is}
- **Estimated Impact:** {expected improvement if fixed, e.g., "~40% reduction in allocs/op"}
- **Pattern:** {matching pattern from SKILL.md catalog, e.g., "Result Caching", "Pre-allocation"}
- **Optimization Guidance:** {specific fix approach with code sketch if applicable}
- **Benchmark Target:** {which benchmark to run to verify the fix}
- **Risk:** {LOW / MEDIUM / HIGH — risk of regression or behavioral change}

(Repeat for each finding)

## Summary
- Total findings: {N}
- CRITICAL: {N}, HIGH: {N}, MEDIUM: {N}, LOW: {N}
- Estimated cumulative impact: {e.g., "~60% reduction in hot-path allocations"}
- Files examined: {N}
- Key hot paths analyzed: {list}
```

---

## Dimension Scope Cards

Each subagent receives exactly one scope card.

### Dimension A: CPU & Computation

```
Scope: CPU-bound performance — algorithmic complexity, hot loops, and unnecessary computation.
Analyze profiling data and scan code for:
- Algorithmic complexity violations — O(n²)+ in hot paths replaceable with O(n) or O(n log n)
- Nested iterations creating quadratic behavior replaceable with single-pass or hash-based approaches
- Redundant computation — repeated expensive calculations with identical inputs (regex compilation, template parsing, config loading)
- Missing early returns or short-circuit evaluation skipping unnecessary work
- CPU-bound work running on async/event-loop runtimes instead of worker pools/threads
- Expensive validation paths running even for clearly invalid inputs (missing fast-reject)
- Redundant sorting of already-sorted data or where ordering is not required
- Hot functions with high flat% that can be simplified or inlined
Reference: perf-optimization SKILL.md § Opportunity Scan → "Data Structures & Algorithms" and "Caching & Lazy Initialization"
Reference: perf-optimization SKILL.md § Pattern Catalog → "Fast-Reject / Short-Circuit", "Result Caching"
Load: performance-optimization-principles.md
Output: .agentwork/findings-perf-cpu.md
```

### Dimension B: Memory & Allocation

```
Scope: Heap allocation pressure, GC impact, and memory efficiency.
Analyze profiling data (heap profile, allocs/op) and scan code for:
- Heap allocations inside hot loops — new objects created per iteration
- Missing pre-sized collections — slices, maps, arrays growing from zero capacity
- Unnecessary copies where borrowing, referencing, or copy-on-write suffices
- Large structures passed by value instead of by pointer/reference
- Short-lived temporary objects that could be reused via object pools (sync.Pool, arena)
- GC pressure indicators — high GC% in CPU profile, frequent GC pauses
- Memory leaks — unbounded caches, unclosed resources, growing maps without eviction
- Benchmark artifact allocations inflating profiles (test harness objects not in production)
Reference: perf-optimization SKILL.md § Opportunity Scan → "Memory & Allocation"
Reference: perf-optimization SKILL.md § Pattern Catalog → "Pre-allocation", "Pooling"
Load: resources-and-memory-management-principles.md, performance-optimization-principles.md
Output: .agentwork/findings-perf-memory.md
```

### Dimension C: I/O & Network

```
Scope: I/O-bound operations — database, network, file system, and external service interactions.
Analyze profiling data (trace, wall-clock) and scan code for:
- Sequential I/O calls that could run concurrently (parallel fetch, gather, join)
- N+1 query patterns — repeated database queries in loops instead of batch/join
- Missing buffered I/O on file or network streams
- Synchronous/blocking I/O on async runtimes
- Missing connection pooling or pool exhaustion under load
- Unbounded request concurrency to external services (missing semaphores/rate limiters)
- Missing timeouts on outbound HTTP/RPC/database calls
- Redundant network round-trips fetchable in a single batch call
- Database queries missing appropriate indexes (sequential scans in hot paths)
Reference: perf-optimization SKILL.md § Opportunity Scan → "Serialization & I/O"
Reference: perf-optimization SKILL.md § Pattern Catalog → "Batching"
Load: database-design-principles.md, performance-optimization-principles.md
Output: .agentwork/findings-perf-io.md
```

### Dimension D: Concurrency & Parallelism

```
Scope: Concurrent execution efficiency — lock contention, goroutine/thread overhead, and parallelization opportunities.
Analyze profiling data (mutex/block profiles, trace) and scan code for:
- Lock contention — mutexes held across I/O boundaries (database calls, network, file system)
- Hot locks — high contention on a single mutex serializing concurrent requests
- Task/goroutine/thread spawn overhead exceeding the work itself (micro-task anti-pattern)
- Unbounded goroutine/thread creation without backpressure (fan-out without limits)
- Channel/queue sizing issues — unbounded queues causing memory pressure, undersized channels blocking producers
- False sharing in concurrent data structures (cache-line contention)
- Missed parallelization opportunities — independent operations executed sequentially
- Context cancellation leaks — goroutines/tasks not respecting cancellation signals
- Lock granularity — coarse-grained locks that could be fine-grained or lock-free
Reference: perf-optimization SKILL.md § Opportunity Scan → "Concurrency & Parallelism"
Load: concurrency-and-threading-principles.md, performance-optimization-principles.md
Output: .agentwork/findings-perf-concurrency.md
```

### Dimension E: Serialization & Data Structures

```
Scope: Data format overhead, serialization efficiency, and data structure selection.
Analyze profiling data and scan code for:
- Full deserialization when only a subset of fields is needed
- Repeated serialization of the same unchanged data (missing serialized-bytes cache)
- Inefficient string building — concatenation in loops instead of buffered writes (strings.Builder, StringBuilder)
- Excessive debug/trace logging in hot paths without level gating
- Suboptimal data structure selection — linear scans where hash-based lookups would work
- Missing lazy initialization for rarely-used but expensive-to-construct resources
- Redundant data transformations — multiple passes over the same data where one pass suffices
- JSON/XML parsing overhead replaceable with more efficient formats (protobuf, msgpack) in internal APIs
- Repeated regex compilation or template parsing instead of compile-once patterns
Reference: perf-optimization SKILL.md § Opportunity Scan → "Serialization & I/O", "Data Structures & Algorithms", "Caching & Lazy Initialization"
Reference: perf-optimization SKILL.md § Pattern Catalog → "Result Caching", "Library Swap"
Load: data-serialization-and-interchange-principles.md, performance-optimization-principles.md
Output: .agentwork/findings-perf-serialization.md
```

### Dimension F: Build, Bundle & Deployment Artifacts

```
Scope: Build output size, bundling efficiency, and deployment artifact optimization.
Analyze bundle/build output and scan configuration for:
- Unpartitioned build artifacts — deploying a small change invalidates large cached artifacts
- Missing code splitting — monolithic JS/CSS bundles instead of route-based chunks
- Vendor library bundled with application code (unstable + stable layers mixed)
- Tree-shaking failures — unused exports increasing bundle size
- Missing asset optimization — uncompressed images, unminified CSS/JS in production
- Docker layer inefficiency — dependency install after code copy (cache invalidation on every build)
- Duplicate dependencies — same library bundled at multiple versions
- Missing lazy loading for below-the-fold or rarely-used code paths
- Sequential resource discovery creating waterfalls (download → parse → discover → download)
- Missing preconnect/prefetch hints for known external resources
Reference: perf-optimization SKILL.md § Pattern Catalog → "Artifact Partitioning by Change Frequency", "Dependency Discovery Parallelization"
Reference: perf-optimization languages/frontend.md (if applicable)
Load: performance-optimization-principles.md
Output: .agentwork/findings-perf-build.md
```
