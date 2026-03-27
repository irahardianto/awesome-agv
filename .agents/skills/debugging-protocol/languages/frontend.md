# Frontend Debugging Module

Language-specific debugging guide for frontend projects (Vue 3, React, browser-based SPAs). Use alongside the main [Debugging Protocol](../SKILL.md).

---

## Toolchain Reference

| Tool | Purpose | When to Use |
|---|---|---|
| Chrome DevTools — **Console** | Runtime errors, warnings, `console.debug` traces | **Always first** — fastest signal |
| Chrome DevTools — **Network** | Request waterfall, response status, payload shape | Data not rendering, 401/403/500, CORS |
| Chrome DevTools — **Elements** | Computed styles, DOM structure, CSS specificity | Styling / layout issues |
| Chrome DevTools — **Performance** | Frame rate, scripting time, rendering phases | Jank, slow interactions |
| Chrome DevTools — **Application** | localStorage, sessionStorage, cookies, service workers | Auth state, cached flags, stale SW |
| Vue DevTools (browser extension) | Component tree, Pinia state, router history, event timeline | Vue-specific state/lifecycle issues |
| `router.afterEach` / `beforeEach` logging | Navigation guard execution trace | Routing bugs, blank screens, redirect loops |
| `onMounted` / `useEffect` logging | Component lifecycle confirmation | Component "never mounts" symptoms |
| `vite dev --force` | Force-clear Vite module cache | Stale build artifacts after dependency changes |
| `npx vue-tsc -b` | Full template type checking | Type errors that only surface at build time |

---

## Phase 1: Initialize Session — Frontend Context

Add these fields to the debugging session document:

```markdown
### Frontend Context
- **Framework version:** (e.g. Vue 3.5.x, React 19.x)
- **Bundler:** (e.g. Vite 7.x)
- **CSS framework:** (e.g. Tailwind v4, none)
- **State management:** (e.g. Pinia 3.x, Redux, Zustand)
- **Router:** (e.g. Vue Router 5.x, React Router 7.x)
- **Browser:** (exact version — behavior varies across engines)
- **PWA/Service Worker:** yes / no (stale caches are a common red herring)
- **Auth provider:** (e.g. Supabase Auth, Firebase Auth, custom JWT)
```

---

## Phase 3: Hypothesis Categories

Common frontend-specific hypothesis categories:

| Category | Example Hypotheses |
|---|---|
| **Routing & Navigation** | Guard blocks route; redirect loop between auth/onboarding; `router.replace()` resolves but component never mounts; stale `meta` on route definition |
| **State Management** | Pinia store holds stale data after auth change; double-fetch from co-mounted components; reactive loss from `const { x } = store` without `storeToRefs`; store initialized before auth resolves |
| **CSS × Animation** | `transitionend` event never fires due to `@layer` cascade; `mode="out-in"` blocks entering component indefinitely; animation stuck in leaving state; blank screen with zero console errors |
| **Data & Rendering** | Backend payload shape mismatch (missing field → `undefined` → silent `v-if` failure); wrong reactive access pattern (`v-if="fn()"` instead of `computed`); component renders before async data resolves |
| **Auth & Session** | Token expired but UI doesn't redirect; `localStorage` holds stale session after logout; race between auth state resolution and guard evaluation; middleware applies to wrong routes |

---

## Phase 4: Validation Task Patterns

### Routing & Navigation — Blank Screen After Navigation

**Symptom:** User navigates, router reports success, destination component never renders. Page is blank with zero console errors.

**Validation steps:**

1. **Confirm no component mount** — add lifecycle logging to the destination:
   ```javascript
   // Vue 3
   onMounted(() => console.debug('[TargetView] onMounted fired'));
   // React
   useEffect(() => console.debug('[TargetView] mounted'), []);
   ```
   If the mount log never fires but the router reports navigation complete → this is NOT a routing logic bug.

2. **Trace the guard chain** — add diagnostic logging:
   ```typescript
   router.beforeEach((to, from) => {
       console.debug(`[Router] beforeEach: ${from.path} → ${to.path}`);
   });
   router.afterEach((to) => {
       console.debug(`[Router] afterEach: arrived at ${to.path}`);
   });
   ```
   If `afterEach` fires but `onMounted` does not → suspect the **transition mechanism** (see CSS × Animation below).

3. **Check for redirect loops** — watch the URL bar or router logs for oscillating paths (e.g. `/login` → `/home` → `/onboarding` → `/login`).

4. **Verify auth state at guard time** — log the auth store's state inside each guard to confirm it's resolved (not still loading).

---

### State Management — Stale or Missing Data

**Symptom:** Component renders but shows stale data, or renders empty despite successful API call.

**Validation steps:**

1. **Inspect Pinia state via Vue DevTools** — check the store's current values. Is the data present?

2. **Check for destructuring reactivity loss:**
   ```typescript
   // ❌ Loses reactivity — x is a plain value snapshot
   const { tasks } = useTaskStore();
   // ✅ Preserves reactivity
   const { tasks } = storeToRefs(useTaskStore());
   ```

3. **Check for race conditions with auth:**
   ```typescript
   // The store action fires before auth resolves → API returns 401 → store stays empty
   // Fix: await auth resolution before first store fetch
   ```

4. **Check for duplicate fetches from co-mounted components:**
   - Open Network tab → filter by XHR → navigate to the page
   - If two identical requests appear → the store needs a loading-state guard

---

### CSS × Animation — Transition Stuck (Blank Screen)

> **This section subsumes the former `css-transition-pitfalls` skill.**

**Symptom:** Component "never mounts" after a route change. Blank screen with zero console errors. Works on hard refresh but recurs on SPA navigation. `router.afterEach` fires but `onMounted` does not.

#### The Anti-Pattern

```
User clicks link → Router navigates → Old component should leave → New component should enter
                                           ↓
                                    CSS framework's @layer rules
                                    override transition properties
                                           ↓
                                    transitionend event NEVER fires
                                           ↓
                                    SPA framework waits forever
                                           ↓
                                    New component NEVER mounts
                                           ↓
                                    BLANK SCREEN (no errors)
```

#### Why It's Hard to Catch

1. **No errors** — everything completes from the router's perspective
2. **Works on refresh** — hard refresh bypasses the SPA transition entirely
3. **Looks like a logic bug** — the natural instinct is to debug auth state, guards, or template conditionals
4. **Intermittent** — may only trigger on specific route pairs where the leaving component has conflicting animations

#### Affected SPA Frameworks

| SPA Framework | Transition Mechanism | Vulnerable Mode |
|---|---|---|
| **Vue 3** | `<Transition mode="out-in">` | `mode="out-in"` blocks enter until leave completes |
| **React** (Framer Motion) | `AnimatePresence mode="wait"` | `mode="wait"` blocks enter until exit completes |
| **React** (React Transition Group) | `SwitchTransition mode="out-in"` | Same pattern |
| **Svelte** | `transition:` directive with `|local` | Less common but possible |

#### CSS Frameworks That Can Cause This

| CSS Framework | Why |
|---|---|
| **Tailwind v4** | Uses `@layer theme, base, components, utilities` — unlayered styles (like Vue's transition classes) can be unexpectedly deprioritized |
| **Open Props** | Uses `@layer` for custom property organization |
| **Any framework using `@layer`** | The CSS Cascade spec gives layered styles lower priority than unlayered, BUT framework bundlers may re-layer your styles |

#### Validation Steps

1. **Confirm the symptom class** — add `onMounted` logging to the destination component. If mount log never fires but `afterEach` does → transition stuck.

2. **Rule out logic issues (time-box: 15 minutes):**
   - Navigation guard allows the route (check `afterEach` logging)
   - Auth state is correct at navigation time
   - No redirect loops

3. **Inspect the transition mechanism** — check your root layout for sequential transition modes:
   ```html
   <!-- Vue: look for mode="out-in" -->
   <Transition name="fade" mode="out-in">
   <!-- React Framer Motion: look for mode="wait" -->
   <AnimatePresence mode="wait">
   <!-- React Transition Group: look for mode="out-in" -->
   <SwitchTransition mode="out-in">
   ```
   If found → this is almost certainly the cause.

4. **Verify CSS layer interference:**
   ```bash
   # Check for @layer in built CSS
   grep -r "@layer" node_modules/tailwindcss/ | head -5
   grep -r "@import.*tailwindcss" src/
   # In browser DevTools: inspect the leaving element during transition
   # Look for: computed opacity, computed transition property
   ```

5. **Apply the fix — remove sequential transition mode:**
   ```html
   <!-- BEFORE (broken): sequential, depends on transitionend -->
   <Transition name="fade" mode="out-in">
     <component :is="Component" />
   </Transition>

   <!-- AFTER (fixed): simultaneous, always mounts new component -->
   <Transition name="fade">
     <component :is="Component" :key="$route.path" />
   </Transition>
   ```

   Update CSS to handle simultaneous leave/enter:
   ```css
   .fade-enter-active {
     transition: opacity 0.15s ease-in !important;
   }
   .fade-leave-active {
     transition: opacity 0.15s ease-out !important;
     position: absolute !important;
     width: 100% !important;
     top: 0 !important;
     left: 0 !important;
   }
   .fade-enter-from,
   .fade-leave-to {
     opacity: 0 !important;
   }
   /* Parent needs position:relative to contain the absolute element */
   #main-content {
     position: relative;
   }
   ```

   > **Why `!important`?** CSS `@layer` cascade can override your transition classes. `!important` guarantees your transition properties apply regardless of layer ordering.

#### Key Insight

> **When a component doesn't mount after navigation: suspect the transition mechanism FIRST, not the routing logic.** The router will report success even when the component never renders. This is counter-intuitive because the blank screen looks like a routing/auth problem, but it's actually a CSS/animation problem.

---

### Data & Rendering — Silent Template Failures

**Symptom:** Page renders but expected content is missing. No console errors. Data is present in the store.

**Validation steps:**

1. **Check for `v-if` on optional properties:**
   ```html
   <!-- Silent failure if exercise.options is undefined — v-if produces no error -->
   <div v-if="exercise.options.length > 0">
   <!-- Fix: optional chaining -->
   <div v-if="exercise.options?.length">
   ```

2. **Check for plain function calls in templates:**
   ```html
   <!-- ❌ Re-evaluates on every render cycle; may return inconsistent results -->
   <div v-if="isVisible()">
   <!-- ✅ Cached, reactive -->
   <div v-if="isVisibleComputed">
   ```

3. **Check for backend payload mismatches** — log the raw API response and compare field names/types against what the component expects. Common: `snake_case` from backend vs `camelCase` in frontend.

4. **Check for async rendering issues:**
   ```html
   <!-- Component renders before data arrives — shows empty state permanently -->
   <TaskCard :task="task" />
   <!-- Fix: guard with v-if -->
   <TaskCard v-if="task" :task="task" />
   ```

---

### Auth & Session — Redirect Loops and Ghost Sessions

**Symptom:** User gets stuck in a redirect loop between login, onboarding, and home pages. Or: user appears logged out despite having valid credentials.

**Validation steps:**

1. **Check localStorage for stale auth tokens:**
   ```javascript
   // In console
   Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase') || k.includes('token'));
   ```

2. **Verify auth state is resolved before guards run:**
   ```typescript
   router.beforeEach(async (to) => {
       console.debug('[Guard] authStore.isAuthenticated:', authStore.isAuthenticated);
       console.debug('[Guard] authStore.isLoading:', authStore.isLoading);
       // If isLoading is true here, the guard is racing the auth resolution
   });
   ```

3. **Check for circular guard logic:**
   - Guard A: "if not authenticated → redirect to /login"
   - Guard B: "if authenticated and not onboarded → redirect to /onboarding"
   - Guard C: "if on /onboarding and already onboarded → redirect to /home"
   - If the onboarding flag is stale or the database read is async → loop

4. **Test by clearing all storage and hard-refreshing:**
   ```javascript
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```
   If the issue resolves → the problem is stale cached state, not logic.

---

## Phase 6: Confidence Adjustments

| Evidence | Confidence Impact |
|---|---|
| `onMounted` log never fires but `afterEach` does | **High** — definitively a transition/rendering issue, not routing |
| DevTools Network shows no request fired | **High** — data never fetched (guard blocked, or fetch never called) |
| Vue DevTools shows correct Pinia state but UI is empty | **High** — template rendering bug (wrong `v-if`, missing reactivity) |
| Issue resolves on hard refresh but recurs on SPA nav | **High** — transition-stuck, service worker cache, or stale SPA state |
| `@layer` found in CSS framework and `mode="out-in"` is used | **Definitive** for transition-stuck diagnosis |
| Issue only appears on specific route pairs | **Medium-High** — likely CSS/animation interaction specific to the leaving component |
| Console shows no errors at all | **Medium** — rules out JS exceptions; narrows to CSS/template/state issues |

---

## Quick Reference: Symptom → First Action

| Symptom | First Action |
|---|---|
| Blank screen after navigation (no errors) | Add `onMounted` logging → if never fires, check `<Transition mode>` |
| Blank screen after navigation (console errors) | Read the error — usually a runtime exception in the entering component |
| Redirect loop (URL oscillates) | Log all guards with `beforeEach` → trace the loop pattern |
| Data present in store but not rendered | Check `v-if` conditions for undefined/null access; check for destructuring without `storeToRefs` |
| Component renders then immediately disappears | Check for a `watch` or `watchEffect` that re-triggers a navigation or state reset |
| API call fires twice | Check for co-mounted components both calling the same store action; add loading-state guard |
| Works locally but not in production | Check service worker cache; run `vite build` locally to reproduce; check env variables |
| Works on refresh but fails on SPA navigation | Suspect transition mechanism or stale component state from previous route |
| Auth state incorrect in guard | Log auth store state inside the guard; check if auth initialization is awaited before router starts |
| Styles not applying | Check CSS specificity vs `@layer` cascade; inspect computed styles in DevTools Elements tab |

---

## Related Principles
- Vue Idioms and Patterns @vue-idioms-and-patterns.md
- TypeScript Idioms and Patterns @typescript-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Logging and Observability Principles @logging-and-observability-principles.md
- Testing Strategy @testing-strategy.md
