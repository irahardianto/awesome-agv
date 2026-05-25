---
name: research-methodology
description: >-
  Structured research protocol: investigate technologies, patterns, APIs before
  implementation. Multi-tool search, research logs, training data fallback honesty.
---

# Research Methodology Skill

Ensure code is informed by accurate, up-to-date knowledge — not stale training data.

## When to Invoke
- Before implementing with unfamiliar tech
- Evaluating library/framework options
- Architect informing design decisions
- Builder encountering unknown API/pattern

## Process

### 1. Topic Decomposition

Break into 2-5 keyword searchable topics:
```
"Task CRUD API with Supabase":
  1. Supabase client library JS/TS
  2. Supabase RLS policies
  3. Supabase real-time subscriptions
  4. PostgreSQL UUID PK patterns
  5. TS type generation from Supabase
```

### 2. Multi-Tool Search

| Priority | Tool | Best For |
|---|---|---|
| 1st | Qurio MCP | Deep doc search, official docs |
| 2nd | Context7/similar MCP | Library-specific API refs |
| 3rd | Supabase MCP | Supabase-specific docs |
| 4th | `search_web` | General, blogs, SO |
| 5th | `read_url_content` | Deep reading specific pages |

Strategy: broad search → find doc page → deep read → search gotchas + edge cases.

### 3. Document Findings

Path: `docs/research_logs/{feature_name}.md`

```markdown
# Research: {Topic}
Date: {date}
Researcher: {agent}

## Topics Investigated
1. {topic} — {tool} — {finding}

## Key Patterns
- {Pattern}: {description + code}

## API Signatures
```{lang}
// Exact API from docs
```

## Gotchas
- {Gotcha}: {avoidance}

## Code Examples
```{lang}
// Working examples from docs
```

## Sources
- [{title}]({url}) — {learned}

## Training Data Reliance
- {topic}: Relying on training data. No external verification.
```

### 4. Training Data Fallback

If no search yields results:
1. Document queries attempted + tools used
2. Explicitly state: "Relying on training data for {topic}. External verification unavailable."
3. Flag for human review
4. If critical, ask user for docs

**Never silently use training data when verification is available.**

### 5. ADRs

If research reveals choice between 2+ approaches, new dependency, or arch change → create ADR via `adr` skill at `docs/decisions/NNNN-short-title.md`.

## Agent Integration

| Agent | Usage |
|---|---|
| Architect | Research before design, inform ADRs |
| Backend | Unfamiliar APIs, library patterns |
| Frontend | Component libs, CSS patterns |
| Mobile | Platform APIs, Flutter packages |
| Database | Query patterns, extensions |

Research logs persist in `docs/research_logs/` for cross-session knowledge. ADRs follow `adr` skill format.
