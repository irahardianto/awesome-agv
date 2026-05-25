# Kotlin Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Kotlin.

---

## Null Safety

- [ ] **No `!!` (not-null assertion)** without safety comment — use `?.`, `?:`, `let`, or `require`
- [ ] **Platform types explicitly annotated** — Java interop returns handled
- [ ] **`requireNotNull` / `checkNotNull`** for preconditions — not `!!`

---

## Immutability

- [ ] **`val` over `var`** — mutable only when necessary
- [ ] **Data classes use `val` properties** — modify with `.copy()`
- [ ] **Read-only collections returned from APIs** — `List<T>` not `MutableList<T>`

---

## Coroutines

- [ ] **No `GlobalScope.launch`** — use structured concurrency (inject `CoroutineScope`)
- [ ] **No `runBlocking` in production** — use `suspend` functions throughout
- [ ] **No `Thread.sleep`** — use `delay()` in coroutines
- [ ] **`SupervisorJob`** for parallel work — child failures don't cancel siblings
- [ ] **Exception handling** — `CoroutineExceptionHandler` or `try/catch` in launch

---

## Idiomatic Kotlin

- [ ] **String templates** — `"Hello, ${name}"` not `"Hello, " + name`
- [ ] **Kotlin stdlib collections** — `map`, `filter`, `flatMap` not Java Streams
- [ ] **Scope functions** used appropriately — `let`, `apply`, `also`, `run`, `with`
- [ ] **`when` expressions** over `if-else` chains
- [ ] **Extension functions** for utility — not top-level procedural functions

---

## Error Handling

- [ ] **Catch specific exceptions** — not `Exception` or `Throwable`
- [ ] **`sealed class` for domain errors** — exhaustive `when` handling
- [ ] **`Result<T>` or custom `Either`** for expected failures

---

## Observability

- [ ] **No `println()`** — use SLF4J or kotlin-logging
- [ ] **Structured logging** — key-value pairs in MDC

---

## Static Analysis

- [ ] `detekt` passes with zero violations
- [ ] Kotlin compiler warnings resolved
- [ ] No `@Suppress` without explanatory comment

---

## References
- Kotlin Idioms @.agents/skills/kotlin-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
