# TypeScript Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is TypeScript (Node.js, Vue, React, etc.).

---

## Type Safety

- [ ] **No explicit `any`** — use `unknown`, generics `<T>`, or specific types
- [ ] **No `@ts-ignore`** — use `@ts-expect-error` with explanatory comment if truly needed
- [ ] **No non-null assertions (`!`) without safety comment** — add null guard or explain why it's safe
- [ ] **`strict: true`** in `tsconfig.json` (or all strict sub-flags enabled)
- [ ] **No `as` type assertions** unless narrowing from `unknown` after runtime check

### Correct Patterns

```typescript
// ❌ any — opaque, unsafe
function parse(data: any): User { ... }

// ✅ unknown with type guard
function parse(data: unknown): User {
  if (!isUser(data)) throw new ValidationError("Invalid user data");
  return data;
}

// ❌ Non-null assertion without explanation
const name = user!.name;

// ✅ Guard check
if (!user) throw new Error("User is required");
const name = user.name;
```

---

## Error Handling

- [ ] **No empty `catch {}` blocks** — handle, log, or re-throw
- [ ] **All `fetch`/HTTP calls** have error handling for network failures AND non-2xx status codes
- [ ] **All `async` functions** that are fire-and-forget have explicit `.catch()` handlers
- [ ] **Error boundaries** exist for component trees (React `ErrorBoundary`, Vue `onErrorCaptured`)

### Correct Patterns

```typescript
// ❌ Empty catch
try { await api.createTask(task); } catch {}

// ✅ Explicit handling
try {
  await api.createTask(task);
} catch (error) {
  logger.error('create_task_failed', { taskId: task.id, error });
  throw error;
}

// ❌ Unhandled fetch
const data = await fetch('/api/tasks').then(r => r.json());

// ✅ Full handling
const response = await fetch('/api/tasks');
if (!response.ok) {
  throw new ApiError(`Fetch failed: ${response.status}`, response);
}
const data = await response.json();
```

---

## Resource Cleanup

- [ ] **`setInterval`/`setTimeout`** — cleared on component unmount (`onUnmounted` / `useEffect` cleanup)
- [ ] **Event listeners** — removed on component unmount
- [ ] **Subscriptions** (RxJS, WebSocket, EventEmitter) — unsubscribed on unmount
- [ ] **`AbortController`** — used for cancelable fetch requests, aborted on unmount

### Correct Patterns

```typescript
// Vue
const timerId = ref<ReturnType<typeof setInterval>>();
onMounted(() => { timerId.value = setInterval(poll, 5000); });
onUnmounted(() => { if (timerId.value) clearInterval(timerId.value); });

// React
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, []);
```

---

## Vue-Specific (when applicable)

- [ ] **Pinia stores** destructured with `storeToRefs()` — not plain destructuring
- [ ] **No `v-if` + `v-for` on the same element** — use `<template v-for>` wrapper
- [ ] **`key` attribute** on all `v-for` loops — stable, unique identifiers
- [ ] **`defineProps` / `defineEmits`** properly typed (no `any`)
- [ ] **Composables** return `ref`/`computed` (reactive), not plain values

### Correct Patterns

```typescript
// ❌ Loses reactivity
const { tasks } = useTaskStore();

// ✅ Preserves reactivity
const { tasks } = storeToRefs(useTaskStore());
```

---

## Observability

- [ ] **No `console.log` / `console.error`** in production code — use structured logger
- [ ] **No string interpolation in log messages** — use structured key-value pairs
- [ ] **API client** uses centralized error logging, not scattered try/catch blocks

---

## Security

- [ ] **No `innerHTML`** with unsanitized user input — use `textContent` or DOMPurify
- [ ] **No `eval()` or `new Function()`** — refactor to avoid dynamic code execution
- [ ] **No hardcoded API URLs or secrets** — use `import.meta.env` or environment variables
- [ ] **All user input validated** at API boundary (Zod, Joi, or manual validation)

---

## Static Analysis

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] ESLint passes with zero errors (including framework-specific plugins)
- [ ] No `// eslint-disable` without explanatory comment

---

## References
- TypeScript Idioms and Patterns @typescript-idioms-and-patterns.md
- Vue Idioms and Patterns @vue-idioms-and-patterns.md
- Security Principles @security-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
