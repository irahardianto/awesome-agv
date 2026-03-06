---
trigger: always_on
---

## Documentation Principles

### Self-Documenting Code

**Clear naming reduces need for comments:**

- Code shows WHAT is happening  
- Comments explain WHY it's done this way

**When to comment:**

- Complex business logic deserves explanation  
- Non-obvious algorithms (explain approach)  
- Workarounds for bugs (link to issue tracker)  
- Performance optimizations (explain trade-offs)

### Documentation Levels

1. **Inline comments:** Explain WHY for complex code  
2. **Function/method docs:** API contract (parameters, returns, errors)  
3. **Module/package docs:** High-level purpose and usage  
4. **README:** Setup, usage, examples  
5. **Architecture docs:** System design, component interactions, use valid mermaid diagram

### Related Principles
- Core Design Principles @core-design-principles.md
- Code Organization Principles @code-organization-principles.md
