# Layout Compositions Catalog

> **How to use:** Pick a composition that fits the content's purpose and density. CSS Grid for most layouts; Flexbox for linear flow within components. Responsive behavior is included for each pattern.
>
> **Core principle:** Layout creates meaning. A bento grid says "features." A full-bleed editorial says "story." A dashboard grid says "data." Choose deliberately.

---

## Hero Compositions

### 1. Full-Bleed Centered Hero
Maximum visual impact. Content centered, background fills entire viewport.
```css
.hero-centered {
  min-height: 100svh;
  display: grid;
  place-items: center;
  text-align: center;
  padding: var(--space-8) var(--container-padding-x);
  position: relative;
  overflow: hidden;
}
.hero-centered__content { position: relative; z-index: 1; max-width: 56ch; }
.hero-centered__bg { position: absolute; inset: 0; z-index: 0; }
```
**When:** Landing pages, product launches, coming-soon pages.

### 2. Split Hero (50/50)
Two equal halves — content on one side, visual on the other.
```css
.hero-split {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.hero-split__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-16) var(--space-12) var(--space-16) var(--space-16);
}
.hero-split__visual { position: relative; overflow: hidden; }
@media (max-width: 768px) {
  .hero-split { grid-template-columns: 1fr; }
  .hero-split__visual { min-height: 50svh; }
}
```
**When:** SaaS pages, app showcases, product-plus-pitch layouts.

### 3. Golden Ratio Hero
61.8% / 38.2% split — mathematically satisfying proportion.
```css
.hero-golden {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 61.8fr 38.2fr;
  gap: var(--space-8);
}
@media (max-width: 900px) { .hero-golden { grid-template-columns: 1fr; } }
```
**When:** Portfolios, agency pages, editorial-inspired marketing.

### 4. Asymmetric Overlap Hero
Content block overlaps onto the hero image, creating depth.
```css
.hero-overlap {
  position: relative;
  min-height: 100svh;
  display: grid;
  grid-template-rows: 70vh 1fr;
}
.hero-overlap__image { grid-area: 1 / 1 / 2 / 2; overflow: hidden; }
.hero-overlap__content {
  grid-area: 1 / 1 / 3 / 2; /* Spans both rows */
  align-self: end;
  margin: 0 var(--space-8) var(--space-neg-8) var(--space-8);
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  z-index: 10;
}
```
**When:** Real estate, hospitality, product photography-led pages.

---

## Content Grid Compositions

### 5. Bento Grid
Asymmetric card grid with varying sizes — each size communicates importance.
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.bento-card--featured { grid-column: span 2; grid-row: span 2; }  /* 2×2 */
.bento-card--wide     { grid-column: span 4; }                     /* full width */
.bento-card--tall     { grid-row: span 2; }                        /* 2 rows */

@media (max-width: 900px) {
  .bento-grid { grid-template-columns: repeat(2, 1fr); }
  .bento-card--wide { grid-column: span 2; }
}
@media (max-width: 600px) {
  .bento-grid { grid-template-columns: 1fr; }
  .bento-card--featured, .bento-card--wide, .bento-card--tall {
    grid-column: span 1; grid-row: span 1;
  }
}
```
**When:** Feature showcases, portfolio galleries, capability overviews.

### 6. Masonry-Style Grid
Variable height cards that flow naturally.
```css
.masonry {
  column-count: 3;
  column-gap: var(--space-4);
}
.masonry__item { break-inside: avoid; margin-bottom: var(--space-4); }
@media (max-width: 900px) { .masonry { column-count: 2; } }
@media (max-width: 600px) { .masonry { column-count: 1; } }
```
**When:** Image galleries, testimonial collections, inspiration boards.

### 7. Auto-Fill Card Grid
Cards that automatically wrap at a minimum size — no breakpoints needed.
```css
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: var(--space-6);
}
```
**When:** Product listings, blog post grids, team member cards.

---

## Editorial Compositions

### 8. Magazine Stack
Full-width hero → narrow content → wide media → narrow content rhythm.
```css
.magazine-stack {
  display: grid;
  grid-template-columns:
    [full-start] var(--container-padding-x)
    [content-start] 1fr
    [content-end] var(--container-padding-x)
    [full-end];
}
.magazine-stack > *       { grid-column: content; }
.magazine-stack > .full-bleed { grid-column: full; width: 100%; }
.magazine-stack > .wide {
  grid-column: full;
  padding-inline: var(--space-4);
  max-width: 960px;
  margin-inline: auto;
}
```
**When:** Blog posts, long-form articles, case studies.

### 9. Three-Column Editorial
Classic newspaper-style 3-column with headline spanning all.
```css
.editorial-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}
.editorial-3col__headline {
  grid-column: 1 / -1;
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}
.editorial-3col__lead { grid-column: span 2; }
@media (max-width: 768px) {
  .editorial-3col { grid-template-columns: 1fr; }
  .editorial-3col__lead { grid-column: span 1; }
}
```
**When:** News-style landing pages, publication archives.

---

## Dashboard Compositions

### 10. Sidebar + Main
The canonical dashboard layout.
```css
.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100svh;
}
.dashboard__topbar {
  grid-column: 1 / -1;
  height: var(--header-height);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}
.dashboard__sidebar {
  position: sticky;
  top: var(--header-height);
  height: calc(100svh - var(--header-height));
  overflow-y: auto;
}
.dashboard__content { padding: var(--space-8); }

@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
  .dashboard__sidebar {
    position: fixed;
    left: -240px; top: 0; bottom: 0;
    height: 100svh;
    transition: left var(--duration-moderate) var(--ease-out-expo);
    z-index: var(--z-fixed);
  }
  .dashboard__sidebar.is-open { left: 0; }
}
```

### 11. Stats Row + Chart Grid
KPI cards across the top, charts below.
```css
.dashboard-content { display: grid; gap: var(--space-6); }
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}
.chart-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}
.chart-grid__secondary { display: grid; gap: var(--space-4); }
@media (max-width: 1024px) { .chart-grid { grid-template-columns: 1fr; } }
```

---

## Special Compositions

### 12. Full-Screen Scroll Snap
Each section occupies the full viewport height — scrolling snaps between sections.
```css
.fullpage-wrapper {
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  height: 100svh;
}
.fullpage-section {
  scroll-snap-align: start;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```
**When:** Presentations, portfolio showcases, story-driven marketing.

### 13. Diagonal Section Dividers
Sections flow into each other with diagonal cuts.
```css
.section-diagonal {
  position: relative;
  padding-block: calc(var(--space-20) + 60px);
  clip-path: polygon(0 60px, 100% 0, 100% calc(100% - 60px), 0 100%);
  margin-block: -60px;
}
.section-diagonal--reverse {
  clip-path: polygon(0 0, 100% 60px, 100% 100%, 0 calc(100% - 60px));
}
```
**When:** Marketing pages with alternating content sections.

### 14. Sticky Sidebar with Scrolling Content
Left sidebar stays in place while right side scrolls.
```css
.sticky-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--space-10);
  align-items: start;
}
.sticky-layout__sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--space-8));
  max-height: calc(100svh - var(--header-height) - var(--space-16));
  overflow-y: auto;
}
@media (max-width: 900px) {
  .sticky-layout { grid-template-columns: 1fr; }
  .sticky-layout__sidebar { position: static; }
}
```
**When:** Documentation, e-commerce product pages, wiki-style content.

### 15. Centered Narrow Column (Long-Form Reading)
Optimal reading width with generous margin breathing room.
```css
.reading-layout {
  display: grid;
  grid-template-columns: 1fr min(68ch, 100%) 1fr;
  gap: 0 var(--space-6);
  padding-inline: var(--space-4);
}
.reading-layout > *          { grid-column: 2; }
.reading-layout > .breakout  { grid-column: 1 / -1; }
```
**When:** Blog posts, technical writeups, case studies, documentation.

---

## Composition Decision Matrix

| Content Type | Primary Layout | Mobile Behavior |
|---|---|---|
| SaaS landing page | #1 Full-Bleed Hero + #7 Auto-fill Cards | Stack vertically |
| Portfolio | #3 Golden Ratio Hero + #5 Bento Grid | Auto-fill grid |
| Blog / Article | #8 Magazine Stack + #15 Reading Layout | Single column |
| Dashboard | #10 Sidebar + Main + #11 Stats/Chart | Collapsed sidebar |
| E-commerce | #2 Split Hero + #7 Auto-fill Products | Full-width stacked |
| Documentation | #14 Sticky Sidebar | Remove sticky |
| Marketing page | #13 Diagonal Sections + #5 Bento | Stacked sections |
| Gallery | #6 Masonry | 2-column masonry |
| App-like | #12 Full-Screen Snap | Same (native feel) |
