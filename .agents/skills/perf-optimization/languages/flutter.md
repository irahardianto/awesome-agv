# Flutter / Dart Performance Profiling

> **Applicability:** Flutter mobile/web/desktop applications and Dart server-side code.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| Flutter DevTools (Performance) | Frame rendering timeline | `flutter run --profile` → DevTools → Performance |
| Flutter DevTools (Memory) | Heap snapshots, allocation tracking | DevTools → Memory tab |
| Flutter DevTools (App Size) | Analyze APK/IPA composition | `flutter build apk --analyze-size` |
| Dart Observatory | VM-level profiling | Built-in at `http://127.0.0.1:8181/` in debug mode |
| `dart compile exe` + profiling | AOT-compiled performance | `dart compile exe bin/server.dart` |
| `flutter test --profile` | Test performance in profile mode | Closer to production behavior |

**Critical:** Always profile in **profile mode** (`flutter run --profile`). Debug mode has significant overhead that makes measurements meaningless.

---

## Optimization Patterns

### Pattern: const Constructors

**Symptom:** DevTools shows widgets rebuilding on every frame. Build times in timeline are high.

**Root cause:** Non-const widgets are always reconstructed, even if nothing changed.

```dart
// ❌ Rebuilt on every parent rebuild — new instance each time
return Padding(
  padding: EdgeInsets.all(16),
  child: Text('Hello'),
);

// ✅ const — same instance reused, skipped during rebuild
return const Padding(
  padding: EdgeInsets.all(16),
  child: Text('Hello'),
);

// ✅ Enable const detection lint
# analysis_options.yaml
linter:
  rules:
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_const_literals_to_create_immutables
```

### Pattern: ListView.builder for Long Lists

**Symptom:** High memory usage and jank when displaying lists. All items built upfront.

```dart
// ❌ All items built immediately — O(n) memory and build time
Column(
  children: items.map((item) => TaskCard(task: item)).toList(),
)

// ❌ ListView with children — also builds all at once
ListView(
  children: items.map((item) => TaskCard(task: item)).toList(),
)

// ✅ ListView.builder — only builds visible items + buffer
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => TaskCard(task: items[index]),
)

// ✅ For grid layouts
GridView.builder(
  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2),
  itemCount: items.length,
  itemBuilder: (context, index) => TaskCard(task: items[index]),
)
```

### Pattern: Image Optimization

**Symptom:** High memory usage from images. Jank during image loading.

```dart
// ❌ Full-resolution image in small widget
Image.network('https://example.com/photo.jpg')  // 4000x3000 decoded!

// ✅ Constrained decode — reduces memory
Image.network(
  'https://example.com/photo.jpg',
  cacheWidth: 200,   // Decode at display size
  cacheHeight: 200,
)

// ✅ Cached network images with placeholder
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  memCacheWidth: 200,
)
```

### Pattern: Isolate for CPU-Heavy Work

**Symptom:** UI jank during data processing. Frame time exceeds 16ms (60fps) or 8ms (120fps).

```dart
// ❌ Heavy computation on main isolate — blocks UI
void processData() {
  final result = expensiveComputation(largeDataSet);  // UI frozen!
  setState(() => _result = result);
}

// ✅ compute() for simple functions
void processData() async {
  final result = await compute(expensiveComputation, largeDataSet);
  if (!mounted) return;
  setState(() => _result = result);
}

// ✅ Isolate.run for more control (Dart 2.19+)
void processData() async {
  final result = await Isolate.run(() => expensiveComputation(largeDataSet));
  if (!mounted) return;
  setState(() => _result = result);
}
```

### Pattern: Minimize Widget Rebuilds

**Symptom:** DevTools Performance shows large widget subtrees rebuilding unnecessarily.

```dart
// ❌ Entire screen rebuilds when only counter changes
class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),  // Rebuilds unnecessarily
      body: Center(child: Text('$count')),
      // ... lots of other widgets that don't depend on count
    );
  }
}

// ✅ Only the dependent widget rebuilds
class CounterScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),  // Never rebuilds
      body: Center(child: const CounterText()),       // Only this rebuilds
    );
  }
}

class CounterText extends ConsumerWidget {
  const CounterText({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('$count');  // Minimal rebuild scope
  }
}
```

### Pattern: RepaintBoundary for Complex UI

**Symptom:** DevTools shows large repaint areas. Complex static widgets repainted on every frame.

```dart
// ✅ Isolate repaint regions
RepaintBoundary(
  child: ComplexChart(data: chartData),  // Only repaints when its own data changes
)
```

---

## Anti-Patterns

1. **Don't profile in debug mode** — results are meaningless due to JIT and disabled optimizations.
2. **Don't put API calls in `build()`** — triggers on every rebuild.
3. **Don't use `Column` for long lists** — use `ListView.builder` for virtualization.
4. **Don't decode images at full resolution** — use `cacheWidth`/`cacheHeight`.
5. **Don't block main isolate with computation** — use `compute()` or `Isolate.run()`.
6. **Don't rebuild entire screen for single value change** — scope `ref.watch` to smallest widget.
7. **Don't ignore `const` constructors** — they prevent unnecessary widget instantiation.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| Frame budget (60fps) | 16.67ms per frame | Display refresh rate |
| Frame budget (120fps) | 8.33ms per frame | High refresh rate displays |
| Widget `build()` overhead | ~0.01ms per simple widget | Framework traversal cost |
| Platform channel call | ~0.1ms | Dart→Native serialization + context switch |
| Image decode (JPEG) | ~5-50ms per image | Decoder computational cost |
| Isolate spawn | ~5-20ms | New Dart isolate initialization |
| `compute()` overhead | ~2-5ms | Isolate creation for single computation |

---

## Benchmarking

```dart
// Dart benchmark package
import 'package:benchmark_harness/benchmark_harness.dart';

class TaskCreationBenchmark extends BenchmarkBase {
  TaskCreationBenchmark() : super('TaskCreation');

  @override
  void run() {
    final task = Task(title: 'Test', priority: Priority.high);
    // Prevent compiler optimization
    assert(task.title.isNotEmpty);
  }
}

void main() {
  TaskCreationBenchmark().report();
}

// Run: dart run benchmark/task_benchmark.dart
```

```bash
# Flutter app size analysis
flutter build apk --analyze-size
# Generates: build/apk-code-size-analysis_*.json
# View in DevTools → App Size tab
```

---

## Related
- Flutter Idioms and Patterns @flutter-idioms-and-patterns.md
- Performance Optimization SKILL @../SKILL.md
- Resources and Memory Management @resources-and-memory-management-principles.md
