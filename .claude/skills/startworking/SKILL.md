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
   - Skim `git log --oneline -10` for where yesterday left off.

6. **Suggest the day.** Present a short prioritized list (3–5 items): urgent bugs first, then in-progress roadmap work, then unfinished to-dos; note unanswered /roadmap Questions that block work. End with the dev URL (http://localhost:5180/roadmap) and ask which item to start on.

## Notes
- Don't kill dev servers from other projects — only manage hgm-doc's.
- Vite reads `.env.local` at startup only; restart the server after env changes.
