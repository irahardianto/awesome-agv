# v3.0.0 — The RMAS Evolution

## 🏗️ Recursive Multi-Agent System (RMAS)

This release marks a massive architectural leap for Awesome AGV. We have completely overhauled the multi-agent pipeline manager (`/workflow-team`), transitioning from a linear process to a deeply nested **Recursive Multi-Agent System (RMAS)**.

With this evolution, agents can now self-organize, dynamically spawn hierarchical sub-teams, manage their own context limitations, and execute safely across independent failure domains.

The result: **25 rules, 57 skills, 12 workflows, 21 agents** — purpose-built for massive, complex software engineering tasks.

---

### 🏛️ New 4-Tier Orchestration Hierarchy

We've introduced a robust management hierarchy to handle massive scope without losing context or coherence. The orchestration layer has expanded into 4 distinct tiers:

1. **L1 Strategic Layer (`@overseer`)**: Program director that aligns multiple domain streams and manages cross-domain dependencies.
2. **L2 Domain Layer (`@rally-lead`)**: Domain coordinator that orchestrates multiple missions within a business vertical.
3. **L3 Execution Layer (`@mission-lead`)**: Mission manager that drives a specific feature slice to completion and orchestrates parallel builder agents.
4. **Compliance Layer (`@arbiter`, `@tech-lead`)**: Independent hard-gate authorities that enforce integrity, rules, and specifications.

---

### 🤖 New Agent Personas (16 → 21)

To support the RMAS architecture, we've added **6 new specialized agents** (and sunset one):

- **`overseer`**, **`rally-lead`**, and **`mission-lead`** (The new L1-L3 coordinators)
- **`arbiter`**: Independent compliance authority that checks the work of reviewers.
- **`acceptance-reviewer`**: Dedicated spec adherence verifier.
- **`ux-craftsman`**: Replaces the old `ux-reviewer`, taking a much more proactive role in generating and guiding beautiful, accessible UI/UX.

---

### 🆕 New Core Skills (53 → 57)

Four foundational new skills have been added to power the RMAS capabilities:

- **`convergence-loop`**: An iterative problem-solving protocol (Briefing → Iterate → Gate → Converge) specifically designed for coordinator agents.
- **`fault-recovery`**: A structured 5-level escalation ladder (Retry → Replace → Skip → Redistribute → Degrade) allowing the system to self-heal without instantly failing.
- **`integrity-enforcement`**: A zero-tolerance compliance checking protocol used exclusively by the arbiter.
- **`scope-decomposition`**: MECE (Mutually Exclusive, Collectively Exhaustive) vertical slicing techniques for breaking down massive missions.

---

### 🔀 Workflow-Team Rewrite & Hard Gates

The `/workflow-team` pipeline has been completely reimagined to support these new capabilities:

- **Mandatory Hard Gates**: **REVIEW** and **ARBITRATE** are now non-skippable hard gates for all code-producing workflows. Skipping them is a critical protocol violation.
- **Self-Succession**: Coordinators will now automatically write a `succession-brief.md` and spawn a fresh instance of themselves when their context window reaches 70% capacity, ensuring infinite horizontal scaling of tasks.
- **Handoff Compression**: Strict communication protocols. Parent nodes never read raw execution traces; they only read highly compressed `handoff.md` files containing file paths, verification results, and verdicts.
- **Upgraded Parallel Dispatch**: `parallel-dispatch` skill now supports recursive branching and shared workspaces depending on the hierarchy layer (e.g., `branch` for L3 isolation, `share` for parallel executors).

---

### 📊 By the Numbers

| Metric | v2.1.0 | v3.0.0 | Change |
| --- | --- | --- | --- |
| Rules | 25 | 25 | — |
| Always-on mandates | 10 | 10 | — |
| Contextual principles | 15 | 15 | — |
| Skills | 53 | 57 | +7% |
| Workflows | 12 | 12 | — |
| Agent personas | 16 | 21 | +31% |

---

### ⬆️ Upgrade

```sh
npx awesome-agv --force
```

This replaces your existing `.agents/` directory with the v3.0.0 configuration. Your project code is never touched.

---

Full Changelog: [v2.1.0...v3.0.0](https://github.com/irahardianto/awesome-agv/compare/v2.1.0...v3.0.0)
