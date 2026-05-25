# PHP Performance Profiling

> **Applicability:** PHP web applications (Laravel, Symfony, WordPress), API backends, and CLI tools.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| Xdebug (profiler mode) | Cachegrind-compatible profile | `XDEBUG_MODE=profile php script.php` |
| Blackfire.io | Production-safe profiling | `blackfire run php script.php` |
| Tideways | Low-overhead production APM | Agent-based, always-on |
| SPX | Simple PHP profiler | `SPX_ENABLED=1 php script.php` |
| `memory_get_usage()` | Manual memory tracking | In-code measurement |
| Laravel Debugbar | Request profiling | `barryvdh/laravel-debugbar` package |
| Laravel Telescope | Request/query/job monitoring | `laravel/telescope` package |

---

## Optimization Patterns

### Pattern: OPcache Optimization

**Symptom:** Slow cold-start requests. `opcache.hit_rate` below 90%.

```ini
; php.ini — OPcache configuration for production
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0      ; Don't check file changes (deploy = restart)
opcache.interned_strings_buffer=16
opcache.jit_buffer_size=128M       ; PHP 8.0+ JIT
opcache.jit=1255                   ; Tracing JIT (most aggressive)
```

```bash
# Check OPcache status
php -r "print_r(opcache_get_status());"

# Preload framework files (PHP 7.4+)
# php.ini: opcache.preload=/path/to/preload.php
# preload.php — load frequently used classes
```

### Pattern: Eager Loading (Eloquent / Doctrine)

**Symptom:** Laravel Debugbar shows hundreds of queries. N+1 pattern.

```php
// ❌ N+1 — 1 query for tasks + N queries for users
$tasks = Task::all();
foreach ($tasks as $task) {
    echo $task->user->name;  // Query per task!
}

// ✅ Eager load — 2 queries total
$tasks = Task::with('user')->get();

// ✅ Nested eager loading
$tasks = Task::with(['user', 'comments.author'])->get();

// ✅ Prevent lazy loading in development (Laravel 10+)
// AppServiceProvider::boot()
Model::preventLazyLoading(!app()->isProduction());

// ✅ Chunked processing for large datasets
Task::with('user')->chunk(1000, function ($tasks) {
    foreach ($tasks as $task) {
        processTask($task);
    }
});
```

### Pattern: Query Optimization

**Symptom:** Slow database queries. High `DB::getQueryLog()` times.

```php
// ❌ Fetches all columns
$tasks = Task::all();

// ✅ Select only needed columns
$tasks = Task::select('id', 'title', 'status')->get();

// ❌ Hydrates Eloquent models for read-only display
$tasks = Task::where('status', 'active')->get();

// ✅ Use toBase() for read-only — skips model hydration
$tasks = Task::where('status', 'active')->toBase()->get();

// ✅ Raw query for complex aggregations
$stats = DB::select('
    SELECT status, COUNT(*) as count, AVG(duration) as avg_duration
    FROM tasks
    WHERE created_at > ?
    GROUP BY status
', [now()->subDays(30)]);
```

### Pattern: Caching Strategy

**Symptom:** Same expensive computation on every request. Database load scales with traffic.

```php
// ✅ Cache with TTL
$tasks = Cache::remember('user:' . $userId . ':tasks', 300, function () use ($userId) {
    return Task::where('user_id', $userId)
        ->with('tags')
        ->get();
});

// ✅ Cache tags for group invalidation (Redis/Memcached)
$tasks = Cache::tags(['tasks', 'user:' . $userId])
    ->remember('user:tasks:' . $userId, 300, fn() => Task::forUser($userId)->get());

// Invalidate on write
Cache::tags(['tasks'])->flush();

// ✅ Route caching for production
// php artisan route:cache
// php artisan config:cache
// php artisan view:cache
```

### Pattern: Queue Heavy Work

**Symptom:** Request timeout on email/PDF/image processing. Response time > 5s.

```php
// ❌ Synchronous — user waits for email to send
public function store(Request $request): JsonResponse
{
    $task = Task::create($request->validated());
    Mail::send(new TaskCreatedMail($task));  // 2-5 seconds!
    return response()->json($task, 201);
}

// ✅ Queue — user gets instant response
public function store(Request $request): JsonResponse
{
    $task = Task::create($request->validated());
    Mail::queue(new TaskCreatedMail($task));  // Milliseconds
    return response()->json($task, 201);
}
```

---

## Anti-Patterns

1. **Don't skip OPcache in production** — PHP recompiles every file without it.
2. **Don't lazy-load relationships in loops** — always eager-load with `::with()`.
3. **Don't `->get()` without limits on large tables** — use `->paginate()` or `->chunk()`.
4. **Don't process email/PDFs synchronously** — queue everything > 100ms.
5. **Don't use `serialize()`/`unserialize()`** for caching complex objects — use `json_encode/decode`.
6. **Don't skip `php artisan optimize`** in production deploys.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| PHP request bootstrap (no preload) | ~5-10ms | Autoloader, config, service container |
| PHP request bootstrap (with preload) | ~1-3ms | Preloaded classes skip compilation |
| OPcache hit | ~0.1ms | Cached bytecode lookup |
| Eloquent model hydration | ~0.05ms per model | Object creation + attribute casting |
| `toBase()` (stdClass) | ~0.01ms per row | Minimal object creation |
| Redis `GET` (local) | ~0.2ms | Network round trip |
| MySQL simple `SELECT` (local) | ~0.5ms | Query parsing + execution |
| Queue dispatch | ~1ms | Serialization + Redis/DB insert |

---

## Benchmarking

```php
// phpbench
use PhpBench\Benchmark\Metadata\Annotations\Iterations;
use PhpBench\Benchmark\Metadata\Annotations\Revs;

class TaskServiceBench
{
    #[Revs(1000)]
    #[Iterations(5)]
    public function benchCreateTask(): void
    {
        $service = new TaskService(new InMemoryRepository());
        $service->create('Test Task', Priority::HIGH);
    }
}

// Run: vendor/bin/phpbench run benchmarks/ --report=default
```

```bash
# Laravel: measure specific route
php artisan route:list --path=api/tasks
ab -n 1000 -c 10 http://localhost:8000/api/tasks  # Apache Bench
```

---

## Related
- PHP Idioms @.agents/skills/php-idioms/SKILL.md
- Laravel Idioms @.agents/skills/laravel-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
