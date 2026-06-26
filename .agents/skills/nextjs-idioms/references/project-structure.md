## Next.js App Router Layout

Use this structure for Next.js applications using the App Router. The vertical slice principle applies — `app/` handles routing and page composition, `src/features/` contains business logic.

```
next-app/                               # Project root
  next.config.ts                        # Next.js configuration
  tsconfig.json                         # TypeScript config
  tailwind.config.ts                    # Tailwind (if used)
  middleware.ts                         # Edge middleware (auth, i18n, redirects)
  public/                              # Static assets (favicon, images, robots.txt)

  src/
    app/                               # Routing layer — pages, layouts, API routes
      layout.tsx                       # Root layout (html, body, providers)
      not-found.tsx                    # Global 404 page
      error.tsx                        # Global error boundary
      (auth)/                          # Route group — auth pages (no layout)
        login/page.tsx                 # /login
        register/page.tsx              # /register
      (dashboard)/                     # Route group — main app with shared layout
        layout.tsx                     # Dashboard shell (sidebar, nav)
        tasks/
          page.tsx                     # /tasks — Server Component (fetches + renders)
          loading.tsx                  # Suspense fallback for /tasks
          error.tsx                    # Error boundary for /tasks
          [id]/
            page.tsx                   # /tasks/:id — task detail
            not-found.tsx              # 404 for missing tasks
        @modal/                        # Parallel slot for modals
          default.tsx                  # Required: returns null when no modal active
          (.)tasks/[id]/page.tsx       # Intercepting route: task detail as modal
        settings/page.tsx              # /settings
      api/                             # API route handlers
        tasks/
          route.ts                     # GET /api/tasks, POST /api/tasks
          [id]/route.ts                # GET/PUT/DELETE /api/tasks/:id

    features/                          # Business logic (vertical slices)
      task/
        components/                    # Feature-specific client components
          task-board.tsx               # 'use client' — drag-and-drop board
          task-card.tsx                # 'use client' — interactive card
          task-form.tsx                # 'use client' — form with validation
        actions/                       # Server Actions
          create-task.ts               # 'use server' — mutation + revalidation
          update-task.ts
        services/
          task.service.ts              # Business logic orchestration (pure)
        types/
          task.types.ts                # Domain types (Task, TaskStatus, etc.)
        api/
          task.api.ts                  # Data access abstraction (interface)
          task.api.impl.ts             # Production implementation (DB/API calls)
          task.api.mock.ts             # Test implementation (in-memory)
        __tests__/
          task.service.test.ts         # Unit tests (mocked I/O)
          create-task.test.ts          # Server Action tests
      auth/
        ...
      settings/
        ...

    lib/                               # Shared utilities
      env.ts                           # Validated environment variables (Zod schema)
      db.ts                            # Database client (Prisma/Drizzle instance)
      utils.ts                         # General-purpose helpers

    infrastructure/                    # External service adapters
      email/
        email.adapter.ts               # Interface
        email.resend.ts                # Resend implementation
      storage/
        storage.adapter.ts             # Interface
        storage.s3.ts                  # S3 implementation
```

**Key Next.js conventions:**

- **`app/` is for routing only** — page files (`page.tsx`) fetch data and compose feature components. Business logic lives in `src/features/`.
- **`(group)/` route groups** organize routes without affecting the URL path. Use for auth vs dashboard layout splits.
- **`@slot/` parallel routes** enable simultaneous page rendering (e.g., modals alongside main content). Every slot needs a `default.tsx`.
- **`loading.tsx` and `error.tsx`** provide per-segment loading states and error recovery — always include them for user-facing routes.
- **Server Components are the default** — `page.tsx` and `layout.tsx` are server components unless explicitly marked `'use client'`.
- **Server Actions** (`'use server'`) live in `features/*/actions/` — co-located with the feature, not in `app/`.
- **`middleware.ts`** lives at the project root (or `src/` root) — scoped via `config.matcher` to specific route patterns.
- **`env.ts`** validates all environment variables at import time with Zod — business logic imports `env` instead of reading `process.env` directly.
- **Tests co-locate** with the code they test in `__tests__/` directories within each feature.

### Dependency Wiring

Next.js wires dependencies through Server Component composition — no DI container needed:

```tsx
// app/(dashboard)/tasks/page.tsx — wires the real implementation
import { PrismaTaskApi } from '@/features/task/api/task.api.impl';
import { TaskService } from '@/features/task/services/task.service';

export default async function TasksPage() {
  const service = new TaskService(new PrismaTaskApi());
  const tasks = await service.getActiveTasks();
  return <TaskBoard tasks={tasks} />;
}
```

### Related Principles
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- Next.js Idioms and Patterns @../SKILL.md (App Router, caching, middleware)
- Testing Strategy @.agents/rules/testing-strategy.md
