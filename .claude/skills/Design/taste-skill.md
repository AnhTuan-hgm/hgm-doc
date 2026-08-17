# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."**

Example reads:
- *"Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."*
- *"Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."*
- *"Reading this as: redesign of a public-sector service site, with a trust-first language, leaning toward GOV.UK Frontend or USWDS."*

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question - never a multi-question dump - and only when the design read genuinely diverges. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*

If you can confidently infer from context, **do not ask**. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* **`DESIGN_VARIANCE: 8`** - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY: 6`** - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline:** `8 / 6 / 4`. Use these unless the design read overrides them. Do not ask the user to edit this file - overrides happen conversationally.

### 1.A Dial Inference (design read → dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |
| Editorial / Blog | 6 | 4 | 3 |
| Public-sector service | 3 | 2 | 5 |
| Redesign - preserve | match | match+1 | match |
| Redesign - overhaul | +2 | +2 | match |

### 1.C How the Dials Drive Output
Use these (or user-overridden values) as global variables. Cross-references throughout this document refer to these exact variable names - never invent aliases like `LAYOUT_VARIANCE` or `ANIM_LEVEL`.

---

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package. Do not pretend an aesthetic trend is an official system.

### 2.A When to reach for a real design system (use official packages)
| Brief reads as… | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS / dashboards | `@fluentui/react-components` or `@fluentui/web-components` | Official Fluent UI, Microsoft tokens, accessibility done |
| Google-ish UI, Material-flavored product | `@material/web` + Material 3 tokens | Official, theme-able via Material Theming |
| IBM-style B2B / enterprise analytics | `@carbon/react` + `@carbon/styles` | Official Carbon, mature data-density patterns |
| Shopify app surfaces | `polaris.js` web components / Polaris React | Required for Shopify admin UI |
| Atlassian / Jira-style product | `@atlaskit/*` + `@atlaskit/tokens` | Official Atlassian DS |
| GitHub-style devtool / community page | `@primer/css` or `@primer/react-brand` | Official Primer; Brand variant for marketing |
| Public-sector UK service | `govuk-frontend` | Legally / regulatorily expected |
| US public-sector / trust-first | `uswds` | Same |
| Fast local-business / agency MVP | Bootstrap 5.3 | Boring, fast, works |
| Modern accessible React foundation | `@radix-ui/themes` | Primitives + polished theme |
| Modern SaaS where you own the components | shadcn/ui (`npx shadcn@latest add ...`) | You own the code, easy to customise; never ship default state |
| Tailwind-based modern SaaS / AI marketing | Tailwind v4 utilities + `dark:` variant | Default for indie + small team builds |

**Honesty rule:** if the brief reads as one of the systems above, install and use the **official** package. Do not recreate its CSS by hand. Do not import a system's tokens but then override 90% of them.

**One system per project.** Do not mix Fluent React with Carbon in the same tree. Do not import shadcn/ui components into a Material 3 app.

### 2.B When the brief is an aesthetic, not a system
For these directions, there is **no single official package**. Build with native CSS + Tailwind + a maintained component library. Be honest in code comments about what is borrowed inspiration vs. official material.

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism / "frosted glass" | `backdrop-filter`, layered borders, highlight overlays. Provide solid-fill fallback for `prefers-reduced-transparency`. |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library owns this. |
| Brutalism | Native CSS, monospace, raw borders. No library. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. No library. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. No library. |
| Aurora / mesh gradients | SVG or layered radial gradients. No library. |
| Kinetic typography | Native CSS animations, scroll-driven animations, GSAP for hijacks. No library. |
| **Apple Liquid Glass** | Apple documents this for Apple platforms only. **There is no official `liquid-glass.css`.** Web implementations are approximations using `backdrop-filter` + layered borders + highlights. Label clearly as approximation. |

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

Unless the design read picks a real design system (Section 2.A), these are the defaults:

### 3.A Stack
* **Framework:** React or Next.js. Default to Server Components (RSC).
  * **RSC SAFETY:** Global state works ONLY in Client Components. In Next.js, wrap providers in a `"use client"` component.
  * **INTERACTIVITY ISOLATION:** Any component using Motion, scroll listeners, or pointer physics MUST be an isolated leaf with `'use client'` at the top. Server Components render static layouts only.
* **Styling:** **Tailwind v4** (default). Tailwind v3 only if the existing project demands it.
  * For v4: do NOT use `tailwindcss` plugin in `postcss.config.js`. Use `@tailwindcss/postcss` or the Vite plugin.
* **Animation:** **Motion** (the library formerly known as Framer Motion). Import from `motion/react` (`import { motion } from "motion/react"`). The `framer-motion` package still works as a legacy alias - prefer `motion/react` in new code.
* **Fonts:** Always use `next/font` (Next.js) or self-host with `@font-face` + `font-display: swap`. Never link Google Fonts via `<link>` in production.

### 3.B State
* Local `useState` / `useReducer` for isolated UI.
* Global state ONLY for deep prop-drilling avoidance - Zustand, Jotai, or React context.
* **NEVER** use `useState` to track continuous values driven by user input (mouse position, scroll progress, pointer physics, magnetic hover). Use Motion's `useMotionValue` / `useTransform` / `useScroll`. `useState` re-renders the React tree on every change and collapses on mobile.

### 3.C Icons
* **Allowed libraries (priority order):** `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`.
* **Discouraged:** `lucide-react`. Acceptable only when the user explicitly asks for it or the project already depends on it.
* **NEVER hand-roll SVG icons.** If a glyph is missing, install a second library or compose from primitives - do not draw icon paths from scratch.
* **One family per project.** Do not mix Phosphor with Lucide in the same component tree.
* **Standardize `strokeWidth` globally** (e.g. `1.5` or `2.0`).

### 3.D Emoji Policy
Discouraged by default in code, markup, and visible text. Replace symbols with icon-library glyphs. **Override:** allow emojis only when the user explicitly asks for a playful / chat-style / social-native vibe - and even then use them sparingly with intent.

### 3.E Responsiveness & Layout Mechanics
* Standardize breakpoints (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
* Contain page layouts using `max-w-[1400px] mx-auto` or `max-w-7xl`.
* **Viewport Stability:** NEVER use `h-screen` for full-height Hero sections. ALWAYS use `min-h-[100dvh]` to prevent layout jumping on mobile (iOS Safari address bar).
* **Grid over Flex-Math:** NEVER use complex flexbox percentage math (`w-[calc(33%-1rem)]`). ALWAYS use CSS Grid (`grid grid-cols-1 md:grid-cols-3 gap-6`).

### 3.F Dependency Verification (mandatory)
Before importing ANY 3rd-party library, check `package.json`. If the package is missing, output the install command first. **Never** assume a library exists.

---

## 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs default to clichés. Override these defaults proactively.

### 4.1 Typography
* **Display / Headlines:** Default `text-4xl md:text-6xl tracking-tighter leading-none`.
* **Body / Paragraphs:** Default `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
* **Sans font choice:**
  * **Discouraged as default:** `Inter`. Pick `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi`, or a brand-appropriate serif first.
  * **Override:** Inter is acceptable when the user explicitly asks for a neutral / standard / Linear-style feel, or when the brief is a public-sector / accessibility-first site.
* **Pairings to know:** `Geist` + `Geist Mono`, `Satoshi` + `JetBrains Mono`, `Cabinet Grotesk` + `Inter Tight`, `GT America` + `IBM Plex Mono`.

* **SERIF DISCIPLINE (VERY DISCOURAGED AS DEFAULT):**
  * Serif is **very discouraged as the default font for any project.** "It feels creative / premium / editorial" is NOT a reason to reach for serif.
  * **Serif is only acceptable when ONE of these is explicitly true:**
    - The brand brief literally names a serif font, OR
    - The aesthetic family is genuinely editorial / luxury / publication / manuscript / heritage / vintage AND you can articulate why this specific serif fits this specific brand
  * For everything else, **default sans-serif display**: Geist Display, ABC Diatype, Söhne Breit, Cabinet Grotesk Display, Migra Sans, GT Walsheim, Inter Display, PP Neue Montreal.
  * **EMPHASIS RULE:** When emphasizing a word within a headline, use **italic or bold of the SAME font**. Do NOT inject a random serif word into a sans headline. Mixed-family emphasis is amateur.
  * **Specifically BANNED as defaults:** `Fraunces` and `Instrument_Serif`.
  * **If a serif is justified** (rare): PP Editorial New, GT Sectra Display, Cardinal Grotesque, Reckless Neue, Tiempos Headline, Recoleta, Cormorant Garamond, Playfair Display, EB Garamond, IvyPresto, Migra, Editorial Old, Saol Display, Söhne Breit Kursiv, Domaine Display, Canela, Schnyder, Tobias, NB Architekt, ITC Galliard.

* **ITALIC DESCENDER CLEARANCE (mandatory):** When italic is used in display type and the word contains a descender letter (`y g j p q`), `leading-[1]` will clip the descender. Use `leading-[1.1]` minimum and add `pb-1` or `mb-1` reserve on the wrapping element.

### 4.2 Color Calibration
* Max 1 accent color. Saturation < 80% by default.
* **THE LILA RULE:** No AI Purple / Blue glow by default. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents (Emerald, Electric Blue, Deep Rose, Burnt Orange, etc.).
* **One palette per project.** Do not fluctuate between warm and cool grays.
* **COLOR CONSISTENCY LOCK (mandatory):** Once an accent is chosen, it is used on the WHOLE page. A warm-grey site does not suddenly get a blue CTA in section 7.

* **PREMIUM-CONSUMER PALETTE BAN (mandatory):**
  * Banned backgrounds: `#f5f1ea`, `#f7f5f1`, `#fbf8f1`, `#efeae0`, `#ece6db`, `#faf7f1`, `#e8dfcb` (warm paper / cream / chalk / bone)
  * Banned accents: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a`, `#bc7c3a`, `#7d5621` (brass / clay / oxblood / ochre)
  * Banned text: `#1a1714`, `#1a1814`, `#1b1814` (espresso / warm near-black)
  * **Default alternatives (rotate):** Cold Luxury (silver-grey + chrome + smoke), Forest (deep green + bone + amber), Black and Tan (true off-black + warm tan), Cobalt + Cream, Terracotta + Slate, Olive + Brick + Paper, Pure monochrome + single saturated pop.
  * **Override:** only when the brand brief explicitly names those colors.

### 4.3 Layout Diversification
* **ANTI-CENTER BIAS:** Centered Hero sections are avoided when `DESIGN_VARIANCE > 4`. Force "Split Screen" (50/50), "Left-aligned content / right-aligned asset", "Asymmetric white-space", or scroll-pinned structures.
* **Override:** centered hero is OK for editorial / manifesto / launch-announcement briefs.

### 4.4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy. Otherwise group with `border-t`, `divide-y`, or negative space.
* When a shadow is used, tint it to the background hue. No pure-black drop shadows on light backgrounds.
* **SHAPE CONSISTENCY LOCK (mandatory):** Pick ONE corner-radius scale for the page and stick to it.

### 4.5 Interactive UI States
* **Loading:** Skeletal loaders matching the final layout's shape.
* **Empty States:** Beautifully composed; indicate how to populate.
* **Error States:** Clear, inline (forms), or contextual (toasts only for transient).
* **Tactile Feedback:** On `:active`, use `-translate-y-[1px]` or `scale-[0.98]`.
* **BUTTON CONTRAST CHECK (mandatory, a11y):** Button text must be readable against button background. WCAG AA min (4.5:1 for body, 3:1 for large text).
* **CTA BUTTON WRAP BAN (mandatory):** Button text MUST fit on one line at desktop. 3 words max for primary CTAs, ideally 1-2.
* **NO DUPLICATE CTA INTENT (mandatory):** Two CTAs with the same intent on one page is a Pre-Flight Fail.
* **FORM CONTRAST CHECK (mandatory, a11y):** All form inputs, placeholder text, focus rings, helper text, and error text pass WCAG AA contrast.

### 4.6 Data & Form Patterns
* Label ABOVE input. Error text BELOW input. Standard `gap-2` for input blocks.
* No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules)

* **Hero MUST fit in the initial viewport.** Headline max 2 lines on desktop, subtext max **20 words** AND max 3-4 lines, CTAs visible without scroll.
* **Hero font-scale discipline.** Plan font size and image size together. Default range: `text-4xl md:text-5xl lg:text-6xl`. `text-6xl md:text-7xl` only when the headline is 3-5 words.
* **HERO TOP PADDING CAP (mandatory):** Hero top padding max `pt-24` (≈6rem) at desktop.
* **HERO STACK DISCIPLINE (max 4 text elements):**
  1. Eyebrow (small uppercase label) OR brand strip OR neither
  2. Headline (max 2 lines)
  3. Subtext (max 20 words, max 4 lines)
  4. CTAs (1 primary + max 1 secondary)
  - **BANNED in the hero:** tagline below CTAs, trust micro-strip, pricing teaser, feature bullet list, social-proof avatar row.
* **"Used by" / "Trusted by" logo wall belongs UNDER the hero, never inside it.**
* **Navigation MUST render on a single line on desktop.**
* **Navigation height cap: 80px max desktop, default 64-72px.**
* **Bento grids MUST have rhythm, not one-sided repetition.**
* **BENTO CELL COUNT RULE (mandatory):** N items → N cells. No empty cells.
* **Section-Layout-Repetition Ban.** Each layout family appears at most ONCE on the page. At least 4 different layout families across 8 sections.
* **ZIGZAG ALTERNATION CAP (mandatory).** Max 2 consecutive sections with image+text-split pattern. The 3rd is a Pre-Flight Fail.
* **EYEBROW RESTRAINT (mandatory, the #1 violated rule):**
  - **Maximum 1 eyebrow per 3 sections.** Hero counts as 1.
  - If section A has an eyebrow, the next 2 sections cannot have one.
  - **Pre-Flight Check is mechanical:** count instances of `uppercase tracking`. If count > ceil(sectionCount / 3), the output fails.
* **SPLIT-HEADER BAN (mandatory).** The pattern "left big headline + right small explainer paragraph" as a section header is **banned as default**. Stack them vertically instead.
* **Bento Background Diversity (mandatory).** At least 2-3 cells need real visual variation (image, gradient, pattern). Cream-on-cream bento with only typography is banned.
* **Mobile collapse must be explicit per section.**

### 4.8 Image & Visual Asset Strategy

**Priority order for visual assets:**
1. **Image-generation tool first.** If ANY image-gen tool is available, use it for section-specific assets.
2. **Real web images second.** `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` for placeholder photography.
3. **Last resort: tell the user.** Leave clearly-labeled placeholder slots and list what's needed.

**Even minimalist sites need real images.** At least 2-3 real images (hero, one product/lifestyle shot, one supporting image).

**Real company logos for social proof.** Use Simple Icons (`https://cdn.simpleicons.org/{slug}/ffffff`) or devicon. Do NOT use plain text wordmarks.
* **LOGO-ONLY rule (mandatory):** logo wall = logos and nothing else. No industry / category labels below each logo.

**Div-based fake screenshots are banned.** Never build a fake product UI out of `<div>` rectangles.

### 4.9 Content Density
* **Default content shape per section:** short headline (≤ 8 words) + short sub-paragraph (≤ 25 words) + one visual asset OR one CTA.
* **No data-dump sections.** Use top 3-5 highlights + "View full list" link, or marquee / carousel for breadth.
* **Long lists (> 5 items) need a different UI component:** 2-column split, card grid, tabs/accordion, horizontal scroll-snap pills, carousel, or marquee.
* **Spec sheets:** avoid `border-b` on every row. Use 2-col card grid, scroll-snap horizontal pills, grouped chunks, or featured-vs-rest.
* **COPY SELF-AUDIT (mandatory before ship):** Re-read every visible string. Flag grammatically broken, unclear referents, AI hallucination-sounding, or LLM-trying-to-sound-thoughtful copy. Rewrite every flagged string.
* **Fake-precise numbers are flagged.** Numbers must come from real data, be labeled as mock, or be omitted.
* **One copy register per page.**

### 4.10 Quotes & Testimonials
* **Max 3 lines** of quote body.
* Attribution: name + role + (optionally) company. Never name only.
* Quote marks: use real typographic quotes ( " " ) or none. Not straight ASCII ( " ).

### 4.11 Page Theme Lock (Light / Dark Mode Consistency)
* The page has ONE theme. Sections do not invert.
* Exception: explicit "Color Block Story" device, once per page, with a strong transition.
* When using shadcn/ui or Radix Themes, set the theme ONCE in `layout.tsx`.

---

## 5. CONTEXT-AWARE PROACTIVITY

These are tools, not defaults. Use them when the design read calls for them. **None of these fire automatically.**

* **Liquid Glass / Glassmorphism:** Appropriate for premium consumer, Apple-adjacent, luxury brand, or media-overlay vibes. Inappropriate for dashboards, public-sector, or "boring B2B." Always provide a solid-fill fallback under `prefers-reduced-transparency`.
* **Magnetic Micro-physics:** Use when `MOTION_INTENSITY > 5` AND the brief reads premium / playful / agency. Implement EXCLUSIVELY with Motion's `useMotionValue` / `useTransform`. Never `useState`.
* **Perpetual Micro-Interactions:** Use when `MOTION_INTENSITY > 5` AND the section actively benefits from motion. Apply Spring Physics (`type: "spring", stiffness: 100, damping: 20`).
* **"Motion claimed, motion shown."** If `MOTION_INTENSITY > 4`, the page must actually move.
* **MOTION MUST BE MOTIVATED (mandatory).** Before any animation, ask: "what does this communicate?" Valid: hierarchy, storytelling, feedback, state transition. Invalid: "it looked cool."
* **MARQUEE MAX-ONE-PER-PAGE (mandatory).** At most once per page.

### 5.A Sticky-Stack - Canonical Skeleton

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```

Critical: `start: "top top"`, `pin: true`, every card except the last is pinned.

### 5.B Horizontal-Pan - Canonical Skeleton

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

Critical: `start: "top top"`, `pin: true`, `end: "+=${distance}"`, `scrub: 1`.

### 5.C Scroll-Reveal Stagger - Canonical Skeleton

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

Use for: feature lists, testimonial grids, logo walls. Save GSAP for actual pin/scrub work.

### 5.D Forbidden Animation Patterns

* **`window.addEventListener("scroll", ...)`** is banned. Use Motion's `useScroll()`, GSAP's `ScrollTrigger`, IntersectionObserver, or CSS `scroll-driven animations`.
* **Custom scroll progress calculations using `window.scrollY`** in React state.
* **`requestAnimationFrame` loops that touch React state.** Use `useMotionValue` + `useTransform`.
* **Layout Transitions:** Use Motion's `layout` and `layoutId` props for visible state changes.
* **Staggered Orchestration:** Use `staggerChildren` (Motion) or CSS cascade.

---

## 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### 6.A Hardware Acceleration
* Animate ONLY `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
* Use `will-change: transform` sparingly.

### 6.B Reduced Motion (mandatory)
* **Any motion above `MOTION_INTENSITY > 3` MUST honor `prefers-reduced-motion`.**
* In Motion: wrap with `useReducedMotion()` and degrade to static.
* In CSS: gate animations behind `@media (prefers-reduced-motion: no-preference)`.
* Infinite loops, parallax, scroll-hijack, and magnetic physics MUST collapse to static under reduced motion.

### 6.C Dark Mode (mandatory for consumer-facing pages)
* Design for **both modes from the start**.
* Use Tailwind `dark:` variant OR CSS variables. Pick one per project.
* Respect `prefers-color-scheme: dark`. Default to system preference.

### 6.D Core Web Vitals Targets
* **LCP** < 2.5s. Hero image must be `next/image priority` or preloaded.
* **INP** < 200ms. Heavy work off main thread.
* **CLS** < 0.1. Reserve space for images, fonts, embeds.

### 6.E DOM Cost
* Apply grain / noise filters EXCLUSIVELY to fixed, `pointer-events-none` pseudo-elements. NEVER on scrolling containers.
* Be aware of bundle size. Lazy-load anything not above-the-fold.

### 6.F Z-Index Restraint
NEVER spam arbitrary `z-50` or `z-10`. Use z-index strictly for systemic layer contexts. Document the scale in a project constants file.

---

## 7. DIAL DEFINITIONS (Technical Reference)

### DESIGN_VARIANCE (Level 1-10)
* **1-3:** Symmetrical CSS Grid (12-col, equal fr-units), equal paddings, centered alignment.
* **4-7:** `margin-top: -2rem` overlaps, varied image aspect ratios, left-aligned headers over center-aligned data.
* **8-10:** Masonry layouts, CSS Grid with fractional units (`grid-template-columns: 2fr 1fr 1fr`), massive empty zones (`padding-left: 20vw`).
* **MOBILE OVERRIDE:** For levels 4-10, asymmetric layouts MUST collapse to strict single-column on viewports `< 768px`.

### MOTION_INTENSITY (Level 1-10)
* **1-3:** No automatic animations. CSS `:hover` and `:active` states only.
* **4-7:** `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`. Focus on `transform` and `opacity`.
* **8-10:** Complex scroll-triggered reveals, parallax, scroll-driven animation. **NEVER use `window.addEventListener('scroll')`** - hard ban.

### VISUAL_DENSITY (Level 1-10)
* **1-3:** Lots of white space. Huge section gaps (`py-32` to `py-48`).
* **4-7:** Standard web app spacing (`py-16` to `py-24`).
* **8-10:** Tight paddings. No card boxes; 1px lines separate data. `font-mono` for all numbers.

---

## 8. DARK MODE PROTOCOL

### 8.A Token Strategy (pick one)
* **Tailwind `dark:` variant** (default): every color utility paired with its dark variant.
* **CSS variables** (for shadcn/ui, Radix Themes): define semantic tokens and swap under `[data-theme="dark"]`.

### 8.B Enforcement
* **Contrast** - WCAG AA minimum for body text, AAA target for hero copy.
* **Hierarchy parity** - visual hierarchy that works in light must work in dark.
* **Brand fidelity** - primary brand color stays recognisable. Don't desaturate the brand.
* **No pure `#000000` and no pure `#ffffff`** - use off-black (zinc-950) and off-white.

### 8.C Default Mode
Respect `prefers-color-scheme` unless the brand insists. Test in both modes before finishing.

---

## 9. AI TELLS (Forbidden Patterns)

### 9.A Visual & CSS
* **NO neon / outer glows** by default.
* **NO pure black (`#000000`).**
* **NO oversaturated accents.**
* **NO excessive gradient text** for large headers.
* **NO custom mouse cursors.**

### 9.B Typography
* **AVOID Inter as default.**
* **NO oversized H1s** that just scream.
* **Serif constraints:** only for editorial / luxury / publication.

### 9.C Layout & Spacing
* **NO 3-column equal feature cards.** Use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll alternative.

### 9.D Content & Data ("Jane Doe" Effect)
* **NO generic names** (John Doe, Sarah Chan) → use creative, realistic, locale-appropriate names.
* **NO generic avatars** → use believable photo placeholders or specific styling.
* **NO fake-perfect numbers** → use organic, messy data (`47.2%`, `+1 (312) 847-1928`).
* **NO startup-slop brand names** (Acme, Nexus, SmartFlow) → invent contextual, premium names.
* **NO filler verbs** (Elevate, Seamless, Unleash, Next-Gen, Revolutionize) → concrete verbs only.

### 9.E External Resources
* **NO hand-rolled SVG icons.** Use Phosphor / HugeIcons / Radix / Tabler.
* **NO div-based fake screenshots.**
* **NO broken Unsplash links.** Use picsum.photos with a descriptive seed.
* **shadcn/ui:** NEVER in default state. Always customized.

### 9.F Production-Test Tells (banned outright)

**Hero & top-of-page**
* **NO version labels in the hero** (`V0.6`, `BETA`, `INVITE-ONLY PREVIEW`).
* **NO "Brand · No. 01"-style sub-eyebrows.**

**Section numbering & micro-labels**
* **NO section-number eyebrows** (`00 / INDEX`, `001 · Capabilities`, `06 · how it works`).
* **NO `01 / 4`-style pagination** on images or bento tiles.
* **NO `Scroll · 001 Capabilities`-style scroll cues.**

**Separators & dots**
* **The middle-dot (`·`) is rationed.** Maximum 1 per line. Do NOT use as default separator for everything.
* **NO decorative colored status dots on every list/nav/badge.**

**Em-dashes & typography flourishes**
* **NO em-dash (`—`) as a design element OR anywhere else.** (See Section 9.G - total ban.)
* **NO `<br>`-broken-and-italicized headlines** as a default design move.
* **NO vertical rotated text** as default.
* **NO crosshair / hairline grid lines as decoration.**

**Fake product previews**
* **NO div-based fake product UI in the hero.**
* **NO fake version footers** inside fake screenshots.

**Marketing-copy Tells**
* **NO "Quietly in use at" / "Quietly trusted by"** headers.
* **NO "From the field" / "Field notes" / "Currently on the bench"** style poetic labels.
* **NO weather / locale strips** (`LIS 14:23 · 18°C`) unless the brief is explicitly place-based.
* **NO micro-meta-sentences** under eyebrows.
* **NO generic step labels** ("Stage 1 / Stage 2" → use the actual verb-noun: "Install", "Configure", "Ship").

**Pills, labels and version stamps**
* **NO pills/labels/tags overlaid on images.**
* **NO photo-credit captions as decoration** (`Field study no. 12 · Ines Caetano`).
* **NO version footers** on marketing pages (`v1.4.2`, `Build 0048`).

**Decoration text strips**
* **NO decoration text strip at hero bottom** (`BRAND. MOTION. SPATIAL.`).
* **NO floating top-right sub-text** in section headings.

**Lists, dividers and scoring**
* **NO `border-t` + `border-b` on every row** of a long list / spec table.
* **NO scoring/progress bars with filled background tracks** as comparison visuals.

**Locale, time, scroll cues**
* **Locale / city-name / time / weather strips are banned for 99% of briefs.**
* **Scroll cues are banned** (`Scroll`, `↓ scroll`, `Scroll to explore`).
* **ZERO decorative status dots by default.**

### 9.G EM-DASH BAN (the single most-violated Tell)

**Em-dash (`—`) is COMPLETELY banned.** Zero instances anywhere.

* Banned in headlines, eyebrows, labels, pills, button text, captions, nav items, body copy, quote attribution.
* **Banned in en-dash form too (`–`) when used as a separator.** Date ranges use a hyphen. Number ranges use a hyphen.

The ONLY permitted dash characters: regular hyphen `-` and minus sign in math.

If your output contains a single `—` or `–` anywhere visible to the user, the output fails.

---

## 10. REFERENCE VOCABULARY (Pattern Names)

### Hero Paradigms
* **Asymmetric Split Hero** - Text on one side, asset on the other, generous white space.
* **Editorial Manifesto Hero** - Large type, no asset, almost-poster.
* **Video / Media Mask Hero** - Type cut out as mask over video background.
* **Kinetic-Type Hero** - Animated typography as the primary visual.
* **Curtain-Reveal Hero** - Hero parts on scroll like a curtain.
* **Scroll-Pinned Hero** - Hero stays pinned while content scrolls behind.

### Navigation & Menus
* **Mac OS Dock Magnification** - Edge nav, icons scale fluidly on hover.
* **Magnetic Button** - Pulls toward cursor.
* **Gooey Menu** - Sub-items detach like viscous liquid.
* **Dynamic Island** - Morphing pill for status / alerts.
* **Contextual Radial Menu** - Circular menu expanding at click point.
* **Mega Menu Reveal** - Full-screen dropdown, stagger-fade content.

### Layout & Grids
* **Bento Grid** - Asymmetric tile grouping.
* **Masonry Layout** - Staggered grid, no fixed row height.
* **Chroma Grid** - Borders / tiles with subtle animating gradients.
* **Split-Screen Scroll** - Two halves sliding in opposite directions.
* **Sticky-Stack Sections** - Sections that pin and stack on scroll.

### Cards & Containers
* **Parallax Tilt Card** - 3D tilt tracking mouse coordinates.
* **Spotlight Border Card** - Borders illuminate under cursor.
* **Glassmorphism Panel** - Frosted glass with inner refraction.
* **Holographic Foil Card** - Iridescent rainbow shift on hover.
* **Morphing Modal** - Button expands into its own dialog.

### Scroll Animations
* **Sticky Scroll Stack** - Cards stick and physically stack.
* **Horizontal Scroll Hijack** - Vertical scroll → horizontal pan.
* **Zoom Parallax** - Central background image zooming on scroll.
* **Scroll Progress Path** - SVG line drawing along scroll.

### Typography & Text
* **Kinetic Marquee** - Endless text bands reversing on scroll.
* **Text Mask Reveal** - Massive type as transparent window to video.
* **Text Scramble Effect** - Matrix-style decoding on load / hover.
* **Gradient Stroke Animation** - Outlined text with running gradient.
* **Kinetic Typography Grid** - Letters dodging the cursor.

### Animation Library Choice
* **Motion (`motion/react`)** - default for UI / Bento / state-change motion.
* **GSAP + ScrollTrigger** - for full-page scrolltelling and scroll hijacks. Isolate in dedicated leaf components with `useEffect` cleanup.
* **Three.js / WebGL** - for canvas backgrounds and 3D scenes.
* **NEVER mix GSAP / Three.js with Motion in the same component tree.**

---

## 11. REDESIGN PROTOCOL

### 11.A Detect the Mode
* **Greenfield** - no existing site, or full overhaul approved.
* **Redesign - Preserve** - modernise without breaking the brand. Audit first.
* **Redesign - Overhaul** - new visual language on top of existing content.

If ambiguous, ask **once**: *"Should this redesign preserve the existing brand, or are we starting visually from scratch?"*

### 11.B Audit Before Touching
Document: brand tokens, information architecture, content blocks, patterns to preserve, patterns to retire, dial reading of existing site, SEO baseline.

### 11.C Preservation Rules
* **Do not change information architecture** unless asked.
* **Extract brand colors before applying Section 4.2.**
* **Preserve copy voice** unless asked for a rewrite.
* **Honor existing accessibility wins.**
* **Respect existing analytics events.** Do not rename buttons, form fields, section IDs.

### 11.D Modernisation Levers (priority order)
1. Typography refresh
2. Spacing & rhythm
3. Color recalibration
4. Motion layer
5. Hero & key-section recomposition
6. Full block replacement (only when unsalvageable)

### 11.F What Never Changes Silently
URL structure, primary nav labels, form field names/order, brand logo, existing legal/consent copy.

---

## 14. FINAL PRE-FLIGHT CHECK

**THIS IS NOT OPTIONAL. Run every box. If any box fails, the output is not done.**

- [ ] **Brief inference** declared (Section 0.B one-liner)?
- [ ] **Dial values** explicit and reasoned from the brief?
- [ ] **Design system** chosen from Section 2 if applicable?
- [ ] **Redesign mode** detected and audit performed (if applicable)?
- [ ] **ZERO em-dashes (`—`) anywhere on the page.** (Section 9.G - non-negotiable.)
- [ ] **Page Theme Lock**: ONE theme for the whole page?
- [ ] **Color Consistency Lock**: one accent color across all sections?
- [ ] **Shape Consistency Lock**: one corner-radius system?
- [ ] **Button Contrast Check**: every CTA text readable against its background (WCAG AA 4.5:1)?
- [ ] **CTA Button Wrap**: no CTA label wraps to 2+ lines at desktop?
- [ ] **Form Contrast Check**: form inputs, placeholders, focus rings, labels all pass WCAG AA?
- [ ] **Serif discipline**: NOT Fraunces or Instrument_Serif (without explicit justification)?
- [ ] **Premium-consumer palette check**: NOT the AI-default beige+brass+espresso family?
- [ ] **Italic descender clearance**: every italic word with `y g j p q` has `leading-[1.1]` min?
- [ ] **Hero fits the viewport**: headline ≤ 2 lines, subtext ≤ 20 words, CTA visible without scroll?
- [ ] **Hero top padding**: max `pt-24`?
- [ ] **Hero stack discipline**: max 4 text elements?
- [ ] **EYEBROW COUNT**: count ≤ ceil(sectionCount / 3)?
- [ ] **Split-Header Ban**: no "left headline + right explainer paragraph" as section header?
- [ ] **Zigzag Alternation Cap**: no 3+ consecutive sections with the same image+text-split layout?
- [ ] **No Duplicate CTA Intent**?
- [ ] **Logo wall = logo only** (no category labels below logos)?
- [ ] **Bento Background Diversity**: at least 2-3 cells have real visual variation?
- [ ] **"Used by / Trusted by" logo wall UNDER the hero**, uses REAL SVG logos?
- [ ] **Copy Self-Audit**: every visible string re-read, no AI-hallucinated phrases?
- [ ] **Motion motivated**: every animation justifiable in one sentence?
- [ ] **Marquee max-one-per-page**?
- [ ] **Navigation on ONE line** at desktop, height ≤ 80px?
- [ ] **Section-Layout-Repetition** check: no two sections same layout family?
- [ ] **Bento has exact cell count** (N items → N cells, no empty cells)?
- [ ] **Long lists use the right UI component** (not `<ul>` with `divide-y` for > 5 items)?
- [ ] **Real images used** (gen-tool first, then Picsum-seed, then placeholder slots)?
- [ ] **No pills/labels overlaid on images**?
- [ ] **No photo-credit captions as decoration**?
- [ ] **No version footers** on marketing pages?
- [ ] **No micro-meta-sentences** under eyebrows?
- [ ] **No decoration text strip at hero bottom**?
- [ ] **No floating top-right sub-text** in section headings?
- [ ] **No scoring/progress bars with filled background tracks**?
- [ ] **No locale / city-name / time / weather strips**?
- [ ] **No scroll cues**?
- [ ] **No version labels in hero**?
- [ ] **No section-numbering eyebrows**?
- [ ] **No decorative dots**?
- [ ] **No `border-t` + `border-b` on every row** of long lists?
- [ ] **Content density sane**: no 20-row data tables, ≤ 25-word sub-paragraphs?
- [ ] **Quotes ≤ 3 lines**?
- [ ] **Motion claimed = motion shown**: if `MOTION_INTENSITY > 4`, page actually animates?
- [ ] **GSAP sticky-stack / horizontal-pan** per Section 5.A / 5.B canonical skeleton?
- [ ] **No `window.addEventListener('scroll')`**?
- [ ] **Reduced motion** wrapped for everything `MOTION_INTENSITY > 3`?
- [ ] **Dark mode** tokens defined and tested in both modes?
- [ ] **Mobile collapse** explicit for high-variance layouts?
- [ ] **Viewport stability**: `min-h-[100dvh]`, never `h-screen`?
- [ ] **`useEffect` animations** have strict cleanup functions?
- [ ] **Empty / loading / error** states provided?
- [ ] **Icons** from allowed library only (Phosphor / HugeIcons / Radix / Tabler)?
- [ ] **Motion** isolated in client-leaf components with `'use client'`?
- [ ] **No AI Tells** from Section 9?
- [ ] **Core Web Vitals** plausibly hit (LCP < 2.5s, INP < 200ms, CLS < 0.1)?
- [ ] **One design system** per project?

---

## Appendix A - Install Commands

```bash
npm install @material/web
npm install @fluentui/react-components
npm install @fluentui/web-components @fluentui/tokens
npm install @carbon/react @carbon/styles
npm install @radix-ui/themes
npx shadcn@latest init
npx shadcn@latest add button card badge separator input
npm install --save @primer/css
npm install @primer/react-brand
npm install govuk-frontend
npm install uswds
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button
npm install bootstrap
```

## Appendix C - Apple Liquid Glass: Honest Web Approximation

Apple Liquid Glass is documented for **Apple platforms only**. There is no `liquid-glass.css` from Apple for normal websites. Label web approximations clearly.

```css
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / .32);
  background:
    linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)),
    rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .48),
    inset 0 -1px 0 rgb(255 255 255 / .12),
    0 18px 60px rgb(0 0 0 / .18);
}

.liquid-glass-web-approx::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background:
    radial-gradient(circle at 20% 0%, rgb(255 255 255 / .55), transparent 34%),
    linear-gradient(90deg, rgb(255 255 255 / .18), transparent 42%, rgb(255 255 255 / .14));
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / .18);
    background:
      linear-gradient(135deg, rgb(255 255 255 / .16), rgb(255 255 255 / .04)),
      rgb(15 23 42 / .42);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / .22),
      0 18px 60px rgb(0 0 0 / .42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / .96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```
