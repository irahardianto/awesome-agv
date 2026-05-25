# Kotlin Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Kotlin code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `!!` (not-null assertion) without safety comment | Critical | `[ERR]` | Use `?.`, `?:`, or `let` / `require` / `checkNotNull` |
| `var` when `val` suffices | Major | `[PAT]` | Prefer `val` — immutability by default |
| Platform type (`!`) not explicitly handled | Major | `[ERR]` | Annotate Java interop with explicit nullable/non-null types |
| `catch (e: Exception)` swallowing all errors | Critical | `[ERR]` | Catch specific exceptions, handle or rethrow |
| Java-style `for` loops | Major | `[PAT]` | Use `forEach`, `map`, `filter`, or range expressions |
| Mutable collection exposed from API | Major | `[SEC]` | Return `List<T>` (read-only interface) instead of `MutableList<T>` |
| `companion object` as service locator | Major | `[TEST]` | Use constructor injection |
| `GlobalScope.launch` | Critical | `[ERR]` | Use structured concurrency — inject `CoroutineScope` |
| `runBlocking` in production code | Critical | `[ERR]` | Use `suspend` functions — `runBlocking` blocks thread |
| `Thread.sleep` in coroutine code | Critical | `[ERR]` | Use `delay()` — non-blocking |
| `println()` in production | Major | `[OBS]` | Use SLF4J logger or Kotlin logging library |
| Java `Stream` API in Kotlin | Major | `[PAT]` | Use Kotlin stdlib sequences and collection operators |
| Data class with mutable properties | Major | `[PAT]` | Use `val` properties — data classes should be immutable |
| String concatenation instead of templates | Major | `[PAT]` | Use `"Hello, ${name}"` string templates |

---

## Detection Commands

```bash
# Not-null assertions
grep -rn '!!' --include='*.kt' | grep -v 'test\|Test\|// '

# var when val would work
grep -rn '^\s*var ' --include='*.kt' | grep -v 'test\|Test\|@State\|mutable'

# GlobalScope
grep -rn 'GlobalScope' --include='*.kt'

# runBlocking in non-test code
grep -rn 'runBlocking' --include='*.kt' | grep -v 'test\|Test\|main'

# Thread.sleep in coroutines
grep -rn 'Thread\.sleep' --include='*.kt'

# println in production
grep -rn 'println(' --include='*.kt' | grep -v 'test\|Test'

# Mutable data class
grep -rn 'data class' --include='*.kt' -A5 | grep 'var '

# Java Streams
grep -rn '\.stream()\|\.collect(' --include='*.kt'
```

---

## Correct Patterns (Reference)

### Null Safety

```kotlin
// ❌ Force unwrap — crash risk
val name = user!!.name

// ✅ Safe call + Elvis
val name = user?.name ?: "Unknown"

// ✅ require for preconditions
fun process(user: User?) {
    requireNotNull(user) { "User is required" }
    // user is smart-cast to non-null here
}
```

### Coroutines

```kotlin
// ❌ GlobalScope — unstructured, leaks
GlobalScope.launch {
    processTask(taskId)
}

// ✅ Structured concurrency
class TaskService(private val scope: CoroutineScope) {
    fun processAsync(taskId: String) = scope.launch {
        processTask(taskId)
    }
}

// ❌ runBlocking blocks the thread
fun getTask(id: String): Task = runBlocking {
    repository.findById(id)
}

// ✅ Suspend function
suspend fun getTask(id: String): Task =
    repository.findById(id)
```

### Immutable Data

```kotlin
// ❌ Mutable data class
data class Task(var title: String, var status: Status)

// ✅ Immutable — use copy() for modifications
data class Task(val title: String, val status: Status)

val updated = task.copy(status = Status.DONE)
```

---

## References
- Kotlin Idioms @.agents/skills/kotlin-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
