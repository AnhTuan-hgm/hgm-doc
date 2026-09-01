---
name: textfx
description: Apply text-entrance effects (staggered fade-up, blur-in, mask-rise, scale-in, scramble) to headings and short lines using the TextFx component. Use when the user asks for animated text, text effects, a heading reveal, typewriter/scramble text, or names an effect from tools like TextFX Studio.
---

Text effects on this site come from ONE component: `TextFx` at `src/components/marketing/text-effects/text-fx.tsx`. Never hand-roll a new split-text animation on a page — use it, or extend it (one new entry in its `variants` map) if a preset is genuinely missing. All ui-motion agent rules apply (`~/.claude/agents/ui-motion.md`) (timing caps, reduced-motion, one animated heading per viewport).

## Usage

The caller owns the heading tag; TextFx renders inline spans:

```tsx
import { TextFx } from "@/components/marketing/text-effects/text-fx";

<h2 className="text-display-md font-semibold text-primary">
    <TextFx effect="mask-rise">Direct bookings, done right</TextFx>
</h2>
```

Props: `effect`, `splitBy` ("word" | "char", sensible default per effect), `delay`, `duration` (≤0.7s enforced), `stagger` (≤0.08s enforced), `className`.

## The catalog — which effect where

| Effect | Feel | Use for |
|---|---|---|
| `fade-up` (default) | quiet, editorial | section headings, the safe default |
| `mask-rise` | premium, typographic | hero headlines, big display text (words rise out of their own line) |
| `blur-in` | soft, atmospheric | short taglines over imagery |
| `scale-in` | confident pop | badges, kickers, single stat labels |
| `scramble` | technical decode | numbers, metric labels, "TEAM ASSET"-style chips — sparingly, max one per page |

## Rules

- **Headings and short lines only** (≲12 words). Never body paragraphs — readers beat animations, and reflowing text mid-read is hostile.
- **One animated heading per viewport.** Two things staggering at once reads as noise.
- Effects fire once on scroll into view and never re-hide (built in: `viewport={{ once: true }}`).
- Reduced motion renders plain static text (built in — do not add another wrapper).
- Accessibility is built in (single `aria-label`, split spans `aria-hidden`); don't split text manually outside the component.
- `blur-in` is the one sanctioned non-transform/opacity effect (GPU-composited filter, entrance only). Everything new must animate transform/opacity.

## Extending

Add a preset = one `Variants` entry in the component's `variants` map + a row in this catalog. If an idea needs timelines beyond variants (per-glyph physics, text morphing), stop and consult the ui-motion agent rules — do not add GSAP or a splitting library.
