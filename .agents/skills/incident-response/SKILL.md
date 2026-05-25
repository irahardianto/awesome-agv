---
name: incident-response
description: >-
  Structured incident workflow: severity classification, triage, diagnosis,
  mitigation, postmortem, and prevention. Template-driven with blameless review.
---

# Incident Response

Structured framework for handling production incidents with blameless postmortems.

## When to Invoke
- Production incidents (P0-P3)
- Service degradation or outages
- Post-incident analysis and learning
- Improving incident response processes

## Severity Classification

| Severity | Impact | Response Time | Examples |
|---|---|---|---|
| **P0** | Complete outage, data loss risk | Immediate (< 15 min) | Service down, data corruption |
| **P1** | Major degradation, many users affected | < 30 min | Core feature broken, severe performance |
| **P2** | Partial degradation, some users | < 2 hours | Non-critical feature broken, slow queries |
| **P3** | Minor issue, workaround available | < 1 business day | UI glitch, minor performance |

## Incident Workflow

### 1. Detect & Alert
- Automated monitoring triggers alert
- User reports issue
- On-call engineer acknowledges

### 2. Triage
- Classify severity (P0-P3)
- Assess blast radius (users, services, data)
- Identify incident commander
- Open communication channel

### 3. Diagnose
- Form hypotheses (use `debugging-protocol` skill)
- Collect evidence (logs, traces, metrics)
- Identify root cause
- Document timeline

### 4. Mitigate
- Implement immediate fix (rollback, feature flag, hotfix)
- Verify mitigation effectiveness
- Communicate status to stakeholders
- Continue monitoring

### 5. Resolve
- Confirm service fully recovered
- Close incident
- Schedule postmortem (within 48 hours for P0-P2)

## Postmortem Template

```markdown
# Incident Postmortem: {title}
Date: {date}
Severity: P{0-3}
Duration: {start} → {resolved}
Author: {name}

## Summary
{1-2 sentence impact summary}

## Timeline
| Time | Event |
|---|---|
| HH:MM | {event description} |

## Root Cause
{description with evidence}

## Contributing Factors
- {factor with context}

## What Went Well
- {positive observation}

## What Could Be Improved
- {improvement area}

## Action Items
| Action | Owner | Due Date | Status |
|---|---|---|---|
| {specific action} | @{person} | YYYY-MM-DD | Open |
```

## Principles
- **Blameless** — focus on systems and processes, not individuals
- **Evidence-based** — every claim backed by data (logs, traces, metrics)
- **Action items are SMART** — specific, measurable, assigned, realistic, time-bound
- **Share learnings** — postmortems are public within the organization

## Pre-Mortem Analysis

Proactive failure analysis: imagine the feature has already failed, then work backward to identify why.

### When to Invoke
- After DESIGN phase, before BUILD (in feature pipelines)
- For high-risk features (auth, payments, data migrations, public API changes)
- When requested as standalone risk assessment (Template L)

### Pre-Mortem Protocol

#### Step 1: Assume Failure
The feature has launched and failed catastrophically. Work backward:
- "The auth system was bypassed" — how?
- "Data was corrupted during migration" — what went wrong?
- "The service went down under load" — where was the bottleneck?

#### Step 2: Failure Mode Identification
For each component in the DESIGN output, enumerate:
1. **What could break?** — specific failure scenarios, not vague risks
2. **How likely?** — based on complexity, blast radius, novelty
3. **How severe?** — data loss, security breach, downtime, degraded UX

#### Step 3: Cross-Domain Risk Assessment
Each specialist brings a unique failure lens:

| Agent | Risk Domain | Example Findings |
|-------|------------|-----------------|
| incident-responder | Operational failures, cascade risks, recovery gaps | "No rollback path for schema migration" |
| security-engineer | Threat model, attack vectors, auth bypass | "JWT validation missing on webhook endpoint" |
| performance-engineer | Scalability limits, resource exhaustion | "Unbounded query on user list with no pagination" |
| database-expert | Data integrity, migration reversibility, concurrency | "Non-idempotent migration with no down script" |

Include agents based on feature risk profile:
- **Always**: incident-responder (anchor)
- **Auth/security-sensitive**: + security-engineer
- **High-traffic/scalable**: + performance-engineer
- **Data-heavy/migration**: + database-expert

#### Step 4: Produce Findings

```markdown
# Pre-Mortem: {feature name}
Date: {date}
Analysts: {agent list}

## Risk Assessment Summary
| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| {failure scenario} | Critical/High/Medium/Low | High/Medium/Low | {recommendation} |

## Failure Modes
### {failure scenario title}
- **Trigger**: {what causes this failure}
- **Blast Radius**: {what else breaks}
- **Detection**: {how would we know — monitoring, alerts, logs}
- **Recovery**: {rollback path, data recovery, feature flags}
- **Mitigation**: {what BUILD agents should do to prevent this}

## Monitoring Gaps
- {gap}: {recommendation for devops-engineer}

## Design Revision Recommendations
- {if any DESIGN changes are needed before BUILD proceeds}
```

### Pre-Mortem Decision Flow
- Findings are **advisory** — BUILD proceeds with risk-aware context
- If any finding is **Critical severity + High likelihood** → escalate to user before BUILD
- Monitoring gap findings → forwarded to devops-engineer during or after BUILD
- Design revision recommendations → returned to architect for contract updates before BUILD

## Related
- Debugging Protocol @.agents/skills/debugging-protocol/SKILL.md
- Logging and Observability Principles @.agents/rules/logging-and-observability-principles.md
- Monitoring and Alerting Principles @.agents/rules/monitoring-and-alerting-principles.md
