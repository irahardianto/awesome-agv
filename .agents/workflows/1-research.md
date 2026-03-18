---
description: Research phase - understand context and gather knowledge
---

# Phase 1: Research

## Purpose
Understand the request context AND gather accurate, up-to-date knowledge before writing any code.

## Steps

### 1. Analyze Request
Parse the user's request and identify:
- What are they asking for?
- What is the scope?

### 2. Review Current Implementation
Check the repository to understand:
- Current technical architecture
- Existing implementation patterns
- Dependencies and configurations

### 3. Build Mental Model
Inventory:
- Business requirements
- Technical constraints
- Integration points with existing code

### 4. Define Scope
Use `task_boundary` to set mode to **PLANNING**

Create a plan with bite-sized atomic tasks in `task.md`:
- `[ ]` = Not started
- Use indented lists for sub-items

### 5. Identify Research Topics
List all technologies, libraries, and patterns involved in this task.

Example:
```
Topics for "Task CRUD API":
- Go http.ServeMux routing patterns
- SQLC query generation
- UUID handling in PostgreSQL
- JWT authentication middleware
```

### 6. Search External Documentation
For EACH topic, search external documentation using the best tool available in your environment:

**Documentation search tools (use whichever is available):**
- **Qurio** (`mcp_qurio_qurio_search`, `mcp_qurio_qurio_read_page`) — if Qurio MCP is enabled
- **Context7** or similar MCP documentation servers — if available
- **`search_web` / `read_url_content`** — universal fallback always available

**Search strategy (2-5 keywords per query):**
```
# Using available documentation tool:
search(query="Go ServeMux routing")
search(query="SQLC CRUD queries")
search(query="Pinia store setup")

# For deeper reading on a specific URL:
read_page(url="https://go.dev/doc/<topic>")
```

### 7. Document Findings
Create `docs/research_logs/{feature_name}.md` with:
- Key patterns discovered
- Code examples from documentation
- API signatures and options
- Gotchas or edge cases found

#### Research Log Naming
Each feature should have its own research log:
```
docs/research_logs/
├── epic1_auth.md           # Epic 1: Authentication
├── epic2_task.md           # Epic 2: Task CRUD
├── epic3_lists.md          # Epic 3: Lists
└── {feature_name}.md       # Pattern: one log per feature
```

### 8. Document Architecture Decisions
If any decision involves:
- Choosing between 2+ viable approaches
- Introducing a new dependency or pattern
- Changing existing architecture

Then create an ADR using the **ADR Skill** at `docs/decisions/NNNN-short-title.md`.

**Skills to consider:**
- **Sequential Thinking** — for complex design decisions with multiple trade-offs

### 9. Fallback: State Training Data Usage
If relying on training data, explicitly state:
> "I am relying on my training data for this solution as external verification was unavailable."

## If This Phase Fails
If no documentation search tool yields results:
1. Document what was searched
2. State: "Relying on training data"
3. Proceed with caution
4. Flag for human review if critical

## Completion Criteria
- [ ] Request analyzed and scope defined
- [ ] `task.md` created with atomic tasks
- [ ] Research log created at `docs/research_logs/{feature_name}.md`
- [ ] All major technologies researched
- [ ] Code examples documented
- [ ] Architecture decisions documented as ADRs (if applicable)

## Next Phase
Proceed to **Phase 2: Implement** (`/2-implement`)