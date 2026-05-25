---
name: data-engineering
description: >-
  Data pipeline architecture, ETL/ELT patterns, data quality, batch vs stream
  processing, orchestration, and data governance principles.
---

# Data Engineering Principles

Guidelines for building reliable, scalable data pipelines and platforms.

## When to Invoke
- Designing data pipelines (ETL/ELT)
- Evaluating batch vs stream processing
- Data quality and governance requirements
- Data warehouse/lake architecture decisions

## Pipeline Architecture

### Design Principles
1. **Idempotent pipelines** — re-running produces same result. Use upserts, not inserts.
2. **Schema evolution** — handle new fields without breaking consumers.
3. **Exactly-once processing** — deduplication at ingestion, idempotency keys.
4. **Incremental processing** — process only new/changed data, not full reloads.

### Patterns
| Pattern | When to Use |
|---|---|
| **Batch ETL** | Scheduled, high volume, latency-tolerant |
| **Streaming** | Real-time, event-driven, low latency |
| **Lambda** | Both batch and stream (complexity trade-off) |
| **Kappa** | Stream-only, reprocessing via replay |
| **Medallion** | Bronze (raw) → Silver (cleaned) → Gold (curated) |

## Data Quality

### Checks (Non-Negotiable)
- **Completeness** — no unexpected nulls in required fields
- **Uniqueness** — no duplicate records on primary keys
- **Referential integrity** — foreign keys resolve
- **Freshness** — data arrives within SLA window
- **Volume** — row counts within expected range (±threshold)

### Framework
```
Source → Validate (schema, nulls, types) → Transform → Validate (business rules) → Load → Verify (counts, checksums)
```

## Orchestration

| Tool | Strength |
|---|---|
| Apache Airflow | Most mature, Python-native, DAG-based |
| Dagster | Type-safe, asset-oriented, modern |
| Prefect | Pythonic, flow-based, cloud-native |

### Best Practices
- DAGs should be idempotent and retriable
- Separate orchestration from computation
- Use backfill capabilities for historical reprocessing
- Alert on SLA breaches, not just failures

## Data Modeling

| Model | When |
|---|---|
| **Star schema** | Analytics, BI dashboards, simple queries |
| **Data Vault** | Enterprise, auditability, multiple sources |
| **Dimensional** | Aggregated reporting, OLAP |

## Governance
- Data lineage tracked (source → transformation → destination)
- Access controls per dataset/table
- PII identified and masked/encrypted
- Retention policies documented and automated

## Related
- Database Design Principles @.agents/rules/database-design-principles.md
- SQL Idioms @.agents/skills/sql-idioms/SKILL.md
- Logging and Observability Principles @.agents/rules/logging-and-observability-principles.md
