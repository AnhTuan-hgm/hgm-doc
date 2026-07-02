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
   - PATCH the row back: `curl -X PATCH "$URL/rest/v1/sop_pages?slug=eq.roadmap" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"data": <updated json>, "updated_at": "<now ISO>"}'`
   - (Supabase only is fine here — Firebase is a fallback copy and re-syncs on the next in-app save.)

4. **Merge to main & push.** If on a feature branch (e.g. `dev-AnhTuan`): `git checkout main && git pull && git merge <branch> && git push origin main`, then switch back to the feature branch. If already on `main`, just push. Pushing `main` triggers the GitHub Actions deploy (`.github/workflows/deploy.yml`) — do NOT run `netlify deploy` manually.

5. **Verify the deploy.** Poll the Actions run for the pushed SHA until `conclusion: success`, then confirm Netlify state is `ready` and https://docs-hgm.netlify.app returns 200:
   ```bash
   netlify api listSiteDeploys --data '{"site_id":"228df6be-8804-40d5-bc3f-60b40db91306","per_page":1}' | jq '.[0].state'
   ```
   If the workflow fails, fetch the failing step's log and report it — don't retry blindly.

6. **Sign off.** Report: what was logged to the Timeline, the deploy status + live URL, and anything left hanging for tomorrow (uncommitted files, failed checks, unanswered questions on /roadmap). Play the completion sound.

## Notes
- Timeline seed data lives in `src/pages/roadmap-screen.tsx` (`DEFAULT_DATA`) but real content is the Supabase row — always edit the row, not the seed.
- Never commit secrets; `.env.local` is gitignored.
