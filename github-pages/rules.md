---
layout: default
title: Rules Reference
nav_order: 3
---

# Rules Reference
{: .no_toc }

All 42 rules organized by category, with trigger types and descriptions.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## How Rules Work

Rules are markdown files in `.agents/rules/` that provide guidance to AI agents. Each rule has a **trigger type** in its YAML frontmatter:

| Trigger          | Behavior                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `always_on`      | Loaded in every session — non-negotiable constraints                  |
| `model_decision` | Activated contextually when the agent determines the rule is relevant |

When rules conflict, [Rule Priority](https://github.com/irahardianto/awesome-agv/blob/main/.agents/rules/rule-priority.md) determines the winner. Security always wins.

---

## 🕸️ Rule Dependency Graph

The rules are highly interconnected. You can explore these relationships using our **[Interactive Rule Dependency Graph](rule_dependency_graph.html)** to see how individual mandates, principles, and idioms relate to each other.

---

## 🛡️ Security & Integrity

Rules that ensure code is secure by default.

### Rugged Software Constitution
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `rugged-software-constitution.md`

The foundational philosophy based on the [Rugged Software Manifesto](https://ruggedsoftware.org/). Establishes three commitments: Responsible, Defensible, and Maintainable. Defines the 7 Rugged Habits including defense-in-depth, instrument for awareness, reduce attack surface, design for failure, clean up after yourself, verify your defenses, and adapt to the ecosystem.

### Security Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `security-mandate.md`

Non-negotiable security requirements:
- Never trust user input — validate server-side
- Deny by default — require explicit permission
- Fail securely — fail closed, never open
- Defense in depth — multiple layers of security

### Security Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `security-principles.md`

Detailed security implementation guidance for authentication, authorization, input validation, cryptographic operations, and handling sensitive data.

---

## ⚡ Reliability & Performance

Rules that ensure code is robust and efficient.

### Error Handling Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `error-handling-principles.md`

Techniques for robust error management including error types, recovery strategies, validation errors, business rule violations, infrastructure failures, and resource cleanup.

### Concurrency & Threading Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `concurrency-and-threading-principles.md`

Detailed patterns for safe parallel execution: goroutines, async/await, thread pools, deadlock prevention, and race condition avoidance.

### Concurrency & Threading Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `concurrency-and-threading-mandate.md`

When to use concurrency (I/O-bound vs CPU-bound) and when NOT to use it. Prevents premature optimization and overuse of threads.

### Performance Optimization Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `performance-optimization-principles.md`

Writing efficient and scalable code. Profiling, benchmarking, and optimizing performance-critical paths.

### Resource & Memory Management
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `resources-and-memory-management-principles.md`

Handling files, database connections, network sockets, and locks. Implementing resource pools, cleanup, and timeout strategies.

### Monitoring & Alerting Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `monitoring-and-alerting-principles.md`

Health check endpoints (`/health` and `/ready`), metrics instrumentation using RED/USE methods, error tracking integration, circuit breakers, and graceful degradation.

### Configuration Management Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `configuration-management-principles.md`

Separating configuration from code, environment variables, secrets management, configuration hierarchy (CLI args → env vars → config files → defaults), and `.env` file organization.

---

## 🏗️ Architecture & Design

Rules that ensure code is well-structured and scalable.

### Core Design Principles
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `core-design-principles.md`

Fundamental software design rules:
- **SOLID** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY** — Don't Repeat Yourself
- **YAGNI** — You Aren't Gonna Need It
- **KISS** — Keep It Simple, Stupid
- Separation of Concerns, Composition Over Inheritance, Principle of Least Astonishment

### Architectural Pattern (Testability-First)
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `architectural-pattern.md`

The core architectural approach:
1. **I/O Isolation** — Abstract all I/O behind interfaces
2. **Pure Business Logic** — No side effects in calculations
3. **Dependency Direction** — Dependencies point inward toward business logic

Includes pattern discovery protocol, language-specific idioms table, and enforcement checklist.

### API Design Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `api-design-principles.md`

Creating clean, intuitive, and versionable REST/HTTP APIs. Covers endpoints, handlers, middleware, and response formatting.

### Project Structure
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `project-structure.md`

**The single source of truth for project organization.** Enforces feature-based organization (not layer-based). Includes complete layout examples for:
- Monorepo (backend + frontend + mobile)
- Flutter/Mobile apps
- Single backend/frontend apps
- Microservices

### Database Design Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `database-design-principles.md`

Schema design (3NF), naming conventions, migration safety rules, query performance (parameterized queries, indexing, N+1 prevention), and transaction management.

### Data Serialization & Interchange
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `data-serialization-and-interchange-principles.md`

Safe data handling for JSON, XML, YAML, Protocol Buffers, MessagePack, and other formats.

### Command Execution Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `command-execution-principles.md`

Principles for running external commands and shell scripts securely — preventing injection, handling exit codes, and managing process lifecycles.

### Project Structure — Go Backend
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `project-structure-go-backend.md`

Go-specific directory layout for backend services, including `cmd/`, `internal/`, and feature-based organization.

### Project Structure — Vue Frontend
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `project-structure-vue-frontend.md`

Vue/React frontend directory layout with feature-based organization: components, stores, API, and services.

### Project Structure — Flutter Mobile
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `project-structure-flutter-mobile.md`

Flutter and React Native mobile app layout: screens, widgets, state management, and repository pattern.

### Project Structure — Rust/Cargo
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `project-structure-rust-cargo.md`

Rust workspace and crate layout: `src/`, `tests/`, `benches/`, and multi-crate workspace organization.

### Project Structure — Python Backend
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `project-structure-python-backend.md`

Python backend layout: `src/` package with feature-based modules, `tests/` mirroring source, Poetry/uv dependency management, and `alembic/` for migrations.

---

## 🧩 Maintainability & Quality

Rules that ensure code is readable, testable, and long-lived.

### Code Organization Principles
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-organization-principles.md`

Feature-based organization with clear public interfaces. Module boundaries, feature interaction patterns, and wiring examples.

### Code Idioms & Conventions
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-idioms-and-conventions.md`

Write idiomatic code for the target language. Follow community conventions, use language built-ins, avoid cross-language anti-patterns. Delegates to dedicated language idiom files for ecosystem-specific guidance.

### Go Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `go-idioms-and-patterns.md`

Go-specific patterns: error handling with `%w`, small interfaces, goroutines and channels, error-checked resource cleanup (defers), `//nolint:errcheck` ban, naming conventions, table-driven tests, and `gofumpt`/`staticcheck`/`gosec` tooling.

### TypeScript Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `typescript-idioms-and-patterns.md`

TypeScript type system idioms: strict mode, discriminated unions, `unknown` over `any`, `readonly`, runtime validation with Zod, centralized HTTP client enforcement (no raw `fetch`/`axios` bypass), `Promise.all` patterns, and Vitest testing.

### Vue Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `vue-idioms-and-patterns.md`

Vue 3 Composition API patterns: `<script setup>`, `ref` vs `reactive`, Pinia Setup Stores, composables, route transition patterns (CSS `@layer` × SPA conflicts), `defineProps`/`defineEmits` with TypeScript, and `createTestingPinia` for tests.

### Flutter Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `flutter-idioms-and-patterns.md`

Flutter/Dart patterns: `const` constructors, widget decomposition, immutable models with `freezed`, Riverpod state management (provider types, `ref.watch` vs `ref.read`), `go_router` navigation, and `flutter analyze` tooling.

### Rust Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `rust-idioms-and-patterns.md`

Rust ownership and borrowing, error handling with `thiserror`/`anyhow`, async with `tokio`, unsafe code policy, idiomatic patterns (builder, newtype, typestate), and `cargo clippy` configuration.

### Python Idioms & Patterns
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `python-idioms-and-patterns.md`

Python type hints, `typing.Protocol` for interfaces, `pytest` fixtures and parametrize, `ruff` for linting/formatting, `mypy --strict` for type checking, `bandit` for security, virtual environments, and Pydantic models.

### Testing Strategy
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `testing-strategy.md`

Comprehensive testing guidance:
- Unit tests (mocked I/O, >85% coverage on domain logic)
- Integration tests (Testcontainers, real infrastructure)
- E2E tests (Playwright, full user journeys)
- Test organization and naming conventions

### Dependency Management Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `dependency-management-principles.md`

Managing external libraries safely — version pinning, audit, and minimizing attack surface.

### Documentation Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `documentation-principles.md`

Self-documenting code, when to comment (WHY, not WHAT), and documentation levels from inline comments to architecture docs.

### Logging & Observability Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `logging-and-observability-principles.md`

Complete implementation guide: log levels, structured logging patterns, language-specific implementations (Go, TypeScript, Python), security considerations, and performance best practices.

### Logging & Observability Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `logging-and-observability-mandate.md`

All operation entry points MUST be logged (start, success, failure). Mandatory context: correlationId, operation name, duration, userId, error.

### Accessibility Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `accessibility-principles.md`

WCAG 2.1 Level AA compliance: semantic HTML, keyboard navigation, ARIA attributes, color contrast, images, and forms.

### Git Workflow Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `git-workflow-principles.md`

Conventional commits format, branch naming, commit hygiene, PR size guidelines (<400 lines ideal), and merge strategy.

---

## 🔄 DevOps & Operations

Rules that ensure the development pipeline is reliable and automated.

### CI/CD Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `ci-cd-principles.md`

Pipeline design (lint → build → test → deploy), Dockerfile multi-stage builds, Docker Compose patterns, GitHub Actions templates, and environment promotion strategy.

### CI/CD GitOps Kubernetes
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `ci-cd-gitops-kubernetes.md`

ArgoCD GitOps patterns, Kubernetes deployment strategies, Helm chart conventions, and infrastructure-as-code principles. **PRD-gated** — only applies when explicitly required by the technical architecture document.

### Feature Flags Principles
{: .d-inline-block }
model_decision
{: .label .label-blue }

**File:** `feature-flags-principles.md`

Flag types (release, experiment, ops, permission), lifecycle management, rollout strategies, and cleanup policies. **PRD-gated** — only applies when explicitly required by the PRD.

### Code Completion Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-completion-mandate.md`

Before marking any code task as complete, you MUST run automated quality checks:
1. Generate → 2. Validate → 3. Remediate → 4. Verify → 5. Deliver

Delegates language-specific quality commands (linters, formatters, type checkers) to the respective idiom files.

### Rule Priority
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `rule-priority.md`

Conflict resolution when rules contradict each other. Priority order:
1. Security Mandate (always wins)
2. Rugged Software Constitution
3. Code Completion Mandate
4. Testability-First Design
5. Feature-specific principles
6. PRD-gated principles (feature flags, GitOps)
7. YAGNI / KISS
