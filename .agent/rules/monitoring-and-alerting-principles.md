---
trigger: model_decision
description: When implementing health checks, metrics instrumentation, error tracking integration, or production observability code
---

## Monitoring and Alerting Principles

> **Scope:** This rule covers what the agent **implements in code**. Organizational 
> concerns (SLO/SLI definitions, on-call rotation, alert escalation) are out of scope —
> those are team/org decisions, not code generation concerns.

### Health Checks

**Every service must expose health check endpoints:**

- **`/health` (Liveness)** — "Is the process alive?"
  - Returns 200 if the process is running
  - No dependency checks (database, cache, etc.)
  - Used by orchestrators to decide whether to restart

- **`/ready` (Readiness)** — "Can the service accept traffic?"
  - Checks all critical dependencies (database, cache, message queue)
  - Returns 503 if any dependency is unavailable
  - Used by load balancers to route traffic

**Rules:**
- Health checks must be fast (< 1 second)
- Health checks must not have side effects
- Separate liveness from readiness — they serve different purposes

### Metrics Instrumentation

**Instrument code using the RED method for services:**
- **Rate** — requests per second
- **Errors** — error count/rate
- **Duration** — request latency (use histograms, not averages)

**Instrument code using the USE method for resources:**
- **Utilization** — how much of the resource is used
- **Saturation** — how much work is queued
- **Errors** — error count for the resource

**Rules:**
- Use counters for things that only go up (requests, errors)
- Use gauges for things that go up and down (connections, queue depth)
- Use histograms for distributions (latency, response size)
- Label metrics consistently (service, method, status_code)
- Don't create high-cardinality labels (no user IDs as labels)

### Error Tracking Integration

- **Capture unhandled exceptions** with full stack traces
- **Include context** — user ID, request ID, correlation ID
- **Group errors** by root cause, not by instance
- **Set severity levels** based on user impact

### Graceful Degradation

- **Circuit breakers** for external dependencies — stop calling failing services
- **Fallbacks** for non-critical features — serve cached data, show reduced UI
- **Timeouts** on all external calls — never wait indefinitely
- **Retry with backoff** for transient failures — exponential backoff with jitter

### Implementation Notes

This rule is tool-agnostic. Whether the project uses Datadog, LGTM stack, Sentry,
New Relic, or CloudWatch — the code patterns (health checks, metrics, error tracking)
are the same. The specific client library belongs in project-level configuration.

### Monitoring Checklist

- [ ] Health check endpoints implemented (/health and /ready)?
- [ ] Liveness probe has no dependency checks?
- [ ] Readiness probe checks all critical dependencies?
- [ ] Key operations instrumented with RED/USE metrics?
- [ ] No high-cardinality metric labels?
- [ ] Unhandled exceptions captured with context?
- [ ] Circuit breakers on external dependencies?
- [ ] Timeouts on all external calls?

### Related Principles
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
