# Ruby Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover Ruby-specific symptoms, debugger tooling, and common Rails errors.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `NoMethodError: undefined method for nil:NilClass` | Trace the nil → find which method returned nil unexpectedly |
| `NameError: uninitialized constant` | Check require/autoload, module nesting, and file naming (Zeitwerk) |
| `LoadError: cannot load such file` | Check `$LOAD_PATH`, Gemfile, and `bundle install` |
| `ActiveRecord::RecordNotFound` | Check `.find` vs `.find_by` — `find` raises, `find_by` returns nil |
| N+1 queries | `bullet` gem or log analysis → add `.includes()` |
| Memory bloat / growing RSS | `memory_profiler` gem or `ObjectSpace.count_objects` |
| `Errno::ECONNREFUSED` | Database/Redis not running or wrong connection config |
| `ArgumentError: wrong number of arguments` | Check method signature — positional vs keyword args changed in Ruby 3 |
| Slow tests | `rspec --profile` → find slowest examples → check factory usage |
| `PG::UniqueViolation` / constraint errors | Race condition → add database constraint + rescue |

---

## Diagnostic Tools

### Debug Gem (Ruby 3.1+)

```ruby
# Built-in debugger (Ruby 3.1+)
require 'debug'

def process_task(task)
  binding.break  # Drops into debugger
  result = compute(task)
  result
end

# Debugger commands:
# n          - next line (step over)
# s          - step into method
# c          - continue
# p expr     - print expression
# info       - show local variables
# bt         - backtrace
# watch expr - break when expression changes
```

```bash
# Run with debugger
ruby -r debug script.rb

# Debug a Rails server
rdbg -c -- bin/rails server

# Debug a specific test
rdbg -c -- bundle exec rspec spec/services/task_service_spec.rb:42
```

### Pry (Interactive Debugging)

```ruby
# Add to Gemfile: gem 'pry-byebug'
require 'pry'

def process_task(task)
  binding.pry  # Interactive REPL at this point
  result = compute(task)
  result
end

# Pry commands:
# next       - step over
# step       - step into
# continue   - continue execution
# whereami   - show current location
# ls         - list methods/variables
# show-source ClassName#method  - view source code
```

### Rails-Specific Diagnostics

```bash
# Query logging — see all SQL queries
RAILS_LOG_LEVEL=debug bin/rails server

# Check routes
bin/rails routes | grep task

# Console with loaded environment
bin/rails console
> Task.where(status: :active).explain  # SQL EXPLAIN
> Task.where(status: :active).to_sql   # Show generated SQL
```

```ruby
# N+1 detection (Bullet gem)
# Gemfile: gem 'bullet', group: :development
# config/environments/development.rb:
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.rails_logger = true
end
```

### Memory Profiling

```ruby
# memory_profiler gem
require 'memory_profiler'

report = MemoryProfiler.report do
  # code to profile
  1000.times { Task.new(title: "test") }
end

report.pretty_print(to_file: 'memory_report.txt')

# ObjectSpace — count live objects by type
ObjectSpace.count_objects
# => {:TOTAL=>50000, :FREE=>5000, :T_OBJECT=>10000, :T_STRING=>20000, ...}

# Trace object allocations
require 'objspace'
ObjectSpace.trace_object_allocations_start
# ... code ...
ObjectSpace.trace_object_allocations_stop
```

---

## Common Ruby Bugs and Fixes

### N+1 Queries

**Symptom:** Page load time grows linearly. Log shows hundreds of SELECT queries.

```ruby
# ❌ N+1 — each iteration fires a query
tasks = Task.all
tasks.each { |t| puts t.user.name }  # N queries for user!

# ✅ Eager loading
tasks = Task.includes(:user).all
tasks.each { |t| puts t.user.name }  # 1 query for users

# ✅ Preload (separate query) vs Includes (LEFT JOIN)
Task.preload(:user)     # Always separate query
Task.eager_load(:user)  # Always LEFT JOIN
Task.includes(:user)    # Rails chooses strategy
```

### Zeitwerk Autoloading (Rails 7+)

**Symptom:** `NameError: uninitialized constant TaskService` despite file existing.

**Diagnosis:**
```bash
# Check autoload paths
bin/rails runner "puts ActiveSupport::Dependencies.autoload_paths"

# Verify file naming matches constant
# TaskService → task_service.rb
# API::V1::TaskController → api/v1/task_controller.rb

# Check for eager load issues
bin/rails zeitwerk:check
```

**Common causes:**
1. **File name doesn't match class name** — `task_service.rb` for `TaskService`.
2. **Module nesting doesn't match directory** — `app/services/api/v1/` for `API::V1::`.
3. **File outside autoload paths** — check `config.autoload_paths`.

### Monkey-Patch Debugging

**Symptom:** Method behaves differently than source code suggests. Mystery behavior.

```ruby
# Find where a method is defined (even if monkey-patched)
Task.instance_method(:process).source_location
# => ["/path/to/some_gem/lib/patches.rb", 42]

# Find all definitions of a method
ObjectSpace.each_object(Module).select { |m| m.instance_methods(false).include?(:process) }
```

### Test Performance

**Symptom:** Test suite takes minutes. Individual tests are slow.

```bash
# Find slowest tests
bundle exec rspec --profile 10

# Check factory usage (factories are often the bottleneck)
# Use build_stubbed instead of create when DB isn't needed
```

```ruby
# ❌ Creates full DB records for every test
let(:task) { create(:task, user: create(:user)) }

# ✅ In-memory stubs when DB not needed
let(:task) { build_stubbed(:task) }
```

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| `source_location` shows unexpected file | +70% confidence in monkey-patch issue |
| Bullet gem flags specific association | +80% confidence in N+1 → fix with includes |
| `zeitwerk:check` fails | +90% confidence in autoloading issue |
| Memory profiler shows specific class growing | +60% confidence in leak source |
| `binding.break` confirms nil at specific line | +50% confidence in root cause |

---

## Related
- Ruby Idioms @.agents/skills/ruby-idioms/SKILL.md
- Rails Idioms @.agents/skills/rails-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Performance Optimization (Ruby uses generic patterns in SKILL.md)
