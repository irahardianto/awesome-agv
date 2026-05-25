# PHP Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover PHP-specific symptoms, Xdebug/profiler tooling, and common framework errors.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| White page (blank screen) | `display_errors=On` or check `error_log` → PHP fatal error hidden |
| `Allowed memory size exhausted` | Find the loop/recursion → `memory_get_usage()` at checkpoints |
| `Maximum execution time exceeded` | Infinite loop or slow external call → add `max_execution_time` guard |
| `Class not found` / `Interface not found` | Check autoloader (`composer dump-autoload`), namespace, and file naming |
| `SQLSTATE` errors | Check PDO error mode, connection params, and SQL syntax |
| `Undefined index` / `Undefined array key` | Missing array key → use `??` null coalescing or `array_key_exists()` |
| `Call to undefined method` | Wrong class, missing use statement, or interface not implemented |
| Session not persisting | Check `session_start()`, cookie settings, and session handler config |
| Composer dependency conflicts | `composer why-not package/name version` → find conflicting constraints |
| Laravel `500 Internal Server Error` | Check `storage/logs/laravel.log` → actual exception is logged there |

---

## Diagnostic Tools

### Xdebug

```ini
; php.ini — Xdebug 3 configuration
[xdebug]
xdebug.mode=debug,develop,profile
xdebug.start_with_request=trigger
xdebug.client_host=127.0.0.1
xdebug.client_port=9003
xdebug.log=/tmp/xdebug.log

; Trigger debugging with:
; XDEBUG_TRIGGER=1 php script.php
; or browser extension (Xdebug Helper)
```

```bash
# Check Xdebug is installed
php -m | grep xdebug
php -i | grep xdebug.mode

# Profile a script
XDEBUG_MODE=profile php script.php
# Output: cachegrind.out.* → open with KCacheGrind/QCacheGrind
```

### Built-in Debugging

```php
// Quick debugging (remove before commit!)
var_dump($variable);    // Type + value
print_r($array);        // Readable array/object output
debug_print_backtrace(); // Call stack

// Memory debugging
echo memory_get_usage(true);      // Current memory (bytes)
echo memory_get_peak_usage(true); // Peak memory

// Execution time
$start = microtime(true);
// ... code ...
$elapsed = microtime(true) - $start;
error_log("Operation took {$elapsed}s");
```

### Error Logging

```php
// Ensure errors are logged, not displayed in production
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', '/var/log/php/error.log');
error_reporting(E_ALL);

// Custom error handler for structured logging
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline) {
    $logger->error('php_error', [
        'errno' => $errno,
        'message' => $errstr,
        'file' => $errfile,
        'line' => $errline,
    ]);
    return false; // Let PHP handle it too
});
```

---

## Common PHP Bugs and Fixes

### White Page of Death

**Symptom:** Blank white page. No error output.

**Diagnosis:**
```bash
# Check error log
tail -20 /var/log/php/error.log
# or for Laravel:
tail -20 storage/logs/laravel.log

# Enable error display temporarily
php -d display_errors=1 -d error_reporting=E_ALL script.php
```

**Common causes:**
1. **Fatal error** with `display_errors=Off` (production default).
2. **Syntax error** in included file.
3. **Missing extension** (e.g., `ext-json`, `ext-mbstring`).
4. **Memory exhaustion** — no output when memory runs out.

### Autoloading Failures

**Symptom:** `Class 'App\Service\TaskService' not found` despite file existing.

**Diagnosis:**
```bash
# Regenerate autoloader
composer dump-autoload -o  # -o for optimized (classmap)

# Check PSR-4 mapping
grep -A5 'psr-4' composer.json

# Verify file naming matches class name (case-sensitive!)
find src/ -name 'TaskService.php'  # Must match exactly
```

**Common causes:**
1. **File name doesn't match class name** (case-sensitive on Linux).
2. **Namespace doesn't match directory structure** per PSR-4.
3. **Missing `composer dump-autoload`** after adding new class.
4. **Cached autoloader** in production — clear cache.

### N+1 Queries (Laravel/Doctrine)

**Symptom:** Page load time grows linearly with data. Debug bar shows hundreds of queries.

```php
// ❌ N+1 — each iteration fires a query
$tasks = Task::all();
foreach ($tasks as $task) {
    echo $task->user->name;  // Query per task!
}

// ✅ Eager load (Laravel)
$tasks = Task::with('user')->get();

// ✅ Detect N+1 in development (Laravel)
// In AppServiceProvider::boot()
Model::preventLazyLoading(!app()->isProduction());
```

### Session / Authentication Issues

**Symptom:** User keeps getting logged out. Session data disappears between requests.

**Diagnosis checklist:**
1. Is `session_start()` called before any output?
2. Are cookies being set? (Check browser DevTools → Application → Cookies.)
3. Is `session.save_path` writable?
4. Is `session.gc_maxlifetime` too short?
5. Load balancer without sticky sessions? → Use Redis/database session driver.

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Error log shows specific fatal error | +70% confidence in root cause |
| `composer dump-autoload` fixes class not found | +90% confidence — autoloader was stale |
| Debug bar shows N+1 pattern | +80% confidence — add eager loading |
| Xdebug profiler shows specific function dominating | +60% confidence in bottleneck |
| Error only on Linux, not macOS | Suspect case-sensitivity in file/class names |

---

## Related
- PHP Idioms @.agents/skills/php-idioms/SKILL.md
- Laravel Idioms @.agents/skills/laravel-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
