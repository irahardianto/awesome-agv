---
trigger: model_decision
description: When writing Go code, reviewing Go idioms, or working on a Go backend project
---

## Go Idioms and Patterns

### Core Philosophy

Go favors simplicity, explicitness, and readability. The language is intentionally small — resist the urge to import patterns from other languages. If it looks boring and obvious, it's probably idiomatic Go.

> **Scope:** This file covers Go-specific *coding idioms*. For file layout, see `project-structure-go-backend.md`. For test naming conventions, see `testing-strategy.md`. For logging library choice, see `logging-and-observability-principles.md`.

---

### Error Handling

1. **Always return errors — never panic in library or business code**
   - `panic` is reserved for truly unrecoverable states (programmer errors, nil dereference)
   - Use `recover` only at top-level goroutine boundaries (middleware, server startup)

2. **Wrap errors with context using `%w`**
   ```go
   // ✅ Preserves the error chain for errors.Is / errors.As
   return fmt.Errorf("creating task for user %s: %w", userID, err)

   // ❌ Loses the error chain
   return fmt.Errorf("creating task: %v", err)
   ```

3. **Use sentinel errors for expected branch conditions**
   ```go
   // Define in errors.go
   var ErrNotFound = errors.New("not found")
   var ErrUnauthorized = errors.New("unauthorized")

   // Caller checks with errors.Is
   if errors.Is(err, ErrNotFound) {
       // handle
   }
   ```

4. **Use typed errors for rich domain errors**
   ```go
   type ValidationError struct {
       Field   string
       Message string
   }
   func (e *ValidationError) Error() string {
       return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
   }

   // Caller unwraps with errors.As
   var ve *ValidationError
   if errors.As(err, &ve) {
       // access ve.Field, ve.Message
   }
   ```

5. **Handle errors at the right level** — propagate upward until you have enough context to act on them; don't swallow or re-wrap the same error twice.

---

### Interfaces

1. **Keep interfaces small — one or two methods is ideal**
   ```go
   // ✅ Focused, composable
   type Reader interface { Read(p []byte) (n int, err error) }
   type Writer interface { Write(p []byte) (n int, err error) }

   // ❌ Monolithic
   type FileManager interface {
       Read(...); Write(...); Delete(...); List(...); Stat(...)
   }
   ```

2. **"Accept interfaces, return structs"**
   - Function parameters: accept interfaces for flexibility and testability
   - Return values: return concrete structs so callers can access all methods

3. **Define interfaces where they are *used*, not where they are *implemented***
   ```go
   // ✅ Defined in the consumer package (task feature)
   // task/storage.go
   type Storage interface {
       GetByID(ctx context.Context, id string) (*Task, error)
   }

   // postgres.go implements Storage — it does NOT define it
   ```

4. **Implicit satisfaction is a feature — don't use embedding to "implement" interfaces**
   - Any type with the right method set satisfies an interface automatically
   - No `implements` keyword needed or wanted

---

### Goroutines and Channels

> For general concurrency principles (race conditions, deadlocks, message passing), see `concurrency-and-threading-principles.md`. This section covers Go-specific mechanics.

1. **Always pass `context.Context` as the first parameter**
   ```go
   // ✅
   func (s *Service) GetTask(ctx context.Context, id string) (*Task, error)

   // ❌ — no way to cancel or propagate deadlines
   func (s *Service) GetTask(id string) (*Task, error)
   ```

2. **Never start a goroutine without knowing how it will stop**
   ```go
   // ✅ Goroutine is bounded by context cancellation
   go func() {
       for {
           select {
           case <-ctx.Done():
               return
           case item := <-ch:
               process(item)
           }
       }
   }()
   ```

3. **Use `errgroup` for concurrent fan-out with error collection**
   ```go
   g, ctx := errgroup.WithContext(ctx)
   g.Go(func() error { return fetchUsers(ctx) })
   g.Go(func() error { return fetchOrders(ctx) })
   if err := g.Wait(); err != nil { ... }
   ```

4. **Prefer channels for ownership transfer; mutexes for shared state**
   - Channel: "I'm handing this data to you"
   - Mutex: "We're both reading/writing this shared thing"

5. **Close channels from the sender, never the receiver**

---

### Naming Conventions

1. **Receiver names: short, consistent, and the first letter of the type**
   ```go
   func (s *Service) Create(...) {}   // ✅
   func (svc *Service) Create(...) {} // ❌ — too verbose
   func (self *Service) Create(...) {} // ❌ — not Go
   ```

2. **Package names: short, lowercase, no underscores, no plurals**
   ```go
   package task   // ✅
   package tasks  // ❌ plural
   package task_service // ❌ underscore
   ```

3. **Acronyms follow Go conventions (all caps or all lowercase)**
   ```go
   userID   // ✅
   userId   // ❌
   HTTPClient // ✅
   HttpClient // ❌
   ```

4. **Unexported identifiers omit the type name** — if it's private, keep it terse

5. **Don't stutter** — `task.Task` is fine; `task.TaskService` is not

---

### Idiomatic Patterns

1. **Functional options for optional configuration**
   ```go
   type Option func(*Service)

   func WithTimeout(d time.Duration) Option {
       return func(s *Service) { s.timeout = d }
   }

   func NewService(store Storage, opts ...Option) *Service {
       s := &Service{store: store, timeout: 30 * time.Second}
       for _, o := range opts { o(s) }
       return s
   }
   ```

2. **`defer` for cleanup — always pair resource acquisition with defer**
   ```go
   rows, err := db.QueryContext(ctx, query)
   if err != nil { return err }
   defer rows.Close()
   ```

3. **Avoid `init()` functions** — they run implicitly and make testing harder; prefer explicit initialization in `main` or constructors

4. **Prefer `struct` embedding over inheritance for code reuse**, but only when the embedded type truly represents an "is-a" relationship

5. **Use named return values only for documentation or `defer`-based cleanup** — never rely on naked returns in non-trivial functions

---

### Testing

> Test file naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Go-specific tooling only.

1. **Table-driven tests are the default pattern**
   ```go
   func TestCalculateDiscount(t *testing.T) {
       tests := []struct {
           name     string
           input    float64
           expected float64
           wantErr  bool
       }{
           {"zero items", 0, 0, false},
           {"negative input", -1, 0, true},
       }
       for _, tt := range tests {
           t.Run(tt.name, func(t *testing.T) {
               got, err := calculateDiscount(tt.input)
               if tt.wantErr {
                   require.Error(t, err)
                   return
               }
               require.NoError(t, err)
               assert.Equal(t, tt.expected, got)
           })
       }
   }
   ```

2. **Use `testify` for assertions** (`require` for fatal assertions, `assert` for non-fatal)

3. **Run with the race detector in CI** — `go test -race ./...`

4. **Use `httptest.NewRecorder()` for HTTP handler tests** — no live server needed

5. **Test behaviour, not implementation** — assert on outputs and side effects, not internal field values

---

### Formatting and Static Analysis

All of the following **must pass with zero warnings/errors** before any commit. See `code-completion-mandate.md` for the full checklist.

| Tool                    | Purpose                  | Command              |
| ----------------------- | ------------------------ | -------------------- |
| `gofumpt` / `goimports` | Canonical formatting     | `gofumpt -l -w .`    |
| `go vet`                | Correctness checks       | `go vet ./...`       |
| `staticcheck`           | Advanced static analysis | `staticcheck ./...`  |
| `gosec`                 | Security scanning        | `gosec -quiet ./...` |
| `golangci-lint`         | Aggregated linter (CI)   | `golangci-lint run`  |
| `govulncheck`           | Dependency CVE scanning  | `govulncheck ./...`  |

- Never disable a linter without a comment explaining why
- `//nolint:errcheck` is acceptable only with a `// NOLINT:` rationale comment
- Fast iteration during development: `go vet ./...` type-checks and catches correctness issues without producing binaries (analogous to `cargo check`) — reserve `golangci-lint` for pre-commit

> **Logging:** Never use `fmt.Println` or `log.Printf` in production service code — these produce unstructured output. Use `log/slog` (stdlib, Go 1.21+) or the project's chosen adapter. See `logging-and-observability-principles.md` for the required library and patterns.

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- Project Structure — Go Backend @project-structure-go-backend.md
- Testing Strategy @testing-strategy.md
- Error Handling Principles @error-handling-principles.md
- Concurrency and Threading Principles @concurrency-and-threading-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Dependency Management Principles @dependency-management-principles.md
