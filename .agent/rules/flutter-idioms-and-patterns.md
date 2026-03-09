---
trigger: model_decision
description: When writing Flutter or Dart code, working on mobile UI, using Riverpod for state management, or building Flutter widgets
---

## Flutter Idioms and Patterns (Riverpod 3)

### Core Philosophy

Flutter is a UI toolkit first — performance is a first-class concern. `const` widgets and immutable data keep the render tree efficient. **Riverpod 3** is the canonical state management solution: compile-safe, testable without `BuildContext`, no implicit global state, and with automatic retry and pause/resume built in.

**Code generation is mandatory.** All providers must use `@riverpod` / `@Riverpod(keepAlive: true)` annotations with `riverpod_generator` and `build_runner`. This catches type errors, missing overrides, and broken provider graphs at compile time — bugs are caught before they reach users.

**Required dependencies:**

```yaml
# pubspec.yaml
dependencies:
  flutter_riverpod: 3.2.1
  riverpod_annotation: 4.0.2

dev_dependencies:
  riverpod_generator: 4.0.3
  build_runner: # latest
  riverpod_lint: # latest
```

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

### Provider Decision Tree

Use this tree to pick the correct provider pattern. **Follow it top-to-bottom — the first match wins.**

```
Does the provider have side-effects (create/update/delete)? ──> YES ──┐
    │                                                                  │
    NO                                                                 │
    │                                                             Is it async?
    │                                                              │       │
Is it async?                                                      YES     NO
    │       │                                                      │       │
   YES     NO                                                     ▼       ▼
    │       │                                              @riverpod   @riverpod
    ▼       ▼                                              class       class
@riverpod  @riverpod                                       (AsyncNotifier) (Notifier)
function   function
(FutureProvider) (Provider)
```

**Decision summary:**

| Has side-effects? | Async? | Pattern | Provider type generated |
|---|---|---|---|
| No | No | `@riverpod` function | `Provider` |
| No | Yes | `@riverpod` async function | `FutureProvider` |
| No | Stream | `@riverpod` `Stream` function | `StreamProvider` |
| Yes | No | `@riverpod` class | `NotifierProvider` |
| Yes | Yes | `@riverpod` class with `Future` build | `AsyncNotifierProvider` |
| Yes | Stream | `@riverpod` class with `Stream` build | `StreamNotifierProvider` |

---

### Riverpod — State Management

**Riverpod 3 is the only state management solution** used in this project. Do not introduce BLoC, Cubit, Provider (package:provider), or GetX.

> For file layout of state/ directories, see `project-structure-flutter-mobile.md`.

#### App Entry Point — `ProviderScope`

Every Flutter app using Riverpod must wrap the root widget in `ProviderScope`. This creates the `ProviderContainer` that powers all providers in the widget tree.

```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
    runApp(const ProviderScope(child: MyApp()));
}
```

**Rules:**
- Exactly one `ProviderScope` at the app root — never nest `ProviderScope` widgets
- Use `overrides:` parameter only in tests (see Testing section)
- For retry configuration, pass `retry:` to the root `ProviderScope` (see Runtime Behaviors)

#### Provider Definition — Class-Based (Side-Effects)

Use class-based providers when the provider needs methods to modify state.

```dart
// Synchronous notifier — e.g., a filter or toggle
@riverpod
class TaskFilter extends _$TaskFilter {
    @override
    TaskFilterState build() {
        return const TaskFilterState();
    }

    void setStatus(TaskStatus? status) {
        state = state.copyWith(status: status);
    }

    void toggleShowCompleted() {
        state = state.copyWith(showCompleted: !state.showCompleted);
    }
}
```

```dart
// Async notifier — e.g., CRUD operations
@riverpod
class TaskList extends _$TaskList {
    @override
    Future<List<Task>> build() async {
        return ref.watch(taskRepositoryProvider).getTasks();
    }

    Future<void> addTask(CreateTaskRequest request) async {
        state = const AsyncLoading();
        state = await AsyncValue.guard(() async {
            final repo = ref.read(taskRepositoryProvider);
            await repo.createTask(request);
            // REQUIRED: check ref.mounted after every await
            if (!ref.mounted) return state.requireValue;
            return repo.getTasks();
        });
    }

    Future<void> deleteTask(String id) async {
        state = const AsyncLoading();
        state = await AsyncValue.guard(() async {
            final repo = ref.read(taskRepositoryProvider);
            await repo.deleteTask(id);
            if (!ref.mounted) return state.requireValue;
            return repo.getTasks();
        });
    }
}
```

#### Provider Definition — Functional (Read-Only / Computed)

Use functional providers for derived values with no side-effects.

```dart
// Computed value — filtered task list
@riverpod
List<Task> filteredTasks(Ref ref) {
    final tasks = ref.watch(taskListProvider).valueOrNull ?? [];
    final filter = ref.watch(taskFilterProvider);
    return tasks.where((t) => filter.matches(t)).toList();
}

// Async one-shot read — e.g., fetch a single task
@riverpod
Future<Task> taskDetail(Ref ref, String id) async {
    return ref.watch(taskRepositoryProvider).getById(id);
}

// Stream — real-time data
@riverpod
Stream<List<Task>> taskStream(Ref ref) {
    return ref.watch(taskRepositoryProvider).watchAll();
}
```

**Family providers (parameterized):** When a provider takes extra arguments beyond `Ref`, Riverpod creates a *family* — each unique argument combination gets its own independent provider instance with its own cache and disposal. With code generation (which we mandate), **any number of parameters** are supported, including named, optional, and default values. Constraints:
- All parameters must implement `==` and `hashCode` (primitives, `freezed` models, Dart records all work)
- Each family member is disposed independently when no listener remains

```dart
// ✅ Family with a single key
@riverpod
Future<Task> taskDetail(Ref ref, String id) async {
    return ref.watch(taskRepositoryProvider).getById(id);
}

// ✅ Multiple parameters — fully supported with code generation
@riverpod
Future<List<Task>> projectTasks(Ref ref, String projectId, {TaskStatus? status}) async {
    return ref.watch(taskRepositoryProvider).getByProject(projectId, status: status);
}
// Usage: ref.watch(projectTasksProvider('proj-1', status: TaskStatus.done))
```

#### `ref.watch` vs `ref.read`

```dart
// ✅ ref.watch — subscribes to changes, use inside build() or widget build
final tasks = ref.watch(taskListProvider);

// ✅ ref.read — one-time read, use inside event handlers / notifier actions
Future<void> onSubmit() async {
    await ref.read(taskListProvider.notifier).addTask(request);
}

// ❌ Never use ref.watch inside async functions or event handlers
Future<void> onSubmit() async {
    final tasks = ref.watch(taskListProvider); // WRONG — causes errors
}
```

#### `Ref.mounted` — Mandatory After Awaits

Riverpod 3 throws if you interact with a disposed `Ref` or `Notifier`. **Always check `ref.mounted` after any `await` in a notifier.**

```dart
Future<void> updateTask(Task task) async {
    final repo = ref.read(taskRepositoryProvider);
    await repo.update(task);

    // REQUIRED: provider may have been disposed during await
    if (!ref.mounted) return;

    state = await AsyncValue.guard(() => repo.getTasks());
}
```

#### Auto-Dispose and `keepAlive`

```dart
// ✅ autoDispose is the DEFAULT with code generation (@riverpod)
// Provider is disposed when no consumers are listening
@riverpod
Future<Task> taskDetail(Ref ref, String id) async {
    return ref.watch(taskRepositoryProvider).getById(id);
}

// ✅ Opt into keepAlive explicitly for app-wide, long-lived state
@Riverpod(keepAlive: true)
class AuthState extends _$AuthState {
    @override
    Future<User?> build() async {
        return ref.watch(authRepositoryProvider).getCurrentUser();
    }
}

// ✅ Repositories should also be keepAlive — they hold connection state and
//    should not be re-initialized every time a screen rebuilds
@Riverpod(keepAlive: true)
TaskRepository taskRepository(Ref ref) {
    return TaskRepositoryImpl(apiClient: ref.watch(apiClientProvider));
}

// ❌ Do not set keepAlive: false — that is the default
// ❌ Do not set keepAlive: true for screen-scoped state
```

#### Repository Interface Pattern

All data access goes through an abstract repository interface. This is the Flutter expression of the Testability-First architecture (see `architectural-pattern.md`).

```dart
// repository/task_repository.dart — Abstract interface (contract)
abstract class TaskRepository {
    Future<List<Task>> getTasks();
    Future<Task> getById(String id);
    Future<void> createTask(CreateTaskRequest request);
    Future<void> deleteTask(String id);
}
```

```dart
// repository/task_repository_impl.dart — Production adapter
class TaskRepositoryImpl implements TaskRepository {
    const TaskRepositoryImpl({required this.apiClient});
    final ApiClient apiClient;

    @override
    Future<List<Task>> getTasks() async {
        final response = await apiClient.get('/tasks');
        return (response.data as List)
            .map((e) => Task.fromJson(e as Map<String, dynamic>))
            .toList();
    }

    @override
    Future<Task> getById(String id) async {
        final response = await apiClient.get('/tasks/$id');
        return Task.fromJson(response.data as Map<String, dynamic>);
    }

    @override
    Future<void> createTask(CreateTaskRequest request) async {
        await apiClient.post('/tasks', data: request.toJson());
    }

    @override
    Future<void> deleteTask(String id) async {
        await apiClient.delete('/tasks/$id');
    }
}
```

```dart
// repository/task_repository_mock.dart — Test adapter
class MockTaskRepository implements TaskRepository {
    final List<Task> _tasks = [];

    @override
    Future<List<Task>> getTasks() async => List.unmodifiable(_tasks);

    @override
    Future<Task> getById(String id) async =>
        _tasks.firstWhere((t) => t.id == id);

    @override
    Future<void> createTask(CreateTaskRequest request) async {
        _tasks.add(Task(id: 'mock-id', title: request.title));
    }

    @override
    Future<void> deleteTask(String id) async {
        _tasks.removeWhere((t) => t.id == id);
    }
}
```

```dart
// Wiring — provider that the rest of the app depends on
@Riverpod(keepAlive: true)
TaskRepository taskRepository(Ref ref) {
    return TaskRepositoryImpl(apiClient: ref.watch(apiClientProvider));
}

// In tests, override with mock:
// taskRepositoryProvider.overrideWith((_) => MockTaskRepository())
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

### Riverpod 3 — Runtime Behaviors

#### Automatic Retry

Riverpod 3 automatically retries providers that throw, using exponential backoff. This improves resilience against transient network failures.

```dart
// ✅ Default behavior — providers auto-retry on failure
// No action needed for standard use

// ✅ Disable retry for a specific provider when failure is non-transient
@Riverpod(retry: null)
Future<Config> appConfig(Ref ref) async {
    return ref.watch(configRepositoryProvider).load();
}

// ✅ Disable globally via ProviderScope
ProviderScope(
    retry: (_, __) => null, // disable for all providers
    child: const MyApp(),
)
```

**Rules:**
- Leave auto-retry enabled for network/IO operations (transient failures)
- Disable for operations where retry is unsafe (non-idempotent writes) or pointless (validation errors)

#### Pause / Resume (Out-of-View Providers)

Riverpod 3 automatically **pauses** provider listeners when the consuming widget is no longer visible. When the widget becomes visible again, listeners resume.

This is automatic — no action needed. Be aware of it when debugging.

#### `ProviderException` Wrapping

When a provider fails, reading it in Riverpod 3 throws a `ProviderException` wrapping the original error, not the raw exception.

```dart
// ✅ Catch ProviderException when reading providers that may fail
try {
    final value = container.read(myProvider);
} on ProviderException catch (e) {
    // e.exception contains the original error
    // e.provider contains which provider failed
}
```

```dart
// ✅ Assert on provider failure in tests
expect(
    () => container.read(myProvider),
    throwsA(isA<ProviderException>()),
);
```

#### State Change Detection (`==`)

Riverpod 3 uses the `==` operator (not `identical`) to determine if state changed and rebuilds are needed. This means:

- `freezed` models work correctly out of the box (generated `==`)
- Custom models **must** implement `==` / `hashCode` or use `freezed`
- Override `updateShouldNotify` on a `Notifier` for custom comparison logic

---

### Async Patterns

1.  **Always handle all three `AsyncValue` states: data, loading, error**
    ```dart
    // ✅ Exhaustive
    asyncValue.when(
        data: (data) => DataWidget(data: data),
        loading: () => const CircularProgressIndicator(),
        error: (err, stack) => ErrorText(err.toString()),
    );
    ```

2.  **Surfacing notifier errors to UI** — use `when(error:...)` for exhaustive handling; use `hasError` only for conditional checks alongside a separate data display:
    ```dart
    // ✅ Exhaustive — covers all states, preferred for full-screen states
    asyncTasks.when(
        data: (tasks) => TaskListBody(tasks: tasks),
        loading: () => const LoadingIndicator(),
        error: (e, _) => ErrorView(error: e),
    );

    // ✅ Conditional — show inline error banner while keeping stale data visible
    if (asyncTasks.hasError) {
        // show snackbar or inline error
    }
    final tasks = asyncTasks.valueOrNull ?? const [];
    ```

3.  **Use safe `AsyncValue` accessors to prevent runtime crashes**
    ```dart
    // ✅ Safe — returns null if state is loading or error
    final tasks = ref.watch(taskListProvider).valueOrNull;

    // ⚠️ Unsafe — throws StateError if state is not AsyncData
    // Only use when you have already confirmed the state is loaded
    final tasks = ref.watch(taskListProvider).requireValue;
    ```

4.  **Use `AsyncValue.guard` inside notifier actions to wrap async calls**
    - It catches exceptions and wraps them in `AsyncError` automatically

5.  **Use `StreamProvider` for real-time data** — never poll manually with `Timer`

6.  **Always check `ref.mounted` after `await`** — see `Ref.mounted` section above

7.  **Force a provider to re-fetch with `ref.invalidate`**
    ```dart
    // ✅ Invalidate from outside a notifier (e.g., after a form submit in a widget)
    ref.invalidate(taskListProvider);
    // The next watch/read will trigger a fresh build()

    // ✅ Invalidate from inside a notifier after a mutation
    Future<void> addTask(CreateTaskRequest request) async {
        final repo = ref.read(taskRepositoryProvider);
        await repo.createTask(request);
        if (!ref.mounted) return;
        ref.invalidateSelf(); // triggers build() to re-run and return fresh list
    }
    ```

    **Decision: `invalidateSelf()` vs manual state assignment**
    ```
    After a mutation:
    ├── Need optimistic UI (instant visual update before server confirms)?
    │   └── YES → Set state manually via AsyncValue.guard
    │             (e.g., remove item from list immediately, then call API)
    └── NO  → ref.invalidateSelf()  (simpler, always correct — re-runs build())
    ```

---

### Error Handling in Flutter/Riverpod

Define a typed exception hierarchy using sealed classes (Dart 3+). Map infrastructure exceptions to domain exceptions inside notifier actions.

```dart
// core/errors/app_exception.dart — Typed exception hierarchy
sealed class AppException implements Exception {
    const AppException(this.message);
    final String message;

    @override
    String toString() => message;
}

class NetworkException extends AppException {
    const NetworkException(super.message, {this.statusCode});
    final int? statusCode;
}

class ValidationException extends AppException {
    const ValidationException(super.message, {required this.field});
    final String field;
}

class NotFoundException extends AppException {
    const NotFoundException(super.message);
}
```

```dart
// ✅ Map infrastructure exceptions to domain exceptions inside notifier actions
Future<void> addTask(CreateTaskRequest request) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
        try {
            final repo = ref.read(taskRepositoryProvider);
            await repo.createTask(request);
            if (!ref.mounted) return state.requireValue;
            return repo.getTasks();
        } on DioException catch (e) {
            // Transform infrastructure error → domain error
            throw NetworkException(
                'Failed to create task: ${e.message}',
                statusCode: e.response?.statusCode,
            );
        }
    });
}
```

```dart
// ✅ Handle typed errors in UI
asyncTasks.when(
    data: (tasks) => TaskListBody(tasks: tasks),
    loading: () => const LoadingIndicator(),
    error: (error, _) => switch (error) {
        NetworkException() => ErrorView(message: 'Network error: ${error.message}'),
        NotFoundException() => const ErrorView(message: 'Not found'),
        _ => ErrorView(message: 'Unexpected error: $error'),
    },
);
```

**Rules:**
- All custom exceptions extend `AppException` (sealed class)
- Infrastructure exceptions (`DioException`, `SocketException`) are caught and re-thrown as domain exceptions
- Never expose infrastructure types (Dio, HTTP status codes) to the UI layer
- Use exhaustive `switch` on the sealed class in error display
- See `error-handling-principles.md` for general error handling guidance

---

### Navigation with `go_router`

**`go_router` is the canonical navigation library.**

```dart
// core/router/app_router.dart
@riverpod
GoRouter appRouter(Ref ref) {
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

> Test naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Flutter/Riverpod 3 test patterns.

#### Unit Test Providers with `ProviderContainer.test`

`ProviderContainer.test` creates an isolated container that **auto-disposes after the test** — no manual `addTearDown` needed.

```dart
test('addTask updates state', () async {
    final container = ProviderContainer.test(overrides: [
        taskRepositoryProvider.overrideWith((_) => MockTaskRepository()),
    ]);

    await container.read(taskListProvider.notifier).addTask(request);
    expect(container.read(taskListProvider).value, hasLength(1));
});
```

#### Override Only the `build` Method with `overrideWithBuild`

When you need to control initial state but keep the notifier's methods intact:

```dart
test('deleteTask removes item from pre-seeded list', () async {
    final container = ProviderContainer.test(overrides: [
        taskRepositoryProvider.overrideWith((_) => MockTaskRepository()),
        taskListProvider.overrideWithBuild((ref, notifier) {
            // Seed initial state — methods (addTask, deleteTask) still work
            return Future.value([mockTask1, mockTask2]);
        }),
    ]);

    await container.read(taskListProvider.notifier).deleteTask(mockTask1.id);
    expect(container.read(taskListProvider).value, hasLength(1));
});
```

#### Widget Tests with `ProviderScope`

```dart
testWidgets('shows task list', (tester) async {
    await tester.pumpWidget(ProviderScope(
        overrides: [
            taskRepositoryProvider.overrideWith((_) => MockTaskRepository()),
        ],
        child: const MaterialApp(home: TaskListView()),
    ));
    expect(find.byType(TaskCard), findsWidgets);
});
```

#### Use `mockito` with `@GenerateNiceMocks` for Interface Mocks

Place the annotation on the library (top of the test file or on `main`) and add a `part` directive for the generated file:

```dart
// task_notifier_test.dart
@GenerateNiceMocks([MockSpec<TaskRepository>()])
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'task_notifier_test.mocks.dart'; // generated by build_runner

void main() {
    // tests use MockTaskRepository()
}
```

---

### Anti-Patterns — NEVER DO THIS

These are common mistakes agents reproduce from Riverpod 2 training data. **Every item below is a hard rule violation.**

| ❌ Anti-Pattern | ✅ Correct Pattern |
|---|---|
| `StateProvider` | `@riverpod` class with `Notifier` |
| `StateNotifierProvider` | `@riverpod` class with `Notifier` |
| `ChangeNotifierProvider` | `@riverpod` class with `Notifier` |
| `import 'package:riverpod/legacy.dart'` | Never import legacy APIs |
| Typed ref subclass (`TaskDetailRef ref`) | `Ref ref` — Riverpod 3 uses a single `Ref` type; typed subclasses were a Riverpod 2 codegen artifact that no longer exists |
| `ref.watch` inside async/event handler | `ref.read` for one-shot reads in handlers |
| Accessing `state`/`ref` after `await` without `ref.mounted` check | Always check `ref.mounted` after `await` |
| `ProviderContainer()` + `addTearDown(container.dispose)` | `ProviderContainer.test(overrides: [...])` |
| `Timer.periodic` for polling data | `StreamProvider` or `Stream` return |
| `keepAlive: false` in annotation | Omit — false is the default |
| Manual providers without `@riverpod` annotation | Always use code generation |
| Catching raw exceptions from provider reads | Catch `ProviderException` |
| `overrideWith((_) => MockNotifier())` when only initial state needs seeding | `overrideWithBuild(...)` — keeps notifier methods intact, only seeds initial state |

---

### Linting and Formatting

| Tool | Purpose | Config File |
| --- | --- | --- |
| `dart format` | Canonical formatting | — (built-in) |
| `flutter analyze` | Static analysis + lint | `analysis_options.yaml` |
| `riverpod_lint` | Riverpod-specific lint rules | `dev_dependencies` |
| `dart pub deps` | Dependency audit | — |
| `dart run build_runner build` | Generate provider code | — |

**Mandatory `analysis_options.yaml` settings (Dart 3+):**
```yaml
analyzer:
  language:
    strict-casts: true
    strict-raw-types: true
  errors:
    invalid_assignment: error
  plugins:
    - riverpod_lint
linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - avoid_dynamic_calls
    - avoid_print
    - use_super_parameters
```

**After any code change involving providers, run:**
```bash
dart run build_runner build --delete-conflicting-outputs
flutter analyze
dart format .
```

**During active development, use `watch` mode to avoid re-running manually:**
```bash
dart run build_runner watch --delete-conflicting-outputs
```

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Project Structure — Flutter Mobile @project-structure-flutter-mobile.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Dependency Management Principles @dependency-management-principles.md
