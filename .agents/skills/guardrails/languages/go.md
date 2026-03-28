# Go Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Go.

---

## Resource Cleanup

- [ ] **No bare `defer X.Close()`** — all deferred closers use error-checked closures with `slog`
- [ ] **No `//nolint:errcheck`** directives anywhere in new code
- [ ] **Transaction rollbacks** check for `sql.ErrTxDone` before logging
- [ ] **HTTP response bodies** are drained (`io.Copy(io.Discard, ...)`) before closing

### Correct Patterns

```go
// ✅ Row/statement/connection Close
defer func() {
    if err := rows.Close(); err != nil {
        slog.Warn("failed to close rows", "error", err, "operation", "<operation>")
    }
}()

// ✅ Transaction Rollback
defer func() {
    if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
        slog.Error("failed to rollback transaction", "error", err, "operation", "<operation>")
    }
}()

// ✅ HTTP Response Body
defer func() {
    if _, err := io.Copy(io.Discard, resp.Body); err != nil {
        slog.Warn("failed to drain response body", "error", err)
    }
    if err := resp.Body.Close(); err != nil {
        slog.Warn("failed to close response body", "error", err)
    }
}()
```

---

## Logging

- [ ] **No `fmt.Printf` / `fmt.Println` / `log.Printf`** — only `slog` in production code
- [ ] All log calls use **structured key-value pairs** (no `fmt.Sprintf` inside log messages)
- [ ] Error logs include `"error", err` as a key-value pair

---

## Error Handling

- [ ] All errors are wrapped with context using `%w`: `fmt.Errorf("doing X: %w", err)`
- [ ] No duplicate wrapping of the same error
- [ ] Sentinel errors used for expected conditions (`ErrNotFound`, `ErrUnauthorized`)

---

## Static Analysis

- [ ] `go vet ./...` passes with zero issues
- [ ] No new `//nolint:` directives without a `// NOLINT:` rationale comment
- [ ] `//nolint:errcheck` specifically is **never** used — handle the error instead

---

## References
- Go Idioms and Patterns @go-idioms-and-patterns.md (§ Idiomatic Patterns, § Formatting and Static Analysis)
- Logging and Observability Principles @logging-and-observability-principles.md (§ Go/slog)
- Error Handling Principles @error-handling-principles.md (§ Resource Cleanup)
