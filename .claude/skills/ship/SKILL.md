---
name: ship
description: Build, commit, push, and confirm the Netlify production deploy for hgm-doc. Use when the user wants to ship / deploy current work.
---

# Ship

End-to-end release for hgm-doc. The Netlify site is connected to the GitHub repo (`AnhTuan-hgm/hgm-doc`), so pushing the production branch auto-builds and deploys to `docs-hgm.netlify.app`.

## Steps

1. **Build (gate).** Run `npm run build`. If it fails, stop and report — do not commit.
2. **Show what's changing.** `git status -s` and `git diff --stat`. Confirm the working tree only contains intended changes. If another session has unrelated uncommitted work, `git add` only the intended paths (never `git add -A` blindly).
3. **Commit.** Branch-aware:
   - If on `main`, create/checkout a feature branch first (don't commit straight to the default branch unless the user explicitly asked).
   - Write a clear message; end with the required trailer:
     `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
4. **Push.** `git push origin <current-branch>`. If the goal is production, that means getting the change onto `main` (merge or PR per the user's preference) — confirm before merging to `main`.
5. **Confirm the deploy.** Once `main` is updated, query the latest Netlify deploy and report its state + URL. Site id: `228df6be-8804-40d5-bc3f-60b40db91306`.
   ```bash
   netlify api listSiteDeploys --data '{"site_id":"228df6be-8804-40d5-bc3f-60b40db91306","per_page":3}' \
     | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const x of JSON.parse(s).slice(0,3))console.log(x.state, x.branch, (x.commit_ref||"").slice(0,7), x.created_at)})'
   ```
   Report when the newest deploy for the just-pushed commit reaches `ready`. Live URL: https://docs-hgm.netlify.app

## Notes
- The build command is `tsc -b && vite build` — it type-checks, so a green build means types pass.
- Never commit secrets; `.env.local` and `supabase/.temp` are gitignored.
- Don't deploy by running `netlify deploy` manually unless asked — git push is the deploy trigger.
