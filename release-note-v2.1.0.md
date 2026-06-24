# v2.1.0 — The Token Diet

## 🏗️ Three-Tier Architecture, Hardened

This release completes the architectural vision introduced in v2.0.0. Every rule, skill, and agent has been re-evaluated through one lens: **does the model need this instruction, or does it already know it?**

The result: a leaner, faster, more precise configuration suite — **25 rules, 53 skills, 12 workflows, 16 agents** — that loads less and enforces more.

---

### 🧠 Rules Distilled to Decisions-Only (27 → 25)

The biggest change in v2.1.0 is philosophical: rules now encode **only project-specific decisions that override model defaults** — not general knowledge the model already knows. Every line of every rule answers: *"What would this model get wrong without this instruction?"*

**Merged rules:**
- `code-completion-mandate` absorbed into `code-idioms-and-conventions` — the completion workflow (generate → validate → remediate → verify → deliver) is now part of the idioms routing table, not a standalone mandate
- `concurrency-and-threading-mandate` absorbed into `core-design-principles` — the "profile before parallelizing" decision lives where design decisions belong

**Optimized all 25 rules:**
- Stripped "Related Principles" cross-reference sections from every rule — the dependency graph handles this
- Removed embedded checklists — migrated to dedicated `audit-checklist` and `acceptance-review` skills
- Trimmed textbook explanations — models don't need to be taught what SQL injection is; they need to be told to *refuse it even when asked*

**Net effect:** ~40% reduction in always-on token cost. Same enforcement. Zero coverage loss.

---

### 🛠️ Rules → Skills Migration

Language idioms and infrastructure patterns have been migrated from always-on rules to on-demand skills. Previously, Go idioms loaded even when you were editing a Vue component. Now:

- **Core language idiom skills** (Go, TypeScript, Vue, Flutter, Rust, Python) each bundle their own `references/project-structure.md` — the project layout travels with the language, not as a global rule
- **Infrastructure and cross-cutting skills** now have explicit load contracts — they declare exactly when and why they load
- **All cross-references updated** across 53 skills to point to new skill paths (no more dangling references to deleted rule files)

---

### 🆕 New Skills (50 → 53)

**`audit-checklist`** — Consolidated audit checklists for code review and verification. Previously embedded inline across multiple rules, now a single loadable skill used by `/audit` workflow and multi-agent review pipelines.

**`acceptance-review`** — Spec adherence and deliverable completeness verification. Verifies *what was delivered* matches *what was requested*. Designed for the REVIEW primitive in `/workflow-team`.

**`angular-idioms`** — Angular components, signals, dependency injection, and RxJS patterns. Completes the community language skill roster.

---

### 🤖 Tech-Lead Orchestration Persona

New `tech-lead` agent persona — the anchor for multi-agent orchestration. The tech-lead:
- Elicits requirements and composes workflow primitives
- Enforces standards across all agent layers
- Owns all quality gates (no agent ships without tech-lead approval)
- Coordinates SCOUT → DESIGN → BUILD → REVIEW pipeline

All 16 agent profiles refined with tighter domain boundaries and updated skill references.

---

### 🔀 Workflow-Team Rewrite

The multi-agent pipeline manager (`/workflow-team`) has been completely rewritten:

- **Consolidated parallel-dispatch** — Previously split across multiple skills, the safety invariants for parallel agent execution (MECE file ownership, DAG-based ordering, merge protocol) are now in a single `parallel-dispatch` skill
- **Recursive dispatch support** — Parallel dispatch applies at every nesting depth, not just the top level
- **11 workflow templates** (A–K) for common scenarios: full features, bug fixes, audits, mobile, security hardening, infrastructure, documentation sprints, incident response, and tech debt

---

### 🔐 CI/CD: OIDC Trusted Publishing

npm publish now uses **OIDC Trusted Publishing** — no npm tokens stored in GitHub Secrets. The publish workflow:
- Runs on Node 24 (npm 11) for full OIDC support
- Uses `--provenance` for supply chain attestation
- Zero manual credential management

---

### 📊 By the Numbers

| Metric | v2.0.0 | v2.1.0 | Change |
| --- | --- | --- | --- |
| Rules | 27 | 25 | -7% (merged, not removed) |
| Always-on mandates | 12 | 10 | -17% token overhead |
| Contextual principles | 15 | 15 | — |
| Skills | 50 | 53 | +6% |
| Workflows | 12 | 12 | — |
| Agent personas | 16 | 16 | — |
| Files changed | — | 206 | — |
| Lines added | — | 27,508 | — |
| Lines removed | — | 2,326 | — |

---

### ⬆️ Upgrade

```sh
npx awesome-agv --force
```

This replaces your existing `.agents/` directory with the v2.1.0 configuration. Your project code is never touched.

---

### 🙏 Contributors

Built with ❤️ for the developer community.

---

Full Changelog: [v2.0.0...v2.1.0](https://github.com/irahardianto/awesome-agv/compare/v2.0.0...v2.1.0)
