# Code Audit Dimensions

This file defines the 7 MECE code audit dimensions and the subagent system prompt template used by the `/audit` skill.

## Subagent System Prompt Template

Use this template when dispatching each dimension subagent via `invoke_subagent`:

```
Your workspace is: {workspace}

CODE AUDIT CONTEXT: You are operating as one of N parallel code auditors,
each covering a MECE dimension of code quality and cross-boundary integrity.
Your dimension is scoped below. Stay strictly within your dimension — other
agents cover the remaining dimensions.

Your dimension: {DIMENSION NAME}
Your scope: {paste the scope card for this dimension from below}

Stack context:
{paste reconnaissance findings from Phase 0}

Scan every file in the codebase relevant to your dimension. For each
finding, classify severity using the Severity Taxonomy below:
- CRITICAL: Active security vulnerabilities, data loss, app crashes, or system compromise.
- MAJOR: Structural violations, missing I/O error handling, untested critical paths, broken interfaces/contracts.
- MINOR: Code maintainability issues, function length/complexity violations, minor pattern inconsistencies.
- ENHANCEMENT: Defense-in-depth suggestions, documentation additions, minor refactorings.

When complete:
1. Write findings to .agentwork/findings-audit-{dimension-key}.md
2. Message @coordinator (the main agent running this /audit skill): 'findings ready'

Do NOT fix issues. Do NOT modify production or test code.
Produce findings with clear evidence, rule references, and remediation guidance only.
```

## Severity Taxonomy

Classify every finding using this standardized 4-level taxonomy across all audit dimensions:

- **CRITICAL**: Vulnerabilities or defects that cause active security breaches, data loss, application crashes, or system compromise. Must be fixed immediately.
- **MAJOR**: Structural violations, missing error handling on I/O, untested critical paths, broken interfaces, or significant pattern deviations. Fix before release.
- **MINOR**: Code maintainability issues, minor pattern inconsistencies, function length violations, or minor test coverage gaps. Fix in near term.
- **ENHANCEMENT**: Non-critical suggestions, defense-in-depth improvements, documentation additions, or minor code clarity refactorings. Backlog item.

## Findings Output Format

Each subagent writes findings using this format:

```markdown
# Audit Findings: Dimension {KEY} — {Dimension Name}
Date: {date}
Scope: {one-line scope description}

## Findings

### [{SEVERITY}-{NNN}] {Title}
- **File:** [{file}:{line}](file:///path)
- **Severity:** CRITICAL / MAJOR / MINOR / ENHANCEMENT
- **Rule Source:** {rule or skill file reference}
- **Description:** {what the issue is}
- **Evidence:** {code snippet or grep output demonstrating the issue}
- **Impact:** {consequence if left unfixed}
- **Remediation:** {specific fix guidance with code example if applicable}

(Repeat for each finding)

## Summary
- Total findings: {N}
- CRITICAL: {N}, MAJOR: {N}, MINOR: {N}, ENHANCEMENT: {N}
- Files examined: {N}
- Key areas scanned: {list}
```

---

## Dimension Scope Cards

Each subagent receives exactly one scope card.

### Dimension A: Security & Configuration

```
Scope: Code-level security vulnerability patterns and configuration hygiene.
Scan for:
- SQL/NoSQL injection via string concatenation or interpolation
- Cross-site scripting (XSS) in templated/rendered output
- Server-side request forgery (SSRF) — user-controlled URLs in fetch/HTTP clients
- Command injection — unsanitized input in shell/process execution
- Path traversal — user input in file system paths without canonicalization
- Insecure direct object references (IDOR) & broken access control on endpoints
- Hardcoded secrets, API keys, passwords, or tokens in source code or git history
- .env.template completeness — every env var referenced in code is documented
- Startup validation — app fails fast on missing required config (no silent defaults)
Load: security-principles.md, configuration-management-principles.md, code-review skill (languages/{lang}.md for security anti-patterns)
Output: .agentwork/findings-audit-sec-cfg.md
```

### Dimension B: Reliability & Error Handling

```
Scope: Robustness, failure modes, resource hygiene, and error management.
Scan for:
- Swallowed errors or empty catch blocks (zero-tolerance policy)
- Missing error checks on I/O operations (database, network, file system)
- Resource leaks — unclosed database connections, open files, network sockets, or unlocked locks
- Missing timeouts on outbound HTTP/RPC calls and external service integrations
- Graceful degradation and fallback patterns for external service outages
- Failure recovery & cleanup in try/finally or defer blocks
Load: error-handling-principles.md, resources-and-memory-management-principles.md
Output: .agentwork/findings-audit-reliability.md
```

### Dimension C: Testability & Architecture

```
Scope: Structural decoupling, business logic purity, and architectural boundaries.
Scan for:
- I/O operations not abstracted behind interfaces/contracts (Rule 1: I/O Isolation)
- Business logic containing side effects or I/O calls instead of pure logic (Rule 2: Pure Business Logic)
- Dependency direction violations — inner layers importing outer infrastructure (Rule 3: Dependency Direction)
- Hardcoded dependencies instead of dependency injection (wired at entry point)
- Circular dependencies between feature modules
- Cross-module boundary violations — importing internal files instead of public API
Load: architectural-pattern.md, code-organization-principles.md, testability-patterns skill
Output: .agentwork/findings-audit-architecture.md
```

### Dimension D: Observability & Logging

```
Scope: System transparency, operation entry point logging, and structured diagnostics.
Scan for:
- Unlogged operation entry points (API endpoints, background jobs, CLI commands, queue consumers, DB transactions)
- Missing 3 mandatory log points per operation: start (with context), success (duration/result), failure (full error details)
- Missing context in log calls (correlationId, userId, operation name, duration)
- Unstructured logging or string concatenation in log calls instead of key-value pairs
- Incorrect log levels (e.g., ERROR for expected validation failures, DEBUG for production errors)
- Sensitive data, passwords, or PII unscrubbed in log output
Load: logging-and-observability-mandate.md, logging-implementation skill
Output: .agentwork/findings-audit-observability.md
```

### Dimension E: Code Quality & Patterns

```
Scope: Maintainability, function focus, naming clarity, and codebase pattern consistency.
Scan for:
- Single responsibility violations — functions doing multiple things ("and" signal)
- Excessively long or complex functions (>50 lines, cyclomatic complexity > 10)
- Duplicated logic violating DRY threshold (3+ identical or near-identical instances)
- Inconsistent coding patterns across modules (<80% consistency signal)
- Unclear variable, parameter, function, or class names that do not reveal intent
- Dead code, unreachable branches, or unused private helpers
Load: core-design-principles.md, code-organization-principles.md, code-review skill (languages/{lang}.md for quality anti-patterns)
Output: .agentwork/findings-audit-code-quality.md
```

### Dimension F: Integration Contracts & Database

```
Scope: Cross-boundary interface alignment, database schema integrity, and query performance.
Scan for:
- Unmapped backend endpoints (route + method) against frontend API client adapters
- Request/response field name, type, or status code mismatches across boundaries
- Missing auth token forwarding in frontend API adapters for protected backend endpoints
- Direct fetch/axios calls bypassing centralized HTTP client
- Database table schema hygiene — missing base columns (id, created_at, updated_at), unindexed foreign keys
- Supabase/Postgres RLS policies missing on tables containing user data
- Application model/struct field drift against actual database column schemas
- Irreversible migrations or violations of additive-first migration strategy
- N+1 query patterns in data access layers and ORM queries
- Mobile ↔ Backend compatibility — missing endpoints, unhandled auth token expiry, unhandled offline sync
Load: api-design-principles.md, database-design-principles.md
Output: .agentwork/findings-audit-integration-db.md
```

### Dimension G: Dependencies & Test Coverage Gaps

```
Scope: Dependency security/health and test suite completeness.
Scan for:
- Unused top-level dependencies in package manifests (package.json, go.mod, Cargo.toml, pyproject.toml)
- Unpinned or floating dependency versions in production manifests
- Missing or uncommitted lock files (package-lock.json, go.sum, Cargo.lock)
- Known CVE vulnerabilities in dependencies (scanned via automated tooling or lock file inspection)
- Missing handler/controller unit tests for API endpoints
- Missing integration tests for database/storage adapters and I/O implementations
- Unexercised error paths — catch blocks, error return paths lacking test coverage
- Missing E2E tests for primary user journeys
Load: dependency-management-principles.md, testing-strategy skill
Output: .agentwork/findings-audit-deps-tests.md
```
