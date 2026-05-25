---
paths:
  - "**/*.jsx"
  - "**/react*"
---

## React Idioms and Patterns

React 18+ rewards composition, hooks, and server components. Idiomatic React = functional, performant, accessible.

> Scope: React-specific patterns. For TypeScript: `@.agents/rules/typescript-idioms-and-patterns.md`. For general frontend: `@.agents/skills/frontend-design/SKILL.md`.

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

3. **Error boundaries for graceful failure:**
   ```tsx
   <ErrorBoundary fallback={<ErrorMessage />}>
     <TaskList />
   </ErrorBoundary>
   ```

4. **Render props and children as functions** for flexible composition:
   ```tsx
   // ✅ Render prop for headless components
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

### Hooks

1. **Custom hooks for reusable logic:**
   ```tsx
   function useTask(id: string) {
     const { data, error, isLoading } = useSWR(`/api/tasks/${id}`, fetcher);
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

### State Management

1. **Local state first** (`useState`), lift only when needed.
2. **Server state**: TanStack Query / SWR — never in global state:
   ```tsx
   // ✅ Server state managed by TanStack Query
   function useTasks() {
     return useQuery({
       queryKey: ['tasks'],
       queryFn: () => api.getTasks(),
       staleTime: 5 * 60 * 1000, // 5 minutes
     });
   }
   ```
3. **Client state**: Context for small, Zustand/Jotai for complex.

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`.

1. **Error boundaries** for component tree errors:
   ```tsx
   class ErrorBoundary extends React.Component<Props, State> {
     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
       logger.error('component_error', { error, componentStack: info.componentStack });
     }

     render() {
       if (this.state.hasError) {
         return this.props.fallback;
       }
       return this.props.children;
     }
   }
   ```

2. **TanStack Query error handling:**
   ```tsx
   const { data, error, isError } = useQuery({
     queryKey: ['task', id],
     queryFn: () => api.getTask(id),
     retry: 3,
   });

   if (isError) return <ErrorMessage error={error} />;
   ```

3. **Form submission errors:**
   ```tsx
   const [error, setError] = useState<string | null>(null);

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     setError(null);
     try {
       await api.createTask(formData);
     } catch (err) {
       setError(err instanceof ApiError ? err.message : 'Something went wrong');
     }
   }
   ```

### Performance

1. **`React.memo`** only when profiling shows unnecessary re-renders.
2. **Code splitting**: `React.lazy` + `Suspense` for route-level splitting:
   ```tsx
   const TaskDashboard = React.lazy(() => import('./features/task/TaskDashboard'));

   function App() {
     return (
       <Suspense fallback={<PageSkeleton />}>
         <TaskDashboard />
       </Suspense>
     );
   }
   ```
3. **Virtual scrolling** for long lists (TanStack Virtual).
4. **Image optimization** — use `loading="lazy"` and `srcSet` for responsive images.

### Anti-Patterns

- ❌ **`useEffect` for data fetching** — use TanStack Query, SWR, or server components
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
- ❌ **Inline object/array literals in props** — creates new references every render (if causing perf issues)

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

React Testing Library + Vitest/Jest. Test behavior, not implementation.

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

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + eslint-plugin-react-hooks | Linting | `npx eslint .` |
| TypeScript | Type checking | `npx tsc --noEmit` |

### Related
- TypeScript Idioms @.agents/rules/typescript-idioms-and-patterns.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
