---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Color tokens (Untitled UI semantic colors)

MUST use semantic color classes to style elements — never raw Tailwind palette values.

Bad: `text-gray-900`, `text-gray-600`, `bg-blue-700`, `border-red-300`, `hover:bg-red-50`
Good: `text-primary`, `text-secondary`, `bg-primary`, `border-error`, `hover:bg-error-primary`

These tokens adapt automatically across light and dark modes via the CSS-variable theme. Raw palette utilities (`text-red-600`, `bg-blue-700`, …) are fixed values that break dark mode.

## Brand color customization
To change the brand color across the app, edit `src/styles/theme.css` and modify the `--color-brand-*` variables (provide the full 25→950 scale). The scale adapts to light/dark automatically.

```css
--color-brand-25: rgb(252 250 255);  /* lightest tint */
--color-brand-500: rgb(158 119 237); /* base brand */
--color-brand-600: rgb(127 86 217);  /* primary interactive */
--color-brand-950: rgb(44 28 95);    /* darkest */
```

## Text color

| Name | Usage |
| :-- | :-- |
| text-primary | Primary text such as page headings. |
| text-primary_on-brand | Primary text on solid brand backgrounds (e.g. CTA sections). |
| text-secondary | Secondary text such as labels and section headings. |
| text-secondary_hover | Secondary text, hover state. |
| text-secondary_on-brand | Secondary text on solid brand backgrounds. |
| text-tertiary | Tertiary text such as supporting/paragraph text. |
| text-tertiary_hover | Tertiary text, hover state. |
| text-tertiary_on-brand | Tertiary text on solid brand backgrounds. |
| text-quaternary | Lower-contrast subtle text (e.g. footer column headings). |
| text-quaternary_on-brand | Quaternary text on solid brand backgrounds. |
| text-white | Always white, regardless of mode. |
| text-placeholder | Placeholder text (input fields). |
| text-brand-primary | Primary brand text (e.g. pricing card headers). |
| text-brand-secondary | Secondary brand text (brand buttons, accents, subheadings). |
| text-brand-secondary_hover | Secondary brand text, hover. |
| text-brand-tertiary | Tertiary brand text (e.g. metric numbers). |
| text-brand-tertiary_alt | Tertiary brand text, lighter in dark mode. |
| text-error-primary | Error state text (e.g. input field errors). |
| text-warning-primary | Warning state text. |
| text-success-primary | Success state text. |

## Border color

Same values work for `ring-` and `outline-` (e.g. `ring-primary`, `outline-secondary`).

| Name | Usage |
| :-- | :-- |
| border-primary | High-contrast borders (inputs, button groups, checkboxes). |
| border-secondary | Default/most-common border (cards, dividers, file uploaders). |
| border-secondary_alt | Alpha-transparency secondary border for floating menus (dropdowns, notifications). |
| border-tertiary | Low-contrast subtle dividers (chart axes). |
| border-brand | Default brand border (active input states). |
| border-brand_alt | Brand border that switches to gray in dark mode (banners, footers). |
| border-error | Default error border (input errors, file uploaders). |
| border-error_subtle | Subtler error border. |

## Foreground color

Usable via `text-`, `bg-`, `ring-`, `outline-`, `stroke-`, `fill-`, etc.

| Name | Usage |
| :-- | :-- |
| fg-primary | Highest-contrast non-text foreground (icons). |
| fg-secondary | High-contrast foreground (icons). |
| fg-secondary_hover | Secondary foreground, hover. |
| fg-tertiary | Medium-contrast foreground (icons). |
| fg-tertiary_hover | Tertiary foreground, hover. |
| fg-quaternary | Low-contrast foreground (button/help/input icons). |
| fg-quaternary_hover | Quaternary foreground, hover. |
| fg-white | Always white. |
| fg-brand-primary | Primary brand foreground (featured icons, progress bars). |
| fg-brand-primary_alt | Brand foreground that switches to gray in dark mode (active tabs). |
| fg-brand-secondary | Secondary brand foreground (accents, arrows). |
| fg-brand-secondary_alt | Secondary brand foreground, gray in dark mode (brand buttons). |
| fg-error-primary | Primary error foreground (featured icons). |
| fg-error-secondary | Secondary error foreground (error input icons, negative metrics). |
| fg-warning-primary | Primary warning foreground (featured icons). |
| fg-warning-secondary | Secondary warning foreground. |
| fg-success-primary | Primary success foreground (featured icons). |
| fg-success-secondary | Secondary success foreground (button/avatar dots, positive metrics). |

## Background color

| Name | Usage |
| :-- | :-- |
| bg-primary | Primary background (white) across layouts/components. |
| bg-primary_alt | Primary bg that switches to bg-secondary in dark mode. |
| bg-primary_hover | Default hover bg for white-background components (dropdown items). |
| bg-primary-solid | Primary dark bg (tooltips, editor tooltips); switches to bg-secondary in dark mode. |
| bg-secondary | Secondary bg for contrast against white (section backgrounds). |
| bg-secondary_alt | Secondary bg that switches to bg-primary in dark mode (border-style tabs). |
| bg-secondary_hover | Hover for gray-50 backgrounds (active nav items, date pickers). |
| bg-secondary_subtle | Lighter, more subtle secondary bg (banners). |
| bg-secondary-solid | Secondary dark bg (featured icons). |
| bg-tertiary | Tertiary bg for contrast against light (toggles). |
| bg-quaternary | Quaternary bg (sliders, progress bars). |
| bg-active | Default active bg (selected dropdown menu items). |
| bg-overlay | Background overlays (modals). |
| bg-brand-primary | Primary brand bg (check icons). |
| bg-brand-primary_alt | Primary brand bg that switches to bg-secondary in dark mode (active tabs). |
| bg-brand-secondary | Secondary brand bg (featured icons). |
| bg-brand-solid | Default solid brand bg (toggles, messages). |
| bg-brand-solid_hover | Solid brand bg, hover (toggles). |
| bg-brand-section | Dark brand bg for website sections (CTA, testimonials); switches to bg-secondary in dark mode. |
| bg-brand-section_subtle | Alt brand section bg (FAQ sections); switches to bg-primary in dark mode. |
| bg-error-primary | Primary error bg (buttons). |
| bg-error-secondary | Secondary error bg (featured icons). |
| bg-error-solid | Solid error bg (buttons, featured icons, metrics). |
| bg-error-solid_hover | Solid error bg, hover (buttons). |
| bg-warning-primary | Primary warning bg. |
| bg-warning-secondary | Secondary warning bg (featured icons). |
| bg-warning-solid | Solid warning bg (featured icons). |
| bg-success-primary | Primary success bg. |
| bg-success-secondary | Secondary success bg (featured icons). |
| bg-success-solid | Solid success bg (featured icons, metrics). |
