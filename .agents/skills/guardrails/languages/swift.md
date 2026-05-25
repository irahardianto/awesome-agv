# Swift Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Swift.

---

## Optionals and Safety

- [ ] **No force unwrap (`!`)** in production code — use `guard let`, `if let`, or `??`
- [ ] **No `try!`** — use `do/catch` with proper error handling
- [ ] **No `as!` force cast** — use `as?` with conditional binding
- [ ] **`let` over `var`** — immutability by default
- [ ] **`guard let` for early returns** — avoid nested `if let` pyramids

---

## Error Handling

- [ ] **`do/catch` blocks** catch specific error types, not just generic `error`
- [ ] **No `try?` without handling the `nil` case** — at minimum log the failure
- [ ] **Custom error types** conform to `Error` and `LocalizedError`
- [ ] **`defer` for cleanup** — file handles, locks, temporary state

### Correct Patterns

```swift
// ✅ Typed error handling
do {
    let task = try service.getTask(id: taskId)
    display(task)
} catch TaskError.notFound(let id) {
    showNotFoundAlert(for: id)
} catch {
    logger.error("Unexpected error", metadata: ["error": "\(error)"])
}
```

---

## Memory Management

- [ ] **`[weak self]` or `[unowned self]`** in closures that capture `self` and outlive the caller
- [ ] **No retain cycles** — closures stored as properties use `[weak self]`
- [ ] **`deinit` called** when expected — verify with breakpoint or log
- [ ] **`@Sendable`** on closures crossing actor/isolation boundaries

---

## Protocol-Oriented Design

- [ ] **Protocols for interfaces** — not abstract classes
- [ ] **Protocol extensions** for default implementations
- [ ] **`Codable`** on all data transfer types
- [ ] **`Sendable`** on types shared across concurrency domains

---

## Concurrency

- [ ] **`async/await`** for all asynchronous operations — no completion handler callbacks for new code
- [ ] **`actor`** for shared mutable state — not manual locks
- [ ] **`@MainActor`** on UI-updating code
- [ ] **`TaskGroup`** for dynamic parallelism — not spawning unbounded tasks
- [ ] **No `DispatchQueue.main.sync`** from main thread — deadlock

---

## SwiftUI (when applicable)

- [ ] **Views are small** (<100 lines) — extract subviews
- [ ] **`@State` is private** — not exposed to parent views
- [ ] **`@Binding`** for child-to-parent communication
- [ ] **`@Observable`** (or `@ObservableObject`) for view models — not raw classes

---

## Observability

- [ ] **No `print()`** in production — use `os.Logger` or structured logging framework
- [ ] **Structured log metadata** — key-value pairs, not string interpolation

---

## Static Analysis

- [ ] `swiftlint lint --strict` passes with zero violations
- [ ] `swift build` passes with zero warnings
- [ ] No `// swiftlint:disable` without rationale comment

---

## References
- Swift Idioms @.agents/skills/swift-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
