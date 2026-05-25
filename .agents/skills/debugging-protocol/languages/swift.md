# Swift Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Swift-specific symptoms, Xcode/LLDB tooling, and common concurrency and memory issues.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `Fatal error: Unexpectedly found nil` | Force unwrap (`!`) on a nil value → find the `!` and add `guard let` |
| EXC_BAD_ACCESS (SIGSEGV) | Dangling pointer or use-after-free → enable Address Sanitizer |
| Retain cycle / memory leak | Instruments → Leaks template → find the cycle → add `[weak self]` |
| App hang / main thread blocked | Main Thread Checker → find blocking call on main → move to background |
| `actor-isolated property cannot be referenced` | Concurrency isolation error → add `await` or move to correct actor |
| `Sendable` conformance error | Type shared across concurrency domains → make `Sendable` or use `@unchecked` |
| `precondition failure: index out of range` | Array bounds check → add guard or use `.indices.contains()` |
| Slow app launch | Instruments → App Launch template → find slow `didFinishLaunching` work |
| SwiftUI view not updating | Check `@Observable` / `@Published` → verify view depends on changed property |
| Test flakiness | Async test race → use `XCTestExpectation` with proper timeout |

---

## Diagnostic Tools

### LLDB (Xcode Debugger)

```
# Common LLDB commands
po expression           # Print object description
p expression            # Print raw value
bt                      # Backtrace (current thread)
bt all                  # Backtrace (all threads)
thread list             # List all threads
frame variable          # Show local variables
expr myVar = newValue   # Modify variable at runtime
watchpoint set variable myVar  # Break when variable changes

# Memory debugging
memory read <address>
swift-healthcheck       # Check Swift runtime health

# Conditional breakpoint
breakpoint set -n "TaskService.getTask" -c "id == \"123\""
```

### Instruments (Profiling)

```
# Key Instruments templates:
# • Leaks        — detect retain cycles and leaked objects
# • Allocations  — track memory allocations over time
# • Time Profiler — CPU profiling (flamegraph)
# • App Launch   — startup performance
# • Network      — HTTP request profiling
# • Core Data    — fetch/save performance

# Command-line profiling
xcrun xctrace record --template "Leaks" --launch -- /path/to/app
xcrun xctrace record --template "Time Profiler" --attach <pid> --time-limit 30s
```

### Runtime Sanitizers

```bash
# Address Sanitizer — detects use-after-free, buffer overflow
# Xcode: Edit Scheme → Diagnostics → Address Sanitizer ✓

# Thread Sanitizer — detects data races
# Xcode: Edit Scheme → Diagnostics → Thread Sanitizer ✓

# Main Thread Checker — detects UI work on background thread
# Xcode: Edit Scheme → Diagnostics → Main Thread Checker ✓
# (Enabled by default in debug builds)

# Undefined Behavior Sanitizer
# Xcode: Edit Scheme → Diagnostics → Undefined Behavior Sanitizer ✓
```

---

## Common Swift Bugs and Fixes

### Retain Cycle (Memory Leak)

**Symptom:** Memory grows over time. Instruments Leaks template shows leaked objects. `deinit` never called.

**Diagnosis:**
1. Open Instruments → Leaks template → run app through the leaking flow.
2. Look for leaked objects → trace the reference cycle.
3. Check closures stored as properties or passed to long-lived objects.

```swift
// ❌ Retain cycle — ViewModel holds closure, closure captures self
class TaskViewModel {
    var onUpdate: (() -> Void)?
}

class TaskViewController: UIViewController {
    let viewModel = TaskViewModel()

    override func viewDidLoad() {
        viewModel.onUpdate = {
            self.updateUI()  // Strong reference to self → cycle!
        }
    }
}

// ✅ Weak capture breaks the cycle
viewModel.onUpdate = { [weak self] in
    self?.updateUI()
}
```

### Actor Isolation Errors (Swift 6)

**Symptom:** Compiler error: "actor-isolated property ... cannot be referenced from a nonisolated context".

**Diagnosis:** Understand which isolation domain each piece of code belongs to.

```swift
// ❌ Accessing actor state from outside without await
actor TaskCache {
    var tasks: [String: Task] = [:]
}

func printTasks(cache: TaskCache) {
    print(cache.tasks)  // Error: actor-isolated
}

// ✅ Await actor access
func printTasks(cache: TaskCache) async {
    let tasks = await cache.tasks
    print(tasks)
}

// ✅ For @MainActor UI updates
@MainActor
func updateUI(with task: Task) {
    titleLabel.text = task.title  // Safe — on main actor
}
```

### Main Thread Blocking

**Symptom:** UI freezes, purple "Main Thread Checker" warning in Xcode.

**Diagnosis:** Main Thread Checker (enabled by default) will highlight the violation.

```swift
// ❌ Blocking main thread with synchronous I/O
func viewDidLoad() {
    let data = try! Data(contentsOf: largeFileURL)  // Blocks UI!
    processData(data)
}

// ✅ Background processing
func viewDidLoad() {
    Task {
        let data = try await loadData(from: largeFileURL)
        await MainActor.run {
            processData(data)  // UI update on main
        }
    }
}
```

### SwiftUI View Not Updating

**Symptom:** State changes but view doesn't re-render.

**Diagnosis checklist:**
1. Is the property marked `@State`, `@Binding`, `@Published`, or `@Observable`?
2. Is the view actually reading the property in `body`?
3. Is `@ObservableObject` using `@Published` on changed properties?
4. For `@Observable` (Swift 5.9+), is the view accessing the property directly?

```swift
// ❌ View doesn't update — property not observed
class TaskViewModel {
    var tasks: [Task] = []  // Not @Published!
}

// ✅ Observable property
@Observable
class TaskViewModel {
    var tasks: [Task] = []  // Automatically tracked by @Observable
}
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Instruments Leaks shows specific object type | +60% confidence in retain cycle |
| Thread Sanitizer reports data race | +70% confidence in concurrency bug |
| `deinit` never called on expected dealloc | +50% confidence in retain cycle |
| Main Thread Checker triggers | +80% confidence — move work to background |
| Error only with `-strict-concurrency=complete` | Concurrency safety issue |

---

## Related
- Swift Idioms @.agents/skills/swift-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
