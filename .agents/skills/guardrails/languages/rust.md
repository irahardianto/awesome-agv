# Rust Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Rust.

---

## Error Handling

- [ ] **No `unwrap()` or `expect()` in library code** — use `?` operator with proper error types
- [ ] **`unwrap()` in binaries** only in `main()` or clearly infallible paths with comment explaining why
- [ ] **No `panic!()` in library code** — return `Result` or `Option`
- [ ] **Custom error types** implement `std::error::Error` and `Display`
- [ ] **Error conversion** via `From` impls or `thiserror` derive macros

### Correct Patterns

```rust
// ❌ unwrap in library — panics on None
pub fn get_task(id: &str) -> Task {
    self.storage.find(id).unwrap()
}

// ✅ Propagate with ?
pub fn get_task(&self, id: &str) -> Result<Task, TaskError> {
    self.storage.find(id)
        .ok_or_else(|| TaskError::NotFound(id.to_string()))
}

// ✅ Custom error with thiserror
#[derive(Debug, thiserror::Error)]
pub enum TaskError {
    #[error("task not found: {0}")]
    NotFound(String),
    #[error("validation failed: {field} — {message}")]
    ValidationFailed { field: String, message: String },
    #[error(transparent)]
    Storage(#[from] StorageError),
}
```

---

## Unsafe Code

- [ ] **No `unsafe` blocks without `// SAFETY:` comment** explaining invariants
- [ ] **`unsafe` blocks are minimal** — wrap only the unsafe operation, not the surrounding logic
- [ ] **Prefer safe abstractions** — `unsafe` is a last resort, not a convenience

### Correct Patterns

```rust
// ❌ Unsafe without explanation
let ptr = unsafe { &*raw_ptr };

// ✅ Documented safety invariant
// SAFETY: `raw_ptr` is guaranteed non-null and properly aligned
// by the allocation in `TaskBuffer::new()` (line 42).
let ptr = unsafe { &*raw_ptr };
```

---

## Ownership and Borrowing

- [ ] **No unnecessary `.clone()`** — check if borrowing or `Cow<str>` suffices
- [ ] **No `Arc<Mutex<T>>` when `Mutex<T>` suffices** — Arc only for cross-thread sharing
- [ ] **`String` vs `&str`** — use `&str` for function parameters, `String` for owned fields
- [ ] **Move semantics preferred** over cloning for transfer of ownership

### Correct Patterns

```rust
// ❌ Unnecessary clone
fn process(data: &[Task]) {
    let tasks = data.to_vec();  // Clone! Just to iterate?
    for task in tasks { ... }
}

// ✅ Borrow
fn process(data: &[Task]) {
    for task in data { ... }
}

// ❌ String parameter forces allocation
fn log_event(message: String) { ... }

// ✅ Borrow — caller decides whether to allocate
fn log_event(message: &str) { ... }

// ✅ Cow for flexibility (owned or borrowed)
fn log_event(message: Cow<'_, str>) { ... }
```

---

## Concurrency

- [ ] **All shared state behind `Mutex`, `RwLock`, or atomic types** — no raw pointer sharing
- [ ] **Lock scopes are minimal** — don't hold locks across `await` points
- [ ] **`Send + Sync` bounds** checked for types shared across threads
- [ ] **Tokio tasks** properly cancelled on shutdown (use `CancellationToken`)

### Correct Patterns

```rust
// ❌ Holding lock across await — deadlock risk
let guard = self.cache.lock().await;
let result = fetch_data().await;  // Other tasks can't access cache
guard.insert(key, result);

// ✅ Minimize lock scope
let result = fetch_data().await;
{
    let mut guard = self.cache.lock().await;
    guard.insert(key, result);
}
```

---

## Resource Cleanup

- [ ] **`Drop` implemented** for types that manage external resources
- [ ] **No manual resource cleanup** outside `Drop` — let RAII handle it
- [ ] **Async cleanup** uses `tokio::signal` for graceful shutdown

---

## Observability

- [ ] **`tracing` crate** used for logging (not `println!` or `log` crate in async code)
- [ ] **Spans** wrap operation entry points with structured fields
- [ ] **No `dbg!()` macro** in production code

### Correct Patterns

```rust
// ❌ println in production
println!("Processing task {}", task_id);

// ✅ Structured tracing
tracing::info!(task_id = %task_id, "processing task");

// ✅ Span for operation
#[tracing::instrument(skip(self))]
pub async fn create_task(&self, req: CreateTaskRequest) -> Result<Task, TaskError> {
    // ...
}
```

---

## Testing

- [ ] **`#[cfg(test)]` module** in same file for unit tests
- [ ] **No `unwrap()` in tests without `#[should_panic]`** — use `?` operator in `Result`-returning tests
- [ ] **Mock traits** using `mockall` or manual implementations
- [ ] **Integration tests** in `tests/` directory (not in `src/`)

---

## Static Analysis

- [ ] `cargo clippy -- -D warnings` passes with zero warnings
- [ ] `cargo fmt --check` passes (formatting consistent)
- [ ] `cargo test` passes with zero failures
- [ ] No `#[allow(clippy::...)]` without explanatory comment

---

## References
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
