# Python Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Python.

---

## Type Safety

- [ ] **Type hints on all public functions** — parameters and return types annotated
- [ ] **No `type: ignore`** without explanatory comment
- [ ] **`from __future__ import annotations`** at top of files using forward references
- [ ] **Protocols** used for interfaces (not ABCs, unless inheritance is needed)

### Correct Patterns

```python
# ❌ Untyped public function
def get_user(user_id):
    ...

# ✅ Fully typed
def get_user(user_id: str) -> User | None:
    ...

# ❌ Bare type: ignore
result = some_lib.do_thing()  # type: ignore

# ✅ With rationale
result = some_lib.do_thing()  # type: ignore[no-untyped-call]  # Library lacks stubs
```

---

## Error Handling

- [ ] **No bare `except:`** or `except Exception:` that swallows errors — always handle, log, or re-raise
- [ ] **No `pass` in `except` blocks** — at minimum log the error
- [ ] **Custom domain exceptions** inherit from a base domain exception, not raw `Exception`
- [ ] **Context managers** (`with`) used for all resource acquisition (files, connections, locks)

### Correct Patterns

```python
# ❌ Bare except — catches KeyboardInterrupt, SystemExit
try:
    result = process(data)
except:
    pass

# ❌ Too broad — swallows everything
try:
    result = process(data)
except Exception:
    pass

# ✅ Specific exception with handling
try:
    result = process(data)
except ValidationError as e:
    logger.warning("validation_failed", extra={"field": e.field, "error": str(e)})
    raise
except ConnectionError as e:
    logger.error("connection_failed", extra={"error": str(e)})
    raise ServiceUnavailableError("Database unreachable") from e
```

---

## Common Pitfalls

- [ ] **No mutable default arguments** — use `None` sentinel pattern
- [ ] **No `import *`** — always import specific names
- [ ] **`__all__` defined** in modules with public API (limits `from module import *`)
- [ ] **No `global` keyword** — pass state explicitly or use classes
- [ ] **`is` used for `None`/`True`/`False` comparison** — not `==`

### Correct Patterns

```python
# ❌ Mutable default — shared across calls
def add_tag(tag: str, tags: list[str] = []) -> list[str]:
    tags.append(tag)
    return tags

# ✅ None sentinel
def add_tag(tag: str, tags: list[str] | None = None) -> list[str]:
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

# ❌ Equality check for None
if result == None:

# ✅ Identity check
if result is None:
```

---

## Resource Cleanup

- [ ] **Files opened with `with` statement** — never manual `open()`/`close()`
- [ ] **Database connections** returned to pool via context manager
- [ ] **HTTP sessions** (`aiohttp.ClientSession`, `httpx.AsyncClient`) properly closed
- [ ] **Async resources** use `async with` for acquisition/release

### Correct Patterns

```python
# ❌ Manual resource management
f = open("data.txt")
data = f.read()
f.close()  # Skipped if exception occurs

# ✅ Context manager
with open("data.txt") as f:
    data = f.read()

# ✅ Async context manager
async with aiohttp.ClientSession() as session:
    async with session.get(url) as response:
        data = await response.json()
```

---

## Observability

- [ ] **No `print()` statements** in production code — use structured logger
- [ ] **Logger uses `extra` dict** for structured context, not f-strings in message
- [ ] **`logging.exception()`** used in except blocks (auto-includes traceback)

### Correct Patterns

```python
# ❌ Print in production
print(f"User {user_id} logged in")

# ❌ f-string in log message (not structured)
logger.info(f"User {user_id} logged in from {ip}")

# ✅ Structured logging
logger.info("user_login", extra={"user_id": user_id, "ip": ip})
```

---

## Testing

- [ ] **`pytest` fixtures** used for test setup — not `setUp`/`tearDown` methods
- [ ] **Parametrized tests** for multiple input scenarios (`@pytest.mark.parametrize`)
- [ ] **Mocks** scoped to individual tests — no module-level mock patches
- [ ] **Async tests** use `@pytest.mark.asyncio` with `pytest-asyncio`

---

## Static Analysis

- [ ] `ruff check .` passes with zero errors
- [ ] `ruff format --check .` passes (formatting consistent)
- [ ] `mypy .` or `pyright .` passes with zero type errors
- [ ] No `# noqa` without explanatory comment

---

## References
- Python Idioms and Patterns @.agents/skills/python-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @.agents/skills/logging-implementation/SKILL.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
