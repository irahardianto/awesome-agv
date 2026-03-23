# Go Performance Profiling

## Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `go tool pprof` | CPU / heap / block / mutex profiles | `go tool pprof -text -cum -nodecount=30 profile.pb.gz` |
| `go test -bench` | Micro-benchmarks | `go test -bench=BenchmarkX -benchtime=3s -benchmem -count=3` |
| `go test -cpuprofile` | Capture CPU profile during benchmarks | `go test -bench=BenchmarkX -cpuprofile=cpu.prof` |
| `go test -memprofile` | Capture heap profile during benchmarks | `go test -bench=BenchmarkX -memprofile=mem.prof` |
| `go build -gcflags="-m"` | Escape analysis (what allocates on heap) | `go build -gcflags="-m" ./path/to/pkg 2>&1 \| grep "escapes to heap"` |
| `go test -trace` | Execution trace (goroutine scheduling) | `go test -bench=BenchmarkX -trace=trace.out` |
| `benchstat` | Statistical comparison of benchmarks | `benchstat old.txt new.txt` |

## Data Extraction Script

Use `scripts/go-pprof.sh` to extract profiles into agent-readable markdown.

```bash
# CPU profile from a .prof file
.agents/skills/perf-optimization/scripts/go-pprof.sh cpu path/to/cpu.prof

# Heap profile from a live endpoint
.agents/skills/perf-optimization/scripts/go-pprof.sh heap http://localhost:6060/debug/pprof/heap

# CPU profile from a benchmark (generates and analyzes in one step)
.agents/skills/perf-optimization/scripts/go-pprof.sh bench ./internal/platform/server/... BenchmarkRequireAuth
```

## Go-Specific Optimization Patterns

### Escape Analysis

Before optimizing allocations, run escape analysis to understand WHY values escape to heap:

```bash
go build -gcflags="-m" ./internal/platform/server/ 2>&1 | grep "escapes to heap"
```

Common escape reasons:
- Returning a pointer to a local variable
- Storing a value in an interface (boxing)
- Closure captures
- Slice/map growth beyond initial capacity

### `sync.Pool` for Hot-Path Allocations

**When to use:** The profiler shows a specific type allocated/freed thousands of times per second on the same hot path.

**When NOT to use:** Objects that are long-lived, vary wildly in size, or have cleanup requirements.

```go
var bufPool = sync.Pool{
    New: func() interface{} { return new(bytes.Buffer) },
}

func process() {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() { buf.Reset(); bufPool.Put(buf) }()
    // use buf...
}
```

### Pre-sized Slices and Maps

**Symptom:** `runtime.growslice` or `runtime.mapassign` in the profile — the runtime is repeatedly growing backing arrays.

```go
// ❌ Grows 3 times: cap 0 → 1 → 2 → 4
items := []Item{}
for _, raw := range data { items = append(items, parse(raw)) }

// ✅ One allocation
items := make([]Item, 0, len(data))
for _, raw := range data { items = append(items, parse(raw)) }
```

### `strings.Builder` Over `fmt.Sprintf` in Loops

**Symptom:** `fmt.Sprintf` or `runtime.convTstring` in allocation-heavy loops.

```go
var b strings.Builder
b.Grow(estimatedLen)
for _, part := range parts { b.WriteString(part) }
result := b.String()
```

### Benchmark Best Practices

```go
func BenchmarkX(b *testing.B) {
    // Setup OUTSIDE the loop — don't measure init cost
    fixture := buildFixture(b)

    b.ReportAllocs()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        result := doWork(fixture)
        // Prevent compiler from eliminating the call
        _ = result
    }
}
```

**Statistical validity:** Always run with `-count=5` minimum and compare with `benchstat`:

```bash
go test -bench=BenchmarkX -benchmem -count=5 > old.txt
# ... make changes ...
go test -bench=BenchmarkX -benchmem -count=5 > new.txt
benchstat old.txt new.txt
```

## Go-Specific Anti-Patterns

1. **Don't use `sync.Pool` for everything.** It's only effective for truly hot paths with uniform objects. Misuse adds complexity without measurable gain.
2. **Don't fight the GC.** Go's GC is tuned for latency. If throughput matters more, tune `GOGC` before rewriting code.
3. **Don't use `unsafe` for performance.** The compiler's escape analysis and inlining are usually sufficient. `unsafe` breaks memory safety guarantees.
4. **Don't ignore `-race` when benchmarking.** Always verify correctness with `-race` before measuring performance without it.

## Irreducible Floors in Go

These are performance costs you cannot eliminate — recognize them and stop:

| Function | What it is | Why it's irreducible |
|---|---|---|
| `p256MulInternal` | P-256 scalar multiplication (ECDSA) | Hardware-optimized assembly |
| `runtime.mallocgc` | Go memory allocator | Symptom, not cause — fix the caller |
| `runtime.gcBgMarkWorker` | GC mark phase | Proportional to allocation rate — fix allocs |
| `runtime.futex` / `runtime.usleep` | OS synchronization | Scheduling overhead |
| `syscall.Syscall` | Kernel calls (I/O) | Irreducible for actual I/O ops |
| `crypto/aes` | AES encryption | Hardware AES-NI, cannot improve |
