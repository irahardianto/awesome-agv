---
paths:
  - "**/*.component.ts"
  - "**/angular.json"
---

## Angular Idioms and Patterns

Angular (17+) rewards signals, standalone components, and reactive patterns. Idiomatic Angular = typed, modular, RxJS-aware.

> Scope: Angular-specific patterns. For TypeScript: `@.agents/rules/typescript-idioms-and-patterns.md`.

### Standalone Components (Default)

1. **Standalone components** — no NgModules for new components:
   ```typescript
   @Component({
     selector: 'app-task-list',
     standalone: true,
     imports: [CommonModule, TaskCardComponent],
     template: `<app-task-card *ngFor="let task of tasks()" [task]="task" />`
   })
   export class TaskListComponent {
     tasks = signal<Task[]>([]);
   }
   ```

2. **Lazy-load routes** with `loadComponent`:
   ```typescript
   export const routes: Routes = [
     {
       path: 'tasks',
       loadComponent: () => import('./features/task/task-list.component')
         .then(m => m.TaskListComponent),
     },
   ];
   ```

### Signals (17+)

1. **Signals for synchronous state** — prefer over BehaviorSubject for component state.
2. **`computed`** for derived state. **`effect`** for side effects.
3. **RxJS for async streams** — HTTP, WebSocket, complex event handling.

```typescript
// ✅ Signal-based component state
export class TaskListComponent {
  private readonly taskService = inject(TaskService);

  tasks = signal<Task[]>([]);
  filter = signal<string>('');

  // ✅ Derived state — recomputed when tasks or filter change
  filteredTasks = computed(() =>
    this.tasks().filter(t => t.title.includes(this.filter()))
  );

  // ✅ Side effect — logs when tasks change
  constructor() {
    effect(() => console.debug('Tasks updated:', this.tasks().length));
  }
}
```

### Dependency Injection

1. **`inject()` function** over constructor injection in standalone components.
2. **Provide at appropriate level** — component, route, or root.
3. **Abstract services behind interfaces** for testability:

```typescript
// ✅ Interface in consumer feature
export abstract class TaskStorage {
  abstract getById(id: string): Observable<Task>;
  abstract save(task: Task): Observable<void>;
}

// ✅ Implementation in platform
@Injectable()
export class HttpTaskStorage extends TaskStorage {
  private readonly http = inject(HttpClient);

  getById(id: string): Observable<Task> {
    return this.http.get<Task>(`/api/tasks/${id}`);
  }

  save(task: Task): Observable<void> {
    return this.http.post<void>('/api/tasks', task);
  }
}

// ✅ Provided at route or root level
providers: [{ provide: TaskStorage, useClass: HttpTaskStorage }]
```

### Reactive Forms

1. **Reactive forms over template-driven** for complex forms.
2. **Typed forms** (`FormControl<string>`) — always.
3. **Custom validators** as pure functions:

```typescript
// ✅ Typed form group
export class TaskFormComponent {
  form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    priority: new FormControl<'low' | 'medium' | 'high'>('medium', {
      nonNullable: true,
    }),
  });
}
```

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`. Below: Angular-specific patterns only.

1. **Global error handler** for uncaught exceptions:
   ```typescript
   @Injectable()
   export class GlobalErrorHandler implements ErrorHandler {
     handleError(error: unknown): void {
       // Log to observability platform, not console
       this.logger.error('unhandled_error', { error });
     }
   }
   ```

2. **HTTP interceptor** for centralized error handling:
   ```typescript
   export const errorInterceptor: HttpInterceptorFn = (req, next) =>
     next(req).pipe(
       catchError((error: HttpErrorResponse) => {
         if (error.status === 401) {
           // Redirect to login
         }
         return throwError(() => error);
       })
     );
   ```

3. **RxJS error handling** — never leave Observables unhandled:
   ```typescript
   // ❌ No error handling
   this.http.get<Task[]>('/api/tasks').subscribe(tasks => this.tasks.set(tasks));

   // ✅ Handle errors
   this.http.get<Task[]>('/api/tasks').pipe(
     catchError(err => {
       this.error.set(err.message);
       return of([]);
     })
   ).subscribe(tasks => this.tasks.set(tasks));
   ```

### Anti-Patterns

- ❌ **NgModules for new components** — use `standalone: true`
- ❌ **BehaviorSubject for simple component state** — use signals
- ❌ **Constructor injection in standalone components** — use `inject()`
- ❌ **Manual subscriptions without cleanup** — use `takeUntilDestroyed()` or `async` pipe
- ❌ **`any` in template bindings** — type everything
- ❌ **Direct DOM manipulation** — use Angular's renderer or signals
- ❌ **`subscribe()` in components without unsubscribe** — prefer `async` pipe or `toSignal()`

```typescript
// ❌ Memory leak — subscription never cleaned up
ngOnInit() {
  this.taskService.getTasks().subscribe(tasks => this.tasks = tasks);
}

// ✅ Auto-cleanup with takeUntilDestroyed
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.taskService.getTasks().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(tasks => this.tasks.set(tasks));
}

// ✅ Even better — convert to signal
tasks = toSignal(this.taskService.getTasks(), { initialValue: [] });
```

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **Angular Testing Library** for component tests (preferred over TestBed):
   ```typescript
   import { render, screen } from '@testing-library/angular';

   it('should display task title', async () => {
     await render(TaskCardComponent, {
       componentInputs: { task: mockTask },
     });
     expect(screen.getByText('Deploy fix')).toBeInTheDocument();
   });
   ```

2. **Spectator** for service tests:
   ```typescript
   const spectator = createServiceFactory({
     service: TaskService,
     mocks: [TaskStorage],
   });
   ```

3. **`HttpTestingController`** for HTTP service tests — no live backend.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + angular-eslint | Linting | `npx ng lint` |
| `strict` mode | Type checking | `"strict": true` in tsconfig.json |

### Related
- TypeScript Idioms @.agents/rules/typescript-idioms-and-patterns.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
