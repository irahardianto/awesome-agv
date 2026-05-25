---
paths:
  - "**/*.kt"
  - "**/*.kts"
---

## Kotlin Idioms and Patterns

Kotlin rewards conciseness, null safety, and coroutine-based concurrency. Idiomatic Kotlin = safe, expressive, interop-aware.

> Scope: Kotlin coding idioms. Test naming: .agents/rules/testing-strategy.md.

### Null Safety

1. **`?` for nullable types — never platform types without annotation:**
   ```kotlin
   fun findById(id: String): Task?  // explicitly nullable
   fun getById(id: String): Task    // guaranteed non-null — throws if not found
   ```

2. **Prefer `?.let {}` and `?:` (Elvis) over null checks.**

3. **Never `!!` in production** — use `requireNotNull` with a message.

### Data Classes and Sealed Types

1. **`data class` for DTOs and domain objects:**
   ```kotlin
   data class CreateTaskRequest(val title: String, val priority: Priority)
   ```

2. **`sealed class`/`sealed interface` for restricted hierarchies:**
   ```kotlin
   sealed interface TaskResult {
       data class Success(val task: Task) : TaskResult
       data class NotFound(val id: String) : TaskResult
       data class ValidationError(val errors: List<String>) : TaskResult
   }
   ```

3. **Exhaustive `when` with sealed types:**
   ```kotlin
   when (result) {
       is TaskResult.Success -> ok(result.task)
       is TaskResult.NotFound -> notFound(result.id)
       is TaskResult.ValidationError -> badRequest(result.errors)
   }
   ```

### Coroutines

1. **Structured concurrency** — `coroutineScope`, `supervisorScope`.
2. **Never `GlobalScope.launch`** — always scoped.
3. **`Flow` for reactive streams:**
   ```kotlin
   fun observeTasks(): Flow<List<Task>> = flow {
       while (currentCoroutineContext().isActive) {
           emit(storage.getAll())
           delay(5.seconds)
       }
   }
   ```

### Naming

1. **PascalCase** for classes. **camelCase** for functions, properties.
2. **No `get`/`set` prefixes** — use properties.
3. **Backtick function names** only in tests: `` `should create task when valid`() ``

### Testing

1. **kotest or JUnit 5 + MockK:**
   ```kotlin
   @Test
   fun `create task returns task when valid`() {
       val result = service.create("Test", Priority.HIGH)
       assertThat(result.title).isEqualTo("Test")
   }
   ```

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `ktlint` | Formatting | `ktlint --format` |
| `detekt` | Static analysis | `detekt --config detekt.yml` |
| Kotlin compiler | Null safety | Built-in |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
