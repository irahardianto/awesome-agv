---
trigger: model_decision
description: When working with resources requiring cleanup (files, database connections, network sockets, locks) or implementing resource pools
---

## Resource and Memory Management Principles

### Universal Resource Management Rules

**1. Always Clean Up Resources**

**Resources requiring cleanup:**

- Files, network connections, database connections  
- Locks, semaphores, mutexes  
- Memory allocations (in manual-memory languages)  
- OS handles, GPU resources

**Clean up in ALL paths:**

- Success path: Normal completion  
- Error path: Exception thrown, error returned  
- Early return path: Guard clauses, validation failures

**Use language-appropriate patterns:**

- Go: defer statements  
- Rust: Drop trait (RAII)  
- Python: context managers (with statement)  
- TypeScript: try/finally  
- Java: try-with-resources

**2. Timeout All I/O Operations**

**Why timeout:**

- Network requests can hang indefinitely  
- Prevents resource exhaustion (connections, threads)  
- Provides predictable failure behavior

**Timeout recommendations:**

- Network requests: 30s default, shorter (5-10s) for interactive  
- Database queries: 10s default, configure per query complexity  
- File operations: Usually fast, but timeout on network filesystems  
- Message queue operations: Configurable, avoid indefinite blocking

**3. Pool Expensive Resources**

**Resources to pool:**

- Database connections: Pool size 5-20 per app instance  
- HTTP connections: Reuse with keep-alive  
- Thread pools: Size based on CPU count (CPU-bound) or I/O wait (I/O-bound)

**Benefits:**

- Reduces latency (no connection setup overhead)  
- Limits resource consumption (cap on max connections)  
- Improves throughput (reuse vs create new)

**Connection Pool Best Practices:**

- Minimum connections: 5 (ensures pool is warm)  
- Maximum connections: 20-50 (prevents overwhelming database)  
- Idle timeout: Close connections idle >5-10 minutes  
- Validation: Test connections before use (avoid broken connections)  
- Monitoring: Track utilization, wait times, timeout rates

**4. Avoid Resource Leaks**

**What is a leak:**

- Acquire resource (open file, allocate memory, get connection)  
- Never release it (forget to close, exception prevents cleanup)  
- Eventually exhaust system resources (OOM, max connections, file descriptors)

**Detection:**

- Monitor open file descriptors, connection counts, memory usage over time  
- Run long-duration tests, verify resource counts stay stable  
- Use leak detection tools (valgrind, ASan, heap profilers)

**Prevention:**

- Use language patterns that guarantee cleanup (RAII, defer, context managers)  
- Never rely on manual cleanup alone (use language features)

**5. Handle Backpressure**

**Problem:** Producer faster than consumer

- Queue grows unbounded → memory exhaustion  
- System becomes unresponsive under load

**Solutions:**

- Bounded queues: Fixed size, block or reject when full  
- Rate limiting: Limit incoming request rate  
- Flow control: Consumer signals producer to slow down  
- Circuit breakers: Stop accepting requests when overwhelmed  
- Drop/reject: Fail fast when overloaded (better than crashing)

