# PHP Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is PHP.

---

## Type Safety

- [ ] **`declare(strict_types=1)`** at top of every file
- [ ] **Parameter and return types** on all functions/methods
- [ ] **Property types** declared on all class properties (PHP 7.4+)
- [ ] **`readonly` properties** for immutable data (PHP 8.1+)
- [ ] **Enums** for finite option sets (PHP 8.1+) — not string constants

---

## Security

- [ ] **Prepared statements** for all SQL queries — no string interpolation
- [ ] **No `eval()`** — refactor to avoid dynamic code execution
- [ ] **Input validated** with `filter_input()` or validator library
- [ ] **Output escaped** with `htmlspecialchars()` or template auto-escaping
- [ ] **`password_hash()`** with `PASSWORD_ARGON2ID` — no md5/sha1
- [ ] **No `@` error suppression** — handle errors explicitly

---

## Error Handling

- [ ] **No empty `catch` blocks** — handle, log, or rethrow
- [ ] **No `die()`/`exit()`** for error handling — throw exceptions
- [ ] **Custom exception hierarchy** for domain errors
- [ ] **Try/catch around external I/O** (database, HTTP, file system)

---

## Architecture

- [ ] **Constructor injection** for dependencies — no `global` keyword
- [ ] **PSR-4 autoloading** — no manual `require`/`include`
- [ ] **Interfaces for I/O** — repositories, HTTP clients, caches
- [ ] **Composition over inheritance** — trait usage justified

---

## Observability

- [ ] **No `var_dump()` / `print_r()` / `dd()`** in production code
- [ ] **PSR-3 logger** (Monolog) with structured context
- [ ] **Correlation IDs** in log entries

---

## Modern PHP

- [ ] **Named arguments** for readability on multi-parameter calls
- [ ] **Match expressions** over switch statements
- [ ] **Constructor promotion** for simple DTOs
- [ ] **Fibers / async** where I/O-bound (PHP 8.1+)

---

## Static Analysis

- [ ] PHPStan / Psalm passes at level 6+ with zero errors
- [ ] PHP CS Fixer formatting consistent
- [ ] No `@phpstan-ignore` without explanatory comment

---

## References
- PHP Idioms @.agents/skills/php-idioms/SKILL.md
- Security Principles @security-principles.md
- Error Handling Principles @error-handling-principles.md
