# C# / .NET Performance Profiling

> **Applicability:** ASP.NET Core services, .NET background workers, and any .NET runtime application.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `dotnet-trace` | Collect runtime traces | `dotnet-trace collect --process-id <pid> --duration 00:00:30` |
| `dotnet-counters` | Live performance counters | `dotnet-counters monitor --process-id <pid>` |
| `dotnet-dump` | Heap dump + analysis | `dotnet-dump collect --process-id <pid>` |
| `dotnet-gcdump` | GC heap snapshot | `dotnet-gcdump collect --process-id <pid>` |
| BenchmarkDotNet | Microbenchmarking | `dotnet run -c Release --project Benchmarks` |
| PerfView | Windows-specific ETW tracing | `PerfView.exe /GCCollectOnly /NoGui collect` |
| Speedscope | Flamegraph visualization | Upload `.nettrace` file to speedscope.app |
| Rider / VS Profiler | IDE-integrated profiling | Built-in |

---

## Optimization Patterns

### Pattern: Object Pooling with `ObjectPool<T>`

**Symptom:** `dotnet-counters` shows high `gc-heap-size` and frequent Gen0/Gen1 collections. Allocation-heavy code paths.

```csharp
// ❌ New StringBuilder per operation (high allocation)
public string FormatReport(IEnumerable<Task> tasks)
{
    var sb = new StringBuilder();
    foreach (var task in tasks)
        sb.AppendLine($"{task.Id}: {task.Title}");
    return sb.ToString();
}

// ✅ Pooled StringBuilder
private static readonly ObjectPool<StringBuilder> Pool =
    new DefaultObjectPoolProvider().CreateStringBuilderPool();

public string FormatReport(IEnumerable<Task> tasks)
{
    var sb = Pool.Get();
    try
    {
        foreach (var task in tasks)
            sb.AppendLine($"{task.Id}: {task.Title}");
        return sb.ToString();
    }
    finally
    {
        Pool.Return(sb);
    }
}
```

### Pattern: Span<T> and Memory<T> for Zero-Copy

**Symptom:** High allocation from string/array slicing. Parsing operations creating many substrings.

```csharp
// ❌ Substring allocates new string
string ParseHeader(string line)
{
    int colonIndex = line.IndexOf(':');
    return line.Substring(0, colonIndex);  // New string allocation
}

// ✅ Span — zero allocation slice
ReadOnlySpan<char> ParseHeader(ReadOnlySpan<char> line)
{
    int colonIndex = line.IndexOf(':');
    return line[..colonIndex];  // No allocation — just a view
}
```

### Pattern: Response Caching and Output Caching

**Symptom:** Same API response computed repeatedly. Database hit on every request for rarely-changing data.

```csharp
// ✅ Output caching (ASP.NET 7+)
app.MapGet("/api/tasks", [OutputCache(Duration = 60)] async (TaskService service) =>
{
    return await service.GetAllAsync();
});

// ✅ IMemoryCache for service-level caching
public class TaskService
{
    private readonly IMemoryCache _cache;

    public async Task<List<Task>> GetAllAsync()
    {
        return await _cache.GetOrCreateAsync("all-tasks", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await _repository.GetAllAsync();
        });
    }
}
```

### Pattern: Async Streaming

**Symptom:** Large responses buffer entirely in memory before sending. High memory per concurrent request.

```csharp
// ❌ Loads all records into memory
[HttpGet("tasks")]
public async Task<ActionResult<List<Task>>> GetTasks()
{
    var tasks = await context.Tasks.ToListAsync();  // All in memory
    return Ok(tasks);
}

// ✅ IAsyncEnumerable — streams response
[HttpGet("tasks")]
public async IAsyncEnumerable<Task> GetTasks(
    [EnumeratorCancellation] CancellationToken ct)
{
    await foreach (var task in context.Tasks.AsAsyncEnumerable().WithCancellation(ct))
    {
        yield return task;  // Streamed, constant memory
    }
}
```

### Pattern: EF Core Query Optimization

**Symptom:** Slow queries, excessive database round trips.

```csharp
// ❌ Tracking queries when read-only (overhead)
var tasks = await context.Tasks.ToListAsync();

// ✅ No-tracking for read-only queries
var tasks = await context.Tasks
    .AsNoTracking()
    .Where(t => t.Status == Status.Active)
    .ToListAsync();

// ✅ Compiled queries for hot paths
private static readonly Func<AppDbContext, string, Task<Task?>> GetByIdQuery =
    EF.CompileAsyncQuery((AppDbContext ctx, string id) =>
        ctx.Tasks.FirstOrDefault(t => t.Id == id));

public Task<Task?> GetByIdAsync(string id) => GetByIdQuery(_context, id);

// ✅ Projection — fetch only needed columns
var titles = await context.Tasks
    .Where(t => t.Status == Status.Active)
    .Select(t => new TaskSummary(t.Id, t.Title))
    .ToListAsync();
```

---

## Anti-Patterns

1. **Don't use `Task.Result` or `.Wait()`** — sync-over-async causes deadlocks and thread starvation.
2. **Don't allocate in hot loops** — use `Span<T>`, `stackalloc`, or `ArrayPool<T>`.
3. **Don't skip `AsNoTracking()` for read-only queries** — EF change tracking adds ~30% overhead.
4. **Don't return `Task<List<T>>` for large datasets** — use `IAsyncEnumerable<T>` for streaming.
5. **Don't ignore `CancellationToken`** — wasted work on abandoned requests.
6. **Don't use reflection in hot paths** — use source generators or compiled expressions.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| .NET JIT (first call) | ~1-5ms per method | Tier-0 compilation, then re-JITs to optimized |
| GC Gen0 collection | ~1ms | Generational GC pause |
| GC Gen2 / Full | 10-100ms | Depends on heap size and live objects |
| `async`/`await` overhead | ~50ns per continuation | State machine allocation |
| `HttpClient` connection reuse | First request ~5ms | TLS handshake on new connection |
| EF Core model compilation | First query ~100ms | Model metadata compilation |
| Kestrel request parsing | ~10μs | HTTP parsing overhead |

---

## Benchmarking (BenchmarkDotNet)

```csharp
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net80)]
public class TaskServiceBenchmarks
{
    [Benchmark(Baseline = true)]
    public Task CreateTask_Standard() =>
        _service.CreateAsync(new CreateTaskRequest("title", Priority.High));

    [Benchmark]
    public Task CreateTask_Pooled() =>
        _pooledService.CreateAsync(new CreateTaskRequest("title", Priority.High));
}

// Run: dotnet run -c Release --project Benchmarks
// Output includes: Mean, StdDev, Allocated memory, Gen0/Gen1/Gen2 collections
```

---

## Related
- C# Idioms @.agents/skills/csharp-idioms/SKILL.md
- .NET Idioms @.agents/skills/dotnet-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
