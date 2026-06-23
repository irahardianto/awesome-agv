---
paths:
  - "**/*.java"
---

## Java Idioms and Patterns

Java rewards clarity, type safety, and robust ecosystem tooling. Modern Java (17+ LTS) favors records, sealed classes, and pattern matching. Idiomatic Java = clean, readable, framework-aware.

> Scope: Java coding idioms. Test naming: .agents/rules/testing-strategy.md. Logging: `@.agents/skills/logging-implementation/SKILL.md`.

### Modern Java Features (17+ LTS)

1. **Records for immutable data carriers:**
   ```java
   // ✅ Concise, immutable, auto-generated equals/hashCode/toString
   public record CreateTaskRequest(String title, Priority priority) {}

   // ❌ Verbose boilerplate POJO
   public class CreateTaskRequest { /* getters, setters, equals, hashCode... */ }
   ```

2. **Sealed classes for constrained hierarchies:**
   ```java
   public sealed interface TaskResult permits Success, Failure, Pending {}
   public record Success(Task task) implements TaskResult {}
   public record Failure(String reason) implements TaskResult {}
   public record Pending(String taskId) implements TaskResult {}
   ```

3. **Pattern matching with `switch`:**
   ```java
   return switch (result) {
       case Success(var task) -> ResponseEntity.ok(task);
       case Failure(var reason) -> ResponseEntity.badRequest().body(reason);
       case Pending(var id) -> ResponseEntity.accepted().body(id);
   };
   ```

4. **Text blocks for queries and templates:**
   ```java
   String query = """
       SELECT t.id, t.title, t.priority
       FROM tasks t
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC
       """;
   ```

5. **Virtual threads (21+) for I/O-bound work:**
   ```java
   try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
       executor.submit(() -> fetchUser(userId));
       executor.submit(() -> fetchTasks(userId));
   }
   ```

### Error Handling

1. **Domain exception hierarchies — never raw `Exception`:**
   ```java
   public abstract class DomainException extends RuntimeException {
       protected DomainException(String message) { super(message); }
   }

   public class NotFoundException extends DomainException {
       private final String resource;
       private final String resourceId;
       public NotFoundException(String resource, String resourceId) {
           super(String.format("%s '%s' not found", resource, resourceId));
           this.resource = resource;
           this.resourceId = resourceId;
       }
   }
   ```

2. **Never catch `Exception` broadly** — catch specific exceptions. Never swallow exceptions silently.

3. **`Optional` for nullable returns — never for parameters:**
   ```java
   // ✅ Return type
   public Optional<Task> findById(String id) { ... }

   // ❌ Parameter — use overloading or @Nullable instead
   public void process(Optional<String> filter) { ... }
   ```

### Interfaces and DI

1. **Program to interfaces, inject via constructor:**
   ```java
   // ✅ Interface in consumer package
   public interface TaskStorage {
       Task getById(String id);
       void save(Task task);
   }

   // ✅ Constructor injection (Spring auto-wires)
   @Service
   public class TaskService {
       private final TaskStorage storage;
       public TaskService(TaskStorage storage) { this.storage = storage; }
   }
   ```

2. **Prefer constructor injection over `@Autowired` field injection.** No field injection — ever.

### Naming

1. **PascalCase** for classes, interfaces, enums, records.
2. **camelCase** for methods, fields, local variables.
3. **UPPER_SNAKE_CASE** for constants (`static final`).
4. **No Hungarian notation.** `TaskService` not `ITaskService`. `userId` not `strUserId`.
5. **Package names**: lowercase, no underscores. `com.example.task` not `com.example.task_management`.

### Testing

> Test naming, pyramid: .agents/rules/testing-strategy.md. Java-specific tooling below.

1. **JUnit 5 + AssertJ:**
   ```java
   @Test
   void calculateDiscount_returnsZero_whenNoItems() {
       var result = calculator.calculateDiscount(List.of(), coupon);
       assertThat(result).isEqualTo(0.0);
   }
   ```

2. **`@ParameterizedTest` for table-driven tests:**
   ```java
   @ParameterizedTest
   @CsvSource({"low,1", "medium,5", "high,10"})
   void priorityScore_mapsCorrectly(String priority, int expected) {
       assertThat(Priority.score(priority)).isEqualTo(expected);
   }
   ```

3. **Mockito for mocking — never PowerMock:**
   ```java
   @ExtendWith(MockitoExtension.class)
   class TaskServiceTest {
       @Mock TaskStorage storage;
       @InjectMocks TaskService service;
   }
   ```

4. **TestContainers for integration tests** — real DB, no in-memory substitutes for critical paths.

### Formatting and Static Analysis

Must pass zero warnings/errors before commit. See .agents/rules/code-idioms-and-conventions.md.

| Tool | Purpose | Command |
|---|---|---|
| `google-java-format` | Canonical formatting | `google-java-format --replace src/**/*.java` |
| `SpotBugs` | Bug detection | `mvn spotbugs:check` or `gradle spotbugsMain` |
| `Error Prone` | Compile-time bug detection | Compiler plugin |
| `Checkstyle` | Style enforcement | `mvn checkstyle:check` |
| `SonarQube` | Comprehensive analysis | CI integration |
| `OWASP Dependency-Check` | CVE scanning | `mvn dependency-check:check` |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
- Logging Implementation @.agents/skills/logging-implementation/SKILL.md
