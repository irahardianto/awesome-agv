# awesome-agv

> 1-click installer for [Antigravity Setup](https://github.com/irahardianto/antigravity-setup) — a rugged, high-quality configuration suite for AI Agents.

## Quick Start

```bash
npx awesome-agv
```

This downloads and installs the latest `.agent/` configuration directory into your project, giving your AI coding assistant **30 rules**, **7 skills**, and **10 workflows**.

## Usage

```bash
npx awesome-agv [target-dir] [options]
```

### Options

| Flag           | Description                                      |
| -------------- | ------------------------------------------------ |
| `[target-dir]` | Directory to install into (default: `./`)        |
| `--force, -f`  | Overwrite existing `.agent/` without prompting   |
| `--help, -h`   | Show help                                        |

### Examples

```bash
# Install into current directory
npx awesome-agv

# Install into a specific project
npx awesome-agv ./my-project

# Overwrite existing installation
npx awesome-agv --force
```

## What Gets Installed

```
.agent/
├── rules/        # 30 rules (security, architecture, testing, DevOps)
├── skills/       # 7 specialized skills (debugging, design, code review)
└── workflows/    # 10 development workflows (TDD, CI/CD, refactoring)
```

Your AI agent automatically picks up the `.agent/` directory — no additional configuration needed.

## License

MIT — see [LICENSE](https://github.com/irahardianto/antigravity-setup/blob/main/LICENSE)
