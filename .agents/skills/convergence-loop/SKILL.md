---
name: convergence-loop
description: >-
  Reusable convergence protocol for coordinator agents. Defines the
  BRIEFING → ITERATE → GATE → CONVERGE loop, context hygiene rules,
  self-succession protocol, turn budget, and handoff compression.
  Load when orchestrating multi-iteration workflows.
---

# Convergence Loop Protocol

Reusable iteration protocol for coordinator agents (rally-lead, mission-lead) that drive work toward acceptance criteria through cycles of execution, review, and refinement.

## §1. Briefing Phase — Document Templates

Produce these three documents in `.agentwork/` before the first iteration.

### .agentwork/briefing.md
```markdown
# Briefing
## Scope          <!-- One paragraph: what and why -->
## Acceptance Criteria  <!-- Numbered, independently verifiable -->
1. …
## Constraints    <!-- Hard limits: time, tech, perf budgets -->
## Dependencies   <!-- Features, services, or agents required -->
## Complexity Assessment  <!-- Low / Medium / High + justification -->
```

### .agentwork/progress.md
Append-only, monotonic — never delete or rewrite earlier entries.
```markdown
# Progress
| Iteration | Timestamp (ISO 8601) | Action Taken | Outcome | Open Blockers |
|-----------|----------------------|--------------|---------|---------------|
| 1         | …                    | …            | …       | …             |
```

### .agentwork/decision-log.md
```markdown
# Decision Log
## DEC-001: <title>
- **Context:** Why this decision was needed.
- **Alternatives:** Option A, Option B, …
- **Decision:** Chosen option.
- **Rationale:** Why it wins.
- **Consequences:** Trade-offs accepted.
```

## §2. Iteration Protocol

### Core Loop
```
BRIEFING → ITERATE → GATE → CONVERGE or RE-PLAN
              ↑                       |
              └───────────────────────┘
```

1. **ITERATE** — Dispatch workers. Execute the current plan.
2. **GATE** — Read arbiter verdict. Evaluate against acceptance criteria.
3. **CONVERGE** — All criteria met → produce `.agentwork/handoff.md`, message parent.
4. **RE-PLAN** — Criteria unmet → narrow scope using arbiter findings, update `.agentwork/progress.md`, loop.

### Iteration Cap
- **Maximum 5 iterations per coordinator instance.**
- On re-plan: record changes in `.agentwork/progress.md`. Narrow to specific arbiter-identified failures — do not repeat the full plan.

### Gate Evaluation
- Read arbiter verdict in full.
- Map each finding to the corresponding acceptance criterion.
- Criterion is MET only when arbiter explicitly confirms it or no findings contradict it.
- Ambiguous verdict → treat as FAIL, request clarification next iteration.

### Escalation on Cap Reached
When iteration 5 ends without convergence: write `.agentwork/escalation.md`, message parent, do NOT attempt iteration 6.

```markdown
# Escalation
## Iterations Exhausted
- **Cap:** 5 | **Final verdict:** PASS / FAIL
## Unmet Criteria   <!-- Each failing criterion + arbiter rationale -->
1. …
## Attempted Remediations  <!-- Per-iteration: what was tried, why insufficient -->
## Recommended Next Steps  <!-- Re-scope, add resources, unblock dependency -->
```

## §3. Context Hygiene & Self-Succession

### Pass to Children — ONLY
- **Scope card** — the specific slice of work.
- **Interface contracts** — inputs received, outputs required.
- **Applicable rules/skills** — only those relevant to the child's task.

### Children Return — ONLY
- Structured summary (not raw logs).
- Branch hash / commit reference.
- Verification results (pass/fail + counts).
- Blockers (if any).

### Self-Succession Triggers
Spawn a successor when ANY condition holds:

| Trigger                   | Threshold                                    |
|---------------------------|----------------------------------------------|
| Context consumption       | >70% of context window capacity              |
| Iteration count           | >3 iterations completed in current instance   |
| Coherence self-assessment | Coordinator detects reasoning degradation     |

### .agentwork/succession-brief.md
```markdown
# Succession Brief
## Mission Status    <!-- Per task: status, last iteration, blockers -->
## Pending Decisions <!-- Unresolved items from .agentwork/decision-log.md -->
## Iteration Count   <!-- Completed: N of 5 max -->
## Key Context       <!-- Info successor needs NOT in briefing/progress -->
```

Parent handles succession: spawn fresh coordinator, pass `.agentwork/briefing.md` + `.agentwork/progress.md` + `.agentwork/decision-log.md` + `.agentwork/succession-brief.md`. New instance resumes from recorded iteration count — does NOT restart from 1.

## §4. Turn Budget

### Review Phase Is Single-Pass
```
Coordinator → dispatch reviewers (parallel)
           → each writes .agentwork/findings-{agent-name}.md (e.g., .agentwork/findings-qa-analyst.md)
           → pass all findings to arbiter
           → arbiter produces .agentwork/verdict.md + messages coordinator
```
- **No reviewer-to-reviewer debates.** Reviewers never see each other's findings.
- **Arbiter resolves conflicts** — not another review round.
- **Scale width over depth.** More reviewers for coverage, not more rounds for depth.
- Each reviewer/adversary writes their own `.agentwork/findings-{agent-name}.md` independently.

## §5. Handoff Compression

### Promotion Before Handoff

Before writing `.agentwork/handoff.md`, promote persistent documents per `workflow-team.md` §7.5:

1. If `.agentwork/decision-log.md` has entries → copy to `docs/decisions/decision-log-{scope}-{YYYY-MM-DD}.md`
2. If design contracts were produced → copy to `docs/designs/`
3. If a decision has architectural significance → elevate to ADR via `adr` skill
4. Create target `docs/` subdirectories if they don't exist

### Coordinator Handoff (coordinator → parent coordinator)
```markdown
# Handoff
## Files Changed
| Path | Description |
|------|-------------|
| …    | …           |
## Branch / Commit
- **Branch:** `feature/…` | **Commit:** `abc1234`
## Test Results
- **Passed:** N | **Failed:** N | **Skipped:** N
## Arbiter Verdict
- **Result:** PASS / FAIL
- **Rationale:** One paragraph.
## Promoted Documents  <!-- List docs/ paths of promoted persistent documents -->
## Blockers for Parent  <!-- Omit if none -->
```

### Worker Handoff (worker → mission-lead)
Workers produce a scope-level handoff when their scope card is complete:
```markdown
# Handoff — [scope card name]
## Files Changed
| Path | Description |
|------|-------------|
| …    | …           |
## Tests Written / Passing
- **Unit:** N written, N passing | **Integration:** N written, N passing
## Assumptions Made  <!-- Omit if none -->
## Blockers  <!-- Omit if none -->
```

### Exclusion Rules
`.agentwork/handoff.md` MUST NOT contain:
- Raw terminal output or build logs
- Intermediate debugging steps or scratch notes
- Full file contents or large diffs
- Conversation transcripts or agent-to-agent message history

Parent nodes never read raw execution traces — only compressed handoffs. This is what makes deep nesting viable without context rot.

### Cleanup After Handoff

After sending the handoff message to the parent coordinator:
```bash
rm -rf .agentwork/
```

