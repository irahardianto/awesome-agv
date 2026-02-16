---
trigger: always_on
---

## Project Structure

> **This file is the SINGLE SOURCE OF TRUTH for project organization.**
> All other rules and workflows that reference paths should defer to this file.
> To adapt the setup for a different project type, edit this file only.

**Project Structure Philosophy:**

- **Organize by FEATURE, not by technical layer**  
- Each feature is a vertical slice
- Enables modular growth, clear boundaries, and independent deployability  

**Universal Rule: Context → Feature → Layer**

**1. Level 1: Repository Scope:** Root contains `apps/` grouping distinct applications (e.g., `apps/backend`, `apps/frontend`, `apps/mobile`).

**2. Level 2: Feature Organization**
   - **Rule:** Divide application into vertical business slices (e.g., `user/`, `order/`, `payment/`).
   - **Anti-Pattern:** Do NOT organize by technical layer (e.g., `controllers/`, `models/`, `services/`) at the top level.

### Layout Examples

**Monorepo Layout (Multi-Stack):**
Use this structure when managing monolithic full-stack applications with backend, frontend, mobile in a single repository.

**Clear Boundaries:** Backend business logic is isolated from Frontend UI logic, even if they share the same repo

```    
  apps/
    backend/                          # Backend application source code
      cmd/
        api/
          main.go                     # Entry point: Wires dependencies, router, starts server  
    internal/                         # Private application code
      platform/                       # Foundational technical concerns (The "Framework")
        database/                     # DB connection logic
        server/                       # HTTP server setup (Router, Middleware)
        logger/                       # Structured logging setup
      features/                       # Business Features (Vertical Slices)
        task/                         # Task management  
          # --- Interface Definition ---
          service.go                  # The public API of this feature (Service struct)
      
          # --- Delivery (HTTP) ---
          handler.go                  # HTTP Handlers
          handler_test.go             # Component tests (httptest + mock service)
      
          # --- Domain (Business Logic) ---
          logic.go                    # Core business logic methods
          logic_test.go               # Unit tests (Pure functions + mock storage)
          models.go                   # Domain structs (Task, NewTaskRequest)
          errors.go                   # Feature-specific errors
      
          # --- Storage (Data Access) ---
          storage.go                  # Storage Interface definition
          storage_pg.go               # Postgres implementation
          postgres_integration_test.go # Integration tests (Real DB/Testcontainers)
          storage_mock.go             # Mock implementation
          ...   
        order/                        # Order management
          handler.go
          logic.go
          storage.go  
        ...
    frontend/                         # Frontend application source code
      src/
        assets/                       # Fonts, Images
        features/                     # Business features organized as vertical slices. Each feature is SELF-CONTAINED.
          task/                       # Task management
            components/               # Task Feature-specific components go HERE, DON'T Put feature components in top-level folders
              TaskForm.vue
              TaskListItem.vue
              TaskFilters.vue
              TaskInput.vue
              TaskInput.spec.ts       # Component unit tests
            store/
              task.store.ts           # Pinia store
              task.store.spec.ts      # Store unit tests
            api/
              task.api.ts             # interface TaskAPI
              task.api.backend.ts     # Production implementation
              task.api.mock.ts        # Test implementation
            services/
              task.service.ts         # Business logic
              task.service.spec.ts    # Logic unit tests
            types/                    # TS Interfaces for tasks (e.g. CreateTaskDTO interfaces)
            composables/              # Task Feature-specific hooks (e.g. useTaskFilters.ts)
            index.ts                  # Public exports. Export ONLY what's needed by `views/`
          order/
        composables/                  # Global reactive logic (useAuth, useTheme)
        components/                   # Shared Component (Buttons, Inputs) - Dumb UI, No Domain Logic. DON'T Put feature components HERE
          ui/                         # UI Components (Atoms & Molecules) Pure, reusable UI primitives. NO domain logic, NO feature knowledge.
            BaseButton.vue
            BaseButton.spec.ts        # Unit tests for button states
            types.ts                  # Shared UI types/interfaces
            index.ts                  # Barrel export for easy imports
          layout/                     # Layout Components (Organisms) Composite UI structures that combine multiple UI components. Still reusable, but more complex.
            AppHeader.vue             # Application header with nav, logo, user menu
            AppSidebar.vue            # Sidebar navigation structure
            ErrorBoundary.vue         # Error display wrapper
            EmptyState.vue            # Empty list placeholder
        layouts/                      # App shells (Sidebar, Navbar wrappers)
          MainLayout.vue              # Contains Navbar, Sidebar, Footer
          AuthLayout.vue              # Minimal layout for Login/Register
        views/                        # Route entry points (The "Glue")
          HomeView.vue                # Imports from features/analytics
          TaskView.vue                # Imports from features/task
        utils/                        # Pure, stateless helper functions. No domain knowledge, no Vue reactivity, (e.g. date-fns wrappers, math).
        router/                       # Route definitions
        plugins/                      # Library configs (Axios, I18n)
        App.vue                       # Root component (hosts <router-view>)
        main.ts                       # Entry point (bootstraps plugins & mounts app)     
      ...
  infra/                              # Infrastructure & deployment
    docker-compose.yml                # Local development orchestration
    k8s/                              # Kubernetes manifests (if applicable)
    terraform/                        # Cloud infrastructure (if applicable)
  e2e/                                # Shared E2E suite
    api/
      task-api.e2e.test.ts            # Backend-only E2E
    ui/
      task-flow.e2e.test.ts           # Full-stack E2E
```
> This Feature/Domain/UI/API structure is framework-agnostic. It applies equally to React, Vue, Svelte, and Mobile (React Native/Flutter). 'UI' always refers to the framework's native component format (.tsx, .vue, .svelte, .dart).

---

### Flutter/Mobile Layout

Use this structure for Flutter or React Native mobile applications. The same vertical slice principle applies.

```
  apps/
    mobile/                           # Mobile application source code (Flutter)
      lib/
        core/                         # Foundational concerns (the "Framework")
          di/                         # Dependency injection setup (get_it, riverpod)
            injection.dart            # Service locator / provider registration
          network/                    # HTTP client setup, interceptors
            api_client.dart           # Dio/http client with base config
            api_interceptor.dart      # Auth token, logging interceptors
          storage/                    # Local storage abstractions
            local_storage.dart        # SharedPreferences / Hive wrapper
          theme/                      # App theming
            app_theme.dart            # ThemeData, color schemes
            app_typography.dart       # TextStyles, font families
          router/                     # Navigation / routing
            app_router.dart           # GoRouter / auto_route config
          constants/                  # App-wide constants

        features/                     # Business Features (Vertical Slices)
          task/                       # Task management feature
            # --- Presentation ---
            screens/
              task_list_screen.dart    # Full screen (route target)
              task_detail_screen.dart
            widgets/                  # Feature-specific widgets
              task_card.dart
              task_form.dart
              task_card_test.dart      # Widget tests
            # --- State Management ---
            state/
              task_cubit.dart          # BLoC/Cubit or Riverpod provider
              task_state.dart          # State classes (loading, loaded, error)
              task_cubit_test.dart     # Unit tests for state logic
            # --- Domain (Business Logic) ---
            models/
              task.dart               # Domain model (freezed/equatable)
              task.g.dart             # Generated code (json_serializable)
            logic/
              task_logic.dart         # Pure business rules
              task_logic_test.dart    # Unit tests (pure functions)
            # --- Data (I/O Abstraction) ---
            repository/
              task_repository.dart    # Abstract repository interface
              task_repository_impl.dart # Implementation (API + cache)
              task_repository_mock.dart # Mock for testing
            api/
              task_api.dart           # REST API calls (Dio)
              task_api_test.dart      # API integration tests
          auth/                       # Authentication feature
            ...
          settings/                   # Settings feature
            ...

        shared/                       # Shared across features
          widgets/                    # Reusable UI components (NO domain logic)
            app_button.dart
            app_text_field.dart
            loading_indicator.dart
          utils/                      # Pure utility functions
            date_formatter.dart
            validators.dart
          models/                     # Shared data models
            api_response.dart
            pagination.dart

      test/                           # Test directory (mirrors lib/)
        features/
          task/
            task_cubit_test.dart
            task_logic_test.dart
        integration_test/             # Integration / E2E tests
          task_flow_test.dart
      
      pubspec.yaml                    # Dependencies
      analysis_options.yaml           # Lint rules
```

> **Key differences from web frontend:**
> - `screens/` replaces `views/` — mobile uses screen-based navigation
> - `widgets/` replaces `components/` — Flutter's terminology
> - `state/` replaces `store/` — BLoC/Cubit/Riverpod instead of Pinia/Redux
> - `repository/` replaces `api/` — mobile often caches data locally
> - `core/di/` handles dependency injection (get_it, riverpod)
---

### Adapting for Different Project Types

To adapt this setup for a different project type, **edit this file only**:

| Project Type | What to Change |
|-------------|----------------|
| **Monorepo** (default) | Use as-is — `apps/backend/`, `apps/frontend/`, `apps/mobile/` |
| **Single backend** | Flatten to root: `cmd/`, `internal/` at project root (no `apps/` wrapper) |
| **Single frontend** | Flatten to root: `src/` at project root (no `apps/` wrapper) |
| **Single mobile** | Flatten to root: `lib/` at project root (no `apps/` wrapper) |
| **Microservices** | One directory per service under `apps/` (see notes below) |
| **Full-stack + mobile** | Use all three sections under `apps/` |

**Single-app projects** don't need the `apps/` directory — put `cmd/`, `internal/`, `src/`, or `lib/` directly at the project root. The internal structure (features, platform, etc.) stays the same.

**Multiple entry points (CLI, workers, etc.):** Use multiple directories under `cmd/`:
```
cmd/
  api/main.go         # HTTP server entry point
  cli/main.go         # CLI tool entry point
  worker/main.go      # Background worker entry point
```

**Microservices notes:**
- Each service is its own directory under `apps/` with its own `go.mod` and `Dockerfile`
- Each service follows the same backend layout internally (`cmd/`, `internal/features/`, `internal/platform/`)
- Add `shared/` at root for cross-service contracts (protobuf, shared types) — keep this minimal
- Services communicate via API calls or message queues, never direct imports