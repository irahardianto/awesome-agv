---
trigger: model_decision
description: When writing Flutter or Dart code, working on mobile UI, using Riverpod for state management, or building Flutter widgets
---

## Flutter Idioms and Patterns

### Core Philosophy

Flutter is a UI toolkit first — performance is a first-class concern. `const` widgets and immutable data are your tools for keeping the render tree efficient. **Riverpod** is the canonical state management solution: it is compile-safe, testable without `BuildContext`, and has no implicit global state.

> **Scope:** This file covers Flutter/Dart *coding idioms*. For file and folder layout, see `project-structure-flutter-mobile.md`. For test naming, see `testing-strategy.md`. For general error handling principles, see `error-handling-principles.md`.

---

### `const` Constructors — Everywhere

Make every widget `const` when possible. `const` widgets are created once and never rebuilt unless their inputs change — this is Flutter's most impactful performance optimization.

```dart
// ✅ const constructor — widget is rebuild-safe
class TaskCard extends StatelessWidget {
    const TaskCard({super.key, required this.task});
    final Task task;
    // ...
}

// Usage — compile-time constant
const TaskCard(task: myTask)

// ❌ Missing const — rebuilt on every parent rebuild
TaskCard(task: myTask)
```

**Rules:**
- Every `StatelessWidget` that has no mutable state must have a `const` constructor
- Pass `const` keyword at the call site, not just the definition
- Lint rule `prefer_const_constructors` must be enabled in `analysis_options.yaml`

---

### Widget Decomposition

Large `build` methods are the primary source of performance problems and unmaintainable UI code.

1. **Extract a new widget when a subtree has distinct responsibilities**
   ```dart
   // ❌ Everything in one build method
   @override
   Widget build(BuildContext context) {
       return Column(children: [
           // 30 lines of header...
           // 50 lines of list...
           // 20 lines of footer...
       ]);
   }

   // ✅ Each subtree is a named widget with a const constructor
   @override
   Widget build(BuildContext context) {
       return Column(children: [
           const TaskHeader(),
           const TaskList(),
           const TaskFooter(),
       ]);
   }
   ```

2. **Never use builder methods (`_buildHeader()`) as a substitute for extracting widgets**
   - Builder methods do not benefit from `const` and always rerun on parent rebuild
   - Extract a proper `StatelessWidget` or `ConsumerWidget` instead

3. **Keep `build` methods under ~30 lines** — if longer, decompose

---

### Immutable Data with `freezed`

All domain models must be immutable. Use the `freezed` package for:
- Immutable value objects with `copyWith`
- Union/sealed types (loading, success, error states)
- Generated `==`, `hashCode`, and `toString`

```dart
// task/models/task.dart
@freezed
class Task with _$Task {
    const factory Task({
        required String id,
        required String title,
        @Default(TaskStatus.pending) TaskStatus status,
        DateTime? dueDate,
    }) = _Task;

    factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}

// Usage — immutable update via copyWith
final updated = task.copyWith(status: TaskStatus.done);

// ❌ Never mutate a model directly
task.status = TaskStatus.done; // compile error — field is final
```

**Rules:**
- All domain models use `@freezed`
- Never expose mutable fields on domain models
- Run `dart run build_runner build` after changing freezed models

---

### Riverpod — State Management

**Riverpod is the only state management solution** used in this project. Do not introduce BLoC, Cubit, Provider, or GetX.

> For file layout of state/ directories, see `project-structure-flutter-mobile.md`.

#### Provider Type Selection

| Provider                | Use When                                                  |
| ----------------------- | --------------------------------------------------------- |
| `Provider`              | Synchronous, read-only computed value                     |
| `StateProvider`         | Simple synchronous state (toggle, counter)                |
| `NotifierProvider`      | Complex synchronous state with actions                    |
| `AsyncNotifierProvider` | State that requires async initialization or async actions |
| `FutureProvider`        | One-shot async read (no actions needed)                   |
| `StreamProvider`        | Real-time data stream                                     |

```dart
// Simple async state with actions — AsyncNotifier pattern
@riverpod
class TaskList extends _$TaskList {
    @override
    Future<List<Task>> build() async {
        // Initial state — called once on first watch
        return ref.watch(taskRepositoryProvider).getTasks();
    }

    Future<void> addTask(CreateTaskRequest request) async {
        state = const AsyncLoading();
        state = await AsyncValue.guard(() async {
            final repo = ref.read(taskRepositoryProvider);
            await repo.createTask(request);
            return repo.getTasks();
        });
    }
}
```

#### `ref.watch` vs `ref.read`

```dart
// ✅ ref.watch — subscribes to changes, use inside build() or widget build
final tasks = ref.watch(taskListProvider);

// ✅ ref.read — one-time read, use inside event handlers / actions (no subscription)
Future<void> onSubmit() async {
    await ref.read(taskListProvider.notifier).addTask(request);
}

// ❌ Never use ref.watch inside async functions or event handlers
Future<void> onSubmit() async {
    final tasks = ref.watch(taskListProvider); // WRONG — causes errors
}
```

#### Auto-dispose and keepAlive

```dart
// ✅ autoDispose is the DEFAULT with code generation (@riverpod)
// Provider is disposed when no consumers are listening
@riverpod
Future<Task> taskDetail(TaskDetailRef ref, String id) async {
    return ref.watch(taskRepositoryProvider).getById(id);
}

// ✅ Opt into keepAlive explicitly with @Riverpod(keepAlive: true)
// Use for app-wide, long-lived services (e.g., auth state, user session)
@Riverpod(keepAlive: true)
Future<List<Task>> globalTaskList(GlobalTaskListRef ref) async {
    return ref.watch(taskRepositoryProvider).getTasks();
}
// ❌ Do not use @Riverpod(keepAlive: false) — that is the same as @riverpod (default)
```

#### ConsumerWidget vs ConsumerStatefulWidget

```dart
// ✅ Prefer ConsumerWidget — stateless, simpler
class TaskListView extends ConsumerWidget {
    const TaskListView({super.key});

    @override
    Widget build(BuildContext context, WidgetRef ref) {
        final asyncTasks = ref.watch(taskListProvider);
        return asyncTasks.when(
            data: (tasks) => TaskListBody(tasks: tasks),
            loading: () => const LoadingIndicator(),
            error: (e, _) => ErrorView(error: e),
        );
    }
}

// Use ConsumerStatefulWidget only when local widget state + riverpod is needed
```

---

### Async Patterns

1. **Always handle all three `AsyncValue` states: data, loading, error**
   ```dart
   // ✅ Exhaustive
   asyncValue.when(
       data: (data) => DataWidget(data: data),
       loading: () => const CircularProgressIndicator(),
       error: (err, stack) => ErrorText(err.toString()),
   );
   ```

2. **Use safe `AsyncValue` accessors to prevent runtime crashes**
   ```dart
   // ✅ Safe — returns null if state is loading or error
   final tasks = ref.watch(taskListProvider).valueOrNull;

   // ⚠️ Unsafe — throws StateError if state is not AsyncData
   // Only use when you have already confirmed the state is loaded
   final tasks = ref.watch(taskListProvider).requireValue;
   ```

3. **Use `AsyncValue.guard` inside notifier actions to wrap async calls**
   - It catches exceptions and wraps them in `AsyncError` automatically

4. **Use `StreamProvider` for real-time data** — never poll manually with `Timer`

---

### Navigation with `go_router`

**`go_router` is the canonical navigation library.**

```dart
// core/router/app_router.dart
@riverpod
GoRouter appRouter(AppRouterRef ref) {
    return GoRouter(
        initialLocation: '/tasks',
        routes: [
            GoRoute(path: '/tasks', builder: (_, __) => const TaskListView()),
            GoRoute(
                path: '/tasks/:id',
                builder: (_, state) => TaskDetailView(
                    // state.pathParameters['id'] is guaranteed non-null by the :id
                    // route pattern — acceptable use of ! in route infrastructure code
                    id: state.pathParameters['id']!,
                ),
            ),
        ],
    );
}

// Navigate — always by path, never by widget reference
context.go('/tasks/$taskId');
context.push('/tasks/new'); // push adds to the back stack
```

---

### Dart Language Idioms

1. **Null safety — use `?.`, `??`, and `??=` idiomatically**
   ```dart
   final city = user?.address?.city ?? 'Unknown';
   cache ??= await compute(); // assign only if null
   ```

2. **Use `late` only for fields initialized before first use that cannot be `final`**
   - Prefer `final` fields initialized in the constructor
   - `late` without initialization is an unsafe nullable escape hatch

3. **Extension methods for adding behaviour to types you don't own**
   ```dart
   extension TaskStatusLabel on TaskStatus {
       String get label => switch (this) {
           TaskStatus.pending => 'Pending',
           TaskStatus.done => 'Done',
       };
   }
   ```

4. **Use `switch` expressions (Dart 3+) for exhaustive pattern matching**
   ```dart
   final label = status switch {
       TaskStatus.pending => 'Pending',
       TaskStatus.done => 'Done',
       // Compiler error if a case is missing
   };
   ```

5. **Avoid `dynamic` — it is the Dart equivalent of TypeScript's `any`**

---

### Testing

> Test naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Flutter-specific tooling.

1. **Unit test Riverpod providers with `ProviderContainer`** — no `BuildContext` needed
   ```dart
   test('addTask updates state', () async {
       final container = ProviderContainer(overrides: [
           taskRepositoryProvider.overrideWith((_) => MockTaskRepository()),
       ]);
       addTearDown(container.dispose);

       await container.read(taskListProvider.notifier).addTask(request);
       expect(container.read(taskListProvider).value, hasLength(1));
   });
   ```

2. **Widget tests with `pumpWidget` and `ProviderScope`**
   ```dart
   testWidgets('shows task list', (tester) async {
       await tester.pumpWidget(ProviderScope(
           overrides: [...],
           child: const MaterialApp(home: TaskListView()),
       ));
       expect(find.byType(TaskCard), findsWidgets);
   });
   ```

3. **Use `mockito` with `@GenerateNiceMocks` for interface mocks**

---

### Linting and Formatting

| Tool              | Purpose                      | Config File             |
| ----------------- | ---------------------------- | ----------------------- |
| `dart format`     | Canonical formatting         | — (built-in)            |
| `flutter analyze` | Static analysis + lint       | `analysis_options.yaml` |
| `riverpod_lint`   | Riverpod-specific lint rules | `dev_dependencies`      |
| `dart pub deps`   | Dependency audit             | —                       |

**Mandatory `analysis_options.yaml` settings (Dart 3+):**
```yaml
analyzer:
  language:
    strict-casts: true
    strict-raw-types: true
  errors:
    invalid_assignment: error
linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - avoid_dynamic_calls
    - avoid_print
    - use_super_parameters
```

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Project Structure — Flutter Mobile @project-structure-flutter-mobile.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Dependency Management Principles @dependency-management-principles.md
