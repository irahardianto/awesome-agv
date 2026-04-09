# Vue 3 Frontend Design Patterns

> Load this module when building Vue 3 components with this skill. Covers `<script setup>` component structure, scroll animation composables, theme system, transition patterns, and reusable UI components.
>
> **Prerequisite:** Design tokens from `examples/design-tokens.css` must be in place first. All CSS variables here reference that file.

---

## Component Structure Convention

```vue
<script setup lang="ts">
// 1. Framework imports
import { ref, computed, onMounted } from 'vue'

// 2. Third-party imports (vueuse, etc.)
import { useIntersectionObserver } from '@vueuse/core'

// 3. Internal imports — use feature-relative paths
import type { CardItem } from './types'
import { useTheme } from '@/composables/useTheme'

// 4. Props & Emits — typed interfaces
interface Props {
  title: string
  items: CardItem[]
  variant?: 'default' | 'featured' | 'compact'
}
const props = withDefaults(defineProps<Props>(), { variant: 'default' })
const emit = defineEmits<{ select: [item: CardItem]; close: [] }>()

// 5. Composables
const { isDark } = useTheme()

// 6. Reactive state
const isVisible = ref(false)
const selectedItem = ref<CardItem | null>(null)

// 7. Computed
const cardClass = computed(() => [
  'card',
  `card--${props.variant}`,
  { 'card--visible': isVisible.value },
])

// 8. Methods
function handleSelect(item: CardItem) {
  selectedItem.value = item
  emit('select', item)
}

// 9. Lifecycle (always last before template)
onMounted(() => { /* setup */ })
</script>

<template>
  <article :class="cardClass">
    <h2 class="card__title">{{ title }}</h2>
    <ul role="list" class="card__items">
      <li
        v-for="item in items"
        :key="item.id"
        class="card__item"
        @click="handleSelect(item)"
      >
        {{ item.label }}
      </li>
    </ul>
  </article>
</template>

<style scoped>
/* Always scoped — never global from components */
.card {
  background: var(--card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
  transition: var(--transition-all-interactions);
}
.card--featured { box-shadow: var(--shadow-lg); border-color: var(--primary); }
.card__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  color: var(--text);
  margin-bottom: var(--space-4);
}
</style>
```

---

## Scroll Animation Composable

Place in `src/composables/useScrollReveal.ts`:

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

interface Options {
  threshold?: number
  rootMargin?: string
  once?: boolean
  delay?: number
}

export function useScrollReveal(options: Options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true, delay = 0 } = options

  const target = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => { isVisible.value = true }, delay)
          if (once) observer?.disconnect()
        } else if (!once) {
          isVisible.value = false
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(target.value)
  })

  onUnmounted(() => observer?.disconnect())

  return { target, isVisible }
}
```

```vue
<!-- Usage -->
<script setup lang="ts">
import { useScrollReveal } from '@/composables/useScrollReveal'
const { target, isVisible } = useScrollReveal({ delay: 100 })
</script>

<template>
  <section ref="target" :class="['section', { 'section--visible': isVisible }]">
    <slot />
  </section>
</template>

<style scoped>
.section {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity   0.6s var(--ease-out-expo),
    transform 0.6s var(--ease-out-expo);
}
.section--visible { opacity: 1; transform: translateY(0); }
</style>
```

---

## Theme System

Place in `src/composables/useTheme.ts`:

```typescript
import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark' | 'system'
const theme = ref<Theme>((localStorage.getItem('theme') as Theme) ?? 'system')
const isDark = ref(false)

export function useTheme() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

  function apply() {
    const resolved = theme.value === 'system'
      ? (systemDark.matches ? 'dark' : 'light')
      : theme.value
    isDark.value = resolved === 'dark'
    document.documentElement.dataset.theme = resolved
    localStorage.setItem('theme', theme.value)
  }

  watchEffect(apply)
  systemDark.addEventListener('change', apply)

  function toggle() { theme.value = isDark.value ? 'light' : 'dark' }

  return { theme, isDark, toggle }
}
```

CSS integration in `design-tokens.css`:
```css
[data-theme='light'] {
  --color-bg-l:      96%;
  --color-surface-l: 100%;
  --color-text-l:    12%;
}
[data-theme='dark'] {
  --color-bg-l:      8%;
  --color-surface-l: 13%;
  --color-text-l:    90%;
}
```

---

## Transition Patterns

### Page Transitions (Vue Router)

```vue
<!-- App.vue -->
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition ?? 'fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-standard);
}
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active {
  transition: transform var(--duration-moderate) var(--ease-out-expo);
}
.slide-enter-from { transform: translateX(32px); opacity: 0; }
.slide-leave-to   { transform: translateX(-16px); opacity: 0; }
</style>
```

### List Stagger (TransitionGroup)

```vue
<template>
  <TransitionGroup name="list" tag="ul" class="list">
    <li v-for="(item, i) in items" :key="item.id" :style="{ '--i': i }">
      {{ item.label }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-enter-active {
  transition: opacity 0.5s var(--ease-out-expo), transform 0.5s var(--ease-out-expo);
  transition-delay: calc(var(--i) * 60ms);
}
.list-enter-from { opacity: 0; transform: translateY(16px); }
.list-leave-active { transition: opacity 0.3s, transform 0.3s; position: absolute; }
.list-leave-to { opacity: 0; transform: translateX(-16px); }
.list-move { transition: transform 0.5s var(--ease-out-expo); }
</style>
```

---

## Reusable Button Component

```vue
<!-- src/components/ui/AppButton.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary', size: 'md', type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
    :aria-busy="loading"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--btn-height-md);
  padding: 0 var(--btn-padding-x);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  font-family: var(--font-body);
  white-space: nowrap;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: var(--transition-all-interactions);
  position: relative;
  overflow: hidden;

  &:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  &:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
}

.btn--primary {
  background: var(--primary); color: var(--on-primary); border-color: var(--primary);
  &:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  &:active { background: var(--primary-active); transform: translateY(0); }
}
.btn--secondary {
  background: var(--surface-raised); color: var(--text); border-color: var(--border-strong);
  &:hover { background: var(--bg-hover); transform: translateY(-1px); }
}
.btn--ghost {
  background: transparent; color: var(--text); border-color: transparent;
  &:hover { background: var(--bg-hover); }
}
.btn--danger {
  background: var(--color-error); color: #fff; border-color: var(--color-error);
  &:hover { filter: brightness(1.1); }
}

.btn--sm { height: var(--btn-height-sm); font-size: var(--text-xs); padding: 0 var(--space-3); }
.btn--lg { height: var(--btn-height-lg); font-size: var(--text-base); padding: 0 var(--space-6); }

.btn__spinner {
  width: 1em; height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
```

---

## Glassmorphism Card

High-impact effect for hero overlays and floating panels:

```css
/* In scoped <style> */
.glass-card {
  background: hsl(
    var(--color-surface-h) var(--color-surface-s) var(--color-surface-l) / 0.6
  );
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid hsl(var(--color-text-h) var(--color-text-s) var(--color-text-l) / 0.1);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--card-padding);
}
```

## Gradient Text (Use Sparingly — One Per Page)

```css
.gradient-text {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--primary); /* fallback */
}
```

---

## VueUse — Use These Instead of Custom Implementations

```typescript
import {
  useIntersectionObserver, // Scroll animations
  useWindowScroll,         // Navbar shrink on scroll
  usePreferredDark,        // OS dark mode
  useDebounceFn,           // Search inputs, resize handlers
  useMediaQuery,           // Responsive in JS
  useLocalStorage,         // Persisted prefs (theme)
  useClipboard,            // Copy-to-clipboard
  useEventListener,        // Typed event listeners with auto-cleanup
} from '@vueuse/core'

// Breakpoints in JS
const isMobile  = useMediaQuery('(max-width: 768px)')
const isTablet  = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
```

---

## Common Anti-Patterns

```vue
<!-- ❌ Inline styles bypass the token system -->
<div :style="{ color: '#ff6b6b', fontSize: '24px' }">

<!-- ✅ Use CSS custom property via class -->
<div class="highlight-title">

<!-- ❌ Unnamed transitions are hard to debug -->
<Transition>...</Transition>

<!-- ✅ Always name transitions -->
<Transition name="fade-up">...</Transition>

<!-- ❌ v-if inside v-for with expensive component -->
<div v-for="item in items" :key="item.id">
  <HeavyComponent v-if="item.active" />

<!-- ✅ Filter before rendering -->
<div v-for="item in activeItems" :key="item.id">
  <HeavyComponent />
```
