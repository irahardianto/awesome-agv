---
paths:
  - "**/*.rb"
  - "**/Gemfile"
---

## Ruby Idioms and Patterns

Ruby rewards expressiveness, convention, and developer happiness. Modern Ruby (3.x) favors pattern matching, Ractor for concurrency, and strict typing via Sorbet/RBS. Idiomatic Ruby = readable, tested, convention-following.

> Scope: Ruby coding idioms. Test naming: .agents/rules/testing-strategy.md. Logging: `@.agents/skills/logging-implementation/SKILL.md`.

### Modern Ruby Features (3.x)

1. **Pattern matching:**
   ```ruby
   case result
   in { status: :success, data: Task => task }
     render json: task
   in { status: :not_found, id: String => id }
     render json: { error: "Task #{id} not found" }, status: :not_found
   end
   ```

2. **Endless methods for simple accessors:**
   ```ruby
   def full_name = "#{first_name} #{last_name}"
   ```

3. **Data class (3.2+) for immutable value objects:**
   ```ruby
   TaskResult = Data.define(:task, :status)
   result = TaskResult.new(task: task, status: :created)
   ```

### Error Handling

1. **Domain exception hierarchies:**
   ```ruby
   class DomainError < StandardError; end

   class NotFoundError < DomainError
     attr_reader :resource, :resource_id
     def initialize(resource, resource_id)
       @resource = resource
       @resource_id = resource_id
       super("#{resource} '#{resource_id}' not found")
     end
   end
   ```

2. **`rescue` specific exceptions — never bare `rescue`.**

3. **Use `ensure` for cleanup** — equivalent to `finally`.

### Naming

1. **snake_case** for methods, variables, file names.
2. **PascalCase** for classes, modules.
3. **UPPER_SNAKE_CASE** for constants.
4. **`?` suffix** for boolean queries: `active?`, `valid?`.
5. **`!` suffix** for destructive or dangerous methods: `save!`, `delete!`.

### Testing

1. **RSpec (preferred) or Minitest:**
   ```ruby
   RSpec.describe TaskService do
     describe '#create' do
       it 'creates a task with valid attributes' do
         task = service.create(title: 'Test', priority: :high)
         expect(task.title).to eq('Test')
       end

       it 'raises ValidationError for blank title' do
         expect { service.create(title: '', priority: :high) }
           .to raise_error(ValidationError)
       end
     end
   end
   ```

2. **`let` for lazy setup, `before` for eager setup.**

3. **Factory Bot for test data** — never fixtures for complex models.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| RuboCop | Formatting + linting | `rubocop --autocorrect` |
| Sorbet | Type checking | `srb tc` |
| Brakeman | Security scanning | `brakeman --no-pager` |
| `bundle audit` | CVE scanning | `bundle audit check --update` |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
