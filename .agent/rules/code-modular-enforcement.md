---
trigger: always_on
description: Modular code architecture enforcement — SRP, no catch-all files, hard LOC limits. Apply when reading, writing, or editing source files in any supported language.
---

## Modular Code Architecture — Zero Tolerance Policy

This rule is **NON-NEGOTIABLE**. Violations **BLOCK** all further work until resolved.

---

### Universal Rules (All Languages)

#### Rule 1: Entry Points Are NOT Logic Containers

Entry-point files/classes must ONLY contain:

- Re-exports / public API surface
- Dependency wiring and composition
- Framework bootstrapping

They MUST NEVER contain business logic, utility functions, or multiple unrelated responsibilities.

| Language                | Entry Point Pattern                                         |
| ----------------------- | ----------------------------------------------------------- |
| TypeScript / JavaScript | `index.ts` / `index.js`                                     |
| Python                  | `__init__.py`                                               |
| Java / Kotlin / Scala   | `@SpringBootApplication`, `@Configuration`, `Main` object   |
| C#                      | `Program.cs`, `Startup.cs`                                  |
| Go                      | `main.go` (keep minimal; delegate to packages)              |
| Rust                    | `main.rs` / `lib.rs` (re-exports only in `lib.rs`)          |
| PHP                     | Framework bootstrap / `index.php`                           |
| Swift                   | `@main` struct / `AppDelegate` — no business logic          |
| Ruby                    | `application.rb` / `config.ru` — environment setup only     |
| C / C++                 | `main.c` / `main.cpp` — argument handling + entry call only |
| Dart / Flutter          | `main.dart` / `main()` — `runApp()` call only               |

**If logic is found in an entry point → extract FIRST, then continue.**

---

#### Rule 2: No Catch-All Files — "utils / helpers / common" Are Code Smells

These filenames are **BANNED** as top-level catch-alls:

`utils`, `helpers`, `common`, `misc`, `shared`, `service` (when mixed)

**Name files after what they do:**

| Anti-Pattern                                             | Refactor To                                   |
| -------------------------------------------------------- | --------------------------------------------- |
| `utils.ts` with `formatDate()` + `retry()` + `slugify()` | `date-formatter.ts`, `retry.ts`, `slugify.ts` |
| `helpers.py` with 15 unrelated functions                 | One module per logical domain                 |
| `Utils.java` / `CommonUtils.java`                        | `DateFormatter.java`, `PasswordHasher.java`   |
| `helpers.go`                                             | Package-scoped named files                    |

Each module must be: **independently importable**, **self-contained**, **named by purpose**, **testable in isolation**.

---

#### Rule 3: Single Responsibility Principle — ABSOLUTE

Every source file MUST have exactly ONE clear, nameable responsibility.

**Self-test**: If you cannot describe the file's purpose in one short phrase (e.g., _"validates JWT tokens"_, _"parses YAML frontmatter"_), the file does too much.

| Signal                                                  | Action                                                 |
| ------------------------------------------------------- | ------------------------------------------------------ |
| File has 2+ unrelated exported functions/classes        | **SPLIT NOW**                                          |
| File mixes I/O with pure business logic                 | **SPLIT NOW** — separate side effects from computation |
| File combines data models + persistence + orchestration | **SPLIT NOW**                                          |
| You must scroll excessively to understand it            | **SPLIT NOW**                                          |

---

#### Rule 4: LOC Hard Limits — Code Smell Detector

When a file exceeds its LOC limit:

1. **STOP** current work
2. **Identify** the multiple responsibilities hiding in the file
3. **Extract** into focused, smaller modules
4. **Verify** each resulting file is under its limit
5. **Resume** original work

**Exclude from LOC count**: blank lines, comment-only lines, docstrings/Javadoc, prompt/template string content.

| Language                | Hard Limit  | Notes                                                        |
| ----------------------- | ----------- | ------------------------------------------------------------ |
| TypeScript / JavaScript | **200 LOC** | Exclude template literal prompt text                         |
| Python                  | **300 LOC** | Exclude docstrings and type-checking blocks                  |
| Java                    | **300 LOC** | Exclude imports, Javadoc, text block prompts                 |
| Kotlin                  | **250 LOC** | Data classes/sealed classes count less; logic is the concern |
| Scala                   | **250 LOC** | Case classes / traits excluded from pure-data count          |
| C#                      | **300 LOC** | Exclude XML doc comments and large string literals           |
| Go                      | **300 LOC** | Idiomatic Go is terse; larger suggests mixed concerns        |
| Rust                    | **300 LOC** | Exclude `#[cfg(test)]` blocks                                |
| PHP                     | **300 LOC** | Exclude docblocks                                            |
| Swift                   | **250 LOC** | Exclude SwiftUI view bodies if purely declarative layout     |
| Ruby                    | **300 LOC** | Exclude RDoc/YARD comments                                   |
| C / C++                 | **300 LOC** | Exclude header guards, includes, and doxygen comments        |
| Dart / Flutter          | **250 LOC** | Exclude declarative widget trees (pure `build` returns)      |
| CSS / SCSS              | **300 LOC** | Exclude comments; one component = one file                   |
| SQL                     | **150 LOC** | Per query/view/stored procedure file                         |

---

### Language-Specific Rules

#### TypeScript / JavaScript

- `index.ts` / `index.js`: re-exports ONLY
- Banned catch-alls: `utils.ts`, `helpers.ts`, `service.ts`, `common.ts`
- **No** mixing of types and implementations in the same file (prefer `types.ts` + `implementation.ts`)
- Files mixing I/O with pure logic → split immediately

#### Python

- `__init__.py`: `from .module import X` and `__all__` ONLY — no business logic
- Banned catch-alls: `utils.py`, `helpers.py`, `services.py`, `common.py`
- Layer separation:
  - Routes → `routes/<domain>.py`
  - Schemas → `schemas/<domain>.py`
  - Business logic → `services/<domain>_service.py`
  - DB access → `repositories/<domain>_repository.py`
- CLI apps: `cli.py` = argument parsing only; logic lives elsewhere

#### Java / Kotlin

- `@SpringBootApplication` / `@Configuration` classes: bean wiring ONLY
- Banned: `Utils.java`, `CommonUtils.java`, `Helper.java`, `BaseService` with mixed responsibilities
- Strict Spring layers: **Controller** (HTTP only) → **Service** (business rules) → **Repository** (data access) → **Domain** (pure logic, no framework annotations)
- Prefer **constructor injection** over field injection (`@Autowired` on fields is discouraged)
- Prefer **one use case = one service**: `CreateOrderService`, `CancelOrderService` over a monolithic `OrderService`
- Kotlin: data classes and sealed classes are lightweight — still enforce SRP on logic classes

#### C# (.NET)

- `Program.cs` / `Startup.cs`: DI registration and middleware pipeline ONLY
- Layer separation mirrors Java: Controllers → Services → Repositories → Domain
- Banned: `Helpers.cs`, `Utils.cs`, `Common.cs` as catch-alls
- Prefer **constructor injection**; avoid service locator pattern
- Records and DTOs do NOT count as SRP violations when they only hold data

#### Go

- `main.go`: flag parsing + `run()` call ONLY; all logic in packages
- Package names = their purpose (`parser`, `storage`, `notifier` — not `utils`, `common`)
- One primary concern per package; sub-packages when a package grows complex
- `internal/` packages enforce encapsulation boundaries — use them

#### Rust

- `lib.rs`: `pub use` re-exports ONLY — no implementation logic
- `main.rs`: argument parsing + call to library entry point
- Modules in `mod.rs` or file-per-module: one clear responsibility each
- `#[cfg(test)]` blocks are excluded from LOC count but keep them focused

#### PHP

- Framework bootstrap files: DI container wiring ONLY
- Banned: `Helpers.php`, `Utils.php`, `Common.php` as catch-alls
- PSR-4 autoloading: one class per file, filename matches class name
- Layer separation: Controllers → Services → Repositories → Models (data only)
- Static helper classes: allowed only if pure, stateless, and single-purpose

#### Swift

- `@main` struct / `AppDelegate`: `runApp()` / scene setup ONLY — no business logic
- Banned catch-alls: `Utils.swift`, `Helpers.swift`, `Extensions.swift` (monolithic)
- Extensions: one extension per file, named `Type+Capability.swift` (e.g., `Date+Formatting.swift`)
- SwiftUI views: pure declarative layout only; extract view models and data logic
- Avoid massive `ContentView.swift` — split by screen/component

#### Ruby

- `application.rb` / `config.ru`: environment wiring and middleware ONLY
- Banned catch-alls: `helpers.rb`, `utils.rb`, `concerns.rb` (monolithic)
- Rails: fat models migrate logic to Service Objects / Query Objects / Form Objects
- One class/module per file; filename matches `snake_case` of the constant

#### C / C++

- `main.c` / `main.cpp`: argument parsing + entry call ONLY — no domain logic
- Each `.h`/`.hpp` header declares ONE component; each `.c`/`.cpp` implements it
- Banned: `utils.h` with unrelated helpers — split by purpose
- No business logic in headers; implementation belongs in `.cpp`
- C++: prefer classes with single responsibilities; avoid god classes

#### Dart / Flutter

- `main.dart`: `runApp()` call ONLY
- Banned catch-alls: `utils.dart`, `helpers.dart`, `constants.dart` (monolithic)
- One widget per file; filename matches widget name in `snake_case`
- Business logic belongs in services / repositories / providers — NOT inside widgets
- Declarative widget `build()` trees are excluded from LOC count

#### Scala

- `Main` object / `App` trait: entry call ONLY
- Banned: `Utils.scala`, `Helpers.scala` as mixed catch-alls
- Prefer **one class/trait/object per file**; case classes for data only
- Layer separation: Controllers → Services → Repositories → Domain (no framework deps)
- Companion objects should only contain factory methods and implicit conversions

#### CSS / SCSS

- **One component = one file** (BEM-named)
- All visual values MUST use design tokens (`var(--color-danger)`) — no magic numbers
- CSS must use `@layer` ordering: `reset → tokens → base → layout → components → utilities`
- No global selector leakage outside `reset` and `base` layers
- Utility classes: start with `u-`, contain exactly ONE declaration
- No inline styles, no `<style>` blocks in HTML, no CSS inside JS strings

#### SQL

- One file per query / view / stored procedure / migration
- Stored procedures / functions: single logical operation only
- No mixing of DDL and DML in the same file (except migrations)
- Views must be named by the data shape they expose, not by their consumer

---

### Enforcement Workflow

When touching ANY source file:

1. **Check** LOC count — does it exceed the language limit?
2. **Check** SRP — can you describe the file in ONE phrase?
3. **Check** entry points — do they contain logic they shouldn't?
4. **If ANY violation** → **refactor FIRST**, then implement the feature
5. **When creating new files** → enforce single responsibility and stay under LOC limit
6. **When adding code** → verify you're not introducing a second responsibility or pushing past the limit

**Architecture first. Feature second.**
