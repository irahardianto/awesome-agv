# Rust Performance Profiling

## Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `cargo-flamegraph` | CPU flamegraph (wraps `perf` / `dtrace`) | `cargo flamegraph --bench bench_name` |
| `criterion` | Statistical micro-benchmarks | `cargo bench` (with criterion dependency) |
| `perf` (Linux) | System-level CPU profiling | `perf record --call-graph dwarf target/release/app` |
| `Instruments` (macOS) | CPU + memory + I/O profiling | Xcode → Product → Profile |
| `dhat` | Heap profiling (DHAT viewer) | `cargo run --features dhat-heap` (requires `dhat` crate) |
| `heaptrack` (Linux) | Heap allocation tracking | `heaptrack target/release/app` |
| `cargo-bloat` | Binary size analysis | `cargo bloat --release --crates` |
| `cargo-llvm-lines` | Generic/monomorphization bloat | `cargo llvm-lines` |
| `cargo-asm` | View generated assembly | `cargo asm module::function` |
| `tokio-console` | Async task inspector (tokio) | `tokio-console` (requires `console-subscriber` crate) |
| `tracing` + `tracing-flame` | Async-aware flamegraphs | Produces folded stacks for inferno |

## Data Extraction

### cargo-flamegraph (Recommended — Simplest)

```bash
# CPU flamegraph from a benchmark
cargo flamegraph --bench bench_name -- --bench

# CPU flamegraph from a binary
cargo flamegraph --bin myapp -- --arg1 value1

# With specific frequency (higher = more detail, more overhead)
cargo flamegraph --freq 999 --bench bench_name

# Output to specific file
cargo flamegraph --output profile.svg --bench bench_name
```

### perf (Linux — Most Detail)

```bash
# Record with debug info
perf record --call-graph dwarf -F 99 target/release/app

# Generate flamegraph
perf script | inferno-collapse-perf | inferno-flamegraph > profile.svg

# Report (agent-readable text)
perf report --stdio --no-children | head -50
```

### dhat (Heap Profiling)

```rust
// In main.rs or bench (behind a feature flag)
#[cfg(feature = "dhat-heap")]
#[global_allocator]
static ALLOC: dhat::Alloc = dhat::Alloc;

fn main() {
    #[cfg(feature = "dhat-heap")]
    let _profiler = dhat::Profiler::new_heap();

    // ... application code ...
}
```

```bash
# Run with heap profiling
cargo run --release --features dhat-heap
# Opens DHAT viewer with dhat-heap.json
```

---

## Rust-Specific Optimization Patterns

### Pattern: Arena Allocation

**Symptom:** Flamegraph shows time in `alloc::alloc::Global::alloc` — many small, short-lived allocations of similar lifetime.

**Fix:**
```rust
use bumpalo::Bump;

fn process_batch(data: &[RawRecord]) -> Vec<ProcessedRecord> {
    let arena = Bump::new();  // Single allocation for entire batch

    let intermediate: Vec<&Intermediate> = data.iter()
        .map(|raw| arena.alloc(parse(raw)))  // Allocated in arena
        .collect();

    // Arena freed when it goes out of scope — one deallocation
    intermediate.iter().map(|i| finalize(i)).collect()
}
```

**When to use:** Many allocations with uniform lifetime (request processing, parsing, tree construction).

### Pattern: `Box<[T]>` Over `Vec<T>` for Fixed-Size Collections

**Symptom:** `Vec<T>` allocations for data that never grows after construction.

**Fix:**
```rust
// ❌ Vec carries capacity tracking overhead (3 words vs 2)
let data: Vec<u8> = input.to_vec();

// ✅ Box<[T]> — exact allocation, no excess capacity
let data: Box<[u8]> = input.to_vec().into_boxed_slice();
```

**Savings:** 8 bytes per instance (one fewer `usize` for capacity). Only meaningful for millions of instances.

### Pattern: `SmallVec` for Usually-Small Collections

**Symptom:** Profiler shows heap allocations for vectors that are almost always ≤ N elements.

**Fix:**
```rust
use smallvec::SmallVec;

// Stack-allocated for ≤ 4 elements, heap-allocated above
let mut tags: SmallVec<[Tag; 4]> = SmallVec::new();
tags.push(tag1);  // No heap allocation
```

### Pattern: `#[inline]` for Small Hot Functions

**Symptom:** Flamegraph shows call overhead for small functions on the hot path that aren't being inlined by LLVM.

**Fix:**
```rust
// ✅ Hint to inline across crate boundaries
#[inline]
pub fn is_valid(&self) -> bool {
    self.status == Status::Active && !self.is_expired()
}

// ✅ Force inline (use sparingly — can increase binary size)
#[inline(always)]
pub fn hash_key(&self) -> u64 {
    // tiny, always-called function
}
```

**Caveat:** LLVM is usually good at inlining within a crate. `#[inline]` is mainly needed for cross-crate hot paths. Measure before adding.

### Pattern: Zero-Copy Parsing

**Symptom:** Profiler shows allocations in string/buffer parsing — creating owned `String` for data that lives in the input buffer.

**Fix:**
```rust
// ❌ Copies data into new String allocations
struct ParsedRecord {
    name: String,
    value: String,
}

// ✅ Borrows from input — zero allocations
struct ParsedRecord<'a> {
    name: &'a str,
    value: &'a str,
}

fn parse(input: &str) -> ParsedRecord<'_> {
    let (name, value) = input.split_once('=').unwrap();
    ParsedRecord { name, value }
}
```

### Pattern: `Cow<str>` for Conditional Ownership

**Symptom:** Function always allocates a `String` but the input is often usable as-is.

**Fix:**
```rust
use std::borrow::Cow;

// ✅ Borrows when possible, allocates only when transformation needed
fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains(' ') {
        Cow::Owned(input.replace(' ', "_"))
    } else {
        Cow::Borrowed(input)  // No allocation
    }
}
```

### Pattern: Async Task Budgeting (Tokio)

**Symptom:** `tokio-console` shows task starvation — one task monopolizes the runtime.

**Fix:**
```rust
// ❌ CPU-heavy work on the async runtime
async fn process(data: Vec<Record>) -> Vec<Result> {
    data.iter().map(|r| heavy_compute(r)).collect()  // Blocks runtime
}

// ✅ Offload to blocking thread pool
async fn process(data: Vec<Record>) -> Vec<Result> {
    tokio::task::spawn_blocking(move || {
        data.iter().map(|r| heavy_compute(r)).collect()
    }).await.unwrap()
}
```

### Pattern: Pre-sized Collections

**Symptom:** `Vec::push` triggers repeated reallocations — `alloc::raw_vec::RawVec::grow` in flamegraph.

**Fix:**
```rust
// ❌ Grows 0 → 4 → 8 → 16 → ... (log(n) allocations)
let mut results = Vec::new();
for item in data {
    results.push(process(item));
}

// ✅ Single allocation
let mut results = Vec::with_capacity(data.len());
for item in data {
    results.push(process(item));
}

// ✅ Even better — iterator collect (auto-sizes via size_hint)
let results: Vec<_> = data.iter().map(process).collect();
```

---

## Benchmarking with Criterion

```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn bench_parse(c: &mut Criterion) {
    let input = include_str!("../fixtures/large_input.txt");

    c.bench_function("parse_records", |b| {
        b.iter(|| parse_records(black_box(input)))
    });
}

criterion_group!(benches, bench_parse);
criterion_main!(benches);
```

```bash
# Run all benchmarks
cargo bench

# Run specific benchmark
cargo bench -- parse_records

# Save baseline
cargo bench -- --save-baseline before

# Compare against baseline
cargo bench -- --baseline before

# JSON output for agent consumption
cargo bench -- --output-format bencher 2>&1 | tee bench.txt
```

---

## Rust-Specific Anti-Patterns

1. **Don't use `clone()` to avoid lifetime issues.** Fix the ownership model instead. Excessive cloning is a design smell, not a performance tool.
2. **Don't use `unsafe` for performance without profiling evidence.** The compiler's optimizations are usually sufficient. `unsafe` breaks memory safety guarantees.
3. **Don't add `#[inline(always)]` everywhere.** Excessive inlining increases binary size and instruction cache pressure, which can slow things down.
4. **Don't fight the borrow checker with `Rc<RefCell<T>>` on hot paths.** If you need shared mutable state on a hot path, reconsider the ownership model or use `Cell` for `Copy` types.
5. **Don't ignore release vs debug performance.** Always benchmark in `--release` mode. Debug builds are 10-100x slower and produce meaningless profiles.
6. **Don't use `HashMap` for tiny lookups.** For ≤ 10 entries, a sorted `Vec` with binary search or a simple linear scan is faster (cache locality wins).

---

## Irreducible Floors in Rust

| Cost | What it is | Why it's irreducible |
|---|---|---|
| `syscall` overhead | Kernel boundary crossing | Fundamental cost of I/O — amortize with batching |
| TLS handshake | HTTPS connection setup | Network + crypto overhead — use connection pooling |
| `jemalloc` / system allocator | Heap allocation overhead | ~20-50ns per allocation — use arena/pool for hot paths |
| LLVM codegen | Compilation time for generics | Monomorphization generates specialized code — compile-time cost |
| `tokio` runtime | Async task scheduling | ~1-5μs per task spawn — acceptable for I/O-bound work |
| Memory-mapped I/O | Page fault cost on first access | OS-level cost — prefault or use `madvise` hints |
| SIMD boundary | Vectorization alignment | Alignment + tail handling overhead — accept for correctness |

---

## Related Principles
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Performance Optimization Principles @performance-optimization-principles.md
