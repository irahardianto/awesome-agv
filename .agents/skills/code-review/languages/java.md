# Java Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Java code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `catch (Exception e) { }` (empty catch) | Critical | `[ERR]` | Handle, log, or re-throw the exception |
| `@Autowired` on field (field injection) | Major | `[TEST]` | Constructor injection — enables testing without Spring |
| Raw types (`List` instead of `List<Task>`) | Major | `[ERR]` | Always parameterize generic types |
| `null` return instead of `Optional<T>` | Major | `[ERR]` | Return `Optional.empty()` for absence |
| Mutable collections exposed from methods | Major | `[SEC]` | Return `Collections.unmodifiableList()` or `List.copyOf()` |
| `System.out.println` / `System.err.println` | Major | `[OBS]` | Use SLF4J logger with structured fields |
| `catch (Exception e)` swallowing all errors | Critical | `[ERR]` | Catch specific exceptions or re-throw |
| `e.printStackTrace()` | Major | `[OBS]` | Use `logger.error("message", e)` |
| `new Date()` / `Calendar` (legacy date API) | Major | `[PAT]` | Use `java.time` — `Instant`, `LocalDate`, `ZonedDateTime` |
| Public mutable fields (no encapsulation) | Major | `[ARCH]` | Use `private` fields with accessor methods, or `record` |
| `Thread.sleep()` in async/reactive code | Critical | `[ERR]` | Use scheduler delays or `CompletableFuture.delayedExecutor` |
| `synchronized` on public method | Major | `[ERR]` | Use private lock object to prevent external interference |
| Missing `@Override` annotation | Major | `[PAT]` | Always annotate methods that override parent |
| String concatenation in loops | Major | `[PAT]` | Use `StringBuilder` or `String.join()` |

---

## Detection Commands

```bash
# Empty catch blocks
grep -rn 'catch.*{' --include='*.java' -A1 | grep -B1 '^\s*}'

# Field injection
grep -rn '@Autowired' --include='*.java' | grep -v 'constructor\|//.*@Autowired'

# Raw types (List without generic)
grep -rn 'List \|Map \|Set \|Collection ' --include='*.java' | grep -v '<\|import\|//'

# null returns in public methods
grep -rn 'return null;' --include='*.java'

# System.out/err
grep -rn 'System\.out\.\|System\.err\.' --include='*.java' | grep -v 'test\|Test'

# printStackTrace
grep -rn 'printStackTrace' --include='*.java'

# Legacy date API
grep -rn 'new Date()\|Calendar\.' --include='*.java' | grep -v 'import\|test'

# Missing @Override
grep -rn 'public.*void\|public.*String\|public.*boolean' --include='*.java' -B1 | grep -v '@Override\|interface\|abstract'
```

---

## Correct Patterns (Reference)

### Dependency Injection

```java
// ❌ Field injection — untestable without Spring
@Service
public class TaskService {
    @Autowired
    private TaskRepository repository;
}

// ✅ Constructor injection — testable with plain new
@Service
public class TaskService {
    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }
}
```

### Null Safety

```java
// ❌ Null return
public Task findById(String id) {
    return taskMap.get(id);  // Returns null if missing
}

// ✅ Optional
public Optional<Task> findById(String id) {
    return Optional.ofNullable(taskMap.get(id));
}

// Caller handles explicitly
Task task = service.findById(id)
    .orElseThrow(() -> new TaskNotFoundException(id));
```

### Error Handling

```java
// ❌ Swallowed exception
try {
    repository.save(task);
} catch (Exception e) {
    // Nothing — error silently disappears
}

// ✅ Specific exception with logging
try {
    repository.save(task);
} catch (DataAccessException e) {
    logger.error("Failed to save task", Map.of("taskId", task.getId()), e);
    throw new ServiceException("Task save failed", e);
}
```

### Modern Java

```java
// ❌ Verbose DTO
public class TaskResponse {
    private final String id;
    private final String title;
    // constructor, getters, equals, hashCode, toString...
}

// ✅ Record (Java 16+)
public record TaskResponse(String id, String title, Priority priority) {}
```

---

## References
- Java Idioms @.agents/skills/java-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @.agents/skills/logging-implementation/SKILL.md
- Architectural Patterns @architectural-pattern.md
