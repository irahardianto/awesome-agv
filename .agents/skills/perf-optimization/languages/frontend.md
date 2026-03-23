# Frontend Performance Profiling — Vue 3 + Vite + PWA

## Stack Context

| Layer | Tool | Version |
|---|---|---|
| Framework | Vue 3 (SFC + Composition API) | ^3.5 |
| State | Pinia | ^3.0 |
| Router | Vue Router | ^5.0 |
| Bundler | Vite | ^7.3 |
| CSS | Tailwind CSS (Vite plugin) | ^4.2 |
| PWA | vite-plugin-pwa (Workbox) | ^1.2 |
| Backend client | Supabase JS | ^2.99 |
| Build | vue-tsc + vite build | — |
| Tests | Vitest + jsdom | ^4.1 |

---

## Profiling Toolchain

### Build-Time Analysis

| Tool | Purpose | Command |
|---|---|---|
| Vite bundle visualizer | Chunk sizes, tree-shaking effectiveness | `npx vite-bundle-visualizer` (generates `stats.html`) |
| `vite build --report` | Build timing and chunk summary | `npx vite build 2>&1` |
| `source-map-explorer` | Trace bytes to source files | `npx source-map-explorer dist/assets/*.js` |
| `bundlephobia` | Check dependency size before adding | `npx bundlephobia <package-name>` |

**Quick bundle size check (no extra dependency needed):**

```bash
# Build and report chunk sizes
cd apps/frontend && npx vite build 2>&1 | grep -E "(dist/|\.js|\.css)" | sort -t'│' -k2 -rn
```

**Detailed analysis with rollup-plugin-visualizer:**

```bash
# Install temporarily and run
cd apps/frontend && npx vite-bundle-visualizer
# Opens stats.html in browser — shows treemap of every module
```

### Runtime Analysis (Chrome DevTools)

| Tab | What it measures | When to use |
|---|---|---|
| **Performance** | Frame rate, scripting, rendering, painting | Janky animations, slow interactions |
| **Lighthouse** | LCP, FID/INP, CLS, TTI, bundle size | Overall page health score |
| **Network** | Waterfall, asset sizes, cache status | Slow loads, unnecessary requests |
| **Memory** | Heap snapshots, allocation timeline | Memory leaks, growing detached DOM |
| **Coverage** | Used vs unused JS/CSS bytes | Dead code, over-imported libraries |

### Core Web Vitals

| Metric | Target | What it measures |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | How fast the main content appears |
| **INP** (Interaction to Next Paint) | < 200ms | How fast interactions respond |
| **CLS** (Cumulative Layout Shift) | < 0.1 | How much the layout shifts during load |
| **TTFB** (Time to First Byte) | < 800ms | Server response time |
| **FCP** (First Contentful Paint) | < 1.8s | How fast anything renders |

### Lighthouse CLI (Headless — for Scripted Analysis)

```bash
# Run Lighthouse from CLI (no browser GUI needed)
npx lighthouse http://localhost:4173 \
    --output=json \
    --output-path=./lighthouse-report.json \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance \
    --preset=desktop

# For mobile (default):
npx lighthouse http://localhost:4173 \
    --output=json \
    --output-path=./lighthouse-report.json \
    --chrome-flags="--headless --no-sandbox" \
    --only-categories=performance
```

**Agent-readable extraction:**

```bash
# Extract key metrics from Lighthouse JSON
cat lighthouse-report.json | node -e "
const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const a = r.audits;
console.log('| Metric | Score | Value |');
console.log('|---|---|---|');
['first-contentful-paint','largest-contentful-paint','total-blocking-time',
 'cumulative-layout-shift','speed-index','interactive'].forEach(k => {
  if(a[k]) console.log('| ' + a[k].title + ' | ' + (a[k].score*100) + ' | ' + a[k].displayValue + ' |');
});
"
```

---

## Vue/Vite-Specific Optimization Patterns

### Pattern: Vendor Chunk Splitting (Vite)

**Symptom:** Every deploy invalidates the entire JS bundle cache, including stable vendor libs (Vue, Supabase JS). See agnostic principle: *Artifact Partitioning by Change Frequency* in SKILL.md.

**Fix:** Add `manualChunks` to `vite.config.ts`:

```typescript
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor-vue': ['vue', 'vue-router', 'pinia'],
                'vendor-supabase': ['@supabase/supabase-js'],
            },
        },
    },
},
```

**Group by change frequency:**
- `vendor-vue`: framework runtime — changes only on major upgrades
- `vendor-supabase`: SDK/client — changes infrequently
- App code (auto): changes every deploy

**Verification:** After `vite build`, check `dist/assets/` for `vendor-vue-*.js` and `vendor-supabase-*.js` chunks.

### Pattern: Resource Hint Pipeline (HTML)

**Symptom:** Fonts load late because browser discovers them only after parsing CSS. See agnostic principle: *Dependency Discovery Parallelization* in SKILL.md.

**Fix:** Replace CSS `@import` with HTML `<link>` tags and add `preconnect` hints:

```html
<!-- In index.html <head> — BEFORE the CSS link -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...&display=swap">
```

Then remove the `@import url(...)` from your CSS file.

**Safety:** Only `preconnect` to domains used on every page load. For runtime-determined domains (e.g., Supabase URL from env vars), skip the hint — hardcoding would break across environments.

### Pattern: Route-Level Code Splitting

**Symptom:** Lighthouse reports a large initial JS bundle with low Coverage score. All routes are in a single chunk.

**Fix:** Use dynamic imports for route components in Vue Router:

```typescript
// ❌ Eager import — everything in one chunk
import SiraatView from '@/views/SiraatView.vue'

// ✅ Lazy route — separate chunk, loaded on navigation
const SiraatView = () => import('@/views/SiraatView.vue')
```

**Verification:** After build, check `dist/assets/` — each lazy route should produce a separate `.js` chunk.

### Pattern: Component Lazy Loading

**Symptom:** Heavy components (charts, editors, modals) are loaded even when not visible.

**Fix:** Use `defineAsyncComponent` for below-the-fold or conditionally-rendered components:

```typescript
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() =>
    import('@/features/analytics/HeavyChart.vue')
)
```

### Pattern: Pinia Store Hydration

**Symptom:** Multiple API calls for the same data on page load. Network waterfall shows redundant fetches.

**Fix:** Deduplicate fetches in Pinia stores with loading-state guards:

```typescript
const store = defineStore('lesson', () => {
    const data = ref<Lesson | null>(null)
    const loading = ref(false)

    async function fetch(id: string) {
        if (loading.value) return    // ← prevent double-fetch
        if (data.value?.id === id) return  // ← already have it
        loading.value = true
        try {
            data.value = await api.getLesson(id)
        } finally {
            loading.value = false
        }
    }

    return { data, loading, fetch }
})
```

### Pattern: Image Optimization

**Symptom:** Lighthouse flags large images (LCP degradation). Network shows uncompressed PNGs.

**Fix checklist:**
1. Use `<img loading="lazy">` for below-the-fold images
2. Use WebP/AVIF formats (Vite handles this with plugins)
3. Specify explicit `width` and `height` attributes (prevents CLS)
4. Use `<picture>` with `srcset` for responsive images

### Pattern: Watchers / Computed Overuse

**Symptom:** DevTools Performance tab shows repeated "Scripting" blocks during reactivity updates.

**Fix:**
- Prefer `computed` over `watch` — computed values are lazy and cached
- Use `watchEffect` only when side effects are truly needed
- Use `shallowRef` / `shallowReactive` for large objects that don't need deep reactivity

```typescript
// ❌ Deep reactive on a 1000-item array — Vue tracks every nested property
const items = ref<Item[]>([])

// ✅ Shallow — Vue only tracks the array reference, not individual items
const items = shallowRef<Item[]>([])
```

### Pattern: Virtual Scrolling for Long Lists

**Symptom:** Rendering > 100 DOM nodes causes jank. DevTools shows long "Rendering" and "Painting" phases.

**Fix:** Use virtual scrolling (only render visible items):

```bash
npm install @tanstack/vue-virtual
```

### Pattern: PWA Cache Strategy Audit

**Symptom:** Repeat visits are slow despite service worker. Network tab shows cache misses.

**Audit checklist:**
1. Verify `navigator.serviceWorker.controller` is active (DevTools → Application → Service Workers)
2. Check `Cache Storage` in DevTools — are the expected caches populated?
3. Verify `runtimeCaching` patterns in `vite.config.ts` match actual API URL patterns
4. Check `networkTimeoutSeconds` — too high means slow fallback to cache

### Pattern: Tailwind CSS Purging

**Symptom:** Large CSS bundle despite using Tailwind. Build output shows > 50KB CSS.

**Fix:** Tailwind v4 (your version) uses automatic content detection. Verify:
1. No `@import` of the full Tailwind CSS build in production
2. The `@tailwindcss/vite` plugin is used (it is — confirmed in your config)
3. No dynamic class names that prevent tree-shaking (e.g., `class={`text-${color}-500`}`)

---

## Vue/Vite-Specific Anti-Patterns

1. **Don't eagerly import all routes.** This defeats Vite's code splitting. Always use dynamic `() => import()` for route components.
2. **Don't use `v-if` + `v-for` on the same element.** `v-if` has higher priority in Vue 3 — use a `<template>` wrapper.
3. **Don't deep-watch large arrays.** Use `shallowRef` or `watch(() => arr.length)` to avoid O(n) reactivity tracking.
4. **Don't ignore `key` in `v-for`.** Missing keys force Vue to re-render entire lists instead of patching individual items.
5. **Don't inline large SVGs when they could be `<img>` references.** Inline SVGs increase HTML parse time and bundle size.
6. **Don't load Supabase JS in every component.** Import the singleton client from `supabaseClient.ts` — avoid creating multiple GoTrue instances.
7. **Don't use plain functions for reactive template expressions.** If `v-if="isVisible()"` calls a function, Vue re-executes it on every render cycle. Use `computed` instead — Vue caches the result and only re-runs when dependencies change.

---

## Irreducible Floors in Vue/Vite/Browser

| Cost | What it is | Why it's irreducible |
|---|---|---|
| Vue runtime | Reactivity system, virtual DOM diffing | Framework overhead — ~30KB min gzipped |
| Supabase JS | GoTrue + PostgREST client | Auth + API client — ~40KB min gzipped |
| TLS handshake | HTTPS connection setup | Network latency — mitigated by HTTP/2, preconnect |
| Font loading | WOFF2 download + layout shift | Use `font-display: swap` and preload critical fonts |
| Service Worker registration | SW parse + install on first visit | One-time cost per SW update |
| DNS resolution | Supabase API domain lookup | Use `<link rel="dns-prefetch">` |

---

## Data Extraction Scripts

Use the scripts in `scripts/` for automated profiling:

```bash
# Always-works bundle analysis (no Chrome needed) — start here
scripts/frontend-lighthouse.sh bundle ./apps/frontend

# Lighthouse Core Web Vitals (needs Chrome/Chromium)
scripts/frontend-lighthouse.sh lighthouse http://localhost:4173 desktop

# With custom timeout (default: 120s)
LIGHTHOUSE_TIMEOUT=60 scripts/frontend-lighthouse.sh lighthouse http://localhost:4173
```

> **Agent tip:** If Lighthouse hangs (common in headless/CI environments), the script
> auto-kills after the timeout and suggests bundle mode. Always start with `bundle` mode
> since it works everywhere and provides the most actionable data (chunk sizes, vendor
> splitting status, oversized chunk flags).

## Recommended Profiling Workflow

1. **Bundle analysis first:** Run `scripts/frontend-lighthouse.sh bundle ./apps/frontend` to check chunk sizes
2. **Lighthouse desktop + mobile:** Run `scripts/frontend-lighthouse.sh lighthouse <url> desktop` and default (mobile) — compare scores
3. **Runtime profiling:** Use Chrome DevTools Performance tab to record user flows (navigation, exercise completion)
4. **Memory:** Take heap snapshots before and after a user flow — diff for leaks (detached DOM, event listeners)
5. **Coverage:** Run Coverage tool — identify dead JS/CSS shipped to the client


---

## Post-Optimization Clean Sweep Checklist

After applying the main fixes, run this checklist to catch leftover issues.
This was codified from the FATH frontend session (2026-03-23).

### Template Reactivity
- [ ] All `v-if` / `v-show` conditions use `computed` refs, not plain function calls
- [ ] `v-for` lists use stable `:key` values (not array index)
- [ ] No plain functions in template expressions that could be `computed`

### Component Loading
- [ ] All routes use `() => import()` (lazy routes)
- [ ] Modals, drawers, and sheets use `defineAsyncComponent` (they are never visible on initial render)
- [ ] Heavy sub-components within lazy routes use `defineAsyncComponent` if they are conditionally rendered

### Store Health
- [ ] Stores used by multiple co-mounted views have a concurrent-fetch guard (`if (isLoading) return`)
- [ ] No `deep: true` watchers on large arrays — use `shallowRef` + explicit trigger
- [ ] Computed getters are used instead of methods for derived store state

### Bundle Health
- [ ] Vendor libraries are isolated into stable chunks (`manualChunks`)
- [ ] CSS `@import` statements for external stylesheets (fonts, etc.) are replaced with HTML `<link>` tags
- [ ] `<link rel="preconnect">` hints exist for all statically-known third-party origins
- [ ] Supabase JS is imported only once from a singleton module, not in individual components

### Build Verification
- [ ] `npx vite build` — clean output, no warnings
- [ ] `npx vitest run` — all tests pass
- [ ] `npx vue-tsc -b` — no type errors
- [ ] Build output diff — no unexpected chunk size regressions
