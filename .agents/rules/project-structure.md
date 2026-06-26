---
trigger: always_on
---

> **This file is the SINGLE SOURCE OF TRUTH for project organization.**
> All other rules and workflows that reference paths should defer to this file.
> To adapt the setup for a different project type, edit this file only.

## Project Structure

**Project Structure Philosophy:**

- **Organize by FEATURE, not by technical layer**
- Each feature is a vertical slice
- Enables modular growth, clear boundaries, and independent deployability

**Universal Rule: Context → Feature → Layer**

**1. Level 1: Repository Scope:** Root contains `apps/` grouping distinct applications (e.g., `apps/backend`, `apps/frontend`, `apps/mobile`).

**2. Level 2: Feature Organization**
   - **Rule:** Divide application into vertical business slices (e.g., `user/`, `order/`, `payment/`).
   - **Anti-Pattern:** Do NOT organize by technical layer (e.g., `controllers/`, `models/`, `services/`) at the top level.

### Language and Framework-Specific Layouts

Each layout follows the universal philosophy above. When working with a specific language or framework, load the project structure reference from its idiom skill:

**Convention:** `.agents/skills/{name}-idioms/references/project-structure.md` (e.g., `go-idioms` for Go, `nextjs-idioms` for Next.js)

If no reference file exists for the current stack, apply the universal vertical slice pattern above directly.


### Adapting for Different Project Types

| Project Type | Structure |
|---|---|
| **Monorepo** (default) | `apps/backend/`, `apps/frontend/`, `apps/mobile/` |
| **Single app** | Flatten to root — no `apps/` wrapper. Internal feature structure stays the same. |
| **Microservices** | One directory per service under `apps/`, each with own build config and Dockerfile. |
| **Full-stack + mobile** | Combine relevant layouts under `apps/` |

For language-specific adaptations (Go, Rust, Python, etc.), see the relevant idiom skill's `references/project-structure.md`.

**Single-app projects** don't need the `apps/` directory — put the language-specific root directories directly at the project root. The internal structure (features, platform, etc.) stays the same.

**Multiple entry points and microservices:** See the relevant language idiom skill for entry point conventions and service layout.

