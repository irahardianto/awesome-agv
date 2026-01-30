---
trigger: always_on
---

## Project Structure

**Project Structure Philosophy:**

- **Organize by FEATURE, not by technical layer**  
- Each feature is a vertical slice
- Enables modular growth, clear boundaries, and independent deployability  

**Universal Rule: Context → Feature → Layer**

**1. Level 1: Repository Scope:** Root contains `apps/` grouping distinct applications (e.g., `apps/backend`, `apps/frontend`).

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
  e2e/                                # Shared E2E suite
    api/
      task-api.e2e.test.ts            # Backend-only E2E
    ui/
      task-flow.e2e.test.ts           # Full-stack E2E
```
> This Feature/Domain/UI/API structure is framework-agnostic. It applies equally to React, Vue, Svelte, and Mobile (React Native/Flutter). 'UI' always refers to the framework's native component format (.tsx, .vue, .svelte, .dart).