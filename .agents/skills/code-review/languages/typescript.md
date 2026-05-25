# TypeScript Anti-Patterns (Auto-Fail)

> **Load this file** during code reviews of TypeScript/Vue code. Patterns listed here are **immediate findings** — no judgment needed. If the pattern exists, it is a finding.

---

## Auto-Fail Table

| Pattern | Severity | Tag | Correct Fix |
|---|---|---|---|
| `any` type usage (explicit) | Major | `[ERR]` | Use specific type, `unknown`, or generic `<T>` |
| `// @ts-ignore` without rationale | Critical | `[ERR]` | Fix the type error; use `@ts-expect-error` with comment if truly needed |
| `innerHTML` with unsanitized input | Critical | `[SEC]` | Use `textContent` or sanitize with DOMPurify |
| `eval()` or `new Function()` | Critical | `[SEC]` | Refactor to avoid dynamic code execution |
| Empty `catch {}` block | Critical | `[ERR]` | Handle, log, or re-throw the error |
| `fetch`/`axios` without error handling | Major | `[ERR]` | Wrap in try/catch, handle HTTP error status codes |
| Missing `key` in `v-for` / `.map()` renders | Major | `[ERR]` | Add stable, unique `:key` attribute |
| `console.log` / `console.error` in production code | Major | `[OBS]` | Use structured logger (or remove debug logs) |
| Destructured Pinia store without `storeToRefs` | Major | `[ERR]` | Use `const { x } = storeToRefs(useMyStore())` |
| `v-if` + `v-for` on the same element | Major | `[ERR]` | Wrap in `<template v-for>` with `v-if` on child |
| Raw `fetch`/`axios` outside centralized API client | Major | `[ARCH]` | Use the project's API client module |
| Hardcoded API URLs or secrets | Critical | `[SEC]` | Use environment variables via `import.meta.env` |
| `setTimeout`/`setInterval` without cleanup | Major | `[RES]` | Clear in `onUnmounted` / `useEffect` cleanup |
| Non-null assertion `!` without comment | Major | `[ERR]` | Add guard check or explain with comment why it's safe |

---

## Detection Commands

Use these grep patterns to scan for anti-patterns before manual review:

```bash
# Explicit 'any' type usage
grep -rn ': any' --include='*.ts' --include='*.vue' | grep -v 'node_modules' | grep -v '.d.ts'

# @ts-ignore without rationale
grep -rn '@ts-ignore' --include='*.ts' --include='*.vue' | grep -v 'node_modules'

# innerHTML usage
grep -rn 'innerHTML' --include='*.ts' --include='*.vue' | grep -v 'node_modules'

# eval usage
grep -rn 'eval(' --include='*.ts' --include='*.vue' | grep -v 'node_modules'

# Empty catch blocks
grep -rn 'catch.*{' --include='*.ts' --include='*.vue' -A1 | grep -B1 '^\s*}' | grep -v 'node_modules'

# console.log in production code
grep -rn 'console\.\(log\|error\|warn\|debug\)' --include='*.ts' --include='*.vue' | grep -v 'node_modules' | grep -v '.spec.' | grep -v '.test.'

# Pinia destructuring without storeToRefs
grep -rn 'const {.*} = use.*Store()' --include='*.ts' --include='*.vue' | grep -v 'storeToRefs' | grep -v 'node_modules'

# v-if + v-for on same element
grep -rn 'v-for.*v-if\|v-if.*v-for' --include='*.vue' | grep -v 'node_modules'

# Hardcoded localhost / API URLs
grep -rn 'http://localhost\|https://api\.' --include='*.ts' --include='*.vue' | grep -v 'node_modules' | grep -v '.env' | grep -v '.spec.' | grep -v '.test.'

# Non-null assertion
grep -rn '!\.' --include='*.ts' | grep -v 'node_modules' | grep -v '.d.ts' | grep -v '!=='
```

---

## Correct Patterns (Reference)

### Type Safety

```typescript
// ❌ any — opaque, unsafe
function parse(data: any): User { ... }

// ✅ unknown — forces type narrowing
function parse(data: unknown): User {
    if (!isUser(data)) throw new ValidationError("Invalid user data");
    return data;
}

// ✅ Generic — preserves caller's type
function first<T>(items: T[]): T | undefined {
    return items[0];
}
```

### Error Handling

```typescript
// ❌ Empty catch — silently swallows errors
try {
    await api.createTask(task);
} catch {}

// ❌ Unhandled fetch
const response = await fetch("/api/tasks");
const data = await response.json();

// ✅ Full error handling
try {
    const response = await api.createTask(task);
    if (!response.ok) {
        throw new ApiError(`Create failed: ${response.status}`, response);
    }
    return await response.json();
} catch (error) {
    logger.error("create_task_failed", { error, taskId: task.id });
    throw error;
}
```

### Vue Reactivity

```typescript
// ❌ Loses reactivity — x is a plain value snapshot
const { tasks, isLoading } = useTaskStore();

// ✅ Preserves reactivity via storeToRefs
const store = useTaskStore();
const { tasks, isLoading } = storeToRefs(store);

// Actions don't need storeToRefs — they're not reactive
const { fetchTasks, createTask } = store;
```

### Resource Cleanup

```typescript
// ❌ Timer leak — never cleared
onMounted(() => {
    setInterval(pollStatus, 5000);
});

// ✅ Cleanup on unmount
const timerId = ref<ReturnType<typeof setInterval>>();

onMounted(() => {
    timerId.value = setInterval(pollStatus, 5000);
});

onUnmounted(() => {
    if (timerId.value) clearInterval(timerId.value);
});
```

### Centralized API Client

```typescript
// ❌ Raw fetch scattered across components
const resp = await fetch("http://localhost:3000/api/tasks");

// ✅ Centralized client with base URL, auth, error handling
import { apiClient } from "@/platform/api-client";
const tasks = await apiClient.get<Task[]>("/tasks");
```

---

## References
- TypeScript Idioms and Patterns @typescript-idioms-and-patterns.md
- Vue Idioms and Patterns @vue-idioms-and-patterns.md
- Security Principles @security-principles.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
