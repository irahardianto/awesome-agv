# Python Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Python code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| Bare `except:` or `except Exception:` with `pass` | Critical | `[ERR]` | Catch specific exceptions, handle or re-raise |
| `type: ignore` without rationale comment | Major | `[ERR]` | Fix the type error; add `# reason` if suppression truly needed |
| `print()` in production code (non-CLI) | Major | `[OBS]` | Use structured logger (`logging` or `structlog`) |
| Mutable default argument (`def f(x=[])`) | Critical | `[ERR]` | Use `None` sentinel pattern |
| `import *` | Major | `[ARCH]` | Import specific names |
| `eval()` or `exec()` with user input | Critical | `[SEC]` | Refactor to avoid dynamic code execution |
| `os.system()` or `subprocess` with `shell=True` | Critical | `[SEC]` | Use `subprocess.run()` with list args, no `shell=True` |
| String formatting in SQL queries | Critical | `[SEC]` | Use parameterized queries |
| Missing `with` for file/connection handling | Major | `[RES]` | Use context manager (`with open(...) as f:`) |
| `global` keyword usage | Major | `[ARCH]` | Pass state explicitly or use classes |
| `== None` / `!= None` comparison | Major | `[ERR]` | Use `is None` / `is not None` |
| `assert` used for runtime validation | Major | `[ERR]` | Use `if/raise` — asserts are stripped with `-O` flag |
| Missing type hints on public functions | Major | `[PAT]` | Add parameter and return type annotations |
| `requests.get()` / sync I/O inside `async def` | Critical | `[ERR]` | Use `httpx`/`aiohttp` or `asyncio.to_thread()` |

---

## Detection Commands

Use these grep patterns to scan for anti-patterns before manual review:

```bash
# Bare except
grep -rn 'except:' --include='*.py' | grep -v '#.*noqa'

# except Exception with pass
grep -rn 'except.*Exception' --include='*.py' -A1 | grep -B1 'pass$'

# type: ignore without rationale
grep -rn 'type: ignore' --include='*.py' | grep -v '#.*\['

# print() in production code
grep -rn 'print(' --include='*.py' | grep -v 'test_\|_test\.\|conftest\.\|cli\.\|__main__'

# Mutable default arguments
grep -rn 'def.*=\[\]\|def.*={}\|def.*=set()' --include='*.py'

# import *
grep -rn 'from .* import \*' --include='*.py'

# eval/exec usage
grep -rn 'eval(\|exec(' --include='*.py' | grep -v '#.*noqa\|test_'

# shell=True in subprocess
grep -rn 'shell=True' --include='*.py'

# String formatting in SQL
grep -rn 'f".*SELECT\|f".*INSERT\|f".*UPDATE\|f".*DELETE\|\.format.*SELECT' --include='*.py'

# Missing context manager for files
grep -rn 'open(' --include='*.py' | grep -v 'with \|#\|test_' | grep '='

# global keyword
grep -rn '^    global ' --include='*.py'

# == None comparison
grep -rn '== None\|!= None' --include='*.py'

# assert for validation (not in tests)
grep -rn '^    assert ' --include='*.py' | grep -v 'test_\|_test\.\|conftest'

# Sync I/O in async functions
grep -rn 'async def' --include='*.py' -A20 | grep 'requests\.\|urllib\.\|open(' | grep -v 'aiohttp\|httpx\|aiofiles'
```

---

## Correct Patterns (Reference)

### Error Handling

```python
# ❌ Bare except swallows everything
try:
    result = db.query(sql)
except:
    pass

# ✅ Specific, with logging
try:
    result = db.query(sql)
except DatabaseError as e:
    logger.error("query_failed", extra={"sql": sql, "error": str(e)})
    raise ServiceError("Database query failed") from e
```

### Type Safety

```python
# ❌ No types — unclear contract
def process(data, config):
    ...

# ✅ Typed — self-documenting
def process(data: list[Record], config: ProcessConfig) -> ProcessResult:
    ...
```

### Resource Management

```python
# ❌ Manual close — skipped on exception
conn = get_connection()
result = conn.execute(query)
conn.close()

# ✅ Context manager — guaranteed cleanup
with get_connection() as conn:
    result = conn.execute(query)
```

### Async Safety

```python
# ❌ Blocks the event loop
async def fetch_report(url: str) -> Report:
    response = requests.get(url)  # SYNC — blocks everything
    return parse(response.text)

# ✅ Async HTTP client
async def fetch_report(url: str) -> Report:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return parse(response.text)
```

---

## References
- Python Idioms and Patterns @python-idioms-and-patterns.md
- Security Principles @security-principles.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
