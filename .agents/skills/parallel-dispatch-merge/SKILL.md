---
name: parallel-dispatch-merge
description: >-
  Safe, sequential merge protocol for integrating N parallel worktree
  branches back into main. Defines merge ordering, quality gates between
  merges, conflict classification, and the updated worktree naming
  convention for multi-instance dispatches.
---

# Parallel Dispatch: Merge Protocol

Merge N parallel worktree branches safely. One branch at a time. Quality gate between each. Dependency order first.

## When to Invoke
- After all sub-tasks at a DAG level complete
- At each merge point in the execution DAG
- When the orchestrator needs to integrate parallel work before proceeding to the next level

## Merge Order

Priority (highest to lowest):

1. **DAG dependency order**: Merge nodes that downstream nodes depend on first. If node B depends on node A's output, merge A before B.
2. **Smallest diff first**: For independent nodes at the same DAG level, merge the branch with fewer changed lines first. Smaller diffs have less conflict surface.
3. **Integration sub-tasks last**: `@<agent>[integration]` branches always merge after all feature branches for that agent type.

## Worktree Naming Convention

Multi-instance dispatches use scope-qualified names:

```bash
# Format: .wt/<agent-name>-<scope>
# Branch: wt/<agent-name>-<scope>-<timestamp>

# Setup
git worktree add .wt/<agent-name>-<scope> -b wt/<agent-name>-<scope>-$(date +%s) HEAD

# Examples
git worktree add .wt/backend-engineer-auth -b wt/backend-engineer-auth-$(date +%s) HEAD
git worktree add .wt/backend-engineer-tasks -b wt/backend-engineer-tasks-$(date +%s) HEAD
git worktree add .wt/frontend-engineer-auth-ui -b wt/frontend-engineer-auth-ui-$(date +%s) HEAD
git worktree add .wt/scout-infra -b wt/scout-infra-$(date +%s) HEAD
```

Single-instance dispatches retain the original convention:
```bash
git worktree add .wt/<agent-name> -b wt/<agent-name>-$(date +%s) HEAD
```

## Per-Branch Merge Protocol

Execute for each branch, in merge order:

### Step 1: Pre-Merge Check
```bash
# Ensure main is clean
git status  # must show clean working tree
git log --oneline -1  # confirm HEAD is expected
```

### Step 2: Squash Merge
```bash
git merge --squash wt/<agent-name>-<scope>-<ts>
```

### Step 3: Commit
```bash
git commit -m "<type>(<scope>): <description>

Parallel dispatch: @<agent-name>[<scope>]
Scope card: <brief deliverable summary>"
```

Commit message includes the parallel dispatch context for traceability.

### Step 4: Quality Gate
Run language-appropriate quality checks per the Code Completion Mandate (`.agents/rules/code-completion-mandate.md`).

**If quality gate fails**: Fix issues before merging the next branch. The fix belongs to the scope of the branch that introduced the failure.

### Step 5: Cleanup
```bash
git worktree remove .wt/<agent-name>-<scope>
git branch -D wt/<agent-name>-<scope>-<ts>
```

### Step 6: Proceed
Move to the next branch in merge order. Repeat Steps 1-5.

## Conflict Handling

### Conflict Classification

| Type | Description | Resolution Strategy |
|------|-------------|-------------------|
| **Textual** | Same line modified differently by two branches | Analyze intent of both changes. Pick correct version or combine. Test after resolution. |
| **Semantic** | Different changes that interact logically (e.g., both add a dependency) | Requires understanding both features. May need new code that satisfies both intents. |
| **Structural** | File reorganization conflicts (renamed, moved) | Re-apply changes on the new structure. |
| **Integration** | Router/config aggregation (both add routes) | Combine both additions. Order by convention (alphabetical, feature grouping). |

### Conflict Resolution Protocol

1. **Identify**: Read the conflict markers. Understand what each branch intended.
2. **Classify**: Determine conflict type (textual, semantic, structural, integration).
3. **Resolve**: Apply the appropriate resolution strategy.
4. **Test**: Re-run quality gate after resolution.
5. **Document**: Include resolution rationale in the merge commit message.

```bash
# After resolving conflicts
git add <resolved-files>
git commit -m "<type>(<scope>): <description>

Conflict resolution: merged @<agent>[<scope-A>] changes with @<agent>[<scope-B>]
Resolution: <brief rationale>"
```

### When Conflicts Indicate Decomposition Failure

If the same conflict pattern repeats across multiple merges, the decomposition was flawed:
- **Same file in multiple branches** → ownership validation missed an overlap → re-decompose
- **Incompatible interface changes** → missing contract from DESIGN phase → re-design
- **Ordering-dependent changes** → missing edge in DAG → add dependency

## Read-Only Node Results

Read-only nodes (scout, qa-analyst, security-engineer, ux-reviewer, incident-responder) don't produce branches. They produce **documents and findings** that are passed as context to downstream nodes:

- Research findings → passed to DESIGN agents as input context
- Pre-mortem findings → passed to BUILD agents as risk-aware advisory context
- Review findings → passed to REMEDIATE agents as fix requirements
- Security findings → passed to engineers with severity-tagged recommendations

No merge step needed for read-only nodes. Their output is context, not code.

## Multi-Phase Merge Points

In a full pipeline, merge points occur at phase boundaries:

```
SCOUT (read-only, no merge) →
DESIGN (merge design branches) →
PRE-MORTEM (read-only, no merge — produces advisory findings) →
BUILD (merge feature branches per level) →
  Level M+1: merge parallel feature branches
  Level M+2: merge integration branches
REVIEW (read-only, no merge) →
REMEDIATE (merge fix branches) →
VERIFY (single agent, no parallel merge)
```

Each merge point follows this same per-branch protocol.

## Merge Checklist

Before declaring a merge point complete:

- [ ] All branches at this level merged in dependency order
- [ ] Quality gate passed after each individual merge
- [ ] No unresolved conflicts remaining
- [ ] Worktrees and temporary branches cleaned up
- [ ] Integration sub-tasks merged last
- [ ] Commit messages include parallel dispatch context
- [ ] Working tree is clean (`git status`)

## Related Skills
- parallel-dispatch-decomposition — produces scope cards that determine merge scope
- parallel-dispatch-dag — determines merge order from DAG levels
- parallel-dispatch-ownership — ensures no ownership violations during merge
- git-workflow — conventional commits, branch naming, worktree best practices
