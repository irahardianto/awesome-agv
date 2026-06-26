---
name: react-idioms
description: React hooks, Suspense, Server Components, React 19 patterns. For TypeScript see typescript-idioms.
paths:
  - "**/*.jsx"
  - "**/*.tsx"
---

## React Idioms and Patterns

### Core Philosophy

React 19 rewards composition, hooks, and server-aware patterns. Idiomatic React = functional, performant, accessible. Prefer co-located features, custom hooks for logic reuse, and server state libraries over hand-rolled fetch logic.

> **Scope:** This file covers React-specific coding idioms for components, hooks, state, routing, and forms. For TypeScript type system patterns, see `@.agents/skills/typescript-idioms/SKILL.md`. For file and folder layout, see `references/project-structure.md`. For general frontend design, see `@.agents/skills/frontend-design/SKILL.md`.

---

### Component Patterns

1. **Functional components only** — no class components in new code.
2. **Composition over inheritance:**
   ```tsx
   // ✅ Compound components
   <Card>
     <Card.Header>{title}</Card.Header>
     <Card.Body>{children}</Card.Body>
   </Card>
   ```

3. **Error boundaries** for graceful failure — wrap feature subtrees to catch render errors.

4. **Render props** for flexible, headless composition:
   ```tsx
   <DataLoader url="/api/tasks">
     {({ data, isLoading, error }) => {
       if (isLoading) return <Skeleton />;
       if (error) return <ErrorMessage error={error} />;
       return <TaskList tasks={data} />;
     }}
   </DataLoader>
   ```

5. **Props typing — always explicit:**
   ```tsx
   // ✅ Typed props with defaults
   interface TaskCardProps {
     task: Task;
     onComplete?: (taskId: string) => void;
     variant?: 'compact' | 'expanded';
   }

   export function TaskCard({ task, onComplete, variant = 'compact' }: TaskCardProps) {
     // ...
   }
   ```

6. **One concern per component** — if a component exceeds ~100 JSX lines, extract a sub-component.

---

### Hooks

1. **Custom hooks for reusable logic:**
   ```tsx
   function useTask(id: string) {
     const { data, error, isLoading } = useQuery({
       queryKey: ['task', id],
       queryFn: () => taskApi.getTask(id),
     });
     return { task: data, error, isLoading };
   }
   ```

2. **`useMemo`/`useCallback` only for measured performance issues** — not by default.

3. **`useEffect` cleanup** — always return cleanup function for subscriptions:
   ```tsx
   useEffect(() => {
     const controller = new AbortController();

     fetchTasks(controller.signal).then(setTasks);

     return () => controller.abort(); // ✅ Cleanup on unmount
   }, []);
   ```

4. **`useRef` for values that don't trigger re-renders:**
   ```tsx
   // ✅ Timer ref — doesn't cause re-render
   const timerRef = useRef<ReturnType<typeof setInterval>>();

   useEffect(() => {
     timerRef.current = setInterval(pollStatus, 5000);
     return () => clearInterval(timerRef.current);
   }, []);
   ```

---

### React 19 Patterns

1. **`use()` hook** — read resources, promises, and context directly in render:
   ```tsx
   // ✅ Read a promise during render (replaces useEffect + useState)
   function TaskDetail({ taskPromise }: { taskPromise: Promise<Task> }) {
     const task = use(taskPromise);
     return <h1>{task.title}</h1>;
   }

   // ✅ Read context without useContext
   function TaskActions() {
     const theme = use(ThemeContext);
     return <button className={theme.primaryBtn}>Save</button>;
   }
   ```

2. **`useActionState`** for form actions (replaces `useFormState`):
   ```tsx
   // ✅ Server-aware form with pending state
   async function createTask(_prev: State, formData: FormData) {
     const result = await api.createTask(Object.fromEntries(formData));
     return result.error ? { error: result.error } : { success: true };
   }

   function TaskForm() {
     const [state, formAction, isPending] = useActionState(createTask, { error: null });
     return (
       <form action={formAction}>
         <input name="title" required />
         {state.error && <p className="error">{state.error}</p>}
         <button disabled={isPending}>{isPending ? 'Saving…' : 'Create'}</button>
       </form>
     );
   }
   ```

3. **`useOptimistic`** for instant UI feedback:
   ```tsx
   const [optimisticTasks, addOptimistic] = useOptimistic(
     tasks,
     (state, newTask: Task) => [...state, newTask],
   );
   // Call addOptimistic(tempTask) before await api.createTask(tempTask)
   ```

4. **`<form action={fn}>`** for progressive enhancement — works before JS loads (see `useActionState` example above).

---

### Form Handling

1. **React Hook Form + Zod** for validated forms:
   ```tsx
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';

   const taskSchema = z.object({
     title: z.string().min(1, 'Title is required').max(200),
     priority: z.enum(['low', 'medium', 'high']),
   });
   type TaskFormData = z.infer<typeof taskSchema>;

   function TaskForm({ onSubmit }: { onSubmit: (data: TaskFormData) => Promise<void> }) {
     const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
       resolver: zodResolver(taskSchema),
     });
     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         <input {...register('title')} />
         {errors.title && <p>{errors.title.message}</p>}
         <button type="submit">Create</button>
       </form>
     );
   }
   ```

2. **Controlled vs uncontrolled decision:**
   - Use **uncontrolled** (`register`) for simple forms — better performance, less boilerplate
   - Use **controlled** (`Controller`) when the UI must react to every keystroke (live previews, dependent fields)

---

### Routing

1. **React Router 7 data patterns** — loaders and actions:
   ```tsx
   // ✅ Route-level data loading
   export async function loader({ params }: LoaderFunctionArgs) {
     return taskApi.getTask(params.id!);
   }

   export function TaskPage() {
     const task = useLoaderData<typeof loader>();
     return <TaskDetail task={task} />;
   }
   ```

2. **TanStack Router** for type-safe routes:
   ```tsx
   const taskRoute = createRoute({
     getParentRoute: () => rootRoute,
     path: '/tasks/$taskId',
     loader: ({ params }) => taskApi.getTask(params.taskId),
     component: TaskPage,
   });
   ```

3. **Route-level code splitting** — always lazy-load route components with `React.lazy` + `Suspense` (see Performance section).

---

### State Management

> Decision tree: `useState` → `useContext` → Zustand → TanStack Query (for server state)

1. **Local state first** (`useState`), lift only when shared by siblings.
2. **Server state**: TanStack Query — never in global state:
   ```tsx
   // ✅ Server state managed by TanStack Query
   function useTasks() {
     return useQuery({
       queryKey: ['tasks'],
       queryFn: () => taskApi.getTasks(),
       staleTime: 5 * 60 * 1000,
     });
   }
   ```
3. **Client state**: Context for small/infrequent updates, Zustand/Jotai for complex/frequent:
   ```tsx
   // ✅ features/task/store/task.store.ts — Zustand for UI-only state
   import { create } from 'zustand';

   interface TaskUIState {
     selectedId: string | null;
     filter: 'all' | 'active' | 'done';
     selectTask: (id: string | null) => void;
     setFilter: (f: TaskUIState['filter']) => void;
   }

   export const useTaskUIStore = create<TaskUIState>((set) => ({
     selectedId: null,
     filter: 'all',
     selectTask: (id) => set({ selectedId: id }),
     setFilter: (filter) => set({ filter }),
   }));

   // Usage — client UI state only; server data stays in TanStack Query
   function TaskToolbar() {
     const { filter, setFilter } = useTaskUIStore();
     return <FilterBar value={filter} onChange={setFilter} />;
   }
   ```
4. **I/O isolation** — abstract API behind an interface for testability:
   ```tsx
   // ✅ features/task/api/task.api.ts — interface
   export interface TaskAPI {
     getTasks(): Promise<Task[]>;
     createTask(data: CreateTaskDTO): Promise<Task>;
   }

   // ✅ features/task/api/task.api.backend.ts — production (implements TaskAPI with fetch)
   // ✅ features/task/api/task.api.mock.ts — test (implements TaskAPI with in-memory data)
   ```

---

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`.

1. **Error boundaries** for component tree errors — use `react-error-boundary` or a custom class component:
   ```tsx
   // ✅ Wrap feature subtrees, log in componentDidCatch
   <ErrorBoundary fallback={<ErrorMessage />}>
     <TaskList />
   </ErrorBoundary>
   ```

2. **TanStack Query** — use `retry`, `isError`, and `error` from query result (see State Management).

3. **Log errors** in `componentDidCatch` with `correlationId` and `componentStack` — never swallow silently.

---

### Performance

1. **`React.memo`** only when profiling shows unnecessary re-renders.
2. **Code splitting**: `React.lazy` + `Suspense` for route-level splitting:
   ```tsx
   import { lazy, Suspense } from 'react';

   const TaskPage    = lazy(() => import('./features/task/TaskPage'));
   const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));

   function AppRoutes() {
     return (
       <Suspense fallback={<PageSkeleton />}>
         <Routes>
           <Route path="/tasks"   element={<TaskPage />} />
           <Route path="/profile" element={<ProfilePage />} />
         </Routes>
       </Suspense>
     );
   }
   ```
3. **Virtual scrolling** for long lists (TanStack Virtual).
4. **Image optimization** — use `loading="lazy"` and `srcSet` for responsive images.
5. **Avoid inline object/array literals in props** if causing re-render issues — hoist or `useMemo`.

---

### Anti-Patterns

- ❌ **`useEffect` for data fetching** — use TanStack Query, SWR, or loaders
- ❌ **Prop drilling through 3+ levels** — use Context or state manager
- ❌ **`key={index}` on dynamic lists** — use stable, unique identifiers
- ❌ **`useMemo`/`useCallback` on everything** — premature optimization
- ❌ **State for derived data** — compute during render:
  ```tsx
  // ❌ Unnecessary state
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  useEffect(() => {
    setFilteredTasks(tasks.filter(t => t.status === filter));
  }, [tasks, filter]);

  // ✅ Computed during render — no extra state
  const filteredTasks = tasks.filter(t => t.status === filter);
  ```
- ❌ **Direct DOM manipulation** — use refs and React's render cycle
- ❌ **`useFormState`** — replaced by `useActionState` in React 19
- ❌ **Global state for server data** — use TanStack Query/SWR instead

---

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: React-specific patterns only.

React Testing Library + Vitest/Jest. Test behavior, not implementation.

1. **Component rendering and interaction:**
   ```tsx
   import { render, screen, fireEvent } from '@testing-library/react';

   test('displays task title', () => {
     render(<TaskCard task={mockTask} />);
     expect(screen.getByText('Deploy fix')).toBeInTheDocument();
   });

   test('calls onComplete when button clicked', async () => {
     const onComplete = vi.fn();
     render(<TaskCard task={mockTask} onComplete={onComplete} />);

     await fireEvent.click(screen.getByRole('button', { name: /complete/i }));

     expect(onComplete).toHaveBeenCalledWith(mockTask.id);
   });
   ```

2. **Provider wrapper for tests** — wrap components that depend on providers:
   ```tsx
   function createTestWrapper() {
     const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
     return ({ children }: { children: React.ReactNode }) => (
       <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
     );
   }

   render(<TaskList />, { wrapper: createTestWrapper() });
   ```

3. **Testing custom hooks** with `renderHook`:
   ```tsx
   import { renderHook, waitFor } from '@testing-library/react';

   test('useTask returns task data', async () => {
     const { result } = renderHook(() => useTask('1'), {
       wrapper: createTestWrapper(),
     });

     await waitFor(() => expect(result.current.task).toBeDefined());
     expect(result.current.task?.title).toBe('Deploy fix');
   });
   ```

4. **MSW for API mocking** — intercept at the network level:
   ```tsx
   import { http, HttpResponse } from 'msw';
   import { setupServer } from 'msw/node';

   const server = setupServer(
     http.get('/api/tasks', () =>
       HttpResponse.json([{ id: '1', title: 'Deploy fix', status: 'todo' }])
     ),
   );

   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

---

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + eslint-plugin-react-hooks | Linting | `npx eslint .` |
| TypeScript | Type checking | `npx tsc --noEmit` |

---

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- React Project Structure @.agents/skills/react-idioms/references/project-structure.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Security Principles @.agents/rules/security-principles.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Logging and Observability @.agents/rules/logging-and-observability-mandate.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
