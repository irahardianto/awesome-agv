---
name: nextjs-idioms
description: Next.js App Router, RSC, Server Actions, ISR. For React see react-idioms. For TypeScript see typescript-idioms.
paths:
  - "**/next.config.*"
  - "**/app/**/page.tsx"
  - "**/app/**/layout.tsx"
  - "**/app/**/route.ts"
  - "**/middleware.ts"
---

## Next.js Idioms and Patterns

Next.js (15+) rewards App Router, Server Components, and Server Actions. Idiomatic Next.js = server-first, streaming, edge-ready. Push logic to the server, keep the client thin.

> **Scope:** Next.js-specific patterns only. For React: `@.agents/skills/react-idioms/SKILL.md`. For TypeScript: `@.agents/skills/typescript-idioms/SKILL.md`. For project layout: `references/project-structure.md`.

---

### Server vs Client Component Decision Tree

1. **Keep Server Component (default)** when: fetching data, accessing DB/secrets, using heavy deps, or rendering static/cacheable content.
2. **Add `'use client'`** only when: using hooks (`useState`, `useEffect`), attaching event handlers, calling browser APIs (`window`, `localStorage`), or wrapping third-party client libs.
3. **Composition pattern** — server parent fetches, client child handles interactivity:
   ```tsx
   // app/tasks/page.tsx (Server)
   export default async function TasksPage() {
     const tasks = await getTasks();
     return <TaskBoard tasks={tasks} />;   // Client component for drag-and-drop
   }

   // features/task/components/task-board.tsx ('use client')
   export function TaskBoard({ tasks }: { tasks: Task[] }) {
     const [sorted, setSorted] = useState(tasks);
     return <DndContext>...</DndContext>;
   }
   ```
4. **Push `'use client'` as deep as possible** — never mark an entire page as client:
   ```tsx
   // ❌ 'use client' at page level loses all server benefits
   // ✅ Only wrap the interactive leaf:
   export default async function TasksPage() {
     const tasks = await getTasks();
     return (
       <>
         <TaskStats count={tasks.length} />   {/* Server */}
         <TaskFilterBar />                     {/* Client — has state */}
       </>
     );
   }
   ```

---

### App Router (Default)

1. **Server Components by default** — add `'use client'` only per the decision tree above.
2. **Layouts for shared UI** — never duplicate headers/sidebars.
3. **Loading/Error boundaries** per route segment:
   ```
   app/tasks/
   ├── page.tsx        # Server Component
   ├── loading.tsx     # Suspense fallback
   ├── error.tsx       # Error boundary ('use client')
   └── layout.tsx      # Shared layout
   ```
4. **Route groups** for organization without URL impact:
   ```
   app/
   ├── (auth)/login/page.tsx          # /login
   ├── (auth)/register/page.tsx       # /register
   └── (dashboard)/
       ├── layout.tsx                 # Shared dashboard layout
       ├── tasks/page.tsx             # /tasks
       └── settings/page.tsx          # /settings
   ```

---

### Parallel & Intercepting Routes

1. **`@slot` parallel routes** — render multiple pages simultaneously in the same layout:
   ```
   app/(dashboard)/
   ├── layout.tsx                          # Receives { children, modal }
   ├── @modal/default.tsx                  # Required: null fallback
   ├── @modal/(.)tasks/[id]/page.tsx       # Intercepting route → modal
   ├── tasks/page.tsx                      # Main content
   └── tasks/[id]/page.tsx                 # Full page (direct nav)
   ```
2. **Layout consumes parallel slots as props:**
   ```tsx
   export default function DashboardLayout({
     children, modal,
   }: {
     children: React.ReactNode; modal: React.ReactNode;
   }) {
     return <>{children}{modal}</>;
   }
   ```
3. **`default.tsx` is required** for every `@slot` — returns `null` when no active match.
4. **Intercepting conventions:** `(.)` same level, `(..)` one level up, `(...)` from root.

---

### Data Fetching

1. **Server Components fetch data directly** — no useEffect:
   ```tsx
   export default async function TasksPage() {
     const tasks = await db.tasks.findMany();
     return <TaskList tasks={tasks} />;
   }
   ```
2. **Server Actions for mutations:**
   ```tsx
   'use server';
   import { revalidatePath } from 'next/cache';
   import { redirect } from 'next/navigation';

   export async function createTask(formData: FormData) {
     const title = formData.get('title');
     if (!title || typeof title !== 'string') return { error: 'Title is required' };
     await db.tasks.create({ data: { title } });
     revalidatePath('/tasks');
     redirect('/tasks');
   }
   ```
3. **Parallel data fetching** — never sequential `await`:
   ```tsx
   const [user, tasks, stats] = await Promise.all([getUser(), getTasks(), getStats()]);
   ```

---

### Caching Strategy

1. **`fetch` cache options** — Next.js extends `fetch`:
   ```tsx
   await fetch(url, { cache: 'force-cache' });                // Cached indefinitely
   await fetch(url, { cache: 'no-store' });                   // Fresh every request
   await fetch(url, { next: { revalidate: 3600 } });          // Time-based ISR
   await fetch(url, { next: { tags: ['tasks'] } });           // Tag-based invalidation
   ```
2. **`'use cache'` directive for non-fetch data** (DB queries, computations — Next.js 15+):
   ```tsx
   'use cache';
   import { cacheLife, cacheTag } from 'next/cache';

   export async function getCachedTasks(userId: string) {
     cacheLife('minutes');               // Built-in profile: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'max'
     cacheTag('tasks', `user-${userId}`);
     return db.tasks.findMany({ where: { userId } });
   }
   ```
   > **Legacy:** `unstable_cache` (deprecated in Next.js 15+) works the same way but is being replaced by `'use cache'`.
3. **Per-route segment config:**
   ```tsx
   export const revalidate = 60;            // ISR every 60s
   export const dynamic = 'force-dynamic';  // Always fresh
   ```
4. **On-demand revalidation** in Server Actions:
   ```tsx
   'use server';
   export async function updateTask(id: string, data: TaskUpdate) {
     await db.tasks.update({ where: { id }, data });
     revalidateTag('tasks');       // Invalidate tagged fetches
     revalidatePath('/tasks');     // Rebuild the page
   }
   ```
5. **Decision tree:** Static → `force-cache`. User-specific → `no-store`. Semi-dynamic → `revalidate: N`. After mutation → `revalidateTag`/`revalidatePath`.

---

### API Route Handlers

1. **Export named functions per HTTP method** — validate with Zod, never trust raw input:
   ```tsx
   // app/api/tasks/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { z } from 'zod';

   const createTaskSchema = z.object({
     title: z.string().min(1).max(200),
     priority: z.enum(['low', 'medium', 'high']).default('medium'),
   });

   export async function GET(request: NextRequest) {
     const tasks = await db.tasks.findMany();
     return NextResponse.json(tasks);
   }

   export async function POST(request: NextRequest) {
     const parsed = createTaskSchema.safeParse(await request.json());
     if (!parsed.success) {
       return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
     }
     const task = await db.tasks.create({ data: parsed.data });
     return NextResponse.json(task, { status: 201 });
   }
   ```
2. **Dynamic route params** (Next.js 15+ — params is a Promise):
   ```tsx
   // app/api/tasks/[id]/route.ts
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;
     const task = await db.tasks.findUnique({ where: { id } });
     if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
     return NextResponse.json(task);
   }
   ```
3. **Streaming responses** for large datasets:
   ```tsx
   export async function GET() {
     const stream = new ReadableStream({
       async start(controller) {
         for await (const chunk of db.tasks.stream()) {
           controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
         }
         controller.close();
       },
     });
     return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
   }
   ```

---

### Middleware

1. **`middleware.ts` at project root** (or `src/middleware.ts`):
   ```tsx
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const token = request.cookies.get('session')?.value;
     if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     const response = NextResponse.next();
     response.headers.set('x-request-id', crypto.randomUUID());
     return response;
   }

   export const config = {
     matcher: ['/dashboard/:path*', '/api/:path*'],
   };
   ```
2. **Always scope with `config.matcher`** — never run middleware on every request.
3. **Edge Runtime constraints** — no Node.js APIs (`fs`, `path`). Web APIs only.
4. **Common patterns:** auth redirects, i18n locale detection, rate limiting headers, CSP injection.

---

### Environment Config

1. **`NEXT_PUBLIC_` prefix** exposes vars to client — use only for non-secrets:
   ```tsx
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;  // ✅ Client + server
   const dbUrl = process.env.DATABASE_URL;           // ✅ Server-only
   ```
2. **Type-safe env validation** — validate at startup, fail fast:
   ```tsx
   // src/lib/env.ts
   import { z } from 'zod';
   const envSchema = z.object({
     DATABASE_URL: z.string().url(),
     SESSION_SECRET: z.string().min(32),
     NEXT_PUBLIC_API_URL: z.string().url(),
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
   });
   export const env = envSchema.parse(process.env);
   ```
3. **Never use `process.env` in business logic** — import from validated `env` module.
4. **`.env.local`** for local overrides (gitignored). **`.env`** for defaults (committed, no secrets).

---

### Error Handling

1. **`error.tsx` boundary** (`'use client'` required) with `reset` for retry:
   ```tsx
   'use client';
   export default function ErrorBoundary({ error, reset }: {
     error: Error & { digest?: string }; reset: () => void;
   }) {
     return <div><h2>Something went wrong</h2><button onClick={reset}>Retry</button></div>;
   }
   ```
2. **`not-found.tsx`** for 404 — call `notFound()` when data is missing:
   ```tsx
   import { notFound } from 'next/navigation';
   export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
     const task = await getTask((await params).id);
     if (!task) notFound();
     return <TaskDetail task={task} />;
   }
   ```
3. **Server Action error returns** — don't throw, return typed discriminated unions:
   ```tsx
   'use server';
   type ActionResult = { success: true } | { success: false; error: string };
   export async function createTask(formData: FormData): Promise<ActionResult> {
     try {
       await db.tasks.create({ data: { title: formData.get('title') as string } });
       revalidatePath('/tasks');
       return { success: true };
     } catch { return { success: false, error: 'Failed to create task' }; }
   }
   ```

---

### Performance & SEO

1. **Static generation by default** — use `export const dynamic = 'force-dynamic'` only when data changes per request.
2. **Image optimization** — always use `next/image` with `width`, `height`, and `priority` for above-fold.
3. **Route prefetching** via `next/link`.
4. **Streaming with Suspense** for progressive rendering:
   ```tsx
   <Suspense fallback={<TasksSkeleton />}>
     <TaskList />  {/* Server Component — streams when ready */}
   </Suspense>
   ```
5. **Metadata API** for per-page SEO:
   ```tsx
   import type { Metadata } from 'next';
   export const metadata: Metadata = {
     title: 'Tasks | MyApp',
     description: 'Manage your tasks efficiently',
     openGraph: { title: 'Tasks', description: 'Manage your tasks efficiently', type: 'website' },
   };
   ```
6. **Dynamic metadata** for data-driven pages:
   ```tsx
   export async function generateMetadata({ params }: Props): Promise<Metadata> {
     const { id } = await params;
     const task = await getTask(id);
     return { title: task.title, description: task.description };
   }
   ```

---

### Anti-Patterns

- ❌ **`useEffect` for data fetching in Server Components** — fetch directly
- ❌ **`'use client'` on everything** — Server Components are the default for a reason
- ❌ **Fetching in layout.tsx then passing via props** — fetch in each component that needs data
- ❌ **`getServerSideProps` / `getStaticProps`** — App Router uses async components
- ❌ **Sequential `await` in Server Components** — use `Promise.all()` for parallel fetching
- ❌ **Large client bundles** — keep `'use client'` components small, push logic to server
- ❌ **Hardcoded `fetch` URLs** — use environment variables and centralized API client
- ❌ **Raw `process.env` everywhere** — validate once in `env.ts`, import the typed object
- ❌ **Unscoped middleware** — always use `config.matcher` to limit to relevant routes
- ❌ **Node.js APIs in middleware** — Edge Runtime supports Web APIs only

---

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: framework-specific patterns only.

1. **React Testing Library + Vitest/Jest** for component tests.
2. **`next/jest`** for jest configuration:
   ```javascript
   const nextJest = require('next/jest')({ dir: './' });
   module.exports = nextJest({ /* custom config */ });
   ```
3. **MSW (Mock Service Worker)** for Server Component data fetching mocks.
4. **Testing Server Actions** — import and call directly:
   ```tsx
   import { createTask } from '@/app/actions';
   it('returns error for empty title', async () => {
     const formData = new FormData();
     formData.set('title', '');
     const result = await createTask(formData);
     expect(result).toEqual({ error: 'Title is required' });
   });
   ```
5. **Testing API Route Handlers** — create Request and call handler:
   ```tsx
   import { GET } from '@/app/api/tasks/route';
   it('returns tasks as JSON', async () => {
     const request = new NextRequest('http://localhost/api/tasks');
     const response = await GET(request);
     expect(response.status).toBe(200);
   });
   ```
6. **Testing Middleware** — invoke with mocked NextRequest:
   ```tsx
   import { middleware } from '@/middleware';
   it('redirects unauthenticated users', () => {
     const request = new NextRequest('http://localhost/dashboard');
     const response = middleware(request);
     expect(response.status).toBe(307);
     expect(response.headers.get('location')).toContain('/login');
   });
   ```

---

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + `eslint-config-next` | Linting | `npx next lint` |
| TypeScript | Type checking | `npx tsc --noEmit` |

---

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- React Idioms @.agents/skills/react-idioms/SKILL.md
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Security Principles @.agents/rules/security-principles.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
- Project Structure — Next.js @.agents/skills/nextjs-idioms/references/project-structure.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Logging and Observability @.agents/rules/logging-and-observability-mandate.md
