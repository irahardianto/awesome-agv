# Python Performance Profiling

## Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `py-spy` | Sampling CPU profiler (no code change needed) | `py-spy record -o profile.svg -- python app.py` |
| `scalene` | CPU + memory + GPU profiler (line-level) | `scalene --cpu --memory --outfile profile.html app.py` |
| `cProfile` | Deterministic CPU profiler (stdlib) | `python -m cProfile -o profile.prof app.py` |
| `snakeviz` | Visual viewer for cProfile output | `snakeviz profile.prof` |
| `memory_profiler` | Line-by-line memory usage | `python -m memory_profiler app.py` |
| `memray` | Heap profiler with flamegraph output | `memray run app.py && memray flamegraph output.bin` |
| `line_profiler` | Line-by-line CPU time | `kernprof -l -v app.py` |
| `pytest-benchmark` | Micro-benchmarks integrated with pytest | `pytest --benchmark-only` |
| `timeit` | Quick micro-timing | `python -m timeit -n 1000 "expr"` |
| `objgraph` | Object reference graph (leak detection) | `import objgraph; objgraph.show_most_common_types()` |

## Data Extraction

### py-spy (Recommended — Zero Overhead Attach)

```bash
# Profile a running process (no restart needed)
py-spy record -o profile.svg --pid $(pgrep -f "uvicorn")

# Profile a command
py-spy record -o profile.svg -- python -m uvicorn app:app

# Top-like live view
py-spy top --pid $(pgrep -f "uvicorn")

# Dump current thread stacks (no profiling overhead)
py-spy dump --pid $(pgrep -f "uvicorn")
```

### Scalene (Best for Combined CPU + Memory)

```bash
# Full profiling with HTML report
scalene --cpu --memory --outfile report.html app.py

# Profile only specific modules
scalene --cpu --memory --profile-only "src/yourapp" app.py

# JSON output for agent consumption
scalene --cpu --memory --json --outfile report.json app.py
```

### cProfile + snakeviz (Stdlib — Always Available)

```bash
# Capture profile
python -m cProfile -o profile.prof -m uvicorn app:app

# View as web UI
snakeviz profile.prof

# Text output sorted by cumulative time (agent-readable)
python -c "
import pstats
p = pstats.Stats('profile.prof')
p.sort_stats('cumulative')
p.print_stats(30)
"
```

---

## Python-Specific Optimization Patterns

### Pattern: `__slots__` on Hot-Path Classes

**Symptom:** `memray` / `scalene` shows high memory from many small object instances. Each instance carries a `__dict__` (~104 bytes overhead).

**Fix:**
```python
# ❌ Default — each instance has a __dict__ (~104 bytes)
class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

# ✅ With __slots__ — saves ~40-60% memory per instance
class Point:
    __slots__ = ("x", "y")
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y
```

**When NOT to use:** Classes that need dynamic attributes, or `dataclass(frozen=True)` (which already optimizes).

### Pattern: Generator Expressions Over List Comprehensions

**Symptom:** Memory spikes when processing large datasets — profile shows allocations in list construction.

**Fix:**
```python
# ❌ Materializes entire list in memory
total = sum([compute(item) for item in million_items])

# ✅ Lazy evaluation — O(1) memory
total = sum(compute(item) for item in million_items)

# ✅ For chained operations — itertools
import itertools
results = itertools.islice(
    (process(item) for item in data if item.is_valid),
    1000
)
```

### Pattern: `collections.deque` Over List for Queue Operations

**Symptom:** `cProfile` shows time in list `insert(0, x)` or `pop(0)` — both are O(n).

**Fix:**
```python
from collections import deque

# ❌ O(n) per operation
queue: list[Task] = []
queue.insert(0, task)  # prepend
item = queue.pop()      # pop from end

# ✅ O(1) per operation
queue: deque[Task] = deque()
queue.appendleft(task)  # prepend
item = queue.pop()       # pop from end
```

### Pattern: Vectorization Over Loops (NumPy/Pandas)

**Symptom:** Profiler shows most time in a Python `for` loop iterating over numerical data.

**Fix:**
```python
import numpy as np

# ❌ Pure Python loop — ~100x slower
result = [x * 2 + 1 for x in data]

# ✅ NumPy vectorized — compiled C
result = data * 2 + 1

# ❌ Pandas row-by-row apply
df["result"] = df.apply(lambda row: row["a"] * row["b"], axis=1)

# ✅ Pandas vectorized
df["result"] = df["a"] * df["b"]
```

### Pattern: `functools.lru_cache` / `functools.cache` for Pure Functions

**Symptom:** Same expensive computation called repeatedly with identical arguments.

**Fix:**
```python
from functools import lru_cache

# ✅ Bounded cache (evicts LRU when full)
@lru_cache(maxsize=256)
def parse_template(template_str: str) -> Template:
    return Template(template_str)

# ✅ Unbounded cache (Python 3.9+ — only for small argument spaces)
from functools import cache

@cache
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

**Safety:** Never cache functions with side effects or mutable arguments (lists, dicts).

### Pattern: String Building with `join` Over Concatenation

**Symptom:** Profiler shows time in string concatenation (`str.__add__`) inside loops.

**Fix:**
```python
# ❌ O(n²) — creates a new string every iteration
result = ""
for part in parts:
    result += part

# ✅ O(n) — single allocation
result = "".join(parts)

# ✅ For formatted output
lines = [f"{item.name}: {item.value}" for item in items]
result = "\n".join(lines)
```

### Pattern: `asyncio.gather` for Concurrent I/O

**Symptom:** Sequential `await` calls create a waterfall — total time = sum of all calls.

**Fix:**
```python
# ❌ Sequential — 3 seconds total
user = await get_user(user_id)         # 1s
tasks = await get_tasks(user_id)       # 1s
notifications = await get_notifs()     # 1s

# ✅ Concurrent — 1 second total
user, tasks, notifications = await asyncio.gather(
    get_user(user_id),
    get_tasks(user_id),
    get_notifs(),
)
```

### Pattern: Connection Pool Reuse

**Symptom:** Profiler shows time in TCP connection setup / TLS handshakes for database or HTTP calls.

**Fix:**
```python
# ❌ New connection per request
async def get_user(user_id: str) -> User:
    async with aiohttp.ClientSession() as session:  # new connection
        resp = await session.get(f"/users/{user_id}")
        return await resp.json()

# ✅ Shared session with connection pooling
class UserClient:
    def __init__(self) -> None:
        self._session = aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(limit=20)
        )

    async def get_user(self, user_id: str) -> User:
        resp = await self._session.get(f"/users/{user_id}")
        return await resp.json()
```

---

## Benchmarking

### pytest-benchmark

```python
def test_parse_template_performance(benchmark):
    template_str = load_fixture("complex_template.txt")
    result = benchmark(parse_template, template_str)
    assert result is not None
```

```bash
# Run benchmarks only
pytest --benchmark-only

# Compare against saved baseline
pytest --benchmark-compare=0001_baseline

# Save baseline
pytest --benchmark-save=baseline

# JSON output for agent consumption
pytest --benchmark-only --benchmark-json=bench.json
```

### timeit (Quick Micro-Benchmarks)

```bash
# Compare two approaches
python -m timeit -n 10000 -s "data = list(range(1000))" "sum(x*2 for x in data)"
python -m timeit -n 10000 -s "import numpy; data = numpy.arange(1000)" "data * 2"
```

---

## Python-Specific Anti-Patterns

1. **Don't use `threading` for CPU-bound work.** The GIL prevents true parallelism. Use `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` for CPU-bound tasks.
2. **Don't call `gc.collect()` manually.** Python's generational GC is well-tuned. Manual collection is almost never the right fix — reduce allocations instead.
3. **Don't use `eval()` or `exec()` for performance.** They bypass compilation optimizations and create security risks.
4. **Don't optimize with C extensions as first resort.** Profile first — most Python performance issues are algorithmic, not interpreter overhead.
5. **Don't ignore the GIL for async I/O.** The GIL is released during I/O operations — `asyncio` is effective for I/O-bound work without multiprocessing.
6. **Don't profile in debug mode.** Debug assertions and `-O0` compilation flags distort profiling data. Profile with `python -O` for production-representative results.

---

## Irreducible Floors in Python

| Cost | What it is | Why it's irreducible |
|---|---|---|
| GIL contention | Global Interpreter Lock | Single-threaded execution for CPU-bound Python — use multiprocessing for parallelism |
| Interpreter overhead | CPython bytecode dispatch | ~10-100x slower than compiled languages for pure computation — accept or use NumPy/Cython |
| `import` time | Module loading and compilation | One-time cost at startup — lazy import if startup time matters |
| `asyncio` event loop | Coroutine scheduling overhead | Per-task overhead is small (~1μs) but adds up at >100k concurrent tasks |
| Garbage collection | Generational GC pauses | Proportional to number of objects — reduce allocations, use `__slots__` |
| C extension boundary | Python↔C marshalling | Overhead per call — batch operations to amortize (NumPy vectorization) |
| `pickle` serialization | Multiprocessing data transfer | Serialization cost for inter-process communication — use shared memory for large data |

---

## Related Principles
- Python Idioms and Patterns @.agents/skills/python-idioms/SKILL.md
- Core Design Principles § Concurrency @core-design-principles.md
- Performance Optimization Principles @performance-optimization-principles.md
