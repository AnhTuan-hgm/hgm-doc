# hgm-doc

A client-facing **guide / documentation site** (Meta Pixel setup, website popups, owner guides) built on the **Untitled UI React** component system. Deployed as a static Vite SPA to Netlify (`docs-hgm.netlify.app`).

> Detailed reference is split into path-scoped rules that load on demand:
> - **Components & patterns** → [.claude/rules/components.md](.claude/rules/components.md) (loads for `src/components/**`, `src/pages/**`)
> - **Color tokens** → [.claude/rules/colors.md](.claude/rules/colors.md) (loads for `src/**/*.tsx`, `src/**/*.css`)
> - **Icons** → [.claude/rules/icons.md](.claude/rules/icons.md) (loads for `src/**`)

## Stack
- **React 19** + **TypeScript 5.9**
- **Vite 8** — build tool & dev server (not Next.js; SPA, no SSR)
- **react-router 7** — client-side routing (`src/main.tsx`)
- **Tailwind CSS v4.2** — styling via a CSS-variable theme
- **React Aria Components 1.16** — accessibility/behavior foundation
- **Supabase** — persistence for editable page content (never localStorage-only)
- **motion** (Framer Motion) — animation

## How pages work
Most routes are "master template" pages (e.g. `/metapixel`, `/popup`, `/owner-guide`). The team creates a private per-client copy from a template, which saves to Supabase and gets its own slug (e.g. `/{client}-metapixel`, `/{client}-leadcapture`). Routing fans out through `src/pages/client-screen.tsx`. Content is edited in place (lock/unlock) and persisted to Supabase.

## Critical conventions

### React Aria imports — prefix with `Aria*`
All imports from `react-aria-components` MUST be aliased with an `Aria*` prefix (prevents conflicts with our custom components):
```typescript
// ✅
import { Button as AriaButton, TextField as AriaTextField } from "react-aria-components";
// ❌
import { Button, TextField } from "react-aria-components";
```

### File naming — kebab-case
All files use kebab-case (components, ts/js, css, tests, configs): `date-picker.tsx`, `api-client.ts` — never `DatePicker.tsx` or `apiClient.ts`.

### Colors — semantic tokens only
Never use raw Tailwind palette utilities (`text-gray-900`, `bg-blue-700`, `border-red-300`, `hover:bg-red-50`). Use semantic tokens (`text-primary`, `bg-primary`, `border-error`, `hover:bg-error-primary`) so light/dark mode works. Full token list in [.claude/rules/colors.md](.claude/rules/colors.md).

### Disabled states — `opacity-50`
Use `disabled:cursor-not-allowed disabled:opacity-50`. Do NOT use the v7 pattern (`disabled:bg-disabled_subtle`, etc.).

### Components — React Aria foundation
All UI is built on React Aria Components using the compound pattern (`Select.Item`, `Select.ComboBox`). Match existing component structure and add size/color variants. Reference: [.claude/rules/components.md](.claude/rules/components.md).

## Commands
```bash
npm run dev     # Vite dev server (defaults to :5173 — use the /dev skill to avoid port collisions)
npm run build   # tsc -b && vite build (production)
```

## Project structure
```
src/
├── components/
│   ├── base/           # Core UI (Button, Input, Select, …)
│   ├── application/     # Complex patterns (Modal, Table, DatePicker, …)
│   ├── foundations/     # Design tokens & foundational elements (FeaturedIcon)
│   ├── marketing/       # Marketing components
│   └── shared-assets/   # Reusable assets & illustrations
├── hooks/               # Custom React hooks
├── pages/               # Route components (client-screen.tsx fans out client slugs)
├── providers/           # React context (theme-provider, router-provider)
├── styles/              # globals.css, theme.css (brand color vars), typography.css
├── types/               # TS type definitions
└── utils/               # cx(), is-react-component(), …
```

## State & key files
- Theme context: `src/providers/theme-provider.tsx`; router: `src/providers/router-provider.tsx`.
- Use React Aria's built-in state; local state for component-specific data; context for shared state.
- Utilities: `src/utils/cx.ts`, `src/utils/is-react-component.ts`; hooks in `src/hooks/`.
- Styles: `src/styles/globals.css`, `theme.css` (edit `--color-brand-*` to rebrand), `typography.css`.

## Persistence (Supabase)
Editable page content persists to Supabase — never localStorage-only. Client = `src/lib/supabase.ts` (uses the anon/publishable key; never the `service_role`/secret key in client code). When adding any `insert`/`update`/`delete`, ensure the table has RLS policies covering BOTH the `anon` and `authenticated` roles (signed-in dashboard users are `authenticated`). The Supabase CLI is linked; schema lives in `supabase/migrations/`.

## Deploy
Netlify is connected to the GitHub repo (`AnhTuan-hgm/hgm-doc`) — pushing `main` auto-builds and deploys to `docs-hgm.netlify.app`. See the `/ship` skill for the full build → commit → push → verify flow.
