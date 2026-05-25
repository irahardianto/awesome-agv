# TypeScript/Node.js Debugging Heuristics

> These heuristics supplement the universal debugging protocol in `SKILL.md`. They cover TypeScript/Node.js-specific symptoms, async debugging, and browser/server diagnostic tooling.

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| `TypeError: Cannot read properties of undefined` | Check optional chaining — missing `?.` or null guard |
| `Unhandled promise rejection` | Find the `await` without `try/catch` or `.catch()` |
| Memory leak / OOM | Chrome DevTools heap snapshot → compare 2 snapshots |
| Event loop blocked / slow responses | `--prof` or `clinic doctor` → find synchronous bottleneck |
| `ERR_MODULE_NOT_FOUND` | Check `tsconfig.json` `moduleResolution`, `paths`, and `exports` in `package.json` |
| Type error only in CI, not locally | Compare `tsconfig.json` `strict` settings, TS version mismatch |
| Vue reactivity not updating | Check `storeToRefs`, `ref` vs `reactive`, computed vs plain |
| `CORS error` in browser | Server-side issue — check response headers, not frontend code |
| Infinite re-render (React) | `useEffect` missing dependency or creating new objects each render |
| Test passes alone, fails in suite | Shared mutable state between tests — check module-level variables |

---

## Diagnostic Tools

### Node.js Inspector

```bash
# Debug a Node.js script
node --inspect-brk dist/server.js
# Then open chrome://inspect in Chrome

# Debug a test
node --inspect-brk node_modules/.bin/vitest run --single-thread

# Debug with VS Code — launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run", "--single-thread"],
  "console": "integratedTerminal"
}
```

### Async Stack Traces

```bash
# Enable long async stack traces (Node.js 16+, enabled by default)
node --async-stack-traces dist/server.js

# In Node.js 12-15, use:
node --enable-source-maps dist/server.js
```

### Memory Profiling

```bash
# Heap snapshot from running process
kill -USR2 $(pgrep -f "node dist/server")
# Or via Chrome DevTools → Memory → Take snapshot

# Track memory over time
node --max-old-space-size=512 --expose-gc dist/server.js

# Generate heap dump on OOM
node --max-old-space-size=512 --heap-prof dist/server.js
```

### TypeScript Compiler Diagnostics

```bash
# Type check without emitting (fast validation)
npx tsc --noEmit

# Verbose diagnostics (trace type resolution)
npx tsc --noEmit --traceResolution 2>&1 | head -100

# Show extended diagnostics (timing, memory)
npx tsc --noEmit --extendedDiagnostics

# Generate declaration files to verify public API types
npx tsc --declaration --emitDeclarationOnly
```

---

## Common TypeScript/Node.js Bugs and Fixes

### Unhandled Promise Rejection

**Symptom:** `UnhandledPromiseRejectionWarning` in logs, process may crash (Node.js 15+ exits by default).

**Diagnosis:**
```bash
# Find fire-and-forget promises (no await, no .catch)
grep -rn '\.then(' --include='*.ts' | grep -v '\.catch\|await\|return'

# Find async functions called without await
grep -rn 'async.*=>' --include='*.ts' -A2 | grep -v 'await'
```

**Common causes:**
1. **Missing `await`** — async function called but not awaited.
2. **Missing `.catch()`** on a Promise chain.
3. **Error in `setTimeout`/`setInterval` callback** — can't be caught by outer try/catch.

**Fix:**
```typescript
// ❌ Fire-and-forget — rejection crashes process
processTask(taskId);

// ✅ Awaited with error handling
try {
  await processTask(taskId);
} catch (error) {
  logger.error('process_task_failed', { taskId, error });
}

// ✅ If intentionally fire-and-forget, handle explicitly
processTask(taskId).catch(error => {
  logger.error('background_task_failed', { taskId, error });
});
```

### Vue Reactivity Not Updating

**Symptom:** UI doesn't reflect state changes. Data is correct in console but template doesn't re-render.

**Diagnosis checklist:**
1. Is the value a `ref`? Access with `.value` in script, without `.value` in template.
2. Is the Pinia store destructured without `storeToRefs`?
3. Is a new property added to a `reactive` object? (Vue 3 handles this, but check array mutations.)
4. Is `computed` vs plain variable? Plain variables don't trigger reactivity.

```typescript
// ❌ Loses reactivity — values are snapshots
const { tasks, isLoading } = useTaskStore();

// ✅ Preserves reactivity
const store = useTaskStore();
const { tasks, isLoading } = storeToRefs(store);

// ❌ Replacing reactive object doesn't trigger update
let state = reactive({ items: [] });
state = reactive({ items: newItems }); // New object, watchers lost

// ✅ Mutate existing reactive object
state.items = newItems;
```

### Memory Leak in Event Listeners / Timers

**Symptom:** Memory grows over time. Heap snapshot shows detached DOM nodes or growing closure count.

**Diagnosis:**
```typescript
// Take two heap snapshots 60 seconds apart in Chrome DevTools
// Compare → sort by "# Delta" → look for growing object types
```

**Common causes:**
1. **Event listeners not removed** on component unmount.
2. **`setInterval`/`setTimeout`** not cleared.
3. **Closures capturing large scope** in long-lived callbacks.
4. **Subscriptions** (RxJS, EventEmitter) not unsubscribed.

**Fix (Vue):**
```typescript
const timerId = ref<ReturnType<typeof setInterval>>();

onMounted(() => {
  timerId.value = setInterval(pollStatus, 5000);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (timerId.value) clearInterval(timerId.value);
  window.removeEventListener('resize', handleResize);
});
```

**Fix (React):**
```typescript
useEffect(() => {
  const timer = setInterval(pollStatus, 5000);
  window.addEventListener('resize', handleResize);

  return () => {  // ✅ Cleanup function
    clearInterval(timer);
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### Import / Module Resolution Failures

**Symptom:** `ERR_MODULE_NOT_FOUND`, `Cannot find module`, or type errors on imports that clearly exist.

**Diagnosis:**
```bash
# Check tsconfig resolution
npx tsc --noEmit --traceResolution 2>&1 | grep "Module name" | head -20

# Verify package.json exports field
node -e "console.log(require.resolve('@myorg/shared'))"

# Check if .js extension is needed (ESM)
grep '"type": "module"' package.json
```

**Common causes:**
1. **Missing `.js` extension** in ESM imports (TypeScript compiles `.ts` → `.js` but doesn't rewrite import paths).
2. **`moduleResolution: "node"` vs `"node16"` vs `"bundler"`** — wrong setting for the runtime.
3. **`paths` in tsconfig** without corresponding bundler aliases.
4. **Circular imports** — module partially initialized when accessed.

### Test Flakiness

**Diagnosis:**
```bash
# Run test in isolation to confirm it passes alone
npx vitest run --single-thread path/to/test.spec.ts

# Run all tests multiple times to reproduce
npx vitest run --single-thread --reporter=verbose 2>&1 | tee test-output.txt

# Check for shared state
grep -rn 'let\|var' --include='*.spec.ts' | grep -v 'const\|inside\|function'
```

**Common causes:**
1. **Shared mutable state** — module-level `let` variables modified across tests.
2. **Missing mock cleanup** — `vi.restoreAllMocks()` not called in `afterEach`.
3. **Timing-dependent assertions** — `setTimeout` in code under test without `vi.useFakeTimers()`.
4. **Port conflicts** — tests starting servers on fixed ports.

---

## Confidence Adjustments

| Observation | Confidence Change |
|---|---|
| Error appears only in strict mode / CI | +40% confidence in type safety issue |
| Heap snapshot delta shows specific growing type | +50% confidence in memory leak source |
| Issue reproduces with `--single-thread` but not parallel | +60% confidence in shared state |
| Vue template updates after `nextTick()` but not immediately | +50% confidence in reactivity issue |
| Error disappears when removing a specific `useEffect` | +40% confidence in effect-related bug |

---

## Related
- TypeScript Idioms and Patterns @typescript-idioms-and-patterns.md
- Vue Idioms and Patterns @vue-idioms-and-patterns.md
- Frontend Debugging @frontend.md (CSS, rendering, browser-specific issues)
- Error Handling Principles @error-handling-principles.md
