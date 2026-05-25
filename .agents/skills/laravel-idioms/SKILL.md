---
paths:
  - "**/artisan"
  - "**/app/Http/**/*.php"
  - "**/app/Models/**/*.php"
---

## Laravel Idioms and Patterns

Laravel rewards convention, Eloquent, and expressive syntax. Idiomatic Laravel = DRY, service-oriented, well-tested.

> Scope: Laravel-specific patterns. For PHP: `@.agents/skills/php-idioms/SKILL.md`.

### Eloquent

1. **Scopes for reusable queries:**
   ```php
   class Task extends Model {
       public function scopeActive(Builder $query): Builder {
           return $query->where('status', 'active');
       }
   }
   // Usage: Task::active()->paginate(25);
   ```

2. **Eager loading** to avoid N+1: `Task::with('user', 'tags')->get()`.
3. **Accessors/Mutators** with `Attribute` cast (Laravel 9+).

### Service Layer

1. **Services for business logic** — controllers stay thin:
   ```php
   class TaskService {
       public function __construct(
           private readonly TaskRepository $repository,
       ) {}

       public function create(CreateTaskRequest $request): Task { ... }
   }
   ```

### Validation

1. **Form Requests for validation** — never validate in controllers:
   ```php
   class CreateTaskRequest extends FormRequest {
       public function rules(): array {
           return [
               'title' => ['required', 'string', 'max:200'],
               'priority' => ['required', Rule::enum(Priority::class)],
           ];
       }
   }
   ```

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **Pest (preferred) or PHPUnit:**
   ```php
   test('creating a task returns 201', function () {
       $response = $this->postJson('/api/tasks', ['title' => 'Test', 'priority' => 'high']);
       $response->assertCreated();
       $this->assertDatabaseHas('tasks', ['title' => 'Test']);
   });
   ```

2. **Factories** for test data. **RefreshDatabase** trait for isolation.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Laravel Pint | Formatting | `./vendor/bin/pint` |
| PHPStan + Larastan | Static analysis | `phpstan analyse` |
| `composer audit` | CVE scanning | `composer audit` |

### Related
- PHP Idioms @.agents/skills/php-idioms/SKILL.md
- Database Design Principles @.agents/rules/database-design-principles.md
