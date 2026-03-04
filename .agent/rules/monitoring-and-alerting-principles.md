---
trigger: model_decision
description: When implementing health checks, metrics instrumentation, error tracking integration, or production observability code
version: 1.1.0
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

---

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

**Metric naming convention:**

```
{namespace}_{subsystem}_{name}_{unit}

# Examples
http_requests_total                    # counter
http_request_duration_seconds          # histogram
db_connections_active                  # gauge
cache_hit_ratio                        # gauge
worker_jobs_inflight                   # gauge
```

---

### Error Tracking Integration

- **Capture unhandled exceptions** with full stack traces
- **Include context** — user ID, request ID, correlation ID
- **Group errors** by root cause, not by instance
- **Set severity levels** based on user impact

---

### Graceful Degradation

- **Circuit breakers** for external dependencies — stop calling failing services
- **Fallbacks** for non-critical features — serve cached data, show reduced UI
- **Timeouts** on all external calls — never wait indefinitely
- **Retry with backoff** for transient failures — exponential backoff with jitter

---

### SLO / SLI / Error Budget

**SLI (Service Level Indicator):** A precise, quantitative measure of service behavior.

**SLO (Service Level Objective):** A target value for an SLI.

**Error budget:** How much allowed failure before SLO is breached.

```
error_budget = 1 - SLO_target
# 99.9% SLO → 0.1% error budget → 43.8 min/month of allowed downtime
```

**Defining SLIs — use request-based metrics (preferred over time-based):**

```
# Availability SLI
sli_availability = good_requests / total_requests
# where good = status < 500 and latency < threshold

# Latency SLI
sli_latency = requests_under_threshold / total_requests
# where threshold = your P99 target (e.g., 500ms)
```

**Recommended SLO targets by criticality:**

| Tier                                    | SLO    | Error Budget / Month |
| --------------------------------------- | ------ | -------------------- |
| **Critical** (payments, auth)           | 99.95% | ~22 min              |
| **Standard** (core CRUD, APIs)          | 99.9%  | ~44 min              |
| **Non-critical** (analytics, reporting) | 99.5%  | ~3.6 hours           |

**Error budget policies:**

- If >50% budget consumed in first half of period → slow down risky changes
- If >75% budget consumed → freeze non-critical deployments
- If budget exhausted → freeze all changes, focus on reliability

**Implementing SLO-based alerting (burn rate model):**

```yaml
# Alert when error budget burns at 14× the sustainable rate (1h violation)
# or at 6× for a sustained 6h window
# This catches both fast burns and slow burns

- alert: ErrorBudgetBurnCritical
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[1h]))
      /
      sum(rate(http_requests_total[1h]))
    ) > (14 * 0.001)  # 14× the allowed error rate for 99.9% SLO
  for: 1m
  labels: { severity: critical }

- alert: ErrorBudgetBurnWarning
  expr: |
    (
      sum(rate(http_requests_total{status=~"5.."}[6h]))
      /
      sum(rate(http_requests_total[6h]))
    ) > (6 * 0.001)
  for: 30m
  labels: { severity: warning }
```

---

### Distributed Tracing

**Purpose:** Follow a single request across multiple services to identify latency sources and failure points.

**Implementation rules:**

- Every service must **propagate trace context** using W3C TraceContext headers (`traceparent`, `tracestate`)
- Create a **span** for every significant operation: HTTP request, DB query, cache lookup, external API call
- Add relevant **attributes** to spans: `user.id`, `db.statement` (sanitized), `http.status_code`
- **Never log sensitive data** in span attributes (no passwords, tokens, PII)

```typescript
// Example: OpenTelemetry span instrumentation
const tracer = trace.getTracer("order-service");

async function createOrder(req: CreateOrderRequest) {
  return tracer.startActiveSpan("order.create", async (span) => {
    span.setAttributes({
      "order.customer_id": req.customerId,
      "order.item_count": req.items.length,
    });
    try {
      const result = await db.insertOrder(req);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

**Sampling strategy:**

- Head-based sampling: 100% for error traces, 1–10% for successful traces
- Tail-based sampling (preferred): sample 100% of traces containing errors or high latency
- Never sample below 1% in production — you'll miss infrequent issues

**Span naming conventions:**

```
# Good: verb + resource
"db.query users"
"http.get /api/v1/users/:id"
"cache.get user:123"
"queue.publish order.created"

# Bad: static, generic
"execute"
"process"
"handler"
```

---

### Dashboard Design

**Every production service must have a standard dashboard with these panels:**

1. **Service Health:** Request rate, error rate, latency (P50/P95/P99)
2. **SLO Tracking:** Current SLO compliance %, error budget remaining
3. **Resource Utilization:** CPU, memory, pod count (via USE method)
4. **Dependencies:** Latency and error rate to downstream services
5. **Business Metrics:** Key domain metrics (orders/min, active users, etc.)

**Dashboard rules:**

- Default time window: last 1 hour (not 24h — short windows catch incidents faster)
- Always show P99 latency, not P50 (P50 looks fine even when P99 is broken)
- Group related panels — don't scatter latency, errors, and rate across the dashboard
- Annotate deployments on all time-series graphs (vertical line at deploy time)
- Create a **"first responder" row** — the 3–4 panels an on-call engineer checks first

---

### Runbook Standards

Every alert with `severity: critical` or `severity: warning` MUST link to a runbook. Embed the URL in the alert definition:

```yaml
labels:
  severity: critical
annotations:
  summary: "Auth service error budget burning fast"
  runbook_url: "https://wiki.example.com/runbooks/auth-error-budget-burn"
  description: "Error budget burning at {{ $value | humanizePercentage }} of SLO"
```

**Runbook minimum contents:**

1. **What is happening** — plain English description of the alert condition
2. **Why it matters** — user impact and business consequence
3. **Immediate triage steps** — 3–5 specific commands to diagnose
4. **Escalation path** — who to contact if not resolved in X minutes
5. **Known causes and fixes** — table of symptoms → remediation

---

### Implementation Notes

This rule is tool-agnostic. Whether the project uses Datadog, LGTM stack, Sentry,
New Relic, or CloudWatch — the code patterns (health checks, metrics, error tracking)
are the same. The specific client library belongs in project-level configuration.

---

### Monitoring Checklist

- [ ] Health check endpoints implemented (`/health` and `/ready`)?
- [ ] Liveness probe has no dependency checks?
- [ ] Readiness probe checks all critical dependencies?
- [ ] Key operations instrumented with RED metrics?
- [ ] Metric naming follows `{namespace}_{subsystem}_{name}_{unit}` convention?
- [ ] No high-cardinality metric labels?
- [ ] SLO defined with explicit target and error budget policy?
- [ ] Burn-rate alerting configured (fast-burn 1h + slow-burn 6h windows)?
- [ ] Distributed tracing implemented with W3C trace context propagation?
- [ ] All spans include relevant attributes (no PII)?
- [ ] Standard dashboard with 5 panels deployed per service?
- [ ] Critical alerts have linked runbook URL?
- [ ] Unhandled exceptions captured with context?
- [ ] Circuit breakers on external dependencies?
- [ ] Timeouts on all external calls?

### Related Principles

- Logging and Observability Mandate @logging-and-observability-mandate.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
