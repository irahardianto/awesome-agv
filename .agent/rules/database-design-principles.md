---
trigger: model_decision
description: When designing database schemas, writing migrations, creating queries, or working with transaction boundaries
---

## Database Design Principles

### Schema Design

**Normalization:**
- Start with 3NF (Third Normal Form) and denormalize only when measured performance requires it
- Each table should represent a single entity
- Avoid storing derived/calculated data unless caching is explicitly needed

**Naming Conventions:**
- Tables: plural, snake_case (e.g., `users`, `task_assignments`)
- Columns: singular, snake_case (e.g., `created_at`, `user_id`)
- Foreign keys: `{referenced_table_singular}_id` (e.g., `user_id`, `task_id`)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_users_email`)
- Constraints: `{type}_{table}_{columns}` (e.g., `uq_users_email`, `fk_tasks_user_id`)

**Required columns for all tables:**
- `id` — primary key (UUID preferred, auto-increment acceptable)
- `created_at` — timestamp, set on insert, never updated
- `updated_at` — timestamp, updated on every modification

### Migrations

**Safety Rules:**
- **Never drop columns in production** without a deprecation period
- **Never rename columns directly** — add new, migrate data, drop old
- **Always make migrations reversible** — include both up and down
- **Test migrations on a copy of production data** before applying

**Migration Strategy:**
1. Additive changes first (add column, add table)
2. Backfill data
3. Update application code
4. Remove old columns/tables in a future migration

### Queries

**Performance:**
- **Always use parameterized queries** (never string concatenation)
- **Index columns** used in WHERE, JOIN, and ORDER BY clauses
- **Avoid SELECT \*** — specify only needed columns
- **Watch for N+1 queries** — use JOINs or batch loading
- **Set query timeouts** to prevent long-running queries from blocking

**Transactions:**
- Use transactions for operations that modify multiple rows/tables
- Keep transactions as short as possible
- Handle deadlocks with retry logic
- Never hold transactions open during user interaction or external API calls

### Database Design Checklist

- [ ] Schema follows naming conventions?
- [ ] All tables have `id`, `created_at`, `updated_at`?
- [ ] Foreign keys have proper constraints and indexes?
- [ ] Queries are parameterized (no SQL injection)?
- [ ] Indexes exist for frequent query patterns?
- [ ] Migrations are reversible?
- [ ] Transactions are short and focused?
- [ ] N+1 queries avoided?

### Related Principles
- Security Principles @security-principles.md (SQL injection prevention)
- Performance Optimization Principles @performance-optimization-principles.md (query performance)
- Error Handling Principles @error-handling-principles.md (transaction error handling)
