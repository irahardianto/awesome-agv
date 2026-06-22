# Flutter/Dart Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Flutter/Dart code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `setState()` in complex widget (>50 lines) | Major | `[ARCH]` | Use Riverpod/Bloc provider — `setState` for tiny local widgets only |
| Missing `dispose()` for controllers/streams | Critical | `[RES]` | Override `dispose()` and call `controller.dispose()` |
| `late` without null-safety justification | Major | `[ERR]` | Use nullable type with null check, or initialize in `initState` |
| `print()` in production code | Major | `[OBS]` | Use `dart:developer` `log()` or structured logger |
| Hardcoded colors / magic numbers | Major | `[PAT]` | Use theme extensions or design tokens |
| Hardcoded strings in UI | Major | `[PAT]` | Use localization (`AppLocalizations`) |
| Missing `const` on constructors that can be const | Major | `[PAT]` | Add `const` — enables widget caching |
| `dynamic` type usage | Major | `[ERR]` | Use specific types — `dynamic` disables type checking |
| `catch (e) { }` (empty catch) | Critical | `[ERR]` | Handle, log, or rethrow the exception |
| `BuildContext` used after `await` | Critical | `[ERR]` | Check `mounted` before using context after async gap |
| Widget rebuild causing `initState` re-run | Critical | `[ERR]` | Extract stateful logic to provider/controller |
| `Navigator.push` without route constants | Major | `[PAT]` | Use named routes or GoRouter with typed routes |
| API call in `build()` method | Critical | `[ERR]` | Move to `initState`, provider, or FutureBuilder |
| `GlobalKey` used for widget communication | Major | `[ARCH]` | Use state management (Riverpod, Bloc) |

---

## Detection Commands

```bash
# setState in large widgets
grep -rn 'setState(' --include='*.dart' | grep -v 'test\|_test\.'

# Missing dispose
grep -rn 'TextEditingController\|ScrollController\|AnimationController\|StreamSubscription\|StreamController' --include='*.dart' | grep -v 'dispose\|test'

# late usage
grep -rn 'late ' --include='*.dart' | grep -v 'test\|_test\.'

# print in production
grep -rn "print(" --include='*.dart' | grep -v 'test\|_test\.\|example'

# dynamic type
grep -rn ': dynamic\|<dynamic>' --include='*.dart' | grep -v 'test\|generated'

# Empty catch
grep -rn 'catch' --include='*.dart' -A1 | grep -B1 '^\s*}'

# BuildContext after await
grep -rn 'await' --include='*.dart' -A5 | grep 'context\.\|Navigator\.\|ScaffoldMessenger\.'

# API calls in build
grep -rn '@override\s*Widget build' --include='*.dart' -A20 | grep 'http\.\|dio\.\|fetch\|api\.'

# Missing const constructors
grep -rn 'Widget build' --include='*.dart' -A5 | grep 'return.*(' | grep -v 'const '
```

---

## Correct Patterns (Reference)

### State Management

```dart
// ❌ setState for complex state
class TaskListScreen extends StatefulWidget { ... }
class _TaskListScreenState extends State<TaskListScreen> {
  List<Task> tasks = [];
  bool isLoading = false;

  void loadTasks() {
    setState(() { isLoading = true; });
    api.getTasks().then((result) {
      setState(() { tasks = result; isLoading = false; });
    });
  }
}

// ✅ Riverpod provider
@riverpod
Future<List<Task>> tasks(Ref ref) async {
  final api = ref.watch(taskApiProvider);
  return api.getTasks();
}

class TaskListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);
    return tasksAsync.when(
      data: (tasks) => TaskListView(tasks: tasks),
      loading: () => const CircularProgressIndicator(),
      error: (e, st) => ErrorWidget(error: e),
    );
  }
}
```

### Resource Cleanup

```dart
// ❌ Missing dispose — memory leak
class _MyState extends State<MyWidget> {
  final controller = TextEditingController();
  late StreamSubscription _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = stream.listen(handleEvent);
  }
  // No dispose()!
}

// ✅ Proper cleanup
@override
void dispose() {
  controller.dispose();
  _subscription.cancel();
  super.dispose();
}
```

### Async Safety

```dart
// ❌ BuildContext used after await — might be unmounted
Future<void> saveTask() async {
  await api.save(task);
  Navigator.of(context).pop();  // context might be invalid!
}

// ✅ Check mounted first
Future<void> saveTask() async {
  await api.save(task);
  if (!mounted) return;
  Navigator.of(context).pop();
}
```

### Const Constructors

```dart
// ❌ Non-const — rebuilt every time parent rebuilds
return Padding(
  padding: EdgeInsets.all(16),
  child: Text('Hello'),
);

// ✅ Const — cached, skipped during rebuild
return const Padding(
  padding: EdgeInsets.all(16),
  child: Text('Hello'),
);
```

---

## References
- Flutter Idioms and Patterns @.agents/skills/flutter-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
