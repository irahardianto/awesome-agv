---
trigger: model_decision
description: When implementing logging, working with loggers, or setting up observability for operations (API handlers, database queries, background jobs, external API calls)
---

## Logging and Observability Principles

> **⚠️ Prerequisite:** All operations MUST be logged per Logging and Observability Mandate @logging-and-observability-mandate.md. This guide provides implementation patterns only.


### Logging Standards

#### Log Levels (Standard Priority)

Use consistent log levels across all services:

| Level     | When to Use                             | Examples                                                 |
| --------- | --------------------------------------- | -------------------------------------------------------- |
| **TRACE** | Extremely detailed diagnostic info      | Function entry/exit, variable states (dev only)          |
| **DEBUG** | Detailed flow for debugging             | Query execution, cache hits/misses, state transitions    |
| **INFO**  | General informational messages          | Request started, task created, user logged in            |
| **WARN**  | Potentially harmful situations          | Deprecated API usage, fallback triggered, retry attempt  |
| **ERROR** | Error events that allow app to continue | Request failed, external API timeout, validation failure |
| **FATAL** | Severe errors causing shutdown          | Database unreachable, critical config missing            |

#### Logging Rules

**1. Every request/operation must log:**
```

// Start of operation
log.Info("creating task",
"correlationId", correlationID,
"userId", userID,
"title", task.Title,
)

// Success
log.Info("task created successfully",
"correlationId", correlationID,
"taskId", task.ID,
"duration", time.Since(start),
)

// Error
log.Error("failed to create task",
"correlationId", correlationID,
"error", err,
"userId", userID,
)

```

**2. Always include context:**
- `correlationId`: Trace requests across services (UUID)
- `userId`: Who triggered the action
- `duration`: Operation timing (milliseconds)
- `error`: Error details (if failed)


**3. Structured logging only** (no string formatting):
```

// ✅ Structured
log.Info("user login", "userId", userID, "ip", clientIP)

// ❌ String formatting
log.Info(fmt.Sprintf("User %s logged in from %s", userID, clientIP))

```

**4. Security - Never log:**
- Passwords or password hashes
- API keys or tokens
- Credit card numbers
- PII in production logs (email/phone only if necessary and sanitized)
- Full request/response bodies (unless DEBUG level in non-prod)

**5. Performance - Never log in hot paths:**
- Inside tight loops
- Per-item processing in batch operations (use summary instead)
- Synchronous logging in latency-critical paths

**Best Practice:** "Use logger middleware redaction (e.g., pino-redact, zap masking) rather than manual string manipulation."

#### Language-Specific Implementations

##### Go (using slog standard library)
```

import "log/slog"

// Configure logger
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
  Level: slog.LevelInfo, // Production default
}))

// Usage
logger.Info("operation started",
  "correlationId", correlationID,
  "userId", userID,
)

logger.Error("operation failed",
  "correlationId", correlationID,
  "error", err,
  "retryCount", retries,
)

```

##### TypeScript/Node.js (using pino)
```

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

logger.info({
  correlationId,
  userId,
  duration: Date.now() - startTime,
}, 'task created successfully');

logger.error({
  correlationId,
  error: err.message,
  stack: err.stack,
}, 'failed to create task');

```

#### Python (using structlog)
```python

import structlog

logger = structlog.get_logger()

logger.info("task_created",
correlation_id=correlation_id,
user_id=user_id,
task_id=task.id,
)

logger.error("task_creation_failed",
correlation_id=correlation_id,
error=str(err),
user_id=user_id,
)

```

#### Log Patterns by Operation Type

##### API Request/Response
```

// Request received
log.Info("request received",
  "method", r.Method,
  "path", r.URL.Path,
  "correlationId", correlationID,
  "userId", userID,
)

// Request completed
log.Info("request completed",
  "correlationId", correlationID,
  "status", statusCode,
  "duration", duration,
)

```

##### Database Operations
```

// Query start (DEBUG level)
log.Debug("executing query",
  "correlationId", correlationID,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

// Query success (DEBUG level)
log.Debug("query completed",
  "correlationId", correlationID,
  "rowsReturned", len(results),
  "duration", duration,
)

// Query error (ERROR level)
log.Error("query failed",
  "correlationId", correlationID,
  "error", err,
  "query", "SELECT * FROM tasks WHERE user_id = $1",
)

```

##### External API Calls
```

// Call start
log.Info("calling external API",
  "correlationId", correlationID,
  "service", "email-provider",
  "endpoint", "/send",
)

// Retry (WARN level)
log.Warn("retrying external API call",
  "correlationId", correlationID,
  "service", "email-provider",
  "attempt", retryCount,
  "error", err,
)

// Circuit breaker open (WARN level)
log.Warn("circuit breaker opened",
  "correlationId", correlationID,
  "service", "email-provider",
  "failureCount", failures,
)

```

##### Background Jobs
```

// Job start
log.Info("job started",
  "jobId", jobID,
  "jobType", "email-digest",
)

// Progress (INFO level - periodic, not per-item)
log.Info("job progress",
  "jobId", jobID,
  "processed", 1000,
  "total", 5000,
  "percentComplete", 20,
)

// Job complete
log.Info("job completed",
  "jobId", jobID,
  "duration", duration,
  "itemsProcessed", count,
)

```

##### Error Scenarios
```

// Recoverable error (ERROR level)
log.Error("validation failed",
  "correlationId", correlationID,
  "userId", userID,
  "error", "invalid email format",
  "input", sanitizedInput, // Sanitized!
)

// Fatal error (FATAL level)
log.Fatal("critical dependency unavailable",
  "error", err,
  "dependency", "database",
  "action", "shutting down",
)

```

#### Environment-Specific Configuration

| Environment     | Level | Format           | Destination             |
| --------------- | ----- | ---------------- | ----------------------- |
| **Development** | DEBUG | Pretty (colored) | Console                 |
| **Staging**     | INFO  | JSON             | Stdout → CloudWatch/GCP |
| **Production**  | INFO  | JSON             | Stdout → CloudWatch/GCP |

**Configuration (Go example):**
```

func configureLogger() *slog.Logger {
var handler slog.Handler

    level := slog.LevelInfo
    if os.Getenv("ENV") == "development" {
        level = slog.LevelDebug
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    } else {
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level: level,
        })
    }
    
    return slog.New(handler)
    }

```

#### Testing Logs

**Unit tests:** Capture and assert on log output
```

// Go example
func TestUserLogin(t *testing.T) {
var buf bytes.Buffer
logger := slog.New(slog.NewJSONHandler(&buf, nil))

    // Test operation
    service := NewUserService(logger, mockStore)
    err := service.Login(ctx, email, password)
    
    // Assert logs
    require.NoError(t, err)
    logs := buf.String()
    assert.Contains(t, logs, "user login successful")
    assert.Contains(t, logs, email)
    }

```

#### Monitoring Integration

**Correlation IDs:**
- Generate at ingress (API gateway, first handler)
- Propagate through all services
- Include in all logs, errors, and traces
- Format: UUID v4

**Log aggregation:**
- Ship to centralized system (CloudWatch, GCP Logs, Datadog)
- Index by: correlationId, userId, level, timestamp
- Alert on ERROR/FATAL patterns
- Dashboard: request rates, error rates, latency

#### Checklist for Every Feature

- [ ] All public operations log INFO on start
- [ ] All operations log INFO/ERROR on complete/failure
- [ ] All logs include correlationId
- [ ] No sensitive data in logs
- [ ] Structured logging (key-value pairs)
- [ ] Appropriate log level used
- [ ] Error logs include error details
- [ ] Performance-critical paths use DEBUG level

### Related Principles
- Logging and Observability Mandate @logging-and-observability-mandate.md
- Monitoring and Alerting Principles @monitoring-and-alerting-principles.md
- Error Handling Principles @error-handling-principles.md
- Security Mandate @security-mandate.md
- Security Principles @security-principles.md
- API Design Principles @api-design-principles.md
