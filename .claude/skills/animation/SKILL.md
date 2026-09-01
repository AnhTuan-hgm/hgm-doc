---
name: animation
description: Audit every animation on the site — inventory all motion, check it against the ui-motion rules, and report violations and opportunities. Use when the user types /animation or asks to review/audit the site's animations or motion.
---

Review the whole site's motion. This is a REVIEW: report findings ranked by impact; only fix things when the user asks (or arguments say "fix").

Ported from the HiddenGem marketing site, which pairs this with `/animation0` (build motion for one page) and `/animationall` (all pages). Neither is installed here — say so rather than pointing the user at a skill this repo does not have.

**Exclusions (site policy):** `/manual` and the sign-in gates (`DashboardAccessGate`, `TeamGate`, the owner-guide share gate) must have NO entrance animation — motion found there is a violation, not an opportunity. Client-facing intake forms (`/brand-vision-form`, `/client-onboarding-form`, `/host-onboarding-form`) allow micro-interactions only; a form that moves while someone is filling it in is hostile. Everything else is fair game.

## 1. Inventory (grep, don't guess)

This is a Vite SPA — pages live in `src/pages`, not `src/app`:

```bash
grep -rn "animate-\|transition \|transition-\|duration-" src/pages src/components --include="*.tsx" | grep -v node_modules
grep -rn "motion/react\|AnimatePresence\|whileInView\|useScroll\|useInView" src/ --include="*.tsx"
grep -n "@keyframes\|animation:\|scroll-behavior\|transition" src/styles/*.css
grep -rn "TextFx\|<Reveal" src/pages src/components --include="*.tsx"
```

Group into: micro-interactions (hover/focus transitions), self-running (the `.step-beam` band etc.), entrances/reveals, motion/react orchestration, TextFx usage, and global (smooth scroll).

## 2. Check each against the ui-motion rules

The rulebook is `~/.claude/agents/ui-motion.md` (user level — this repo has no copy). Per finding, cite file:line and the rule:

- **Reduced motion**: every animation beyond a 100ms micro-transition has `motion-reduce:` / `useReducedMotion` coverage. Highest-severity check. `src/styles/globals.css` already does this for `.step-beam` — that is the pattern to match.
- **Properties**: transform/opacity only (filter allowed for TextFx blur-in). Flag any animated width/height/top/left/margin.
- **Timing**: micro = `duration-100 ease-linear` (the house rule — flag drift like duration-200/300 on hovers); entrances 300–500ms, hard cap 700ms; stagger ≤ 80ms. Side-menu nav items stagger at 0.05s and icon rails do not animate — both are deliberate, not drift.
- **Reveals fire once** (`viewport={{ once: true }}`) — content never re-hides. `src/components/shared-assets/reveal.tsx` is the house reveal (fade + 24px rise, 120px pre-trigger); a hand-rolled equivalent elsewhere is drift.
- **Consistency**: same interaction → same animation everywhere (all cards hover alike, all reveals alike). Flag one-off snowflakes.
- **Taste**: nothing autoplaying except the sign-in backdrop video; no motion that exists purely as decoration.

There are no server components here, so the "motion only in leaf `use client` components" rule from the Next original does not apply — skip it rather than reporting phantom violations.

## 3. Look at it (when possible)

Playwright MCP is usually available. The dev server is `http://localhost:5180` (`/dev` pins it). Load `/`, `/manual`, a client dashboard and one intake form at desktop + 360px; watch entrances once, then reload with reduced motion emulated and confirm each page is complete without them. No browser tool → say so in the report instead of pretending.

## 4. Opportunities (max 5)

Where would restrained motion earn its place that currently has none? Each: location, effect, one-line justification. Suggestions, not TODOs. Respect the exclusions above.

## 5. Report format

1. **Inventory summary** — counts per category, one line each.
2. **Violations** — ranked by severity (reduced-motion gaps first), each with file:line, rule broken, concrete fix.
3. **Consistency drift** — grouped list.
4. **Opportunities** — max 5.
5. **Verdict** — one paragraph: is the site's motion coherent?

Offer to apply fixes at the end; apply immediately only if the user passed "fix" in the arguments.
