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

For complex projects with multiple internal crates. This is the recommended structure for **Pathfinder-type projects** where distinct subsystems benefit from separate compilation units and explicit dependency boundaries.

```
  project-root/
    Cargo.toml                        # [workspace] manifest — lists all members
    Cargo.lock                        # Locked dependency versions (committed for binaries)

    crates/
      pathfinder/                     # Main binary crate (entry point, wiring)
        Cargo.toml                    # Depends on other workspace crates
        src/
          main.rs                    # CLI parsing, MCP transport setup
          lib.rs
          config.rs
          error.rs
          mcp/                       # MCP protocol handling
            mod.rs
            transport.rs             # stdio transport
            tools.rs                 # Tool registration + dispatch

      pathfinder-treesitter/          # Tree-sitter engine crate
        Cargo.toml
        build.rs                     # Compiles C grammars via cc crate
        src/
          lib.rs
          parser.rs                  # Language-aware parsing
          queries.rs                 # .scm query loading + execution
          semantic_path.rs           # Semantic path resolution
          repo_map.rs                # get_repo_map implementation
          cache.rs                   # AST cache with incremental re-parse
        queries/                     # Bundled .scm query files
          highlights-go.scm
          highlights-typescript.scm
          highlights-python.scm

      pathfinder-lsp/                 # LSP client crate
        Cargo.toml
        src/
          lib.rs
          client.rs                  # JSON-RPC client over stdio
          lifecycle.rs               # Spawn, idle timeout, crash recovery
          capabilities.rs            # Capability detection + degradation
          definition.rs              # get_definition implementation
          call_hierarchy.rs          # analyze_impact implementation

      pathfinder-search/              # Ripgrep integration crate
        Cargo.toml
        src/
          lib.rs
          search.rs                  # search_codebase implementation
          filter.rs                  # AST-aware filtering (code_only, comments_only)

      pathfinder-edit/                # Shadow Editor crate
        Cargo.toml
        src/
          lib.rs
          surgical_edit.rs           # Edit pipeline implementation
          occ.rs                     # Version hash + OCC logic
          diagnostic_diff.rs         # Pre/post diagnostic comparison

      pathfinder-common/              # Shared types and utilities
        Cargo.toml
        src/
          lib.rs
          types.rs                   # Shared types (SemanticPath, VersionHash, etc.)
          sandbox.rs                 # Three-tier sandbox enforcement
          file_watcher.rs            # File watching + expected-write log
          error.rs                   # Common error types

    tests/                           # Workspace-level integration tests
      integration/
        full_pipeline_test.rs        # End-to-end MCP tool call tests

    config/                          # Default configuration
      pathfinder.config.default.json
```

**Key differences from Go/Node layouts:**
- `crates/` replaces `apps/` — Cargo workspace with explicit inter-crate dependencies in `Cargo.toml`
- Each crate has its own `Cargo.toml` — dependencies are scoped, compile separately, enforces boundaries
- `build.rs` — Rust-specific build script for FFI compilation (C grammars for tree-sitter)
- `Cargo.lock` committed — standard practice for binary projects (not for library crates)
- No `node_modules/`, `vendor/` — dependencies are managed by Cargo globally in `~/.cargo/`
- Feature flags in `Cargo.toml` — use `[features]` for optional functionality instead of build-time env vars

### Related Principles
- Project Structure @project-structure.md (core philosophy)
- Rust Idioms and Patterns @rust-idioms-and-patterns.md
