# Java Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Java.

---

## Dependency Injection

- [ ] **Constructor injection only** — no `@Autowired` on fields
- [ ] **Dependencies are `final`** — set once in constructor
- [ ] **Interfaces for I/O dependencies** — repositories, clients, external services

---

## Type Safety

- [ ] **No raw generic types** — always parameterize (`List<Task>`, not `List`)
- [ ] **`Optional<T>` for nullable returns** — not raw `null`
- [ ] **`record` types for DTOs** (Java 16+) — immutable by default
- [ ] **`sealed` interfaces** for exhaustive type hierarchies (Java 17+)

---

## Error Handling

- [ ] **No empty `catch` blocks** — handle, log, or re-throw
- [ ] **Catch specific exceptions** — not `Exception` or `Throwable`
- [ ] **Custom domain exceptions** extend a base project exception
- [ ] **No `e.printStackTrace()`** — use `logger.error("message", e)`
- [ ] **Resources in try-with-resources** — `Connection`, `InputStream`, `ResultSet`

### Correct Patterns

```java
// ✅ Try-with-resources
try (var conn = dataSource.getConnection();
     var stmt = conn.prepareStatement(SQL)) {
    stmt.setString(1, taskId);
    try (var rs = stmt.executeQuery()) {
        // process results
    }
}
```

---

## Collections Safety

- [ ] **Return immutable collections from public methods** — `List.copyOf()`, `Map.copyOf()`
- [ ] **No exposed mutable internal state** — defensive copy or unmodifiable wrapper
- [ ] **Use `Map.of()` / `List.of()`** for inline immutable collections

---

## Concurrency

- [ ] **No `synchronized` on public methods** — use private lock objects
- [ ] **No `Thread.sleep()` in production code** — use `ScheduledExecutorService` or reactive delays
- [ ] **`volatile` or `AtomicReference`** for shared mutable state
- [ ] **Thread pool sizing** justified by workload analysis (I/O-bound vs CPU-bound)

---

## Observability

- [ ] **SLF4J logger** — no `System.out.println` or `e.printStackTrace()`
- [ ] **Structured MDC context** — correlation IDs, user IDs in MDC
- [ ] **Parameterized log messages** — `logger.info("Task created: {}", taskId)`, not string concatenation

---

## Modern Java

- [ ] **`var` for local variables** where type is obvious from right-hand side
- [ ] **`record` for data carriers** — immutable, equals/hashCode auto-generated
- [ ] **`switch` expressions** (Java 14+) over if-else chains
- [ ] **`java.time` API** — no `Date`, `Calendar`, or `SimpleDateFormat`
- [ ] **Text blocks** (Java 15+) for multi-line strings

---

## Static Analysis

- [ ] `mvn compile` or `gradle build` passes with zero errors
- [ ] Checkstyle / SpotBugs / PMD passes with zero violations
- [ ] No `@SuppressWarnings` without explanatory comment

---

## References
- Java Idioms @.agents/skills/java-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
