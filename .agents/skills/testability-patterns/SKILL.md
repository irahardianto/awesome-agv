---
name: testability-patterns
description: >-
  Implementation examples for the three testability rules (I/O isolation, pure logic,
  dependency direction) across Go, TypeScript, Python, Rust, and Dart. Loaded by
  reference from architectural-pattern.md — not triggered by file patterns.
---

## Testability Patterns — Implementation Examples

Language-specific examples for the three testability rules defined in `@.agents/rules/architectural-pattern.md`. Load this skill when you need concrete implementation reference for I/O isolation, pure business logic, or dependency direction in a specific language.

---

### Rule 1: I/O Isolation — Interface + Adapter Pattern

#### Go

```go
// storage.go — Contract defined in the consumer feature
type Storage interface {
    Create(ctx context.Context, task Task) error
    GetByID(ctx context.Context, id string) (*Task, error)
}

// storage_pg.go — Production adapter
type PostgresStorage struct{ db *sql.DB }

func (s *PostgresStorage) GetByID(ctx context.Context, id string) (*Task, error) {
    // real database query
}

// storage_mock.go — Test adapter
type MockStorage struct {
    tasks map[string]*Task
}

func (m *MockStorage) GetByID(ctx context.Context, id string) (*Task, error) {
    t, ok := m.tasks[id]
    if !ok {
        return nil, ErrNotFound
    }
    return t, nil
}
```

#### TypeScript / Vue

```typescript
// task.api.ts — Contract (service layer)
export interface TaskAPI {
    createTask(title: string): Promise<Task>;
    getTasks(): Promise<Task[]>;
}

// task.api.backend.ts — Production adapter
export class BackendTaskAPI implements TaskAPI {
    async createTask(title: string): Promise<Task> {
        return this.http.post('/api/tasks', { title });
    }
    async getTasks(): Promise<Task[]> {
        return this.http.get('/api/tasks');
    }
}

// In tests — Test adapter (vi.mock or manual)
export class MockTaskAPI implements TaskAPI {
    private tasks: Task[] = [];
    async createTask(title: string): Promise<Task> {
        const task = { id: crypto.randomUUID(), title };
        this.tasks.push(task);
        return task;
    }
    async getTasks(): Promise<Task[]> {
        return [...this.tasks];
    }
}
```

#### Python

```python
# storage.py — Contract via Protocol
from typing import Protocol

class TaskStorage(Protocol):
    def get_by_id(self, task_id: str) -> Task: ...
    def create(self, task: Task) -> None: ...

# storage_pg.py — Production adapter
class PostgresTaskStorage:
    def __init__(self, db: AsyncEngine) -> None:
        self._db = db

    async def get_by_id(self, task_id: str) -> Task:
        # real database query

# In tests — InMemory adapter
class InMemoryTaskStorage:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    async def get_by_id(self, task_id: str) -> Task:
        if task_id not in self._tasks:
            raise TaskNotFoundError(task_id)
        return self._tasks[task_id]
```

#### Rust

```rust
// storage.rs — Contract via trait
#[async_trait]
pub trait TaskStorage: Send + Sync {
    async fn get_by_id(&self, id: &str) -> Result<Task, StorageError>;
    async fn create(&self, task: &Task) -> Result<(), StorageError>;
}

// storage_pg.rs — Production adapter
pub struct PostgresTaskStorage { pool: PgPool }

#[async_trait]
impl TaskStorage for PostgresTaskStorage {
    async fn get_by_id(&self, id: &str) -> Result<Task, StorageError> {
        // real sqlx query
    }
}

// In tests — In-memory adapter
pub struct InMemoryTaskStorage {
    tasks: Mutex<HashMap<String, Task>>,
}

#[async_trait]
impl TaskStorage for InMemoryTaskStorage {
    async fn get_by_id(&self, id: &str) -> Result<Task, StorageError> {
        self.tasks.lock().unwrap()
            .get(id)
            .cloned()
            .ok_or(StorageError::NotFound)
    }
}
```

#### Flutter / Dart (Riverpod)

```dart
// task_repository.dart — Contract
abstract interface class TaskRepository {
  Future<Task> getById(String id);
  Future<void> create(Task task);
}

// task_repository_api.dart — Production adapter
class ApiTaskRepository implements TaskRepository {
  final Dio _client;
  @override
  Future<Task> getById(String id) async {
    final response = await _client.get('/tasks/$id');
    return Task.fromJson(response.data);
  }
}

// In tests — Fake adapter
class FakeTaskRepository implements TaskRepository {
  final _tasks = <String, Task>{};
  @override
  Future<Task> getById(String id) async {
    final task = _tasks[id];
    if (task == null) throw NotFoundException(id);
    return task;
  }
}
```

---

### Rule 2: Pure Business Logic — Fetch → Calculate → Persist

The pattern is universal. Always separate the three concerns:

```
// 1. Fetch dependencies (in handler/service — has I/O access)
validCoupon, err := store.GetCoupon(ctx, coupon.ID)
user, err := store.GetUser(ctx, userID)

// 2. Pass to pure logic (in logic file — no I/O)
discount, err := calculateDiscount(items, validCoupon, user.Tier)
// ✅ calculateDiscount is pure: same inputs → same output, no side effects

// 3. Persist result (in handler/service — has I/O access)
err = store.SaveOrder(ctx, order)
```

**Anti-pattern — I/O buried in logic (untestable):**

```go
// ❌ Cannot test calculateDiscount without a real database
func calculateDiscount(ctx context.Context, items []Item, couponID string) (float64, error) {
    validCoupon, err := db.GetCoupon(ctx, couponID) // NO — db call inside logic
    ...
}
```

---

### Rule 3: Dependency Direction — Wiring Pattern

Dependencies are wired at the outermost layer (`main.go`, `app.py`, `main.rs`), not inside business logic:

```go
// cmd/api/main.go — Wiring
storage := postgres.NewTaskStorage(db)      // Infrastructure
service := task.NewService(storage)          // Business (depends on contract, not postgres)
handler := task.NewHandler(service)          // Delivery
router.POST("/tasks", handler.Create)
```

```python
# main.py — Wiring
storage = PostgresTaskStorage(engine)        # Infrastructure
service = TaskService(storage)               # Business
router.include_router(task_router(service))  # Delivery
```

```typescript
// main.ts — Wiring (or DI container)
const api = new BackendTaskAPI(httpClient);      // Infrastructure
const store = useTaskStore(api);                  // Business (Pinia)
```

---

### Related
- Architectural Patterns @.agents/rules/architectural-pattern.md (the three rules)
- Testing Strategy @.agents/rules/testing-strategy.md
- Code Organization Principles @.agents/rules/code-organization-principles.md
