# C# / .NET Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover C#/.NET-specific symptoms, diagnostic tooling, and common ASP.NET errors.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `NullReferenceException` | Enable nullable reference types, trace the null → add guard clause |
| `ObjectDisposedException` | Lifetime mismatch — check DI scope (`Scoped` vs `Singleton`) |
| `TaskCanceledException` / `OperationCanceledException` | Check `CancellationToken` propagation and HTTP client timeouts |
| Deadlock (app hangs, CPU idle) | Check for `Task.Result` or `.Wait()` — sync-over-async deadlock |
| `OutOfMemoryException` | dotnet-dump → analyze with `dotnet-gcdump` → find large object graph |
| `HttpRequestException` | Check `IHttpClientFactory` usage, DNS, and certificate issues |
| Slow startup | `dotnet-trace` → check DI container build time and EF model compilation |
| `InvalidOperationException: Sequence contains no elements` | Missing null check on LINQ `.First()` → use `.FirstOrDefault()` |
| EF Core N+1 queries | Check missing `.Include()` → enable query logging |
| Test flakiness | Shared `DbContext` or static state → use fresh DI scope per test |

---

## Diagnostic Tools

### .NET CLI Tools

```bash
# Install diagnostic tools
dotnet tool install -g dotnet-dump
dotnet tool install -g dotnet-trace
dotnet tool install -g dotnet-counters
dotnet tool install -g dotnet-gcdump

# Live performance counters
dotnet-counters monitor --process-id <pid> \
  --counters System.Runtime,Microsoft.AspNetCore.Hosting

# Collect trace for analysis
dotnet-trace collect --process-id <pid> --duration 00:00:30

# Capture memory dump
dotnet-dump collect --process-id <pid> --output dump.dmp

# Analyze dump
dotnet-dump analyze dump.dmp
> dumpheap -stat          # Heap statistics
> dumpheap -type MyClass  # Find specific type instances
> gcroot 0x7f...          # Find what's keeping object alive
```

### ASP.NET Diagnostics

```bash
# Enable detailed error pages (Development only)
ASPNETCORE_ENVIRONMENT=Development dotnet run

# EF Core query logging
# In appsettings.Development.json:
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}

# Health check endpoint
curl http://localhost:5000/health
```

### Visual Studio / Rider Debugging

```
# Conditional breakpoint — only break when condition is true
# Right-click breakpoint → Conditions → e.g., "userId == 'test-123'"

# Exception settings — break on first chance exceptions
# Debug → Windows → Exception Settings → check specific exception types

# Parallel Stacks window — visualize all threads
# Debug → Windows → Parallel Stacks
```

---

## Common C# Bugs and Fixes

### Sync-Over-Async Deadlock

**Symptom:** Application hangs on `Task.Result` or `.Wait()`. No exception, no timeout — just frozen.

**Diagnosis:**
```bash
# Thread dump — look for threads blocked on Task.Result
dotnet-dump collect --process-id <pid>
dotnet-dump analyze dump.dmp
> clrthreads
> threads           # Find blocked threads
> setthread <id>
> clrstack           # See what's waiting
```

**Root cause:** `.Result` or `.Wait()` blocks the synchronization context. The async continuation can't execute because the context is blocked → deadlock.

```csharp
// ❌ DEADLOCK — blocks synchronization context
public ActionResult GetTask(string id)
{
    var task = taskService.GetTaskAsync(id).Result;  // DEADLOCK
    return Ok(task);
}

// ✅ Async all the way down
public async Task<ActionResult> GetTask(string id)
{
    var task = await taskService.GetTaskAsync(id);
    return Ok(task);
}
```

### IDisposable / Lifetime Mismatch

**Symptom:** `ObjectDisposedException` — "Cannot access a disposed object."

**Diagnosis checklist:**
1. Is a `Scoped` service injected into a `Singleton`? (Scoped dies with request, singleton lives forever.)
2. Is a `DbContext` used after the request scope ends?
3. Is an `HttpClient` being disposed manually? (Use `IHttpClientFactory` instead.)

```csharp
// ❌ Scoped service captured by singleton — disposed after first request
services.AddSingleton<BackgroundProcessor>();  // Lives forever
services.AddScoped<MyDbContext>();             // Dies per request

public class BackgroundProcessor {
    private readonly MyDbContext _db;  // Will be disposed!
    public BackgroundProcessor(MyDbContext db) { _db = db; }
}

// ✅ Use IServiceScopeFactory for background work
public class BackgroundProcessor {
    private readonly IServiceScopeFactory _scopeFactory;

    public async Task ProcessAsync() {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<MyDbContext>();
        // db is fresh, scoped to this operation
    }
}
```

### EF Core N+1 Queries

**Symptom:** Response time scales linearly with data size. Logging shows hundreds of SELECT queries.

**Diagnosis:**
```csharp
// Enable query logging
optionsBuilder
    .LogTo(Console.WriteLine, LogLevel.Information)
    .EnableSensitiveDataLogging();  // Development only!
```

**Fix:**
```csharp
// ❌ N+1 — each task.User triggers a separate query
var tasks = await context.Tasks.ToListAsync();
foreach (var task in tasks)
    Console.WriteLine(task.User.Name);  // N queries!

// ✅ Eager loading
var tasks = await context.Tasks
    .Include(t => t.User)
    .ToListAsync();
```

### CancellationToken Not Propagated

**Symptom:** Operations continue running after client disconnects. Resources wasted on abandoned requests.

```csharp
// ❌ Token not passed — operation runs to completion even if client disconnects
[HttpGet("{id}")]
public async Task<ActionResult> GetReport(string id)
{
    var report = await reportService.GenerateAsync(id);  // No cancellation
    return Ok(report);
}

// ✅ Propagate cancellation token
[HttpGet("{id}")]
public async Task<ActionResult> GetReport(string id, CancellationToken ct)
{
    var report = await reportService.GenerateAsync(id, ct);
    return Ok(report);
}
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Thread dump shows `.Result` or `.Wait()` in stack | +70% confidence in sync-over-async deadlock |
| `dotnet-counters` shows GC Gen2 collections increasing | +40% confidence in memory pressure |
| `ObjectDisposedException` on `DbContext` | +60% confidence in scope lifetime mismatch |
| N+1 visible in EF Core query log | +80% confidence — fix with `.Include()` |
| Error only in ASP.NET, not in console app | Suspect synchronization context issue |

---

## Related
- C# Idioms @.agents/skills/csharp-idioms/SKILL.md
- .NET Idioms @.agents/skills/dotnet-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
