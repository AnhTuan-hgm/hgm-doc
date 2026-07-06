---
name: wrapup
description: End-of-day wrap-up for hgm-doc — log today's work on the Project Management page, merge to main, push, and verify the Netlify deploy. Use when the user is done working (/wrapup).
---

# End day

Wrap up the working day: record what shipped on the Project Management page, get the work onto `main`, and confirm the production deploy.

## Steps

1. **Build (gate).** Run `npm run build`. If it fails, stop and report — never ship a red build.

2. **Review the day's work.** `git status -s` and `git log --oneline main..HEAD` (plus today's commits already on the current branch: `git log --oneline --since="6am"`). Summarize what actually changed today in 1–3 plain-English bullets — this becomes the Timeline entry. Commit any intended uncommitted work (only intended paths, never `git add -A` blindly). Warn about leftover uncommitted files instead of silently skipping them.

3. **Update the Project Management page** (`/roadmap` content, Supabase row `sop_pages` slug `roadmap`):
   - Read Supabase creds from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Fetch: `curl -s "$URL/rest/v1/sop_pages?slug=eq.roadmap&select=data" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"`
   - Append a new entry to `data.log`: `{ id: <uuidgen lowercased>, date: <today YYYY-MM-DD>, title: <short headline>, description: <the summary>, link: <live URL if relevant> }`. If an entry for today already exists, extend its description instead of duplicating.
   - Ask the user which To-dos (`data.todos`) they finished today and set those `done: true`.
   - **Refresh "Questions to move forward" (`data.questions`).** If EVERY existing question is already answered (all have a non-empty `answer`), append **5 new** unanswered questions — `{ id: <uuid>, question: <text>, answer: "" }` — that YOU decide. Do NOT ask the user to pick them; propose the 5 yourself based on the current project state (recent Timeline entries, open roadmap items, decisions just made in the answered questions, active project pages). They must be concrete *decisions needed before the next round of work* — not status updates. Append only; never edit or delete the answered ones (the page now collapses answered questions into "Resolved / History", so the list stays clean as it grows). If some questions are still unanswered, leave them be and add nothing.
   - PATCH the row back: `curl -X PATCH "$URL/rest/v1/sop_pages?slug=eq.roadmap" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"data": <updated json>, "updated_at": "<now ISO>"}'`
   - (Supabase only is fine here — Firebase is a fallback copy and re-syncs on the next in-app save.)

4. **Update active project pages** — every page under Docs → Project Logs that isn't `/roadmap` (already handled in step 3). Currently: `/welcome-email-flow-overview`, `/client-dashboard-overview`, `/chat-widget-overview` (Supabase rows `sop_pages`, slugs `welcome-email-flow-overview` / `client-dashboard-overview` / `chat-widget-overview`). If a new project-log card gets added to that tab later, fold its page into this same routine. For EACH page:
   - Fetch the row and review what changed since the last session (new answers in Questions, new template content, checked To-dos).
   - **Version control — snapshot BEFORE writing.** Copy the current `data` to a new row `<slug>@<YYYY-MM-DDTHH-MM>` (POST to `sop_pages` with `on_conflict=slug`). Never edit or delete snapshot rows; never overwrite answered Questions or Timeline entries — append, don't rewrite, so discussion context is never lost.
   - If the feature progressed today, append an entry to its `data.log` (same shape as the roadmap log) and tick any build To-dos that landed.
   - **Refresh "Open Questions" (`data.questions`) — same rule as roadmap's step 3.** If EVERY existing question on that page is already answered, append **5 new** unanswered questions (`{ id: <uuid>, question: <text>, answer: "" }`) that YOU decide — concrete decisions needed before that feature's next round of work, grounded in that page's own Overview/How-it-works/Timeline content (not generic or copied from another page). Don't ask the user to pick them. If any are still open, add nothing. Each page already collapses answered questions into "Resolved / History", so the list stays clean as it grows.
   - PATCH the row back. If AnhTuan left new answers or content, acknowledge them in the sign-off so decisions don't slip by.

5. **Merge to main & push.** If on a feature branch (e.g. `dev-AnhTuan`): `git checkout main && git pull && git merge <branch> && git push origin main`, then switch back to the feature branch. If already on `main`, just push. Pushing `main` triggers the GitHub Actions deploy (`.github/workflows/deploy.yml`) — do NOT run `netlify deploy` manually.

6. **Verify the deploy.** Poll the Actions run for the pushed SHA until `conclusion: success`, then confirm Netlify state is `ready` and https://docs-hgm.netlify.app returns 200:
   ```bash
   netlify api listSiteDeploys --data '{"site_id":"228df6be-8804-40d5-bc3f-60b40db91306","per_page":1}' | jq '.[0].state'
   ```
   If the workflow fails, fetch the failing step's log and report it — don't retry blindly.

7. **Sign off.** Report: what was logged to the Timeline (roadmap AND every active project page), the deploy status + live URL, the new questions you added per page (if that page's previous set was fully answered), and anything left hanging for tomorrow (uncommitted files, failed checks, which pages still have unanswered questions). Play the completion sound.

## Notes
- Timeline seed data lives in `src/pages/roadmap-screen.tsx` (`DEFAULT_DATA`) but real content is the Supabase row — always edit the row, not the seed.
- Never commit secrets; `.env.local` is gitignored.
- Snapshot rows (`<slug>@<timestamp>`) are the version history for project pages — list them with `slug=like.<slug>@*`. To restore, copy a snapshot's `data` back onto the live slug (after snapshotting the current state first).
- New questions should read like a decision, not a status check — grounded in what that specific page is building (e.g. chat-widget-overview questions are about the chat feature, not the email flow).
