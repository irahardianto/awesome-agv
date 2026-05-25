# Flutter/Dart Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Flutter/Dart-specific symptoms, DevTools, and common widget/state issues.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| Widget not rebuilding | Check `ref.watch` vs `ref.read`, `stateNotifier` mutations, `setState` scope |
| `setState() called after dispose()` | Missing `mounted` check after `await` → add `if (!mounted) return;` |
| `RenderFlex overflowed` | Layout issue → wrap in `SingleChildScrollView`, `Expanded`, or `Flexible` |
| Jank / dropped frames | Flutter DevTools → Performance tab → find expensive `build()` methods |
| `LateInitializationError` | `late` variable used before assignment → initialize in `initState` or make nullable |
| `type 'Null' is not a subtype of type 'String'` | Null safety violation → check API response parsing and null checks |
| `MissingPluginException` | Native plugin not registered → `flutter clean` then `flutter pub get` |
| State lost on hot reload | State stored in widget tree → move to Riverpod/Bloc provider |
| `Looking up a deactivated widget's ancestor` | `BuildContext` used after widget removed from tree → check `mounted` |
| Slow app launch | Profile mode → check `main()` for heavy initialization, lazy-load features |

---

## Diagnostic Tools

### Flutter DevTools

```bash
# Launch DevTools
flutter pub global activate devtools
flutter pub global run devtools

# Or via CLI
dart devtools

# Key DevTools tabs:
# • Flutter Inspector — widget tree, render tree, constraints
# • Performance    — frame rendering timeline, jank detection
# • Memory         — heap snapshots, allocation tracking
# • Network        — HTTP request inspection
# • Logging        — structured log viewer
# • App Size       — analyze APK/IPA size by dependency
```

### Command-Line Debugging

```bash
# Run with verbose logging
flutter run -v

# Run in profile mode (measure real performance)
flutter run --profile

# Run in release mode (test production behavior)
flutter run --release

# Analyze widget rebuilds
flutter run --track-widget-creation

# Check for unused dependencies
flutter pub deps --no-dev

# Analyze app size
flutter build apk --analyze-size
flutter build ios --analyze-size
```

### Dart Observatory / VM Service

```dart
// Enable logging in debug builds
import 'dart:developer';

void debugAction() {
  log('Task created', name: 'TaskService', level: 800);
  Timeline.startSync('fetchTasks');
  // ... work ...
  Timeline.finishSync();
}

// Debug breakpoint (programmatic)
debugger(when: condition, message: 'Unexpected state');
```

---

## Common Flutter Bugs and Fixes

### Widget Not Rebuilding

**Symptom:** Data changes but UI stays stale. Provider state updates but widget doesn't re-render.

**Diagnosis checklist:**
1. Using `ref.watch` in `build()`? (`ref.read` doesn't trigger rebuilds.)
2. Is the state actually changing? (Add `log()` in the notifier/provider.)
3. Is a new object created? (`==` equality — if same reference, no rebuild.)
4. Is `const` widget blocking rebuild? (`const` widgets never rebuild.)

```dart
// ❌ ref.read doesn't trigger rebuilds
class TaskListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.read(tasksProvider);  // Won't rebuild!
    return ListView(children: tasks.map(TaskCard.new).toList());
  }
}

// ✅ ref.watch triggers rebuilds
final tasks = ref.watch(tasksProvider);

// ❌ Equality issue — list is same reference
class TaskNotifier extends StateNotifier<List<Task>> {
  void addTask(Task task) {
    state.add(task);  // Mutating in place — same reference!
    state = state;    // Even reassigning same ref — no rebuild
  }
}

// ✅ Create new list
void addTask(Task task) {
  state = [...state, task];  // New list → triggers rebuild
}
```

### Layout Overflow

**Symptom:** Yellow/black striped overflow warning in UI.

**Diagnosis:** Read the error message — it tells you which axis overflowed and by how many pixels.

```dart
// ❌ Column overflows when content exceeds screen
Column(
  children: [
    // ... many widgets that exceed screen height
  ],
)

// ✅ Scrollable
SingleChildScrollView(
  child: Column(
    children: [
      // ... now scrollable
    ],
  ),
)

// ❌ Row children too wide
Row(children: [Text('Very long title that overflows the screen')])

// ✅ Flexible width
Row(children: [
  Expanded(child: Text('Very long title', overflow: TextOverflow.ellipsis)),
])
```

### setState After Dispose

**Symptom:** `setState() or markNeedsBuild() called after dispose()` — red error screen.

**Common cause:** Async operation completes after widget is removed from tree.

```dart
// ❌ setState after dispose
Future<void> loadData() async {
  final data = await api.fetchData();
  setState(() {  // Widget might be disposed!
    this.data = data;
  });
}

// ✅ Check mounted
Future<void> loadData() async {
  final data = await api.fetchData();
  if (!mounted) return;  // Widget was disposed — bail out
  setState(() {
    this.data = data;
  });
}
```

### Performance Jank (Dropped Frames)

**Symptom:** UI stutters, DevTools Performance tab shows frames > 16ms.

**Diagnosis:**
1. Run in **profile mode** (`flutter run --profile`) — debug mode is always slower.
2. Open Flutter DevTools → Performance tab.
3. Look for expensive `build()` methods (red frames).
4. Check for rebuilds of large widget subtrees.

**Common causes:**
1. **Entire list rebuilding** instead of individual items → use `ListView.builder`.
2. **Expensive computation in `build()`** → move to provider or `compute()`.
3. **Missing `const` constructors** → widgets rebuild unnecessarily.
4. **Large images** → use `CachedNetworkImage` with proper `cacheWidth`/`cacheHeight`.

```dart
// ❌ Rebuilds all items on any change
Column(
  children: items.map((item) => TaskCard(task: item)).toList(),
)

// ✅ Only builds visible items, recycles off-screen
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => TaskCard(task: items[index]),
)
```

### Native Plugin Issues

**Symptom:** `MissingPluginException` or plugin works on one platform but not another.

**Fix workflow:**
```bash
# Clean rebuild
flutter clean
flutter pub get
cd ios && pod install && cd ..  # iOS only
flutter run
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| `ref.read` used in `build()` method | +80% confidence — change to `ref.watch` |
| DevTools shows same widget rebuilding on every frame | +50% confidence in missing `const` |
| Overflow error with exact pixel count | +90% confidence — layout constraint issue |
| Error only after `await` | +60% confidence in dispose/mounted issue |
| Profile mode is smooth, debug mode is janky | Normal — debug mode has overhead |

---

## Related
- Flutter Idioms and Patterns @flutter-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
