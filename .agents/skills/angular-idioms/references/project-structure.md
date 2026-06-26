## Angular Frontend Layout

Use this structure for Angular applications. The vertical slice principle applies — features are self-contained modules, not scattered across global folders.

```
  apps/
    frontend/                           # Angular application source code
      src/
        app/
          features/                     # Business features organized as vertical slices
            task/                       # Task management feature
              components/               # Feature-specific components — NOT in top-level shared/
                task-list.component.ts
                task-list.component.html
                task-list.component.spec.ts
                task-card.component.ts
                task-form.component.ts
              services/
                task.service.ts         # Feature service — orchestrates storage + logic
                task.service.spec.ts
              api/
                task.api.ts             # TaskAPI interface (getTasks, createTask, ...)
                task.api.backend.ts     # Production HttpClient-based implementation
                task.api.mock.ts        # In-memory test double (used in TestBed + unit tests)
              store/
                task.store.ts           # NgRx Signal Store (if needed beyond signals)
                task.store.spec.ts
              models/
                task.model.ts           # Domain interfaces (Task, CreateTaskRequest)
              guards/
                task-owner.guard.ts     # Feature-specific functional guards
              task.routes.ts            # Feature route definitions (TASK_ROUTES)
              index.ts                  # Public API — export only what other features need
            order/                      # Another vertical slice
              components/
              services/
              ...
          shared/                       # Cross-feature reusable UI — NO domain logic
            components/                 # Dumb UI components (buttons, inputs, modals)
              button/
                button.component.ts
                button.component.spec.ts
            pipes/                      # Shared pipes (date-format, truncate)
              date-format.pipe.ts
            directives/                 # Shared directives (highlight, tooltip)
              highlight.directive.ts
          core/                         # Singleton services and app-wide infrastructure
            interceptors/
              error.interceptor.ts      # HTTP error interceptor
              auth.interceptor.ts
            guards/
              auth.guard.ts             # Global auth guard
            services/
              logger.service.ts         # Structured logging
            error-handler.ts            # Global ErrorHandler implementation
          layouts/                      # App shell components
            main-layout.component.ts    # Navbar, sidebar, footer wrapper
            auth-layout.component.ts    # Minimal layout for login/register
          app.component.ts              # Root component (hosts <router-outlet>)
          app.config.ts                 # Application configuration (provideRouter, provideHttpClient)
          app.routes.ts                 # Top-level route definitions with lazy loading
        environments/
          environment.ts                # Runtime configuration
          environment.prod.ts
        main.ts                         # Bootstrap entry point
        styles.scss                     # Global styles
      angular.json                      # Angular CLI workspace configuration
      tsconfig.json                     # TypeScript configuration (strict: true)
      tsconfig.app.json
      tsconfig.spec.json
```

**Key Angular conventions:**
- `features/` for vertical slices — each feature exports only what others need via `index.ts`
- `api/` inside each feature — `task.api.ts` (interface), `task.api.backend.ts` (production HttpClient impl), `task.api.mock.ts` (test double). Services never import `HttpClient` directly.
- `shared/` for cross-feature dumb UI (pipes, directives, generic components) — NO domain logic
- `core/` for singleton services, interceptors, guards, and the global error handler
- `layouts/` for app shells — contain `<router-outlet>` and navigation structure
- Tests co-locate with source files (`*.spec.ts` beside `*.component.ts`)
- `app.config.ts` replaces `AppModule` — uses `provideRouter()`, `provideHttpClient()`, etc.
- Feature routes are defined in `feature.routes.ts` and lazy-loaded from `app.routes.ts`
- No `NgModules` — everything is standalone components + functional providers

### Related Principles
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- Angular Idioms and Patterns @../SKILL.md (signals, DI, testing, coding patterns)
- TypeScript Idioms and Patterns @.agents/skills/typescript-idioms/SKILL.md (type system)
