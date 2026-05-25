---
paths:
  - "**/*.swift"
  - "**/Package.swift"
---

## Swift Idioms and Patterns

Swift rewards value types, optionals, and protocol-oriented design. Idiomatic Swift = safe, expressive, Swifty.

> Scope: Swift coding idioms. Test naming: .agents/rules/testing-strategy.md.

### Value Types and Optionals

1. **Prefer structs over classes** — value semantics by default. Classes only for identity, inheritance, or reference counting.
2. **Optionals — never force-unwrap (`!`) in production:**
   ```swift
   // ✅ Guard let for early exit
   guard let task = storage.findById(id) else {
       throw TaskError.notFound(id)
   }

   // ✅ Optional chaining
   let title = task?.title ?? "Untitled"

   // ✅ if let for conditional binding
   if let deadline = task.deadline {
       scheduleReminder(for: deadline)
   }

   // ❌ Force unwrap — crash risk
   let task = storage.findById(id)!
   ```

3. **Property wrappers** for reusable behavior:
   ```swift
   @propertyWrapper
   struct Clamped<Value: Comparable> {
       var wrappedValue: Value {
           didSet { wrappedValue = min(max(wrappedValue, range.lowerBound), range.upperBound) }
       }
       let range: ClosedRange<Value>

       init(wrappedValue: Value, _ range: ClosedRange<Value>) {
           self.range = range
           self.wrappedValue = min(max(wrappedValue, range.lowerBound), range.upperBound)
       }
   }

   struct Task {
       @Clamped(0...100) var progress: Int = 0
   }
   ```

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`.

1. **Typed throws (Swift 6) or `Error` protocol:**
   ```swift
   enum TaskError: Error, LocalizedError {
       case notFound(String)
       case validationFailed(field: String, message: String)
       case storageUnavailable

       var errorDescription: String? {
           switch self {
           case .notFound(let id): "Task '\(id)' not found"
           case .validationFailed(let field, let msg): "Validation failed on \(field): \(msg)"
           case .storageUnavailable: "Storage is unavailable"
           }
       }
   }

   func getTask(id: String) throws(TaskError) -> Task { ... }
   ```

2. **`Result` type for async callbacks** (pre-async/await):
   ```swift
   func fetchTask(id: String) async -> Result<Task, TaskError> { ... }
   ```

3. **`do`/`catch` with pattern matching:**
   ```swift
   do {
       let task = try getTask(id: "123")
       process(task)
   } catch TaskError.notFound(let id) {
       logger.warn("Task not found", metadata: ["taskId": id])
   } catch {
       logger.error("Unexpected error", metadata: ["error": "\(error)"])
   }
   ```

4. **`defer` for cleanup:**
   ```swift
   func processFile(at path: String) throws -> Data {
       let handle = try FileHandle(forReadingFrom: URL(fileURLWithPath: path))
       defer { handle.closeFile() }  // ✅ Always runs on exit

       return handle.readDataToEndOfFile()
   }
   ```

### Protocol-Oriented Design

1. **Protocols over abstract classes:**
   ```swift
   // ✅ Interface defined as protocol
   protocol TaskStorage {
       func getById(_ id: String) async throws -> Task?
       func save(_ task: Task) async throws
   }

   // ✅ Production implementation
   struct PostgresTaskStorage: TaskStorage {
       let pool: ConnectionPool

       func getById(_ id: String) async throws -> Task? {
           try await pool.query("SELECT * FROM tasks WHERE id = $1", [id]).first
       }

       func save(_ task: Task) async throws {
           try await pool.execute("INSERT INTO tasks ...", [task.id, task.title])
       }
   }

   // ✅ Test implementation
   struct MockTaskStorage: TaskStorage {
       var tasks: [Task] = []

       func getById(_ id: String) async throws -> Task? {
           tasks.first { $0.id == id }
       }

       func save(_ task: Task) async throws {
           tasks.append(task)
       }
   }
   ```

2. **Protocol extensions for default implementations:**
   ```swift
   protocol Identifiable {
       var id: String { get }
   }

   extension Identifiable {
       var isNew: Bool { id.isEmpty }
   }
   ```

3. **Associated types for generic protocols:**
   ```swift
   protocol Repository {
       associatedtype Entity
       func findById(_ id: String) async throws -> Entity?
       func save(_ entity: Entity) async throws
   }
   ```

### Concurrency

1. **Structured concurrency with `async`/`await`:**
   ```swift
   func loadDashboard() async throws -> Dashboard {
       async let user = fetchUser(id)
       async let tasks = fetchTasks(userId: id)
       async let stats = fetchStats()

       return Dashboard(
           user: try await user,
           tasks: try await tasks,
           stats: try await stats
       )
   }
   ```

2. **`@Sendable`** for closures crossing concurrency domains.
3. **Actors** for thread-safe mutable state:
   ```swift
   actor TaskCache {
       private var cache: [String: Task] = [:]

       func get(_ id: String) -> Task? { cache[id] }
       func set(_ id: String, task: Task) { cache[id] = task }
       func invalidate(_ id: String) { cache.removeValue(forKey: id) }
   }

   // ✅ Safe concurrent access
   let cache = TaskCache()
   await cache.set("123", task: newTask)
   if let task = await cache.get("123") { ... }
   ```

4. **`TaskGroup`** for dynamic concurrency:
   ```swift
   func fetchAllTasks(ids: [String]) async throws -> [Task] {
       try await withThrowingTaskGroup(of: Task.self) { group in
           for id in ids {
               group.addTask { try await fetchTask(id: id) }
           }
           return try await group.reduce(into: []) { $0.append($1) }
       }
   }
   ```

### Naming (Swift API Design Guidelines)

1. **camelCase** for functions, properties, variables.
2. **PascalCase** for types, protocols, enums.
3. **Omit needless words** — `remove(at:)` not `removeItem(atIndex:)`.
4. **Protocols for capabilities** use `-able`/`-ible`: `Codable`, `Identifiable`.
5. **Factory methods** use `make` prefix: `makeIterator()`.
6. **Boolean properties** read as assertions: `isEmpty`, `hasChanges`, `isValid`.

### Anti-Patterns

- ❌ **Force unwrap (`!`) in production code** — crashes at runtime
- ❌ **`var` when `let` suffices** — always prefer immutability
- ❌ **Classes when structs work** — unnecessary reference semantics
- ❌ **Stringly-typed APIs** — use enums for finite option sets
- ❌ **Massive view controllers** — extract to view models, coordinators
- ❌ **`try?` silently discarding errors** — log or handle the error case
- ❌ **Nested `if let` pyramids** — use `guard let` for early returns

```swift
// ❌ Pyramid of doom
if let user = getUser() {
    if let tasks = getTasks(for: user) {
        if let first = tasks.first {
            process(first)
        }
    }
}

// ✅ Flat with guard
guard let user = getUser() else { return }
guard let tasks = getTasks(for: user), let first = tasks.first else { return }
process(first)
```

### Testing

XCTest or Swift Testing (6.0+). Mock via protocols.

```swift
// XCTest
final class TaskServiceTests: XCTestCase {
    func testGetTask_returnsNotFound() async throws {
        let storage = MockTaskStorage()
        let service = TaskService(storage: storage)

        do {
            _ = try await service.getTask(id: "999")
            XCTFail("Expected notFound error")
        } catch TaskError.notFound(let id) {
            XCTAssertEqual(id, "999")
        }
    }
}

// Swift Testing (6.0+)
@Test func getTask_returnsNotFound() async throws {
    let storage = MockTaskStorage()
    let service = TaskService(storage: storage)

    #expect(throws: TaskError.notFound("999")) {
        try await service.getTask(id: "999")
    }
}
```

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `swift-format` | Formatting | `swift-format -i -r Sources/` |
| SwiftLint | Linting | `swiftlint lint --strict` |
| Xcode Analyzer | Static analysis | Built-in |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
