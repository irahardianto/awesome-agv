# Rust Debugging Module

Language-specific debugging guide for Rust projects. Use alongside the main [Debugging Protocol](../SKILL.md).

---

## Toolchain Reference

| Tool                  | Purpose                                   | When to Use                                         |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| `cargo check`         | Fast type/borrow checking (no codegen)    | **Always first** — 2-5× faster than `cargo build`   |
| `cargo clippy`        | Lint for idiomatic issues and subtle bugs | After `cargo check` passes — catches logical errors |
| `cargo test`          | Run test suite                            | Validate fixes, reproduce failures                  |
| `cargo expand`        | Expand macros to see generated code       | When a macro-generated error is unclear             |
| `cargo tree`          | Visualize dependency graph                | Dependency conflicts, version mismatches            |
| `cargo audit`         | Check for known vulnerabilities           | Security-related investigations                     |
| `RUST_BACKTRACE=1`    | Full backtrace on panic                   | Runtime panics — always enable first                |
| `RUST_BACKTRACE=full` | Backtrace with line numbers               | When `=1` doesn't give enough detail                |
| `miri`                | Detect undefined behavior in unsafe code  | Suspected UB, memory safety issues                  |

---

## Phase 1: Initialize Session — Rust Context

Add these fields to the debugging session document:

```markdown
### Rust Context
- **Rust toolchain version:** (output of `rustc --version`)
- **Cargo.toml key dependencies:** (list with versions)
- **Build profile:** debug / release
- **Target:** default / cross-compile target
```

---

## Phase 3: Hypothesis Categories

Common Rust-specific hypothesis categories:

| Category            | Example Hypotheses                                                         |
| ------------------- | -------------------------------------------------------------------------- |
| **Borrow Checker**  | "Function borrows `self` mutably while an immutable borrow is still live"  |
| **Lifetime**        | "Returned reference outlives the data it points to"                        |
| **Async/Runtime**   | "Blocking call inside async context starves the Tokio runtime"             |
| **Type Mismatch**   | "Trait bound not satisfied due to missing `Send`/`Sync` on spawned future" |
| **FFI/Unsafe**      | "Raw pointer from C FFI is null but not checked before dereference"        |
| **Macro Expansion** | "Procedural macro generates code that conflicts with local type names"     |
| **Dependency**      | "Two crates depend on different major versions of the same crate"          |

---

## Phase 4: Validation Task Patterns

### Borrow Checker Errors — Reading Strategy

When the compiler emits a borrow error:

1. **Read the error bottom-up** — the last line shows *where* the conflict is, not *why*
2. **Find the two conflicting borrows** — the error always names them
3. **Check the lifetime of each borrow** — does one live longer than expected?
4. **Common fixes:**
   - Clone the data (only if cheap — document with `// CLONE:`)
   - Restructure to avoid overlapping borrows (split struct into components)
   - Use `Cell`/`RefCell` for interior mutability (single-threaded only)
   - Use scoping braces `{ }` to limit borrow lifetime

### Async Debugging

```bash
# Enable Tokio's runtime tracing
RUSTFLAGS="--cfg tokio_unstable" cargo build
# Then use tokio-console for live runtime inspection
tokio-console
```

Validation steps for async issues:
1. Check for `spawn_blocking` around any blocking I/O
2. Verify all `.await` points — are any holding locks across them?
3. Look for `select!` branches that aren't cancellation-safe
4. Run with `tokio::time::pause()` in tests for deterministic timing

### Macro Debugging

```bash
# Expand all macros in a specific file
cargo expand --lib path::to::module

# Expand only derive macros
cargo expand --lib path::to::module 2>&1 | grep -A 50 "impl"
```

### Unsafe / UB Detection

```bash
# Run tests under Miri (detects UB, use-after-free, unaligned access)
cargo +nightly miri test

# Common Miri flags
MIRIFLAGS="-Zmiri-backtrace=full" cargo +nightly miri test
```

---

## Phase 6: Confidence Adjustments

| Evidence                                       | Confidence Impact                            |
| ---------------------------------------------- | -------------------------------------------- |
| `cargo check` error points exactly at the line | High — compiler errors are precise           |
| `cargo clippy` lint matches the symptom        | Medium-High — Clippy catches many real bugs  |
| `miri` reports UB                              | **Definitive** for unsafe code paths         |
| `cargo expand` shows unexpected generated code | High — confirms macro-related issues         |
| "works in debug, fails in release" pattern     | Likely UB or optimization-sensitive ordering |

---

## Quick Reference: Error Code → First Action

| Error Type                    | First Action                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `E0382` (use of moved value)  | Check if value can be borrowed instead of moved              |
| `E0502` (conflicting borrows) | Identify the two borrows, scope them apart                   |
| `E0106` (missing lifetime)    | Add lifetime parameter, check if owned type is better        |
| `E0277` (trait not satisfied) | Check `Send`/`Sync` bounds, look for non-Send types in async |
| `E0308` (type mismatch)       | Check `From`/`Into` impls, verify generic constraints        |
| Runtime panic                 | `RUST_BACKTRACE=1 cargo test` — read the backtrace           |
| Segfault / UB                 | `cargo +nightly miri test` — Miri will find it               |
| Macro error                   | `cargo expand` the module — read the generated code          |

---

## Related Principles
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Testing Strategy @testing-strategy.md
