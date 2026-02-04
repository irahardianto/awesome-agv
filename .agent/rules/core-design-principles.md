---
trigger: always_on
---

## Core Design Principles

### SOLID Principles

**Single Responsibility Principle (SRP):**

- Each class, module, or function should have ONE and ONLY ONE reason to change  
- Generate focused, cohesive units of functionality  
- If explaining what something does requires "and", it likely violates SRP

**Open/Closed Principle (OCP):**

- Software entities should be open for extension but closed for modification  
- Design abstractions (interfaces, ports) that allow behavior changes without modifying existing code  
- Use composition and dependency injection to enable extensibility

**Liskov Substitution Principle (LSP):**

- Subtypes must be substitutable for their base types without altering program correctness  
- Inheritance hierarchies must maintain behavioral consistency  
- If substituting a subclass breaks functionality, LSP is violated

**Interface Segregation Principle (ISP):**

- Clients should not be forced to depend on interfaces they don't use  
- Create focused, role-specific interfaces rather than monolithic ones  
- Many small, cohesive interfaces > one large, general-purpose interface

**Dependency Inversion Principle (DIP):**

- Depend on abstractions (interfaces/ports), not concretions (implementations/adapters)  
- High-level modules should not depend on low-level modules; both should depend on abstractions  
- Core principle enabling Testability-First architecture

### Essential Design Practices

**DRY (Don't Repeat Yourself):**

- Eliminate code duplication through proper abstraction, shared utilities, composable functions  
- Each piece of knowledge should have single, authoritative representation  
- Don't duplicate logic, algorithms, or business rules

**YAGNI (You Aren't Gonna Need It):**

**CRITICAL:** Code maintainability always prevail

- Avoid implementing functionality before it's actually required  
- Don't add features based on speculation about future needs  
- Build for today's requirements, refactor when needs change

**KISS (Keep It Simple, Stupid):**

**CRITICAL:** Code maintainability always prevail

- Prefer simple(simple to maintain), straightforward solutions over complex, clever ones  
- Complexity should be justified by actual requirements, not theoretical flexibility  
- Simple code is easier to test, maintain, and debug

**Separation of Concerns:**

- Divide program functionality into distinct sections with minimal overlap  
- Each concern should be isolated in its own module or layer  

**Composition Over Inheritance:**

- Favor object composition and delegation over class inheritance for code reuse  
- Composition is more flexible and easier to test  
- Use interfaces/traits for polymorphism instead of deep inheritance hierarchies

**Principle of Least Astonishment:**

- Code should behave in ways that users and maintainers naturally expect  
- Avoid surprising or counterintuitive behavior  
- Follow established conventions and patterns

**User Experience vs Maintainability:**

- Both user experience AND code maintainability matter
- When they conflict, **prefer maintainable code** that can evolve
- Poor UX from clean code can be fixed; poor code from UX pressure becomes tech debt
- Maintainability enables future UX improvements
- Never sacrifice code quality for short-term UX gains