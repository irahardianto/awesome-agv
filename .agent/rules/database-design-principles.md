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

---

### Migrations

**Safety Rules:**

- **Never drop columns in production** without a deprecation period
- **Never rename columns directly** — add new, migrate data, drop old
- **Always make migrations reversible** — include both up and down
- **Test migrations on a copy of production data** before applying

**Migration Strategy:**

1. Additive changes first (add column, add table)
2. Backfill data
3. Update application code to use new column
4. Remove old columns/tables in a future migration

---

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

---

### Connection Pool Sizing

**Pool sizing formula (starting point):**

```
pool_size = (num_cores × 2) + effective_disk_spindles
```

For most cloud services: `pool_size = CPU_cores × 2 + 1`

**Rules:**

- Set `min_connections` to avoid cold-start latency (25–50% of max)
- Set `max_connections` to stay well below database connection limit (leave 20% headroom)
- Set `connection_timeout` (fail fast if pool exhausted, typically 5–30 seconds)
- Set `idle_timeout` to periodically recycle connections (typically 10–30 minutes)
- Monitor pool metrics: `pool_size`, `checked_out`, `wait_count`, `wait_duration`

```
# Example: PostgreSQL with max_connections=100
app_instances     = 4
pool_per_instance = 20  # → 80 total, leaving 20 for admin/migrations
max_pool_size     = 20
min_pool_size     = 5
connection_timeout = 5s
idle_timeout       = 900s
```

---

### NoSQL Data Modeling

**Choose the right NoSQL type for the problem:**

| Type        | Use When                                         | Examples                     |
| ----------- | ------------------------------------------------ | ---------------------------- |
| Document    | Hierarchical, schema-flexible data               | MongoDB, Firestore, DynamoDB |
| Key-Value   | Simple cache or session storage                  | Redis, DynamoDB (KV mode)    |
| Wide-Column | Time-series, analytics with known query patterns | Cassandra, Bigtable          |
| Graph       | Relationship-traversal-heavy workloads           | Neo4j, Amazon Neptune        |

**Document Database Rules (MongoDB / Firestore / DynamoDB):**

**Design queries first, schema second** — the opposite of relational design.

1. List all queries the application will run
2. Design document structure to serve those queries with minimal requests
3. Embed related data if read together frequently
4. Reference (normalize) only when data is shared across many documents or unbounded in size

```
# ✅ Embed: Order always needs its items
{
  "_id": "ord-123",
  "customerId": "cus-456",
  "items": [
    { "productId": "prd-789", "qty": 2, "price": 1999 }
  ],
  "total": 3998
}

# ❌ Don't embed: Customer profile is shared and evolves independently
{
  "_id": "ord-123",
  "customer": { /* entire customer document */ }  // leads to duplication
}
```

**Rules:**

- Keep document size bounded — avoid unbounded arrays (use subcollections/separate collections instead)
- Design with the read pattern in mind — denormalize intentionally
- Use atomic operations (transactions where supported) for multi-document consistency
- Set TTL indexes for ephemeral data (sessions, tokens, caches)

**DynamoDB Single-Table Design:**

- One table per application
- Define the **access patterns first** (list all before writing any code)
- Use composite keys: `PK` = entity type + ID, `SK` = sort dimension
- Use sparse GSIs for filtering by non-key attributes

**Wide-Column (Cassandra) Rules:**

- Partition key determines data distribution — choose to spread load evenly
- Avoid hot partitions (time-based IDs with writes concentrated in one partition)
- Design a table per query — multiple tables serving different access patterns is normal
- Use `ALLOW FILTERING` never in production

---

### Database Design Checklist

- [ ] Schema follows naming conventions?
- [ ] All tables have `id`, `created_at`, `updated_at`?
- [ ] Foreign keys have proper constraints and indexes?
- [ ] Queries are parameterized (no SQL injection)?
- [ ] Indexes cover equality, range, and sort columns?
- [ ] Connection pool sized correctly (formula applied)?
- [ ] Migrations are reversible?
- [ ] Transactions are short and not held across I/O?
- [ ] N+1 queries avoided (batch loading or JOIN)?
- [ ] NoSQL schema designed query-first (not model-first)?

---

### Related Principles

- Security Principles @security-principles.md (SQL injection prevention)
- Performance Optimization Principles @performance-optimization-principles.md (query performance)
- Error Handling Principles @error-handling-principles.md (transaction error handling)
