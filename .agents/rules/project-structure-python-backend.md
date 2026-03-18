---
trigger: model_decision
description: When working on a Python backend project, setting up Python project structure, or organizing Python services and APIs
---

## Python Backend Layout

Use this structure for Python backend applications. The vertical slice principle applies — features are packages, not technical layers.

```
apps/
  backend/                          # Backend application source code
    pyproject.toml                  # Project metadata, dependencies, tool configs
    src/
      yourapp/                      # Importable package (src-layout, preferred)
        main.py                     # Entry point: creates app, wires dependencies, starts server
        platform/                   # Foundational technical concerns (the "Framework")
          database.py               # DB engine and session factory
          server.py                 # ASGI app setup (FastAPI/Starlette router, middleware)
          logger.py                 # structlog / logging configuration
          config.py                 # Settings (pydantic-settings BaseSettings)
        features/                   # Business Features (Vertical Slices)
          task/                     # Task management
            __init__.py

            # --- Public API ---
            service.py              # TaskService class (public API of this feature)

            # --- Delivery (HTTP) ---
            router.py               # FastAPI APIRouter with HTTP endpoints
            schemas.py              # Pydantic request/response models (API boundary only)
            test_router.py          # Component tests (TestClient + mock service)

            # --- Domain (Business Logic) ---
            logic.py                # Pure domain functions (no I/O)
            models.py               # Domain dataclasses (Task, Priority, etc.)
            errors.py               # Feature-specific exceptions
            test_logic.py           # Unit tests (pure functions — no mocks needed)

            # --- Storage (Data Access) ---
            storage.py              # TaskStorage Protocol (interface)
            storage_pg.py           # PostgreSQL implementation (asyncpg / SQLAlchemy)
            storage_mock.py         # InMemoryTaskStorage (test implementation)
            test_storage_pg.py      # Integration tests (real DB via testcontainers)

          order/                    # Order management
            service.py
            router.py
            schemas.py
            logic.py
            models.py
            storage.py
            storage_pg.py
            storage_mock.py
            ...
    tests/                          # Optional: top-level E2E tests (cross-feature boundaries)
      e2e/
        test_create_task_api.e2e.py
```

**Key Python conventions:**

- **`src/` layout** is strongly preferred — prevents accidental imports of the development tree and matches packaging best practices (PEP 517 / `pypa/build`)
- **`pyproject.toml`** is the single configuration file for `ruff`, `mypy`, `pytest`, `bandit`, and packaging metadata — do not create `setup.cfg`, `.flake8`, or `mypy.ini` files
- **Feature packages** use `__init__.py` — keep it empty or use it solely to re-export the feature's public API
- **`platform/`** holds technical infrastructure that features depend on (database sessions, configuration, logging); features never import each other's `platform/` code directly
- **Tests co-locate** with the code they test (`test_*.py` in the same directory) except for E2E tests which go in `tests/e2e/`
- **`storage_mock.py`** is a production-quality in-memory implementation, not a `unittest.Mock` — it is the recommended test double for unit and integration tests

### Dependency Wiring (main.py)

```python
# src/yourapp/main.py
from yourapp.platform.database import create_engine
from yourapp.platform.server import create_app
from yourapp.features.task.storage_pg import PostgresTaskStorage
from yourapp.features.task.service import TaskService
from yourapp.features.task.router import build_router as build_task_router

def create_application() -> FastAPI:
    engine = create_engine()
    task_storage = PostgresTaskStorage(engine=engine)
    task_service = TaskService(storage=task_storage)

    app = create_app()
    app.include_router(build_task_router(service=task_service))
    return app

app = create_application()
```

### Configuration (platform/config.py)

```python
# src/yourapp/platform/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

def get_settings() -> Settings:
    return Settings()
```

### pyproject.toml Baseline

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "yourapp"
requires-python = ">=3.11"

[tool.hatch.build.targets.wheel]
packages = ["src/yourapp"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "ANN"]

[tool.mypy]
strict = true
python_version = "3.11"

[tool.pytest.ini_options]
testpaths = ["src"]
asyncio_mode = "auto"

[tool.bandit]
skips = ["B101"]   # assert statements allowed in test files
```

### Related Principles
- Project Structure @project-structure.md (core philosophy)
- Python Idioms and Patterns @python-idioms-and-patterns.md (coding idioms, error handling, naming)
