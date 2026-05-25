# Ruby Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of Ruby code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `eval` / `instance_eval` with user input | Critical | `[SEC]` | Refactor to avoid dynamic code execution |
| `send` / `public_send` with user-controlled method name | Critical | `[SEC]` | Whitelist allowed methods |
| String interpolation in SQL (`"WHERE id = #{id}"`) | Critical | `[SEC]` | Use parameterized queries or ActiveRecord sanitize |
| `rescue => e` (bare rescue) swallowing all errors | Critical | `[ERR]` | Rescue specific exceptions |
| `rescue Exception` (catches `SignalException`, `SystemExit`) | Critical | `[ERR]` | Rescue `StandardError` (default) or specific types |
| `puts` / `p` / `pp` in production code | Major | `[OBS]` | Use Rails logger or structured logging |
| `system()` / backticks with user input | Critical | `[SEC]` | Use `Open3.capture3` with array args |
| Mutable constant (`CONST = []` then `CONST << x`) | Major | `[ERR]` | Freeze constants: `CONST = [].freeze` |
| `class_variable` (`@@var`) usage | Major | `[ARCH]` | Use instance variables on the class or configuration object |
| Missing `freeze` on string constants | Major | `[PAT]` | Add `# frozen_string_literal: true` magic comment |
| N+1 query (ActiveRecord loop) | Major | `[PAT]` | Use `.includes()` or `.preload()` |
| `return nil` / implicit nil return | Major | `[ERR]` | Return explicit value or raise exception |
| Monkey-patching core classes | Major | `[ARCH]` | Use Refinements or dedicated utility class |
| `sleep` in tests | Major | `[PAT]` | Use `travel_to` / `freeze_time` for time-dependent tests |

---

## Detection Commands

```bash
# eval usage
grep -rn '\beval\b' --include='*.rb' | grep -v 'test\|spec\|#'

# send with variable
grep -rn '\.send(\|public_send(' --include='*.rb' | grep -v 'test\|spec'

# SQL interpolation
grep -rn 'where.*#{' --include='*.rb' | grep -v 'test\|spec'

# Bare rescue
grep -rn 'rescue\s*$\|rescue\s*=>' --include='*.rb' | grep -v 'test\|spec'

# rescue Exception
grep -rn 'rescue Exception' --include='*.rb'

# puts/p/pp in production
grep -rn '^\s*puts \|^\s*p \|^\s*pp ' --include='*.rb' | grep -v 'test\|spec'

# system/backticks
grep -rn '`.*\|system(' --include='*.rb' | grep -v 'test\|spec'

# Mutable constants
grep -rn '^\s*[A-Z_]* = \[\]\|^\s*[A-Z_]* = {}' --include='*.rb' | grep -v 'freeze'

# N+1 (ActiveRecord loop)
grep -rn '\.each\|\.map' --include='*.rb' -A2 | grep '\.\(name\|title\|email\|user\)'

# Missing frozen_string_literal
find . -name '*.rb' -exec grep -L 'frozen_string_literal' {} \; | grep -v 'vendor\|spec'
```

---

## Correct Patterns (Reference)

### Error Handling

```ruby
# ❌ Rescues everything including SignalException
begin
  process_task(task)
rescue Exception => e
  # Catches Ctrl+C, kill signals — bad!
end

# ❌ Bare rescue — only catches StandardError but silent
begin
  process_task(task)
rescue
end

# ✅ Specific exception with handling
begin
  process_task(task)
rescue TaskNotFoundError => e
  logger.warn("Task not found", task_id: e.task_id)
  raise
rescue ActiveRecord::RecordInvalid => e
  logger.error("Validation failed", errors: e.record.errors.full_messages)
  raise ServiceError, "Task creation failed"
end
```

### SQL Safety

```ruby
# ❌ SQL injection
Task.where("user_id = '#{params[:user_id]}'")

# ✅ Parameterized
Task.where(user_id: params[:user_id])

# ✅ Or with sanitize
Task.where("user_id = ?", params[:user_id])
```

### Immutable Constants

```ruby
# ❌ Mutable constant — other code can modify
ALLOWED_STATUSES = ['active', 'pending', 'done']
ALLOWED_STATUSES << 'cancelled'  # Mutates the constant!

# ✅ Frozen
ALLOWED_STATUSES = ['active', 'pending', 'done'].freeze
```

### N+1 Prevention

```ruby
# ❌ N+1 — each task.user fires a query
tasks = Task.all
tasks.each { |t| puts t.user.name }

# ✅ Eager load
tasks = Task.includes(:user).all
tasks.each { |t| puts t.user.name }  # No extra queries
```

---

## References
- Ruby Idioms @.agents/skills/ruby-idioms/SKILL.md
- Rails Idioms @.agents/skills/rails-idioms/SKILL.md
- Security Principles @security-principles.md
- Error Handling Principles @error-handling-principles.md
