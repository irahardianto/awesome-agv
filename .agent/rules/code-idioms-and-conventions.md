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

> Each language-specific file is independently changeable. It governs only its own ecosystem's coding idioms and defers to the relevant cross-cutting principle files (error handling, testing, logging, etc.) for universal guidance.

### Related Principles
- Core Design Principles @core-design-principles.md
- Code Completion Mandate @code-completion-mandate.md
