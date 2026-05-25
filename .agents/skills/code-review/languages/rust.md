# Rust Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Rust code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `unwrap()` in library code | Critical | `[ERR]` | Use `?` operator with proper error types |
| `expect()` in library code (without comment) | Major | `[ERR]` | Use `?` or document why panic is acceptable |
| `panic!()` / `todo!()` / `unimplemented!()` in library code | Critical | `[ERR]` | Return `Result` or `Option` |
| `unsafe` without `// SAFETY:` comment | Critical | `[SEC]` | Add safety invariant documentation |
| `.clone()` in hot path without justification | Major | `[PAT]` | Use borrowing, `Cow`, or `Arc` |
| `println!()` / `eprintln!()` in production code | Major | `[OBS]` | Use `tracing` crate with structured fields |
| `dbg!()` in production code | Critical | `[OBS]` | Remove — debug macro, not for production |
| `#[allow(unused)]` on production code | Major | `[PAT]` | Remove dead code |
| `#[allow(clippy::...)]` without comment | Major | `[PAT]` | Fix the clippy warning or add rationale |
| `Arc<Mutex<T>>` when `Mutex<T>` suffices | Major | `[PAT]` | Use `Mutex<T>` if not shared across threads |
| Lock held across `.await` point | Critical | `[ERR]` | Minimize lock scope, release before await |
| `String` parameter when `&str` suffices | Major | `[PAT]` | Use `&str` for read-only string parameters |
| Missing `#[derive(Debug)]` on public types | Major | `[PAT]` | Add `Debug` derive — essential for diagnostics |
| Raw pointer dereference without `unsafe` block | Critical | `[SEC]` | Wrap in `unsafe` with safety comment |

---

## Detection Commands

Use these grep patterns to scan for anti-patterns before manual review:

```bash
# unwrap/expect in library code (exclude tests)
grep -rn '\.unwrap()' --include='*.rs' | grep -v '#\[cfg(test)\]\|#\[test\]\|tests/\|_test\.rs'
grep -rn '\.expect(' --include='*.rs' | grep -v '#\[cfg(test)\]\|#\[test\]\|tests/\|_test\.rs'

# panic!/todo!/unimplemented! in library code
grep -rn 'panic!\|todo!\|unimplemented!' --include='*.rs' | grep -v '#\[cfg(test)\]\|tests/'

# unsafe without SAFETY comment
grep -rn 'unsafe {' --include='*.rs' -B1 | grep -v 'SAFETY'

# println/eprintln/dbg in production code
grep -rn 'println!\|eprintln!\|dbg!' --include='*.rs' | grep -v '#\[cfg(test)\]\|tests/\|examples/'

# Unnecessary clone
grep -rn '\.clone()' --include='*.rs' | grep -v '#\[cfg(test)\]\|tests/'

# Allow directives without comment
grep -rn '#\[allow(' --include='*.rs' | grep -v '//'

# Lock held across await (rough heuristic)
grep -rn '\.lock()\.await' --include='*.rs' -A5 | grep '\.await'

# String parameter (search function signatures)
grep -rn 'fn.*message: String\|fn.*name: String\|fn.*title: String' --include='*.rs'

# Missing Debug derive on public structs
grep -rn 'pub struct' --include='*.rs' -B3 | grep -v 'Debug'
```

---

## Correct Patterns (Reference)

### Error Handling

```rust
// ❌ unwrap — panics on error
let task = storage.get(id).unwrap();

// ✅ Propagate with context
let task = storage.get(id)
    .map_err(|e| TaskError::Storage(e))?;

// ✅ With anyhow (in binaries)
let task = storage.get(id)
    .context("failed to fetch task")?;
```

### Unsafe Code

```rust
// ❌ No safety documentation
unsafe { ptr::read(src) }

// ✅ Documented invariants
// SAFETY: `src` is a valid, aligned pointer to an initialized `Task`
// value, guaranteed by the arena allocator's allocation contract.
// The pointer is not aliased, so this read does not violate
// Rust's aliasing rules.
unsafe { ptr::read(src) }
```

### Ownership

```rust
// ❌ Unnecessary allocation for read-only use
fn format_title(title: String) -> String {
    format!("[TASK] {}", title)
}

// ✅ Borrow — no allocation forced on caller
fn format_title(title: &str) -> String {
    format!("[TASK] {}", title)
}
```

### Concurrency

```rust
// ❌ Lock held across await — other tasks blocked
async fn update_cache(&self, key: &str) {
    let mut cache = self.cache.lock().await;
    let value = self.fetch(key).await; // Lock held during network call!
    cache.insert(key.to_string(), value);
}

// ✅ Lock released before await
async fn update_cache(&self, key: &str) {
    let value = self.fetch(key).await;
    let mut cache = self.cache.lock().await;
    cache.insert(key.to_string(), value);
}
```

---

## References
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
