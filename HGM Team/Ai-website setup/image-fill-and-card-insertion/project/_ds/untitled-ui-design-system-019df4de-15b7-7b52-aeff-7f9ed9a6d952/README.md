# Untitled UI — Design System

A faithful HTML/CSS recreation of the **Untitled UI** design system (Untitled UI PRO, 2025 edition). Tokens live in `colors_and_type.css`; everything else consumes them.

## Brand at a glance
- **Voice** — confident, modular, precise. "The world's largest UI kit."
- **Primary brand color** — Violet `#7F56D9` (Brand 600)
- **Type** — Inter (display + body), JetBrains Mono (code)
- **Geometry** — 8px radius default, 4px spacing base, soft skeuomorphic shadows
- **Surfaces** — white cards, gray-50 page bg, gray-950 dark surfaces

## What's here

### Foundations (`colors_and_type.css`)
All tokens as CSS custom properties:
- `--gray-25 … --gray-950` neutrals
- `--brand-25 … --brand-900` violet ramp
- `--error / --warning / --success / --blue` semantic ramps
- `--fg-primary / --fg-secondary / --fg-tertiary / --fg-quaternary / --fg-placeholder`
- `--border-primary / --border-secondary`
- `--shadow-xs … --shadow-2xl` plus the signature `--shadow-skeu-*` button shadows
- `--font-display / --font-body / --font-mono`

### Preview cards (`preview/`)
One small HTML file per token group — colors, scales, semantics, type, spacing, radius, shadows, buttons, inputs, badges, avatars, card, logo. These are the cards that appear in the Design System tab.

### UI kits (`ui_kits/`)
Two end-to-end pages built on top of the tokens:
- **web-app** — dashboard with sidebar, metrics, chart, activity feed, customers table
- **marketing** — landing page with hero, features, testimonial, pricing, footer

### `SKILL.md`
A short cheat sheet for using these tokens to build new screens.

## Caveats
- No React component library — these are HTML pages that demonstrate patterns. Lift the markup + class structures into your stack of choice.
- Icon set is hand-rolled inline SVG using Lucide geometry. Swap in a real icon font/library for production.
- Logo is a placeholder mark, not the real Untitled UI wordmark.
- Brand and product names ("Untitled UI") are referenced for fidelity to the source kit only.
