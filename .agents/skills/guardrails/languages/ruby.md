# Ruby Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Ruby.

---

## Safety

- [ ] **`# frozen_string_literal: true`** at top of every file
- [ ] **Constants frozen** — `CONST = [].freeze`
- [ ] **No `eval` / `instance_eval`** with dynamic input
- [ ] **No `send` with unvalidated method names** — whitelist allowed methods

---

## Error Handling

- [ ] **Rescue specific exceptions** — not bare `rescue` or `rescue Exception`
- [ ] **No silent rescues** — handle, log, or reraise
- [ ] **Custom exception classes** inherit from `StandardError`
- [ ] **`ensure` blocks** for cleanup (file handles, locks)

---

## Ruby Idioms

- [ ] **Guard clauses** for early returns — not nested `if/else`
- [ ] **`each_with_object` / `map`** over manual accumulation
- [ ] **`&:method`** shorthand where applicable
- [ ] **`Hash#fetch`** with defaults — not `hash[:key] || default`
- [ ] **Predicate methods** return boolean, named with `?`

---

## ActiveRecord (when applicable)

- [ ] **`.includes` / `.preload`** for eager loading — no N+1
- [ ] **Parameterized queries** — no string interpolation in `.where`
- [ ] **Scopes** for reusable query conditions
- [ ] **Validations** at model level — not only controller
- [ ] **Migrations reversible** — `change` method or explicit `up`/`down`

---

## Testing

- [ ] **RSpec `describe`/`context`/`it`** structure
- [ ] **`let` / `let!`** for test setup — not instance variables
- [ ] **Factories** (FactoryBot) — not fixtures for complex data
- [ ] **No `sleep` in tests** — use `travel_to` for time-dependent logic

---

## Observability

- [ ] **No `puts` / `p` / `pp`** in production code
- [ ] **Rails logger** or structured logger with tags
- [ ] **Tagged logging** with request ID / user ID

---

## Static Analysis

- [ ] RuboCop passes with zero offenses
- [ ] No `# rubocop:disable` without explanatory comment
- [ ] Sorbet / RBS type checking (if adopted) passes

---

## References
- Ruby Idioms @.agents/skills/ruby-idioms/SKILL.md
- Rails Idioms @.agents/skills/rails-idioms/SKILL.md
- Error Handling Principles @error-handling-principles.md
- Testing Strategy @testing-strategy.md
