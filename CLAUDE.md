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
- **Supabase** — the only persistence for editable page content (never localStorage-only)
- **motion** (Framer Motion) — animation

## How pages work
Routes are registered as a flat list in `src/main.tsx` (not nested). There are two kinds:

**Named routes** — templates and internal team pages: `/popup`, `/owner-guide(/:slug)`, `/chat-widget` (templates); `/dashboard`, `/roadmap` (the "Project Management" page), `/requests`, `/settings`, `/designsystem`, `/webteam/ai-website-setup` (team-internal). A `PAGES_WITHOUT_FLOATING_CHROME` array in `main.tsx` suppresses the global floating theme toggle on internal pages (their icon-rail chrome has its own).

**Client slugs** — the catch-all `/:clientSlug` route goes to `src/pages/client-screen.tsx`, which dispatches on the slug suffix to a page component + Supabase table:
- `/{client}-leadcapture` → `PopupPage`, table `leadcapture_pages`
- `/{client}-chatwidget` → `ChatWidgetScreen`, table `chatwidget_pages`
- anything else (e.g. `/{client}-metapixel`) → `PixelPage`, table `client_pages`; the bare slug `metapixel` is the template and renders without a DB row

The team creates a private per-client copy from a template, which saves a row to the matching table under its own slug. Content is edited in place (lock/unlock) and persisted to Supabase. Global chrome mounted above all routes in `main.tsx`: the floating theme toggle and `HelpMenu`; global edit-mode keyboard shortcuts live in `src/hooks/use-edit-shortcuts.ts`.

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

### Image uploads — always compress to WebP
Every image-upload handler MUST go through `compressImageFile()` from `src/utils/compress-image.ts` (resizes to ≤1600px + WebP ~0.82 quality, JPEG fallback, SVG/GIF pass through) — never raw `FileReader.readAsDataURL` on the original file. Images are stored as base64 in Supabase, so uncompressed uploads bloat the DB and slow every page load.

### Components — React Aria foundation
All UI is built on React Aria Components using the compound pattern (`Select.Item`, `Select.ComboBox`). Match existing component structure and add size/color variants. Reference: [.claude/rules/components.md](.claude/rules/components.md).

## Commands
```bash
npm run dev     # Vite dev server (defaults to :5173 — use the /dev skill to avoid port collisions)
npm run build   # tsc -b && vite build (production build + type-check)
npm run preview # Preview production build locally
npx prettier --write .  # Format code (no npm script; Prettier configured in .prettierrc)
```
**Note:** No ESLint, test, or dedicated typecheck scripts exist. Type-checking happens inside `npm run build` via `tsc -b`. No test runner is configured.

**Project skills:** `/dev` (start dev server on a clean port), `/ship` (build → commit → push → verify deploy), `/startworking` (start-of-day: sync branch, dev server, plan), `/wrapup` (end-of-day: log work on `/roadmap`, merge to `main`, verify deploy).

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
├── lib/                 # supabase.ts, db-sync.ts, db-logger.ts, requests.ts
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
Editable page content persists to **Supabase** — the single source of truth. There is no secondary database.

**Client:** `src/lib/supabase.ts` — uses anon/publishable key (never `service_role`/secret in client code). When adding any `insert`/`update`/`delete`, ensure RLS policies cover BOTH `anon` and `authenticated` roles.

**`sop_pages` helpers:** for owner guides, templates and the project-log pages, use `src/lib/db-sync.ts` rather than calling `supabase.from("sop_pages")` directly, so the table name and error handling stay in one place:
- `readSopPage(slug)` — returns the row; **throws** when it's missing (callers rely on that to fall back to seed content or a master template)
- `writeSopPage(slug, data)` — upserts the row; **throws** on failure (callers render an unsaved/error state, so never swallow it)
- `src/lib/db-logger.ts` provides colored dev-console logging for these ops

> Firebase Firestore was a dual-write fallback here until 2026-08-06. It was removed because Firestore's rules denied the anon client both reads and writes — every fallback read failed and every backup write was silently swallowed, so it could not have survived an outage. Don't reintroduce a second database without rules that actually permit the client.

**Local offline dev:** Run `supabase start` (Docker) to spin up a local Supabase stack on ports 54321 (API) / 54322 (DB). Update `.env.local` to point `VITE_SUPABASE_URL` to `http://127.0.0.1:54321`.

The Supabase CLI is linked; schema lives in `supabase/migrations/`. Production `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set in `netlify.toml` build env; local dev reads `.env.local`.

## Deploy
Netlify is connected to the GitHub repo (`AnhTuan-hgm/hgm-doc`) — pushing `main` auto-builds and deploys to `docs-hgm.netlify.app`. See the `/ship` skill for the full build → commit → push → verify flow.
