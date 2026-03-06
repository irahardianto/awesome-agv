---
trigger: model_decision
description: When working on a Rust or Cargo project, setting up Rust project structure, or organizing Rust crates and workspaces
---

## Rust/Cargo Layout

Use these structures for Rust projects. The vertical slice principle applies — features are modules, not layers.

### Single Binary Crate

For CLI tools, standalone servers, and single-purpose applications.

```
  project-root/
    Cargo.toml                        # Package manifest + dependencies
    build.rs                          # Build script (optional — for FFI, codegen)
    src/
      main.rs                        # Entry point: CLI parsing, server startup, wires dependencies
      lib.rs                         # Library root — re-exports public modules (enables integration testing)

      # --- Foundational Concerns (The "Platform") ---
      config.rs                      # Configuration loading (env vars, config files)
      error.rs                       # Application-wide error types (thiserror enum)
      telemetry.rs                   # Tracing/logging setup (tracing, tracing-subscriber)

      # --- Business Features (Vertical Slices) ---
      features/
        mod.rs                       # Re-exports feature modules
        task/
          mod.rs                     # Public API of this feature — re-exports types + service
          service.rs                 # Feature service (business logic orchestration)
          logic.rs                   # Pure business rules (no I/O, easily testable)
          models.rs                  # Domain structs (Task, NewTaskRequest)
          error.rs                   # Feature-specific error types
          repository.rs              # Storage trait definition
          postgres.rs                # Postgres implementation of repository trait
          mock.rs                    # Mock implementation for testing
        auth/
          mod.rs
          service.rs
          logic.rs
          models.rs
          ...

      # --- Delivery Layer (HTTP/gRPC) ---
      handlers/
        mod.rs
        task_handler.rs              # HTTP handlers for task feature (axum/actix extractors)
        auth_handler.rs
      router.rs                      # Route definitions, middleware stack

    tests/                           # Integration tests (compiled as separate crate, access only pub API)
      common/
        mod.rs                       # Shared test fixtures, helpers, test database setup
      task_api_test.rs               # Full API integration tests
      auth_flow_test.rs

    benches/                         # Benchmarks (criterion)
      task_benchmark.rs
```

**Key Rust conventions:**
- `src/lib.rs` + `src/main.rs` — enables integration testing against `lib.rs` public API
- `mod.rs` re-exports — each feature's `mod.rs` is its public boundary
- `error.rs` per feature — typed errors with `thiserror`, composed at app level with `#[from]`
- `tests/` directory — integration tests see only the public API, enforcing encapsulation
- No `controllers/` or `services/` at the top level — features are the top-level organization

---

### Library Crate

For publishable libraries, SDKs, and reusable components.

```
  project-root/
    Cargo.toml                        # Package manifest (lib target)
    src/
      lib.rs                         # Crate root — public API surface, module re-exports
      parser.rs                      # Public module
      ast.rs                         # Public module
      error.rs                       # Public error types (thiserror)
      internal/                      # Private implementation details
        mod.rs
        optimizer.rs
        cache.rs

    examples/                        # Runnable examples (cargo run --example)
      basic_usage.rs
      advanced_config.rs

    tests/                           # Integration tests
      parsing_test.rs

    benches/                         # Benchmarks
      parser_benchmark.rs
```

---

### Cargo Workspace (Multi-Crate)

For complex projects with multiple internal crates. This is the recommended structure for projects where distinct subsystems benefit from separate compilation units and explicit dependency boundaries.

```
  project-root/
    Cargo.toml                        # [workspace] manifest — lists all members
    Cargo.lock                        # Locked dependency versions (committed for binaries)

    crates/
      myapp/                          # Main binary crate (entry point, wiring)
        Cargo.toml                    # Depends on other workspace crates
        src/
          main.rs                    # CLI parsing, server setup
          lib.rs
          config.rs
          error.rs
          api/                       # API / protocol handling
            mod.rs
            routes.rs                # Route definitions
            handlers.rs              # Request handlers

      myapp-parser/                   # Domain-specific engine crate
        Cargo.toml
        build.rs                     # Build script (optional — for FFI, codegen)
        src/
          lib.rs
          parser.rs                  # Core parsing logic
          transform.rs               # Data transformations
          cache.rs                   # Caching layer
        tests/                       # Per-crate integration tests (public API only)
          parser_integration.rs

      myapp-client/                   # External service client crate
        Cargo.toml
        src/
          lib.rs
          client.rs                  # Client implementation
          lifecycle.rs               # Connection management
          retry.rs                   # Retry and resilience logic

      myapp-search/                   # Search / query engine crate
        Cargo.toml
        src/
          lib.rs
          search.rs                  # Search implementation
          filter.rs                  # Result filtering
        tests/                       # Per-crate integration tests
          search_integration.rs

      myapp-common/                   # Shared types and utilities
        Cargo.toml
        src/
          lib.rs
          types.rs                   # Shared domain types
          error.rs                   # Common error types
        tests/                       # Per-crate integration tests
          common_integration.rs

    tests/                           # Workspace-level integration tests
      integration/
        full_pipeline_test.rs        # End-to-end tests across crates

    config/                          # Default configuration
      myapp.config.default.json
```

**Key differences from Go/Node layouts:**
- `crates/` replaces `apps/` — Cargo workspace with explicit inter-crate dependencies in `Cargo.toml`
- Each crate has its own `Cargo.toml` — dependencies are scoped, compile separately, enforces boundaries
- `build.rs` — Rust-specific build script for FFI compilation (C grammars for tree-sitter)
- `Cargo.lock` committed — standard practice for binary projects (not for library crates)
- No `node_modules/`, `vendor/` — dependencies are managed by Cargo globally in `~/.cargo/`
- Feature flags in `Cargo.toml` — use `[features]` for optional functionality instead of build-time env vars

### Test Organization in Rust

Rust has a compiler-enforced two-tier test system that differs fundamentally from Go/TS:

**Unit Tests — Inline (Not Separate Files)**
- Convention: `#[cfg(test)] mod tests` block **at the bottom of each `.rs` file**
- Tests are compiled conditionally — stripped from production builds
- Can access **private** functions via `use super::*`
- This is NOT a shortcut — it is the official, idiomatic Rust convention
- Do NOT create separate `*_test.rs` files for unit tests

**Integration Tests — `tests/` Directory**
- Location: `tests/` directory **at each crate's root** (next to `src/`)
- Each `.rs` file in `tests/` is compiled as its own **separate crate**
- Can only access the crate's **public API** (`use my_crate::...`)
- No `#[cfg(test)]` needed — Cargo treats `tests/` as test-only automatically
- Shared test helpers go in `tests/common/mod.rs` (not `tests/common.rs`)

**Workspace-level tests:**
- For cross-crate integration / E2E tests, place in `tests/` at the workspace root
- Or create a dedicated test crate in the workspace (e.g. `tests-integration/` — tokio pattern)

**Example per-crate layout with tests:**
```
crates/pathfinder-search/
  Cargo.toml
  src/
    lib.rs                  # Contains #[cfg(test)] mod tests { ... } at bottom
    search.rs               # Contains #[cfg(test)] mod tests { ... } at bottom
    filter.rs               # Contains #[cfg(test)] mod tests { ... } at bottom
    mock.rs                 # Mock implementations
  tests/                    # Integration tests (separate crate, public API only)
    search_integration.rs   # Tests search through public lib.rs API
    common/
      mod.rs                # Shared test fixtures and helpers
```

### Related Principles
- Project Structure @project-structure.md (core philosophy)
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
