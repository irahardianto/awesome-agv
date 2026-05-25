# Ruby Performance Profiling

> **Applicability:** Ruby on Rails applications, Sinatra APIs, CLI tools, and background job processors.

## Profiling Toolchain

| Tool | Purpose | Command |
|---|---|---|
| `rack-mini-profiler` | Per-request profiling in Rails | Gem — shows speed badge on every page |
| `stackprof` | Sampling CPU profiler | `StackProf.run(mode: :cpu) { ... }` |
| `memory_profiler` | Allocation tracking | `MemoryProfiler.report { ... }` |
| `benchmark-ips` | Iterations per second | `Benchmark.ips { |x| x.report(...) }` |
| `bullet` | N+1 detection | Auto-alerts in development |
| `derailed_benchmarks` | Boot time + memory | `bundle exec derailed exec perf:mem` |
| `ruby-prof` | Detailed call tree | `RubyProf.start; ...; result = RubyProf.stop` |
| Rails request logs | Per-request timing | `Completed 200 OK in 45ms (Views: 20ms | DB: 15ms)` |

---

## Optimization Patterns

### Pattern: Eager Loading (ActiveRecord)

**Symptom:** `bullet` gem alerts or Rails log shows many individual SELECT queries.

```ruby
# ❌ N+1 — 1 + N queries
tasks = Task.all
tasks.each { |t| puts t.user.name }  # Query per task!

# ✅ Eager load — 2 queries (tasks + users)
tasks = Task.includes(:user).all

# ✅ Nested eager loading
tasks = Task.includes(comments: :author).all

# ✅ Choose strategy explicitly
Task.preload(:user)     # Separate query (always)
Task.eager_load(:user)  # LEFT JOIN (always)
Task.includes(:user)    # Rails chooses (usually preload)
```

### Pattern: Select Only Needed Columns

**Symptom:** High memory usage. Transferring large text/blob columns when only IDs are needed.

```ruby
# ❌ Fetches all columns including large text fields
tasks = Task.where(status: :active)

# ✅ Select only what's displayed
tasks = Task.where(status: :active).select(:id, :title, :status, :created_at)

# ✅ Pluck for simple value extraction (returns raw arrays, no AR objects)
ids = Task.where(status: :active).pluck(:id)
# Returns [1, 2, 3] — no ActiveRecord overhead
```

### Pattern: Background Jobs for Heavy Work

**Symptom:** Request timeout (>30s). User-facing actions doing email/PDF/image processing.

```ruby
# ❌ Synchronous — user waits
class TasksController < ApplicationController
  def create
    task = Task.create!(task_params)
    TaskMailer.created(task).deliver_now  # Blocks 2-5 seconds
    render json: task, status: :created
  end
end

# ✅ Async — instant response
class TasksController < ApplicationController
  def create
    task = Task.create!(task_params)
    TaskMailer.created(task).deliver_later  # Queued, milliseconds
    render json: task, status: :created
  end
end
```

### Pattern: Caching

**Symptom:** Same expensive queries on every request. View rendering time high.

```ruby
# ✅ Fragment caching (views)
<% cache task do %>
  <%= render task %>
<% end %>

# ✅ Low-level caching (service layer)
def active_tasks(user_id)
  Rails.cache.fetch("user:#{user_id}:active_tasks", expires_in: 5.minutes) do
    Task.where(user_id: user_id, status: :active).includes(:tags).to_a
  end
end

# ✅ Russian doll caching (nested, auto-invalidates)
<% cache [task, task.comments.maximum(:updated_at)] do %>
  <%= render task %>
  <%= render task.comments %>
<% end %>
```

### Pattern: Batch Processing

**Symptom:** Memory grows unbounded when processing large datasets.

```ruby
# ❌ Loads ALL records into memory
Task.all.each { |t| process(t) }  # 1M records = 1M AR objects in memory

# ✅ find_each — loads in batches of 1000 (default)
Task.find_each(batch_size: 1000) { |t| process(t) }

# ✅ find_in_batches — yields array of records
Task.find_in_batches(batch_size: 500) do |batch|
  bulk_api_call(batch.map(&:external_id))
end

# ✅ in_batches — yields ActiveRecord::Relation (for bulk updates)
Task.where(status: :pending).in_batches(of: 1000) do |batch|
  batch.update_all(status: :processing)
end
```

### Pattern: Frozen String Literals

**Symptom:** High string allocation in profiler. Strings created repeatedly for constants.

```ruby
# frozen_string_literal: true

# With magic comment, all string literals are frozen (immutable)
# Reduces allocation — same string object reused

# ❌ Without frozen_string_literal
status = "active"  # New String object every time

# ✅ With frozen_string_literal: true
status = "active"  # Same frozen String object reused
```

---

## Anti-Patterns

1. **Don't load all records for large tables** — use `find_each`, `pluck`, or pagination.
2. **Don't lazy-load in loops** — always `includes` or `preload`.
3. **Don't skip caching for expensive queries** — use `Rails.cache.fetch` with TTL.
4. **Don't process emails/PDFs synchronously** — use `deliver_later` and Sidekiq/GoodJob.
5. **Don't fetch all columns** — `select` or `pluck` when only specific fields needed.
6. **Don't use `Task.count` in loops** — cache the count or use `size` (which uses cached count if loaded).
7. **Don't skip `# frozen_string_literal: true`** — free performance win.

---

## Irreducible Floors

| Component | Floor | Why It Can't Be Reduced |
|---|---|---|
| Rails request boot (after first) | ~2-5ms | Middleware stack traversal |
| ActiveRecord hydration | ~0.1ms per record | Object creation + type casting |
| `pluck` (raw array) | ~0.01ms per row | Minimal overhead |
| Ruby method dispatch | ~50ns | Dynamic dispatch, method cache |
| GC pause (minor) | ~1-5ms | Mark & sweep generational GC |
| GC pause (major) | ~10-50ms | Full heap scan |
| String allocation | ~50ns | Object + memory allocation |
| Redis `GET` (local) | ~0.2ms | Network round trip |
| Sidekiq job dispatch | ~1ms | Serialize + Redis `LPUSH` |

---

## Benchmarking

```ruby
# benchmark-ips gem
require 'benchmark/ips'

Benchmark.ips do |x|
  x.report("includes") { Task.includes(:user).limit(100).to_a }
  x.report("preload")  { Task.preload(:user).limit(100).to_a }
  x.report("pluck")    { Task.limit(100).pluck(:id, :title) }

  x.compare!
end

# stackprof for CPU profiling
require 'stackprof'

StackProf.run(mode: :cpu, out: 'tmp/stackprof-cpu.dump') do
  1000.times { TaskService.new.process_all }
end
# Analyze: stackprof tmp/stackprof-cpu.dump --text
```

```bash
# derailed_benchmarks for boot + memory
bundle exec derailed exec perf:mem_over_time
bundle exec derailed exec perf:objects
```

---

## Related
- Ruby Idioms @.agents/skills/ruby-idioms/SKILL.md
- Rails Idioms @.agents/skills/rails-idioms/SKILL.md
- Performance Optimization SKILL @../SKILL.md
