# v1.2.3 — Frontend Design Toolkit

## 🎨 New Skill: frontend-design (Comprehensive Toolkit)

Transforms the `frontend-design` skill from a flat 51-line guideline into a **modular, multi-file design-to-code system** with concrete, copy-pasteable patterns. The goal: eliminate "AI slop" aesthetics by giving agents structured, curated reference material at every decision point — from font pairing to PWA deployment.

The skill is now organized as a **4-phase workflow** (Design Direction → Token System → Build → Polish) backed by a full reference library, framework modules, a complete CSS token system, and a standalone visual audit script.

---

### 📚 Reference Library (`references/`)

Six curated reference modules agents load on demand — no more guessing from scratch.

**New: `references/typography.md`**
- 30 curated Google Font pairings organized by aesthetic direction (editorial, luxury, playful, brutalist, etc.)
- Each pairing includes the `@import` URL, CSS variables, and usage guidance

**New: `references/color-palettes.md`**
- 15 named HSL-based palettes with full light and dark variants
- WCAG AA/AAA contrast annotations per palette
- HSL-first for programmatic manipulation (hover states, themes)

**New: `references/motion-patterns.md`**
- 21 performance-first animation recipes: entrance, hover, scroll reveal, micro-interactions
- All patterns use only `transform` and `opacity` — layout-triggering properties (`width`, `height`, `top`, `left`) are strictly banned
- Includes `prefers-reduced-motion` overrides on every pattern

**New: `references/layout-compositions.md`**
- 15 named spatial layouts (Editorial Split, Bento Grid, Asymmetric Hero, Dashboard Shell, etc.)
- Each layout includes full responsive CSS with mobile-first `min-width` breakpoints

**New: `references/mobile-responsive.md`**
- Mobile-first methodology with `min-width`-only breakpoints and standard breakpoint tokens
- Touch target rules: ≥ 44×44px, `pointer: coarse` detection, `::after` tap area expansion
- Viewport unit guide: `svh` vs `dvh` vs `lvh` — iOS Safari gotchas and fallbacks
- `env(safe-area-inset-*)` patterns for notches, dynamic islands, and home indicators
- Three mobile navigation patterns with full CSS + JS: hamburger overlay, bottom tab bar, slide-out drawer
- Bottom sheet component with swipe-to-dismiss touch handling
- Responsive images (`<picture>`, `srcset`, `sizes`), CLS prevention with `aspect-ratio`
- Scroll snapping (mobile carousel → desktop grid), `overscroll-behavior` containment
- Responsive decision matrix: which layout, navigation, and spacing pattern for each breakpoint

**New: `references/pwa-checklist.md`**
- Complete `manifest.json` template with all fields annotated (name, icons, shortcuts, screenshots)
- Icon generation guide with maskable safe-zone diagram; validate at maskable.app
- Full `<head>` meta tag block: `theme-color`, `apple-mobile-web-app-*`, `apple-touch-icon`
- Three service worker caching strategies with complete implementations:
  - Cache-First (static assets, fonts, images)
  - Network-First (API responses, user data)
  - Stale-While-Revalidate (CMS content, blog posts)
- Self-contained `offline.html` template (inline CSS, system fonts, under 15 KB)
- Install prompt UX: deferred prompt capture, engagement threshold, dismissal persistence
- Update notification: new SW detection, toast pattern
- `display-mode` CSS for styling installed PWA vs. in-browser
- `vite-plugin-pwa` config for Vue/Vite projects with runtime caching
- Lighthouse PWA audit checklist — every item mapped to the module section that covers it

---

### 🧩 Framework Modules (`frameworks/`)

**New: `frameworks/vue.md`**
- Vue 3 `<script setup>` component convention with design token integration
- `useScrollReveal` composable using `IntersectionObserver` for scroll-triggered entrance animations
- Light/dark theme system with `useColorMode` (VueUse)
- Button component with full variant, size, and loading state system
- Page transition recipes using Vue's `<Transition>` component
- VueUse integration: `useMediaQuery`, `useColorMode`, `useIntersectionObserver`

**New: `frameworks/html-css.md`**
- CSS cascade layers (`@layer`) for specificity control without `!important`
- Container queries for component-level responsive layouts
- Accessible navigation with skip link, keyboard support, and `aria-current`
- Modal component with focus trap, scroll lock, and keyboard dismiss
- Custom form controls (checkbox, radio) with accessible design
- Progressive enhancement patterns for JS-dependent features

---

### 🎛️ Design Tokens (`examples/`)

**New: `examples/design-tokens.css`**
- Complete CSS custom property system: palette primitives, semantic colors, fluid typography (`clamp()`), spacing scale (0–96), shadows (sm → 2xl), motion variables, z-index scale, and component shortcuts
- Fluid typography scales from `--text-xs` to `--text-hero` — no media queries needed for font sizes
- Minimal base reset included (box-sizing, image max-width, font smoothing)
- Drop-in foundation: copy to project, override palette and font variables, done

---

### �� Verification (`scripts/`)

**New: `scripts/visual-audit.sh`**
- Standalone bash script requiring only `node` and `npx`
- Checks: color contrast violations (axe-cli, WCAG AA minimum), missing alt text and accessible names, skip link presence, semantic heading structure (one `<h1>`), font loading performance (CLS risk), `prefers-reduced-motion` override presence, Lighthouse performance and accessibility scores
- Reports CRITICAL (must fix) vs WARNING (acceptable with documentation)
- Integrates with the Phase 4 workflow gate: task is not complete until audit passes

---

### 📝 SKILL.md — Phased Workflow Orchestrator

Restructured from a flat guideline into a **4-phase workflow** with module references at every step:

- **Phase 1 — Design Direction:** 12 named aesthetic directions, concrete deliverables (named palette, named font pairing, named layout)
- **Phase 2 — Token System:** `design-tokens.css` setup, Google Fonts preconnect pattern
- **Phase 3 — Build:** Framework module loading, mobile-responsive requirements (mobile-first CSS, 44px touch targets, `svh`, safe areas), PWA readiness steps
- **Phase 4 — Polish & Verify:** 8-item checklist including responsive, touch, and Lighthouse PWA checks

**Anti-pattern catalog expanded to 12 entries** — now includes:
- `Desktop-First CSS` — `max-width` breakpoints causing mobile breakage
- `Tiny Tap Targets` — 24px interactive elements unusable on touch

---

Full Changelog: [v1.2.2...v1.2.3](https://github.com/irahardianto/awesome-agv/compare/v1.2.2...v1.2.3)
