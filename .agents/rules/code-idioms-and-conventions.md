---
trigger: always_on
---

## Code Idioms and Conventions

### Universal Principle

**Write idiomatic code for the target language:**

- Code should look natural to developers familiar with that language  
- Follow established community conventions, not personal preferences  
- Use language built-ins and standard library effectively  
- Apply language-appropriate patterns (don't force patterns from other languages)

### Idiomatic Code Characteristics

- Leverages language features (don't avoid features unnecessarily)  
- Follows language naming conventions  
- Uses appropriate error handling for language (exceptions vs Result types)  
- Applies established community patterns

### Avoid Cross-Language Anti-Patterns

- ❌ Don't write "Java in Python" or "C in Go"  
- ❌ Don't force OOP patterns in functional languages  
- ❌ Don't avoid language features because they're "unfamiliar"  
- ✅ Learn and apply language-specific idioms

### Language-Specific Idioms

This file defines the universal principle. Each language has a dedicated file with concrete patterns, tooling choices, and idiom-specific rules. **Load the relevant file when working in that language** — it is the authoritative source for that ecosystem.

| Language / Framework | Idiom File                         | When to Load                                    |
| -------------------- | ---------------------------------- | ----------------------------------------------- |
| **Go**               | @go-idioms-and-patterns.md         | Go services, APIs, CLI tools                    |
| **TypeScript**       | @typescript-idioms-and-patterns.md | Any TypeScript project (backend, frontend, CLI) |
| **Vue 3**            | @vue-idioms-and-patterns.md        | Vue components, Pinia stores, composables       |
| **Flutter / Dart**   | @flutter-idioms-and-patterns.md    | Mobile apps, Flutter widgets, Riverpod          |
| **Rust**             | @rust-idioms-and-patterns.md       | Rust binaries, libraries, workspaces            |
| **Python**           | @python-idioms-and-patterns.md     | Python services, CLI tools, data pipelines      |

> Each language-specific file is independently changeable. It governs only its own ecosystem's coding idioms and defers to the relevant cross-cutting principle files (error handling, testing, logging, etc.) for universal guidance.

### Extended Language Idioms (Skills)

Additional languages and frameworks are covered by **skills** in `.agents/skills/`. Load the relevant skill when working in that ecosystem — they follow the same structure as the rule-level idiom files above.

| Language / Framework    | Skill Path                              | When to Load                                       |
| ----------------------- | --------------------------------------- | -------------------------------------------------- |
| **Angular**             | `.agents/skills/angular-idioms/SKILL.md`     | Angular components, signals, standalone components  |
| **C++**                 | `.agents/skills/cpp-idioms/SKILL.md`         | C++ systems code, RAII, templates                   |
| **C# / .NET**           | `.agents/skills/csharp-idioms/SKILL.md`      | C# services, ASP.NET, Entity Framework              |
| **.NET (general)**      | `.agents/skills/dotnet-idioms/SKILL.md`      | .NET platform patterns, NuGet, hosting              |
| **Django**              | `.agents/skills/django-idioms/SKILL.md`      | Django views, models, ORM, admin                    |
| **Elixir**              | `.agents/skills/elixir-idioms/SKILL.md`      | Elixir/Phoenix, OTP, GenServer, Ecto                |
| **Java**                | `.agents/skills/java-idioms/SKILL.md`        | Java services, Spring, records, sealed classes      |
| **JavaScript**          | `.agents/skills/javascript-idioms/SKILL.md`  | Vanilla JS, Node.js, ESM                            |
| **Kotlin**              | `.agents/skills/kotlin-idioms/SKILL.md`      | Kotlin services, coroutines, Android                |
| **Laravel**             | `.agents/skills/laravel-idioms/SKILL.md`     | Laravel controllers, Eloquent, Blade                |
| **Next.js**             | `.agents/skills/nextjs-idioms/SKILL.md`      | Next.js App Router, RSC, API routes                 |
| **PHP**                 | `.agents/skills/php-idioms/SKILL.md`         | PHP 8+, Composer, type system                       |
| **React**               | `.agents/skills/react-idioms/SKILL.md`       | React components, hooks, state management           |
| **Ruby**                | `.agents/skills/ruby-idioms/SKILL.md`        | Ruby idioms, blocks, metaprogramming                |
| **Ruby on Rails**       | `.agents/skills/rails-idioms/SKILL.md`       | Rails controllers, ActiveRecord, conventions        |
| **Spring Boot**         | `.agents/skills/spring-boot-idioms/SKILL.md` | Spring Boot services, beans, configuration          |
| **SQL**                 | `.agents/skills/sql-idioms/SKILL.md`         | SQL queries, indexes, migrations, PostgreSQL        |
| **Swift**               | `.agents/skills/swift-idioms/SKILL.md`       | Swift services, SwiftUI, concurrency                |

> Skills follow the same principles as rule-level idiom files but cover languages outside the project's primary stack. They are independently maintainable and versioned.

### Related Principles
- Core Design Principles @core-design-principles.md
- Code Completion Mandate @code-completion-mandate.md
