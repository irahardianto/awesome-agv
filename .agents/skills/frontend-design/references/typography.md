# Typography Pairings Catalog

> **How to use:** Pick a pairing that matches your **aesthetic direction**. Copy the `@import` and `font-family` declarations directly. Never use a pairing from a previous generation — always scan for something fresh.

## Size Scale Reference

Use this scale with any pairing. Fluid sizing via `clamp()` adapts to viewport.

```css
--text-xs:      clamp(0.694rem, 0.66rem + 0.17vw, 0.8rem);
--text-sm:      clamp(0.833rem, 0.78rem + 0.27vw, 0.96rem);
--text-base:    clamp(1rem, 0.93rem + 0.36vw, 1.15rem);
--text-lg:      clamp(1.2rem, 1.1rem + 0.5vw, 1.38rem);
--text-xl:      clamp(1.44rem, 1.3rem + 0.7vw, 1.66rem);
--text-2xl:     clamp(1.728rem, 1.53rem + 0.99vw, 2rem);
--text-3xl:     clamp(2.074rem, 1.79rem + 1.42vw, 2.4rem);
--text-4xl:     clamp(2.488rem, 2.09rem + 1.99vw, 2.88rem);
--text-hero:    clamp(2.986rem, 2.44rem + 2.73vw, 3.46rem);
```

---

## Editorial / Magazine

### 1. Playfair Display + Source Serif 4
Classic editorial authority. The high-contrast serifs of Playfair command attention in headlines while Source Serif 4 provides superb long-form readability.

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap');
--font-display: 'Playfair Display', serif;
--font-body: 'Source Serif 4', serif;
```
**Mood:** Authoritative, literary, established. Think *The New Yorker*, high-end publishing.

### 2. Fraunces + Newsreader
Fraunces is a "soft serif" with optical sizing and a playful wobble axis. Paired with Newsreader's crisp editorial style for body text that feels like quality print.

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap');
--font-display: 'Fraunces', serif;
--font-body: 'Newsreader', serif;
```
**Mood:** Warm editorial, artisan quality, opinionated yet approachable.

### 3. Bodoni Moda + Spectral
Ultra-high contrast Bodoni for dramatic, fashion-magazine headlines. Spectral's even typographic color carries body text smoothly.

```css
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Spectral:ital,wght@0,200..800;1,200..800&display=swap');
--font-display: 'Bodoni Moda', serif;
--font-body: 'Spectral', serif;
```
**Mood:** High fashion, dramatic, Vogue-inspired editorial.

---

## Luxury / Refined

### 4. Cormorant Garamond + Libre Franklin
The elegance of a Garamond with the clean legibility of a humanist sans-serif. A timeless combination that whispers "expensive" without shouting.

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Libre+Franklin:ital,wght@0,100..900;1,100..900&display=swap');
--font-display: 'Cormorant Garamond', serif;
--font-body: 'Libre Franklin', sans-serif;
```
**Mood:** Understated luxury, refined taste, gallery exhibition catalog.

### 5. DM Serif Display + DM Sans
From the same type family — perfect harmony. The serif display weight has beautiful thick/thin contrast; DM Sans is its geometric sans-serif sibling.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
--font-display: 'DM Serif Display', serif;
--font-body: 'DM Sans', sans-serif;
```
**Mood:** Polished boutique brand, considered pairings, quiet confidence.

### 6. Tenor Sans + Crimson Text
Tenor Sans has a calligraphic smoothness unusual for a sans-serif. Paired with the book-weight elegance of Crimson Text for paragraph copy.

```css
@import url('https://fonts.googleapis.com/css2?family=Tenor+Sans&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');
--font-display: 'Tenor Sans', sans-serif;
--font-body: 'Crimson Text', serif;
```
**Mood:** Spa-like calm, fine jewelry, ceramics studio.

---

## Brutalist / Raw

### 7. Archivo Black + JetBrains Mono
Maximum weight contrast. Archivo Black is a blunt instrument for headlines; JetBrains Mono adds technical credibility and raw, monospaced rhythm.

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
--font-display: 'Archivo Black', sans-serif;
--font-body: 'JetBrains Mono', monospace;
```
**Mood:** Developer tools, anti-aesthetic, confrontational design, punk energy.

### 8. Anton + IBM Plex Mono
Anton is compressed, aggressive, poster-like. IBM Plex Mono brings corporate structure into the chaos — an intentional tension.

```css
@import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:ital,wght@0,100..700;1,100..700&display=swap');
--font-display: 'Anton', sans-serif;
--font-body: 'IBM Plex Mono', monospace;
```
**Mood:** Protest poster, radical transparency, systems brutalism.

### 9. Bebas Neue + Fira Code
Condensed all-caps display with a ligature-rich monospace. The combination screams "terminal meets billboard."

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fira+Code:wght@300..700&display=swap');
--font-display: 'Bebas Neue', sans-serif;
--font-body: 'Fira Code', monospace;
```
**Mood:** Hacker aesthetic, CLI interfaces, data dashboards, cyberpunk.

---

## Retro-Futuristic / Sci-Fi

### 10. Orbitron + Exo 2
Orbitron is geometric, NASA-mission-control typography. Exo 2 softens the edges for readable body text while keeping the futuristic tone.

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');
--font-display: 'Orbitron', sans-serif;
--font-body: 'Exo 2', sans-serif;
```
**Mood:** Space exploration, mission control, sci-fi dashboards.

### 11. Rajdhani + Chakra Petch
Angular, technical Devanagari-inspired Latin forms. Both fonts have a mechanical precision that feels like HUD interfaces.

```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300..700&family=Chakra+Petch:ital,wght@0,300..700;1,300..700&display=swap');
--font-display: 'Rajdhani', sans-serif;
--font-body: 'Chakra Petch', sans-serif;
```
**Mood:** Gaming HUD, mech engineering, console interfaces.

### 12. Audiowide + Share Tech
Audiowide has that chrome-logo, racing-stripe energy. Share Tech is its calmer sibling for extended reading.

```css
@import url('https://fonts.googleapis.com/css2?family=Audiowide&family=Share+Tech&display=swap');
--font-display: 'Audiowide', sans-serif;
--font-body: 'Share Tech', sans-serif;
```
**Mood:** Racing games, automotive tech, neon signage.

---

## Playful / Toy-like

### 13. Fredoka + Nunito
Rounded, bubbly, irresistibly friendly. Fredoka's semi-bold rounds feel like inflatable letters; Nunito rounds out paragraphs with equal warmth.

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');
--font-display: 'Fredoka', sans-serif;
--font-body: 'Nunito', sans-serif;
```
**Mood:** Children's apps, onboarding flows, gamification, educational platforms.

### 14. Baloo 2 + Comfortaa
Baloo 2 is a round, devanagari-inspired display face with a friendly vibe. Comfortaa adds geometric roundness to body text.

```css
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&family=Comfortaa:wght@300..700&display=swap');
--font-display: 'Baloo 2', sans-serif;
--font-body: 'Comfortaa', sans-serif;
```
**Mood:** Toy store, kids' dashboard, playful onboarding.

### 15. Bungee + Rubik
Bungee is a display font designed for vertical and horizontal signage. Combined with Rubik's slightly rounded geometry for a toy-block feel.

```css
@import url('https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
--font-display: 'Bungee', sans-serif;
--font-body: 'Rubik', sans-serif;
```
**Mood:** Arcade, street signage, bold product pages, event marketing.

---

## Organic / Natural

### 16. Zilla Slab + Lora
Zilla Slab's sturdy slab serifs feel hand-hewn. Lora is a well-balanced text face with roots in calligraphy, giving body copy an organic rhythm.

```css
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:ital,wght@0,300..700;1,300..700&family=Lora:ital,wght@0,400..700;1,400..700&display=swap');
--font-display: 'Zilla Slab', serif;
--font-body: 'Lora', serif;
```
**Mood:** Craft brewery, artisan goods, organic food, sustainability reports.

### 17. Bitter + Merriweather
Two robust serifs that feel earthy and hand-set. Bitter is a slab-serif built for screens; Merriweather is optimized for comfortable reading.

```css
@import url('https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,100..900;1,100..900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap');
--font-display: 'Bitter', serif;
--font-body: 'Merriweather', serif;
```
**Mood:** Farm-to-table, woodworking, heritage brands, environmental reports.

### 18. Cabin Sketch + Cabin
Cabin Sketch looks hand-drawn on a whiteboard. Its polished sibling Cabin handles body text. The combination says "designed by a human."

```css
@import url('https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@400;700&family=Cabin:ital,wght@0,400..700;1,400..700&display=swap');
--font-display: 'Cabin Sketch', sans-serif;
--font-body: 'Cabin', sans-serif;
```
**Mood:** Notebook sketches, educational content, brainstorming tools.

---

## Art Deco / Geometric

### 19. Poiret One + Josefin Sans
Poiret One is pure art deco — geometric circles and straight lines. Josefin Sans complements with its vintage geometric character.

```css
@import url('https://fonts.googleapis.com/css2?family=Poiret+One&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap');
--font-display: 'Poiret One', sans-serif;
--font-body: 'Josefin Sans', sans-serif;
```
**Mood:** 1920s glamour, gatsby-esque events, art exhibitions, cocktail bars.

### 20. Megrim + Kanit
Megrim is a single-weight geometric display face with a crystalline quality. Kanit pairs angular precision with readable body text.

```css
@import url('https://fonts.googleapis.com/css2?family=Megrim&family=Kanit:ital,wght@0,100..900;1,100..900&display=swap');
--font-display: 'Megrim', sans-serif;
--font-body: 'Kanit', sans-serif;
```
**Mood:** Geometric precision, crystalline structures, abstract art.

### 21. Baskervville + Outfit
Classic Baskerville forms (symmetrical, transitional) paired with Outfit's clean geometric sans-serif — old-world geometry meets new.

```css
@import url('https://fonts.googleapis.com/css2?family=Baskervville:ital@0;1&family=Outfit:wght@100..900&display=swap');
--font-display: 'Baskervville', serif;
--font-body: 'Outfit', sans-serif;
```
**Mood:** Architecture firm, museum catalog, geometric design systems.

---

## Soft / Pastel

### 22. Quicksand + DM Sans
Quicksand's rounded terminals and consistent stroke width feel gentle. DM Sans adds clean geometric readability without sharpness.

```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
--font-display: 'Quicksand', sans-serif;
--font-body: 'DM Sans', sans-serif;
```
**Mood:** Wellness apps, meditation, skincare brands, calm interfaces.

### 23. Grandstander + Lexend
Grandstander has a soft, handwritten quality with wide forms. Lexend was designed for reading comfort and accessibility — gentle on the eyes.

```css
@import url('https://fonts.googleapis.com/css2?family=Grandstander:ital,wght@0,100..900;1,100..900&family=Lexend:wght@100..900&display=swap');
--font-display: 'Grandstander', sans-serif;
--font-body: 'Lexend', sans-serif;
```
**Mood:** Gentle onboarding, health apps, journaling tools, soft product pages.

### 24. Mali + Karla
Mali is a rounded handwriting-style display font. Karla has a grotesque simplicity that provides grounding—cozy but not chaotic.

```css
@import url('https://fonts.googleapis.com/css2?family=Mali:ital,wght@0,200..700;1,200..700&family=Karla:ital,wght@0,200..800;1,200..800&display=swap');
--font-display: 'Mali', handwriting;
--font-body: 'Karla', sans-serif;
```
**Mood:** Personal blog, recipe site, travel journal, handwritten notes.

---

## Industrial / Utilitarian

### 25. Barlow Condensed + Barlow
The Barlow superfamily in two widths — condensed for space-efficient headlines, regular for comfortable body text. Pure function over form.

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100..900;1,100..900&family=Barlow:ital,wght@0,100..900;1,100..900&display=swap');
--font-display: 'Barlow Condensed', sans-serif;
--font-body: 'Barlow', sans-serif;
```
**Mood:** Manufacturing dashboards, logistics, infrastructure, data-dense interfaces.

### 26. Oswald + Source Sans 3
Oswald is a narrow, industrial gothic. Source Sans 3 (Adobe's first open-source family) is supremely readable at any size.

```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');
--font-display: 'Oswald', sans-serif;
--font-body: 'Source Sans 3', sans-serif;
```
**Mood:** News sites, sports, industrial applications, military-inspired design.

### 27. Saira Condensed + Saira
Another superfamily width pairing. Saira has sharp, mechanical counters that feel engineered rather than designed.

```css
@import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@100..900&family=Saira:ital,wght@0,100..900;1,100..900&display=swap');
--font-display: 'Saira Condensed', sans-serif;
--font-body: 'Saira', sans-serif;
```
**Mood:** Racing telemetry, engineering specs, aerospace interfaces.

---

## Contemporary / Versatile

### 28. Sora + General Sans (Fontshare)
Sora has a distinctive character set with slightly squared forms. For General Sans, substitute with Wix Madefor Display from Google Fonts — similar vibes).

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@100..800&family=Wix+Madefor+Display:wght@400..800&display=swap');
--font-display: 'Sora', sans-serif;
--font-body: 'Wix Madefor Display', sans-serif;
```
**Mood:** Modern SaaS, tech landing pages, startup branding.

### 29. Plus Jakarta Sans + Figtree
Two modern grotesques with personality. Plus Jakarta Sans has a slight squareness; Figtree is open and friendly. Both feel "designed yesterday."

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Figtree:ital,wght@0,300..900;1,300..900&display=swap');
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body: 'Figtree', sans-serif;
```
**Mood:** Modern product design, fintech, analytics dashboards, design systems.

### 30. Space Mono + Manrope
Space Mono is a monospace with quirky character. Manrope is an optically precise geometric sans. The contrast between fixed-width display and proportional body creates tension.

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@200..800&display=swap');
--font-display: 'Space Mono', monospace;
--font-body: 'Manrope', sans-serif;
```
**Mood:** Developer portfolios, creative studios, tech-art crossover.

---

## Decision Matrix

When choosing a pairing, cross-reference the **purpose** with the **audience maturity**:

| Audience / Purpose | Formal | Casual | Technical |
|---|---|---|---|
| **Enterprise / B2B** | #4 Cormorant+Franklin, #5 DM Serif+DM Sans | #29 Jakarta+Figtree | #25 Barlow family |
| **Consumer / B2C** | #1 Playfair+Source Serif, #3 Bodoni+Spectral | #13 Fredoka+Nunito, #22 Quicksand+DM Sans | #28 Sora+Wix |
| **Developer / Technical** | #26 Oswald+Source Sans | #30 Space Mono+Manrope | #7 Archivo+JetBrains, #9 Bebas+Fira |
| **Creative / Portfolio** | #2 Fraunces+Newsreader, #19 Poiret+Josefin | #15 Bungee+Rubik, #18 Cabin Sketch+Cabin | #8 Anton+IBM Plex |
| **Wellness / Lifestyle** | #6 Tenor+Crimson | #23 Grandstander+Lexend, #24 Mali+Karla | #16 Zilla+Lora |
| **Sci-fi / Gaming** | #11 Rajdhani+Chakra | #12 Audiowide+Share Tech | #10 Orbitron+Exo 2 |
