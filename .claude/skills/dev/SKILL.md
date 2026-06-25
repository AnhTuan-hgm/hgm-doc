---
name: dev
description: Start the Vite dev server for hgm-doc reliably on a clean port and report the exact URL. Use when the user wants to run / preview the app locally.
---

# Dev

Start the local Vite dev server **without the port-collision trap**. The default port `5173` is often already taken by an unrelated project on this machine, and two Vite servers can silently bind the same port number on different IP stacks (IPv4 vs IPv6) — so `localhost:5173` ends up serving the wrong app. Pin a clean port instead.

## Steps

1. **Check the pinned port.** Confirm nothing else is on the target port (default `5180`):
   ```bash
   lsof -nP -iTCP:5180 -sTCP:LISTEN || echo "5180 free"
   ```
   If busy, pick the next free port (5181, 5182, …).
2. **Start the server in the background**, pinned with `--strictPort` so it fails loudly instead of drifting to another port:
   ```bash
   npm run dev -- --port 5180 --strictPort
   ```
   Run it as a background process and capture output.
3. **Confirm it's serving our app**, then report the URL the user should open:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5180/
   ```
   Tell the user: **http://localhost:5180/** (and note key routes like `/dashboard`, `/owner-guide`, `/settings`).

## Notes
- Requires env vars in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Vite reads env only at startup — restart after changing `.env.local`.
- If a new route was just added to `src/main.tsx`, a hard refresh (Cmd+Shift+R) may be needed.
- Don't kill dev servers from other projects/folders — only manage the hgm-doc one.
