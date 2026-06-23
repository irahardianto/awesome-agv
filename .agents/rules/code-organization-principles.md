---
trigger: always_on
---

## Code Organization Principles

- Functions: single purpose, 10–50 lines, cyclomatic complexity < 10
- Testability: no tight coupling — see `architectural-pattern.md` for the I/O isolation rule

### Module Boundaries

One feature = one directory. Each module exposes a public API (exported symbols only). Internal implementation is private. Cross-module calls go through the public API only — never import internal files directly.

**Language-agnostic vertical slice template:**
```
/feature-name/
  public_api.{ext}       # Exported interface
  business.{ext}         # Pure logic
  store.{ext}            # I/O abstraction (interface/protocol/trait)
  store_impl.{ext}       # I/O production implementation
  store_mock.{ext}       # I/O test implementation
  test.{ext}             # Unit tests (mocked I/O)
  integration.test.{ext} # Integration tests (real I/O)
```

For language-specific directory layouts (Go, TypeScript, Vue, Flutter, Rust, Python), load the relevant idiom skill.

### Feature Interaction

Features interact by importing each other's **public API (Service/service layer) only** — never internal files. Dependencies are declared in the feature's constructor and wired in `main`. Only import Service, never internal implementation files.

### Avoid Circular Dependencies

If module A imports B and B imports A, extract shared code to a third module C. Circular dependencies indicate poor boundary definition — restructure before proceeding.
