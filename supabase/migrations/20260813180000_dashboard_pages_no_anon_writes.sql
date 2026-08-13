-- Revoke anonymous WRITES on dashboard_pages.
--
-- The table shipped with `FOR ALL TO authenticated, anon USING (true)`. The anon key is
-- embedded in the public JS bundle, so anyone who opened devtools could update or delete
-- all 49 client dashboards. Nothing legitimate needs that: the only two writers are
-- persistAndLock() and handleCreatePage() in client-dashboard-page.tsx, both behind a
-- signed-in @hiddengem.media session, which authenticates as `authenticated`.
--
-- SELECT deliberately stays open to anon for now. Read-gating requires every row to carry
-- an allowed_emails list first; cutting reads before those are populated would dark every
-- live client dashboard. That is the follow-up migration, not this one.
--
-- Behaviour change worth knowing: the "+ create a client dashboard" flow on the template
-- page has a fallback that accepts a hardcoded password instead of a login. That path
-- writes as anon, so after this migration creating a dashboard requires actually being
-- signed in as @hiddengem.media. That is the intended outcome — a password compiled into
-- the public bundle was never access control.

DROP POLICY IF EXISTS "dashboard_pages insert" ON "public"."dashboard_pages";
DROP POLICY IF EXISTS "dashboard_pages update" ON "public"."dashboard_pages";
DROP POLICY IF EXISTS "dashboard_pages delete" ON "public"."dashboard_pages";

CREATE POLICY "dashboard_pages insert" ON "public"."dashboard_pages"
    FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "dashboard_pages update" ON "public"."dashboard_pages"
    FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "dashboard_pages delete" ON "public"."dashboard_pages"
    FOR DELETE TO "authenticated" USING (true);

-- The table-level grant must match the policies. Without this, anon keeps the INSERT /
-- UPDATE / DELETE privilege and only RLS stands between a stranger and the data — one
-- permissive policy away from the hole reopening.
REVOKE INSERT, UPDATE, DELETE ON TABLE "public"."dashboard_pages" FROM "anon";
