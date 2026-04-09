# Motion Patterns Catalog

> **Performance rule:** Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` — they trigger layout recalculation on every frame.
>
> **Accessibility rule:** Every animation MUST have a `prefers-reduced-motion` fallback. The override block at the bottom of this file disables all decorative animation for users who request it.

---

## Entrance Animations

### 1. Fade Up
The workhorse — clean, universally appropriate.
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.anim-fade-up {
  animation: fade-up 0.5s var(--ease-out-expo) both;
}
/* Stagger children */
.anim-fade-up:nth-child(1) { animation-delay: 0ms; }
.anim-fade-up:nth-child(2) { animation-delay: 80ms; }
.anim-fade-up:nth-child(3) { animation-delay: 160ms; }
.anim-fade-up:nth-child(4) { animation-delay: 240ms; }
```
**When:** Hero content, card grids, list items, page load reveals.

### 2. Fade In Scale
Subtle scale from 96% → 100% with fade. The element materializes.
```css
@keyframes fade-in-scale {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.anim-fade-scale {
  animation: fade-in-scale 0.4s var(--ease-out-expo) both;
}
```
**When:** Modals, dropdowns, popovers, cards on hover expansion.

### 3. Slide In From Side
Directional reveal for panels and drawers.
```css
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-32px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(32px); }
  to   { opacity: 1; transform: translateX(0); }
}
.anim-slide-left  { animation: slide-in-left  0.45s var(--ease-out-expo) both; }
.anim-slide-right { animation: slide-in-right 0.45s var(--ease-out-expo) both; }
```
**When:** Navigation drawers, side panels, tab content transitions.

### 4. Blur to Sharp
Content starts blurred and comes into focus.
```css
@keyframes blur-reveal {
  from { opacity: 0; filter: blur(8px); transform: scale(1.02); }
  to   { opacity: 1; filter: blur(0);   transform: scale(1); }
}
.anim-blur-reveal {
  animation: blur-reveal 0.6s var(--ease-out-expo) both;
}
```
**When:** Hero images, background reveals, AI-generated content appearing.

### 5. Clip Reveal (Horizontal Wipe)
Content revealed by an expanding clip mask. Editorial and dramatic.
```css
@keyframes clip-reveal-x {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
.anim-clip-x {
  animation: clip-reveal-x 0.7s var(--ease-out-expo) both;
}
```
**When:** Section headings, hero typography, cinematic reveals.

### 6. Stagger Cascade
Systematic delay for list items — use CSS `calc()` or JS.
```css
/* CSS approach — up to 8 items */
.stagger-group > *:nth-child(1) { animation-delay: 0ms; }
.stagger-group > *:nth-child(2) { animation-delay: 60ms; }
.stagger-group > *:nth-child(3) { animation-delay: 120ms; }
.stagger-group > *:nth-child(4) { animation-delay: 180ms; }
.stagger-group > *:nth-child(5) { animation-delay: 240ms; }
.stagger-group > *:nth-child(6) { animation-delay: 300ms; }
.stagger-group > *:nth-child(7) { animation-delay: 360ms; }
.stagger-group > *:nth-child(8) { animation-delay: 420ms; }

/* JS approach — unlimited items */
/* el.style.animationDelay = `${index * 60}ms`; */
```
**When:** Feature lists, navigation menus, card grids, step indicators.

---

## Hover States

Apply to interactive elements to communicate affordance.

### 7. Lift Shadow
Element rises on hover using transform + shadow intensification.
```css
.hover-lift {
  transition:
    transform   var(--duration-normal) var(--ease-out-expo),
    box-shadow  var(--duration-normal) var(--ease-out-expo);
}
.hover-lift:hover  { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.hover-lift:active { transform: translateY(-1px); box-shadow: var(--shadow-md); }
```
**When:** Cards, buttons, images, any tappable surface.

### 8. Underline Grow
Decorative underline grows from left on hover.
```css
.hover-underline {
  position: relative;
  display: inline-block;
}
.hover-underline::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 100%; height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-normal) var(--ease-out-expo);
}
.hover-underline:hover::after { transform: scaleX(1); }
```
**When:** Navigation links, footer links, inline CTAs.

### 9. Border Draw
A border traces around the element on hover — dramatic and premium.
```css
.hover-border {
  position: relative;
  isolation: isolate;
}
.hover-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1.5px solid currentColor;
  border-radius: inherit;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity   var(--duration-normal) ease,
    transform var(--duration-normal) var(--ease-out-expo);
}
.hover-border:hover::before { opacity: 1; transform: scale(1); }
```
**When:** Outlined buttons, skill tags, card hover states.

### 10. Color Shift Background
Smooth background color change with semantic easing.
```css
.hover-bg {
  background: transparent;
  transition: var(--transition-colors);
}
.hover-bg:hover { background-color: var(--primary); color: var(--bg); }
```
**When:** Navigation items, pill tabs, toggle buttons.

### 11. Icon Slide
Icon shifts position on parent hover — communicates direction.
```css
.hover-icon-right .icon {
  transition: transform var(--duration-normal) var(--ease-out-expo);
}
.hover-icon-right:hover .icon { transform: translateX(4px); }
```
**When:** "Read more" links, external link indicators, CTA arrows.

---

## Scroll-Triggered Animations

Use `IntersectionObserver` to add a class when elements enter the viewport.

### 12. Intersection Observer Setup (JS)
```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('is-visible');
        observer.unobserve(el.target); // Animate once
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('[data-scroll]').forEach(el => observer.observe(el));
```

```css
[data-scroll] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s var(--ease-out-expo), transform 0.6s var(--ease-out-expo);
}
[data-scroll].is-visible { opacity: 1; transform: translateY(0); }

/* Delay variants */
[data-scroll][data-delay='1'] { transition-delay: 80ms; }
[data-scroll][data-delay='2'] { transition-delay: 160ms; }
[data-scroll][data-delay='3'] { transition-delay: 240ms; }
[data-scroll][data-delay='4'] { transition-delay: 320ms; }
```
**When:** Section headings, feature cards, testimonials — anything below the fold.

### 13. Number Counter Animation
Counts from 0 to target value when scrolled into view.
```js
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1500;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
// Usage: <span data-counter data-target="12500">0</span>
```
**When:** Stats sections, "by the numbers" marketing pages.

### 14. Parallax Layer
Foreground and background scroll at different speeds.
```js
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax) || 0.3;
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
}, { passive: true });
```
```css
[data-parallax] { will-change: transform; }
/* Usage: data-parallax="0.2" (slower) or "0.5" (faster) */
```
**When:** Hero background images, decorative shape layers, floating elements.

### 15. Reading Progress Bar
Fills as user scrolls down the page.
```css
#reading-progress {
  position: fixed; top: 0; left: 0;
  height: 3px; width: 0%;
  background: var(--primary);
  z-index: var(--z-toast);
  transition: width 0.1s linear;
}
```
```js
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  document.getElementById('reading-progress').style.width =
    `${(scrollTop / docHeight) * 100}%`;
}, { passive: true });
```
**When:** Long-form content, documentation, blog posts.

---

## Page Transitions

### 16. Cross-Fade (Vue `<Transition>`)
```css
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-standard);
}
.fade-enter-from, .fade-leave-to { opacity: 0; }
```

### 17. Slide Over (Vue Router)
```css
.slide-enter-active, .slide-leave-active {
  transition: transform var(--duration-moderate) var(--ease-out-expo);
}
.slide-enter-from  { transform: translateX(100%); }
.slide-leave-to    { transform: translateX(-10%) scale(0.98); }
```

---

## Micro-Interactions

### 18. Button Ripple Effect
```css
.btn-ripple { position: relative; overflow: hidden; }
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 50%;
  border-radius: 50%;
  background: hsl(0 0% 100% / 0.25);
  transform: scale(0);
  transition: transform 0.5s, opacity 0.5s;
  opacity: 0;
}
.btn-ripple:active::after {
  inset: -100%;
  transform: scale(1);
  opacity: 0;
  transition: 0s;
}
```

### 19. Input Focus Glow
```css
.input-glow {
  outline: none;
  border: 1.5px solid var(--border);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}
.input-glow:focus {
  border-color: var(--primary);
  box-shadow: var(--shadow-glow);
}
```

### 20. Skeleton Shimmer (Loading State)
```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-raised) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

### 21. Toast Slide In
```css
@keyframes toast-in {
  from { opacity: 0; transform: translateY(100%) scale(0.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(20px) scale(0.9); }
}
.toast      { animation: toast-in  var(--duration-moderate) var(--ease-out-expo) both; }
.toast.exit { animation: toast-out var(--duration-normal)   var(--ease-in)       both; }
```

---

## Accessibility: Reduced Motion Override

**Always include this block** at the bottom of your CSS.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration:        0.01ms !important;
    animation-iteration-count: 1      !important;
    transition-duration:       0.01ms !important;
    scroll-behavior:           auto   !important;
  }

  /* Preserve functional animations */
  .spinner, #reading-progress {
    animation-duration: revert !important;
    transition-duration: revert !important;
  }
}
```

---

## Easing Functions Reference

Define once in your design tokens (from `examples/design-tokens.css`):

```css
:root {
  --ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);      /* Most UI animations */
  --ease-out-back:    cubic-bezier(0.34, 1.56, 0.64, 1);  /* Slight overshoot, playful */
  --ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);     /* Page transitions */
  --ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Game-like UI */
  --ease-standard:    cubic-bezier(0.2, 0, 0, 1);          /* Material 3 standard */
}
```
