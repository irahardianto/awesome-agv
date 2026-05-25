# C# Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of C# code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `async void` (except event handlers) | Critical | `[ERR]` | Use `async Task` — `async void` swallows exceptions |
| Missing `await` on async call | Critical | `[ERR]` | Always `await` or explicitly handle the `Task` |
| `IDisposable` without `using` statement | Critical | `[RES]` | Wrap in `using` or `await using` for async |
| `catch (Exception) { }` (empty catch) | Critical | `[ERR]` | Handle, log, or re-throw |
| `catch (Exception ex) { throw ex; }` | Major | `[ERR]` | Use `throw;` (preserves stack trace) |
| `Console.WriteLine` in production code | Major | `[OBS]` | Use `ILogger<T>` with structured logging |
| Mutable DTO classes | Major | `[PAT]` | Use `record` types for DTOs |
| `string.Format` / concatenation in hot paths | Major | `[PAT]` | Use `string.Create` or `StringBuilder` |
| `Task.Result` / `Task.Wait()` (sync over async) | Critical | `[ERR]` | Use `await` — sync-over-async causes deadlocks |
| Service registration with `new` instead of DI | Major | `[TEST]` | Register in DI container, inject via constructor |
| `#pragma warning disable` without comment | Major | `[PAT]` | Fix the warning or document suppression rationale |
| Nullable reference type warnings suppressed | Major | `[ERR]` | Fix null checks — `<Nullable>enable</Nullable>` |
| `HttpClient` instantiated per request | Major | `[RES]` | Use `IHttpClientFactory` |
| `Thread.Sleep()` in async code | Critical | `[ERR]` | Use `await Task.Delay()` |

---

## Detection Commands

```bash
# async void (not event handlers)
grep -rn 'async void' --include='*.cs' | grep -v 'EventHandler\|event\|_Click\|_Changed'

# Missing await
grep -rn 'async ' --include='*.cs' -A10 | grep -v 'await\|return\|}\|{' | head -30

# IDisposable without using
grep -rn 'new.*Client\|new.*Connection\|new.*Stream' --include='*.cs' | grep -v 'using\|factory\|Factory'

# Empty catch
grep -rn 'catch' --include='*.cs' -A1 | grep -B1 '^\s*}'

# throw ex (loses stack trace)
grep -rn 'throw ex;' --include='*.cs'

# Console.WriteLine
grep -rn 'Console\.Write' --include='*.cs' | grep -v 'test\|Test\|Program\.cs'

# Task.Result / Task.Wait()
grep -rn '\.Result\b\|\.Wait()' --include='*.cs' | grep -v 'test\|Test\|//\|ValueTask'

# HttpClient new per request
grep -rn 'new HttpClient' --include='*.cs'

# Thread.Sleep in async
grep -rn 'Thread\.Sleep' --include='*.cs'

# pragma disable without comment
grep -rn '#pragma warning disable' --include='*.cs' | grep -v '//'
```

---

## Correct Patterns (Reference)

### Async/Await

```csharp
// ❌ async void — exception disappears
async void ProcessTask(string taskId) {
    await repository.SaveAsync(task);
}

// ✅ async Task — exception is propagated
async Task ProcessTaskAsync(string taskId) {
    await repository.SaveAsync(task);
}

// ❌ Sync-over-async — deadlock risk
var result = GetDataAsync().Result;

// ✅ Await properly
var result = await GetDataAsync();
```

### Resource Disposal

```csharp
// ❌ IDisposable not disposed
var connection = new SqlConnection(connectionString);
var result = connection.Query<Task>(sql);
// connection.Dispose() never called if exception

// ✅ Using statement
await using var connection = new SqlConnection(connectionString);
var result = await connection.QueryAsync<Task>(sql);
```

### Error Handling

```csharp
// ❌ Stack trace lost
catch (Exception ex) {
    logger.LogError(ex.Message);
    throw ex;  // Stack trace reset!
}

// ✅ Stack trace preserved
catch (Exception ex) {
    logger.LogError(ex, "Task processing failed for {TaskId}", taskId);
    throw;  // Preserves original stack trace
}
```

### Modern C#

```csharp
// ❌ Mutable DTO class
public class TaskResponse {
    public string Id { get; set; }
    public string Title { get; set; }
}

// ✅ Record (immutable, value equality)
public record TaskResponse(string Id, string Title, Priority Priority);
```

---

## References
- C# Idioms @.agents/skills/csharp-idioms/SKILL.md
- .NET Idioms @.agents/skills/dotnet-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
