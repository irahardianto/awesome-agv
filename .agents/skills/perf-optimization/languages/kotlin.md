# Kotlin / JVM Performance Profiling

> **Applicability:** Kotlin backend services (Ktor, Spring Boot), Android applications, and Kotlin Multiplatform. JVM tools from `java.md` also apply — this module covers Kotlin-specific patterns.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| JDK Flight Recorder | Low-overhead JVM profiling | Same as Java — `jcmd <pid> JFR.start` |
| Async Profiler | CPU/allocation flamegraphs | `./profiler.sh -d 30 -f flamegraph.html <pid>` |
| Android Studio Profiler | CPU/memory/network for Android | Built-in — Profile → CPU/Memory/Energy |
| Kotlin `measureTime` | Inline timing | `measureTime { ... }` |
| `@OptIn(ExperimentalTime::class)` | Duration API | `measureTimedValue { ... }` |

> **Note:** All JVM tools from [java.md](java.md) apply directly to Kotlin. This module covers Kotlin-specific optimization patterns.

---

## Optimization Patterns

### Pattern: Inline Functions (Reducing Lambda Overhead)

**Symptom:** High allocation rate from lambda creation. Profiler shows `kotlin/jvm/internal/Ref$ObjectRef` allocations.

```kotlin
// ❌ Non-inline — lambda creates anonymous class + object allocation
fun <T> withRetry(block: () -> T): T {
    repeat(3) {
        try { return block() } catch (e: Exception) { /* retry */ }
    }
    throw RuntimeException("Retries exhausted")
}

// ✅ Inline — lambda inlined at call site, zero allocation
inline fun <T> withRetry(block: () -> T): T {
    repeat(3) {
        try { return block() } catch (e: Exception) { /* retry */ }
    }
    throw RuntimeException("Retries exhausted")
}
```

### Pattern: Sequence vs List (Lazy Evaluation)

**Symptom:** Multiple intermediate collections created for chained operations. High GC pressure.

```kotlin
// ❌ Eager — creates 3 intermediate lists
val result = items
    .filter { it.isActive }      // New list
    .map { it.transform() }      // Another new list
    .take(10)                    // Yet another list (processed ALL items first)

// ✅ Lazy — single pass, no intermediate collections
val result = items.asSequence()
    .filter { it.isActive }      // No list created
    .map { it.transform() }      // No list created
    .take(10)                    // Stops after 10 matches
    .toList()                    // Single materialization

// Rule of thumb: use sequences when:
// - Chain has 3+ operations
// - Collection is large (>1000 items)
// - Early termination is possible (take, first, find)
```

### Pattern: Value Classes (Reducing Allocation)

**Symptom:** Wrapper types creating unnecessary heap allocations.

```kotlin
// ❌ Regular class — heap allocated for every instance
data class TaskId(val value: String)

// Calling: processTask(TaskId("abc"))  // Allocates TaskId object

// ✅ Value class — unboxed at runtime (in most cases)
@JvmInline
value class TaskId(val value: String)

// Calling: processTask(TaskId("abc"))  // Inlined to just String at runtime
```

### Pattern: Coroutine Performance

**Symptom:** Coroutine overhead visible in profiler. Context switching between dispatchers.

```kotlin
// ❌ Unnecessary dispatcher switch
suspend fun getTask(id: String): Task {
    return withContext(Dispatchers.IO) {  // Switch to IO pool
        cache.get(id) ?: run {
            val task = repository.findById(id)  // Actually IO
            cache.put(id, task)
            task
        }
    }
}

// ✅ Let the caller choose the dispatcher — suspend functions are dispatcher-agnostic
suspend fun getTask(id: String): Task {
    return cache.get(id) ?: run {
        val task = repository.findById(id)
        cache.put(id, task)
        task
    }
}

// ✅ Use Dispatchers.Default for CPU-heavy work
suspend fun processReport(data: List<Record>): Report {
    return withContext(Dispatchers.Default) {
        // CPU-heavy computation
        data.parallelStream().map { transform(it) }.collect(toList())
    }
}
```

### Pattern: Avoid Boxing in Generic Code

**Symptom:** High allocation rate from autoboxing `Int` → `Integer`, `Long` → `java.lang.Long`.

```kotlin
// ❌ Generic function boxes primitives
fun <T> List<T>.sumBy(selector: (T) -> Int): Int {
    var sum = 0
    for (item in this) sum += selector(item)  // selector returns boxed Integer
    return sum
}

// ✅ Use stdlib's optimized extension (inline + primitive)
items.sumOf { it.priority.ordinal }  // No boxing — uses inline Int

// ✅ Use IntArray instead of Array<Int> for primitive arrays
val priorities = IntArray(100)  // Primitive int[]
// vs
val priorities = Array(100) { 0 }  // Boxed Integer[]
```

---

## Anti-Patterns

1. **Don't use `listOf` + chaining for large data** — use `asSequence()` for lazy evaluation.
2. **Don't create wrapper classes for IDs** — use `@JvmInline value class` to avoid allocation.
3. **Don't switch dispatchers unnecessarily** — `suspend` functions should be dispatcher-agnostic.
4. **Don't use `Array<Int>`** — use `IntArray` for primitive performance.
5. **Don't forget `inline`** on higher-order utility functions — prevents lambda allocation.
6. **Don't use reflection in hot paths** — use `KClass` references or generated code.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| Coroutine creation | ~100ns | State machine + continuation object |
| `withContext` switch | ~1μs | Dispatcher hop + context save/restore |
| Lambda invocation (non-inline) | ~5ns + allocation | Anonymous class creation |
| Value class boxing (at generic boundary) | Same as Java boxing | JVM type erasure forces boxing |
| Null check (Kotlin compiler-inserted) | ~1ns | `Intrinsics.checkNotNull` |
| `data class` `copy()` | Proportional to fields | Creates new object with all fields |

---

## Benchmarking

```kotlin
// JMH (via jmh-gradle-plugin)
@State(Scope.Benchmark)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
open class CollectionBenchmark {

    private val items = (1..10_000).toList()

    @Benchmark
    fun eagerChain(): List<Int> = items
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)

    @Benchmark
    fun sequenceChain(): List<Int> = items.asSequence()
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)
        .toList()
}
```

```kotlin
// Quick inline measurement
import kotlin.time.measureTimedValue

val (result, duration) = measureTimedValue {
    taskService.processAll(tasks)
}
logger.info { "Processed ${tasks.size} tasks in $duration" }
```

---

## Related
- Kotlin Idioms @.agents/skills/kotlin-idioms/SKILL.md
- Java Performance @java.md (JVM tools and GC tuning apply)
- Performance Optimization SKILL @../SKILL.md
