---
name: delivery-validation
description: >-
  Shared delivery validation protocol for red team agents. Defines verification
  categories, severity classification, evidence standards, and output format.
  Loaded by @red-team-lead, @delivery-validator, and @integration-prober.
---

# Delivery Validation Protocol

Shared verification protocol for all Gate 2 (Red Team) agents. This skill defines the common standards, severity classification, and evidence requirements that all validators must follow.

## §1. Verification Categories

Delivery validation covers six categories. Each validator owns specific categories based on its domain:

| Category | Owner | Description |
|---|---|---|
| Environment Bootstrap | `@delivery-validator` | Install, setup, config documentation |
| Runtime Boot | `@delivery-validator` | Application starts and responds |
| Core Journey | `@delivery-validator` | Primary user flow works end-to-end |
| Visual & UX | `@ux-craftsman` | UI renders correctly, responsive, accessible |
| Service Integration | `@integration-prober` | External services connected, not mocked |
| Technology Currency | `@delivery-validator` + `@integration-prober` | No deprecated deps, APIs, or models |
| Production Security | `@security-engineer` | CORS, headers, cookie config correct at runtime |
| Deployment Health | `@devops-engineer` | Live service responds after deploy |

## §2. Severity Classification

| Severity | Definition | Gate Impact | Examples |
|---|---|---|---|
| **BLOCKER** | Product doesn't work for the user | Automatic FAIL | App won't start, blank screen, broken auth, missing env config, mock in production |
| **WARNING** | Product works but with notable issues | CONDITIONAL PASS (user decides) | Deprecated dependency, missing README section, console warnings, minor visual issues |
| **INFO** | Polish items, no functional impact | No gate impact | Unused env vars, minor formatting, optional improvements |

## §3. Evidence Standards

Every finding MUST include evidence. Findings without evidence are rejected.

| Evidence Type | When to Use | Format |
|---|---|---|
| **Screenshot** | Visual/UI issues | Captured via browser-automation, saved to `.agentwork/` |
| **HTTP response** | Boot/health/API failures | Status code + response body excerpt |
| **Log output** | Startup failures, errors | Relevant log lines (not full logs) |
| **File reference** | Config issues, mock detection | `file:line` with relevant code snippet |
| **Command output** | Install/build failures | Command + stderr/stdout excerpt |

## §4. Independence Protocol

Red team validators operate under strict independence:

1. **No development context** — do not read `.agentwork/` files from the development pipeline
2. **No arbiter verdicts** — do not read or reference arbiter pass/fail decisions
3. **No mission handoffs** — do not read mission-lead completion reports
4. **Fresh perspective** — approach the codebase as if seeing it for the first time
5. **User requirements only** — validate against the original user requirements, not internal design documents

## §5. Continuous Validation (Cross-Epic)

When validating after multiple epics:

1. **Full regression** — verify ALL features from all completed epics, not just the latest
2. **Baseline comparison** — compare against previous red team results to detect regressions
3. **Cross-feature interaction** — test workflows that span features from different epics
4. **Regression = BLOCKER** — any previously-working feature that now fails is a BLOCKER

## §6. Output Aggregation

The `@red-team-lead` aggregates all validator findings into `.agentwork/red-team-verdict.md`:

1. Collect all `.agentwork/findings-*.md` files
2. Deduplicate overlapping findings (same root cause reported by multiple validators)
3. Escalate severity if multiple validators report the same issue (WARNING → BLOCKER if systemic)
4. Produce a single unified verdict with clear remediation guidance
