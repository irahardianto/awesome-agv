---
trigger: model_decision
description: When writing Python code, reviewing Python idioms, or working on any Python project (backend, CLI, or data pipeline)
---

## Python Idioms and Patterns

### Core Philosophy

Python rewards explicitness and readability over cleverness. Follow the **Zen of Python** (`import this`) — beautiful code is not a luxury, it's a professional necessity. If it reads like plain English, it's probably idiomatic Python.

> **Scope:** This file covers Python-specific *coding idioms*. For file layout, see `project-structure-python-backend.md`. For test naming conventions, see `testing-strategy.md`. For logging library choice, see `logging-and-observability-principles.md`.

---

### Type Hints — Non-Negotiable

**Always annotate function signatures and public APIs.** Use `from __future__ import annotations` for forward references.

```python
# ✅ Fully annotated — self-documenting and mypy-verifiable
from __future__ import annotations
from collections.abc import Sequence

def calculate_discount(items: Sequence[Item], coupon: Coupon) -> float: ...

# ❌ Untyped — opaque to both mypy and the next developer
def calculate_discount(items, coupon): ...
```

1. **Use `X | None` over `Optional[X]`** (Python 3.10+)
   ```python
   # ✅ Modern union syntax
   def find_user(user_id: str) -> User | None: ...

   # ❌ Verbose legacy form (still valid, but prefer the above)
   from typing import Optional
   def find_user(user_id: str) -> Optional[User]: ...
   ```

2. **Use `TypeAlias` and `TypeVar` for reusable generics**
   ```python
   from typing import TypeVar, TypeAlias

   T = TypeVar("T")
   UserId: TypeAlias = str
   ```

3. **Use `Protocol` for structural interfaces instead of ABCs when duck-typing is sufficient**
   ```python
   from typing import Protocol

   class TaskStorage(Protocol):
       def get_by_id(self, task_id: str) -> Task: ...
       def save(self, task: Task) -> None: ...
   ```

4. **`TypedDict` for structured dicts crossing system boundaries (JSON, configs)**
   ```python
   from typing import TypedDict

   class CreateTaskRequest(TypedDict):
       title: str
       priority: Literal["low", "medium", "high"]
   ```

---

### Error Handling

> For general error handling principles, see `error-handling-principles.md`. This section covers Python-specific idioms.

1. **Prefer specific exception types over broad `except Exception`**
   ```python
   # ✅ Precise — catches exactly what you expect
   try:
       task = storage.get_by_id(task_id)
   except TaskNotFoundError:
       raise HTTPException(status_code=404, detail="Task not found")

   # ❌ Broad — may swallow programming errors
   try:
       task = storage.get_by_id(task_id)
   except Exception:
       raise HTTPException(status_code=500, detail="Error")
   ```

2. **Define domain-specific exception hierarchies**
   ```python
   class FathError(Exception):
       """Base exception for all domain errors."""

   class NotFoundError(FathError):
       def __init__(self, resource: str, resource_id: str) -> None:
           self.resource = resource
           self.resource_id = resource_id
           super().__init__(f"{resource} '{resource_id}' not found")

   class ValidationError(FathError):
       def __init__(self, field: str, message: str) -> None:
           self.field = field
           self.message = message
           super().__init__(f"Validation failed on '{field}': {message}")
   ```

3. **Never silence exceptions** — if an exception is caught and not re-raised, log it explicitly
   ```python
   # ❌ Silent swallow
   try:
       notify_user(user_id)
   except Exception:
       pass

   # ✅ Explicit intent + observability
   try:
       notify_user(user_id)
   except NotificationError:
       logger.warning("notification_failed", user_id=user_id, exc_info=True)
   ```

4. **Use `contextlib.suppress` only for truly expected, inconsequential exceptions**
   ```python
   from contextlib import suppress

   with suppress(FileNotFoundError):
       cache_path.unlink()  # OK — cleanup, not business logic
   ```

---

### Dataclasses and Pydantic

1. **Use `dataclasses` for internal domain models** (no I/O, no validation)
   ```python
   from dataclasses import dataclass, field

   @dataclass(frozen=True)   # frozen = immutable value object
   class Task:
       id: str
       title: str
       priority: str
       tags: tuple[str, ...] = field(default_factory=tuple)
   ```

2. **Use Pydantic `BaseModel` for data crossing system boundaries** (API requests/responses, config)
   ```python
   from pydantic import BaseModel, Field

   class CreateTaskRequest(BaseModel):
       title: str = Field(min_length=1, max_length=200)
       priority: Literal["low", "medium", "high"] = "medium"
       due_date: datetime | None = None

       model_config = ConfigDict(frozen=True)  # Pydantic v2
   ```

3. **Keep domain models separate from API schemas** — never use a Pydantic model as a domain entity
   ```
   models.py   → dataclasses (pure domain)
   schemas.py  → Pydantic models (API boundary)
   ```

---

### Interfaces and Dependency Injection

Python uses Protocols and constructor injection to achieve the same testability goal as Go interfaces.

1. **Define the Protocol where it is *used*, not where it is *implemented***
   ```python
   # task/storage.py  ← defined in the consumer feature
   from typing import Protocol

   class TaskStorage(Protocol):
       def get_by_id(self, task_id: str) -> Task: ...
       def save(self, task: Task) -> None: ...
       def delete(self, task_id: str) -> None: ...
   ```

2. **Inject dependencies through `__init__`** — never instantiate concrete dependencies inside a class
   ```python
   # ✅ Testable — storage is injected
   class TaskService:
       def __init__(self, storage: TaskStorage) -> None:
           self._storage = storage

   # ❌ Not testable — concrete dependency hardwired
   class TaskService:
       def __init__(self) -> None:
           self._storage = PostgresTaskStorage()
   ```

3. **Wire dependencies in the entry point** (e.g., `main.py`, `app.py`, or DI container)
   ```python
   # app/main.py
   storage = PostgresTaskStorage(db=database)
   service = TaskService(storage=storage)
   router.include_router(build_task_router(service))
   ```

---

### Async / Await

> For general async principles (when to add concurrency), see `concurrency-and-threading-mandate.md`. This section covers Python-specific async idioms.

1. **Choose one async paradigm and stay consistent** — do not mix `asyncio.run` entry points
   ```python
   # ✅ Fully async service layer
   async def get_task(self, task_id: str) -> Task:
       return await self._storage.get_by_id(task_id)
   ```

2. **Never call blocking I/O directly in an async function**
   ```python
   # ❌ Blocks the event loop
   async def load_file(path: str) -> str:
       return open(path).read()

   # ✅ Use async I/O or run in executor
   import asyncio, aiofiles

   async def load_file(path: str) -> str:
       async with aiofiles.open(path) as f:
           return await f.read()
   ```

3. **Use `asyncio.gather` for concurrent independent operations**
   ```python
   # ✅ Concurrent fan-out
   user, tasks = await asyncio.gather(
       get_user(user_id),
       get_tasks(user_id),
   )
   ```

4. **Use `asyncio.TaskGroup` (Python 3.11+) for structured concurrency with cancellation safety**
   ```python
   async with asyncio.TaskGroup() as tg:
       user_task = tg.create_task(get_user(user_id))
       tasks_task = tg.create_task(get_tasks(user_id))
   user = user_task.result()
   tasks = tasks_task.result()
   ```

---

### Naming Conventions

Follow **PEP 8** rigorously. No exceptions.

| Construct               | Convention         | Example                      |
| ----------------------- | ------------------ | ---------------------------- |
| Module / Package        | `snake_case`       | `task_service.py`            |
| Class                   | `PascalCase`       | `TaskService`                |
| Function / Method       | `snake_case`       | `get_by_id`                  |
| Private method/attr     | `_snake_case`      | `_validate_title`            |
| Constant                | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH = 200`     |
| Type alias              | `PascalCase`       | `UserId = str`               |
| Protocol / Interface    | `PascalCase`       | `TaskStorage`                |

1. **Never use single-letter names outside list comprehensions or math** — names must be descriptive
2. **Avoid `data`, `info`, `obj`, `result` as standalone names** — describe the *domain concept*
3. **Boolean variables and functions should read as yes/no questions**
   ```python
   # ✅
   is_active: bool
   has_permission: bool
   def can_edit(user: User, task: Task) -> bool: ...

   # ❌
   active: bool
   permission: bool
   ```

---

### Idiomatic Patterns

1. **Context managers for resource cleanup** — always prefer `with` over manual `close()`
   ```python
   # ✅
   async with database.transaction() as tx:
       await tx.execute(query)

   # ❌
   tx = database.begin()
   tx.execute(query)
   tx.commit()  # easily forgotten on exception
   ```

2. **Generator expressions over list comprehensions for lazy evaluation**
   ```python
   # ✅ Lazy — does not materialise the entire list
   active_ids = (task.id for task in tasks if task.is_active)

   # Use list comprehension only when you need the full list
   active_tasks = [task for task in tasks if task.is_active]
   ```

3. **`dataclasses.replace()` for immutable updates** (preferred over mutating frozen dataclasses)
   ```python
   from dataclasses import replace

   updated_task = replace(task, title="New Title")
   ```

4. **`functools.cache` / `functools.lru_cache` for pure function memoization**
   ```python
   from functools import cache

   @cache
   def get_config() -> AppConfig:  # called once; result reused
       return _load_config_from_env()
   ```

5. **`__slots__` on hot-path, frequently instantiated classes**
   ```python
   @dataclass
   class Vector:
       __slots__ = ("x", "y")
       x: float
       y: float
   ```

6. **`enum.Enum` (not raw strings) for domain-level constants**
   ```python
   from enum import StrEnum   # Python 3.11+

   class Priority(StrEnum):
       LOW    = "low"
       MEDIUM = "medium"
       HIGH   = "high"
   ```

---

### Testing

> Test file naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Python-specific tooling only.

1. **Use `pytest` as the sole test runner** — never mix with `unittest.TestCase` classes
   ```python
   # ✅ Idiomatic pytest
   def test_calculate_discount_returns_zero_for_no_items() -> None:
       result = calculate_discount(items=[], coupon=Coupon(code="SAVE10"))
       assert result == 0.0
   ```

2. **Parametrize test cases with `@pytest.mark.parametrize`**
   ```python
   @pytest.mark.parametrize("priority,expected_score", [
       ("low",    1),
       ("medium", 5),
       ("high",  10),
   ])
   def test_priority_score(priority: str, expected_score: int) -> None:
       assert priority_score(priority) == expected_score
   ```

3. **Use `pytest-mock` (`mocker` fixture) for mocking — not `unittest.mock` directly**
   ```python
   def test_task_service_creates_task(mocker: MockerFixture) -> None:
       mock_storage = mocker.create_autospec(TaskStorage, instance=True)
       service = TaskService(storage=mock_storage)

       service.create(title="Test", priority="high")

       mock_storage.save.assert_called_once()
   ```

4. **Use a typed mock factory for Protocol-based interfaces**
   ```python
   # storage_mock.py  ← co-locate with storage.py
   class InMemoryTaskStorage:
       """In-memory TaskStorage implementation for unit tests."""

       def __init__(self) -> None:
           self._store: dict[str, Task] = {}

       def get_by_id(self, task_id: str) -> Task:
           if task_id not in self._store:
               raise NotFoundError("Task", task_id)
           return self._store[task_id]

       def save(self, task: Task) -> None:
           self._store[task.id] = task

       def delete(self, task_id: str) -> None:
           self._store.pop(task_id, None)
   ```

5. **Use `pytest-asyncio` for async tests** — mark the whole module or use `asyncio_mode = "auto"` in `pyproject.toml`
   ```python
   import pytest

   @pytest.mark.asyncio
   async def test_async_create_task() -> None:
       service = TaskService(storage=InMemoryTaskStorage())
       task = await service.create(title="Async Task", priority="low")
       assert task.title == "Async Task"
   ```

6. **Fixtures for reusable setup** — never repeat identical `Arrange` blocks across tests
   ```python
   @pytest.fixture
   def task_service() -> TaskService:
       return TaskService(storage=InMemoryTaskStorage())
   ```

---

### Formatting and Static Analysis

All of the following **must pass with zero warnings/errors** before any commit. See `code-completion-mandate.md` for the full checklist.

| Tool         | Purpose                           | Command                            |
| ------------ | --------------------------------- | ---------------------------------- |
| `ruff format`| Canonical formatting (fast)       | `ruff format .`                    |
| `ruff check` | Lint (replaces flake8, isort, ...) | `ruff check . --fix`              |
| `mypy`       | Static type checking              | `mypy src/ --strict`               |
| `bandit`     | Security scanning                 | `bandit -r src/ -c pyproject.toml` |
| `pip-audit`  | Dependency CVE scanning           | `pip-audit`                        |

Configure all tools in `pyproject.toml` — never use per-file pragma comments to disable checks without a `# NOQA:` reason comment.

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "ANN"]
ignore = []

[tool.mypy]
strict = true
python_version = "3.11"

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

> **Logging:** Never use `print()` in production code — it produces unstructured output. Use the standard `logging` module or `structlog` for structured JSON logs. See `logging-and-observability-principles.md` for the required patterns.

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Project Structure — Python Backend @project-structure-python-backend.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Security Principles @security-principles.md
- Dependency Management Principles @dependency-management-principles.md
