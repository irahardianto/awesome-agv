---
trigger: model_decision
description: When working on performance optimization, profiling, benchmarking, or performance-critical code paths
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

### Choose Appropriate Data Structures

**Selection matters:**

- Hash map: O(1) lookup, unordered  
- Array/list: O(1) index access, O(n) search, ordered  
- Binary tree: O(log n) operations, sorted order  
- Set: O(1) membership testing, unique elements

**Wrong choice causes performance degradation:**

- Using array for lookups: O(n) when O(1) possible with hash map  
- Using list for sorted data: O(n log n) sort vs O(log n) tree operations

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

### Performance Optimization Checklist

- [ ] Is there a measured performance problem (not a guess)?
- [ ] Have you profiled to find the actual bottleneck?
- [ ] Are appropriate data structures chosen for the access pattern?
- [ ] Are expensive operations cached with proper invalidation?
- [ ] Are batch operations used instead of N+1 queries?
- [ ] Are I/O operations non-blocking where appropriate?
- [ ] Have you measured improvement after optimization?

### Related Principles
- Resource and Memory Management Principles @resources-and-memory-management-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
