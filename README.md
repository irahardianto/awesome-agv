<div align="center">
  <h3 align="center">Antigravity Setup</h3>

  <p align="center">
    A rugged, high-quality configuration suite for AI Agents.
    <br />
    <a href="#usage">View Rules & Skills</a>
    ·
    <a href="https://github.com/irahardianto/antigravity-setup/issues">Report Bug</a>
    ·
    <a href="https://github.com/irahardianto/antigravity-setup/issues">Request Feature</a>
    <br />
    <br />
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project

**The setup** provides a comprehensive sets of standards and practices designed to elevate the capabilities of AI coding agents. It provides a suite of strict rules distilled from software engineering best practices that ensure generated code is secure, defensible, and maintainable. It also provides specialized skills that will help throughout software development.

Instead of just generating code that works, the rules and skills ensures agents generate code that **survives**.

While this configuration is originally designed for **Antigravity**, it is built on standard markdown-based context protocols that are easily portable to other AI coding tools. As a matter of fact, the original form [Technical Constitution](https://github.com/irahardianto/technical-constitution/blob/main/technical-constitution-full.md) was first created for **Gemini CLI**

You can drop this configuration into the context or custom rule settings of:

*   **Roo Code**
*   **Claude Code**
*   Any other agentic tool that supports custom system prompts or context loading.

For example, the principles of the [Rugged Software Constitution](.agent/rules/rugged-software-constitution.md) which is based on [Rugged Software Manifesto](https://ruggedsoftware.org/) are universal and will improve the output of any LLM-based coding assistant.

<!-- GETTING STARTED -->
## Getting Started

To equip your AI agent with these superpowers, follow these steps.

### Prerequisites

*   An AI Coding Assistant (Antigravity, Roo Code, Cline, etc.)
*   A project where you want to enforce high standards.

### Installation

1.  Clone this repository or copy the `.agent` folder into the root of your project.
    ```sh
    cp -r /path/to/antigravity-setup/.agent ./your-project-root/
    ```
2.  Ensure your AI agent is configured to read from the `.agent` directory (most of well-known AI coding assistant are adhering to the `.agent` convention by default) or manually ingest the `.agent/rules/**` as part of its system prompt.

<!-- USAGE -->
## Usage

Once installed, the rules and skills in this repository become active for your agent.

### Comprehensive Rule Suite

The power of the setup comes from its extensive collection of rules covering every aspect of software engineering.

#### 🛡️ Security & Integrity
*   **[Rugged Software Constitution](.agent/rules/rugged-software-constitution.md)**: The core philosophy of defensible coding.
*   **[Security Mandate](.agent/rules/security-mandate.md)**: Non-negotiable security requirements.
*   **[Security Principles](.agent/rules/security-principles.md)**: Best practices for secure design.

#### ⚡ Reliability & Performance
*   **[Error Handling Principles](.agent/rules/error-handling-principles.md)**: Techniques for robust error management.
*   **[Concurrency & Threading](.agent/rules/concurrency-and-threading-principles.md)**: Safe parallel execution and deadlock prevention.
*   **[Performance Optimization](.agent/rules/performance-optimization-principles.md)**: Writing efficient and scalable code.
*   **[Resource Management](.agent/rules/resources-and-memory-management-principles.md)**: Handling memory and system resources responsibly.

#### 🏗️ Architecture & Design
*   **[Core Design Principles](.agent/rules/core-design-principles.md)**: Fundamental software design rules (SOLID, DRY, etc.).
*   **[API Design Principles](.agent/rules/api-design-principles.md)**: Creating clean, intuitive, and versionable APIs.
*   **[Architectural Pattern](.agent/rules/architectural-pattern.md)**: Guidelines for structuring applications.
*   **[Data Serialization](.agent/rules/data-serialization-and-interchange-principles.md)**: Safe data handling and formats.
*   **[Command Execution](.agent/rules/command-execution-principles.md)**: Principles for running system commands securely.

#### 🧩 Maintainability & Quality
*   **[Code Organization](.agent/rules/code-organization-principles.md)**: Structuring projects for readability.
*   **[Code Idioms](.agent/rules/code-idioms-and-conventions.md)**: Following language-specific best practices.
*   **[Testing Strategy](.agent/rules/testing-strategy.md)**: Ensuring code is verifiable and tested.
*   **[Dependency Management](.agent/rules/dependency-management-principles.md)**: Managing external libraries safely.
*   **[Documentation Principles](.agent/rules/documentation-principles.md)**: Writing clear and helpful documentation.
*   **[Logging & Observability](.agent/rules/logging-and-observability-principles.md)**: Ensuring system visibility.

### Specialized Skills

*   **[Debugging Protocol](.agent/skills/debugging-protocol/SKILL.md)**: Systematic approach to solving errors.
*   **[Frontend Design](.agent/skills/frontend-design/SKILL.md`)**: Guidelines for creating visually appealing UIs, based on [Antrophic Frontend-Design Skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
*   **[Sequential Thinking](.agent/skills/sequential-thinking/SKILL.md)**: A tool for breaking down complex problems, an adaptation from [Sequential Thinking MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)

<!-- ROADMAP -->
## Roadmap

- [ ] Include more specialized skills to aid development process.
- [ ] Add more language-specific security rules (Python, Go, Rust).
- [ ] Create a CLI tool for easier installation (`npx install-antigravity`).
- [ ] Add automated validation scripts to check if an agent is following the constitution.

## Project Adaptation Guide

This setup supports different project structures:

| Project Type | Adaptation |
|-------------|------------|
| **Monorepo** (default) | Use as-is |
| **Single backend** | Remove frontend rules/workflows, keep backend paths |
| **Single frontend** | Remove backend rules/workflows, keep frontend paths |
| **Microservices** | Adapt `project-structure.md` per service, add service mesh rules |
| **Mobile (Flutter/RN)** | Adapt frontend rules, add mobile-specific accessibility/testing |

**To adapt:** Edit `project-structure.md` and `4-verify.md` to match your project layout.

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for the Developer Community
</p>
