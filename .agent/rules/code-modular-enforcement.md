---
trigger: always_on
description: >
  Modular code architecture enforcement — SRP, no unrelated catch-all files,
  LOC thresholds, dependency hygiene. Apply when reading, writing, or editing
  source files in any supported language. Generated, vendored, and
  migration files are explicitly exempt where noted.
version: 2.0.0
---

# Modular Code Architecture Enforcement

## Scope and Exemptions

This rule applies to **all hand-authored source files**. The following are **EXEMPT** from LOC limits and catch-all bans:

- Machine-generated files (protobuf output, ORM migrations, OpenAPI stubs, codegen artifacts)
- Vendored / third-party code committed to the repo
- Lock files and build artifacts
- Test fixture data files (JSON, YAML, SQL seed files)
- Declarative configuration that contains no imperative logic (e.g., `pyproject.toml`, `package.json`)

When a file is exempt, note it with a top-of-file comment: `# generated — do not edit`.

---

## Severity Levels

Violations are classified at three levels. Automated agents must act according to the severity before proceeding.

| Level | Label     | Agent Behaviour                                                                                                                              |
| ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔴    | **BLOCK** | Stop. Refactor the violation before writing any new code in this file.                                                                       |
| 🟡    | **WARN**  | Flag the violation in a code comment or task note. Refactor in the same PR unless doing so would exceed 3× the scope of the original change. |
| 🔵    | **NOTE**  | Log for awareness. No immediate action required; address in a dedicated cleanup task.                                                        |

Minor targeted edits (≤ 5 lines changed, no new responsibilities introduced) to an already-violating file are **exempt from BLOCK escalation** — log a WARN instead and create a follow-up task.

---

## Universal Rules

### Rule 1 — Entry Points Are NOT Logic Containers 🔴

Entry-point files must contain **ONLY**:

- Re-exports that form a public API surface
- Dependency wiring and object composition
- Framework bootstrapping calls (e.g., `runApp()`, `app.listen()`)
- CLI argument parsing (delegating immediately to a handler)

They **MUST NEVER** contain business logic, utility functions, data transformations, or mixed responsibilities.

| Language                | Entry Point Pattern                                        |
| ----------------------- | ---------------------------------------------------------- |
| TypeScript / JavaScript | `index.ts` / `index.js`                                    |
| Python                  | `__init__.py`                                              |
| Java / Kotlin / Scala   | `@SpringBootApplication`, `@Configuration`, `Main` object  |
| C#                      | `Program.cs`, `Startup.cs`                                 |
| Go                      | `main.go` — delegate immediately to packages               |
| Rust                    | `main.rs` / `lib.rs` — re-exports only in `lib.rs`         |
| PHP                     | Framework bootstrap / `index.php`                          |
| Swift                   | `@main` struct / `AppDelegate` — scene setup only          |
| Ruby                    | `application.rb` / `config.ru` — environment setup only    |
| C / C++                 | `main.c` / `main.cpp` — argument handling + one entry call |
| Dart / Flutter          | `main.dart` — `runApp()` call only                         |
| Shell                   | Entry script — `source` / delegate calls only              |
| Elixir                  | `application.ex` — supervision tree wiring only            |

**If logic is found in an entry point → extract FIRST, then continue.**

---

### Rule 2 — No Unrelated Catch-All Files 🔴

Filenames like `utils`, `helpers`, `common`, `misc`, `shared`, or `service` are **BANNED AS TOP-LEVEL, UNRELATED CATCH-ALLS**. A file with one of these names is acceptable **ONLY IF EVERY EXPORT BELONGS TO THE SAME LOGICAL DOMAIN** — and in that case it should be renamed to reflect that domain.

The violation is **UNRELATED GROUPING**, not the filename itself.

| Anti-Pattern                                                      | Violation                       | Refactor To                                          |
| ----------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `utils.ts` with `formatDate()` + `retry()` + `slugify()`          | Three unrelated domains         | `date-formatter.ts`, `retry-policy.ts`, `slugify.ts` |
| `formatting.ts` with `slugify()` + `truncate()` + `toTitleCase()` | Same domain (string formatting) | ✅ Acceptable — rename if clarity improves           |
| `helpers.py` with 15 unrelated functions                          | Mixed domains                   | One module per logical domain                        |
| `Utils.java` / `CommonUtils.java`                                 | Mixed domains                   | `DateFormatter.java`, `PasswordHasher.java`          |
| `helpers.go`                                                      | Mixed domains                   | Package-scoped, purpose-named files                  |
| `utils.sh` with unrelated shell functions                         | Mixed domains                   | `git-helpers.sh`, `docker-helpers.sh`                |

Each module must be:

- **INDEPENDENTLY IMPORTABLE**,
- **SELF-CONTAINED**,
- **NAMED BY PURPOSE**,
- **TESTABLE IN ISOLATION**.

---

### Rule 3 — Single Responsibility Principle 🔴

Every source file must have **EXACTLY ONE CLEAR, NAMEABLE RESPONSIBILITY**.

**Self-test**: Can you describe this file's purpose in one short phrase (e.g., _"validates JWT tokens"_, _"parses YAML frontmatter"_, _"handles Stripe webhook events"_)? If not, the file does too much.

| Signal                                                         | Severity | Action                                        |
| -------------------------------------------------------------- | -------- | --------------------------------------------- |
| 2+ unrelated exported functions or classes                     | 🔴       | Split into focused modules                    |
| I/O mixed with pure business logic                             | 🔴       | Separate side effects from computation        |
| Data models + persistence + orchestration in one file          | 🔴       | Split into domain, repository, service layers |
| A class or module that callers depend on for unrelated reasons | 🔴       | Split by consumer need                        |
| File is hard to name without using "and" or "or"               | 🟡       | Candidate for splitting; evaluate in context  |
| Excessive scrolling required to understand the file            | 🟡       | Review for hidden responsibilities            |

---

### Rule 4 — LOC Thresholds 🟡

LOC thresholds are **TRIGGERS FOR REVIEW**, not automatic split mandates. When a file exceeds its threshold, identify whether multiple responsibilities are hiding inside. If yes → 🔴 split. If the file is legitimately single-purpose but verbose (e.g., a long switch/match, a large declarative config, extensive inline documentation) → 🔵 note and proceed.

**EXCLUDED FROM LOC COUNT**: blank lines, comment-only lines, docstrings / Javadoc / YARD / RDoc, `#[cfg(test)]` blocks in Rust, declarative widget `build()` trees in Flutter/SwiftUI, generated imports/exports, template literal prompt text.

| Language                | Threshold | Notes                                                                 |
| ----------------------- | --------- | --------------------------------------------------------------------- |
| TypeScript / JavaScript | 200       | Exclude template literal prompt text                                  |
| Python                  | 300       | Exclude docstrings and `TYPE_CHECKING` blocks                         |
| Java                    | 300       | Exclude imports, Javadoc, text block prompts                          |
| Kotlin                  | 250       | Enforce on imperative logic; data/sealed classes are low-weight       |
| Scala                   | 250       | Case classes and pure trait definitions are low-weight                |
| C#                      | 300       | Exclude XML doc comments and large string literals                    |
| Go                      | 300       | Idiomatic Go is terse; exceeding this strongly implies mixed concerns |
| Rust                    | 300       | Exclude `#[cfg(test)]` blocks                                         |
| PHP                     | 300       | Exclude docblocks                                                     |
| Swift                   | 250       | Exclude pure declarative SwiftUI view bodies                          |
| Ruby                    | 300       | Exclude RDoc / YARD comments                                          |
| C / C++                 | 300       | Exclude header guards, includes, Doxygen comments                     |
| Dart / Flutter          | 250       | Exclude declarative `build()` widget trees                            |
| Elixir                  | 300       | Exclude `@moduledoc` / `@doc` attributes                              |
| Shell                   | 150       | Shell functions should be short and delegating                        |
| CSS / SCSS              | 300       | Exclude comments; one component = one file                            |
| SQL                     | 150       | Per query / view / stored procedure / migration file                  |
| HCL (Terraform)         | 150       | One resource type or module definition per file                       |
| Protobuf / Avro         | 200       | One service or one domain's messages per file                         |

---

### Rule 5 — Dependency Hygiene 🔴

**NO CIRCULAR DEPENDENCIES.** A file must never (directly or transitively) import from a file that imports from it.

Detection guidance:

- TypeScript / JavaScript: use `madge` or `dependency-cruiser`
- Python: use `pydeps` or `import-linter`
- Java / Kotlin: enforce via `ArchUnit` or `Checkstyle`
- Go: the compiler rejects cycles — treat compiler errors as BLOCK
- Rust: the compiler rejects cycles — treat compiler errors as BLOCK

When a circular dependency is detected:

1. Identify the shared abstraction both modules need
2. Extract it into a new, dependency-free module
3. Have both original modules depend on the new one

**DEPENDENCY DIRECTION MUST BE ONE-WAY WITHIN A LAYERED ARCHITECTURE.** Higher layers may depend on lower layers; lower layers must never import from higher layers.

```
UI / Controllers  →  Services / Use Cases  →  Repositories / Adapters  →  Domain / Pure Logic
```

---

### Rule 6 — Barrel File Discipline 🟡

Re-export barrel files (`index.ts`, `__init__.py`, etc.) must:

- Export only what is intended to be **public API**
- Never import-then-re-export from more than one logical domain
- Never contain implementation logic
- Not create deep re-export chains that obscure the origin of a symbol

Deep or promiscuous barrel files cause circular dependency risks and make tree-shaking less effective. If a barrel file re-exports from more than ~10 modules, evaluate whether the directory has grown into multiple domains that should be separated.

---

## Language-Specific Rules

### TypeScript / JavaScript

- `index.ts` / `index.js`: re-exports only — no logic
- Banned catch-alls: `utils.ts`, `helpers.ts`, `common.ts`; `service.ts` is banned when it mixes unrelated services
- Types and implementations **may** be co-located in the same file when they are tightly coupled (e.g., a class and its interface); prefer a separate `types.ts` only when types are shared across multiple implementations
- Files mixing I/O with pure logic → split immediately
- Prefer named exports over default exports for better refactoring and tree-shaking

### Python

- `__init__.py`: `from .module import X` and `__all__` only — no business logic
- Banned catch-alls: `utils.py`, `helpers.py`, `common.py`; `services.py` banned when it mixes unrelated service classes
- Recommended layer layout:
  - Routes → `routes/<domain>.py`
  - Schemas/DTOs → `schemas/<domain>.py`
  - Business logic → `services/<domain>_service.py`
  - DB access → `repositories/<domain>_repository.py`
  - Pure domain logic → `domain/<domain>.py`
- `cli.py`: argument parsing only; all logic lives in library modules
- Large `settings.py` / `config.py`: acceptable if it contains only configuration — not logic

### Java / Kotlin

- `@SpringBootApplication` / `@Configuration` classes: bean wiring only
- Banned catch-alls: `Utils.java`, `CommonUtils.java`, `Helper.java`, `BaseService` with mixed responsibilities
- Strict Spring layer order (dependency direction enforced): Controller → Service → Repository → Domain
- Prefer **constructor injection** over `@Autowired` on fields
- Prefer one use case = one service class: `CreateOrderService`, `CancelOrderService` rather than a monolithic `OrderService`
- Kotlin data classes and sealed classes are lightweight; SRP applies to logic classes, not data carriers

### C# (.NET)

- `Program.cs` / `Startup.cs`: DI registration and middleware pipeline only
- Layer separation mirrors Java: Controllers → Services → Repositories → Domain
- Banned catch-alls: `Helpers.cs`, `Utils.cs`, `Common.cs`
- Prefer constructor injection; avoid service locator pattern
- Records and DTOs holding only data are not SRP violations

### Go

- `main.go`: flag parsing + `run()` call only; all logic in packages
- Package names must reflect their purpose (`parser`, `storage`, `notifier` — not `utils`, `common`)
- One primary concern per package; introduce sub-packages when a package grows beyond its threshold
- Use `internal/` to enforce encapsulation boundaries

### Rust

- `lib.rs`: `pub use` re-exports only — no implementation logic
- `main.rs`: argument parsing + call to library entry point
- `mod.rs` or file-per-module: one clear responsibility each
- `#[cfg(test)]` blocks excluded from LOC count; keep them focused and close to the code they test

### PHP

- Framework bootstrap: DI container wiring only
- Banned catch-alls: `Helpers.php`, `Utils.php`, `Common.php`
- PSR-4 autoloading: one class per file, filename matches class name
- Layer order: Controllers → Services → Repositories → Models (data only)
- Static helper classes: permitted only if pure, stateless, and single-purpose

### Swift

- `@main` struct / `AppDelegate`: scene setup only — no business logic
- Banned monolithic catch-alls: `Utils.swift`, `Helpers.swift`, `Extensions.swift`
- Extensions: one extension per file, named `Type+Capability.swift` (e.g., `Date+Formatting.swift`)
- SwiftUI views: pure declarative layout only — extract view models and business logic
- Split large `ContentView.swift` by screen or component

### Ruby

- `application.rb` / `config.ru`: environment wiring and middleware only
- Banned catch-alls: `helpers.rb`, `utils.rb`, `concerns.rb` (when monolithic)
- Rails: migrate logic out of fat models into Service Objects, Query Objects, Form Objects
- One class or module per file; filename matches `snake_case` of the constant name

### C / C++

- `main.c` / `main.cpp`: argument parsing + one entry call — no domain logic
- Each `.h` / `.hpp` declares one component; each `.c` / `.cpp` implements it
- No business logic in headers; implementation belongs in `.cpp`
- Banned: `utils.h` as an unrelated grab-bag — split by purpose
- C++: prefer classes with single responsibilities; avoid god classes

### Dart / Flutter

- `main.dart`: `runApp()` call only
- Banned catch-alls: `utils.dart`, `helpers.dart`, `constants.dart` (when monolithic)
- One widget per file; filename matches widget name in `snake_case`
- Business logic belongs in services / repositories / providers — never inside widgets
- Declarative `build()` trees excluded from LOC count

### Scala

- `Main` object / `App` trait: entry call only
- Banned catch-alls: `Utils.scala`, `Helpers.scala`
- One class / trait / object per file; case classes for data only
- Layer order: Controllers → Services → Repositories → Domain (no framework dependencies in Domain)
- Companion objects: factory methods and implicit conversions only

### Elixir

- `application.ex`: supervision tree wiring only
- Banned catch-alls: `utils.ex`, `helpers.ex`, `common.ex`
- One module per file; filename matches module name in `snake_case`
- Prefer `defdelegate` for forwarding over re-implementing logic
- Phoenix layer order: Controller (HTTP) → Context (business boundary) → Schema (data + changeset)
- Contexts are the SRP boundary — one context per business domain, not per database table

### Shell (Bash / Zsh / POSIX sh)

- Entry script: `source` calls and orchestration only — no inline logic
- Banned catch-alls: `utils.sh`, `helpers.sh` with unrelated functions
- Group related shell functions into purpose-named files: `git-helpers.sh`, `docker-utils.sh`
- Each function: one clear purpose; exit early on error (`set -euo pipefail`)
- Scripts over 150 LOC are almost always doing too many things — split by concern

### HTML Templates (Jinja2 / ERB / Handlebars / Blade / Twig)

- Templates must contain **presentation logic only** — no data fetching, no business computation
- Banned: complex conditionals or loops that should be pre-computed in the controller/context
- Extract repeated template fragments into partials / includes
- Template files over ~150 lines of markup are candidates for partial extraction

### CSS / SCSS

- One component = one file, BEM-named
- All visual values must use design tokens (`var(--color-danger)`) — no magic numbers
- `@layer` ordering: `reset → tokens → base → layout → components → utilities`
- No global selector leakage outside `reset` and `base` layers
- Utility classes: prefix `u-`, contain exactly one declaration each
- No inline styles, no `<style>` blocks in HTML, no CSS inside JS strings
- **Exception**: component-scoped `<style scoped>` in Vue SFCs and `<style>` in Svelte components are idiomatic and acceptable — they do not violate this rule

### SQL

- One file per query / view / stored procedure / migration
- Stored procedures and functions: single logical operation only
- Migrations may mix DDL and DML when the migration is an atomic, versioned change (e.g., `ALTER TABLE` followed by a backfill `UPDATE`) — the file still represents one migration step
- Views must be named by the data shape they expose, not by their consumer (`monthly_revenue_by_region`, not `dashboard_query`)
- No ad-hoc business logic inside views — views are projections, not services

### HCL (Terraform / OpenTofu)

- `main.tf` in a module: resource definitions for that module only
- Split large root modules: one file per resource type or logical grouping (`networking.tf`, `iam.tf`, `compute.tf`)
- Variables in `variables.tf`; outputs in `outputs.tf`; providers in `providers.tf`
- No inline `provisioner` blocks with complex shell scripts — extract to dedicated scripts

### Protobuf / Avro

- One service definition or one domain's message types per file
- No mixing of services from unrelated business domains in a single `.proto` file
- Package naming must reflect the domain: `payments.v1`, `identity.v2`

---

## Test Files

Test files follow the same SRP and structural rules as production code, with the following clarifications:

- Test files mirror the source structure: `src/auth/jwt-validator.ts` → `tests/auth/jwt-validator.test.ts`
- Each test file tests **one source module** — no omnibus test files covering multiple modules
- **Test helpers and factories** are exempt from the catch-all ban: `test-utils.ts`, `factories/user-factory.ts` are acceptable _if they serve only test infrastructure_. They still must not mix unrelated domains
- Fixture and seed data files (JSON, YAML, SQL) are fully exempt from LOC limits
- Test files are excluded from circular dependency checks across the production dependency graph, but circular dependencies _within_ test infrastructure should still be avoided
- LOC limits for test files are relaxed by **50%** — a test file may be verbose because it is explicit, not because it is doing too many things

---

## Configuration Files

Large application configuration files (`settings.py`, `config.ts`, `appsettings.json`, `application.yml`) are acceptable as single files **if they contain only configuration values and environment resolution** — no imperative logic, no data transformations, no service instantiation.

When a configuration file begins to contain logic → extract the logic immediately (🔴).

Split large configuration files by concern when they grow unwieldy: `database.config.ts`, `auth.config.ts`, `feature-flags.config.ts`.

---

## Enforcement Workflow

When touching any source file, run these checks in order:

```
1. Is this file exempt? (generated, vendored, fixture data)
   → YES: proceed without checks
   → NO: continue

2. LOC count — does it exceed the language threshold?
   → YES: identify responsibilities → split if multiple found (🔴) or note if single-purpose (🔵)
   → NO: continue

3. SRP check — can you describe the file in one short phrase?
   → NO: split (🔴)
   → YES: continue

4. Entry point check — does it contain logic it shouldn't?
   → YES: extract (🔴)
   → NO: continue

5. Catch-all check — does the file group unrelated domains?
   → YES: split (🔴)
   → NO: continue

6. Dependency check — does this change introduce a circular dependency or a wrong-direction layer import?
   → YES: extract shared abstraction (🔴)
   → NO: continue

7. Is this a minor targeted edit (≤ 5 lines, no new responsibilities) on an already-violating file?
   → YES: log WARN, create follow-up task, proceed
   → NO: violations found above must be resolved before new code is written
```

**Architecture first. Feature second. Always.**

---

## Quick Reference Card

| Check                                              | Severity | Trigger                                             |
| -------------------------------------------------- | -------- | --------------------------------------------------- |
| Logic in entry point                               | 🔴 BLOCK | Any logic beyond wiring / bootstrapping             |
| Unrelated catch-all file                           | 🔴 BLOCK | Multiple unrelated domains in one file              |
| SRP violation                                      | 🔴 BLOCK | Cannot describe file in one phrase                  |
| Circular dependency                                | 🔴 BLOCK | Any cycle in import graph                           |
| Wrong-direction layer import                       | 🔴 BLOCK | Lower layer importing from higher layer             |
| LOC threshold exceeded + multiple responsibilities | 🔴 BLOCK | Both conditions true                                |
| LOC threshold exceeded, single responsibility      | 🔵 NOTE  | Threshold exceeded but file is legitimately focused |
| File hard to name without "and" / "or"             | 🟡 WARN  | Likely SRP candidate                                |
| Barrel file re-exporting > ~10 modules             | 🟡 WARN  | Review for domain sprawl                            |
| Minor edit to existing violating file              | 🟡 WARN  | ≤ 5 lines, create follow-up task                    |
| Test file over 1.5× language LOC threshold         | 🟡 WARN  | May be testing too many things                      |
