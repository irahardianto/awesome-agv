---
paths:
  - "**/app/**/*.rb"
  - "**/config/routes.rb"
  - "**/Gemfile"
---

## Rails Idioms and Patterns

Rails rewards convention over configuration, Active Record, and RESTful design. Idiomatic Rails = conventional, tested, Hotwire-aware.

> Scope: Rails-specific patterns. For Ruby: `@.agents/skills/ruby-idioms/SKILL.md`.

### Active Record

1. **Scopes for reusable queries:**
   ```ruby
   class Task < ApplicationRecord
     scope :active, -> { where(status: :active) }
     scope :by_priority, -> { order(priority: :desc) }
     scope :created_after, ->(date) { where('created_at > ?', date) }

     # ✅ Chainable
     # Task.active.by_priority.created_after(1.week.ago)
   end
   ```

2. **Validations in models, not controllers:**
   ```ruby
   class Task < ApplicationRecord
     validates :title, presence: true, length: { maximum: 200 }
     validates :priority, inclusion: { in: %w[low medium high] }

     # ✅ Custom validation
     validate :deadline_must_be_in_future, on: :create

     private

     def deadline_must_be_in_future
       return unless deadline.present? && deadline < Time.current
       errors.add(:deadline, 'must be in the future')
     end
   end
   ```

3. **`includes`/`preload`** for eager loading — avoid N+1:
   ```ruby
   # ❌ N+1 — fires a query per task to load user
   Task.all.each { |t| puts t.user.name }

   # ✅ Eager load — 2 queries total
   Task.includes(:user).each { |t| puts t.user.name }

   # ✅ Use Bullet gem to detect N+1 in development
   ```

4. **Callbacks — use sparingly, prefer service objects:**
   ```ruby
   # ❌ Complex callback chains — hard to test and debug
   before_save :normalize_title, :set_defaults, :notify_assignee

   # ✅ Service object — explicit, testable
   class CreateTask
     def call(params)
       task = Task.new(normalize(params))
       task.save!
       NotificationService.notify(task.assignee, task)
       task
     end
   end
   ```

### Controllers

1. **RESTful actions** — only standard 7 actions per controller. Custom actions = new controller:
   ```ruby
   # ❌ Custom action crammed into TasksController
   def complete; end

   # ✅ Dedicated controller
   class TaskCompletionsController < ApplicationController
     def create
       task = Task.find(params[:task_id])
       task.complete!
       redirect_to task
     end
   end
   ```

2. **Strong parameters** — never mass-assign without permit:
   ```ruby
   private

   def task_params
     params.require(:task).permit(:title, :priority, :deadline, :description)
   end
   ```

3. **Service objects** for complex business logic:
   ```ruby
   class TasksController < ApplicationController
     def create
       result = CreateTask.new.call(task_params)
       if result.success?
         redirect_to result.task, notice: 'Task created'
       else
         @task = result.task
         render :new, status: :unprocessable_entity
       end
     end
   end
   ```

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`.

1. **`rescue_from` for controller-level error handling:**
   ```ruby
   class ApplicationController < ActionController::Base
     rescue_from ActiveRecord::RecordNotFound, with: :not_found
     rescue_from ActiveRecord::RecordInvalid, with: :unprocessable

     private

     def not_found(exception)
       render json: { error: exception.message }, status: :not_found
     end

     def unprocessable(exception)
       render json: { errors: exception.record.errors.full_messages },
              status: :unprocessable_entity
     end
   end
   ```

2. **Custom domain errors:**
   ```ruby
   module TaskErrors
     class NotAssignable < StandardError; end
     class DeadlinePassed < StandardError; end
   end
   ```

3. **Never rescue `Exception`** — always rescue `StandardError` or specific subclasses.

### Hotwire (7+)

1. **Turbo Frames** for partial page updates:
   ```erb
   <!-- Wraps content that can be independently loaded/replaced -->
   <%= turbo_frame_tag "task_#{task.id}" do %>
     <%= render task %>
   <% end %>
   ```

2. **Turbo Streams** for real-time updates:
   ```ruby
   # In controller — auto-broadcasts updates
   def create
     @task = Task.create!(task_params)
     respond_to do |format|
       format.turbo_stream
       format.html { redirect_to tasks_path }
     end
   end
   ```

3. **Stimulus** for JavaScript sprinkles — minimal JS.

### Security

> For universal security principles, see `.agents/rules/security-principles.md`.

- **CSRF protection** — enabled by default, never disable
- **Content Security Policy** — configure in `config/initializers/content_security_policy.rb`
- **Parameterized queries** — Active Record handles this, but never use string interpolation in `where`:
  ```ruby
  # ❌ SQL injection risk
  Task.where("title LIKE '%#{params[:q]}%'")

  # ✅ Parameterized
  Task.where("title LIKE ?", "%#{params[:q]}%")
  ```

### Anti-Patterns

- ❌ **Fat models** — extract to service objects / form objects / query objects
- ❌ **Business logic in controllers** — controllers are thin routing layers
- ❌ **Callbacks for complex side effects** — use service objects
- ❌ **`default_scope`** — implicit, surprising, hard to override
- ❌ **`update_attribute` (skips validation)** — use `update!`
- ❌ **`rescue Exception`** — catches everything including `SystemExit`, `Interrupt`
- ❌ **String interpolation in SQL** — SQL injection vector

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **RSpec (preferred):**
   ```ruby
   RSpec.describe TasksController, type: :request do
     describe 'POST /tasks' do
       it 'creates a task with valid params' do
         post tasks_path, params: { task: { title: 'Test', priority: 'high' } }
         expect(response).to have_http_status(:created)
         expect(Task.last.title).to eq('Test')
       end

       it 'returns errors with invalid params' do
         post tasks_path, params: { task: { title: '' } }
         expect(response).to have_http_status(:unprocessable_entity)
       end
     end
   end
   ```

2. **FactoryBot** for test data:
   ```ruby
   FactoryBot.define do
     factory :task do
       title { Faker::Lorem.sentence(word_count: 3) }
       priority { %w[low medium high].sample }
       association :user
     end
   end
   ```

3. **Database Cleaner** for test isolation.
4. **Shoulda Matchers** for model spec shortcuts.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| RuboCop + rubocop-rails | Linting | `rubocop --autocorrect` |
| Brakeman | Security | `brakeman --no-pager` |
| `bundle audit` | CVE scanning | `bundle audit check --update` |
| `rails_best_practices` | Code quality | `rails_best_practices .` |

### Related
- Ruby Idioms @.agents/skills/ruby-idioms/SKILL.md
- Database Design Principles @.agents/rules/database-design-principles.md
- Security Principles @.agents/rules/security-principles.md
- API Design Principles @.agents/rules/api-design-principles.md
