# UI UX Pro Max

A professional UI/UX design intelligence skill based on the ui-ux-pro-max-skill repository. Covers 99+ UX guidelines, 10 priority rule categories, pre-delivery checklists, and design system generation guidance.

Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT License)

---

## When to Use This Skill

Use when the task involves **UI structure, visual design decisions, interaction patterns, or UX quality control**.

**Must use:**
- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts)
- Choosing color schemes, font systems, spacing, or layout
- Reviewing UI code for UX, accessibility, or visual consistency
- Implementing navigation structure, animation, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand)
- Improving perceived quality, clarity, or usability

**Skip:**
- Pure backend logic
- API or database design only
- Infrastructure or DevOps work
- Non-visual scripts or automation

**Rule of thumb:** If the task changes how something **looks, feels, moves, or is interacted with** — use this skill.

---

## Workflow

### Step 1: Analyze Requirements

Extract from the user request:
- **Product type**: Entertainment (social, video, music, gaming), Tool (scanner, editor, converter), Productivity (task manager, notes, calendar), or hybrid
- **Target audience**: Consumer vs professional, age group, usage context
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Tech stack**: React, Next.js, Vue, SwiftUI, React Native, Flutter, etc.

### Step 2: Apply Design System Thinking

Before generating code, determine:
1. **Pattern** — which UI pattern best fits this product type
2. **Style** — which visual style fits (glassmorphism, minimalism, brutalism, neumorphism, bento, etc.)
3. **Colors** — palette aligned with the product category and industry
4. **Typography** — font pairing (heading + body) with correct scale
5. **Effects** — shadows, blur, radius consistent with chosen style
6. **Anti-patterns** — which approaches to avoid for this product type

### Step 3: Apply Relevant Rules

Select rules from the 10 categories below based on what's being built. Check the Priority column to focus effort — CRITICAL first, then HIGH, MEDIUM, LOW.

### Step 4: Pre-Delivery Checklist

Run through the checklist at the bottom before finalizing any UI implementation.

---

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks |
|---|---|---|---|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels |
| 2 | Touch & Interaction | CRITICAL | Min 44×44px targets, 8px+ spacing, Loading feedback |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) |
| 5 | Layout & Responsive | HIGH | Mobile-first, Viewport meta, No horizontal scroll |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Progressive disclosure |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5, Deep linking |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors |

---

## 1. Accessibility (CRITICAL)

- `color-contrast` — Minimum 4.5:1 for normal text, 3:1 for large text
- `focus-states` — Visible focus rings on all interactive elements (2–4px)
- `alt-text` — Descriptive alt text for meaningful images
- `aria-labels` — aria-label for icon-only buttons; accessibilityLabel in native
- `keyboard-nav` — Tab order matches visual order; full keyboard support
- `form-labels` — Use `<label>` with `for` attribute on every input
- `skip-links` — "Skip to main content" for keyboard users
- `heading-hierarchy` — Sequential h1→h6, never skip levels
- `color-not-only` — Never convey meaning by color alone (add icon/text)
- `dynamic-type` — Support system text scaling; avoid truncation as text grows
- `reduced-motion` — Respect `prefers-reduced-motion`; reduce/disable animations
- `voiceover-sr` — Meaningful accessibilityLabel/accessibilityHint; logical reading order
- `escape-routes` — Cancel/back affordance in all modals and multi-step flows
- `keyboard-shortcuts` — Preserve system and a11y shortcuts; offer keyboard alternatives for drag-and-drop

---

## 2. Touch & Interaction (CRITICAL)

- `touch-target-size` — Min 44×44pt (iOS) / 48×48dp (Android); extend hit area via hitSlop
- `touch-spacing` — Minimum 8px/8dp gap between interactive targets
- `hover-vs-tap` — Use click/tap for primary actions; never rely on hover alone
- `loading-buttons` — Disable during async; show spinner or progress indicator
- `error-feedback` — Clear error messages near the problem field
- `cursor-pointer` — `cursor: pointer` on all clickable elements (web)
- `gesture-conflicts` — Avoid horizontal swipe on scrollable content
- `tap-delay` — Use `touch-action: manipulation` to eliminate 300ms delay (web)
- `standard-gestures` — Use platform standard gestures; don't redefine swipe-back, pinch-zoom
- `press-feedback` — Visual feedback on press (ripple/highlight) within 100ms
- `haptic-feedback` — Haptics for confirmations and important actions; avoid overuse
- `safe-area-awareness` — Keep primary touch targets away from notch, Dynamic Island, gesture bar
- `swipe-clarity` — Swipe actions must show clear affordance or hint
- `drag-threshold` — Use movement threshold before starting drag to prevent accidental drags

---

## 3. Performance (HIGH)

- `image-optimization` — Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- `image-dimension` — Declare width/height or use aspect-ratio to prevent CLS
- `font-loading` — Use `font-display: swap/optional` to avoid invisible text (FOIT)
- `font-preload` — Preload only critical fonts; don't preload every variant
- `critical-css` — Prioritize above-the-fold CSS
- `lazy-loading` — Lazy load non-hero components via dynamic import / route-level splitting
- `bundle-splitting` — Split code by route/feature (React Suspense / Next.js dynamic)
- `third-party-scripts` — Load async/defer; audit and remove unnecessary scripts
- `virtualize-lists` — Virtualize lists with 50+ items
- `main-thread-budget` — Keep per-frame work under ~16ms for 60fps
- `progressive-loading` — Use skeleton screens / shimmer for operations >1s
- `input-latency` — Keep input latency under ~100ms for taps/scrolls
- `debounce-throttle` — Debounce/throttle high-frequency events (scroll, resize, input)
- `offline-support` — Provide offline state messaging and basic fallback

---

## 4. Style Selection (HIGH)

- `style-match` — Match visual style to product type (SaaS → clean/minimal, gaming → bold/dark, wellness → soft/warm)
- `consistency` — Use the same style across all pages and components
- `no-emoji-icons` — Use vector icons (Phosphor, Heroicons, Lucide), never emoji as UI icons
- `color-palette-from-product` — Choose palette from product category and industry
- `effects-match-style` — Shadows, blur, radius aligned with chosen style (glass / flat / clay / neumorphic)
- `platform-adaptive` — Respect platform idioms: iOS HIG vs Material Design
- `state-clarity` — Hover/pressed/disabled states are visually distinct
- `elevation-consistent` — Consistent elevation/shadow scale for cards, sheets, modals
- `dark-mode-pairing` — Design light and dark variants together; test contrast independently
- `icon-style-consistent` — One icon set/visual language (stroke width, corner radius) across the product
- `primary-action` — One primary CTA per screen; secondary actions visually subordinate
- `blur-purpose` — Blur indicates background dismissal (modals, sheets), not decoration

**Common UI styles:**
| Style | Best for | Characteristics |
|---|---|---|
| Glassmorphism | SaaS, fintech, premium apps | Frosted glass, backdrop blur, semi-transparent |
| Minimalism | Productivity, tools, editorial | White space, clean typography, flat |
| Brutalism | Creative, portfolio, edgy brands | Bold borders, raw layout, stark contrast |
| Neumorphism | Wellness, lifestyle, soft apps | Soft shadows, monochromatic, tactile |
| Bento Grid | Dashboards, portfolios | Card-based, asymmetric grid, varied sizes |
| Dark Mode | Gaming, media, developer tools | Deep backgrounds, vibrant accents |
| Claymorphism | Consumer apps, playful brands | Inflated 3D, pastel, rounded shadows |

---

## 5. Layout & Responsive (HIGH)

- `viewport-meta` — Always `width=device-width initial-scale=1` (never disable zoom)
- `mobile-first` — Design mobile-first, scale up to tablet and desktop
- `breakpoint-consistency` — Systematic breakpoints: 375 / 768 / 1024 / 1440
- `readable-font-size` — Minimum 16px body text on mobile (avoids iOS auto-zoom)
- `line-length-control` — Mobile: 35–60 chars/line; desktop: 60–75 chars/line
- `horizontal-scroll` — Zero horizontal scroll on mobile
- `spacing-scale` — Use 4pt/8dp incremental spacing system
- `touch-density` — Comfortable spacing for touch; not cramped, not sparse
- `container-width` — Consistent max-width on desktop (max-w-6xl / 7xl)
- `z-index-management` — Defined z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- `fixed-element-offset` — Fixed nav/bottom bar reserves safe padding for underlying content
- `scroll-behavior` — No nested scroll regions that interfere with main scroll
- `viewport-units` — Prefer `min-h-dvh` over `100vh` on mobile
- `orientation-support` — Layout must be readable in landscape
- `visual-hierarchy` — Establish hierarchy via size, spacing, contrast — not color alone

---

## 6. Typography & Color (MEDIUM)

- `line-height` — 1.5–1.75 for body text
- `line-length` — 65–75 characters per line
- `font-pairing` — Match heading and body font personalities (serif/sans, display/text)
- `font-scale` — Consistent type scale: 12 / 14 / 16 / 18 / 24 / 32
- `weight-hierarchy` — Bold headings (600–700), Regular body (400), Medium labels (500)
- `color-semantic` — Define semantic color tokens (primary, secondary, error, surface, on-surface), not raw hex
- `color-dark-mode` — Dark mode uses desaturated/lighter tonal variants, not inverted colors
- `color-accessible-pairs` — Foreground/background must meet 4.5:1 (AA) or 7:1 (AAA)
- `color-not-decorative-only` — Functional colors (error red, success green) must include icon/text; never color-only meaning
- `truncation-strategy` — Prefer wrapping; when truncating use ellipsis + tooltip for full text
- `letter-spacing` — Avoid tight tracking on body text
- `number-tabular` — Tabular/monospaced figures for data columns, prices, timers
- `whitespace-balance` — Use whitespace to group related items and separate sections

**Typography pairings by product type:**
| Product | Heading | Body |
|---|---|---|
| SaaS / Tech | Inter, DM Sans | Inter, Geist |
| Editorial / Blog | Playfair Display, Merriweather | Source Serif 4, Lora |
| Fintech | Neue Montreal, Syne | IBM Plex Sans |
| E-commerce | Fraunces, Cormorant | Nunito Sans |
| Wellness / Lifestyle | Cormorant, Playfair | Jost, Raleway |
| Developer Tool | JetBrains Mono, Fira Code | Inter |

---

## 7. Animation (MEDIUM)

- `duration-timing` — Micro-interactions: 150–300ms; complex transitions: ≤400ms; never >500ms
- `transform-performance` — Animate `transform` and `opacity` only; never `width`, `height`, `top`, `left`
- `loading-states` — Skeleton or progress indicator when loading >300ms
- `easing` — `ease-out` for entering, `ease-in` for exiting; avoid linear for UI transitions
- `motion-meaning` — Every animation expresses cause-effect; no purely decorative motion
- `spring-physics` — Prefer spring/physics-based curves for natural feel
- `exit-faster-than-enter` — Exit animations ~60–70% the duration of enter
- `stagger-sequence` — Stagger list/grid item entrance 30–50ms per item
- `interruptible` — Animations must be interruptible by user tap/gesture immediately
- `no-blocking-animation` — Never block user input during an animation
- `reduced-motion` — All animations must be skippable via `prefers-reduced-motion`
- `scale-feedback` — Subtle scale (0.95–1.05) on press for tappable cards/buttons
- `navigation-direction` — Forward: animates left/up; backward: animates right/down
- `layout-shift-avoid` — Animations must not cause layout reflow or CLS

---

## 8. Forms & Feedback (MEDIUM)

- `input-labels` — Visible label per input (never placeholder-only)
- `error-placement` — Show error below the related field, not only at top
- `submit-feedback` — Loading → then success/error state on every submit
- `required-indicators` — Mark required fields (asterisk or text)
- `empty-states` — Helpful message and action when content is empty
- `toast-dismiss` — Auto-dismiss toasts in 3–5 seconds
- `confirmation-dialogs` — Confirm before all destructive actions
- `inline-validation` — Validate on blur (not on keystroke)
- `input-type-keyboard` — Use semantic input types (email, tel, number) for correct mobile keyboard
- `password-toggle` — Show/hide toggle on password fields
- `autofill-support` — `autocomplete` / `textContentType` attributes for system autofill
- `progressive-disclosure` — Reveal complex options progressively; don't overwhelm upfront
- `error-clarity` — Error messages state cause + how to fix (never just "Invalid input")
- `focus-management` — After submit error, auto-focus the first invalid field
- `multi-step-progress` — Multi-step flows show step indicator; allow back navigation
- `destructive-emphasis` — Destructive actions use semantic danger color and are spatially separated
- `undo-support` — Allow undo for destructive or bulk actions

---

## 9. Navigation Patterns (HIGH)

- `bottom-nav-limit` — Bottom navigation max 5 items; always icons + labels
- `drawer-usage` — Drawer/sidebar for secondary navigation, not primary actions
- `back-behavior` — Predictable and consistent back navigation; preserve scroll/state
- `deep-linking` — All key screens reachable via deep link / URL
- `tab-bar-ios` — iOS: bottom Tab Bar for top-level navigation
- `top-app-bar-android` — Android: Top App Bar with navigation icon
- `nav-state-active` — Current location highlighted (color, weight, indicator)
- `nav-hierarchy` — Primary nav (tabs/bottom bar) vs secondary nav (drawer/settings) are clearly separated
- `modal-escape` — Modals and sheets always have a clear close/dismiss affordance
- `search-accessible` — Search is easily reachable from top level; provide recent/suggested queries
- `state-preservation` — Navigating back restores scroll position, filters, and input state
- `gesture-nav-support` — Support system gesture navigation (iOS swipe-back, Android predictive back)
- `avoid-mixed-patterns` — Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- `modal-vs-navigation` — Modals must not be used for primary navigation flows
- `back-stack-integrity` — Never silently reset the navigation stack

---

## 10. Charts & Data (LOW)

- `chart-type` — Match chart to data: trend → line, comparison → bar, proportion → pie/donut
- `color-guidance` — Accessible palettes; avoid red/green-only pairs for colorblind users
- `data-table` — Provide table alternative; charts alone are not screen-reader friendly
- `legend-visible` — Always show legend near the chart
- `tooltip-on-interact` — Tooltips showing exact values on hover (web) or tap (mobile)
- `axis-labels` — Label axes with units; avoid truncated or rotated labels on mobile
- `responsive-chart` — Charts reflow or simplify on small screens
- `empty-data-state` — Meaningful empty state when no data ("No data yet" + guidance)
- `loading-chart` — Skeleton/shimmer while data loads; never empty axis frame
- `no-pie-overuse` — Max 5 categories in a pie/donut; use bar chart beyond that
- `touch-target-chart` — Interactive chart elements have ≥44pt tap area
- `gridline-subtle` — Grid lines low-contrast (gray-200) so they don't compete with data
- `trend-emphasis` — Emphasize data trends; avoid heavy gradients/shadows that obscure data

---

## Icons & Visual Elements

| Rule | Do | Avoid |
|---|---|---|
| **No emoji as icons** | Use Phosphor, Heroicons, Lucide (SVG) | 🎨 🚀 ⚙️ as navigation/system icons |
| **Vector-only assets** | SVG or platform vector icons | Raster PNG that blur/pixelate |
| **Stable interaction states** | Color/opacity/elevation transitions | Layout-shifting transforms |
| **Correct brand logos** | Official assets, follow usage guidelines | Guessing paths, recoloring unofficially |
| **Consistent icon sizing** | Design tokens: icon-sm / icon-md (24pt) / icon-lg | Mixing 20/24/28pt randomly |
| **Stroke consistency** | Consistent stroke width (1.5px or 2px) within same layer | Mixing thick/thin strokes arbitrarily |
| **Filled vs outline discipline** | One icon style per hierarchy level | Mixing filled and outline at same level |
| **Touch target** | Min 44×44pt; use hitSlop to expand | Small icons without expanded tap area |
| **Icon alignment** | Align to text baseline; consistent padding | Misaligned icons or inconsistent spacing |
| **Icon contrast** | 4.5:1 for small elements; 3:1 minimum for larger UI glyphs | Low-contrast icons blending into background |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (SVG only)
- [ ] All icons from a consistent icon family and style
- [ ] Official brand assets with correct proportions and clear space
- [ ] Pressed states don't shift layout bounds or cause jitter
- [ ] Semantic theme tokens used consistently (no per-screen hardcoded hex)

### Interaction
- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets ≥44×44pt (iOS) / ≥48×48dp (Android)
- [ ] Micro-interaction timing: 150–300ms with native easing
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order; labels are descriptive
- [ ] No nested/conflicting gesture regions

### Light/Dark Mode
- [ ] Primary text contrast ≥4.5:1 in both light and dark
- [ ] Secondary text contrast ≥3:1 in both modes
- [ ] Dividers/borders visible in both modes
- [ ] Modal scrim opacity 40–60% black
- [ ] Both themes tested independently (not inferred from one)

### Layout
- [ ] Safe areas respected for headers, tab bars, and bottom CTAs
- [ ] Scroll content not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] 4/8dp spacing rhythm maintained throughout
- [ ] Long-form text readable on large devices (no edge-to-edge paragraphs)

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator for any state or action
- [ ] Reduced motion and dynamic text size supported without layout breakage
- [ ] Accessibility traits/roles/states announced correctly (selected, disabled, expanded)

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| Placeholder-only labels | Disappears on focus; accessibility failure | Add visible `<label>` above each field |
| Emoji as navigation icons | Font-dependent, inconsistent, can't be themed | Use vector icon library |
| Hover-only interactions | Broken on touch devices | Add tap/click fallback |
| Color-only error states | Colorblind users miss the error | Add icon + text alongside color |
| Mixing glassmorphism + brutalism randomly | Incoherent visual language | Pick one style system and stay consistent |
| Animating width/height | Triggers layout reflow, janky | Use transform + opacity only |
| Relying on 100vh on mobile | Browser chrome causes overflow | Use `dvh` or `svh` |
| Nesting horizontal scroll inside vertical scroll | Gesture conflict, unusable | Redesign to avoid nested scroll |
| Modals for primary navigation | Breaks back-nav, hides breadcrumbs | Use full-screen routes instead |
| Icon-only bottom nav (no labels) | Discoverability failure | Always include icon + text label |
