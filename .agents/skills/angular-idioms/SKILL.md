---
name: angular-idioms
description: Angular components, signals, DI, RxJS, standalone architecture. For TypeScript see typescript-idioms.
paths:
  - "**/*.component.ts"
  - "**/*.service.ts"
  - "**/*.directive.ts"
  - "**/*.pipe.ts"
  - "**/*.guard.ts"
  - "**/angular.json"
  - "**/tsconfig*.json"
---

## Angular Idioms and Patterns

### Core Philosophy

Angular (19+) rewards signals, standalone components, and reactive patterns. Idiomatic Angular = typed, modular, RxJS-aware, OnPush by default.

> **Scope:** This file covers Angular-specific coding idioms for components, services, and patterns. For TypeScript type system patterns, see `@.agents/skills/typescript-idioms/SKILL.md`. For file and folder layout, see `references/project-structure.md`.

### Standalone Components (Default)

1. **Standalone components** — no NgModules for new components (standalone is the default since Angular 19):
   ```typescript
   @Component({
     selector: 'app-task-list',
     changeDetection: ChangeDetectionStrategy.OnPush,
     imports: [TaskCardComponent],
     template: `
       @for (task of filteredTasks(); track task.id) {
         <app-task-card [task]="task" />
       }
     `
   })
   export class TaskListComponent {
     tasks = signal<Task[]>([]);
   }
   ```

2. **Lazy-load routes** with `loadComponent`:
   ```typescript
   { path: 'tasks', loadComponent: () => import('./features/task/task-list.component')
       .then(m => m.TaskListComponent) }
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
  filteredTasks = computed(() =>                   // ✅ Derived state
    this.tasks().filter(t => t.title.includes(this.filter()))
  );
  constructor() {
    effect(() => console.debug('Tasks updated:', this.tasks().length));  // ✅ Side effect
  }
}
```

### Change Detection

1. **`OnPush` is the default strategy** — set it on every component:
   ```typescript
   // ✅ Always OnPush
   @Component({
     changeDetection: ChangeDetectionStrategy.OnPush,
     // ...
   })
   ```

2. **OnPush works naturally with signals** — signal reads in templates automatically trigger change detection when the signal value changes.

3. **Use `Default` only when** wrapping third-party components that mutate state imperatively and cannot be refactored.

4. **Never call `ChangeDetectorRef.detectChanges()` manually** — if you need it, your data flow is wrong. Convert to signals or use `async` pipe.

### Component Design

1. **Signal-based inputs and outputs** (Angular 17.1+) — prefer over decorators:
   ```typescript
   // ✅ Signal input — reactive, no OnChanges needed
   task = input.required<Task>();
   variant = input<'compact' | 'full'>('full');

   // ✅ Signal output
   taskCompleted = output<string>();

   // ❌ Decorator style — legacy
   @Input() task!: Task;
   @Output() taskCompleted = new EventEmitter<string>();
   ```

2. **Content projection** — use `<ng-content>` for composable UI, `select` attribute for named slots:
   ```typescript
   @Component({
     template: `
       <header><ng-content select="[card-header]" /></header>
       <main><ng-content /></main>
     `
   })
   ```

3. **Signal-based view queries** (Angular 17.2+):
   ```typescript
   canvas = viewChild.required<ElementRef>('canvas');  // ✅ Reactive, no AfterViewInit
   items = contentChildren(TabItemComponent);           // ✅ Content query
   ```

4. **Lifecycle hooks guidance:**
   - `OnInit` — fetch initial data, set up subscriptions (use `inject(DestroyRef)` for cleanup)
   - `OnDestroy` — manual cleanup only if `takeUntilDestroyed` or `DestroyRef` cannot be used
   - **Avoid `OnChanges`** — use signal inputs with `computed()` or `effect()` instead

### Template Patterns

1. **Use new control flow syntax** (Angular 17+) — `@for`, `@if`, `@switch`, `@defer`:
   ```html
   <!-- ✅ New control flow with track expression -->
   @for (task of tasks(); track task.id) {
     <app-task-card [task]="task" />
   } @empty {
     <p>No tasks found.</p>
   }

   @if (isLoading()) {
     <app-spinner />
   } @else {
     <app-task-list [tasks]="tasks()" />
   }

   @switch (task().priority) {
     @case ('high') { <span class="badge-high">High</span> }
     @case ('medium') { <span class="badge-med">Medium</span> }
     @default { <span class="badge-low">Low</span> }
   }
   ```

2. **`@defer` for lazy-loaded template blocks:**
   ```html
   <!-- ✅ Lazy-load heavy component -->
   @defer (on viewport) {
     <app-task-analytics [tasks]="tasks()" />
   } @placeholder {
     <div class="skeleton" />
   }
   ```

3. **Use `ng-container`** for grouping without extra DOM nodes — e.g., `<ng-container *ngTemplateOutlet="tpl" />`.

4. **Avoid complex expressions in templates** — extract to `computed()`:
   ```typescript
   // ❌ template: `{{ tasks().filter(t => t.done).length }} / {{ tasks().length }}`
   // ✅ Extract to computed
   summary = computed(() => `${this.doneTasks().length} / ${this.tasks().length}`);
   ```

### Dependency Injection

1. **`inject()` function** over constructor injection in standalone components.
2. **Provide at appropriate level** — component, route, or root.
3. **Abstract services behind interfaces** for testability:

```typescript
// ✅ Abstract class as interface (TypeScript has no runtime interfaces)
export abstract class TaskStorage {
  abstract getById(id: string): Observable<Task>;
  abstract save(task: Task): Observable<void>;
}

// ✅ Implementation
@Injectable()
export class HttpTaskStorage extends TaskStorage {
  private readonly http = inject(HttpClient);
  getById(id: string) { return this.http.get<Task>(`/api/tasks/${id}`); }
  save(task: Task) { return this.http.post<void>('/api/tasks', task); }
}

// ✅ Wired at route or root level
providers: [{ provide: TaskStorage, useClass: HttpTaskStorage }]
```

### Reactive Forms

1. **Reactive forms over template-driven** for complex forms.
2. **Typed forms** (`FormControl<string>`) — always.
3. **Custom validators** as pure functions:

```typescript
// ✅ Typed form group with nonNullable controls
export class TaskFormComponent {
  form = new FormGroup({
    title: new FormControl('', { nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)] }),
    priority: new FormControl<'low' | 'medium' | 'high'>('medium', { nonNullable: true }),
  });
}
```

### Routing Patterns

1. **Functional guards** (Angular 15+) — no class-based guards:
   ```typescript
   // ✅ Functional guard
   export const authGuard: CanActivateFn = (route, state) => {
     const auth = inject(AuthService);
     return auth.isAuthenticated() || inject(Router).createUrlTree(['/login']);
   };

   // ❌ Class-based guard — deprecated
   @Injectable() export class AuthGuard implements CanActivate { ... }
   ```

2. **Functional resolvers** — same pattern, use `ResolveFn<T>`:
   ```typescript
   export const taskResolver: ResolveFn<Task> = (route) =>
     inject(TaskService).getById(route.paramMap.get('id')!);
   ```

3. **Lazy loading with `loadChildren`** for feature routes:
   ```typescript
   {
     path: 'tasks',
     loadChildren: () => import('./features/task/task.routes')
       .then(m => m.TASK_ROUTES),
     canActivate: [authGuard],
   }
   ```

4. **Route parameter binding with `input()`** (Angular 16+):
   ```typescript
   // In app.config.ts: withComponentInputBinding()
   // ✅ Route params bound as signal inputs — no ActivatedRoute needed
   taskId = input.required<string>();

   // ❌ Manual route param subscription
   this.route.paramMap.pipe(...).subscribe(...)
   ```

### State Management

1. **Component signals first** — sufficient for most local UI state.
2. **NgRx Signal Store** for shared or complex state beyond a single component:

   ```typescript
   // ✅ NgRx Signal Store
   export const TaskStore = signalStore(
     { providedIn: 'root' },
     withState<TaskState>({ tasks: [], isLoading: false, error: null }),
     withComputed(({ tasks }) => ({
       completedTasks: computed(() => tasks().filter(t => t.done)),
     })),
     withMethods((store, taskService = inject(TaskService)) => ({
       async loadTasks(): Promise<void> {
         patchState(store, { isLoading: true });
         const tasks = await firstValueFrom(taskService.getAll());
         patchState(store, { tasks, isLoading: false });
       },
     })),
   );
   ```

3. **When to use what:**
   - **`signal()`** — local component state, simple parent-child data flow
   - **NgRx Signal Store** — shared state across components, entity management (`withEntities()`)
   - **RxJS + services** — real-time streams, WebSocket data, complex async orchestration

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`. Below: Angular-specific patterns only.

1. **Global error handler** for uncaught exceptions:
   ```typescript
   @Injectable()
   export class GlobalErrorHandler implements ErrorHandler {
     handleError(error: unknown): void {
       this.logger.error('unhandled_error', { error }); // Log to observability platform
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

3. **RxJS error handling** — never leave Observables unhandled. Always use `catchError` in `.pipe()` or handle in `subscribe()` error callback.

### Anti-Patterns

- ❌ **NgModules for new components** — use standalone components (default since v19)
- ❌ **BehaviorSubject for simple component state** — use signals
- ❌ **Constructor injection in standalone components** — use `inject()`
- ❌ **Manual subscriptions without cleanup** — use `takeUntilDestroyed()` or `async` pipe
- ❌ **`any` in template bindings** — type everything
- ❌ **Direct DOM manipulation** — use Angular's renderer or signals
- ❌ **`subscribe()` in components without unsubscribe** — prefer `async` pipe or `toSignal()`
- ❌ **`ChangeDetectionStrategy.Default`** without justification — always `OnPush`
- ❌ **`*ngFor` / `*ngIf` in new code** — use `@for` / `@if` control flow
- ❌ **Class-based guards and resolvers** — use functional equivalents

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

### Naming Conventions

1. **File naming** — dot-separated with type suffix:
   - `task-list.component.ts`, `task.service.ts`, `task.pipe.ts`, `task.guard.ts`, `task.directive.ts`
   - `task.routes.ts` for feature route definitions
   - `task-list.component.spec.ts` for tests (co-located)

2. **Selector prefixes** — use `app-` (or project-specific prefix from `angular.json`): `selector: 'app-task-card'`

3. **Class naming** — suffix matches file type: `TaskListComponent`, `TaskService`, `HighlightDirective`, `DateFormatPipe`

4. **Route file exports** — `UPPER_SNAKE_CASE`: `export const TASK_ROUTES: Routes = [...]`

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: Angular-specific patterns only.

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

4. **Signal Store testing** — test store methods directly, assert signal values:
   ```typescript
   it('should load tasks', async () => {
     const store = TestBed.inject(TaskStore);
     await store.loadTasks();
     expect(store.tasks().length).toBeGreaterThan(0);
   });
   ```

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint + angular-eslint | Linting | `npx ng lint` |
| `strict` mode | Type checking | `"strict": true` in tsconfig.json |
| Angular compiler | Template checking | `npx ng build` (checks templates) |

### Related
- Code Idioms and Conventions @.agents/rules/code-idioms-and-conventions.md
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- Angular Project Structure @.agents/skills/angular-idioms/references/project-structure.md
- Frontend Design @.agents/skills/frontend-design/SKILL.md
- Security Principles @.agents/rules/security-principles.md
- Accessibility Principles @.agents/rules/accessibility-principles.md
- Testing Strategy @.agents/rules/testing-strategy.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
- Logging and Observability @.agents/rules/logging-and-observability-mandate.md
- Architectural Patterns @.agents/rules/architectural-pattern.md
