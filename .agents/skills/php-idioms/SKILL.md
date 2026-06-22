---
paths:
  - "**/*.php"
---

## PHP Idioms and Patterns

Modern PHP (8.x) rewards type safety, immutability, and framework-agnostic design. Lean into typed properties, enums, and readonly classes. Idiomatic PHP = strict types, PSR-compliant, well-tested.

> Scope: PHP coding idioms. Test naming: .agents/rules/testing-strategy.md. Logging: `@.agents/skills/logging-implementation/SKILL.md`.

### Modern PHP Features (8.x)

1. **`declare(strict_types=1)` — always, every file.**

2. **Enums for domain constants:**
   ```php
   enum Priority: string {
       case Low = 'low';
       case Medium = 'medium';
       case High = 'high';
   }
   ```

3. **Readonly classes for immutable DTOs:**
   ```php
   readonly class CreateTaskRequest {
       public function __construct(
           public string $title,
           public Priority $priority,
       ) {}
   }
   ```

4. **Named arguments for clarity:**
   ```php
   $task = new Task(title: 'Deploy fix', priority: Priority::High);
   ```

5. **Match expressions over switch:**
   ```php
   $score = match($priority) {
       Priority::Low => 1,
       Priority::Medium => 5,
       Priority::High => 10,
   };
   ```

### Error Handling

1. **Domain exception hierarchies:**
   ```php
   abstract class DomainException extends \RuntimeException {}

   class NotFoundException extends DomainException {
       public function __construct(
           public readonly string $resource,
           public readonly string $resourceId,
       ) {
           parent::__construct("{$resource} '{$resourceId}' not found");
       }
   }
   ```

2. **Never `catch (\Exception)` without re-throw or specific handling.**

3. **Type-safe return types — never mixed without justification.**

### Interfaces and DI

1. **Define interface where consumed, implement where provided:**
   ```php
   // In task feature
   interface TaskStorage {
       public function getById(string $id): Task;
       public function save(Task $task): void;
   }

   // Constructor injection
   class TaskService {
       public function __construct(
           private readonly TaskStorage $storage,
       ) {}
   }
   ```

### Naming (PSR-12)

1. **PascalCase** for classes, interfaces, traits, enums.
2. **camelCase** for methods, properties.
3. **UPPER_SNAKE_CASE** for constants.
4. **PSR-4 autoloading** — namespace = directory path.

### Testing

1. **PHPUnit or Pest:**
   ```php
   test('calculate discount returns zero for no items', function () {
       $result = $this->calculator->calculateDiscount([], $this->coupon);
       expect($result)->toBe(0.0);
   });
   ```

2. **Data providers for parameterized tests.**

3. **Mockery or PHPUnit mocks** — never test implementation details.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| PHP CS Fixer | PSR-12 formatting | `php-cs-fixer fix .` |
| PHPStan (level 9) | Static analysis | `phpstan analyse src/ --level 9` |
| Psalm | Type checking | `psalm --show-info=true` |
| `composer audit` | CVE scanning | `composer audit` |

### Related
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
- Error Handling Principles .agents/rules/error-handling-principles.md
