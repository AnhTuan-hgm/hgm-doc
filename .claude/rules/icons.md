---
paths:
  - "src/**"
---

# Icon usage

## Libraries
- `@untitledui/icons` — 1,100+ line-style icons (free)
- `@untitledui/file-icons` — file-type icons
- `@untitledui-pro/icons` — 4,600+ icons in 4 styles (PRO access required)

## Import & usage
```typescript
// Recommended: named imports (tree-shakeable)
import { Home01, Settings01, ChevronDown } from "@untitledui/icons";

// As a prop — pass the component reference
<Button iconLeading={ChevronDown}>Options</Button>

// Standalone — use semantic tokens, never text-gray-*
<Home01 className="size-5 text-fg-quaternary" />

// As a JSX element — MUST include data-icon
<Button iconLeading={<ChevronDown data-icon className="size-4" />}>Options</Button>
```

## Styling
```typescript
<Home01 className="size-5" />                 // size: size-4 (16), size-5 (20), size-6 (24)
<Home01 className="size-5 text-brand-600" />  // color: semantic tokens
<Home01 className="size-5" strokeWidth={2} /> // stroke width (line icons only)
<Home01 className="size-5" aria-hidden="true" /> // decorative icons need aria-hidden
```

## PRO icon styles
There is NO bare root export — every style is a subpath, including `line`:
```typescript
import { Home01 } from "@untitledui-pro/icons/line";      // line (default)
import { Home01 } from "@untitledui-pro/icons/duocolor";
import { Home01 } from "@untitledui-pro/icons/duotone";
import { Home01 } from "@untitledui-pro/icons/solid";
```

PRO icons install from a private registry — setup is already done on this machine:
scope→registry mapping is in the project `.npmrc`; the auth token is in `~/.npmrc`
(kept out of git). Reinstall with `npm install @untitledui-pro/icons`.
