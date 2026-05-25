---
paths:
  - "**/next.config.*"
  - "**/app/**/page.tsx"
  - "**/app/**/layout.tsx"
---

## Next.js Idioms and Patterns

Next.js (14+) rewards App Router, Server Components, and Server Actions. Idiomatic Next.js = server-first, streaming, edge-ready.

> Scope: Next.js-specific patterns. For React: `@.agents/skills/react-idioms/SKILL.md`. For TypeScript: `@.agents/rules/typescript-idioms-and-patterns.md`.

### App Router (Default)

1. **Server Components by default** — add `'use client'` only when needed (hooks, events, browser APIs).
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
   ├── (auth)/
   │   ├── login/page.tsx       # /login
   │   └── register/page.tsx    # /register
   └── (dashboard)/
       ├── layout.tsx           # Shared dashboard layout
       ├── tasks/page.tsx       # /tasks
       └── settings/page.tsx    # /settings
   ```

### Data Fetching

1. **Server Components fetch data directly** — no useEffect:
   ```tsx
   // app/tasks/page.tsx (Server Component)
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
     if (!title || typeof title !== 'string') {
       return { error: 'Title is required' };
     }

     await db.tasks.create({ data: { title } });
     revalidatePath('/tasks');
     redirect('/tasks');
   }
   ```

3. **`revalidatePath`/`revalidateTag`** for cache invalidation.
4. **Parallel data fetching** in Server Components:
   ```tsx
   export default async function DashboardPage() {
     // ✅ Parallel — fetches run simultaneously
     const [user, tasks, stats] = await Promise.all([
       getUser(),
       getTasks(),
       getStats(),
     ]);

     return <Dashboard user={user} tasks={tasks} stats={stats} />;
   }
   ```

### Error Handling

1. **`error.tsx` boundary** for route-level errors:
   ```tsx
   'use client';

   export default function ErrorBoundary({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     return (
       <div>
         <h2>Something went wrong</h2>
         <p>{error.message}</p>
         <button onClick={reset}>Try again</button>
       </div>
     );
   }
   ```

2. **`not-found.tsx`** for 404 handling:
   ```tsx
   import { notFound } from 'next/navigation';

   export default async function TaskPage({ params }: { params: { id: string } }) {
     const task = await getTask(params.id);
     if (!task) notFound();
     return <TaskDetail task={task} />;
   }
   ```

3. **Server Action error returns** — don't throw, return error objects:
   ```tsx
   'use server';

   type ActionResult = { success: true } | { success: false; error: string };

   export async function createTask(formData: FormData): Promise<ActionResult> {
     try {
       await db.tasks.create({ data: { title: formData.get('title') as string } });
       revalidatePath('/tasks');
       return { success: true };
     } catch (error) {
       return { success: false, error: 'Failed to create task' };
     }
   }
   ```

### Performance

1. **Static generation by default** — dynamic only when needed:
   ```tsx
   // ✅ Static — generated at build time
   export default async function AboutPage() { ... }

   // ✅ Dynamic — when data changes per request
   export const dynamic = 'force-dynamic';
   // or use cookies(), headers(), searchParams
   ```

2. **Image optimization**: `next/image` — always:
   ```tsx
   import Image from 'next/image';

   <Image
     src="/hero.jpg"
     alt="Hero image"
     width={1200}
     height={630}
     priority  // Above-the-fold images
   />
   ```

3. **Route prefetching** via `next/link`.
4. **Streaming with Suspense** for progressive rendering:
   ```tsx
   import { Suspense } from 'react';

   export default function DashboardPage() {
     return (
       <>
         <h1>Dashboard</h1>
         <Suspense fallback={<TasksSkeleton />}>
           <TaskList />  {/* Server Component — streams when ready */}
         </Suspense>
       </>
     );
   }
   ```

### SEO

1. **Metadata API** for per-page SEO:
   ```tsx
   import type { Metadata } from 'next';

   export const metadata: Metadata = {
     title: 'Tasks | MyApp',
     description: 'Manage your tasks efficiently',
     openGraph: {
       title: 'Tasks',
       description: 'Manage your tasks efficiently',
       type: 'website',
     },
   };
   ```

2. **Dynamic metadata** for data-driven pages:
   ```tsx
   export async function generateMetadata({ params }: Props): Promise<Metadata> {
     const task = await getTask(params.id);
     return {
       title: task.title,
       description: task.description,
     };
   }
   ```

### Anti-Patterns

- ❌ **`useEffect` for data fetching in Server Components** — fetch directly
- ❌ **`'use client'` on everything** — Server Components are the default for a reason
- ❌ **Fetching in layout.tsx then passing via props** — fetch in each page/component that needs data
- ❌ **`getServerSideProps` / `getStaticProps`** — App Router uses async components
- ❌ **Sequential `await` in Server Components** — use `Promise.all()` for parallel fetching
- ❌ **Large client bundles** — keep `'use client'` components small, push logic to server
- ❌ **Hardcoded `fetch` URLs** — use environment variables and centralized API client

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: framework-specific patterns only.

1. **React Testing Library + Vitest/Jest** for component tests.
2. **`next/jest`** for jest configuration:
   ```javascript
   const nextJest = require('next/jest')({ dir: './' });
   module.exports = nextJest({ /* custom config */ });
   ```
3. **MSW (Mock Service Worker)** for Server Component data fetching mocks.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + `eslint-config-next` | Linting | `npx next lint` |
| TypeScript | Type checking | `npx tsc --noEmit` |

### Related
- React Idioms @.agents/skills/react-idioms/SKILL.md
- TypeScript Idioms @.agents/rules/typescript-idioms-and-patterns.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
