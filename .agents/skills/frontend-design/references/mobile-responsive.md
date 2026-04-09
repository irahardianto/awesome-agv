# Mobile Responsive Design Patterns

> **Core principle:** Mobile-first means writing base styles for the smallest screen, then layering complexity with `min-width` queries. This is not a preference — it produces smaller CSS bundles and ensures the mobile experience is never an afterthought.
>
> **All sizes in this file use `rem` or `em` units.** This honors user font-size preferences. `px` is used only for borders and fine visual details that should not scale.

---

## Mobile-First Methodology

### The Rule: `min-width` Only

```css
/* ✅ CORRECT — mobile-first */
.card { padding: var(--space-4); }          /* Base: mobile */

@media (min-width: 640px)  { .card { padding: var(--space-6); } }  /* sm: tablet portrait */
@media (min-width: 768px)  { .card { padding: var(--space-6); } }  /* md: tablet landscape */
@media (min-width: 1024px) { .card { padding: var(--space-8); } }  /* lg: desktop */
@media (min-width: 1280px) { .card { padding: var(--space-10); } } /* xl: wide desktop */

/* ❌ WRONG — desktop-first (max-width) produces overrides on top of overrides */
.card { padding: var(--space-10); }
@media (max-width: 1024px) { .card { padding: var(--space-8); } }
@media (max-width: 768px)  { .card { padding: var(--space-6); } }
@media (max-width: 640px)  { .card { padding: var(--space-4); } }
```

### Standard Breakpoints

Define as design tokens (add to `design-tokens.css`):

```css
:root {
  /* Breakpoint values — reference only (CSS media queries can't use custom properties) */
  /* Use these numeric values in @media queries */
  --bp-sm:  640px;   /* Large phones landscape, small tablets */
  --bp-md:  768px;   /* Tablet portrait */
  --bp-lg:  1024px;  /* Tablet landscape, small desktop */
  --bp-xl:  1280px;  /* Desktop */
  --bp-2xl: 1536px;  /* Wide desktop */
}

/* In JavaScript — media query objects */
/* const bp = { sm: '(min-width: 640px)', md: '(min-width: 768px)', lg: '(min-width: 1024px)' } */
```

### Container Queries Over Media Queries

Where possible, use container queries so components respond to their own available space, not the viewport:

```css
/* The card responds to its container width, not the browser width */
.card-wrapper { container-type: inline-size; }

.card { display: block; }

@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 120px 1fr; gap: var(--space-4); }
}

@container (min-width: 600px) {
  .card { grid-template-columns: 200px 1fr; }
}
```

---

## Touch Targets

### Minimum Tap Target: 44×44 CSS pixels (WCAG) / 48×48 (Material)

Every interactive element must be large enough to tap accurately with a finger.

```css
/* Touch target base — apply to all interactive elements on touch devices */
@media (pointer: coarse) {
  button, a, [role="button"], input[type="checkbox"], input[type="radio"],
  select, summary, [tabindex]:not([tabindex="-1"]) {
    min-height: 44px;
    min-width: 44px;
  }
}

/* If the visual element is smaller, expand the tap area with padding or ::after */
.icon-button {
  /* Visual: 24px icon, but tap area: 44px */
  width: 24px;
  height: 24px;
  position: relative;
}
.icon-button::after {
  content: '';
  position: absolute;
  inset: -10px; /* Expands tap area by 10px on each side = 44px total */
}

/* Touch target spacing — elements must not overlap */
.nav__list {
  display: flex;
  gap: var(--space-2); /* Minimum 8px between tap targets */
}
.nav__link {
  padding: var(--space-3) var(--space-4); /* 12px × 16px padding = comfortable target */
}
```

### Touch vs Pointer Detection

```css
/* Fine pointer (mouse) — can afford smaller targets and hover effects */
@media (pointer: fine) {
  .btn--sm { min-height: 32px; padding: var(--space-1-5) var(--space-3); }
  .tooltip { display: block; }
}

/* Coarse pointer (finger) — larger targets, no hover-dependent features */
@media (pointer: coarse) {
  .btn--sm { min-height: 44px; padding: var(--space-2-5) var(--space-4); }
  .tooltip { display: none; } /* Tooltips don't work on touch — use a different pattern */
}

/* Hover capability detection */
@media (hover: none) {
  /* Don't hide content behind :hover — users can't access it */
  .dropdown__menu { position: static; display: block; } /* Always visible */
}
```

---

## Viewport Units: The Right Ones

### The Problem

`100vh` on iOS Safari includes the URL bar area — content gets hidden behind it. This is the #1 mobile CSS bug.

### The Solution: Small Viewport Units (`svh`)

```css
/* ✅ Full-screen sections that actually work */
.hero {
  min-height: 100svh; /* Small viewport height: excludes browser chrome */
}

/* ✅ Dynamic viewport — tracks the current visible area */
.modal-backdrop {
  height: 100dvh; /* Updates as browser chrome appears/disappears */
}

/* ✅ Large viewport — includes browser chrome */
.background-element {
  height: 100lvh; /* Prevents background "bouncing" when chrome hides */
}

/* Fallback for older browsers (Safari < 15.4) */
.hero {
  min-height: 100vh; /* Fallback */
  min-height: 100svh; /* Override for supporting browsers */
}
```

### Decision Guide

| Unit | Behavior | Use For |
|---|---|---|
| `svh` | Smallest possible viewport (excludes ALL browser chrome) | Hero sections, full-screen content, scroll-snap panels |
| `dvh` | Current visible viewport (changes dynamically) | Modals, overlays, fixed position elements |
| `lvh` | Largest possible viewport (includes ALL browser chrome) | Background images, decorative elements that shouldn't "jump" |
| `vh` | **Avoid** on mobile — unreliable meaning | Desktop-only layouts (or as fallback before `svh`) |

---

## Safe Area Insets

### For Devices with Notches, Dynamic Islands, Home Indicators

```css
/* Enable safe area — REQUIRED in <meta viewport> */
/* <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"> */

/* Fixed bottom navigation — must clear the home indicator */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--surface);
}

/* Full-bleed content that extends to edges */
.hero--full-bleed {
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Status bar area — for transparent headers */
.header--transparent {
  padding-top: env(safe-area-inset-top, 0px);
}

/* Combined with design tokens */
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-right:  env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left, 0px);
}
```

---

## Mobile Navigation Patterns

### Pattern 1: Hamburger → Full-Screen Overlay

Best for: marketing pages, portfolios, editorial sites.

```css
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-6);
  
  /* Entrance animation */
  opacity: 0;
  visibility: hidden;
  transition:
    opacity    var(--duration-moderate) var(--ease-standard),
    visibility var(--duration-moderate) var(--ease-standard);
}
.mobile-nav-overlay.is-open { opacity: 1; visibility: visible; }

.mobile-nav-overlay__link {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  color: var(--text);
  padding: var(--space-3) var(--space-6);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.4s var(--ease-out-expo), transform 0.4s var(--ease-out-expo);
}
.mobile-nav-overlay.is-open .mobile-nav-overlay__link {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger */
.mobile-nav-overlay.is-open .mobile-nav-overlay__link:nth-child(1) { transition-delay: 80ms; }
.mobile-nav-overlay.is-open .mobile-nav-overlay__link:nth-child(2) { transition-delay: 140ms; }
.mobile-nav-overlay.is-open .mobile-nav-overlay__link:nth-child(3) { transition-delay: 200ms; }
.mobile-nav-overlay.is-open .mobile-nav-overlay__link:nth-child(4) { transition-delay: 260ms; }
.mobile-nav-overlay.is-open .mobile-nav-overlay__link:nth-child(5) { transition-delay: 320ms; }
```

```js
// Toggle logic
const toggle = document.querySelector('.nav__toggle');
const overlay = document.querySelector('.mobile-nav-overlay');

toggle.addEventListener('click', () => {
  const isOpen = overlay.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
  
  // Trap focus inside overlay when open
  if (isOpen) overlay.querySelector('a, button')?.focus();
});
```

### Pattern 2: Bottom Tab Bar

Best for: app-like interfaces, dashboards, tools.

```css
.bottom-tabs {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: var(--z-fixed);
  display: none; /* Hidden on desktop */
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (max-width: 768px) {
  .bottom-tabs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  }
  /* Add bottom spacing to body so content isn't hidden behind tabs */
  body { padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px)); }
}

.bottom-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-0-5);
  padding: var(--space-2) 0;
  min-height: 56px; /* Touch target */
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  transition: var(--transition-colors);
}
.bottom-tab[aria-current="page"] { color: var(--primary); }
.bottom-tab:active { transform: scale(0.95); }

.bottom-tab__icon { width: 24px; height: 24px; }

/* Hide desktop sidebar when bottom tabs are visible */
@media (max-width: 768px) {
  .desktop-sidebar { display: none; }
}
```

### Pattern 3: Slide-Out Drawer

Best for: dashboards with complex navigation hierarchies.

```css
.drawer {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: min(300px, 85vw); /* Never wider than 85% of screen */
  z-index: var(--z-fixed);
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: var(--safe-top) var(--space-6) var(--safe-bottom);
  overflow-y: auto;
  overscroll-behavior: contain; /* Prevent scroll chaining */
  
  transform: translateX(-100%);
  transition: transform var(--duration-moderate) var(--ease-out-expo);
}
.drawer.is-open { transform: translateX(0); }

.drawer-backdrop {
  position: fixed; inset: 0;
  z-index: calc(var(--z-fixed) - 1);
  background: hsl(0 0% 0% / 0.5);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity    var(--duration-moderate),
    visibility var(--duration-moderate);
}
.drawer-backdrop.is-open { opacity: 1; visibility: visible; }
```

---

## Bottom Sheet Pattern

Native-feeling modal that slides up from the bottom. Essential for mobile actions.

```css
.bottom-sheet {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: var(--z-modal);
  background: var(--surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--space-4) var(--space-6) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
  max-height: 85svh;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: var(--shadow-xl);
  
  transform: translateY(100%);
  transition: transform var(--duration-moderate) var(--ease-out-expo);
}
.bottom-sheet.is-open { transform: translateY(0); }

/* Drag handle — visual affordance for close-by-swipe */
.bottom-sheet__handle {
  width: 36px;
  height: 4px;
  background: var(--border-strong);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-4);
}
```

```js
// Swipe-to-dismiss for bottom sheet
function initSwipeDismiss(sheetEl) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const handle = sheetEl.querySelector('.bottom-sheet__handle');

  handle?.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
    sheetEl.style.transition = 'none';
  }, { passive: true });

  handle?.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY); // Only allow downward drag
    sheetEl.style.transform = `translateY(${diff}px)`;
  }, { passive: true });

  handle?.addEventListener('touchend', () => {
    isDragging = false;
    sheetEl.style.transition = '';
    const diff = currentY - startY;
    if (diff > 100) {
      // Dismiss threshold: 100px downward
      sheetEl.classList.remove('is-open');
    } else {
      sheetEl.style.transform = '';
      sheetEl.classList.add('is-open');
    }
  });
}
```

---

## Responsive Typography

### Fluid Scaling (Already in design-tokens.css)

The `clamp()` type scale automatically adjusts between 375px and 1440px viewports. No additional media queries needed for font sizes.

### Mobile-Specific Overrides

```css
/* Reduce heading sizes on mobile where horizontal space is constrained */
@media (max-width: 640px) {
  h1 { font-size: var(--text-4xl); }   /* Hero downsized from --text-hero */
  h2 { font-size: var(--text-3xl); }   /* Downsized from --text-4xl */
  
  /* Tighter letter-spacing on mobile for dense headings */
  h1, h2 { letter-spacing: var(--tracking-tight); }
}

/* Reading width capped on all screens */
p, li, blockquote { max-width: var(--measure-normal); } /* 68ch */
```

---

## Responsive Images

### The `<picture>` Element for Art Direction

```html
<!-- Different crops for different screens -->
<picture>
  <source media="(min-width: 1024px)" srcset="/img/hero-desktop.webp" type="image/webp">
  <source media="(min-width: 640px)"  srcset="/img/hero-tablet.webp"  type="image/webp">
  <img src="/img/hero-mobile.webp" alt="[descriptive alt text]"
       width="375" height="500"
       loading="eager"
       decoding="async"
       fetchpriority="high">
</picture>
```

### Responsive Images with `srcset`

```html
<!-- Same image, different resolutions -->
<img
  src="/img/card-400.webp"
  srcset="/img/card-400.webp 400w,
          /img/card-800.webp 800w,
          /img/card-1200.webp 1200w"
  sizes="(min-width: 1024px) 33vw,
         (min-width: 640px)  50vw,
         100vw"
  alt="[descriptive alt text]"
  width="400" height="300"
  loading="lazy"
  decoding="async"
>
```

### Image Rules

```css
/* All images are responsive by default (from design-tokens.css) */
img, video, svg { display: block; max-width: 100%; height: auto; }

/* Aspect ratio containers — prevent CLS on load */
.img-wrapper {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--surface-raised); /* Placeholder color while loading */
}
.img-wrapper > img { width: 100%; height: 100%; object-fit: cover; }
```

---

## Responsive Spacing

```css
/* Section spacing that adapts */
.section {
  padding-block: var(--space-12);  /* 48px mobile */
}
@media (min-width: 768px)  { .section { padding-block: var(--space-16); } } /* 64px tablet */
@media (min-width: 1024px) { .section { padding-block: var(--space-24); } } /* 96px desktop */

/* Fluid approach — single rule, no breakpoints */
.section-fluid {
  padding-block: clamp(var(--space-12), 6vw, var(--space-24));
}

/* Grid gap that adapts */
.card-grid {
  gap: var(--space-4);
}
@media (min-width: 768px) { .card-grid { gap: var(--space-6); } }
@media (min-width: 1024px) { .card-grid { gap: var(--space-8); } }
```

---

## Scroll Behavior

### Scroll Snapping (Mobile-Optimized)

```css
/* Horizontal card carousel — native scroll on mobile */
.horizontal-scroll {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: var(--container-padding-x);
  -webkit-overflow-scrolling: touch;
  
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.horizontal-scroll > * {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: min(280px, 80vw);
}

/* On desktop, use grid instead */
@media (min-width: 1024px) {
  .horizontal-scroll {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    overflow-x: visible;
    scroll-snap-type: none;
  }
  .horizontal-scroll > * { width: auto; }
}
```

### Overscroll Containment

```css
/* Prevent scroll chaining on modals and drawers */
.modal__body, .drawer, .bottom-sheet {
  overscroll-behavior: contain;
}

/* Disable pull-to-refresh on app-like interfaces */
html.is-app { overscroll-behavior-y: none; }
```

---

## Orientation Handling

```css
/* Landscape-specific adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  /* Phone in landscape — reduce vertical padding */
  .hero { min-height: auto; padding-block: var(--space-8); }
  .bottom-tabs { display: none; } /* Use side nav in landscape */
  .side-nav { display: flex; }
}

/* Tablet landscape — unlock wider layouts */
@media (orientation: landscape) and (min-width: 768px) {
  .split-layout { grid-template-columns: 1fr 1fr; }
}
```

---

## Mobile Performance Patterns

### Critical CSS Inlining

```html
<!-- Inline critical CSS for above-the-fold content -->
<style>
  /* Only: reset, typography, hero section, header */
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  body { font-family: var(--font-body); color: var(--text); background: var(--bg); }
  .hero { min-height: 100svh; display: grid; place-items: center; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/css/components.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/components.css"></noscript>
```

### Lazy Loading Below-the-Fold Content

```html
<!-- Images below the fold -->
<img src="photo.webp" loading="lazy" decoding="async" alt="..." width="400" height="300">

<!-- Above the fold — NO lazy loading (hurts LCP) -->
<img src="hero.webp" loading="eager" fetchpriority="high" alt="..." width="1440" height="800">
```

### Prevent Layout Shift (CLS)

```css
/* Always set width/height OR aspect-ratio on images */
.img-responsive {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

/* Font loading: prevent FOUT/FOIT with swap + preload */
/* @font-face { font-display: swap; } — already handled by &display=swap in Google Fonts URL */

/* Skeleton placeholders during data loading */
.skeleton {
  background: linear-gradient(90deg, var(--surface) 25%, var(--surface-raised) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

---

## Testing Responsive Layouts

### Viewport Sizes to Test

| Device | Width | Pixel Ratio | Notes |
|---|---|---|---|
| iPhone SE | 375px | 2x | Smallest common phone |
| iPhone 14 Pro | 393px | 3x | Modern iPhone |
| Samsung Galaxy S23 | 360px | 3x | Common Android |
| iPad Mini | 744px | 2x | Small tablet |
| iPad Pro 11" | 834px | 2x | Medium tablet |
| iPad Pro 12.9" | 1024px | 2x | Large tablet |
| Laptop | 1280px | 1-2x | Standard laptop |
| Desktop | 1440px | 1x | Standard desktop |
| Ultrawide | 1920px+ | 1x | Cap content width! |

### Content Cap for Ultrawide

```css
/* Never let content stretch to full ultrawide */
.page-content {
  max-width: var(--content-xl);  /* 1280px */
  margin-inline: auto;
  padding-inline: var(--container-padding-x);
}

/* Full-bleed elements that SHOULD stretch */
.full-bleed {
  width: 100vw;
  margin-inline: calc(50% - 50vw);
}
```

---

## Responsive Decision Matrix

| Pattern | < 640px (Phone) | 640–1023px (Tablet) | ≥ 1024px (Desktop) |
|---|---|---|---|
| Navigation | Hamburger + overlay OR bottom tabs | Condensed horizontal OR bottom tabs | Full horizontal nav |
| Grid columns | 1 | 2 | 3–4 |
| Hero | Stacked (100svh) | Split or stacked | Split or full-bleed |
| Cards | Full-width stack | 2-column grid | Auto-fill grid |
| Sidebar | Drawer (off-canvas) | Drawer or collapse | Persistent sidebar |
| Actions | Bottom sheet | Bottom sheet or modal | Modal or inline |
| Data tables | Card-per-row or horizontal scroll | Horizontal scroll | Full table |
| Images | Single column, 100vw lazy | 2-column, srcset | Gallery, srcset |
| Typography | --text-4xl max heading | --text-5xl max | Full scale |
| Section spacing | 48px padding-block | 64px | 96px |
