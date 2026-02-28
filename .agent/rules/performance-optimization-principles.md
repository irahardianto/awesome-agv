---
trigger: model_decision
description: When working on performance optimization, profiling, benchmarking, or performance-critical code paths
version: 1.1.0
---

## Performance Optimization Principles

### Measure Before Optimizing

**"Premature optimization is the root of all evil" - Donald Knuth**

**Process:**

1. **Measure:** Profile to find actual bottlenecks (don't guess)
2. **Identify:** Find the 20% of code consuming 80% of resources
3. **Optimize:** Improve that specific bottleneck
4. **Measure again:** Verify improvement with benchmarks
5. **Repeat:** Only if still not meeting performance goals

**Don't optimize:**

- Code that's "fast enough" for requirements
- Code that's rarely executed
- Without measurable performance problem

---

### Choose Appropriate Data Structures

**Selection matters:**

- Hash map: O(1) lookup, unordered
- Array/list: O(1) index access, O(n) search, ordered
- Binary tree: O(log n) operations, sorted order
- Set: O(1) membership testing, unique elements

**Wrong choice causes performance degradation:**

- Using array for lookups: O(n) when O(1) possible with hash map
- Using list for sorted data: O(n log n) sort vs O(log n) tree operations

---

### Avoid Premature Abstraction

**Abstraction has costs:**

- Runtime overhead (indirection, virtual dispatch, dynamic resolution)
- Cognitive overhead (understanding layers of abstraction)
- Maintenance overhead (changes ripple through abstractions)

**Start concrete, abstract when pattern emerges:**

- Write straightforward code first
- Identify duplication and common patterns
- Abstract only when there's clear benefit
- Don't add "for future flexibility" without evidence

---

### Optimization Techniques

**Caching:**

- Store expensive computation results
- Cache database queries, API responses, rendered templates
- Use appropriate cache invalidation strategy
- Set TTL (time-to-live) for cache entries

**Lazy Loading:**

- Compute only when needed
- Load data on-demand, not upfront
- Defer expensive operations until required

**Batching:**

- Process multiple items together
- Batch database queries (N queries → 1 query)
- Batch API requests where possible

**Async I/O:**

- Don't block on I/O operations
- Use async/await for concurrent I/O
- Process multiple I/O operations in parallel

**Connection Pooling:**

- Reuse expensive resources (database connections, HTTP connections)
- See "Resource and Memory Management Principles"

---

### Performance Baselines & Targets

**Before optimizing, establish a baseline and define a target.** A benchmark with no target is useless.

**API Latency Targets (adjust to SLO, these are common defaults):**

| Tier                      | P50   | P95    | P99    |
| ------------------------- | ----- | ------ | ------ |
| Interactive (user-facing) | <50ms | <200ms | <500ms |
| Batch/background          | <1s   | <5s    | <10s   |
| Reporting/analytics       | <5s   | <30s   | <60s   |

**Throughput targets:** Set as part of load testing (requests per second at defined latency thresholds).
**Never set latency targets without load targets** — a system is fast with 1 user; targets are for realistic concurrency.

**Web / Frontend Performance (Core Web Vitals):**

| Metric                              | Good   | Needs Work | Poor   |
| ----------------------------------- | ------ | ---------- | ------ |
| **LCP** (Largest Contentful Paint)  | ≤2.5s  | 2.5–4s     | >4s    |
| **INP** (Interaction to Next Paint) | ≤200ms | 200–500ms  | >500ms |
| **CLS** (Cumulative Layout Shift)   | ≤0.1   | 0.1–0.25   | >0.25  |
| **TTFB** (Time to First Byte)       | ≤800ms | 800ms–1.8s | >1.8s  |

**Rule:** Core Web Vitals are measured in the field (real users), not just lab. Use RUM (Real User Monitoring) alongside Lighthouse.

---

### Profiling Toolchain

**Pick the right profiler for the problem:**

| Problem          | Tool                                         | Language          |
| ---------------- | -------------------------------------------- | ----------------- |
| CPU-bound code   | `pprof`                                      | Go                |
| CPU-bound code   | `py-spy`, `cProfile`                         | Python            |
| CPU-bound code   | `async-profiler`, `JFR`                      | Java/JVM          |
| CPU-bound code   | `clinic.js`, `0x`                            | Node.js           |
| Memory leak      | `pprof` heap profile                         | Go                |
| Memory leak      | `tracemalloc`, `memory_profiler`             | Python            |
| Memory leak      | `VisualVM`, `Eclipse MAT`                    | Java/JVM          |
| Memory leak      | `Chrome DevTools` heap snapshot              | Node.js / Browser |
| Database queries | `EXPLAIN ANALYZE`                            | PostgreSQL/MySQL  |
| Network I/O      | Distributed tracing (Jaeger, Tempo)          | All               |
| Frontend perf    | `Lighthouse`, `WebPageTest`, Chrome DevTools | Browser           |

**Profiling workflow:**

1. Reproduce the performance problem under realistic load (use production traffic patterns)
2. Capture a profile (CPU, memory, or trace depending on symptom)
3. Identify the hot path (the 5–10% of code consuming 80% of cycles)
4. Optimize specifically that path
5. Re-profile to verify improvement; confirm no regression elsewhere

**Rule:** Never optimize from code review alone. Profiler data first.

---

### Caching Strategy

**Cache tiers and when to use each:**

| Tier                          | Latency  | Use Case                                                      |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| **In-process / in-memory**    | <1ms     | Hot lookup tables, computed metadata, config                  |
| **Distributed cache (Redis)** | 1–5ms    | Session data, rate limit counters, inter-service shared state |
| **CDN**                       | 10–100ms | Static assets, public API responses, rendered pages           |
| **Database result cache**     | varies   | Cost of DB query > cache overhead                             |

**Cache invalidation patterns:**

| Pattern                       | Consistency | Write Performance      | Best For                                  |
| ----------------------------- | ----------- | ---------------------- | ----------------------------------------- |
| **Cache-aside (lazy)**        | Eventual    | Fast (cache bypassed)  | Read-heavy, infrequent updates            |
| **Write-through**             | Strong      | Slower (write to both) | Read/write balanced, consistency critical |
| **Write-behind (write-back)** | Eventually  | Fast                   | Write-heavy, tolerate brief inconsistency |
| **Read-through**              | Eventual    | —                      | Application only talks to cache           |

**Cache-aside implementation (most common):**

```
# Read:
value = cache.get(key)
if value is None:
    value = db.query(...)
    cache.set(key, value, ttl=300)
return value

# Write:
db.update(...)
cache.delete(key)          # Invalidate, don't update (avoids race conditions)
```

**Rules:**

- Always set a TTL — unbounded cache growth causes OOM
- Prefer `cache.delete()` over `cache.set()` on writes (invalidation > update)
- Use cache **stampede protection** (single-flight / mutex) for expensive cache misses at high concurrency
- Monitor: `hit_ratio` (target >90% for hot data), `eviction_rate`, `memory_usage`
- Design for **cache-miss graceful degradation** — system must work (slowly) with an empty cache

**What not to cache:**

- Unbounded datasets (no TTL + large values = memory exhaustion)
- Highly dynamic data (cache becomes stale before TTL expires)
- Security-sensitive data (auth tokens, PII) without careful controls

---

### N+1 Query Detection and Resolution

**Symptom:** 1 query to fetch a list + N queries to fetch related data for each item.

**Detection:**

- Query logging: look for identical query patterns repeated N times in a request
- `EXPLAIN ANALYZE` total count vs expected count
- APM tools (Datadog, New Relic): "Top Slow Queries" with high avg call count per request
- Django debug toolbar, Hibernate N+1 detector, `sqlalchemy.echo=True`

**Resolution patterns:**

```sql
-- ❌ N+1: 1 query for orders + 1 query per order for customer
SELECT * FROM orders;
-- for each order: SELECT * FROM customers WHERE id = ?

-- ✅ JOIN: everything in 1 query
SELECT o.*, c.name, c.email
FROM orders o
JOIN customers c ON c.id = o.customer_id;

-- ✅ Batch load: separate queries but batched
SELECT * FROM orders WHERE id IN (1, 2, 3, ... N);
SELECT * FROM customers WHERE id IN (cust_ids_from_orders);
-- then join in application memory
```

---

### Performance Optimization Checklist

- [ ] Is there a measured performance problem (not a guess)?
- [ ] Have you profiled to find the actual bottleneck?
- [ ] Are latency targets defined (P95, P99) before optimization?
- [ ] Are appropriate data structures chosen for the access pattern?
- [ ] Are expensive operations cached with proper TTL and invalidation?
- [ ] Is cache hit ratio monitored (target >90%)?
- [ ] Are batch operations used instead of N+1 queries?
- [ ] Are I/O operations non-blocking where appropriate?
- [ ] Have you measured improvement after optimization?
- [ ] For frontend: are Core Web Vitals (LCP, INP, CLS) within "Good" thresholds?

---

### Related Principles

- Resource and Memory Management Principles @resources-and-memory-management-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Monitoring and Alerting Principles @monitoring-and-alerting-principles.md
