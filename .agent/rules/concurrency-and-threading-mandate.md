---
trigger: always_on
---

## Concurrency and Threading Mandate

### When to Use Concurrency

**I/O-Bound Operations:** Use asynchronous I/O, event-driven concurrency, or coroutines when waiting on network requests, file I/O, or database queries.

**CPU-Bound Operations:** Use OS threads or thread pools for heavy computation, data processing, or encoding work where CPU cycles dominate.

**Don't Over-Use Concurrency:** Concurrency adds significant complexity (race conditions, deadlocks, debugging difficulty). Profile first — only add concurrency when there is a measurable performance benefit.

For implementation details (race condition prevention, deadlock avoidance, message passing patterns), see Concurrency and Threading Principles @concurrency-and-threading-principles.md.

### When NOT to Use Concurrency
- Simple synchronous operations
- No measurable performance benefit
- Avoid premature optimization

### Related Principles
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Performance Optimization Principles @performance-optimization-principles.md
