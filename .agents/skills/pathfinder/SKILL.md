---
name: pathfinder
description: "Session bootstrap + workflows for Pathfinder semantic navigation tools. Covers: discovery protocol, tool chaining patterns (explore, impact, audit, debug), search optimization, LSP degraded mode, and error recovery."
---

# Pathfinder Skill

## Session Bootstrap

Before any code exploration or analysis, confirm Pathfinder is available:

```
mcp({ server: "pathfinder" })
```

- **Tools listed** → Pathfinder is live. Use semantic tools for all source code operations.
- **Error or empty** → Pathfinder unavailable. Use built-in tools. Stop here.

Check once per session. Re-check only if a tool call fails with a connection error.

## Semantic Paths

All Pathfinder tools that take a `semantic_path` require `file_path::symbol_chain`:

- ✅ `src/auth.ts::AuthService.login`
- ✅ `crates/pathfinder/src/server.rs::PathfinderServer.new`
- ❌ `AuthService.login` (interpreted as a file named "AuthService.login")
- ❌ `login` (interpreted as a file named "login")

Bare file paths (no `::`) are valid only for whole-file operations like `read_source_file`.

## Workflows

### Explore (Understand a Codebase)

```
1. get_repo_map(path=".", depth=5, visibility="public")
   → Full project skeleton with semantic paths
   → Low coverage_percent? Increase max_tokens
   → Files show [TRUNCATED]? Increase max_tokens_per_file
   → Use changed_since="3h" to scope to recent changes
   → Use include_extensions=["ts","tsx"] for language focus
   → Use include_tests=false to exclude test symbols

2. search_codebase(query="<entry point>", path_glob="src/**/*")
   → Find main handlers, routes, or CLI commands
   → Copy enclosing_semantic_path for next step
   → Check files_searched/files_in_scope/coverage_percent for completeness

3. read_with_deep_context(semantic_path="<entry point>")
   → Source + signatures of everything it calls
   → First call may take 5-30s during LSP warmup

4. find_callers_callees(semantic_path="<key function>", max_depth=3)
   → Who calls it (incoming) + what it calls (outgoing)
```

**Done when:** You can explain the architecture and trace a request through the system.

### Impact Assessment (Before Any Change)

```
1. read_with_deep_context(semantic_path="<target>")
   → Current code + dependency signatures

2. find_callers_callees(semantic_path="<target>", max_depth=3)
   → All callers = blast radius
   → For large API changes: use max_depth=4-5
   → When NOT degraded: empty arrays = LSP confirmed zero

3. For each caller:
   read_symbol_scope(semantic_path="<caller>")
   → Verify assumptions about the target's interface

4. get_definition(semantic_path="<suspicious dependency>")
   → Jump to external dependency source
```

**Rule:** ALWAYS run `find_callers_callees` before recommending a refactor.

### Audit (Review Code Quality)

```
1. get_repo_map(path=".", depth=5, visibility="all")

2. For each module:
   a. read_source_file(filepath="<file>", detail_level="source_only")
      → For targeted line reading (lowest tokens)
   b. read_source_file(filepath="<file>", detail_level="compact")
      → For code + flat symbol list
   c. read_with_deep_context(semantic_path="<complex function>")
   d. search_codebase(query="<danger pattern>", is_regex=true)
      Go: panic|log\.Fatal
      Rust: unwrap\(\)|expect\(|panic!
      Python: except:|pass\s+# noqa
      TypeScript: as any|@ts-ignore
   e. search_codebase(query="TODO|FIXME|HACK", filter_mode="comments_only")

3. For critical findings:
   find_callers_callees(semantic_path="<problem>")
   → Blast radius before recommending changes
```

### Debug (Trace a Problem)

```
1. read_with_deep_context(semantic_path="<failing function>")
   → Source + all dependencies

2. get_definition(semantic_path="<suspicious call>")
   → Jump to the callee's definition

3. find_callers_callees(semantic_path="<failing function>", max_depth=1)
   → Find callers to understand inputs

4. search_codebase(query="<error message>")
   → Locate error origin
```

## Search Optimization

`search_codebase` parameters for token efficiency:

| Parameter | Default | Effect |
|---|---|---|
| `filter_mode` | `code_only` | `code_only` skips comments/strings; `comments_only` for TODOs; `all` for everything |
| `path_glob` | `**/*` | Scope search (e.g. `src/**/*.ts`) |
| `exclude_glob` | `""` | Skip files before reading (e.g. `**/*.test.*`) |
| `known_files` | `[]` | Files already in context — matches return metadata only, no content |
| `group_by_file` | `false` | One version_hash per file group instead of per match |
| `is_regex` | `false` | Regex mode (e.g. `unwrap\(\)|expect\(`) |
| `max_results` | `50` | Cap results |
| `context_lines` | `2` | Context above/below matches |

**Coverage metadata:**
- `files_searched` — actual files that were searched
- `files_in_scope` — files matching path_glob
- `coverage_percent` — % of in-scope files searched. <100% means some files skipped.

**Search counts:**
- `total_matches` — post-filter count (equals `matches.len()`). This is the ground truth.
- `raw_match_count` — ripgrep pre-filter count (before `filter_mode` drops comments/strings).
- `filtered_count` — `raw_match_count - total_matches` (how many rows were removed by the filter).
- `truncated` — result set was capped at `max_results`. Increase `max_results` or narrow your query.

**Token-saving pattern:**
```
search_codebase(query="deprecated_api",
                known_files=["src/fileA.ts", "src/fileB.ts"],
                exclude_glob="**/*.test.*",
                group_by_file=true)
```

## Token Budget Controls

Use these parameters to prevent context-window overflow in large repos:

### `find_callers_callees` budget parameters

| Parameter | Default | Effect |
|---|---|---|
| `project_only` | `true` | `true` = only workspace files (no stdlib/vendor); `false` = all references |
| `max_references` | `50` | Hard cap on total BFS references returned across incoming + outgoing |
| `max_depth` | `3` | BFS traversal depth (clamped 1–5). Use 3 for standard refactoring, 4-5 for large-scale API changes. |

When `references_truncated: true` in the response, the budget was hit — either increase `max_references` or decrease `max_depth`.

### `read_with_deep_context` budget parameters

| Parameter | Default | Effect |
|---|---|---|
| `project_only` | `true` | `true` = filter stdlib/vendor callees; `false` = include all |
| `max_dependencies` | `50` | Hard cap on outgoing dependency entries |

When `dependencies_truncated: true` in the response, increase `max_dependencies` to see more.

### `get_repo_map` budget parameters

| Parameter | Default | Effect |
|---|---|---|
| `max_tokens` | auto | Auto-scales for repos > 20 files: `clamp(file_count × 800, 16000, 48000)` |
| `max_tokens_per_file` | `2000` | Per-file skeleton cap before file is shown as a stub |
| `include_tests` | `true` | Include test functions/modules regardless of visibility |

Check `max_tokens_used` in the response to see the effective budget applied.

## LSP Degraded Mode

**Tools that use LSP:** `get_definition`, `find_callers_callees`, `read_with_deep_context`, `find_all_references`.

**Visual indicator:** When degraded, text output starts with:
```
⚠️ DEGRADED ({reason}) — {tool-specific guidance}
```

Every response includes `degraded` (bool), `degraded_reason`, and `lsp_readiness`:

| `degraded_reason` | Meaning | Action |
|---|---|---|
| `null` | LSP confirmed | Trust fully |
| `no_lsp` | No language server available | Accept limited results |
| `lsp_warmup_empty_unverified` | LSP indexing; empty = unverified | Re-run in 10-30s |
| `lsp_warmup_grep_fallback` | LSP returned null; fell back to grep | Verify with read_source_file |
| `lsp_timeout_grep_fallback` | LSP timed out; fell back to grep | Re-run or use tree-sitter tools |
| `lsp_error_grep_fallback` | LSP error; fell back to grep | Check lsp_health |
| `no_lsp_grep_fallback` | No LSP; fell back to grep | Install language server |
| `grep_fallback_file_scoped` | File-scoped grep | Good confidence |
| `grep_fallback_impl_scoped` | Impl-block grep | Good for methods |
| `grep_fallback_global` | Global grep | Least precise — verify |
| `unsupported_language_filter_bypassed` | Language unsupported; filter bypassed | Results may include noise |
| `unsupported_language` | Language not supported | Use read_file for raw content |
| `git_error` | Git operation failed | get_repo_map changed_since fell back |

**LSP Readiness values:**
- `"ready"` — LSP is fully operational
- `"warming_up"` — LSP still indexing
- `"unavailable"` — No LSP available

**Critical rule:** When `degraded: true`, **never treat empty results as confirmed-zero.** Re-run after LSP finishes indexing, or check `lsp_health`.

**Null vs Empty Array distinction:**
- `incoming: null` (or `outgoing: null`, `references: null`) — unknown, degraded
- `incoming: []` (or `outgoing: []`, `references: []`) — LSP confirmed: truly zero

## Error Recovery

**SYMBOL_NOT_FOUND with `did_you_mean` suggestions:**
```
Error: SYMBOL_NOT_FOUND for "src/auth.ts::AuthServce.login"
       data.details.did_you_mean: ["AuthService.login", "AuthService.logout"]
→ Use the corrected path from did_you_mean
→ If suggestions list is empty: use search_codebase(query="login") to find the right file
```

**SYMBOL_NOT_FOUND — no suggestions (wrong file):**
```
Error: SYMBOL_NOT_FOUND, did_you_mean: []
→ The symbol probably lives in a different file
→ search_codebase(query="<symbol_name>") → find file → retry with correct path
```

**LSP Timeout / Degraded Navigation:**
```
degraded=true, degraded_reason="lsp_warmup_empty_unverified"
→ Check lsp_health for indexing status
→ Re-run after indexing completes
→ If no_lsp: use search_codebase + read_symbol_scope as fallback
```

## Common Mistakes

### Wrong File in Semantic Path
If `get_definition("logic.go::CompleteLesson")` returns SYMBOL_NOT_FOUND,
the symbol might be defined in a different file. The semantic path requires the
**actual file where the symbol is defined**, not just any file in the module.

**Solution:**
1. Use `search_codebase(query="CompleteLesson")` to find which file defines the symbol
2. Use `read_source_file(filepath="logic.go", detail_level="symbols")` to see all symbols in a specific file
3. Then use the correct file path in the semantic path

### Tool Selection: read_file vs read_source_file

| File Type | Tool | Why |
|---|---|---|
| .rs, .go, .ts, .tsx, .js, .jsx, .py, .vue | `read_source_file` | AST parsing, symbol extraction, semantic paths |
| .yaml, .yml, .toml, .json, .env, .md, .txt, Dockerfile, package.json | `read_file` | Raw content, no AST needed |
| Unknown | `read_file` | Safe default, returns raw text |

### read_source_file detail_level options

| Option | Output | Use Case |
|---|---|---|
| `source_only` | Source code only | Lowest token cost, targeted reading |
| `compact` (default) | Source + flat symbol list | General purpose |
| `symbols` | Symbol tree only, no source | Discover available symbols |
| `full` | Source + nested symbol tree | Deep understanding |

## Quick Reference

| I want to... | Tool chain |
|---|---|
| Understand a new project | `get_repo_map` → `read_with_deep_context` |
| Read one function precisely | `read_symbol_scope` |
| Read a full source file | `read_source_file` (use `detail_level="source_only"` for minimal tokens) |
| Find a function by name/pattern | `search_codebase` → `read_symbol_scope` |
| See all callers of a function | `find_callers_callees` |
| See all callees of a function | `read_with_deep_context` or `find_callers_callees` |
| Find ALL references (including non-call) | `find_all_references` |
| Jump to a definition | `get_definition` |
| Find tech debt | `search_codebase(query="TODO\|FIXME", filter_mode="comments_only")` |
| Check LSP status | `lsp_health` |
| Read a config file | `read_file` |

## Fallback (Pathfinder Unavailable)

If tools are not available, fall back transparently:

| Pathfinder | Built-in |
|---|---|
| `read_symbol_scope` / `read_with_deep_context` | `Read` with line ranges |
| `read_source_file` / `read_file` | `Read` |
| `search_codebase` | `Grep` |
| `get_repo_map` | `Glob` or `ls` |
| `find_callers_callees` / `get_definition` | `Grep` (approximate) |

Do not block on Pathfinder. Complete the work with built-in tools.
