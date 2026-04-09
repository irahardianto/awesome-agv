# HTML + Vanilla CSS/JS Design Patterns

> Load this module when building without a framework. Covers CSS cascade layers, container queries, scroll animations, accessible components, and progressive enhancement patterns.
>
> **Prerequisite:** Design tokens from `examples/design-tokens.css` must be linked in your HTML `<head>` before any component styles.

---

## HTML Document Template

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="[compelling 120–160 char description]">
  <title>[Page Title] | [Site Name]</title>

  <!-- Preconnect to font sources before loading fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- [Font @import URL from references/typography.md] -->
  <link href="[FONT_URL]" rel="stylesheet">

  <!-- Design tokens first — all components depend on them -->
  <link rel="stylesheet" href="/css/design-tokens.css">
  <link rel="stylesheet" href="/css/components.css">

  <!-- Theme script: MUST run before paint to prevent flash -->
  <script>
    const t = localStorage.getItem('theme') ?? 'dark';
    document.documentElement.dataset.theme =
      t === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t;
  </script>
</head>
<body>
  <!-- Skip link: Always first child of body -->
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header role="banner">
    <nav aria-label="Primary navigation">
      <!-- Navigation -->
    </nav>
  </header>

  <main id="main-content" tabindex="-1">
    <h1>[Page heading — exactly one per page]</h1>
    <!-- Content -->
  </main>

  <footer role="contentinfo">
    <!-- Footer -->
  </footer>

  <!-- Progress bar (optional — reading indicator) -->
  <div id="reading-progress" aria-hidden="true" role="progressbar" aria-valuemin="0" aria-valuemax="100"></div>

  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

---

## CSS Architecture with Cascade Layers

Order your CSS in explicit layers to prevent specificity battles:

```css
/* In your main.css — define layer order at the top */
@layer base, tokens, layout, components, utilities, overrides;

@layer base {
  /* Reset and HTML defaults — from design-tokens.css */
}

@layer tokens {
  /* Custom properties — imported from design-tokens.css */
}

@layer layout {
  /* Page-level layout: header, main, footer, grid structures */
  .site-header {
    height: var(--header-height);
    position: sticky; top: 0;
    z-index: var(--z-sticky);
    background: var(--surface-overlay);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }
}

@layer components {
  /* Reusable component styles: cards, buttons, inputs */
}

@layer utilities {
  /* Single-purpose utility classes: .sr-only, .truncate */
}

@layer overrides {
  /* Third-party overrides or high-specificity exceptions */
}
```

---

## Scroll Reveal Animation

```css
/* In components.css → scroll reveal */
[data-scroll] {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity   0.6s var(--ease-out-expo),
    transform 0.6s var(--ease-out-expo);
}
[data-scroll].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Delay variants */
[data-scroll][data-delay='1'] { transition-delay: 80ms;  }
[data-scroll][data-delay='2'] { transition-delay: 160ms; }
[data-scroll][data-delay='3'] { transition-delay: 240ms; }
[data-scroll][data-delay='4'] { transition-delay: 320ms; }
[data-scroll][data-delay='5'] { transition-delay: 400ms; }
```

```js
// In main.js — init after DOM is ready
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );

  document.querySelectorAll('[data-scroll]').forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initScrollReveal);
```

Usage in HTML:
```html
<h2 data-scroll>Section Heading</h2>
<div class="card-grid">
  <article class="card" data-scroll data-delay="1">Card 1</article>
  <article class="card" data-scroll data-delay="2">Card 2</article>
  <article class="card" data-scroll data-delay="3">Card 3</article>
</div>
```

---

## Container Queries (Responsive Components)

```css
/* Wrap the component in a container */
.card-wrapper { container-type: inline-size; container-name: card; }

.card { /* default: compact */ padding: var(--space-4); }
.card__title { font-size: var(--text-base); }

/* Grow when the container is wide enough — regardless of viewport */
@container card (min-width: 400px) {
  .card { padding: var(--card-padding); display: grid; grid-template-columns: auto 1fr; }
  .card__title { font-size: var(--text-xl); }
}
```

---

## Accessible Navigation

```html
<header class="site-header">
  <nav class="nav" aria-label="Primary">
    <a href="/" class="nav__logo" aria-label="Home">Logo</a>

    <!-- Mobile: controlled by JS toggle -->
    <button
      class="nav__toggle"
      aria-controls="nav-menu"
      aria-expanded="false"
      aria-label="Open navigation menu"
    >
      <span aria-hidden="true">☰</span>
    </button>

    <ul id="nav-menu" class="nav__list" role="list">
      <li><a class="nav__link" href="/" aria-current="page">Home</a></li>
      <li><a class="nav__link" href="/about">About</a></li>
      <li><a class="nav__link" href="/work">Work</a></li>
    </ul>
  </nav>
</header>
```

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: var(--content-xl);
  margin: 0 auto;
  padding: 0 var(--container-padding-x);
  height: 100%;
}
.nav__link {
  color: var(--text-muted);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: var(--transition-colors);
}
.nav__link:hover, [aria-current='page'] { color: var(--text); background: var(--bg-hover); }
.nav__link:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.nav__toggle { display: none; } /* shown via JS class on mobile */
```

---

## Accessible Modal

```html
<dialog class="modal" id="my-modal" aria-labelledby="modal-title" aria-modal="true">
  <div class="modal__backdrop"></div>
  <div class="modal__content" role="document">
    <header class="modal__header">
      <h2 id="modal-title">Modal Title</h2>
      <button class="modal__close" aria-label="Close dialog">✕</button>
    </header>
    <div class="modal__body">
      <!-- Content -->
    </div>
    <footer class="modal__footer">
      <button class="btn btn--secondary" data-dismiss>Cancel</button>
      <button class="btn btn--primary">Confirm</button>
    </footer>
  </div>
</dialog>
```

```css
.modal {
  padding: 0;
  border: none;
  background: transparent;
  max-width: min(560px, 90vw);
  width: 100%;
}
.modal__backdrop {
  position: fixed; inset: 0;
  background: hsl(0 0% 0% / 0.7);
  backdrop-filter: blur(4px);
  z-index: var(--z-overlay);
}
.modal__content {
  position: relative;
  z-index: var(--z-modal);
  background: var(--surface);
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
  overflow: hidden;
  animation: fade-in-scale 0.3s var(--ease-out-expo) both;
}
.modal::backdrop { background: hsl(0 0% 0% / 0.6); backdrop-filter: blur(4px); }
```

```js
// modal.js
const modal = document.getElementById('my-modal');
const openBtn = document.querySelector('[data-open="my-modal"]');
const closeBtn = modal.querySelector('.modal__close');
const dismissBtns = modal.querySelectorAll('[data-dismiss]');

openBtn?.addEventListener('click', () => {
  modal.showModal(); // Native dialog API
  modal.querySelector('[autofocus], button, [href], input').focus();
});

function closeModal() { modal.close(); }

closeBtn?.addEventListener('click', closeModal);
dismissBtns.forEach(btn => btn.addEventListener('click', closeModal));

// Close on backdrop click
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
// Close on Escape (native <dialog> behavior)
```

---

## Accessible Form Inputs

```css
/* Copy base from design-tokens.css; extend here */
.form-group { display: flex; flex-direction: column; gap: var(--space-1-5); }

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

.form-input {
  height: var(--input-height);
  padding: var(--input-padding);
  border-radius: var(--input-radius);
  border: var(--input-border);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-base);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
  outline: none;
  width: 100%;
}
.form-input:focus {
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}
.form-input[aria-invalid='true'] {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px hsl(var(--color-error) / 0.15);
}

.form-error {
  font-size: var(--text-sm);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
```

```html
<div class="form-group">
  <label class="form-label" for="email">Email address</label>
  <input
    class="form-input"
    id="email"
    type="email"
    name="email"
    autocomplete="email"
    required
    aria-describedby="email-error"
    aria-invalid="false"
  >
  <span id="email-error" class="form-error" role="alert" hidden>
    Please enter a valid email address.
  </span>
</div>
```

---

## Skip Link and Focus Management

```css
/* Always include — critical for keyboard navigation */
.skip-link {
  position: absolute;
  top: -100px;
  left: var(--space-4);
  z-index: var(--z-tooltip);
  padding: var(--space-3) var(--space-5);
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius-md);
  font-weight: var(--weight-semibold);
  transition: top var(--duration-fast);
}
.skip-link:focus { top: var(--space-4); }
```

---

## Progressive Enhancement: JS Feature Detection

```js
// features.js — load early
const features = {
  intersectionObserver: 'IntersectionObserver' in window,
  dialog:               typeof HTMLDialogElement !== 'undefined',
  containerQueries:     CSS.supports('container-type: inline-size'),
};

// Apply feature classes to <html>
Object.entries(features).forEach(([key, supported]) => {
  document.documentElement.classList.toggle(`supports-${key}`, supported);
  document.documentElement.classList.toggle(`no-${key}`, !supported);
});
```

---

## Common Anti-Patterns

```css
/* ❌ Hardcoded colors */
.card { background: #1a1a2e; color: #e0e0e0; }

/* ✅ Always use tokens */
.card { background: var(--surface); color: var(--text); }

/* ❌ Animate properties that trigger layout */
.card:hover { width: 110%; height: 250px; top: -10px; }

/* ✅ Only transform and opacity */
.card:hover { transform: translateY(-3px) scale(1.02); }

/* ❌ Missing focus styles */
.btn:focus { outline: none; }

/* ✅ Replace default outline with branded one */
.btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* ❌ Interactive element with no hover state */
.card { transition: none; }

/* ✅ Every interactive element responds to hover */
.card { transition: var(--transition-all-interactions); }
.card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
```
