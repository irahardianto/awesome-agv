---
trigger: always_on
---

> **This file is the SINGLE SOURCE OF TRUTH for project organization.**
> All other rules and workflows that reference paths should defer to this file.
> To adapt the setup for a different project type, edit this file only.

## Project Structure

**Project Structure Philosophy:**

- **Organize by FEATURE, not by technical layer**
- Each feature is a vertical slice
- Enables modular growth, clear boundaries, and independent deployability

**Universal Rule: Context → Feature → Layer**

**1. Level 1: Repository Scope:** Root contains `apps/` grouping distinct applications (e.g., `apps/backend`, `apps/frontend`, `apps/mobile`).

**2. Level 2: Feature Organization**
   - **Rule:** Divide application into vertical business slices (e.g., `user/`, `order/`, `payment/`).
   - **Anti-Pattern:** Do NOT organize by technical layer (e.g., `controllers/`, `models/`, `services/`) at the top level.

### Language-Specific Layouts

Each layout follows the universal philosophy above. Load the relevant layout when working with a specific language or framework:

| Layout             | File                                 | When to Use                          |
| ------------------ | ------------------------------------ | ------------------------------------ |
| Go Backend         | @project-structure-go-backend.md     | Go services, APIs, CLI tools         |
| Vue/React Frontend | @project-structure-vue-frontend.md   | Web frontends (Vue, React, Svelte)   |
| Flutter/Mobile     | @project-structure-flutter-mobile.md | Mobile apps (Flutter, React Native)  |
| Rust/Cargo         | @project-structure-rust-cargo.md     | Rust binaries, libraries, workspaces |

> This Feature/Domain/UI/API structure is framework-agnostic. It applies equally to any language or framework. The layout files provide language-specific conventions (file naming, module systems, test locations) while preserving the vertical slice architecture.

### Adapting for Different Project Types

| Project Type            | What to Change                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **Monorepo** (default)  | Use as-is — `apps/backend/`, `apps/frontend/`, `apps/mobile/`                                     |
| **Single backend**      | Flatten to root: `cmd/`, `internal/` (Go) or `src/` (Rust) at project root                        |
| **Single frontend**     | Flatten to root: `src/` at project root (no `apps/` wrapper)                                      |
| **Single mobile**       | Flatten to root: `lib/` at project root (no `apps/` wrapper)                                      |
| **Single Rust binary**  | Flatten to root: `src/`, `tests/`, `benches/` at project root with `Cargo.toml`                   |
| **Rust library**        | Flatten to root: `src/`, `examples/`, `tests/` at project root with `Cargo.toml` (lib target)     |
| **Rust workspace**      | `crates/` at root with workspace `Cargo.toml` — each crate follows single-crate layout internally |
| **Microservices**       | One directory per service under `apps/` (each with own `go.mod`/`Cargo.toml`/`Dockerfile`)        |
| **Full-stack + mobile** | Use all relevant layout files under `apps/`                                                       |

**Single-app projects** don't need the `apps/` directory — put the language-specific root directories directly at the project root. The internal structure (features, platform, etc.) stays the same.

**Multiple entry points (CLI, workers, etc.):**

Go:
```
cmd/
  api/main.go         # HTTP server entry point
  cli/main.go         # CLI tool entry point
  worker/main.go      # Background worker entry point
```

Rust:
```
src/
  bin/
    api.rs            # HTTP server entry point
    cli.rs            # CLI tool entry point
    worker.rs         # Background worker entry point
  lib.rs              # Shared library code
```

**Microservices notes:**
- Each service is its own directory under `apps/` with its own `go.mod`/`Cargo.toml` and `Dockerfile`
- Each service follows the same layout internally (see language-specific files)
- Add `shared/` at root for cross-service contracts (protobuf, shared types) — keep this minimal
- Services communicate via API calls or message queues, never direct imports

### Related Principles
- Code Organization Principles @code-organization-principles.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md

