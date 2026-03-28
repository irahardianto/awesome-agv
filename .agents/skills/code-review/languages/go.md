# Go Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Go code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `defer X.Close()` (bare) | Critical | `[RES]` | Error-checked closure with `slog.Warn` |
| `//nolint:errcheck` | Critical | `[ERR]` | Handle the error — use error-checked closure |
| `defer tx.Rollback()` (bare) | Critical | `[RES]` | Error-checked closure with `sql.ErrTxDone` guard |
| `fmt.Printf` / `fmt.Println` | Major | `[OBS]` | Replace with `slog` structured logging |
| `log.Printf` / `log.Println` | Major | `[OBS]` | Replace with `slog` structured logging |
| `resp.Body.Close()` without drain | Major | `[RES]` | `io.Copy(io.Discard, resp.Body)` then close |
| Empty `if err != nil {}` block | Critical | `[ERR]` | Handle, return, or log the error |
| `_ = someFunc()` (discarded error) | Major | `[ERR]` | Handle the error explicitly |

---

## Detection Commands

Use these grep patterns to scan for anti-patterns before manual review:

```bash
# Bare defer Close/Rollback (no error check)
grep -rn 'defer.*\.Close()' --include='*.go'
grep -rn 'defer.*\.Rollback()' --include='*.go'

# nolint:errcheck suppression
grep -rn 'nolint:errcheck' --include='*.go'

# Unstructured logging in production code
grep -rn 'fmt\.Printf\|fmt\.Println\|log\.Printf\|log\.Println' --include='*.go' | grep -v '_test.go'

# Discarded errors
grep -rn '_ = ' --include='*.go' | grep -v '_test.go'
```

---

## Correct Patterns (Reference)

### Resource Cleanup

```go
// ✅ Rows / Statements / Connections
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

### Structured Logging

```go
// ❌ fmt.Printf("User %s logged in from %s\n", userID, ip)
// ❌ log.Printf("User %s logged in from %s", userID, ip)

// ✅
slog.Info("user login", "userId", userID, "ip", ip)
```

---

## References
- Go Idioms and Patterns @go-idioms-and-patterns.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
