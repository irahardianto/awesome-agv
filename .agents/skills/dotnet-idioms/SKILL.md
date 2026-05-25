---
paths:
  - "**/*.csproj"
  - "**/Program.cs"
  - "**/appsettings.json"
---

## .NET Idioms and Patterns

.NET 8+ rewards minimal APIs, DI, and async-first design. Idiomatic .NET = clean, performant, cloud-native.

> Scope: .NET framework patterns. For C#: `@.agents/skills/csharp-idioms/SKILL.md`.

### Minimal APIs

1. **Minimal APIs for simple endpoints:**
   ```csharp
   app.MapGet("/api/tasks/{id}", async (string id, ITaskService service) =>
       await service.GetByIdAsync(id) is Task task
           ? Results.Ok(task)
           : Results.NotFound());

   app.MapPost("/api/tasks", async (CreateTaskRequest request, ITaskService service) =>
   {
       var task = await service.CreateAsync(request);
       return Results.Created($"/api/tasks/{task.Id}", task);
   });
   ```

2. **Controllers for complex endpoints** with filters, model binding, etc.

### Entity Framework Core

1. **DbContext per request** (scoped lifetime).
2. **Migrations via CLI:**
   ```bash
   dotnet ef migrations add AddTaskPriority
   dotnet ef database update
   ```
3. **`AsNoTracking()`** for read-only queries.
4. **Compiled queries** for hot paths.

### Configuration

1. **`IOptions<T>`** pattern for strongly-typed config:
   ```csharp
   builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
   ```

2. **User secrets** for local development, Key Vault for production.

### Middleware

1. **Custom middleware** for cross-cutting concerns (logging, correlation IDs).
2. **`UseExceptionHandler`** for global error handling.

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **xUnit + FluentAssertions:**
   ```csharp
   [Fact]
   public async Task GetTask_ReturnsOk_WhenExists()
   {
       var client = _factory.CreateClient();
       var response = await client.GetAsync("/api/tasks/1");
       response.StatusCode.Should().Be(HttpStatusCode.OK);
   }
   ```

2. **`WebApplicationFactory<T>`** for integration tests.
3. **Respawn** for database cleanup.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `dotnet format` | Formatting | `dotnet format` |
| Roslyn analyzers | Analysis | Built-in |
| `dotnet list package --vulnerable` | CVE scanning | Built-in |

### Related
- C# Idioms @.agents/skills/csharp-idioms/SKILL.md
- API Design Principles @.agents/rules/api-design-principles.md
- Database Design Principles @.agents/rules/database-design-principles.md
