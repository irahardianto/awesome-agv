---
layout: default
title: Skills Reference
nav_order: 4
---

# Skills Reference
{: .no_toc }

All 57 specialized skills that extend your agent's capabilities.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## What Are Skills?

Skills are folders in `.agents/skills/` that contain structured instructions for specialized tasks. Each skill has a `SKILL.md` file with YAML frontmatter and detailed guidance. More complex skills may include scripts, language modules, examples, and resources.

Skills differ from rules in that they are **procedural** — they describe a *process* to follow, not just constraints to respect.

---

## Core Engineering Skills (9)

### Debugging Protocol

**File:** `.agents/skills/debugging-protocol/SKILL.md`

A systematic protocol for validating root causes of software issues. Instead of guessing, the agent forms hypotheses and tests them methodically.

**When to Use:**
- Complex bugs with non-obvious causes
- Flaky tests
- Unknown system behavior
- When a quick fix attempt has already failed

**How It Works:**
1. Observe the symptoms
2. Form hypotheses about root cause
3. Design specific tests for each hypothesis
4. Execute tests and collect evidence
5. Validate the root cause before applying a fix

**Language Modules (13):**

| Module | Languages/Runtimes |
| --- | --- |
| `languages/go.md` | Go (goroutines, pprof, Delve, race detector) |
| `languages/typescript.md` | TypeScript, Node.js, Vue, React |
| `languages/python.md` | Python, Django, FastAPI |
| `languages/rust.md` | Rust (cargo, rustc, tokio) |
| `languages/java.md` | Java, Spring Boot (JVM tools, heap/thread dumps) |
| `languages/csharp.md` | C#, .NET, ASP.NET Core |
| `languages/swift.md` | Swift, SwiftUI, iOS/macOS |
| `languages/flutter.md` | Flutter, Dart (DevTools, widget rebuilds) |
| `languages/cpp.md` | C++ (sanitizers, GDB/LLDB, Valgrind) |
| `languages/kotlin.md` | Kotlin (coroutine debugger, JVM tools) |
| `languages/php.md` | PHP, Laravel (Xdebug, autoloading) |
| `languages/ruby.md` | Ruby, Rails (debug gem, Pry, Zeitwerk) |
| `languages/frontend.md` | Vue 3, React, browser, Vite |

---

### Sequential Thinking

**File:** `.agents/skills/sequential-thinking/SKILL.md`

A tool for dynamic, reflective problem-solving through iterative thought chains. Adapted from the [Sequential Thinking MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking).

**When to Use:**
- Complex planning requiring revision
- Multi-step analysis where context maintenance is needed
- Problems requiring branching or backtracking
- Hypothesis verification
- Full scope isn't initially clear

---

### Code Review

**File:** `.agents/skills/code-review/SKILL.md`

A structured protocol for inspecting code quality against the full awesome-agv rule set. Catches issues that linters miss: architectural violations, missing observability, business logic errors, and pattern inconsistencies.

**When to Use:**
- During the `/audit` workflow (Phase 1)
- When asked for a code review outside any workflow
- **Best practice:** use in a fresh conversation to avoid confirmation bias

**Review Categories (Priority Order):**

| Priority     | Category                                                 | Issues Found                                       |
| ------------ | -------------------------------------------------------- | -------------------------------------------------- |
| **Critical** | Security, Data Loss, Resource Leaks                      | Injection, hardcoded secrets, unclosed connections |
| **Major**    | Testability, Observability, Error Handling, Architecture | Missing interfaces, no logging, empty catch blocks |
| **Minor**    | Pattern Consistency, Naming, Code Organization           | Deviation from codebase patterns, unclear names    |
| **Nit**      | Style, Documentation                                     | Formatting, missing comments                       |

**Language-Specific Anti-Patterns (12 modules):**

| Language | Anti-Patterns |
| --- | --- |
| Go | `languages/go.md` |
| TypeScript | `languages/typescript.md` |
| Python | `languages/python.md` |
| Rust | `languages/rust.md` |
| Java | `languages/java.md` |
| C# | `languages/csharp.md` |
| Swift | `languages/swift.md` |
| Flutter | `languages/flutter.md` |
| C++ | `languages/cpp.md` |
| Kotlin | `languages/kotlin.md` |
| PHP | `languages/php.md` |
| Ruby | `languages/ruby.md` |

---

### Guardrails

**File:** `.agents/skills/guardrails/SKILL.md`

Pre-flight checklist and post-implementation self-review protocol. Catches issues that would otherwise only surface during verification.

**When to Use:**
- **Pre-Flight:** Before writing any code (start of Phase 2: Implement)
- **Self-Review:** After writing code but before verification (end of Phase 2)

**Language-Specific Self-Review (12 modules):**

| Language | Checklist |
| --- | --- |
| Go | `languages/go.md` |
| TypeScript | `languages/typescript.md` |
| Python | `languages/python.md` |
| Rust | `languages/rust.md` |
| Java | `languages/java.md` |
| C# | `languages/csharp.md` |
| Swift | `languages/swift.md` |
| Flutter | `languages/flutter.md` |
| C++ | `languages/cpp.md` |
| Kotlin | `languages/kotlin.md` |
| PHP | `languages/php.md` |
| Ruby | `languages/ruby.md` |

---

### Architecture Decision Records (ADR)

**File:** `.agents/skills/adr/SKILL.md`

Document significant architectural decisions so institutional knowledge persists across conversations and team members. ADRs capture the **why**, not just the **what**.

**When to Use:**
- During Research phase when choosing between approaches
- When introducing a new dependency or pattern
- When changing existing architecture
- When choosing between 2+ viable approaches

**Process:**
- ADRs stored in `docs/decisions/NNNN-short-title.md`
- Number sequentially, never delete — mark as `Superseded by NNNN`
- Status lifecycle: `Proposed` → `Accepted` → `Deprecated` or `Superseded`

---

### Performance Optimization

**File:** `.agents/skills/perf-optimization/SKILL.md`

Profile-driven performance optimization protocol. Instead of guessing, the agent profiles first, analyzes data, and applies fixes one-at-a-time with benchmarking.

**When to Use:**
- Profiling data is available (pprof, flamegraph, Lighthouse, Chrome DevTools)
- User asks to analyze or optimize performance of a component
- Benchmark regression is detected
- After deploying a feature that touches a hot path

**Core Methodology:**
1. **Profile** — collect data using language-appropriate tooling
2. **Analyze** — focus on cumulative cost, trace flat back to user-land code
3. **Prioritize** — rank fixes by impact/risk ratio
4. **Optimize** — one fix at a time, TDD, benchmark immediately
5. **Verify** — compare before/after with identical benchmark config
6. **Stop** — when remaining cost is in runtime internals or hardware-optimized code

**Language Modules (13):**

| Module | Use When |
| --- | --- |
| `languages/go.md` | Go services, APIs, CLI tools |
| `languages/typescript.md` | TypeScript backends, Node.js |
| `languages/python.md` | Python services, data pipelines |
| `languages/rust.md` | Rust binaries, libraries |
| `languages/java.md` | Java/Spring services |
| `languages/csharp.md` | .NET services |
| `languages/swift.md` | Swift/iOS apps |
| `languages/flutter.md` | Flutter/Dart apps |
| `languages/cpp.md` | C++ systems, games |
| `languages/kotlin.md` | Kotlin/Android apps |
| `languages/php.md` | PHP/Laravel services |
| `languages/ruby.md` | Ruby/Rails services |
| `languages/frontend.md` | Web frontends (JS/TS bundle, rendering, network) |

**Profiling Scripts:**

| Script | Purpose |
| --- | --- |
| `scripts/go-pprof.sh` | Extract Go pprof CPU/heap profiles into agent-readable markdown |
| `scripts/frontend-lighthouse.sh` | Core Web Vitals via Lighthouse or Vite chunk analysis |

---

### Refactoring Patterns

**File:** `.agents/skills/refactoring-patterns/SKILL.md`

Safe refactoring pattern catalog: code smell taxonomy, transformation techniques, behavior preservation strategies, and metrics tracking.

**When to Use:**
- Technical debt remediation
- Code smell detection and elimination
- Pattern migration (e.g., callback → async/await)
- Complexity reduction
- During the `/refactor` workflow

---

### Research Methodology

**File:** `.agents/skills/research-methodology/SKILL.md`

Structured research protocol for investigating technologies, patterns, and APIs before implementation. Multi-tool search, research logs, and training data fallback honesty.

**When to Use:**
- Technology evaluation (new libraries, frameworks)
- Pattern discovery before implementation
- API investigation and compatibility analysis
- During the Research phase of any workflow

---

### Omni

**File:** `.agents/skills/omni/SKILL.md`

Maximum token-efficiency communication mode. Telegraphic English with minimal structured notation. 100% technical accuracy, zero fluff, zero waste.

**Activation:** This skill is opt-in. Load it when:
- User explicitly requests concise output (e.g., "use omni", "be concise")
- Operating as a sub-agent in `/workflow-team` pipelines where token budget matters
- Agent-to-agent communication via `/omni headless` modifier

**Never activate by default** in normal conversations — users expect natural language.

**Key Rules:**
- Zero filler, pleasantries, hedging
- Never restate the user's question
- Fragments OK — compress form, never content
- Code inside markdown blocks = 100% valid, never abbreviated
- Auto-pause compression for security warnings and destructive actions

---

## Design & UI Skills (2)

### Frontend Design

**File:** `.agents/skills/frontend-design/SKILL.md`

Guidelines for creating distinctive, production-grade web interfaces. Based on [Anthropic's Frontend-Design Skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design).

**When to Use:**
- Building websites or landing pages
- Creating dashboards and admin interfaces
- Styling or beautifying existing UIs
- Any frontend work requiring visual polish

**Key Principles:**
- Design Thinking — understand context, audience, and constraints
- Typography — distinctive, readable fonts with clear hierarchy
- Creative Color Palettes — harmonious, purposeful color use
- Subtle Animations — meaningful motion for state changes
- Responsive Layouts — mobile-first, fluid grids

---

### Mobile Design

**File:** `.agents/skills/mobile-design/SKILL.md`

Guidelines for creating distinctive, production-grade mobile interfaces for Flutter and React Native.

**When to Use:**
- Building mobile app screens or widgets
- Styling mobile interfaces
- Creating visually striking mobile UIs
- Working with Flutter or React Native

**Key Principles:**
- Platform Conventions — iOS (Cupertino) vs Android (Material 3)
- Light & Dark Themes — always support both
- Motion — meaningful animations under 300ms, respect `reduceMotion`
- One-Handed Use — critical actions in thumb-reach zone
- Performance — `const` constructors, `ListView.builder`, cached images

---

## Multi-Agent Skills (1)

This skill powers the `/workflow-team` multi-agent orchestration. It ensures parallel sub-agents can work on the same codebase without file conflicts.

### Parallel Dispatch

**File:** `.agents/skills/parallel-dispatch/SKILL.md`

MECE task decomposition, file ownership enforcement, DAG-based execution, and safe merge protocol for intra-domain parallel dispatch. The safety invariants that prevent merge chaos when multiple agents write in parallel. Applies recursively at every nesting depth.

**When to Use:**
- Before dispatching multiple instances of the same agent type within a primitive
- When any agent (at any depth) needs to parallelize its own workload across sub-subagents
- When re-planning after a sub-task failure

**Sections:**
1. **Decomposition** — MECE scope card production, recursive decomposition, cap check
2. **Ownership** — One-writer-per-file invariant, three zones (exclusive write, shared read, contracts layer)
3. **Execution** — DAG levels, merge ordering, conflict classification
4. **Read-Only Agents** — MECE scoping for coverage guarantees

---

## Architecture & Infrastructure Skills (4)

Cross-cutting skills loaded via rule references — they apply to all languages and load regardless of file type.

### Testability Patterns

**File:** `.agents/skills/testability-patterns/SKILL.md`

Implementation examples for the three testability rules: I/O isolation, pure logic extraction, and dependency direction. Code examples across Go, TypeScript, Python, Rust, and Dart.

*Loaded via reference from `architectural-pattern.md` — not triggered by file patterns.*

---

### Logging Implementation

**File:** `.agents/skills/logging-implementation/SKILL.md`

Structured logging patterns, log levels, mandatory context fields (correlationId, userId, duration), PII scrubbing, and per-language library choices (Go slog, TypeScript pino, Python structlog).

*Loaded via reference from `logging-and-observability-mandate.md` — not triggered by file patterns.*

---

### CI/CD

**File:** `.agents/skills/ci-cd/SKILL.md`

Pipeline design, multi-stage Docker builds, image scanning, SBOM attestation (Cosign keyless), and environment promotion. Layered by complexity — Level 0 (all projects), Level 1 (containerized), Level 2 (Kubernetes). GitOps and Kubernetes patterns in `references/gitops-kubernetes.md`.

*Auto-loads on Dockerfile, `.github/workflows/*`, Jenkinsfile, `*.gitlab-ci.yml`.*

---

### Feature Flags

**File:** `.agents/skills/feature-flags/SKILL.md`

Release flags, ops kill switches, experiment flags, and permission gating. Includes lifecycle rules (90-day max for release flags), flag evaluation patterns, and CI/CD checklist.

**PRD-gated** — load only when PRD or technical architecture explicitly requires gradual rollout, A/B testing, or kill switches.

*Auto-loads on `feature*flag*`, `feature*toggle*` file patterns.*

---

## Language & Framework Idioms (24)

Language-specific patterns, tooling, and conventions. Each skill follows the same structure: idioms, error handling, testing, anti-patterns, and formatting/linting commands.

**Core stacks (auto-load via `paths:` triggers):**

| Skill | Ecosystem | Auto-loads on |
| --- | --- | --- |
| [Go Idioms](.agents/skills/go-idioms/SKILL.md) | Go stdlib, error wrapping, table-driven tests, gofumpt | `**/*.go`, `**/go.mod` |
| [TypeScript Idioms](.agents/skills/typescript-idioms/SKILL.md) | Strict mode, type narrowing, Zod, vitest | `**/*.ts`, `**/*.tsx` |
| [Vue Idioms](.agents/skills/vue-idioms/SKILL.md) | Vue 3 Composition API, Pinia (Setup Store), composables | `**/*.vue`, `**/store/**/*.ts` |
| [Flutter Idioms](.agents/skills/flutter-idioms/SKILL.md) | Riverpod 3, freezed, go_router, const widgets | `**/*.dart`, `**/pubspec.yaml` |
| [Rust Idioms](.agents/skills/rust-idioms/SKILL.md) | Ownership, tokio, thiserror/anyhow, clippy pedantic | `**/*.rs`, `**/Cargo.toml` |
| [Python Idioms](.agents/skills/python-idioms/SKILL.md) | Type hints, Protocols, ruff, mypy strict, pytest | `**/*.py`, `**/pyproject.toml` |

**Community language skills (18 additional ecosystems):**

| Skill | Ecosystem |
| --- | --- |
| **Angular** (`.agents/skills/angular-idioms/SKILL.md`) | Angular components, signals, standalone |
| **C++** (`.agents/skills/cpp-idioms/SKILL.md`) | Modern C++ (RAII, smart pointers, templates) |
| **C#** (`.agents/skills/csharp-idioms/SKILL.md`) | .NET, async/await, LINQ |
| **Django** (`.agents/skills/django-idioms/SKILL.md`) | Django ORM, views, middleware |
| **.NET** (`.agents/skills/dotnet-idioms/SKILL.md`) | ASP.NET Core, Entity Framework, hosting |
| **Elixir** (`.agents/skills/elixir-idioms/SKILL.md`) | OTP, GenServer, supervision trees |
| **Java** (`.agents/skills/java-idioms/SKILL.md`) | Streams, records, sealed classes, Spring |
| **JavaScript** (`.agents/skills/javascript-idioms/SKILL.md`) | ES2024+, async patterns, ESM |
| **Kotlin** (`.agents/skills/kotlin-idioms/SKILL.md`) | Coroutines, sealed classes, Android |
| **Laravel** (`.agents/skills/laravel-idioms/SKILL.md`) | Eloquent, middleware, queues |
| **Next.js** (`.agents/skills/nextjs-idioms/SKILL.md`) | App Router, RSC, ISR |
| **PHP** (`.agents/skills/php-idioms/SKILL.md`) | PHP 8+, type declarations, Composer |
| **Rails** (`.agents/skills/rails-idioms/SKILL.md`) | ActiveRecord, conventions, Hotwire |
| **React** (`.agents/skills/react-idioms/SKILL.md`) | Hooks, Suspense, Server Components |
| **Ruby** (`.agents/skills/ruby-idioms/SKILL.md`) | Blocks, modules, RSpec |
| **Spring Boot** (`.agents/skills/spring-boot-idioms/SKILL.md`) | Spring DI, JPA, WebFlux |
| **SQL** (`.agents/skills/sql-idioms/SKILL.md`) | Query optimization, indexes, PostgreSQL |
| **Swift** (`.agents/skills/swift-idioms/SKILL.md`) | SwiftUI, Combine, async/await |

{: .note }
> These 18 community skills extend coverage beyond the 6 core language stacks (Go, TypeScript, Vue 3, Flutter/Dart, Rust, Python) which auto-load via the rule system.

---

## Domain Skills (10)

### API Documentation

**File:** `.agents/skills/api-documentation/SKILL.md`

OpenAPI 3.1 specification writing, request/response examples, error documentation, versioning, and interactive API portal patterns.

---

### Browser Automation

**File:** `.agents/skills/browser-automation/SKILL.md`

Playwright browser automation via MCP. Covers E2E testing, UI review, web scraping, screenshot capture, and general browser interaction. MCP-first — CLI is fallback only.

---

### Chaos Testing

**File:** `.agents/skills/chaos-testing/SKILL.md`

Controlled failure injection: hypothesis design, blast radius control, safety mechanisms, game day planning, and resilience verification.

---

### CLI Development

**File:** `.agents/skills/cli-development/SKILL.md`

CLI tool design, argument parsing, interactive prompts, shell completions, cross-platform considerations, and distribution strategies.

---

### Data Engineering

**File:** `.agents/skills/data-engineering/SKILL.md`

Data pipeline architecture, ETL/ELT patterns, data quality, batch vs stream processing, orchestration, and data governance principles.

---

### Embedded Systems

**File:** `.agents/skills/embedded-systems/SKILL.md`

Resource-constrained development, real-time patterns, interrupt handling, memory management, RTOS patterns, and hardware abstraction layers.

---

### Incident Response

**File:** `.agents/skills/incident-response/SKILL.md`

Structured incident workflow: severity classification, triage, diagnosis, mitigation, postmortem, and prevention. Template-driven with blameless review.

---

### ML Engineering

**File:** `.agents/skills/ml-engineering/SKILL.md`

ML pipeline design, feature engineering, model training/serving, experiment tracking, model validation, and MLOps principles.

---

### Payment Integration

**File:** `.agents/skills/payment-integration/SKILL.md`

PCI DSS compliance, payment gateway integration, tokenization, webhook reliability, idempotency, fraud prevention, and subscription billing.

---

### Supply Chain Security

**File:** `.agents/skills/supply-chain-security/SKILL.md`

SBOM generation, CVE scanning, supply chain attack detection, license compliance, dependency pinning, and artifact verification.
