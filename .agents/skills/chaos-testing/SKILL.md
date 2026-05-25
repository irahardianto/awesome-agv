---
name: chaos-testing
description: >-
  Controlled failure injection: hypothesis design, blast radius control,
  safety mechanisms, game day planning, and resilience verification.
---

# Chaos Testing Principles

Controlled failure injection to build confidence in system resilience.

## When to Invoke
- Verifying system resilience before production deployment
- Designing game day exercises
- Testing circuit breakers, retries, and failover
- Validating disaster recovery plans

## Methodology

### 1. Define Steady State
Identify measurable indicators of normal system behavior:
- Request success rate ≥ 99.9%
- P99 latency < 500ms
- Error rate < 0.1%

### 2. Form Hypothesis
"When [failure condition], the system will [expected behavior] because [mechanism]."

Example: "When database primary fails, the system will failover to replica within 30s because of automatic failover configuration."

### 3. Design Experiment

| Element | Description |
|---|---|
| **Target** | Which component to perturb |
| **Failure mode** | What kind of failure (latency, crash, partition) |
| **Blast radius** | Scope of impact (single instance, AZ, region) |
| **Duration** | How long the failure persists |
| **Abort criteria** | When to immediately stop the experiment |
| **Rollback plan** | How to restore normal operation |

### 4. Execute
- Start with smallest blast radius
- Monitor continuously during experiment
- Have rollback ready at all times
- Stop immediately if abort criteria met

### 5. Analyze & Learn
- Did system behave as hypothesized?
- What broke unexpectedly?
- What recovery mechanisms worked/failed?
- Document findings and action items

## Failure Injection Types

| Type | Examples |
|---|---|
| **Process** | Kill process, OOM, CPU spike |
| **Network** | Latency injection, packet loss, partition |
| **Infrastructure** | Instance termination, AZ failure, disk full |
| **Application** | Exception injection, slow dependency, config error |
| **Data** | Corrupt cache, stale data, schema mismatch |

## Safety Mechanisms (Non-Negotiable)

1. **Abort button** — immediate experiment termination capability
2. **Blast radius limits** — never affect >5% of production traffic initially
3. **Time-boxed** — experiments have maximum duration
4. **Monitoring** — real-time dashboards during experiments
5. **Business hours only** — no chaos experiments during peak or off-hours
6. **Stakeholder communication** — relevant teams informed before experiments

## Game Day Planning

### Checklist
- [ ] Hypothesis documented
- [ ] Blast radius defined and limited
- [ ] Abort criteria specified
- [ ] Rollback plan verified
- [ ] Monitoring dashboards ready
- [ ] Communication channel open
- [ ] All participants briefed
- [ ] No conflicting deployments scheduled

## Related
- Monitoring and Alerting Principles @.agents/rules/monitoring-and-alerting-principles.md
- Incident Response @.agents/skills/incident-response/SKILL.md
- Error Handling Principles .agents/rules/error-handling-principles.md
