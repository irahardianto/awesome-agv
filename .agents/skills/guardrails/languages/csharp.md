# C# Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is C#.

---

## Async/Await

- [ ] **No `async void`** except event handlers — always `async Task`
- [ ] **All async calls are `await`-ed** — no fire-and-forget without explicit handling
- [ ] **No `Task.Result` or `Task.Wait()`** — causes deadlocks, use `await`
- [ ] **`ConfigureAwait(false)`** in library code (not in ASP.NET controllers)
- [ ] **`CancellationToken` propagated** through all async chains

### Correct Patterns

```csharp
// ✅ Cancellation propagation
public async Task<Task> GetTaskAsync(string id, CancellationToken ct = default)
{
    return await repository.FindByIdAsync(id, ct);
}
```

---

## Resource Management

- [ ] **`using` / `await using`** for all `IDisposable` / `IAsyncDisposable` types
- [ ] **`IHttpClientFactory`** — never `new HttpClient()` directly
- [ ] **Database connections** scoped to operation, not held long-term
- [ ] **`IDisposable` implemented** when class wraps unmanaged resources

---

## Null Safety

- [ ] **`<Nullable>enable</Nullable>`** in project file
- [ ] **No `!` (null-forgiving) operators** without safety comment
- [ ] **Pattern matching** for null checks (`is not null`, `is { } value`)
- [ ] **`required` modifier** on non-nullable properties (C# 11+)

---

## Error Handling

- [ ] **No empty `catch` blocks** — handle, log, or re-throw
- [ ] **`throw;` not `throw ex;`** — preserves stack trace
- [ ] **Custom exceptions** inherit from a base domain exception
- [ ] **Structured logging** in catch blocks — `logger.LogError(ex, "msg {Param}", param)`

---

## Dependency Injection

- [ ] **Constructor injection only** — no service locator pattern
- [ ] **Dependencies are `readonly`** — set once in constructor
- [ ] **Interfaces for I/O dependencies** — repositories, HTTP clients, caches
- [ ] **Correct lifetime scoping** — `Scoped` for request-level, `Singleton` for app-level, `Transient` for stateless

---

## Modern C#

- [ ] **`record` types** for DTOs and value objects
- [ ] **`init` or `required`** properties instead of mutable setters
- [ ] **Pattern matching** in `switch` expressions
- [ ] **Top-level statements** for simple programs (ASP.NET minimal APIs)
- [ ] **`global using`** for commonly imported namespaces

---

## Observability

- [ ] **`ILogger<T>`** — no `Console.WriteLine`
- [ ] **Structured log parameters** — `logger.LogInfo("Task {TaskId} created", id)`, not string interpolation
- [ ] **High-performance logging** — `LoggerMessage.Define` for hot paths

---

## Static Analysis

- [ ] `dotnet build --warnaserror` passes with zero warnings
- [ ] Roslyn analyzers / StyleCop pass
- [ ] No `#pragma warning disable` without rationale comment

---

## References
- C# Idioms @.agents/skills/csharp-idioms/SKILL.md
- .NET Idioms @.agents/skills/dotnet-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
