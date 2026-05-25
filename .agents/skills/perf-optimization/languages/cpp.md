# C++ Performance Profiling

> **Applicability:** C++ applications, systems code, game engines, and performance-critical libraries.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `perf` (Linux) | CPU profiling, cache misses, branch misses | `perf record -g ./app && perf report` |
| Valgrind (Cachegrind) | Cache profiling | `valgrind --tool=cachegrind ./app` |
| Valgrind (Callgrind) | Call graph profiling | `valgrind --tool=callgrind ./app` |
| Google Benchmark | Microbenchmarking | `./benchmark --benchmark_format=json` |
| Tracy Profiler | Real-time frame profiling | GUI — connect to instrumented app |
| Instruments (macOS) | CPU/memory profiling | `xcrun xctrace record --template "Time Profiler" --launch -- ./app` |
| `-ftime-trace` (Clang) | Compile time profiling | `clang++ -ftime-trace main.cpp` |
| Sanitizers | Runtime overhead analysis | `-fsanitize=address` adds ~2x overhead |
| `objdump` / Compiler Explorer | Assembly inspection | `objdump -d -C ./app | less` or godbolt.org |

---

## Optimization Patterns

### Pattern: Data-Oriented Design (Cache Friendliness)

**Symptom:** `perf stat` shows high L1/L2/L3 cache miss rate. CPU stalls on memory access.

```cpp
// ❌ Array of Structs (AoS) — poor cache locality for hot fields
struct Entity {
    glm::vec3 position;    // 12 bytes — hot (used every frame)
    std::string name;      // 32 bytes — cold (used rarely)
    glm::vec3 velocity;    // 12 bytes — hot
    Texture* texture;      // 8 bytes  — cold
    float health;          // 4 bytes  — warm
    // Cache line (64 bytes) wastes space on cold data
};
std::vector<Entity> entities;  // Iterating touches cold data

// ✅ Struct of Arrays (SoA) — hot data packed together
struct Entities {
    std::vector<glm::vec3> positions;   // Hot — contiguous in memory
    std::vector<glm::vec3> velocities;  // Hot — contiguous
    std::vector<float> healths;         // Warm
    std::vector<std::string> names;     // Cold — separate
    std::vector<Texture*> textures;     // Cold — separate
};
// Iterating positions/velocities → perfect cache utilization
```

### Pattern: Move Semantics and RVO

**Symptom:** Profiler shows time in copy constructors. Large objects being duplicated.

```cpp
// ❌ Unnecessary copy
std::vector<Task> getTasks() {
    std::vector<Task> result;
    // ... populate ...
    return result;  // Already RVO/NRVO — no explicit move needed
}

// ❌ Explicit move prevents NRVO
return std::move(result);  // WORSE — prevents compiler optimization!

// ✅ Let the compiler do it
return result;  // Compiler applies NRVO (Named Return Value Optimization)

// ✅ Move parameters into functions
void addTask(Task task) {  // By value — caller can move or copy
    tasks_.push_back(std::move(task));
}
// Caller: addTask(std::move(myTask));  // 0 copies
```

### Pattern: Avoiding Virtual Function Overhead in Hot Paths

**Symptom:** Profiler shows time in vtable lookups. Polymorphic dispatch in tight loops.

```cpp
// ❌ Virtual dispatch in hot loop (~5ns per call due to branch misprediction)
for (auto& shape : shapes) {
    shape->draw();  // vtable lookup each iteration
}

// ✅ CRTP (Curiously Recurring Template Pattern) — compile-time polymorphism
template<typename Derived>
class Shape {
public:
    void draw() { static_cast<Derived*>(this)->drawImpl(); }
};

class Circle : public Shape<Circle> {
public:
    void drawImpl() { /* ... */ }  // Inlined by compiler — no vtable
};

// ✅ std::variant for closed type set (C++17)
using Shape = std::variant<Circle, Rectangle, Triangle>;
for (auto& shape : shapes) {
    std::visit([](auto& s) { s.draw(); }, shape);  // Devirtualized
}
```

### Pattern: Compile-Time Computation

**Symptom:** Repeated runtime computation of values that could be known at compile time.

```cpp
// ❌ Runtime computation
const double TAU = 2.0 * 3.14159265358979;

// ✅ constexpr — computed at compile time
constexpr double TAU = 2.0 * std::numbers::pi;

// ✅ constexpr functions
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int result = factorial(10);  // Computed at compile time

// ✅ consteval — MUST be computed at compile time (C++20)
consteval int compiletime_only(int n) { return n * n; }
```

### Pattern: SIMD and Vectorization

**Symptom:** CPU-bound computation that operates on arrays of numbers. Compiler auto-vectorization not engaging.

```bash
# Check if compiler vectorized
g++ -O2 -ftree-vectorize -fopt-info-vec-optimized main.cpp
# Output shows which loops were vectorized

# Force vectorization report
g++ -O2 -ftree-vectorize -fopt-info-vec-missed main.cpp
# Shows why loops were NOT vectorized
```

```cpp
// ✅ Help the compiler vectorize
void multiply(float* __restrict__ a, const float* __restrict__ b, int n) {
    // __restrict__ tells compiler: no aliasing → safe to vectorize
    for (int i = 0; i < n; ++i) {
        a[i] *= b[i];
    }
}
```

---

## Anti-Patterns

1. **Don't use `std::endl` in loops** — forces a flush. Use `'\n'`.
2. **Don't copy large objects** — use `const&` parameters and move semantics.
3. **Don't use `std::list` for sequential access** — `std::vector` has better cache locality.
4. **Don't use virtual functions in hot loops** — use CRTP or `std::variant`.
5. **Don't return `std::move(local)`** — prevents NRVO optimization.
6. **Don't allocate in hot loops** — pre-allocate or use `reserve()`.
7. **Don't use `std::map` when `std::unordered_map` suffices** — O(log n) vs O(1) lookup.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| L1 cache hit | ~1ns | Hardware speed |
| L2 cache hit | ~5ns | Larger, slower cache |
| L3 cache hit | ~20ns | Shared across cores |
| Main memory access | ~100ns | DRAM latency |
| Virtual function call | ~5ns | Branch prediction + vtable load |
| `std::atomic` CAS | ~10-50ns | Cache line synchronization |
| `std::mutex` lock (uncontended) | ~20ns | Kernel mutex overhead |
| System call (`read`/`write`) | ~200ns | User→kernel context switch |
| `new`/`delete` (small) | ~50-100ns | Allocator overhead |

---

## Benchmarking (Google Benchmark)

```cpp
#include <benchmark/benchmark.h>

static void BM_VectorPushBack(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v);
    }
}
BENCHMARK(BM_VectorPushBack)->Range(8, 8 << 10);

static void BM_VectorReserved(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        v.reserve(state.range(0));
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v);
    }
}
BENCHMARK(BM_VectorReserved)->Range(8, 8 << 10);

BENCHMARK_MAIN();
// Run: ./benchmark --benchmark_format=console
```

---

## Related
- C++ Idioms @.agents/skills/cpp-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
