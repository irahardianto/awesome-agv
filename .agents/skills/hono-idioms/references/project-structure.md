## Hono Backend Layout

Use this structure for Hono backend applications. The vertical slice principle applies — features are modules, not technical layers.

```
src/
  index.ts                        # Entry point: wires dependencies, starts server
  app.ts                          # Hono app: composes feature routers, global middleware
  platform/                       # Foundational technical concerns (the "Framework")
    server.ts                     # Hono app factory, global middleware registration
    database.ts                   # DB connection (Drizzle / Prisma client)
    logger.ts                     # Structured logging setup (pino)
    config.ts                     # Environment config with Zod validation
  features/                       # Business Features (Vertical Slices)
    task/                         # Task management
      # --- Public API ---
      service.ts                  # TaskService class (public API of this feature)

      # --- Delivery (HTTP) ---
      router.ts                   # Hono sub-app with route definitions
      router.test.ts              # Handler tests (app.request + mock service)

      # --- Domain (Business Logic) ---
      logic.ts                    # Pure domain functions (no I/O)
      logic.test.ts               # Unit tests (pure functions — no mocks needed)
      types.ts                    # Domain types (Task, Priority, etc.)
      schemas.ts                  # Zod schemas for request/response validation

      # --- Storage (Data Access) ---
      storage.ts                  # TaskStorage interface
      storage.drizzle.ts          # Drizzle ORM implementation
      storage.mock.ts             # In-memory test implementation
      storage.drizzle.test.ts     # Integration tests (real DB via Testcontainers)

    order/                        # Order management
      service.ts
      router.ts
      logic.ts
      schemas.ts
      storage.ts
      storage.drizzle.ts
      storage.mock.ts
      ...
drizzle.config.ts                 # Drizzle ORM config (if using Drizzle)
tsconfig.json
package.json
```

**Key conventions:**

- **`src/index.ts`** is the only file that changes between runtimes — swap `@hono/node-server` for Bun's `export default`, Deno's `Deno.serve()`, or Cloudflare Workers' `export default`
- **`platform/`** holds technical infrastructure that features depend on (database, config, logging); features never import each other's `platform/` code
- **Feature modules** are self-contained vertical slices — each exports a `Hono` sub-app from `router.ts` and a `Service` class from `service.ts`
- **`schemas.ts`** contains Zod schemas used both for request validation (`zValidator`) and for inferring TypeScript types — single source of truth, no type duplication
- **Tests co-locate** with the code they test (`.test.ts` suffix) except E2E tests which go in a top-level `e2e/` directory
- **`storage.mock.ts`** is a production-quality in-memory implementation, not a `vi.fn()` stub — it is the recommended test double for unit tests

### Runtime-Agnostic Note

The entire layout is portable across Node.js, Bun, Deno, and Cloudflare Workers. Only `src/index.ts` (the entry point adapter) differs per runtime. All feature code, middleware, and tests remain identical.

### Related Principles
- Project Structure @.agents/rules/project-structure.md (core philosophy)
- Hono Idioms and Patterns @../SKILL.md (coding idioms, middleware, validation)
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md (language fundamentals)
