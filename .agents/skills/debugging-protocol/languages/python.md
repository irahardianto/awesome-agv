# Python Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Python-specific symptoms, async debugging, and common framework errors.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `AttributeError: 'NoneType' has no attribute` | Trace the `None` — find which function returned `None` unexpectedly |
| `ImportError` / `ModuleNotFoundError` | Check `sys.path`, virtual env activation, and package installation |
| `TypeError: 'coroutine' was never awaited` | Missing `await` on async function call |
| `RecursionError: maximum recursion depth` | Check for circular imports or infinite recursion in logic |
| Memory leak / growing RSS | `objgraph.show_most_common_types()` → find growing object type |
| `asyncio.TimeoutError` | Check timeout values, network connectivity, and event loop blocking |
| Test passes alone, fails in suite | Shared mutable state — check module-level variables and class attributes |
| Django/FastAPI `500 Internal Server Error` | Check server logs first — framework catches exceptions and logs them |
| `PermissionError` on file operations | Check file ownership, SELinux/AppArmor, and container volume mounts |
| Slow startup | Profile imports: `python -X importtime app.py 2>&1 | head -30` |

---

## Diagnostic Tools

### pdb / pudb (Interactive Debugger)

```python
# Insert breakpoint (Python 3.7+)
breakpoint()  # Drops into pdb

# Or use pudb for a TUI debugger
import pudb; pudb.set_trace()

# Remote debugging (for containers/servers)
import debugpy
debugpy.listen(("0.0.0.0", 5678))
debugpy.wait_for_client()  # Blocks until VS Code attaches
```

### Common pdb commands

```
n          # next line (step over)
s          # step into function
c          # continue to next breakpoint
p expr     # print expression
pp obj     # pretty-print object
l          # list source code around current line
w          # show call stack (where)
u / d      # move up/down the call stack
b file:line # set breakpoint
```

### Traceback Analysis

```python
# Rich tracebacks (install: pip install rich)
from rich.traceback import install
install(show_locals=True)  # Shows local variables in traceback

# Log full traceback in production
import traceback
logger.error("operation_failed", extra={
    "traceback": traceback.format_exc(),
    "context": {"user_id": user_id},
})
```

### Import Time Profiling

```bash
# Show import times (find slow startup causes)
python -X importtime app.py 2>&1 | sort -t: -k2 -rn | head -20

# Or use tuna for visualization
python -X importtime app.py 2> import.log
tuna import.log
```

---

## Common Python Bugs and Fixes

### Mutable Default Arguments

**Symptom:** Function accumulates state across calls. List/dict parameter grows unexpectedly.

```python
# ❌ BUG — default list is shared across all calls
def add_item(item, items=[]):
    items.append(item)
    return items

add_item("a")  # ['a']
add_item("b")  # ['a', 'b'] — BUG! Expected ['b']

# ✅ FIX — use None sentinel
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

### Circular Imports

**Symptom:** `ImportError: cannot import name 'X' from partially initialized module`.

**Diagnosis:**
```bash
# Trace import chain
python -c "import yourmodule" 2>&1 | grep "ImportError"

# Visualize import graph
pip install pydeps
pydeps yourpackage --max-bacon 3
```

**Fix strategies:**
1. **Move import inside function** (lazy import) — breaks the cycle at runtime.
2. **Use `TYPE_CHECKING`** for type-only imports:
   ```python
   from __future__ import annotations
   from typing import TYPE_CHECKING

   if TYPE_CHECKING:
       from .other_module import OtherClass  # Only for type checkers
   ```
3. **Restructure** — extract shared types to a third module.

### Async Event Loop Blocking

**Symptom:** Async server (FastAPI, aiohttp) becomes unresponsive. Some requests timeout while CPU is low.

**Diagnosis:**
```python
# Add event loop monitoring
import asyncio
import time

async def monitor_loop():
    while True:
        start = time.monotonic()
        await asyncio.sleep(0.1)
        elapsed = time.monotonic() - start
        if elapsed > 0.2:  # >100ms block detected
            logger.warning("event_loop_blocked", extra={"blocked_ms": (elapsed - 0.1) * 1000})
```

**Common causes:**
1. **Synchronous I/O** in async handler — `open()`, `requests.get()`, CPU-heavy computation.
2. **Missing `await`** — coroutine created but never scheduled.
3. **Database driver** not async — using `psycopg2` instead of `asyncpg`.

**Fix:**
```python
# ❌ Blocks the event loop
@app.get("/report")
async def generate_report():
    data = compute_heavy_report()  # Synchronous, blocks everything
    return data

# ✅ Offload to thread pool
@app.get("/report")
async def generate_report():
    data = await asyncio.to_thread(compute_heavy_report)
    return data
```

### Django/FastAPI `N+1` Query

**Symptom:** Response time grows linearly with data size. Django Debug Toolbar shows hundreds of queries.

**Diagnosis:**
```python
# Django — enable query logging
import logging
logging.getLogger('django.db.backends').setLevel(logging.DEBUG)

# Count queries per request
from django.test.utils import CaptureQueriesContext
from django.db import connection

with CaptureQueriesContext(connection) as ctx:
    response = client.get('/api/tasks/')
    print(f"Queries: {len(ctx.captured_queries)}")
```

**Fix (Django):**
```python
# ❌ N+1 — each task.user triggers a query
tasks = Task.objects.all()
for task in tasks:
    print(task.user.name)

# ✅ Eager load
tasks = Task.objects.select_related('user').all()
```

### Test Flakiness

**Common causes:**
1. **Shared mutable state** — module-level variables or class attributes modified in tests.
2. **Time-dependent logic** — use `freezegun` or `time-machine` to freeze time.
3. **Random ordering** — use `pytest-randomly` to detect order-dependent tests.
4. **Database state** — use `@pytest.fixture(autouse=True)` with transaction rollback.

```bash
# Reproduce intermittent failures
pytest --count=50 -x tests/test_feature.py

# Run with random ordering
pytest -p randomly --randomly-seed=12345

# Verbose failure output
pytest -vv --tb=long tests/test_feature.py
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Error reproduces with `breakpoint()` at suspected line | +50% confidence in root cause |
| `objgraph` shows specific type growing | +60% confidence in memory leak source |
| Import time profiling shows one slow module | +50% confidence in startup issue |
| Test passes with `-x` (fail-fast) but not in full suite | +40% confidence in shared state |
| `asyncio` debug mode shows unawaited coroutine | +70% confidence in missing `await` |

---

## Related
- Python Idioms and Patterns @python-idioms-and-patterns.md
- Performance Optimization (Python) @perf-optimization/languages/python.md
- Error Handling Principles @error-handling-principles.md
