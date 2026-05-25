# Flutter/Dart Self-Review Checklist

> **Load this file** after completing the universal self-review in `SKILL.md`, when the code under review is Flutter/Dart.

---

## Widget Architecture

- [ ] **No `setState` in complex widgets** (>50 lines) — use Riverpod, Bloc, or similar
- [ ] **Widgets are small** (<100 lines) — extract child widgets for composition
- [ ] **`const` constructors** used wherever possible — enables widget caching
- [ ] **Stateless widgets preferred** over StatefulWidget when no local state is needed
- [ ] **No business logic in widgets** — extract to providers, services, or use cases

---

## State Management (Riverpod)

- [ ] **Providers for all shared state** — not widget-level `setState`
- [ ] **`ref.watch`** in `build()` — not `ref.read` (unless in callbacks)
- [ ] **AsyncValue handling** — all `.when()` calls handle `data`, `loading`, and `error`
- [ ] **Provider scoping** appropriate — `family` for parameterized, `autoDispose` for screen-level

---

## Error Handling

- [ ] **No empty `catch` blocks** — handle, log, or rethrow
- [ ] **`on` keyword for specific exceptions** — not generic `catch (e)`
- [ ] **`mounted` check after `await`** — before using `BuildContext`
- [ ] **Error boundaries** in widget tree — `ErrorWidget.builder` or custom error widgets

### Correct Patterns

```dart
// ✅ Specific exception handling
try {
  await api.createTask(task);
} on NetworkException catch (e) {
  logger.warning('Network error', error: e);
  if (mounted) showSnackbar(context, 'Network error');
} on ValidationException catch (e) {
  logger.info('Validation failed', error: e);
  if (mounted) showValidationErrors(context, e.errors);
}
```

---

## Resource Cleanup

- [ ] **`dispose()` implemented** for all controllers (`TextEditingController`, `AnimationController`, `ScrollController`)
- [ ] **Stream subscriptions cancelled** in `dispose()`
- [ ] **Timers cancelled** in `dispose()`
- [ ] **Focus nodes disposed** in `dispose()`

---

## Type Safety

- [ ] **No `dynamic` types** — use specific types or generics
- [ ] **No `late` without justification** — prefer nullable with null check or `initState` init
- [ ] **`required` keyword** on non-optional named parameters
- [ ] **Null safety** — no `!` (bang operator) without safety comment

---

## Performance

- [ ] **No API calls in `build()`** — move to `initState`, provider, or `FutureBuilder`
- [ ] **`const` widgets** for static content (prevents unnecessary rebuilds)
- [ ] **`ListView.builder`** for long lists — not `Column` with `children: items.map(...)`
- [ ] **Image caching** — use `cached_network_image` for remote images

---

## Navigation

- [ ] **Typed routes** (GoRouter, auto_route) — no raw string route names
- [ ] **Deep link support** verified for key screens
- [ ] **Back navigation** works correctly (no orphaned screens)

---

## Platform Safety

- [ ] **Platform checks** before using platform-specific APIs
- [ ] **Responsive layout** — tested on multiple screen sizes
- [ ] **Safe area** — `SafeArea` widget or `MediaQuery.of(context).padding`

---

## Observability

- [ ] **No `print()` statements** — use `dart:developer` `log()` or structured logger
- [ ] **Crashlytics / error reporting** configured for production
- [ ] **Performance monitoring** for key user flows

---

## Testing

- [ ] **Widget tests** for key UI components (`testWidgets`)
- [ ] **Provider tests** for business logic (unit tests with `ProviderContainer`)
- [ ] **Golden tests** for visual regression on critical screens
- [ ] **No `setUp`/`tearDown` with shared state** — use fresh fixtures per test

---

## Static Analysis

- [ ] `dart analyze` passes with zero issues
- [ ] `dart format --set-exit-if-changed .` passes (formatting consistent)
- [ ] `flutter test` passes with zero failures
- [ ] No `// ignore:` without explanatory comment

---

## References
- Flutter Idioms and Patterns @flutter-idioms-and-patterns.md
- Error Handling Principles @error-handling-principles.md
- Resources and Memory Management Principles @resources-and-memory-management-principles.md
- Testing Strategy @testing-strategy.md
