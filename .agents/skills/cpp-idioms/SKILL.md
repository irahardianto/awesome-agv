---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.h"
  - "**/CMakeLists.txt"
---

## C++ Idioms and Patterns

Modern C++ (17/20/23) rewards RAII, value semantics, and zero-cost abstractions. Lean into the type system and smart pointers. Idiomatic C++ = safe, deterministic, performant.

> Scope: C++ coding idioms. Test naming: .agents/rules/testing-strategy.md.

### Ownership and Memory

1. **RAII — resources tied to object lifetime. No manual `new`/`delete`.**
2. **`std::unique_ptr` for exclusive ownership, `std::shared_ptr` only when sharing is necessary.**
3. **Move semantics — prefer moving over copying for expensive types.**
4. **Rule of Five/Zero:**
   ```cpp
   // ✅ Rule of Zero — let compiler-generated defaults work
   class TaskService {
       std::unique_ptr<TaskStorage> storage_;
       std::shared_ptr<Logger> logger_;
   public:
       // No destructor, copy/move constructors needed — smart pointers handle it
       explicit TaskService(std::unique_ptr<TaskStorage> storage, std::shared_ptr<Logger> logger)
           : storage_(std::move(storage)), logger_(std::move(logger)) {}
   };

   // ✅ Rule of Five — when managing raw resources (rare)
   class Buffer {
       char* data_;
       size_t size_;
   public:
       ~Buffer();                                   // Destructor
       Buffer(const Buffer&);                       // Copy constructor
       Buffer& operator=(const Buffer&);            // Copy assignment
       Buffer(Buffer&&) noexcept;                   // Move constructor
       Buffer& operator=(Buffer&&) noexcept;        // Move assignment
   };
   ```

5. **Pass by value and move for sink parameters:**
   ```cpp
   // ✅ Sink parameter — takes ownership
   void addTask(Task task) {
       tasks_.push_back(std::move(task));
   }

   // ✅ Read-only — const reference
   void printTask(const Task& task);

   // ❌ Never pass smart pointers unless transferring ownership
   void processTask(std::shared_ptr<Task> task);  // Unnecessary ref-count bump

   // ✅ If function doesn't need ownership
   void processTask(const Task& task);
   ```

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`. Below: language-specific patterns only.

1. **`std::expected` (C++23) or Result types for expected failures:**
   ```cpp
   // ✅ C++23 std::expected
   std::expected<Task, TaskError> getTask(std::string_view id) {
       auto it = tasks_.find(id);
       if (it == tasks_.end()) {
           return std::unexpected(TaskError::NotFound);
       }
       return it->second;
   }

   // Caller handles both paths
   auto result = getTask("123");
   if (!result) {
       handleError(result.error());
       return;
   }
   processTask(*result);
   ```

2. **Exceptions for exceptional conditions only.** Never for control flow.
3. **`noexcept` on move constructors and destructors.**
4. **Domain error types:**
   ```cpp
   enum class TaskError {
       NotFound,
       ValidationFailed,
       StorageUnavailable,
   };

   // ✅ For exception-based paths
   class TaskNotFoundException : public std::runtime_error {
       std::string task_id_;
   public:
       explicit TaskNotFoundException(std::string id)
           : std::runtime_error("Task not found: " + id), task_id_(std::move(id)) {}
       const std::string& task_id() const noexcept { return task_id_; }
   };
   ```

### Modern Features

1. **`std::string_view`** for read-only string parameters (no allocation):
   ```cpp
   // ✅ Zero-copy string parameter
   void log(std::string_view message, std::string_view context);

   // ❌ Unnecessary copy
   void log(const std::string& message);
   ```

2. **`constexpr`** for compile-time evaluation:
   ```cpp
   constexpr int maxRetries = 3;
   constexpr auto timeout = std::chrono::seconds(30);

   constexpr int factorial(int n) {
       return n <= 1 ? 1 : n * factorial(n - 1);
   }
   ```

3. **Structured bindings**: `auto [id, title] = getTask();`
4. **`std::optional`** for nullable values:
   ```cpp
   // ✅ Explicit nullability
   std::optional<Task> findById(std::string_view id);

   // Caller checks explicitly
   if (auto task = findById("123"); task.has_value()) {
       process(*task);
   }
   ```

5. **`std::variant`** for type-safe unions (sum types):
   ```cpp
   using TaskResult = std::variant<Task, TaskError>;

   TaskResult result = getTask(id);
   std::visit(overloaded{
       [](const Task& task) { process(task); },
       [](TaskError err) { handleError(err); },
   }, result);
   ```

6. **Concepts (C++20)** for constrained templates:
   ```cpp
   template<typename T>
   concept Storable = requires(T t) {
       { t.id() } -> std::convertible_to<std::string_view>;
       { t.serialize() } -> std::same_as<std::vector<char>>;
   };

   template<Storable T>
   void save(const T& entity);
   ```

7. **Ranges (C++20)** for functional-style pipelines:
   ```cpp
   auto active_titles = tasks
       | std::views::filter([](const Task& t) { return t.is_active(); })
       | std::views::transform(&Task::title)
       | std::views::take(10);
   ```

### Interfaces and DI

```cpp
// ✅ Interface (abstract class with pure virtuals)
class TaskStorage {
public:
    virtual ~TaskStorage() = default;
    virtual std::expected<Task, TaskError> getById(std::string_view id) = 0;
    virtual void save(const Task& task) = 0;
};

// ✅ Production implementation
class PostgresTaskStorage : public TaskStorage {
    // ...
};

// ✅ Test implementation
class MockTaskStorage : public TaskStorage {
    // MOCK_METHOD from Google Mock, or hand-rolled
};

// ✅ Constructor injection
class TaskService {
    std::unique_ptr<TaskStorage> storage_;
public:
    explicit TaskService(std::unique_ptr<TaskStorage> storage)
        : storage_(std::move(storage)) {}
};
```

### Naming

1. **PascalCase** for types. **camelCase** or **snake_case** for functions (project-consistent).
2. **`_` suffix** for private members: `storage_`, `logger_`.
3. No Hungarian notation.
4. **ALL_CAPS** only for macros — never for constants (use `constexpr`).

### Anti-Patterns

- ❌ **Raw `new`/`delete`** — use `std::make_unique` / `std::make_shared`
- ❌ **`using namespace std;`** in headers — pollutes global namespace
- ❌ **Catching `...` without re-throwing** — swallows all errors including crashes
- ❌ **`const_cast` to remove constness** — design flaw, fix the interface
- ❌ **`reinterpret_cast` without safety justification** — undefined behavior risk
- ❌ **C-style casts `(int)x`** — use `static_cast<int>(x)` for type safety
- ❌ **`std::shared_ptr` when `std::unique_ptr` suffices** — unnecessary overhead
- ❌ **Copy-heavy loops without `const auto&`:**
  ```cpp
  // ❌ Copies every Task
  for (auto task : tasks) { process(task); }

  // ✅ Reference — no copy
  for (const auto& task : tasks) { process(task); }
  ```

### Testing

Google Test or Catch2. Google Mock for interface mocking.

```cpp
// Google Test + Google Mock
TEST(TaskServiceTest, ReturnsNotFoundForMissingTask) {
    auto storage = std::make_unique<MockTaskStorage>();
    EXPECT_CALL(*storage, getById("999"))
        .WillOnce(Return(std::unexpected(TaskError::NotFound)));

    TaskService service(std::move(storage));
    auto result = service.getTask("999");

    EXPECT_FALSE(result.has_value());
    EXPECT_EQ(result.error(), TaskError::NotFound);
}
```

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `clang-format` | Formatting | `clang-format -i src/**/*.cpp` |
| `clang-tidy` | Static analysis | `clang-tidy src/*.cpp --` |
| `cppcheck` | Bug detection | `cppcheck --enable=all src/` |
| AddressSanitizer | Memory errors | `-fsanitize=address` |
| ThreadSanitizer | Race conditions | `-fsanitize=thread` |
| UBSanitizer | Undefined behavior | `-fsanitize=undefined` |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Resources and Memory Management @.agents/rules/resources-and-memory-management-principles.md
- Concurrency and Threading Principles @.agents/rules/concurrency-and-threading-principles.md
- Error Handling Principles @.agents/rules/error-handling-principles.md
