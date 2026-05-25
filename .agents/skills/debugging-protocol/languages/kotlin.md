# Kotlin Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Kotlin-specific symptoms, coroutine debugging, and JVM/Android diagnostics.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `NullPointerException` on platform type | Java interop returning null → add explicit nullable type annotation |
| `KotlinNullPointerException` | `!!` operator on null value → find the `!!` and replace with safe call |
| Coroutine cancellation not working | Check for non-cancellable blocking calls → use `ensureActive()` or `yield()` |
| `JobCancellationException` | Parent scope cancelled → check structured concurrency hierarchy |
| `IllegalStateException: Already resumed` | Continuation resumed multiple times → check callback-to-coroutine bridge |
| Memory leak in Android | ViewModel outliving Activity → check coroutine scope (`viewModelScope`) |
| `ClassCastException` with generics | Type erasure → check generic type checks at runtime, use `reified` |
| Slow build | Kapt processing → migrate to KSP, check annotation processors |
| Test flakiness with coroutines | Missing `runTest` or `TestDispatcher` → use `kotlinx-coroutines-test` |
| `StackOverflowError` in `tailrec` | Function not actually tail-recursive → check that recursive call is last |

---

## Diagnostic Tools

### Coroutine Debugger

```kotlin
// Enable coroutine debugging (shows coroutine names in logs)
// JVM argument:
// -Dkotlinx.coroutines.debug=on

// Or in code:
System.setProperty("kotlinx.coroutines.debug", "on")

// Coroutine dump (like thread dump, but for coroutines)
import kotlinx.coroutines.debug.DebugProbes

DebugProbes.install()
// ... later ...
DebugProbes.dumpCoroutines()  // Prints all active coroutines with stack traces
```

### IntelliJ / Android Studio

```
# Coroutines tab in debugger
# Debug → Coroutines tab → shows all active coroutines, their state, and creation stack

# Conditional breakpoint for specific coroutine
# Right-click breakpoint → Condition → "coroutineContext[CoroutineName]?.name == 'myCoroutine'"

# Exception breakpoint for Kotlin-specific exceptions
# Run → View Breakpoints → + → Kotlin Exception Breakpoint
```

### JVM Tools (Kotlin runs on JVM)

```bash
# All JVM tools from java.md apply:
jstack <pid>                    # Thread dump
jmap -dump:format=b,file=heap.hprof <pid>  # Heap dump
jcmd <pid> JFR.start duration=30s filename=rec.jfr  # Flight Recorder
```

---

## Common Kotlin Bugs and Fixes

### Coroutine Leak (Unstructured Concurrency)

**Symptom:** Coroutines keep running after Activity/Fragment destroyed. Memory grows.

```kotlin
// ❌ GlobalScope — outlives everything, never cancelled
class TaskViewModel : ViewModel() {
    fun loadTasks() {
        GlobalScope.launch {  // Never cancelled!
            val tasks = repository.getTasks()
            _state.value = tasks
        }
    }
}

// ✅ viewModelScope — automatically cancelled on ViewModel clear
class TaskViewModel : ViewModel() {
    fun loadTasks() {
        viewModelScope.launch {
            val tasks = repository.getTasks()
            _state.value = tasks
        }
    }
}

// ✅ Custom scope with SupervisorJob for services
class TaskService(private val scope: CoroutineScope) {
    fun processAsync(id: String) = scope.launch {
        // Cancelled when scope is cancelled
    }
}
```

### Platform Type Null Safety

**Symptom:** `NullPointerException` in Kotlin code despite null safety. Usually at Java interop boundary.

```kotlin
// Java method returns String (platform type — could be null)
// public String getName() { return null; }

// ❌ Kotlin trusts platform type — crashes at runtime
val name: String = javaObject.name  // NPE if null!

// ✅ Explicitly handle nullable
val name: String? = javaObject.name  // Safe — compiler enforces null checks
val displayName = name ?: "Unknown"

// ✅ Or validate with require
val name: String = requireNotNull(javaObject.name) { "Name must not be null" }
```

### Coroutine Cancellation Not Working

**Symptom:** Coroutine keeps running after `cancel()` is called.

**Root cause:** Blocking operations (CPU-bound loops, `Thread.sleep`) don't check cancellation.

```kotlin
// ❌ Non-cancellable — loop runs to completion even after cancel
suspend fun processLargeDataset(items: List<Item>) {
    for (item in items) {
        heavyComputation(item)  // Never checks cancellation!
    }
}

// ✅ Check cancellation periodically
suspend fun processLargeDataset(items: List<Item>) {
    for (item in items) {
        ensureActive()  // Throws CancellationException if cancelled
        heavyComputation(item)
    }
}

// ✅ Or use yield() for cooperative cancellation
suspend fun processLargeDataset(items: List<Item>) {
    for (item in items) {
        yield()  // Checks cancellation + allows other coroutines to run
        heavyComputation(item)
    }
}
```

### Testing Coroutines

**Symptom:** Tests hang, timeout, or produce flaky results with coroutines.

```kotlin
// ❌ Using runBlocking in tests — doesn't advance virtual time
@Test
fun `test with delay`() = runBlocking {
    val result = serviceWithDelay.process()  // Actually waits!
    assertEquals(expected, result)
}

// ✅ Use runTest — virtual time, auto-advances delays
@Test
fun `test with delay`() = runTest {
    val result = serviceWithDelay.process()  // Delay skipped instantly
    assertEquals(expected, result)
}

// ✅ Inject TestDispatcher for dispatcher control
@Test
fun `test concurrent work`() = runTest {
    val testDispatcher = UnconfinedTestDispatcher(testScheduler)
    val service = TaskService(testDispatcher)
    // ...
}
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| `DebugProbes.dumpCoroutines()` shows leaked coroutine | +60% confidence in coroutine leak |
| NPE in Kotlin code at Java interop boundary | +70% confidence in platform type issue |
| Coroutine survives after `cancel()` | +50% confidence in missing `ensureActive()` |
| Test timeout with `runBlocking` but passes with `runTest` | +80% confidence in virtual time issue |
| Stack trace shows `!!` operator | +90% confidence — replace `!!` with safe handling |

---

## Related
- Kotlin Idioms @.agents/skills/kotlin-idioms/SKILL.md
- Java Debugging @java.md (JVM tools apply to Kotlin)
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Error Handling Principles @error-handling-principles.md
