# Swift Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Swift code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| Force unwrap (`!`) in production code | Critical | `[ERR]` | Use `guard let`, `if let`, or `??` with default |
| `try?` silently discarding errors | Major | `[ERR]` | Use `do/catch` and handle/log the error |
| `try!` in production code | Critical | `[ERR]` | Use `do/catch` — `try!` crashes on error |
| `class` when `struct` suffices | Major | `[PAT]` | Use `struct` for value semantics by default |
| Retain cycle in closures | Critical | `[RES]` | Use `[weak self]` or `[unowned self]` |
| `var` when `let` suffices | Major | `[PAT]` | Prefer `let` — immutability by default |
| `print()` in production code | Major | `[OBS]` | Use `os.Logger` or structured logging framework |
| `NSObject` subclass without need | Major | `[PAT]` | Use Swift-native types — protocols + structs |
| Stringly-typed API (string for finite options) | Major | `[PAT]` | Use `enum` with specific cases |
| Missing `@Sendable` on closures crossing isolation | Critical | `[ERR]` | Add `@Sendable` for concurrency safety |
| `DispatchQueue.main.sync` from main thread | Critical | `[ERR]` | Deadlock — use `DispatchQueue.main.async` |
| Massive view controller / SwiftUI view (>200 lines) | Major | `[ARCH]` | Extract to smaller views and view models |
| `as!` force cast | Critical | `[ERR]` | Use `as?` with conditional binding |
| Nested `if let` pyramid | Major | `[PAT]` | Use `guard let` for early returns |

---

## Detection Commands

```bash
# Force unwrap (exclude tests)
grep -rn '!\s*$\|\.unwrap\|[a-zA-Z]!' --include='*.swift' | grep -v 'Tests/\|test\|IBOutlet\|IBAction\|!='

# try? silently discarding
grep -rn 'try?' --include='*.swift' | grep -v 'test\|Test'

# try! in production
grep -rn 'try!' --include='*.swift' | grep -v 'test\|Test'

# print() in production
grep -rn 'print(' --include='*.swift' | grep -v 'Tests/\|test\|Preview'

# Force cast
grep -rn ' as! ' --include='*.swift' | grep -v 'test\|Test'

# var when let could work (heuristic — check if value is ever reassigned)
grep -rn '^\s*var ' --include='*.swift' | grep -v 'test\|Test\|@State\|@Binding\|didSet\|willSet'

# Retain cycle risk (closure without weak/unowned)
grep -rn '\{ self\.' --include='*.swift' | grep -v '\[weak\|unowned\|test\|Test'

# DispatchQueue.main.sync
grep -rn 'DispatchQueue\.main\.sync' --include='*.swift'
```

---

## Correct Patterns (Reference)

### Optional Handling

```swift
// ❌ Force unwrap — crash risk
let name = user!.name

// ✅ Guard let — early exit
guard let user = fetchUser(id: userId) else {
    throw UserError.notFound(userId)
}
let name = user.name

// ❌ Nested if let pyramid
if let user = getUser() {
    if let profile = user.profile {
        if let avatar = profile.avatar {
            display(avatar)
        }
    }
}

// ✅ Flat guard chain
guard let user = getUser(),
      let profile = user.profile,
      let avatar = profile.avatar else { return }
display(avatar)
```

### Memory Management

```swift
// ❌ Retain cycle — self strongly captured
viewModel.onComplete = { result in
    self.display(result)  // Strong reference cycle!
}

// ✅ Weak capture
viewModel.onComplete = { [weak self] result in
    self?.display(result)
}
```

### Error Handling

```swift
// ❌ try? silently discards error
let data = try? fetchData(url)

// ✅ Handle the error
do {
    let data = try fetchData(url)
    process(data)
} catch {
    logger.error("Fetch failed", metadata: ["url": "\(url)", "error": "\(error)"])
}
```

### Value Types

```swift
// ❌ Class for simple data carrier
class TaskResponse {
    var id: String
    var title: String
    init(id: String, title: String) {
        self.id = id
        self.title = title
    }
}

// ✅ Struct — value semantics, immutable by default
struct TaskResponse: Codable, Sendable {
    let id: String
    let title: String
}
```

---

## References
- Swift Idioms @.agents/skills/swift-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
