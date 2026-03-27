---
trigger: model_decision
description: When writing Vue 3 code, working on Vue components, using Pinia stores, or building Vue composables
---

## Vue Idioms and Patterns

### Core Philosophy

Vue 3 Composition API is the default for all new code. `<script setup>` is the canonical syntax. Think in terms of reactive *data flows*, not component lifecycle hooks. Composables (`use*` functions) are the primary unit of logic reuse.

> **Scope:** This file covers Vue 3 *coding idioms* for components, stores, and composables. For TypeScript type system patterns, see `typescript-idioms-and-patterns.md`. For file and folder layout, see `project-structure-vue-frontend.md`. For test naming, see `testing-strategy.md`. For logging, see `logging-and-observability-principles.md`.

---

### `<script setup>` — The Only Style

Always use `<script setup lang="ts">`. Never use the Options API or the class-style component pattern for new code.

```vue
<!-- ✅ Canonical style -->
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{ title: string; count?: number }>();
const emit = defineEmits<{ 'update:count': [value: number] }>();

const doubled = computed(() => (props.count ?? 0) * 2);
</script>

<!-- ❌ Options API — do not use for new components -->
<script lang="ts">
export default { props: { title: String }, ... }
</script>
```

---

### Reactivity: `ref` vs `reactive`

| Use          | When                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| `ref<T>()`   | Primitives, single values, values that may be reassigned                           |
| `reactive()` | Plain objects where you always access properties (never reassign the whole object) |
| `readonly()` | Expose state that must not be mutated outside its owner                            |

```typescript
// ✅ ref for primitives and replaceable objects
const count = ref(0);
const user = ref<User | null>(null);
user.value = fetchedUser; // reassignment is fine

// ✅ reactive for objects where you destructure properties
const form = reactive({ title: '', priority: 'medium' });

// ❌ Never destructure a reactive object — reactivity is lost
const { title } = form; // title is now a plain string, NOT reactive
// ✅ Use toRefs if you must destructure
const { title } = toRefs(form);
```

---

### Computed Properties

1. **Use `computed` for all derived state** — never recompute in the template
   ```typescript
   // ✅ Cached, reactive
   const filteredTasks = computed(() =>
       tasks.value.filter(t => t.status === activeFilter.value)
   );

   // ❌ Recomputes on every render
   // <template>{{ tasks.filter(t => t.status === filter) }}</template>
   ```

2. **Never cause side effects inside `computed`** — computed must be pure
   ```typescript
   // ❌ Side effect in computed
   const count = computed(() => {
       taskStore.logAccess(); // NO — this is a side effect
       return tasks.value.length;
   });
   ```

3. **Use writable computed for two-way bindings**
   ```typescript
   const modelValue = computed({
       get: () => props.modelValue,
       set: (val) => emit('update:modelValue', val),
   });
   ```

---

### Watch Strategy

Use the most precise watcher for the situation — over-watching is a performance and correctness problem.

| Watcher       | Use When                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `watchEffect` | Side effect that should re-run whenever any of its reactive dependencies change; auto-tracks dependencies |
| `watch`       | You need the old value, lazy execution, or want to watch a specific source explicitly                     |
| `computed`    | You need a synchronous derived value (prefer this over `watch` for transformation)                        |

```typescript
// ✅ watchEffect — auto-tracks dependencies
watchEffect(() => {
    document.title = `Tasks (${count.value})`;
});

// ✅ watch — explicit source, has old value
watch(userId, async (newId, oldId) => {
    if (newId !== oldId) await loadUser(newId);
}, { immediate: true });

// ❌ Avoid using watch just for computed values
watch(tasks, () => { filteredCount.value = tasks.value.filter(...).length; });
// ✅ Use computed instead
const filteredCount = computed(() => tasks.value.filter(...).length);
```

---

### Pinia Stores

> The store directory structure is defined in `project-structure-vue-frontend.md`. This section covers Pinia coding idioms.

1. **Use the Setup Store API** (not Options API) for new stores
   ```typescript
   // task/store/task.store.ts
   export const useTaskStore = defineStore('task', () => {
       // State
       const tasks = ref<Task[]>([]);
       const isLoading = ref(false);

       // Getters (computed)
       const completedTasks = computed(() =>
           tasks.value.filter(t => t.status === 'done')
       );

       // Actions
       async function loadTasks() {
           isLoading.value = true;
           try {
               tasks.value = await taskAPI.getTasks();
           } finally {
               isLoading.value = false;
           }
       }

       return { tasks, isLoading, completedTasks, loadTasks };
   });
   ```

2. **Never mutate store state from outside the store**
   ```typescript
   // ❌ Direct mutation from a component
   const store = useTaskStore();
   store.tasks.push(newTask); // NO

   // ✅ Call an action
   await store.addTask(newTask);
   ```

3. **Inject the API dependency — never import it directly inside the store**
   ```typescript
   // ✅ Receives the API interface — testable with createTestingPinia + mock API
   export const useTaskStore = defineStore('task', () => {
       const api = inject<TaskAPI>(TASK_API_KEY);
       if (!api) throw new Error('[TaskStore] TASK_API_KEY not provided — ensure app.provide() is called before store access');
       // ...
   });
   ```

4. **Use `storeToRefs` when destructuring a store in components**
   ```typescript
   // ✅ Preserves reactivity
   const { tasks, isLoading } = storeToRefs(useTaskStore());
   const { loadTasks } = useTaskStore(); // actions don't need storeToRefs
   ```

---

### Composables (`use*` Functions)

Composables are the Vue equivalent of custom hooks — self-contained, reusable units of reactive logic.

1. **Naming: always prefix with `use`**
   - `useTaskFilters`, `useAuth`, `usePagination`

2. **Return reactive refs, not raw values**
   ```typescript
   // ✅ Caller can use returned values reactively
   function useCounter(initial = 0) {
       const count = ref(initial);
       const increment = () => count.value++;
       return { count, increment };
   }

   // ❌ count is a plain number — not reactive
   function useCounter() {
       let count = 0;
       return { count };
   }
   ```

3. **Always clean up side effects in `onUnmounted`**
   ```typescript
   function useWindowResize() {
       const width = ref(window.innerWidth);
       const handler = () => (width.value = window.innerWidth);

       onMounted(() => window.addEventListener('resize', handler));
       onUnmounted(() => window.removeEventListener('resize', handler)); // ✅ cleanup
       return { width };
   }
   ```

4. **Template refs with `useTemplateRef` (Vue 3.5+)** — type-safe, IDE-friendly replacement for `ref(null)`
   ```typescript
   // ✅ Vue 3.5+ — useTemplateRef provides fully typed access
   const inputEl = useTemplateRef<HTMLInputElement>('myInput');
   // <input ref="myInput" />

   // ❌ Old pattern (before 3.5) — less type-safe
   const inputEl = ref<HTMLInputElement | null>(null);
   ```

5. **Feature-specific composables live inside the feature directory** — global composables go in `src/composables/`. See `project-structure-vue-frontend.md`.

---

### Component Design

1. **`defineProps` with TypeScript generics — no runtime validators for typed props**
   ```typescript
   const props = defineProps<{
       taskId: string;
       variant?: 'compact' | 'full';
   }>();

   // Defaults via withDefaults
   const props = withDefaults(defineProps<{ variant?: 'compact' | 'full' }>(), {
       variant: 'full',
   });
   ```

2. **`defineEmits` with typed event signatures**
   ```typescript
   const emit = defineEmits<{
       'update:modelValue': [value: string];
       'submit': [task: CreateTaskRequest];
   }>();
   ```

3. **`v-model` contract: always `modelValue` prop + `update:modelValue` emit**

4. **`defineExpose` to selectively expose methods to parent refs**
   ```typescript
   // Everything in <script setup> is private by default.
   // Use defineExpose only for intentional parent access (e.g., form.reset()).
   defineExpose({ reset, focus });
   // ❌ Without defineExpose: parent ref.value.reset() will be undefined
   ```

5. **`v-bind="$attrs"` and `inheritAttrs: false` for forwarding attributes**
   ```typescript
   // Avoid prop drilling for HTML attributes — forward them to the root element
   defineOptions({ inheritAttrs: false });
   // In template: <input v-bind="$attrs" />
   ```

6. **One concern per component** — if the template exceeds 100 lines (excluding boilerplate), extract a sub-component

7. **Never put business logic in the template** — computed and composables belong in `<script setup>`

---

### Template Patterns

1. **Always bind `:key` with stable, unique IDs in `v-for`** — never use index as key when list order can change
   ```html
   <!-- ✅ Stable key -->
   <TaskCard v-for="task in tasks" :key="task.id" :task="task" />

   <!-- ❌ Index key — causes rerender bugs when list reordered -->
   <TaskCard v-for="(task, i) in tasks" :key="i" :task="task" />
   ```

2. **Never combine `v-if` and `v-for` on the same element** — wrap with `<template>`
   ```html
   <!-- ✅ -->
   <template v-for="task in tasks" :key="task.id">
       <TaskCard v-if="task.visible" :task="task" />
   </template>
   ```

---

### Route Transitions

When using `<Transition>` or `<RouterView>` with transition effects, CSS frameworks that use `@layer` (Tailwind v4, Open Props, UnoCSS) can silently break SPA navigation by overriding transition properties in the cascade. This causes `transitionend` to never fire, permanently blocking the entering component.

1. **Avoid `mode="out-in"` when using `@layer`-based CSS frameworks** — the leaving component's `transitionend` event may never fire, blocking the entering component indefinitely. Use simultaneous transitions instead:
   ```html
   <!-- ❌ Dangerous with @layer CSS frameworks -->
   <Transition name="fade" mode="out-in">
     <component :is="Component" />
   </Transition>

   <!-- ✅ Safe: simultaneous leave/enter, always mounts new component -->
   <Transition name="fade">
     <component :is="Component" :key="$route.path" />
   </Transition>
   ```

2. **Always bind `:key="$route.path"`** on dynamic `<component>` inside `<Transition>` — forces Vue to treat each route as a distinct component instance, ensuring proper enter/leave lifecycle

3. **Use `!important` on route transition CSS classes** — guarantees transition properties win the `@layer` cascade:
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
   ```

4. **Give the transition parent `position: relative`** — contains the absolutely-positioned leaving element during the simultaneous transition overlap

> For full diagnosis steps when a transition-stuck blank screen occurs, see the Debugging Protocol's [Frontend module](file:///home/irahardianto/works/projects/awesome-agv/.agents/skills/debugging-protocol/languages/frontend.md) § CSS × Animation.

---

### Testing

> Test naming and pyramid proportions are defined in `testing-strategy.md`. This section covers Vue-specific tooling.

1. **Use `createTestingPinia` to stub stores in component tests**
   ```typescript
   import { vi } from 'vitest';

   const wrapper = mount(TaskView, {
       global: {
           plugins: [createTestingPinia({ createSpy: vi.fn })],
       },
   });
   ```

2. **Test component behaviour, not implementation details** — query by accessible role, not CSS class

3. **Test stores independently** — use `setActivePinia(createPinia())` in store unit tests

---

### Linting and Type Checking

| Tool                | Purpose                     |
| ------------------- | --------------------------- |
| `vue-tsc --noEmit`  | Full-template type checking |
| `eslint-plugin-vue` | Vue-specific lint rules     |
| `prettier`          | Canonical formatting        |

See `code-completion-mandate.md` for exact commands.

---

### Related Principles
- Code Idioms and Conventions @code-idioms-and-conventions.md
- TypeScript Idioms and Patterns @typescript-idioms-and-patterns.md
- Project Structure — Vue Frontend @project-structure-vue-frontend.md
- Architectural Patterns — Testability-First Design @architectural-pattern.md
- Testing Strategy @testing-strategy.md
- Logging and Observability Principles @logging-and-observability-principles.md
