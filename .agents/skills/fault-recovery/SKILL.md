---
name: fault-recovery
description: >-
  Structured fault tolerance for coordinator agents. 5-level escalation
  ladder (Retry → Replace → Skip → Redistribute → Degrade), dead-man
  timers, degraded completion protocol, and cross-level escalation format.
  Load when orchestrating agents that may fail.
---

## §1. Escalation Ladder

When a dispatched agent fails, follow levels IN ORDER. Do not skip levels. Exhaust each level before escalating.

| Level | Action         | Trigger                          | Max Attempts | Next If Fails          |
|-------|----------------|----------------------------------|--------------|------------------------|
| 1     | RETRY          | Agent fails                      | 1 retry      | → Level 2              |
| 2     | REPLACE        | Same agent fails twice           | 1 replacement| → Level 3              |
| 3     | SKIP           | Replacement also fails           | —            | → Level 4 (if blocked) |
| 4     | REDISTRIBUTE   | Skip invalid (hard dependency)   | 2–3 sub-cards| → Level 5              |
| 5     | DEGRADE        | Sub-cards also fail              | —            | → `.agentwork/escalation.md` |

### Level 1 — RETRY

- Re-dispatch the same agent type with the same scope card + additional context from the failure.
- Max: 1 retry per agent.
- If the same agent fails twice → escalate to Level 2.

### §1.1. Rate-Limit Backoff Protocol (429 / RESOURCE_EXHAUSTED)

When a failure reason contains `RESOURCE_EXHAUSTED`, `429`, or `quota`, the failure is **transient** — the agent's logic is not at fault. Immediate retry will worsen the situation (thundering herd). Apply this protocol instead of the standard escalation ladder:

1. **DO NOT** immediately retry, replace, or spawn rescue agents.
2. **Use `schedule`** to set a backoff timer with exponential delay:

| Attempt | Backoff Delay | Action |
|---------|---------------|--------|
| 1st 429 | 60 seconds | `schedule(DurationSeconds=60)` → then retry |
| 2nd 429 | 120 seconds | `schedule(DurationSeconds=120)` → then retry |
| 3rd 429 | 300 seconds (5 min) | `schedule(DurationSeconds=300)` → then retry |
| 4th 429 | — | Write `.agentwork/escalation.md` with reason "persistent rate limiting" |

3. **Record** each backoff attempt in `.agentwork/progress.md`:
   ```
   BACKOFF: [scope card] — 429 RESOURCE_EXHAUSTED at [timestamp]. Waiting [N]s before retry attempt [M/3].
   ```
4. **Notify parent** only once (on first 429) — do NOT send repeated failure messages that cause the parent to spawn rescue agents.
5. This protocol **replaces** the standard Level 1→2→3 ladder for transient errors. Do NOT escalate to REPLACE or SKIP for a 429 — the replacement agent will hit the same quota limit.

> **Key rule:** A 429 error means "wait and retry" — it does NOT mean "the agent failed." Treat it as a pause, not a failure.

### Level 2 — REPLACE

- Dispatch a different agent type for the same task.
- Examples: `@backend-engineer` fails on a structural task → try `@refactoring-specialist`. `@frontend-engineer` fails on styling → try dispatching with `@ux-craftsman` advisory context.
- Max: 1 replacement attempt.
- If the replacement also fails → escalate to Level 3.

### Level 3 — SKIP

- Mark the scope card as deferred.
- Only valid if the skipped card is **NOT** a hard dependency for other cards.
- Record in `.agentwork/progress.md`: `SKIPPED: [card] — reason: [failure detail]`
- Continue with remaining scope cards.
- Report skipped cards in `.agentwork/handoff.md` as degraded scope.

### Level 4 — REDISTRIBUTE

- Split the failing scope card into 2–3 smaller sub-cards.
- Re-dispatch each sub-card with narrower scope.
- This adds a nesting level — only valid if current depth < 8.
- If sub-cards also fail → escalate to Level 5.

### Level 5 — DEGRADE

- Complete the mission without the failing component.
- Write degradation notice in `.agentwork/handoff.md`: `DEGRADED: [component] — reason: [failure history]`
- Arbiter evaluates whether degraded output is still acceptable.
- If arbiter says degraded output is unacceptable → write `.agentwork/escalation.md`.

## §2. Dead-Man Timers

- When dispatching a worker, set a timer using the `schedule` tool.
- Timer duration: proportional to expected task complexity.

| Task Complexity | Initial Timer | Extension (if progressing) |
|-----------------|---------------|---------------------------|
| Atomic          | 5 min         | +3 min                    |
| Standard        | 15 min        | +5 min                    |
| Complex         | 30 min        | +10 min                   |

- If the timer fires before the worker responds → check worker status.
- If the worker is stuck (no new tool calls, no file changes) → apply Level 1 (RETRY).
- If the worker is progressing (active tool calls, files being written) → extend by the Extension amount.

## §3. State Preservation During Recovery

Before retrying or replacing, save to `.agentwork/progress.md`:

```markdown
## Recovery State — [scope card identifier]
- **Failed agent:** [agent type and id]
- **Attempted action:** [what the agent tried to do]
- **Error/symptom:** [error message or observed behavior]
- **Partially modified files:** [list of files, if any]
- **Escalation level applied:** [Level N — ACTION]
```

Pass this state as additional context to the retry/replacement agent.

## §4. Cross-Level Escalation Format

When all 5 levels are exhausted, write `.agentwork/escalation.md`:

```markdown
# Escalation Report

## Mission
[Mission/scope identifier]

## Escalation Ladder Exhausted
- Level 1 RETRY: [attempt summary, failure reason]
- Level 2 REPLACE: [attempt summary, failure reason]
- Level 3 SKIP: [why skip was or was not applicable]
- Level 4 REDISTRIBUTE: [sub-card breakdown, failure reasons]
- Level 5 DEGRADE: [arbiter verdict on degraded output]

## Recommended Action
[re-plan | reassign | degrade | escalate to user] — [rationale]

## Progress Log
[Paste all relevant `.agentwork/progress.md` entries]
```

## §5. Anti-Patterns

| Anti-Pattern                        | Why It Fails                                                    |
|-------------------------------------|-----------------------------------------------------------------|
| Skipping levels                     | Jumps (e.g., RETRY → DEGRADE) miss cheaper recovery options     |
| Retrying without additional context | Exact same input produces exact same failure                    |
| Redistributing into >3 sub-cards    | Coordination overhead exceeds the benefit of narrower scope     |
| Degrading silently                  | Must always record in `.agentwork/handoff.md` and report to arbiter          |
| Immediate retry on 429              | Consumes more quota, cascades into thundering herd. Use §1.1 backoff instead |
| Spawning rescue agents on 429       | Parent creates MORE API calls, worsening the rate limit. Wait instead        |
