---
name: supply-chain-security
description: >-
  SBOM generation, CVE scanning, supply chain attack detection, license
  compliance, dependency pinning, and artifact verification.
---

# Supply Chain Security Principles

Guidelines for securing the software supply chain.

## When to Invoke
- Auditing project dependencies
- Setting up CVE scanning in CI/CD
- License compliance review
- Responding to supply chain vulnerability disclosures

## Dependency Security

### CVE Scanning

| Language | Tool | Command |
|---|---|---|
| Go | `govulncheck` | `govulncheck ./...` |
| Rust | `cargo audit` | `cargo audit` |
| Python | `pip-audit` | `pip-audit` |
| Node.js | `npm audit` | `npm audit` |
| Java | OWASP Dependency-Check | `mvn dependency-check:check` |
| .NET | Built-in | `dotnet list package --vulnerable` |
| Ruby | `bundle audit` | `bundle audit check --update` |
| PHP | `composer audit` | `composer audit` |

### Scanning Frequency
- **Every CI run** — fail build on critical/high CVEs
- **Weekly scheduled scan** — catch newly disclosed vulnerabilities
- **On dependency update** — verify new version is clean

## SBOM (Software Bill of Materials)

### Generation
```bash
# CycloneDX format (recommended)
# Go
cyclonedx-gomod mod -json -output sbom.json

# Node.js
npx @cyclonedx/cyclonedx-npm --output-file sbom.json

# Python
cyclonedx-py poetry --format json -o sbom.json
```

### Usage
- Attach SBOM to releases
- Track all transitive dependencies
- Enable downstream vulnerability analysis

## License Compliance

### Risk Levels
| License | Risk | Action |
|---|---|---|
| MIT, BSD, Apache 2.0 | Low | Permissive — generally safe |
| LGPL | Medium | Review linking requirements |
| GPL | High | Copyleft — may require source disclosure |
| AGPL | Critical | Network copyleft — consult legal |
| No license | Critical | Cannot use — no rights granted |

### Automation
- Use `license-checker` (Node.js), `pip-licenses` (Python), `cargo-license` (Rust)
- Maintain allowlist/denylist of approved licenses
- Fail CI on disallowed licenses

## Supply Chain Attack Prevention

1. **Lock files committed** — `package-lock.json`, `go.sum`, `Cargo.lock`, `poetry.lock`
2. **Pin exact versions** in production — no floating ranges
3. **Verify checksums** — lock files contain integrity hashes
4. **Review new dependencies** — check maintainer, downloads, last commit, open issues
5. **Minimal dependencies** — each dep = increased attack surface
6. **Signed commits and releases** — verify artifact provenance

## Related
- Dependency Management Principles @.agents/rules/dependency-management-principles.md
- Security Principles .agents/rules/security-principles.md
- Security Mandate .agents/rules/security-mandate.md
