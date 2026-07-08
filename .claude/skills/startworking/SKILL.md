---
name: startworking
description: Start-of-day setup for hgm-doc — sync the dev branch, start the dev server, open the Project Management page, and propose today's plan. Use when the user starts working (/startworking).
---

# Start day

Get the workspace ready and propose a plan for the day.

## Steps

1. **Sync branches.** `git fetch origin`, then check out `dev-AnhTuan` and bring it up to date with main: `git checkout dev-AnhTuan && git merge origin/main`. If the branch doesn't exist locally, create it from main. Report merge conflicts instead of resolving silently. Warn if the working tree has uncommitted changes from a previous session.

2. **Check last night's deploy didn't break.** Latest GitHub Actions run on `main` should be `success` and Netlify's newest deploy `ready`:
   ```bash
   netlify api listSiteDeploys --data '{"site_id":"228df6be-8804-40d5-bc3f-60b40db91306","per_page":1}' | jq '.[0].state'
   ```
   If something failed overnight, flag it as today's first priority.

3. **Start the dev server** using the /dev skill flow: check port 5180 is free (`lsof -nP -iTCP:5180 -sTCP:LISTEN`), then `npm run dev -- --port 5180 --strictPort` in the background. If a server for THIS project is already on 5180, reuse it.

4. **Open the Project Management page:** `open http://localhost:5180/roadmap` (macOS opens the default browser).

5. **Build today's plan.** Pull the live content and surface what needs attention:
   - Fetch the roadmap row (creds from `.env.local`):
     `curl -s "$URL/rest/v1/sop_pages?slug=eq.roadmap&select=data" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"`
     → unfinished To-dos, roadmap items in "In progress" / "Next", unanswered Questions.
   - Fetch open requests & bug reports:
     `curl -s "$URL/rest/v1/docs_requests?status=eq.open&order=created_at.desc&select=title,priority,requester,created_at" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"`
     → highlight anything titled `[Bug]` or priority high/urgent first.
   - **Review every active project-log page** — currently `/welcome-email-flow-overview`, `/client-dashboard-overview`, `/chat-widget-overview` (Supabase rows `sop_pages`, slugs `welcome-email-flow-overview` / `client-dashboard-overview` / `chat-widget-overview`). For EACH: fetch `data` and diff against its newest snapshot row (`slug=like.<slug>@*`, latest by slug). Surface anything AnhTuan changed since last session — newly answered Questions, pasted template content, edited sections — plus unchecked build To-dos. These are decisions to acknowledge and act on, never to overwrite.
   - Skim `git log --oneline -10` for where yesterday left off.

6. **Keep the project moving — refresh any fully-answered Questions list.** For EACH of the 4 pages above (`/roadmap` and the 3 project-log pages): check `data.questions`. If EVERY question there already has a non-empty `answer`, append **5 new** unanswered questions — `{ id: <uuid>, question: <text>, answer: "" }` — that YOU decide yourself (don't ask AnhTuan to pick them). Ground each in that specific page's own recent Timeline entries, open to-dos, and the decisions just answered — concrete choices needed before the *next* round of work on that page, not status checks, and not generic/copied from another page's questions. PATCH the row back with the updated `data.questions` (Supabase only is fine here — Firebase re-syncs on the next in-app save). If a page still has ANY unanswered question, leave it alone and add nothing there — this only fires once a page's queue is fully drained, so there's always a fresh batch of decisions waiting and the project never stalls waiting on you to think of what's next.

7. **Suggest the day.** Present a short prioritized list (3–5 items): urgent bugs first, then in-progress roadmap work (including any project-log page when it has new answers or unblocked to-dos), then unfinished to-dos; note unanswered Questions (on any of the 4 pages) that block work, and call out by name any page where you just added a fresh batch of 5 in step 6. End with the dev URL (http://localhost:5180/roadmap) and ask which item to start on.

## Notes
- Don't kill dev servers from other projects — only manage hgm-doc's.
- Vite reads `.env.local` at startup only; restart the server after env changes.
- If a new project-log card gets added to the Docs → Project Logs tab later, fold its page into steps 5 and 6 the same way (matches `/wrapup`'s equivalent list — keep the two skills' page lists in sync).
