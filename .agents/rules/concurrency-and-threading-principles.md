---
trigger: model_decision
description: When implementing concurrent, parallel, or multi-threaded code (async/await, threads, goroutines, actors)
---

## Concurrency and Threading Principles

**1. Avoid Race Conditions**

**What is a race condition:**

- Multiple threads access shared data concurrently  
- At least one thread writes/modifies the data  
- No synchronization mechanism in place  
- Result depends on unpredictable thread execution timing

**Prevention strategies:**

- Synchronization: Locks, mutexes, semaphores  
- Immutability: Immutable data is thread-safe by default  
- Message passing: Send data between threads instead of sharing  
- Thread-local storage: Each thread has its own copy

**Detection:**

- Go: Run with `-race` flag (race detector)  
- Rust: Miri tool for undefined behavior detection  
- C/C++: ThreadSanitizer (TSan)  
- Java: JCStress, FindBugs

**2. Prevent Deadlocks**

**What is a deadlock:**

- Two or more threads waiting for each other indefinitely  
- Example: Thread A holds Lock 1, waits for Lock 2; Thread B holds Lock 2, waits for Lock 1

**Four conditions (ALL must be true for deadlock):**

1. Mutual exclusion: Resources held exclusively (locks)  
2. Hold and wait: Holding one resource while waiting for another  
3. No preemption: Can't force unlock  
4. Circular wait: A waits for B, B waits for A

**Prevention (break any one condition):**

- Lock ordering: Always acquire locks in same order  
- Timeout: Use try_lock with timeout, back off and retry  
- Avoid nested locks: Don't hold multiple locks simultaneously  
- Use lock-free data structures when possible

**3. Prefer Immutability**

- Immutable data = thread-safe by default (no synchronization needed)  
- Share immutable data freely between threads  
- Use immutable data structures where possible (Rust default, functional languages)  
- If data must change, use message passing instead of shared mutable state

**4. Message Passing Over Shared Memory**

- "Don't communicate by sharing memory; share memory by communicating" (Go proverb)  
- Send data through channels/queues instead of accessing shared memory  
- Reduces need for locks and synchronization  
- Easier to reason about and test

**5. Graceful Degradation**

- Handle concurrency errors gracefully (timeouts, retries, circuit breakers)  
- Don't crash entire application on one thread failure  
- Use supervisors/monitors for fault tolerance (Erlang/Elixir actor model)  
- Implement backpressure for producer-consumer scenarios

### Concurrency Models by Use Case

- **I/O-bound:** async/await, event loops, coroutines, green threads  
- **CPU-bound:** OS threads, thread pools, parallel processing  
- **Actor model:** Erlang/Elixir actors, Akka (message passing, isolated state)  
- **CSP (Communicating Sequential Processes):** Go channels, Rust channels

### Testing Concurrent Code

- Write unit tests with controlled concurrency (deterministic execution)  
- Test timeout scenarios and resource exhaustion  
- Test thread pool full, queue full scenarios

### Related Principles
- Resource and Memory Management Principles @resources-and-memory-management-principles.md
- Error Handling Principles @error-handling-principles.md
- Testing Strategy @testing-strategy.md