# C++ Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of C++ code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| Raw `new`/`delete` without RAII wrapper | Critical | `[RES]` | Use `std::unique_ptr`, `std::shared_ptr`, or stack allocation |
| `malloc`/`free` in C++ code | Critical | `[RES]` | Use containers, smart pointers, or RAII wrappers |
| `void*` for type erasure | Major | `[ERR]` | Use `std::variant`, `std::any`, or templates |
| Dangling pointer / reference | Critical | `[ERR]` | Use smart pointers, return by value, or `std::optional` |
| Uninitialized variable | Critical | `[ERR]` | Always initialize — `int x = 0;` or `int x{};` |
| `using namespace std;` in header file | Critical | `[ARCH]` | Pollutes all includers — use explicit `std::` prefix |
| `catch (...)` without rethrowing | Critical | `[ERR]` | Catch specific types or `throw;` after cleanup |
| Buffer overflow risk (`strcpy`, `sprintf`, `gets`) | Critical | `[SEC]` | Use `std::string`, `std::format`, or bounded variants |
| Missing virtual destructor on base class | Critical | `[ERR]` | Add `virtual ~Base() = default;` if class has virtual methods |
| C-style cast (`(int)x`) | Major | `[ERR]` | Use `static_cast`, `dynamic_cast`, or `reinterpret_cast` |
| `std::endl` in hot paths | Major | `[PAT]` | Use `'\n'` — `std::endl` forces a flush |
| `const` correctness violations | Major | `[PAT]` | Mark methods and parameters `const` where appropriate |
| Rule of Five violations | Critical | `[RES]` | If custom destructor, define or `= delete` copy/move ops |
| Data race (shared mutable state without lock) | Critical | `[ERR]` | Use `std::mutex`, `std::atomic`, or `std::shared_mutex` |

---

## Detection Commands

```bash
# Raw new/delete
grep -rn '\bnew \|delete \|delete\[' --include='*.cpp' --include='*.hpp' | grep -v 'test\|Test\|mock\|Mock\|unique_ptr\|shared_ptr\|make_unique\|make_shared'

# malloc/free
grep -rn '\bmalloc\|calloc\|realloc\|\bfree(' --include='*.cpp' --include='*.hpp'

# void* usage
grep -rn 'void\s*\*' --include='*.cpp' --include='*.hpp' | grep -v 'test\|extern "C"'

# using namespace std in headers
grep -rn 'using namespace std' --include='*.hpp' --include='*.h'

# Unsafe C functions
grep -rn 'strcpy\|strcat\|sprintf\|gets\|scanf' --include='*.cpp' --include='*.hpp'

# Missing virtual destructor
grep -rn 'virtual.*(' --include='*.hpp' -l | xargs grep -L 'virtual.*~\|~.*= default'

# C-style cast
grep -rn '(\s*int\s*)\|(\s*float\s*)\|(\s*char\s*)\|(\s*void\s*\*)' --include='*.cpp' --include='*.hpp'

# std::endl in loops
grep -rn 'std::endl' --include='*.cpp' | grep -v 'test\|Test'
```

---

## Correct Patterns (Reference)

### Resource Management (RAII)

```cpp
// ❌ Raw new/delete — exception-unsafe
Widget* w = new Widget();
process(w);
delete w;  // Never reached if process() throws

// ✅ Smart pointer — automatic cleanup
auto w = std::make_unique<Widget>();
process(*w);  // Automatically deleted when scope exits

// ✅ Stack allocation when possible
Widget w;
process(w);
```

### Modern C++ Casts

```cpp
// ❌ C-style cast — no safety checks
int x = (int)floatValue;

// ✅ static_cast — checked at compile time
int x = static_cast<int>(floatValue);

// ✅ dynamic_cast — checked at runtime (with RTTI)
auto derived = dynamic_cast<Derived*>(basePtr);
if (derived) { ... }
```

### Const Correctness

```cpp
// ❌ Non-const method that doesn't modify state
std::string getName() { return name_; }

// ✅ Const method
std::string getName() const { return name_; }

// ✅ Const reference parameters
void process(const std::vector<Task>& tasks);
```

### Rule of Five

```cpp
// ✅ If you define any, define all five (or use = default / = delete)
class ResourceHolder {
    ~ResourceHolder();                                      // destructor
    ResourceHolder(const ResourceHolder&);                  // copy constructor
    ResourceHolder& operator=(const ResourceHolder&);       // copy assignment
    ResourceHolder(ResourceHolder&&) noexcept;              // move constructor
    ResourceHolder& operator=(ResourceHolder&&) noexcept;   // move assignment
};
```

---

## References
- C++ Idioms @.agents/skills/cpp-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
