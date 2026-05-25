# Swift Performance Profiling

> **Applicability:** Swift server-side (Vapor, Hummingbird), iOS/macOS applications, and Swift Package libraries.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| Instruments (Time Profiler) | CPU profiling with flamegraph | Xcode → Product → Profile → Time Profiler |
| Instruments (Allocations) | Memory allocation tracking | Xcode → Product → Profile → Allocations |
| Instruments (Leaks) | Retain cycle detection | Xcode → Product → Profile → Leaks |
| `xctrace` (CLI) | Command-line profiling | `xcrun xctrace record --template "Time Profiler" --launch -- ./app` |
| `swift build -c release` | Optimized build | Ensures compiler optimizations are applied |
| `swift package benchmark` | Package-level benchmarking | `swift package benchmark` (requires swift-benchmark) |
| MetricKit | Production performance data (iOS) | Automatic — delivered via `MXMetricManager` |
| os_signpost | Custom performance intervals | `os_signpost(.begin, ...)` / `os_signpost(.end, ...)` |

---

## Optimization Patterns

### Pattern: Value Type Performance

**Symptom:** High allocation rate. Instruments Allocations shows many heap-allocated objects.

```swift
// ❌ Class — heap allocated, reference counted
class TaskResult {
    let id: String
    let title: String
    let duration: TimeInterval
}

// ✅ Struct — stack allocated, no ARC overhead
struct TaskResult {
    let id: String
    let title: String
    let duration: TimeInterval
}

// ✅ For small, frequently-created types:
// Structs with ≤3 machine-word-sized fields are passed in registers
struct Point { let x: Double; let y: Double }  // 2 words — register-friendly
```

### Pattern: Copy-on-Write for Collections

**Symptom:** Unexpected copies of large arrays or dictionaries in hot paths.

```swift
// ✅ Swift collections use CoW — only copies on mutation
var tasks = originalTasks  // No copy yet — shared storage
tasks.append(newTask)      // Copy happens here (only if shared)

// ⚠️ Be aware: passing Array to a function that mutates it triggers copy
func process(_ tasks: inout [Task]) {
    tasks.sort { $0.priority > $1.priority }  // Copy if shared
}

// ✅ For large custom types, implement CoW manually
final class TaskStorageBuffer {
    var tasks: [Task]
}

struct TaskCollection {
    private var buffer: TaskStorageBuffer

    mutating func append(_ task: Task) {
        if !isKnownUniquelyReferenced(&buffer) {
            buffer = TaskStorageBuffer(tasks: buffer.tasks)  // Copy only when shared
        }
        buffer.tasks.append(task)
    }
}
```

### Pattern: Lazy Properties and Deferred Computation

**Symptom:** Expensive initialization running even when property is never accessed.

```swift
// ❌ Computed on every access
var formattedDate: String {
    DateFormatter.localizedString(from: date, dateStyle: .long, timeStyle: .short)
}

// ✅ Lazy — computed once, cached
lazy var formattedDate: String = {
    DateFormatter.localizedString(from: date, dateStyle: .long, timeStyle: .short)
}()

// ✅ Static lazy — thread-safe by language guarantee
static let dateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateStyle = .long
    f.timeStyle = .short
    return f
}()
```

### Pattern: Concurrency with TaskGroup

**Symptom:** Sequential async operations where parallel execution is possible.

```swift
// ❌ Sequential — total time = sum of all fetches
func fetchAllTasks(ids: [String]) async throws -> [Task] {
    var tasks: [Task] = []
    for id in ids {
        let task = try await fetchTask(id: id)  // Sequential!
        tasks.append(task)
    }
    return tasks
}

// ✅ Parallel — total time = max of all fetches
func fetchAllTasks(ids: [String]) async throws -> [Task] {
    try await withThrowingTaskGroup(of: Task.self) { group in
        for id in ids {
            group.addTask { try await self.fetchTask(id: id) }
        }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}
```

### Pattern: Custom os_signpost for Profiling

**Symptom:** Need to measure specific operations in Instruments.

```swift
import os

private let perfLog = OSLog(subsystem: "com.myapp", category: .pointsOfInterest)

func processTask(_ task: Task) async throws {
    os_signpost(.begin, log: perfLog, name: "ProcessTask", "%{public}s", task.id)
    defer { os_signpost(.end, log: perfLog, name: "ProcessTask") }

    // ... work ...
}
// Shows up in Instruments → Points of Interest
```

---

## Anti-Patterns

1. **Don't use `class` when `struct` suffices** — heap allocation + ARC overhead is measurable.
2. **Don't force-cast in hot paths** — `as!` includes runtime type check. Use generics.
3. **Don't use `String` interpolation in disabled log levels** — use `os_log` with lazy formatting.
4. **Don't hold locks across `await` points** — blocks the actor/thread pool.
5. **Don't ignore ARC overhead** — each strong reference bump is an atomic operation.
6. **Don't create `DateFormatter` per call** — use static cached instance (expensive to create).

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| ARC retain/release | ~10ns per operation | Atomic reference counting |
| Swift struct copy (>3 words) | Proportional to size | Memcpy for stack-allocated values |
| Protocol witness table lookup | ~2ns | Dynamic dispatch overhead |
| `async`/`await` suspension | ~100ns | Continuation allocation and scheduling |
| `Codable` decoding | Proportional to payload | Reflection-based by default |
| Actor message send | ~100ns | Mailbox queuing overhead |

---

## Benchmarking

```swift
// Using swift-benchmark package
import Benchmark

let benchmarks = {
    Benchmark("Create Task") { benchmark in
        for _ in benchmark.scaledIterations {
            blackHole(Task(title: "Test", priority: .high))
        }
    }

    Benchmark("Serialize Task") { benchmark in
        let encoder = JSONEncoder()
        for _ in benchmark.scaledIterations {
            blackHole(try! encoder.encode(task))
        }
    }
}

// Run: swift package benchmark
```

---

## Related
- Swift Idioms @.agents/skills/swift-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
