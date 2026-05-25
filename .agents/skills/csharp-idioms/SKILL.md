---
paths:
  - "**/*.cs"
---

## C# Idioms and Patterns

C# rewards type safety, LINQ expressiveness, and async-first design. Modern C# (10+/.NET 6+) favors records, nullable reference types, and minimal APIs. Idiomatic C# = clean, async-aware, framework-integrated.

> Scope: C# coding idioms. Test naming: .agents/rules/testing-strategy.md. Logging: `@.agents/rules/logging-and-observability-principles.md`.

### Modern C# Features (10+)

1. **Nullable reference types — always enabled:**
   ```csharp
   // ✅ Explicit nullability
   public Task? FindById(string id) { ... }
   public Task GetById(string id) { ... } // never returns null — throws

   // In .csproj: <Nullable>enable</Nullable>
   ```

2. **Records for immutable data:**
   ```csharp
   public record CreateTaskRequest(string Title, Priority Priority);
   public record TaskResponse(string Id, string Title, DateTime CreatedAt);
   ```

3. **Pattern matching:**
   ```csharp
   return result switch
   {
       Success(var task) => Ok(task),
       NotFound(var id) => NotFound($"Task {id} not found"),
       ValidationError(var errors) => BadRequest(errors),
       _ => StatusCode(500)
   };
   ```

4. **`required` and `init` for safe construction:**
   ```csharp
   public class AppConfig
   {
       public required string DatabaseUrl { get; init; }
       public required string ApiKey { get; init; }
       public int MaxRetries { get; init; } = 3;
   }
   ```

### Error Handling

1. **Result pattern over exceptions for expected failures:**
   ```csharp
   public record Result<T>
   {
       public T? Value { get; init; }
       public string? Error { get; init; }
       public bool IsSuccess => Error is null;
       public static Result<T> Ok(T value) => new() { Value = value };
       public static Result<T> Fail(string error) => new() { Error = error };
   }
   ```

2. **Domain exceptions for unexpected failures — never raw `Exception`.**

3. **Never `catch (Exception)` without re-throw or specific handling.**

### Async/Await

1. **Async all the way — never `.Result` or `.Wait()` on tasks:**
   ```csharp
   // ✅ Async pipeline
   public async Task<Task> GetTaskAsync(string id, CancellationToken ct)
   {
       return await _storage.GetByIdAsync(id, ct)
           ?? throw new NotFoundException("Task", id);
   }

   // ❌ Sync-over-async — deadlock risk
   var task = _storage.GetByIdAsync(id).Result;
   ```

2. **Always accept `CancellationToken`** on async methods.

3. **`ConfigureAwait(false)`** in library code only.

### Dependency Injection

1. **Constructor injection — no property or method injection:**
   ```csharp
   public class TaskService
   {
       private readonly ITaskStorage _storage;
       private readonly ILogger<TaskService> _logger;

       public TaskService(ITaskStorage storage, ILogger<TaskService> logger)
       {
           _storage = storage;
           _logger = logger;
       }
   }
   ```

2. **Register in DI container — never `new` a service:**
   ```csharp
   builder.Services.AddScoped<ITaskStorage, PostgresTaskStorage>();
   builder.Services.AddScoped<TaskService>();
   ```

### LINQ

1. **Prefer method syntax for complex queries, query syntax for joins:**
   ```csharp
   var active = tasks
       .Where(t => t.IsActive)
       .OrderByDescending(t => t.Priority)
       .Select(t => new TaskSummary(t.Id, t.Title));
   ```

2. **Never mutate collections during LINQ iteration.**

### Naming

1. **PascalCase** for classes, methods, properties, events, namespaces.
2. **camelCase** for parameters, local variables.
3. **`_camelCase`** for private fields (prefix underscore).
4. **`I` prefix** for interfaces: `ITaskStorage`.
5. **`Async` suffix** for async methods: `GetByIdAsync`.

### Testing

1. **xUnit + FluentAssertions:**
   ```csharp
   [Fact]
   public async Task GetTask_ReturnsTask_WhenExists()
   {
       var result = await _service.GetTaskAsync("task-1", CancellationToken.None);
       result.Should().NotBeNull();
       result.Title.Should().Be("Test Task");
   }
   ```

2. **`[Theory]` for parameterized tests:**
   ```csharp
   [Theory]
   [InlineData("low", 1)]
   [InlineData("medium", 5)]
   [InlineData("high", 10)]
   public void PriorityScore_MapsCorrectly(string priority, int expected)
   {
       Priority.Score(priority).Should().Be(expected);
   }
   ```

3. **NSubstitute or Moq for mocking.**

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `dotnet format` | Canonical formatting | `dotnet format` |
| Roslyn Analyzers | Compile-time analysis | Built-in |
| `SonarAnalyzer` | Comprehensive analysis | NuGet package |
| `dotnet-outdated` | Dependency freshness | `dotnet-outdated` |
| `dotnet list package --vulnerable` | CVE scanning | Built-in (.NET 8+) |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
