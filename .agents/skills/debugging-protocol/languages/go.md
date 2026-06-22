# Go Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Go-specific symptoms and diagnostic tooling.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| Goroutine leak / OOM | `pprof` goroutine profile → look for stuck goroutines |
| Race condition / data corruption | Run with `-race` flag → reproduce the failing test |
| Context deadline exceeded | Check context propagation chain → is parent cancelled? |
| Connection pool exhaustion | Check `sql.DB` stats → `db.Stats().InUse` vs `MaxOpenConns` |
| Panic / nil dereference | Read stack trace top-down → first non-stdlib frame is the bug |
| High CPU / slow response | CPU pprof → flamegraph → find widest frame |
| High memory / GC pressure | Heap pprof → `alloc_objects` → find top allocator |
| Test flakiness | `-race` + `-count=100` → reproduce intermittent failure |
| Import cycle | `go vet ./...` error → visualize with `gomod graph` |
| "connection refused" in tests | Check if Testcontainer is ready → use health check wait strategy |

---

## Diagnostic Tools

### Delve Debugger

```bash
# Attach to a running process
dlv attach $(pgrep myapp)

# Debug a test
dlv test ./internal/features/task/ -- -run TestCreateTask

# Debug a binary
dlv exec ./bin/api -- --port 8080

# Common commands inside Delve:
# break main.go:42       Set breakpoint
# continue               Run until breakpoint
# next                   Step over
# step                   Step into
# print varName          Inspect variable
# goroutines             List all goroutines
# goroutine 5            Switch to goroutine 5
# stack                  Print stack trace
```

### Race Detector

```bash
# Run tests with race detection (mandatory in CI)
go test -race ./...

# Run binary with race detection
go build -race -o myapp ./cmd/api
./myapp

# Race detector output format:
# ==================
# WARNING: DATA RACE
# Write at 0x00c000... by goroutine 7:
#   myapp/internal/features/task.(*Service).UpdateTask()
#       /path/to/service.go:42 +0x...
# Previous read at 0x00c000... by goroutine 6:
#   myapp/internal/features/task.(*Service).GetTask()
#       /path/to/service.go:28 +0x...
```

### pprof Profiling

```bash
# Expose pprof endpoint (add to main.go in development)
import _ "net/http/pprof"
go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }()

# Capture profiles
go tool pprof http://localhost:6060/debug/pprof/goroutine   # Goroutine stacks
go tool pprof http://localhost:6060/debug/pprof/heap         # Heap allocations
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30  # CPU

# Analyze in browser
go tool pprof -http=:8081 profile.pb.gz

# Text output (agent-readable)
go tool pprof -top -cum profile.pb.gz
```

---

## Common Go Bugs and Fixes

### Goroutine Leak

**Symptom:** Memory grows over time, `runtime.NumGoroutine()` increases monotonically.

**Diagnosis:**
```bash
# Capture goroutine profile
curl http://localhost:6060/debug/pprof/goroutine?debug=2 > goroutines.txt
# Look for goroutines stuck in the same location
grep -c "goroutine" goroutines.txt  # Count total
sort goroutines.txt | uniq -c | sort -rn | head -20  # Find duplicates
```

**Common causes:**
1. **Channel without consumer:** goroutine sends to a channel nobody reads.
2. **Missing context cancellation:** goroutine loops forever without checking `ctx.Done()`.
3. **HTTP response body not closed:** connection stays alive.

**Fix pattern:**
```go
// ❌ Goroutine leak — no way to stop
go func() {
    for {
        result := doWork()
        ch <- result
    }
}()

// ✅ Bounded by context
go func() {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            result := doWork()
            select {
            case ch <- result:
            case <-ctx.Done():
                return
            }
        }
    }
}()
```

### Context Deadline Exceeded

**Symptom:** `context deadline exceeded` error in logs, requests timeout.

**Diagnosis checklist:**
1. What is the timeout set to? (`context.WithTimeout` / `context.WithDeadline`)
2. Is the context passed to ALL downstream calls? (DB query, HTTP client, etc.)
3. Is a downstream service slow? (Check its latency metrics)
4. Is there a missing timeout on a downstream call? (Infinite wait)

**Common cause — context not propagated:**
```go
// ❌ Parent context cancelled, but HTTP call uses background context
func (s *Service) FetchExternal(ctx context.Context) (*Data, error) {
    req, _ := http.NewRequest("GET", url, nil)  // No context!
    resp, err := s.client.Do(req)               // Ignores parent timeout
    // ...
}

// ✅ Propagate context
func (s *Service) FetchExternal(ctx context.Context) (*Data, error) {
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    resp, err := s.client.Do(req)
    // ...
}
```

### Connection Pool Exhaustion

**Symptom:** `sql: database/sql: connection pool exhausted` or operations hang waiting for connections.

**Diagnosis:**
```go
// Add to health check or metrics endpoint
stats := db.Stats()
log.Printf("DB pool: open=%d inUse=%d idle=%d waitCount=%d waitDuration=%v",
    stats.OpenConnections, stats.InUse, stats.Idle,
    stats.WaitCount, stats.WaitDuration)
```

**Common causes:**
1. Missing `rows.Close()` — connection never returned to pool.
2. Long-running transactions holding connections.
3. `MaxOpenConns` too low for concurrency level.
4. Missing `context.WithTimeout` on queries — stuck query holds connection forever.

**Fix:**
```go
// ✅ Always close rows with error-checked defer
rows, err := db.QueryContext(ctx, query)
if err != nil { return err }
defer func() {
    if err := rows.Close(); err != nil {
        slog.Warn("failed to close rows", "error", err)
    }
}()

// ✅ Set pool limits
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(1 * time.Minute)
```

### Nil Pointer / Interface Dereference

**Symptom:** `runtime error: invalid memory address or nil pointer dereference` with stack trace.

**Diagnosis:** Read the stack trace — the line number points directly to the nil access.

**Common causes:**
1. Unchecked error return — using the value when `err != nil`.
2. Nil interface value — interface is non-nil but its underlying value is nil.
3. Map access on nil map.

```go
// ❌ Using result without checking error
user, err := store.GetUser(ctx, id)
return user.Name  // Panics if err != nil and user is nil

// ✅ Check error first
user, err := store.GetUser(ctx, id)
if err != nil {
    return "", fmt.Errorf("getting user: %w", err)
}
return user.Name

// ❌ Nil interface trap
type Storage interface { Get(id string) (*Task, error) }
var s Storage  // s is nil!
s.Get("123")   // Panics

// ✅ Check interface is not nil
if s == nil {
    return nil, errors.New("storage not initialized")
}
```

### Test Flakiness

**Diagnosis workflow:**
```bash
# Reproduce intermittent failures
go test -race -count=100 -failfast ./internal/features/task/...

# If race detector catches it — fix the race
# If timeout — check for goroutine leaks or missing context propagation
# If order-dependent — check for shared mutable state between tests
```

**Common causes:**
1. **Shared state between tests** — use `t.Parallel()` carefully, isolate state.
2. **Time-dependent logic** — inject a clock interface, don't use `time.Now()` directly.
3. **Port conflicts** — use `net.Listen("tcp", ":0")` for random port assignment.
4. **Missing Testcontainer readiness** — use `wait.ForHealthCheck()` strategy.

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| `-race` flag reproduces the issue | +40% confidence in race condition |
| pprof shows goroutines stuck at same line | +50% confidence in goroutine leak |
| `db.Stats().WaitCount > 0` | +60% confidence in pool exhaustion |
| Error only on CI, not locally | Suspect timing, port, or env differences |
| Error after refactor, not before | Narrow to changed code — diff analysis |

---

## Related
- Go Idioms and Patterns @.agents/skills/go-idioms/SKILL.md
- Performance Optimization (Go) @perf-optimization/languages/go.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
