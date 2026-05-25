# C++ Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is C++.

---

## Memory Safety

- [ ] **No raw `new`/`delete`** — use `std::unique_ptr` or `std::shared_ptr`
- [ ] **No `malloc`/`free`** — use RAII containers
- [ ] **No dangling pointers or references** — lifetime analysis verified
- [ ] **All variables initialized** — use `{}` initialization or `= 0`
- [ ] **Rule of Five** adhered to — if custom destructor, define or `= delete` copy/move

---

## Type Safety

- [ ] **No `void*`** — use templates, `std::variant`, or `std::any`
- [ ] **No C-style casts** — use `static_cast`, `dynamic_cast`, `const_cast`
- [ ] **`constexpr` where possible** — compile-time evaluation
- [ ] **`auto` for complex types** — but explicit types for function signatures

---

## Const Correctness

- [ ] **Methods that don't modify state are `const`**
- [ ] **Parameters passed by `const&`** when not modified
- [ ] **Return by value or `const&`** — no mutable reference to internals

---

## Resource Management

- [ ] **RAII for all resources** — files, locks, connections wrapped in RAII classes
- [ ] **No `std::endl` in loops** — use `'\n'` (endl forces flush)
- [ ] **Move semantics** used for expensive-to-copy objects
- [ ] **`noexcept`** on move constructors and move assignment operators

---

## Concurrency

- [ ] **`std::mutex` or `std::shared_mutex`** for shared mutable state
- [ ] **`std::lock_guard` / `std::scoped_lock`** for lock acquisition (RAII)
- [ ] **`std::atomic`** for simple shared counters/flags
- [ ] **No data races** — all shared state protected

---

## Error Handling

- [ ] **Exceptions for exceptional conditions** — not flow control
- [ ] **`noexcept` on destructors** and move operations
- [ ] **`std::optional`** for values that may not exist
- [ ] **No `catch (...)` without `throw;`** — at least rethrow after cleanup

---

## Headers

- [ ] **No `using namespace std;` in headers** — pollutes all includers
- [ ] **Include guards or `#pragma once`** on all headers
- [ ] **Forward declarations** where possible to reduce compile time
- [ ] **Minimal includes** — only what's directly used

---

## Static Analysis

- [ ] `clang-tidy` passes with zero warnings
- [ ] `clang-format` consistent formatting
- [ ] Compiler warnings at `-Wall -Wextra -Wpedantic` — zero warnings
- [ ] Address Sanitizer (`-fsanitize=address`) clean on test suite

---

## References
- C++ Idioms @.agents/skills/cpp-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management @resources-and-memory-management-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
