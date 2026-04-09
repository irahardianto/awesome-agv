---
name: frontend-design
description: Generates distinctive, production-grade frontend interfaces and artifacts (React, Vue, HTML/CSS). Prioritizes bold aesthetics, unique typography, and motion to avoid generic designs. Use when building websites, landing pages, dashboards, posters, or when the user requests to style, beautify, or create visually striking UI.
---

# Frontend Design Skill

This skill guides creation of **distinctive, production-grade frontend interfaces** that avoid generic "AI slop" aesthetics. Follow the phased workflow below. Each phase has concrete reference material — use it, don't invent from scratch.

---

## Phased Workflow

### Phase 1: Design Direction

Before touching any code, commit to a clear aesthetic direction. Answer these:

**Context questions:**
- What problem does this interface solve? Who uses it?
- What's the one thing someone will remember about this design?
- What aesthetic direction fits? (Choose ONE — don't blend randomly)

**Aesthetic directions to pick from:**
Brutally minimal · Maximalist chaos · Retro-futuristic · Organic/natural · Luxury/refined · Playful/toy-like · Editorial/magazine · Brutalist/raw · Art deco/geometric · Soft/pastel · Industrial/utilitarian · Sci-fi/cyberpunk

**CRITICAL:** Every generation must make a fresh choice. Never default to the same direction twice. Vary light/dark themes, fonts, and palettes across generations.

**Deliverables from Phase 1:**
- ✓ Named aesthetic direction (e.g., "editorial luxury, dark theme")
- ✓ Font pairing selected from `references/typography.md`
- ✓ Color palette selected from `references/color-palettes.md`
- ✓ Layout composition(s) selected from `references/layout-compositions.md`

---

### Phase 2: Token System

Set up the design token foundation before writing any component code.

1. Copy `examples/design-tokens.css` into the project
2. Override the palette primitives with your chosen palette's HSL values
3. Override `--font-display` and `--font-body` with your chosen font pairing
4. Add the Google Fonts `@import` to your HTML `<head>` (with preconnect hints)

```html
<!-- Always preconnect BEFORE the font stylesheet -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="[your @import from typography.md]">
```

**Deliverables from Phase 2:**
- ✓ `design-tokens.css` (or equivalent) in place with chosen palette/fonts
- ✓ All colors, spacing, typography, shadows, and motion defined as CSS variables
- ✓ No hardcoded color values or magic numbers anywhere in component code

---

### Phase 3: Build

Load the framework module for your target and implement components using design tokens.

**Framework modules — load the relevant one:**

| Target | Module |
|---|---|
| Vue 3 (`<script setup>`) | `frameworks/vue.md` |
| HTML + Vanilla CSS/JS | `frameworks/html-css.md` |

**Build principles:**
- Implement components from the layout compositions you chose
- Apply motion patterns from `references/motion-patterns.md` at high-impact moments: page load, scroll reveals, hover states
- Use only `transform` and `opacity` for animations — never `width`, `height`, `top`, `left`
- Every interactive element needs a hover state AND a focus-visible state
- Stagger entrance animations for groups of elements (cards, list items)

**Mobile responsive (load `references/mobile-responsive.md`):**
- Write CSS mobile-first: base styles for phone, `min-width` queries for larger screens
- Every tap target: ≥ 44×44px (`min-height: 44px; min-width: 44px`)
- Use `100svh` not `100vh` for full-screen sections (iOS Safari compatibility)
- Add `env(safe-area-inset-*)` padding on fixed bottom elements
- Test at 375px, 768px, and 1280px minimum — use the decision matrix in the module

**PWA readiness (load `references/pwa-checklist.md` for production apps):**
- Add `manifest.json` with correct `name`, `icons` (192 + 512 + maskable), `theme_color`
- Add PWA meta tags to `<head>` (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
- Register a service worker with appropriate caching strategy
- Create an offline fallback page (`offline.html`)
- For Vite projects: prefer `vite-plugin-pwa` over manual SW

---

### Phase 4: Polish & Verify

**Visual polish checklist:**
- [ ] Typography: Are display and body fonts visually distinct and harmonious?
- [ ] Color: Is the palette cohesive? Do accents draw the eye to the right places?
- [ ] Spacing: Is there enough breathing room between sections? (minimum `--space-20` between major sections)
- [ ] Motion: Does the page feel alive on load? Are hover states immediate and satisfying?
- [ ] Backgrounds: Is there depth, texture, or gradient — or is it a flat color?
- [ ] Responsive: Does it look great at 375px? 768px? 1280px? No horizontal overflow?
- [ ] Touch: Are all interactive targets ≥ 44px? Does navigation work on mobile?
- [ ] PWA (if applicable): Does Lighthouse PWA score 100? Is offline fallback working?

**Accessibility verification:**
```bash
# Run the visual audit after starting your dev server
bash .agents/skills/frontend-design/scripts/visual-audit.sh http://localhost:[port]
```

The audit checks:
- Color contrast violations (WCAG AA minimum — 4.5:1 for text)
- Missing alt text, accessible names, and ARIA labels
- Skip link presence
- Semantic heading structure (one `<h1>` per page)
- Font loading performance (CLS)
- `prefers-reduced-motion` override presence

**Fix all CRITICAL issues before marking the task complete.** Warnings are acceptable if documented.

---

## Anti-Pattern Catalog

These are the most common ways agents produce generic output. Identify and avoid them.

| Anti-Pattern | What It Looks Like | Fix |
|---|---|---|
| **Gradient Soup** | Purple-to-blue gradient on white cards everywhere | Use one deliberate gradient for ONE element (hero BG, accent bar). Source from `color-palettes.md`. |
| **Font Stack Collapse** | Entire page in Inter, Roboto, or system fonts | Pick a pairing from `typography.md`. Always use 2 distinct fonts with clear display/body roles. |
| **Shadow Boxing** | `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on every card | Use `--shadow-sm` for resting, `--shadow-md` for hover. Never apply the same shadow everywhere. |
| **Animation Scatter** | Random `transition: all 0.3s ease` on dozens of elements | Use `--transition-all-interactions` only for interactive elements. Apply entrance animations sparingly. |
| **Whitespace Desert** | Cramped layout with 16px gaps between everything | Section padding minimum `--space-16`. Hero sections minimum `100svh`. Let content breathe. |
| **Button Rainbow** | 5 different button colors across a single page | One `--primary` button, one `--secondary`, one `--ghost`. That's the system. |
| **Flat Backgrounds** | Solid `#1a1a2e` with nothing else | Add texture: gradient mesh, noise overlay, subtle pattern, or a layered radial gradient. |
| **Generic Layout** | Centered content, full-width rows, constant padding | Use a layout composition from `references/layout-compositions.md`. Break the grid deliberately. |
| **Hover Nothing** | No state change on hover for interactive elements | Every card, button, and link needs a hover state. Minimum: color change. Better: lift + shadow. |
| **One-Size Typography** | Body text size used for everything | Use the full type scale. Hero in `--text-hero`, section headings in `--text-3xl`, body in `--text-base`. |
| **Desktop-First CSS** | `max-width` breakpoints everywhere, mobile layout breaks | Write base styles for mobile. Layer up with `min-width`. See `mobile-responsive.md`. |
| **Tiny Tap Targets** | 24px buttons, links with no padding on mobile | Minimum 44×44px interactive area. Expand with padding or `::after` pseudo-element. |

---

## Reference Modules

Load these when implementing. Don't rely on memory — read the module.

| Module | When to Load |
|---|---|
| `references/typography.md` | Choosing fonts — 30 curated pairings |
| `references/color-palettes.md` | Choosing colors — 15 named palettes, light + dark |
| `references/motion-patterns.md` | Implementing animations — entrance, hover, scroll, micro |
| `references/layout-compositions.md` | Structuring pages — 15 named compositions |
| `references/mobile-responsive.md` | Mobile-first methodology, touch targets, viewport units, navigation patterns |
| `references/pwa-checklist.md` | Manifest, service worker, offline fallback, install prompt, Lighthouse PWA |
| `frameworks/vue.md` | Building in Vue 3 |
| `frameworks/html-css.md` | Building in HTML/CSS |
| `examples/design-tokens.css` | Starting a token system |

---

## Rule Compliance

Before marking complete, verify:
- **Project Structure** — component organization follows `project-structure.md`
- **Testing** — component tests follow `testing-strategy.md`
- **Security** — XSS prevention, no `innerHTML` with unescaped user data (`security-principles.md`)
- **Accessibility** — WCAG AA contrast, keyboard navigation, semantic HTML (`accessibility-principles.md`)
- **Audit script** — visual-audit.sh passes with no CRITICAL failures

**IMPORTANT:** Implementation complexity must match the aesthetic vision. Maximalist designs require elaborate animation. Minimalist designs require meticulous spacing precision. Both fail if executed without care.

Remember: you are capable of extraordinary creative work. These references exist to ground your output in concrete, actionable choices — not to constrain your creativity. Use them as a launching pad.
