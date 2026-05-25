---
paths:
  - "**/views.py"
  - "**/models.py"
  - "**/urls.py"
  - "**/manage.py"
---

## Django Idioms and Patterns

Django rewards convention, the ORM, and "batteries included" design. Idiomatic Django = DRY, model-centric, well-tested.

> Scope: Django-specific patterns. For Python: `@.agents/rules/python-idioms-and-patterns.md`.

### Models

1. **Fat models, thin views** — business logic in models/managers, not views.
2. **Custom managers for common queries:**
   ```python
   class TaskManager(models.Manager):
       def active(self):
           return self.filter(status='active')

   class Task(models.Model):
       objects = TaskManager()
   ```

3. **`Meta` class** for ordering, constraints, indexes.

### Views

1. **Class-based views for CRUD**, function-based for simple/custom:
   ```python
   class TaskListView(LoginRequiredMixin, ListView):
       model = Task
       queryset = Task.objects.active()
       paginate_by = 25
   ```

2. **DRF serializers for API boundaries:**
   ```python
   class TaskSerializer(serializers.ModelSerializer):
       class Meta:
           model = Task
           fields = ['id', 'title', 'priority', 'created_at']
           read_only_fields = ['id', 'created_at']
   ```

### ORM

1. **`select_related`/`prefetch_related`** to avoid N+1 queries.
2. **`F()` and `Q()` expressions** for complex queries.
3. **Never raw SQL** unless ORM can't express it (and then use parameterized queries).

### Migrations

1. **One migration per logical change.** Squash when history grows.
2. **Data migrations** in separate migration files from schema changes.
3. **`RunPython` with `reverse_code`** for reversibility.

### Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **`pytest-django`** over `unittest.TestCase`:
   ```python
   @pytest.mark.django_db
   def test_create_task():
       task = Task.objects.create(title='Test', priority='high')
       assert task.title == 'Test'
   ```

2. **Factory Boy** for test data (not fixtures).

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| `ruff` | Formatting + linting | `ruff format . && ruff check .` |
| `mypy` + django-stubs | Type checking | `mypy .` |
| `bandit` | Security | `bandit -r .` |

### Related
- Python Idioms @.agents/rules/python-idioms-and-patterns.md
- Database Design Principles @.agents/rules/database-design-principles.md
