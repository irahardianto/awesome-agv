# C++ Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover C++-specific symptoms, debugger tooling, and common memory/concurrency bugs.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| Segfault (SIGSEGV) | Run with Address Sanitizer (`-fsanitize=address`) → find the access |
| Use-after-free | Address Sanitizer or Valgrind → trace the deallocation |
| Double free | Address Sanitizer → find both `delete` calls |
| Memory leak | Valgrind `--leak-check=full` or LeakSanitizer → find the allocation site |
| Data race / TSAN report | Thread Sanitizer (`-fsanitize=thread`) → find unprotected shared access |
| Deadlock (app hangs, CPU idle) | GDB `thread apply all bt` → find threads waiting on locks |
| Undefined behavior (UB) | UBSan (`-fsanitize=undefined`) → catch at runtime |
| Stack overflow | Infinite recursion or large stack allocation → check recursive calls |
| Linker errors (`undefined reference`) | Check link order, missing `-l` flags, or missing `extern "C"` |
| Template error (wall of errors) | Read the LAST error first → usually the root cause |
| Slow compilation | `-ftime-trace` (Clang) → find slow headers/templates |

---

## Diagnostic Tools

### GDB / LLDB

```bash
# GDB basics
gdb ./my_app
(gdb) break main.cpp:42       # Set breakpoint
(gdb) run                      # Start program
(gdb) bt                       # Backtrace
(gdb) bt full                  # Backtrace with local variables
(gdb) info threads             # List all threads
(gdb) thread apply all bt      # Backtrace for ALL threads (deadlock diagnosis)
(gdb) print variable           # Print variable value
(gdb) watch variable           # Break when variable changes
(gdb) catch throw              # Break on any exception throw

# LLDB equivalents
lldb ./my_app
(lldb) breakpoint set -f main.cpp -l 42
(lldb) run
(lldb) bt
(lldb) bt all                  # All threads backtrace
(lldb) thread list
(lldb) frame variable          # Show local variables
(lldb) watchpoint set variable myVar
```

### Sanitizers (Compile-Time Instrumentation)

```bash
# Address Sanitizer — segfaults, use-after-free, buffer overflow, leaks
g++ -fsanitize=address -fno-omit-frame-pointer -g -O1 main.cpp -o app
./app  # Crashes with detailed report on violation

# Thread Sanitizer — data races
g++ -fsanitize=thread -g -O1 main.cpp -o app -pthread
./app

# Undefined Behavior Sanitizer — signed overflow, null deref, alignment
g++ -fsanitize=undefined -g main.cpp -o app
./app

# Memory Sanitizer (Clang only) — uninitialized memory reads
clang++ -fsanitize=memory -fno-omit-frame-pointer -g main.cpp -o app
./app

# Combine multiple (not all are compatible)
g++ -fsanitize=address,undefined -fno-omit-frame-pointer -g main.cpp -o app
```

### Valgrind

```bash
# Memory leak detection
valgrind --leak-check=full --show-leak-kinds=all ./app

# Helgrind — thread error detector
valgrind --tool=helgrind ./app

# Cachegrind — cache profiling
valgrind --tool=cachegrind ./app
```

---

## Common C++ Bugs and Fixes

### Use-After-Free

**Symptom:** Crash or garbage data. Address Sanitizer reports "heap-use-after-free".

```cpp
// ❌ Use-after-free
std::string* str = new std::string("hello");
delete str;
std::cout << *str;  // CRASH — reading freed memory

// ❌ Dangling reference
std::string& getRef() {
    std::string local = "hello";
    return local;  // Reference to destroyed object!
}

// ✅ Smart pointer — lifetime managed automatically
auto str = std::make_unique<std::string>("hello");
// str is valid until unique_ptr goes out of scope

// ✅ Return by value (move semantics, no copy)
std::string getValue() {
    std::string local = "hello";
    return local;  // Moved, not copied (NRVO)
}
```

### Iterator Invalidation

**Symptom:** Crash or undefined behavior when modifying a container during iteration.

```cpp
// ❌ Iterator invalidated by erase
for (auto it = vec.begin(); it != vec.end(); ++it) {
    if (shouldRemove(*it)) {
        vec.erase(it);  // UB — iterator invalidated!
    }
}

// ✅ erase returns next valid iterator
for (auto it = vec.begin(); it != vec.end(); ) {
    if (shouldRemove(*it)) {
        it = vec.erase(it);  // Returns next valid iterator
    } else {
        ++it;
    }
}

// ✅ Or use erase-remove idiom
vec.erase(
    std::remove_if(vec.begin(), vec.end(), shouldRemove),
    vec.end()
);

// ✅ C++20: std::erase_if
std::erase_if(vec, shouldRemove);
```

### Data Race

**Symptom:** Thread Sanitizer reports "data race". Intermittent crashes or wrong results under concurrency.

```cpp
// ❌ Unprotected shared state
int counter = 0;
void increment() { counter++; }  // Data race if called from multiple threads

// ✅ Atomic for simple counters
std::atomic<int> counter{0};
void increment() { counter.fetch_add(1, std::memory_order_relaxed); }

// ✅ Mutex for complex shared state
std::mutex mtx;
std::vector<Task> tasks;
void addTask(Task t) {
    std::lock_guard<std::mutex> lock(mtx);
    tasks.push_back(std::move(t));
}
```

### Template Error Debugging

**Symptom:** Compiler emits 500 lines of errors. Incomprehensible template instantiation chain.

**Strategy:**
1. Read the **last** error message — it's usually the root cause.
2. Look for "required from here" — traces the instantiation chain.
3. Use `static_assert` to catch type constraint violations early.
4. Use C++20 Concepts for clearer error messages.

```cpp
// ❌ Cryptic template error
template<typename T>
void process(T item) {
    item.serialize();  // Error: no member named 'serialize' in 'int'
    // 50 lines of template backtrace
}

// ✅ Concept gives clear error
template<typename T>
concept Serializable = requires(T t) { { t.serialize() } -> std::convertible_to<std::string>; };

template<Serializable T>
void process(T item) {
    item.serialize();  // Error: constraint not satisfied (1 line)
}
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Address Sanitizer pinpoints exact line | +80% confidence in memory bug location |
| Thread Sanitizer reports specific access | +70% confidence in data race |
| Valgrind shows allocation site for leak | +60% confidence in leak source |
| Crash only under optimization (`-O2`) | Suspect undefined behavior (not optimizer bug) |
| Template error > 100 lines | Start from bottom — usually last "required from" |

---

## Related
- C++ Idioms @.agents/skills/cpp-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
