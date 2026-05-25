---
paths:
  - "**/*.sql"
  - "**/migrations/**"
---

## SQL Idioms and Patterns

SQL rewards set-based thinking, explicit joins, and query plan awareness. Idiomatic SQL = readable, performant, migration-safe.

> Scope: SQL coding idioms. For database design principles, load `@.agents/rules/database-design-principles.md`.

### Query Patterns

1. **CTEs over subqueries for readability:**
   ```sql
   -- ✅ CTE — readable, debuggable
   WITH active_tasks AS (
       SELECT id, title, priority, user_id
       FROM tasks
       WHERE status = 'active'
   )
   SELECT u.name, COUNT(at.id) AS task_count
   FROM users u
   JOIN active_tasks at ON u.id = at.user_id
   GROUP BY u.name;

   -- ❌ Nested subquery — hard to read
   SELECT u.name, (SELECT COUNT(*) FROM tasks t WHERE t.user_id = u.id AND t.status = 'active')
   FROM users u;
   ```

2. **Window functions for ranking, running totals:**
   ```sql
   SELECT title, priority,
       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
   FROM tasks;
   ```

3. **Explicit `JOIN` syntax — never implicit joins in `WHERE`.**

4. **Parameterized queries — never string concatenation.** (See .agents/rules/security-mandate.md.)

### Migration Safety

For migration strategy (additive-first, two-phase drops, reversibility), see `@.agents/rules/database-design-principles.md` § Migrations.

1. **Index creation: `CONCURRENTLY`** on PostgreSQL for zero-downtime.
2. **Idempotent DDL** — use `IF NOT EXISTS` for tables/indexes; `DO $$ ... pg_constraint check ... $$` for constraints.

### Index Strategy

1. **Choose the right index type:**
   - B-tree (default): `=`, `<`, `>`, `BETWEEN`, `IN`, `IS NULL`
   - GIN: arrays, JSONB (`@>`), full-text search (`@@`)
   - GiST: geometric data, range types, nearest-neighbor (KNN)
   - BRIN: large time-series tables (10-100x smaller than B-tree)
   - Hash: equality-only (marginally faster than B-tree for `=`)

2. **Composite indexes — column order matters:**
   ```sql
   -- Equality columns first, range columns last (leftmost prefix rule)
   CREATE INDEX idx ON orders (status, created_at);
   -- Works for: WHERE status = 'pending'
   -- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
   -- Does NOT work for: WHERE created_at > '2024-01-01' (alone)
   ```

3. **Partial indexes for filtered queries:**
   ```sql
   -- Index only active rows (5-20x smaller)
   CREATE INDEX idx_users_active_email ON users (email) WHERE deleted_at IS NULL;
   ```

4. **Covering indexes to avoid heap fetches:**
   ```sql
   -- INCLUDE non-searchable columns for index-only scans
   CREATE INDEX idx_orders_status ON orders (status) INCLUDE (customer_id, total);
   ```

5. **Indexes on foreign keys** — always. PostgreSQL does not auto-index FKs.

### Performance

1. **`EXPLAIN (ANALYZE, BUFFERS)`** before optimizing — never guess.
   - Seq Scan on large table = missing index
   - Rows Removed by Filter = poor selectivity
   - `read >> hit` in Buffers = data not cached
   - Sort Method: external merge = `work_mem` too low

2. **Avoid `SELECT *`** — list specific columns.

3. **Keyset pagination** over OFFSET for large datasets:
   ```sql
   -- O(1) regardless of page depth
   SELECT * FROM products WHERE (created_at, id) > ($1, $2)
   ORDER BY created_at, id LIMIT 20;
   ```
   Use `LIMIT/OFFSET` only for small, bounded result sets.

### Concurrency & Locking

1. **Prevent deadlocks — consistent lock ordering:**
   ```sql
   -- Acquire locks in PK order before updating
   SELECT * FROM accounts WHERE id IN (1, 2) ORDER BY id FOR UPDATE;
   ```

2. **SKIP LOCKED for queue processing:**
   ```sql
   -- Workers skip locked rows instead of blocking (10x throughput)
   UPDATE jobs SET status = 'processing'
   WHERE id = (
     SELECT id FROM jobs WHERE status = 'pending'
     ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
   ) RETURNING *;
   ```

3. **Advisory locks for application-level coordination:**
   ```sql
   SELECT pg_advisory_xact_lock(hashtext('daily_report')); -- Released on COMMIT
   ```

4. **`statement_timeout`** — always set per-session to prevent runaway queries.

### Data Operations

1. **UPSERT — atomic insert-or-update (no race conditions):**
   ```sql
   INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
   ON CONFLICT (user_id, key)
   DO UPDATE SET value = EXCLUDED.value, updated_at = now();
   ```

2. **Bulk loading — use `COPY` over batch INSERTs for large imports.**

3. **Batch inserts** — multiple rows per statement, not one INSERT per row.

### Diagnostics

1. **`pg_stat_statements`** — enable to identify top resource-consuming queries by total time and call frequency.

2. **VACUUM/ANALYZE** — run `ANALYZE` after large data changes. Tune `autovacuum_vacuum_scale_factor` for high-churn tables.

### Advanced PostgreSQL

1. **Full-text search:** use `tsvector` + GIN index, not `LIKE '%term%'`.
2. **JSONB indexing:** GIN (`jsonb_path_ops` for `@>` only — 2-3x smaller), expression indexes for key lookups.

### Naming

Follow conventions in `@.agents/rules/database-design-principles.md` § Schema (Naming).

### Anti-Patterns

- ❌ Missing indexes on foreign keys
- ❌ N+1 queries (use `JOIN` or batch)
- ❌ String concatenation in queries (SQL injection risk)
- ❌ Storing comma-separated values in a single column
- ❌ `OFFSET` pagination on large datasets (use keyset)
- ❌ `timestamp` without timezone (use `timestamptz`)
- ❌ `varchar(n)` without reason (use `text`)
- ❌ Random UUID v4 as primary key on large tables (index fragmentation)
- ❌ Check-then-insert pattern (race condition — use UPSERT)

### Related
- Database Design Principles @.agents/rules/database-design-principles.md
- Security Principles .agents/rules/security-principles.md
- Performance Optimization Principles @.agents/rules/performance-optimization-principles.md
