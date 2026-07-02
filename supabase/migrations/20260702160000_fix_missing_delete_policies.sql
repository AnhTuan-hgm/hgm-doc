-- Fix: deleting a Meta Pixel page from /dashboard didn't persist — the row
-- reappeared on refresh. client_pages has read/insert/update policies but no
-- DELETE policy, so with RLS enabled supabase.delete() silently removes 0 rows.
--
-- Also close the same gap class flagged by CLAUDE.md (policies must cover BOTH
-- anon and authenticated): overview_tabs and docs_requests only had
-- "anon full access" (TO anon), so any operation by a signed-in team member
-- (authenticated role) silently fails the same way.

CREATE POLICY "public delete" ON "public"."client_pages"
    FOR DELETE TO "authenticated", "anon" USING (true);

CREATE POLICY "authenticated full access" ON "public"."overview_tabs"
    TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "authenticated full access" ON "public"."docs_requests"
    TO "authenticated" USING (true) WITH CHECK (true);
