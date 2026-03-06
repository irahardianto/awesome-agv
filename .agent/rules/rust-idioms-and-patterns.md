---
trigger: model_decision
description: When writing Rust code, working on a Rust or Cargo project, or reviewing Rust idioms and safety practices
---

## Rust Idioms and Patterns

### Core Philosophy

Rust's type system and ownership model are your primary tools for correctness. Lean into the compiler — it is your strongest ally. Write code that is idiomatic, safe, and expressive.

> **Scope:** This file covers Rust-specific *coding idioms*. For file layout, see `project-structure-rust-cargo.md`. For test naming conventions, see `testing-strategy.md`. For logging library choice, see `logging-and-observability-principles.md`.

### Ownership and Borrowing

1. **Prefer borrowing (`&T`, `&mut T`) over cloning**
   - Never `.clone()` to silence the borrow checker without a `// CLONE:` comment explaining why
   - Use `Cow<'_, T>` when a function may or may not need ownership
   - Prefer `&str` over `String` in function parameters, `&[T]` over `Vec<T>`

2. **Minimize owned data in structs**
   - Use references with explicit lifetimes when the struct is short-lived
   - Use owned types (`String`, `Vec<T>`) when the struct must outlive its inputs

3. **Avoid unnecessary `Arc<Mutex<T>>`**
   - If data flows one direction, use channels (`tokio::sync::mpsc`)
   - If data is read-heavy, consider `RwLock` over `Mutex`
   - If data is immutable after init, use `Arc<T>` without a lock

### Error Handling

1. **Use the `?` operator for propagation — never `unwrap()` in production code**
   - `unwrap()` and `expect()` are acceptable only in:
     - Tests (`#[test]`, `#[tokio::test]`)
     - Infallible operations where the invariant is proven (document with `// SAFETY:` comment)
     - CLI `main()` function with clear error messages via `expect("reason")`

2. **Choose error crates by context:**
   - Library code: `thiserror` — define typed error enums
   - Application code: `anyhow` — ergonomic error chaining
   - Never mix: library crates should not depend on `anyhow`

3. **Error type design:**

```rust
// ✅ Good — typed, matchable errors
#[derive(Debug, thiserror::Error)]
pub enum PathfinderError {
    #[error("file not found: {path}")]
    FileNotFound { path: PathBuf },
    #[error("AST parse failed: {0}")]
    ParseError(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// ❌ Bad — stringly-typed, unmatchable
fn do_thing() -> Result<(), String> { ... }

// ✅ Annotate public Result-producing functions to force callers to handle them
#[must_use]
pub fn create_task(req: CreateTaskRequest) -> Result<Task, TaskError> { ... }

// Triggers a compiler warning when the return value is fully ignored:
//   create_task(req);          // warning: unused `Result` that must be used
//
// This does NOT trigger the warning (intentional discard — still valid when used deliberately):
//   let _ = create_task(req);  // explicit discard, silences warning by design
```

### Async and Concurrency

1. **Use `tokio` as the async runtime**
   - Mark async entry points with `#[tokio::main]` or `#[tokio::test]`
   - Prefer `tokio::spawn` for concurrent tasks, not `std::thread::spawn`
   - Use `tokio::select!` for racing futures, not manual polling

2. **Cancellation safety:**
   - Prefer `tokio::sync::mpsc` over `tokio::sync::broadcast` unless fan-out is needed
   - Document cancellation behavior on any `async fn` that holds resources across `.await`
   - Use `tokio_util::sync::CancellationToken` for graceful shutdown

3. **Blocking operations:**
   - Never call blocking I/O inside async context
   - Use `tokio::task::spawn_blocking` for CPU-heavy or blocking work
   - Use `tokio::fs` instead of `std::fs` inside async functions

### Unsafe Code

1. **Zero `unsafe` blocks unless in FFI boundaries**
   - Tree-sitter C bindings and similar FFI are the only valid use case
   - Every `unsafe` block must have a `// SAFETY:` comment explaining the invariant

2. **Minimize unsafe surface area:**
   - Encapsulate `unsafe` in a safe wrapper function
   - The wrapper's public API must be safe to call from any context
   - Write tests that exercise the boundary conditions of `unsafe` wrappers

3. **Never use `unsafe` to bypass the borrow checker** — restructure the code instead

### Lifetimes and Generics

1. **Prefer `'_` lifetime elision when possible**
   - Only introduce named lifetimes when the compiler requires them or when they clarify intent
   - Use `'a` for single lifetime parameters, descriptive names (`'input`, `'query`) for multiple

2. **Keep generic bounds simple:**
   - Prefer concrete types for prototyping, introduce generics when the pattern stabilizes
   - Use `impl Trait` in argument position for simple cases
   - Use `where` clauses for complex bounds — never inline complex bounds in `<...>`

3. **Avoid lifetime gymnastics:**
   - If lifetime annotations become complex, restructure to use owned data or `Arc`
   - Consider the "split borrow" pattern to avoid borrow checker issues in struct methods

### Idiomatic Patterns

1. **Builder pattern** for types with many optional fields:
   - Return `Self` from builder methods for chaining
   - `build()` returns `Result<T, BuildError>`, not `T`

2. **Newtype pattern** for domain types:
   - Wrap primitives: `struct UserId(u64)`, not bare `u64`
   - Implement `Deref` only when the newtype truly "is-a" the inner type

3. **Typestate pattern** for state machines:
   - Different states = different types — invalid transitions are compile errors
   - Use this for protocol implementations and lifecycle management

4. **`From`/`Into` conversions:**
   - Implement `From<A> for B` (never `Into` directly)
   - Use `impl From<X> for Error` with `thiserror`'s `#[from]` attribute

### Testing

1. **Test organization (Rust-specific — differs from Go/TS):**
   - **Unit tests:** `#[cfg(test)] mod tests` block **at the bottom of each `.rs` file** — this is the idiomatic Rust convention, not a shortcut
     - Tests can access private functions via `use super::*`
     - Code inside `#[cfg(test)]` is stripped from production builds
     - Do NOT create separate `*_test.rs` files — this breaks private access and is non-idiomatic
   - **Integration tests:** `tests/` directory at crate root (each file compiled as a separate crate)
     - Only tests public API — use `use my_crate::function;`
     - No `#[cfg(test)]` annotation needed
     - Shared helpers: `tests/common/mod.rs` (NOT `tests/common.rs`, which Cargo treats as a test file)
   - Use `#[tokio::test]` for async tests

2. **Test naming:** `fn test_<function>_<scenario>_<expected>()` (snake_case)

3. **Assertions:**
   - Use `assert_eq!` / `assert_ne!` over `assert!(a == b)` — better error messages
   - Use `assert!(matches!(result, Ok(_)))` for enum variant checking

4. **Property testing:** Use `proptest` or `quickcheck` for functions with wide input spaces

### Clippy and Formatting

1. **`cargo check` for fast iteration during development**
   - `cargo check`: type-checks without producing a binary — fastest feedback loop
   - `cargo clippy`: includes `cargo check` plus lint rules — use before committing
   - `cargo build`: only when you need the actual binary/library artifact
   - Never run `cargo build` during TDD cycles — it is significantly slower than `cargo check`

2. **`cargo clippy` must pass with zero warnings** before any commit
   - Use `#[allow(clippy::...)]` only with a `// ALLOW:` comment explaining why
   - Prefer fixing the lint over suppressing it

3. **`cargo fmt` is non-negotiable** — all code must be formatted

4. **Recommended project-level Clippy configuration (`.clippy.toml` or `Cargo.toml`):**

```toml
[lints.clippy]
pedantic = "warn"
unwrap_used = "deny"
expect_used = "warn"
```

### Dependency Management

1. **Minimize dependency count** — each dependency is an attack surface and compile-time cost
2. **Pin major versions** in `Cargo.toml` — use `dep = "1"` not `dep = "*"`
3. **Audit regularly** — run `cargo audit` to check for known vulnerabilities
4. **Prefer well-maintained crates** — check download count, last commit date, and issue tracker

### Related Principles
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Concurrency and Threading Mandate @concurrency-and-threading-mandate.md
- Performance Optimization Principles @performance-optimization-principles.md
- Resource and Memory Management Principles @resources-and-memory-management-principles.md
- Security Mandate @security-mandate.md
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Testing Strategy @testing-strategy.md
- Dependency Management Principles @dependency-management-principles.md