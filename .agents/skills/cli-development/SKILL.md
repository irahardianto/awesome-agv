---
name: cli-development
description: >-
  CLI tool design, argument parsing, interactive prompts, shell completions,
  cross-platform considerations, and distribution strategies.
---

# CLI Development Principles

Guidelines for building fast, intuitive, cross-platform CLI tools.

## When to Invoke
- Designing CLI tool architecture
- Implementing command hierarchies and argument parsing
- Adding shell completions and interactive features
- Cross-platform distribution planning

## Architecture

### Command Hierarchy
```
app <command> [subcommand] [flags] [args]
app task create --priority high "Deploy fix"
app task list --status active --format json
```

### Design Principles
1. **Startup time < 100ms** — lazy-load expensive dependencies.
2. **Sensible defaults** — zero-config for common cases.
3. **Progressive disclosure** — simple interface, advanced flags for power users.
4. **Machine-readable output** — `--format json` for scripting.
5. **Exit codes** — 0 = success, 1 = error, 2 = usage error.

## Argument Parsing Libraries

| Language | Library | Notes |
|---|---|---|
| Go | `cobra` + `pflag` | Most popular, auto-completions |
| Rust | `clap` (derive) | Type-safe, auto-help |
| Python | `click` or `typer` | Decorator-based, typer for type hints |
| Node.js | `commander` or `yargs` | Mature, well-documented |

## Error Handling

1. **Helpful error messages** — what went wrong, why, how to fix:
   ```
   Error: config file not found at ~/.myapp/config.yaml
   Hint: run 'myapp init' to create a default config
   ```

2. **`--verbose` / `--debug`** flags for diagnostic output.
3. **Never show stack traces by default** — only with `--debug`.

## Shell Completions

Generate completions for bash, zsh, fish, PowerShell. Most CLI frameworks support this.

```bash
# Generate completions
myapp completion bash > /etc/bash_completion.d/myapp
myapp completion zsh > ~/.zsh/completions/_myapp
```

## Cross-Platform

1. **Path handling** — use `filepath.Join` (Go), `Path` (Python), not string concat.
2. **Line endings** — handle `\r\n` on Windows.
3. **Color support** — detect terminal capabilities, respect `NO_COLOR` env var.
4. **Unicode** — test with non-ASCII filenames and input.

## Distribution

| Method | Best For |
|---|---|
| Go/Rust binary | Single binary, no runtime dependency |
| `pip install` / `npm install -g` | Language ecosystem users |
| Homebrew formula | macOS/Linux users |
| Docker image | Containerized environments |
| GitHub Releases | Universal, with checksums |

## Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **Unit test command logic** — separate from CLI framework.
2. **Integration tests** — run actual CLI commands, assert exit codes and output.
3. **Golden file tests** — snapshot expected output for complex commands.

## Related
- Command Execution Principles @.agents/rules/command-execution-principles.md
- Error Handling Principles .agents/rules/error-handling-principles.md
