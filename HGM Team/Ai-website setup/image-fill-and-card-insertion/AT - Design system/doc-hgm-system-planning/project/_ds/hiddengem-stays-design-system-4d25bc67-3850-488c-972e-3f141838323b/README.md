# HiddenGem Stays — Design System

A curated boutique travel platform connecting adventurous guests with unique, off-the-beaten-path properties across the USA. We focus on **discovery**, **high-end photography**, and **seamless booking experiences** for travelers looking for more than just a hotel room.

The voice is a **trusted local friend** who knows all the best spots — sophisticated, adventurous, reliable.

---

## Sources

- **Figma file:** `❖ Untitled UI Figma – PRO VARIABLES V8.0.fig` — mounted as a virtual filesystem. This design system inherits structural conventions (buttons, inputs, spacing scale, shadow system) from Untitled UI Pro but **re-skins all color, type, and brand elements** to the HiddenGem palette and editorial voice.
- No codebase, brand guide, or slide deck was provided. Copy and imagery below are crafted from the brand brief.
- Imagery used in mockups are placeholder stock-style shots (forest cabin, coast, desert). Swap for real property photography in production.

---

## Index

| File / Folder | Purpose |
|---|---|
| `README.md` | This document — brand, tone, visual foundations, iconography |
| `SKILL.md` | Agent skill manifest (cross-compatible with Claude Code Agent Skills) |
| `colors_and_type.css` | Core design tokens — CSS vars for color, type, spacing, radius, shadow |
| `assets/icons/` | Copied Untitled-UI line icons used throughout (home, search, marker-pin, star, heart, etc.) |
| `assets/imagery/` | Placeholder property imagery (external URLs in component markup) |
| `preview/` | Small HTML cards registered as Design System tab entries |
| `ui_kits/marketing_site/` | Marketing website UI kit — homepage, listing, property detail |
| `ui_kits/booking_app/` | In-app booking flow — search, results, booking widget, trips |

---

## Content Fundamentals

**Voice:** Trusted local friend. Knows the terrain, respects your time, has taste. Never salesy, never cutesy.

**Tone:** Warm, confident, quietly luxurious. Speaks in fragments when it feels natural. Favors specific over generic ("An A-frame on the edge of a black-sand beach in Olympic National Park" over "A beautiful unique property").

**Person:** **You** addresses the traveler directly. **We** is used sparingly and only when the brand is actively doing something for the guest ("We verified this one ourselves"). Never use royal "we" for opinions.

**Casing:**
- Sentence case everywhere in UI (buttons, nav, form labels): "Find your stay", not "Find Your Stay"
- Title Case for proper nouns, property names, guide titles: "The Redwood A-Frame", "Coastal Stays in the Pacific Northwest"
- Eyebrow labels are `UPPERCASE` with wide tracking — used sparingly, for section kickers only.

**Punctuation:**
- Oxford commas, em-dashes (—) for emphasis, no exclamation points except in genuine moments of delight (e.g. booking confirmation)
- Ellipses are fine for loading/anticipation but never for faux-coyness
- "&" is permitted in headlines ("Cabins & A-frames") — never in body copy

**Numerics:**
- Prices: `$248 / night`. Always with the `/ night` suffix in listings; use `$248 total` at checkout
- Reviews: `4.92` (two decimal places), shown next to gold star icon
- Dates: `Thu, Apr 24` — day of week always included in booking UI

**Emoji:** Not used in brand surfaces. The occasional ❖ (black diamond — our mark) may appear as a typographic accent. Unicode bullets (•) are used between metadata items.

**Vibe examples:**
- ✅ "Quiet, high, and reachable only by a gravel switchback. Worth every kilometer."
- ✅ "Three verified stays, chosen for the first cool night of autumn."
- ❌ "Amazing unique properties for your next adventure!!"
- ❌ "Don't miss out on these trending deals 🔥"

**CTA verbs:** *See stay · Check availability · Save for later · Message host · Start a trip*. Never "Click here", "Learn more", "Get started".

---

## Visual Foundations

### Color
Three families, each used intentionally:

- **Forest** (`--forest-500` #2f5e3f is hero). Used for primary CTAs, brand moments, dark surfaces. Deep, grounded, outdoorsy. Not piney-Christmas-green — desaturated and a touch cool.
- **Sand** (`--sand-25` → `--sand-700`). Warm neutrals for page backgrounds (`--sand-25` is default page bg) and text on forest surfaces. Replaces pure white/gray which would feel clinical.
- **Gold** (`--gold-300` #d6a94a). The "gem" — reserved for the **Hidden Gem** badge, star ratings, small verified ticks, and occasional hover glows. Never use as a fill for buttons or large surfaces. A little goes a long way.
- **Cool neutrals** only show up for functional chrome (borders, disabled states). The system is warm-biased.

### Type
- **Display — Fraunces** (serif). Opsz axis brings warmth at larger sizes. Used for hero titles, section headings, property names. Italic for editorial emphasis.
- **Body — Inter** (sans). Used for everything else. 16px base, 1.5 line-height.
- **Pairing rule:** Editorial display serif + clean sans body. Display sizes get `-0.012em` letter-spacing. Eyebrow labels get `+0.14em` and uppercase.
- **Mono** (JetBrains Mono) only appears in dev/handoff contexts, not in product.

### Spacing & Radius
- 4px base unit. 4/8/12/16/24/32/48/64/96 ladder.
- **Radius ladder:** 4 (chips), 8 (inputs, small buttons), **12 (cards — primary)**, 16 (modals), 20 (hero media), pill (badges, avatars).
- Friendly but not cartoony — we stay under 16px for interactive elements.

### Backgrounds & Imagery
- **Page background is `--sand-25`**, never pure white. Gives the platform warmth from the first pixel.
- Photography is **large, editorial, full-bleed**. Listings use 4:3 or 3:2 hero; property detail pages use 2:1 with a gallery grid. Images lean warm (golden hour, not midday blue).
- **No hand-drawn illustrations, no stock vectors, no gradient meshes.** If an illustration is needed, use photography instead.
- **Texture:** subtle 1-2% grain on dark forest surfaces (optional). No repeating patterns.

### Animation
- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` ("quietly confident") is default; use for all position/scale/opacity transitions.
- **Durations:** 150ms for hover, 250ms for state change, 400ms for enter/exit, 600ms+ for hero image fades.
- **Fades & slides, no bounces.** The brand is calm, not playful. A slight scale on image hover (1.02) is the most it leans in.
- Page transitions are instant; skeleton loaders use the sand-50 → sand-100 shimmer.

### States
- **Hover (buttons):** primary goes to `--forest-700`, tertiary to `--sand-50` bg. No scale.
- **Hover (cards):** shadow lifts from `--shadow-sm` → `--shadow-lg`. Image inside scales to 1.02.
- **Press:** 97% scale, 90ms. Never color inversion.
- **Focus-visible:** 2px offset ring in `--gold-300` (our accent doubles as focus color).
- **Disabled:** 40% opacity + `cursor: not-allowed`.

### Borders
- `1px` solid borders, `--neutral-100` default (very soft). Never 2px except on active/selected state.
- Cards rely on shadow over border where possible. Borders are used on inputs, dividers, secondary buttons.

### Shadows
Six-step system, all warm-tinted (rgba with green-black undertone, not neutral gray):
- `xs/sm/md/lg/xl/float` — cards use `sm` at rest, `lg` on hover. Floating elements (search bar on scroll, modals) use `float`.
- `--shadow-gold-glow` is a 4px gold focus ring used sparingly.

### Transparency & Blur
- Sticky headers: 80% `--sand-25` + `backdrop-filter: blur(14px)` when scrolled.
- Image overlays (for text legibility): `linear-gradient(to top, rgba(20,26,17,0.6), transparent 60%)`. Never a solid color overlay.
- Modals use a `rgba(20,26,17,0.5)` backdrop with 8px blur.

### Cards
- Radius **12px**, background `--bg-surface` (white), shadow `--shadow-sm`, no border.
- Property cards: image fills top, 16px padding for content, gold diamond ❖ in top-left for "Hidden Gem" status, heart icon top-right for favoriting.
- Hover: `--shadow-lg`, image scales 1.02, heart becomes red on click.

### Layout
- Marketing max-width: **1280px**, page gutters `--space-16` (64px) desktop / `--space-6` mobile.
- App max-width: **1440px** with a floating search bar that sticks at 80px from top on scroll.
- 12-column grid, 24px gutters.
- **Fixed elements:** sticky top nav (64px), floating search bar, floating booking widget (sticky sidebar 400px wide).

---

## Iconography

**System:** **[Phosphor Icons](https://phosphoricons.com/)** — regular weight (1.5px stroke, square caps, geometric, friendly without being childish). 256×256 viewBox, rendered via CSS `mask-image` so `color` / `currentColor` recolors the glyph. The subset used in the system lives in `assets/icons/` under HiddenGem-conventional filenames (e.g. our `marker-pin.svg` is Phosphor's `map-pin`, our `building.svg` is `mountains`).

**Rules:**
- **Line-only.** Use regular weight everywhere except:
  - ❖ The HiddenGem diamond mark (brand logo, not an icon from the set)
  - Filled star (rating display) — we use the regular `star` glyph and fill it with `--gold-400` via the mask
  - Filled heart (saved/favorited state — red) — use `heart-filled.svg`
- **Size:** 16px inline, 20px default, 24px for category navigation, 40px for empty states.
- **Color inheritance:** every icon is rendered as a `<span>` whose `background-color` defaults to `currentColor`. Brand-green for primary context, `--fg-tertiary` for metadata, `--gold-400` for ratings. The React `<Icon>` primitive in `ui_kits/marketing_site/Primitives.jsx` handles this.
- **No emoji** in product surfaces. No unicode pictographs except `❖` (brand mark) and `•` (separator).
- **No custom illustrations.** If a surface needs a visual, use photography.

**Icons available** in `assets/icons/` (26 total):
- Navigation: `home`, `search`, `menu`, `x-close`, `chevron-right`, `chevron-down`, `arrow-right`
- Travel: `marker-pin`, `map`, `compass`, `umbrella`, `building` (mountains)
- Booking: `calendar`, `users`, `filter`, `check`, `check-verified` (seal-check), `camera`, `wifi`, `message`, `share`
- Stateful: `heart`, `heart-filled`, `star`
- Meta: `plus`, `minus`

**Source & license:** Phosphor Icons is MIT-licensed. SVGs were pulled from `@phosphor-icons/core@2.1.1` on jsdelivr — see `phosphoricons.com` to browse the full 7,000+ icon set. To add a new glyph, download the regular-weight SVG from Phosphor, save it to `assets/icons/<our-name>.svg`, replace hard-coded `fill`/`stroke` attributes with `currentColor`, and use the existing `<Icon name="our-name">` primitive.

**Fonts substitution note:** The brief called for "Inter or Proxima Nova" (body) and "an elegant serif for headings". I chose **Fraunces** (Google Fonts) for the display serif — it's editorial, has an opsz axis for warmth at large sizes, and reads as quietly luxurious rather than stuffy. Inter is used for body (loaded locally from `fonts/`). **Please confirm Fraunces works for the brand** or provide a licensed serif (e.g. GT Super, Canela, Tiempos) to swap in via `@font-face` in `colors_and_type.css`.
