---
layout: default
title: Rules Reference
nav_order: 3
---

# Rules Reference
{: .no_toc }

All 30 rules organized by category, with trigger types and descriptions.
{: .fs-6 .fw-300 }

<details open markdown="block">
  <summary>Table of contents</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

---

## How Rules Work

Rules are markdown files in `.agent/rules/` that provide guidance to AI agents. Each rule has a **trigger type** in its YAML frontmatter:

| Trigger | Behavior |
|---------|----------|
| `always_on` | Loaded in every session — non-negotiable constraints |
| `model_decision` | Activated contextually when the agent determines the rule is relevant |

When rules conflict, [Rule Priority](https://github.com/irahardianto/antigravity-setup/blob/main/.agent/rules/rule-priority.md) determines the winner. Security always wins.

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

### Avoid Circular Dependencies
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `avoid-circular-dependencies.md`

Preventing module import cycles. Solutions: extract shared code to a third module, restructure dependencies, or use dependency injection.

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

Write idiomatic code for the target language. Follow community conventions, use language built-ins, avoid cross-language anti-patterns.

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

### Code Completion Mandate
{: .d-inline-block }
always_on
{: .label .label-red }

**File:** `code-completion-mandate.md`

Before marking any code task as complete, you MUST run automated quality checks:
1. Generate → 2. Validate → 3. Remediate → 4. Verify → 5. Deliver

Includes language-specific quality commands for Go and TypeScript/Vue.

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
6. YAGNI / KISS
