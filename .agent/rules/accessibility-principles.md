---
trigger: model_decision
description: When building UI components, implementing user-facing interfaces, or working with frontend accessibility
---

## Accessibility Principles

### Core Standard
Follow **WCAG 2.1 Level AA** as the baseline for all user-facing interfaces.

### Semantic HTML
- Use semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<button>`, `<form>`) over generic `<div>` and `<span>`
- Each page has exactly one `<h1>`, with proper heading hierarchy (h1 → h2 → h3, no skipping)
- Use `<label>` elements associated with form inputs (via `for`/`id` or wrapping)
- Use `<table>` for tabular data, never for layout

### Keyboard Navigation
- All interactive elements must be reachable via Tab key
- Focus order follows logical reading order
- Focus indicators must be visible (never `outline: none` without replacement)
- Custom components implement proper keyboard patterns (Arrow keys for menus, Escape to close modals)
- No keyboard traps — user can always Tab away from any component

### ARIA Attributes
- **First rule of ARIA:** Don't use ARIA if a native HTML element can do the job
- Use `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-live` regions for dynamic content updates (toasts, notifications)
- Use `role` attributes only for custom widgets that lack native semantics
- Use `aria-expanded`, `aria-controls` for disclosure patterns (dropdowns, accordions)

### Color and Contrast
- Text contrast ratio: minimum **4.5:1** against background (AA normal text)
- Large text contrast ratio: minimum **3:1** (AA large text)
- **Never use color alone** to convey information (add icons, text, or patterns)
- Support both light and dark themes with proper contrast in each

### Images and Media
- All `<img>` elements have descriptive `alt` text (or `alt=""` for decorative images)
- Videos have captions or transcripts
- Audio controls are accessible and labeled

### Forms
- Error messages are programmatically associated with inputs (`aria-describedby`)
- Required fields are indicated both visually and programmatically (`required` attribute)
- Form validation errors are announced to screen readers

### Accessibility Checklist

- [ ] All interactive elements reachable via keyboard?
- [ ] Focus indicators visible on all interactive elements?
- [ ] Semantic HTML elements used (no `<div>` buttons)?
- [ ] Heading hierarchy is correct (h1 → h2 → h3)?
- [ ] Color contrast meets AA standards (4.5:1)?
- [ ] Color is not the sole indicator of meaning?
- [ ] Images have appropriate alt text?
- [ ] Form inputs have associated labels?
- [ ] ARIA used correctly (native first)?

### Related Principles
- Security Principles @security-principles.md (XSS prevention in user content)
- Testing Strategy @testing-strategy.md (accessibility testing)
