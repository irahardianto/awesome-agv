---
name: hono-idioms
description: Hono HTTP framework patterns — routing, middleware, Zod validation, RPC client. For TypeScript see typescript-idioms.
paths:
  - "**/wrangler.toml"
---

## Hono Idioms and Patterns

### Core Philosophy

Hono rewards thin handlers, middleware composition, multi-runtime portability, and end-to-end type safety. Idiomatic Hono = typed routes, validator middleware, RPC client — no code generation needed.

> **Scope:** Hono-specific patterns. For TypeScript fundamentals: @.agents/skills/typescript-idioms/SKILL.md. For project structure: @.agents/skills/hono-idioms/references/project-structure.md.

### Router and Route Organization

1. **Create apps with `new Hono()` and method routing:**
   ```typescript
   // ✅ Group by resource, compose with app.route()
   const tasks = new Hono()
       .get('/', listTasks)
       .post('/', createTask)
       .get('/:id', getTask)
       .put('/:id', updateTask)
       .delete('/:id', deleteTask);

   const app = new Hono()
       .route('/api/tasks', tasks)
       .route('/api/users', users);
   ```

2. **Use `app.route('/prefix', subApp)` to compose sub-routers** — each feature exports its own `Hono` instance.

3. **`app.basePath('/api/v1')`** for API versioning — applied once at root level.

4. **`app.all('*', handler)`** for catch-all fallback routes.

5. **Path parameters** use `:name` syntax — accessed via `c.req.param('name')`.

### Context (`c`)

1. **Response helpers — always use typed helpers, never raw `Response`:**
   ```typescript
   // ✅ c.json(), c.text(), c.html(), c.redirect(), c.notFound()
   app.get('/tasks/:id', async (c) => {
       const task = await taskService.find(c.req.param('id'));
       return c.json(task);
   });
   ```

2. **Request data:** `c.req.param('id')` (path), `c.req.query('page')` (query string), `c.req.header('Authorization')` (header), `await c.req.json()` (body — prefer `zValidator` instead).

3. **Request-scoped typed variables with `c.set()` / `c.get()`:**
   ```typescript
   type Env = { Variables: { userId: string; requestId: string } };
   const app = new Hono<Env>();

   app.use(async (c, next) => {
       c.set('requestId', crypto.randomUUID());
       await next();
   });
   app.get('/me', (c) => c.json({ id: c.get('userId') })); // fully typed
   ```

### Middleware

1. **Built-in middleware** — `cors()`, `logger()`, `secureHeaders()`, `compress()`, `timing()`, `prettyJSON()` (each imported from `hono/<name>`):
   ```typescript
   app.use('*', logger(), secureHeaders(), compress());
   ```

2. **Global vs scoped middleware:**
   ```typescript
   // ✅ Global — applies to all routes
   app.use('*', cors());

   // ✅ Scoped — applies only to /api/* routes
   app.use('/api/*', authMiddleware);
   ```

3. **Custom middleware with `createMiddleware<>()`:**
   ```typescript
   import { createMiddleware } from 'hono/factory';

   type AuthEnv = { Variables: { userId: string } };

   const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
       const token = c.req.header('Authorization')?.replace('Bearer ', '');
       if (!token) throw new HTTPException(401, { message: 'Unauthorized' });
       const payload = await verifyToken(token);
       c.set('userId', payload.sub);
       await next();
   });
   ```

4. **Middleware ordering matters** — auth before route handlers, logging outermost.

### Validation

1. **`@hono/zod-validator` for type-safe request validation:**
   ```typescript
   import { zValidator } from '@hono/zod-validator';
   import { z } from 'zod';

   const CreateTaskSchema = z.object({
       title: z.string().min(1).max(200),
       priority: z.enum(['low', 'medium', 'high']),
   });

   // ✅ Compose multiple validators — validated data is fully typed
   app.post('/tasks', zValidator('json', CreateTaskSchema), async (c) => {
       const body = c.req.valid('json');   // { title: string; priority: 'low'|'medium'|'high' }
       const task = await taskService.create(body);
       return c.json(task, 201);
   });

   app.get('/tasks/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
       const task = await taskService.find(c.req.valid('param').id);
       return c.json(task);
   });
   ```

2. **Validate all input sources:** `zValidator('json', ...)`, `zValidator('param', ...)`, `zValidator('query', ...)`, `zValidator('header', ...)`.

### Error Handling

1. **`app.onError()` for global error handling:**
   ```typescript
   import { HTTPException } from 'hono/http-exception';

   app.onError((err, c) => {
       if (err instanceof HTTPException) {
           return c.json({ error: err.message }, err.status);
       }
       console.error(err);
       return c.json({ error: 'Internal Server Error' }, 500);
   });
   ```

2. **`HTTPException` for typed HTTP errors:**
   ```typescript
   // ✅ Throw in handlers or middleware — caught by onError
   if (!task) throw new HTTPException(404, { message: `Task ${id} not found` });
   ```

3. **`app.notFound()` for custom 404 handling:**
   ```typescript
   app.notFound((c) => c.json({ error: 'Not Found' }, 404));
   ```

### RPC Client

1. **End-to-end type-safe API calls — no code generation:**
   ```typescript
   // server.ts — chain routes and export the type
   const routes = app
       .get('/tasks', async (c) => c.json(await taskService.list()))
       .post('/tasks', zValidator('json', CreateTaskSchema), async (c) => {
           return c.json(await taskService.create(c.req.valid('json')), 201);
       });
   export type AppType = typeof routes;

   // client.ts — fully typed, changes propagate compile errors automatically
   import { hc } from 'hono/client';
   import type { AppType } from './server';
   const client = hc<AppType>('http://localhost:3000');
   const res = await client.tasks.$post({ json: { title: 'New', priority: 'high' } });
   const task = await res.json(); // fully typed
   ```

### Multi-Runtime

1. **Only the entry point differs — all handler/middleware code is runtime-agnostic:**
   ```typescript
   // Node.js:             serve({ fetch: app.fetch, port: 3000 })  // @hono/node-server
   // Bun / CF Workers:    export default app;
   // Deno:                Deno.serve(app.fetch);
   ```

2. **Never use runtime-specific APIs in handlers** — isolate them in `platform/` adapters.

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: Hono-specific patterns only.

1. **`app.request()` — test handlers without starting a server:**
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { app } from './app';

   describe('GET /api/tasks/:id', () => {
       it('returns 200 with task data', async () => {
           const res = await app.request('/api/tasks/abc-123');
           expect(res.status).toBe(200);
           expect((await res.json()).id).toBe('abc-123');
       });

       it('returns 404 for unknown task', async () => {
           const res = await app.request('/api/tasks/unknown');
           expect(res.status).toBe(404);
       });
   });

   // POST with body
   const res = await app.request('/api/tasks', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ title: 'Test', priority: 'high' }),
   });
   ```

2. **Mock services via dependency injection** — create the `Hono` app with test doubles in the test setup, not by mocking modules.


### Streaming

1. **`streamText` for plain-text / LLM token streaming:**
   ```typescript
   import { streamText } from 'hono/streaming';

   app.get('/stream/tokens', (c) =>
     streamText(c, async (stream) => {
       stream.onAbort(() => console.log('client disconnected'));
       for (const chunk of ['Hello', ' ', 'World']) {
         await stream.write(chunk);
         await stream.sleep(100);
       }
     })
   );
   ```

2. **`streamSSE` for Server-Sent Events:**
   ```typescript
   import { streamSSE } from 'hono/streaming';

   app.get('/sse', (c) =>
     streamSSE(c, async (stream) => {
       stream.onAbort(() => cleanup());
       let id = 0;
       while (true) {
         await stream.writeSSE({
           data: JSON.stringify({ ts: Date.now() }),
           event: 'tick',
           id: String(id++),
         });
         await stream.sleep(1000);
       }
     })
   );
   ```

3. **`stream` for binary or NDJSON (newline-delimited JSON):**
   ```typescript
   import { stream } from 'hono/streaming';

   app.get('/stream/tasks', (c) =>
     stream(c, async (stream) => {
       stream.onAbort(() => cleanup());
       const tasks = await taskService.list();
       for (const task of tasks) {
         await stream.write(JSON.stringify(task) + '\n');
       }
     })
   );
   ```

4. **Always call `stream.onAbort()`** to release resources when the client disconnects — without it, the generator keeps running after the connection drops.

---

### Anti-Patterns

- ❌ **Business logic in handlers** — extract to a service/logic layer; handlers only validate, delegate, respond
- ❌ **Manual `JSON.parse(await c.req.text())`** — use `c.req.json()` or `zValidator('json', schema)` for type-safe parsing
- ❌ **Untyped context variables** — always use `Hono<{ Variables: ... }>` generics for `c.set()`/`c.get()`
- ❌ **Ignoring middleware ordering** — auth must run before route handlers; logging outermost
- ❌ **`app.use()` without path scope** — use `app.use('/api/*', ...)` when middleware should be scoped, not global
- ❌ **Runtime-specific code in handlers** — use adapters at the entry point only; handlers must be portable

### Formatting and Static Analysis

> Same tooling as TypeScript. See @.agents/skills/typescript-idioms/SKILL.md.

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- API Design Principles @.agents/rules/api-design-principles.md
- Security Principles @.agents/rules/security-principles.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Logging and Observability Mandate @.agents/rules/logging-and-observability-mandate.md
- Logging Implementation @.agents/skills/logging-implementation/SKILL.md
