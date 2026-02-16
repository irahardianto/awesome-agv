---
layout: default
title: Adapting
nav_order: 8
---

# Adapting the Setup
{: .no_toc }

Customize for your project type, language, and team.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## Project Type Adaptation

The setup supports different project structures out of the box. To adapt, **edit `project-structure.md` only** — it's the single source of truth.

| Project Type | What to Change |
|-------------|----------------|
| **Monorepo** (default) | Use as-is — `apps/backend/`, `apps/frontend/`, `apps/mobile/` |
| **Single backend** | Flatten to root: `cmd/`, `internal/` at project root (no `apps/` wrapper) |
| **Single frontend** | Flatten to root: `src/` at project root (no `apps/` wrapper) |
| **Single mobile** | Flatten to root: `lib/` at project root (no `apps/` wrapper) |
| **Microservices** | One directory per service under `apps/` |
| **Full-stack + mobile** | Use all three sections under `apps/` |

---

## Monorepo Layout

The default layout for full-stack applications:

```
apps/
  backend/                      # Go API server
    cmd/api/main.go             # Entry point
    internal/
      platform/                 # Framework (db, server, logger)
      features/                 # Business features (vertical slices)
        task/
          service.go            # Public API
          handler.go            # HTTP handlers
          logic.go              # Business logic
          models.go             # Domain structs
          storage.go            # Storage interface
          storage_pg.go         # Postgres implementation
          storage_mock.go       # Mock implementation
  frontend/                     # Vue/React app
    src/
      features/                 # Business features (vertical slices)
        task/
          components/           # Feature-specific components
          store/                # Pinia/Redux store
          api/                  # API interface + implementations
          services/             # Business logic
      components/               # Shared UI components
      views/                    # Route entry points
      layouts/                  # App shells
infra/                          # Docker, K8s, Terraform
e2e/                            # End-to-end test suite
```

---

## Single Backend

For a backend-only project, flatten to root:

```
cmd/
  api/main.go                   # HTTP server entry point
  cli/main.go                   # CLI tool (optional)
  worker/main.go                # Background worker (optional)
internal/
  platform/
    database/
    server/
    logger/
  features/
    task/
      service.go
      handler.go
      logic.go
      storage.go
```

**Adaptation steps:**
1. Edit `project-structure.md` — remove `apps/backend/` prefix
2. Edit `4-verify.md` — update paths in validation commands
3. Remove frontend-related rules if not needed

---

## Single Frontend

For a frontend-only project, flatten to root:

```
src/
  features/
    task/
      components/
      store/
      api/
      services/
  components/
  views/
  layouts/
  router/
  plugins/
  App.vue
  main.ts
```

**Adaptation steps:**
1. Edit `project-structure.md` — remove `apps/frontend/` prefix
2. Edit `4-verify.md` — remove backend validation commands
3. Remove backend-specific rules if not needed (database design, etc.)

---

## Flutter / React Native Mobile

```
lib/
  core/                         # Framework (DI, network, theme, router)
    di/injection.dart
    network/api_client.dart
    theme/app_theme.dart
    router/app_router.dart
  features/                     # Business features (vertical slices)
    task/
      screens/                  # Full screens (route targets)
      widgets/                  # Feature-specific widgets
      state/                    # BLoC/Cubit/Riverpod
      models/                   # Domain models
      logic/                    # Pure business rules
      repository/               # Data access abstraction
      api/                      # REST API calls
  shared/                       # Shared widgets, utils, models
test/                           # Unit and widget tests
integration_test/               # E2E tests
```

**Key differences from web frontend:**
- `screens/` replaces `views/`
- `widgets/` replaces `components/`
- `state/` replaces `store/`
- `repository/` replaces `api/` (mobile often caches data locally)
- `core/di/` handles dependency injection

---

## Microservices

Each service is its own directory under `apps/`:

```
apps/
  user-service/
    cmd/api/main.go
    internal/features/...
    go.mod
    Dockerfile
  order-service/
    cmd/api/main.go
    internal/features/...
    go.mod
    Dockerfile
shared/                         # Cross-service contracts (protobuf, shared types)
infra/
  docker-compose.yml
```

**Key rules:**
- Each service has its own `go.mod` and `Dockerfile`
- Each service follows the same internal layout
- `shared/` contains cross-service contracts — keep this minimal
- Services communicate via API calls or message queues, never direct imports

---

## Language-Specific Adaptation

### Go (Default Backend)

The rules are heavily optimized for Go. No changes needed for Go projects.

**Verification commands:**
```bash
gofumpt -l -e -w .
go vet ./...
staticcheck ./...
gosec -quiet ./...
go test -race ./...
```

### TypeScript / Vue (Default Frontend)

The rules include first-class TypeScript/Vue support. No changes needed.

**Verification commands:**
```bash
pnpm run lint --fix
npx vue-tsc --noEmit
pnpm run test
```

### Python

Add Python-specific verification to `4-verify.md`:

```bash
# Format
black .
isort .

# Lint
ruff check .
mypy .

# Security
bandit -r . -x tests

# Tests
pytest --cov=.
```

### Rust

Add Rust-specific verification to `4-verify.md`:

```bash
# Format
cargo fmt -- --check

# Lint
cargo clippy -- -D warnings

# Tests
cargo test

# Security
cargo audit
```

---

## Team Size Adaptation

### Solo Developer

The full setup works well for solo developers. Consider:
- Use `/quick-fix` for most changes (faster than full `/orchestrator`)
- Skip E2E tests unless building a user-facing feature
- Use `/audit` periodically instead of on every commit

### Small Team (2-5)

- Use `/orchestrator` for all features
- Use `/audit` for cross-review (one person's agent reviews another's code)
- ADRs are critical — they preserve decisions across team members
- Research logs prevent re-research by different team members

### Large Team (6+)

- Each sub-team may customize rules for their domain
- Use microservices layout with per-service rule overrides
- Enforce `/audit` before all merges to main
- Use CI/CD rules to automate verification in pipelines

---

## Removing Unnecessary Rules

If a rule doesn't apply to your project, you can safely delete it:

| If Your Project... | Safe to Remove |
|-------|----------------|
| Has no frontend | `accessibility-principles.md` |
| Has no database | `database-design-principles.md` |
| Has no CI/CD | `ci-cd-principles.md` |
| Is not a monorepo | Adjust `project-structure.md` (don't delete) |

**Never remove:**
- `rugged-software-constitution.md`
- `security-mandate.md`
- `code-completion-mandate.md`
- `rule-priority.md`

These form the foundation that makes the entire system work.

---

## Files to Edit

When adapting, these are the only files you typically need to change:

| File | What to Edit |
|------|-------------|
| `project-structure.md` | Directory layout, app paths |
| `4-verify.md` | Validation commands for your languages |
| `code-completion-mandate.md` | Quality commands for your stack |
| Add/remove rule files | Rules for your specific needs |
