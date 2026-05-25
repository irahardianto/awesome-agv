# Java / JVM Performance Profiling

> **Applicability:** Java services, Spring Boot applications, and any JVM-based runtime. Covers JIT, GC tuning, and JVM-specific profiling tools.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| JDK Flight Recorder (JFR) | Low-overhead production profiling | `java -XX:StartFlightRecording=duration=60s,filename=rec.jfr -jar app.jar` |
| `jcmd` | JVM diagnostic commands | `jcmd <pid> JFR.start duration=30s filename=rec.jfr` |
| Async Profiler | CPU/allocation flamegraphs (Linux/macOS) | `./profiler.sh -d 30 -f flamegraph.html <pid>` |
| `jstat` | GC statistics | `jstat -gcutil <pid> 1000 60` |
| `jmap` | Heap dump | `jmap -dump:live,format=b,file=heap.hprof <pid>` |
| Eclipse MAT | Heap dump analysis | GUI — `File → Open Heap Dump → Leak Suspects` |
| VisualVM | Real-time monitoring | `jvisualvm` |
| JMH | Microbenchmarking | `@Benchmark` annotation |
| Spring Boot Actuator | Runtime metrics | `curl /actuator/metrics/jvm.memory.used` |

---

## Optimization Patterns

### Pattern: JVM Warm-up / JIT Compilation

**Symptom:** First N requests are 5-10x slower than steady state. Latency improves after ~10,000 invocations.

**Root cause:** JIT compiler hasn't optimized hot paths yet.

```bash
# Check JIT compilation activity
java -XX:+PrintCompilation -jar app.jar 2>&1 | tail -50

# Force tiered compilation (default in JDK 8+)
java -XX:+TieredCompilation -jar app.jar

# Pre-warm critical paths in production
# Add a health-check endpoint that exercises key code paths on startup
```

**For benchmarks:** Always include warm-up iterations.
```java
@Benchmark
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
public void benchmarkTaskCreation() { ... }
```

### Pattern: GC Tuning

**Symptom:** `jstat` shows frequent Full GC pauses (>100ms). Throughput drops during GC.

```bash
# Monitor GC activity
jstat -gcutil <pid> 1000
# Columns: S0%, S1%, E%, O%, M%, CCS%, YGC, YGCT, FGC, FGCT, GCT

# Enable GC logging (JDK 9+)
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar

# Choose GC for workload:
# • G1GC (default) — balanced throughput and latency
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar

# • ZGC — ultra-low latency (<10ms pauses), large heaps
java -XX:+UseZGC -jar app.jar

# • Shenandoah — low-latency alternative to ZGC
java -XX:+UseShenandoahGC -jar app.jar
```

### Pattern: Object Pooling

**Symptom:** High allocation rate in JFR/Async Profiler. Frequent young generation GC.

```java
// ❌ New StringBuilder per log message (high allocation rate)
String msg = "Task " + taskId + " completed in " + duration + "ms";

// ✅ Parameterized logging — no allocation if level disabled
logger.info("Task {} completed in {}ms", taskId, duration);

// ✅ Object pool for expensive objects
private static final ObjectPool<Formatter> FORMATTER_POOL = ...;

Formatter formatter = FORMATTER_POOL.borrowObject();
try {
    return formatter.format(data);
} finally {
    FORMATTER_POOL.returnObject(formatter);
}
```

### Pattern: Connection Pool Sizing

**Symptom:** Thread contention on connection pool. `hikaricp.connections.pending > 0`.

```yaml
# HikariCP optimal pool size formula:
# pool_size = (core_count * 2) + spindle_count
# For SSD: pool_size ≈ core_count * 2
spring:
  datasource:
    hikari:
      maximum-pool-size: 10    # Not too large!
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### Pattern: Query Optimization

**Symptom:** Slow database queries dominating request latency.

```java
// ❌ N+1 query
List<Task> tasks = taskRepository.findAll();
tasks.forEach(t -> System.out.println(t.getUser().getName())); // N queries!

// ✅ JOIN fetch
@Query("SELECT t FROM Task t JOIN FETCH t.user")
List<Task> findAllWithUsers();

// ✅ Batch fetch
@BatchSize(size = 25)
@OneToMany(mappedBy = "project")
private List<Task> tasks;
```

### Pattern: Virtual Threads (Java 21+)

**Symptom:** Thread pool exhausted under high I/O concurrency. Tomcat thread pool (200) fully utilized.

```java
// ✅ Virtual threads — millions of concurrent I/O operations
// Spring Boot 3.2+
spring.threads.virtual.enabled=true

// Or manually:
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Task>> futures = taskIds.stream()
        .map(id -> executor.submit(() -> fetchTask(id)))
        .toList();
    // Each virtual thread is cheap (~1KB stack vs 1MB for platform thread)
}
```

---

## Anti-Patterns

1. **Don't tune GC before profiling** — measure first, tune parameters based on data.
2. **Don't set heap size too large** — larger heap = longer GC pauses. Start with `-Xmx` at 2-4x steady-state live data.
3. **Don't use `synchronized` for hot-path locking** — use `java.util.concurrent` lock-free structures.
4. **Don't create threads manually** — use executor services. Virtual threads for I/O, platform threads for CPU.
5. **Don't ignore string concatenation in loops** — use `StringBuilder` or `String.join()`.
6. **Don't box primitives unnecessarily** — `int` not `Integer` in hot paths. Use primitive-specialized collections.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| JIT warm-up | First ~10K invocations slower | JIT needs execution data to optimize |
| G1GC minor pause | 5-20ms | Generational GC marking phase |
| ZGC pause | <1ms (typically) | Concurrent GC, but not zero |
| Thread context switch | ~5-10μs | OS scheduler overhead |
| `synchronized` contention | Variable | Lock acquisition has inherent cost |
| Reflection invocation | 5-10x vs direct call | Dynamic dispatch overhead |
| Class loading | First-use latency | Lazy loading by JVM design |

---

## Benchmarking (JMH)

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 10, time = 1)
@Fork(2)
public class TaskServiceBenchmark {

    @Benchmark
    public Task createTask() {
        return taskService.create(new CreateTaskRequest("title", Priority.HIGH));
    }
}

// Run: mvn clean verify -pl benchmarks
// or: java -jar benchmarks/target/benchmarks.jar
```

---

## Related
- Java Idioms @.agents/skills/java-idioms/SKILL.md
- Spring Boot Idioms @.agents/skills/spring-boot-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
