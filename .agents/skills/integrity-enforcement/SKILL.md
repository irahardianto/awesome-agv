---
name: integrity-enforcement
description: >-
  Zero-tolerance integrity enforcement for the arbiter agent. Cheating
  detection, scope violation verification, test integrity checks, and
  independent build/test re-execution. Exclusive to @arbiter — other
  agents must not load this skill.
---

## §1. Integrity Checks (Execute BEFORE Review Evaluation)

Run all five checks first. If ANY check fails → **FAIL unconditionally**. Do not evaluate reviewer findings.

### Check 1 — Scope Violation

Compare files modified by workers against their assigned scope cards. Any file modified outside the assigned write scope = **INTEGRITY VIOLATION**. This catches agents that "helpfully" fix things outside their mandate.

### Check 2 — Test Integrity

Search the codebase for each of these fraud signals:

| Signal | Patterns to grep |
|---|---|
| Disabled/skipped tests | `t.Skip()`, `@pytest.mark.skip`, `xit(`, `.skip`, `xdescribe`, `@Disabled`, `@Ignore` |
| Empty assertions | `assert True`, `expect(true).toBe(true)`, assertions with no meaningful condition |
| Dead test bodies | Test functions containing only `pass`, `return`, or empty blocks |
| Hardcoded mirrors | Expected values that are copy-pasted implementation constants |

Any match = **INTEGRITY VIOLATION**.

### Check 3 — Dependency Integrity

Diff package manifests (`go.mod`, `package.json`, `requirements.txt`, `Cargo.toml`, `pubspec.yaml`) against the state before BUILD. Flag:

- Any NEW dependency not mentioned in `.agentwork/briefing.md` or approved in `.agentwork/decision-log.md`
- Version downgrades or pinning changes without documented rationale

### Check 4 — Build Verification

Run the build from clean state (not incremental). If build fails → **FAIL** regardless of what workers reported.

### Check 5 — Test Verification

Run ALL tests independently (not just the ones workers ran). Compare test counts: if tests were removed or renamed, flag as suspicious. If any test fails → **FAIL** regardless of what workers reported.

## §2. Verdict Format

```markdown
# Arbiter Verdict

## Integrity Status: PASS | FAIL
- Scope violation: PASS | FAIL — [details]
- Test integrity: PASS | FAIL — [details]
- Dependency integrity: PASS | FAIL — [details]
- Build verification: PASS | FAIL — [details]
- Test verification: PASS | FAIL — [details]

## Review Synthesis (only if integrity PASS)
- QA findings: [summary]
- Acceptance findings: [summary]
- Adversary findings: [summary]
- Conflicts resolved: [if reviewers disagreed, how arbiter resolved]

## Final Verdict: PASS | FAIL
## Rationale: [1-2 sentences]
```

## §3. Independence Rules

- Do NOT read worker agents' test output — run tests yourself.
- Do NOT trust reviewer verdicts blindly — synthesize all findings independently.
- The arbiter's FAIL cannot be overridden by any agent. Only the user can override.
- Do NOT communicate with workers or reviewers during evaluation — isolation is mandatory.
