# Java Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Java/JVM-specific symptoms, diagnostic tooling, and common framework errors.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `NullPointerException` | Read stack trace → find the null dereference → add `Optional` or null guard |
| `OutOfMemoryError: Java heap space` | Heap dump (`jmap`) → analyze with Eclipse MAT → find growing collection/cache |
| `OutOfMemoryError: Metaspace` | Class loader leak — check for repeated `new ClassLoader()` or hot-deploy issues |
| `StackOverflowError` | Infinite recursion → read stack trace for repeating frames |
| Thread deadlock / app hangs | Thread dump (`jstack`) → look for `BLOCKED` threads waiting on same locks |
| `ClassNotFoundException` / `NoClassDefFoundError` | Check classpath, dependency versions, shade/relocation conflicts |
| `ConcurrentModificationException` | Iterating + modifying same collection → use `ConcurrentHashMap` or copy-on-write |
| Spring `NoSuchBeanDefinitionException` | Missing `@Component`/`@Service` annotation or missing component scan path |
| Slow startup | `-Dspring.main.lazy-initialization=true` + `spring-boot-startup` actuator |
| Connection pool exhaustion | Check `HikariCP` metrics → find leaked connections (missing `try-with-resources`) |
| Test flakiness | Shared mutable static state between tests → isolate with `@DirtiesContext` or fresh context |

---

## Diagnostic Tools

### JVM Built-in Tools

```bash
# Thread dump — diagnose deadlocks and thread starvation
jstack <pid> > thread-dump.txt

# Heap dump — diagnose memory leaks
jmap -dump:format=b,file=heap.hprof <pid>

# GC logging (JDK 9+)
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar

# Flight Recorder — low-overhead production profiling
java -XX:StartFlightRecording=duration=60s,filename=recording.jfr -jar app.jar

# jcmd — multi-purpose diagnostic tool
jcmd <pid> Thread.print          # Thread dump
jcmd <pid> GC.heap_info          # Heap summary
jcmd <pid> VM.flags              # Active JVM flags
jcmd <pid> JFR.start duration=30s filename=rec.jfr  # Start recording
```

### Application-Level Diagnostics

```bash
# Spring Boot Actuator endpoints
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/metrics/jvm.memory.used
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
curl http://localhost:8080/actuator/threaddump

# Async Profiler (Linux/macOS) — flamegraphs
./profiler.sh -d 30 -f flamegraph.html <pid>

# VisualVM — GUI profiler (connect to remote JVM via JMX)
jvisualvm
```

---

## Common Java Bugs and Fixes

### Memory Leak (Growing Heap)

**Symptom:** `OutOfMemoryError: Java heap space` or steadily growing heap in metrics.

**Diagnosis:**
```bash
# Capture heap dump
jmap -dump:live,format=b,file=heap.hprof $(pgrep -f "java.*myapp")

# Analyze with Eclipse MAT (Memory Analyzer Tool)
# → Leak Suspects report → find dominator tree → trace retained objects
```

**Common causes:**
1. **Unbounded cache** — `HashMap` growing forever without eviction.
2. **Event listeners not removed** — observer pattern without cleanup.
3. **Static collections** — `static List<T>` that accumulates objects.
4. **ThreadLocal not cleaned** — threads from pool reuse stale values.

**Fix (ThreadLocal):**
```java
// ❌ ThreadLocal never cleaned — leaks with thread pools
private static final ThreadLocal<UserContext> context = new ThreadLocal<>();

// ✅ Clean up after use
try {
    context.set(userContext);
    processRequest();
} finally {
    context.remove();  // Always clean up
}
```

### Thread Deadlock

**Symptom:** Application hangs, requests timeout, but CPU is idle.

**Diagnosis:**
```bash
# Thread dump — look for BLOCKED threads
jstack <pid> | grep -A 20 "BLOCKED"

# JVM detects some deadlocks automatically:
# "Found one Java-level deadlock"
jstack <pid> | grep -i "deadlock"
```

**Common causes:**
1. **Lock ordering inconsistency** — Thread A locks X then Y, Thread B locks Y then X.
2. **Synchronized on public object** — external code takes the same lock.
3. **Database deadlock** — two transactions waiting for each other's row locks.

**Fix:**
```java
// ❌ Inconsistent lock ordering — deadlock risk
synchronized(lockA) {
    synchronized(lockB) { ... }
}
// Another thread does:
synchronized(lockB) {
    synchronized(lockA) { ... }  // DEADLOCK
}

// ✅ Consistent lock ordering
private static final Object LOCK_A = new Object();
private static final Object LOCK_B = new Object();
// Always acquire A before B
synchronized(LOCK_A) {
    synchronized(LOCK_B) { ... }
}
```

### Connection Pool Exhaustion

**Symptom:** `SQLTransientConnectionException: Connection is not available, request timed out after 30000ms`.

**Diagnosis:**
```bash
# Check HikariCP metrics via actuator
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
curl http://localhost:8080/actuator/metrics/hikaricp.connections.pending
```

**Common causes:**
1. **Missing `try-with-resources`** — connection not returned to pool.
2. **Long-running transaction** holding connection.
3. **Pool size too small** for concurrency level.

**Fix:**
```java
// ❌ Connection leak — not closed on exception
Connection conn = dataSource.getConnection();
PreparedStatement stmt = conn.prepareStatement(sql);
ResultSet rs = stmt.executeQuery();
// If exception occurs here, connection is never returned!

// ✅ Try-with-resources — always returned
try (var conn = dataSource.getConnection();
     var stmt = conn.prepareStatement(sql);
     var rs = stmt.executeQuery()) {
    // Process results
}
```

### Spring Dependency Injection Failures

**Symptom:** `NoSuchBeanDefinitionException`, `UnsatisfiedDependencyException` at startup.

**Diagnosis checklist:**
1. Is the class annotated with `@Component`, `@Service`, `@Repository`, or `@Controller`?
2. Is it in a package that's component-scanned? (Check `@SpringBootApplication` base package.)
3. Is the interface registered in a `@Configuration` class?
4. Is there a circular dependency? (Spring 6+ doesn't allow by default.)

### Test Flakiness

**Common causes:**
1. **Shared Spring context** — `@DirtiesContext` after modifying context.
2. **Static mutable state** — reset in `@BeforeEach`.
3. **Time-dependent logic** — mock `Clock` instead of `Instant.now()`.
4. **Database state** — use `@Transactional` for automatic rollback.
5. **Testcontainers not ready** — use proper wait strategies.

```bash
# Reproduce intermittent failures
mvn test -pl module-name -Dsurefire.rerunFailingTestsCount=3
# or
gradle test --tests "com.example.TaskServiceTest" --rerun-tasks
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Thread dump shows `BLOCKED` on same lock | +60% confidence in deadlock |
| Heap dump shows one type dominating retained | +50% confidence in memory leak source |
| `hikaricp.connections.pending > 0` | +60% confidence in connection pool exhaustion |
| Error only after deploy, not locally | Suspect config, env variables, or dependency version |
| GC log shows frequent Full GC | +40% confidence in heap pressure / leak |

---

## Related
- Java Idioms @.agents/skills/java-idioms/SKILL.md
- Spring Boot Idioms @.agents/skills/spring-boot-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
