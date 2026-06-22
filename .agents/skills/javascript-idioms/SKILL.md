---
paths:
  - "**/*.js"
  - "**/*.mjs"
  - "**/*.cjs"
---

## JavaScript Idioms and Patterns

Modern JavaScript (ES2024+) rewards modules, async/await, and functional patterns. Idiomatic JS = strict mode, modular, well-tested. When TypeScript is available, prefer it — see `typescript-idioms`.

> Scope: Plain JavaScript idioms. For TypeScript-specific patterns, load `@.agents/skills/typescript-idioms/SKILL.md`.

### Modern Features

1. **ES modules over CommonJS:**
   ```javascript
   // ✅ ESM
   import { createTask } from './task-service.js';
   export function handler(req, res) { ... }

   // ❌ CommonJS (legacy)
   const { createTask } = require('./task-service');
   ```

2. **`const` by default, `let` when reassignment needed, never `var`.**

3. **Optional chaining and nullish coalescing:**
   ```javascript
   const title = task?.title ?? 'Untitled';
   const score = config?.scoring?.default ?? 0;
   ```

4. **Destructuring for clean parameter handling:**
   ```javascript
   function createTask({ title, priority = 'medium', tags = [] }) { ... }
   ```

5. **`structuredClone`** for deep copies (not `JSON.parse(JSON.stringify())`).

### Async/Await

1. **`async`/`await` over raw promises:**
   ```javascript
   // ✅
   const user = await fetchUser(id);
   const tasks = await fetchTasks(user.id);

   // ❌ Promise chains for sequential ops
   fetchUser(id).then(user => fetchTasks(user.id)).then(tasks => ...);
   ```

2. **`Promise.all` for parallel I/O:**
   ```javascript
   const [user, tasks] = await Promise.all([fetchUser(id), fetchTasks(id)]);
   ```

3. **Always handle promise rejections** — never unhandled.

### Error Handling

> For universal error handling principles, see `.agents/rules/error-handling-principles.md`. Below: language-specific patterns only.

1. **Domain error classes:**
   ```javascript
   class DomainError extends Error {
       constructor(message) { super(message); this.name = this.constructor.name; }
   }
   class NotFoundError extends DomainError {
       constructor(resource, id) {
           super(`${resource} '${id}' not found`);
           this.resource = resource;
           this.resourceId = id;
       }
   }
   ```

2. **Never `catch` without handling.** Empty catch blocks are forbidden.

### Naming

1. **camelCase** for functions, variables. **PascalCase** for classes.
2. **UPPER_SNAKE_CASE** for constants.
3. **Prefix booleans**: `isActive`, `hasPermission`, `canEdit`.

### Testing

Vitest or Jest. Testing Library for DOM.

### Formatting and Static Analysis

| Tool | Purpose | Command |
|---|---|---|
| Prettier | Formatting | `npx prettier --write .` |
| ESLint | Linting | `npx eslint .` |
| `npm audit` | CVE scanning | `npm audit` |

### Related
- TypeScript Idioms @.agents/skills/typescript-idioms/SKILL.md
- Code Idioms and Conventions .agents/rules/code-idioms-and-conventions.md
- Testing Strategy .agents/rules/testing-strategy.md
