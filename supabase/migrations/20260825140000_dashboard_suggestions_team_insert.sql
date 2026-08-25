-- Let a signed-in team member file a suggestion themselves.
--
-- Why: an AM previewing a dashboard with ?preview=client needs to exercise the real
-- suggest → review loop, but they hold no client identity, so the Netlify function (which
-- signs every suggestion against that dashboard's allowed_emails) correctly refuses them.
-- Rather than fake a client identity or leave Send inert, the team writes directly — as
-- themselves, with their own JWT, so the suggestion is honestly attributed to
-- someone@hiddengem.media and can't be mistaken for the client's own words.
--
-- This is NOT a hole for anon: the policy and grant are `authenticated` only, and the
-- email domain is read from the verified JWT, never from anything the browser sends.
-- The client path still goes through the function; nothing about it changes.

DROP POLICY IF EXISTS "dashboard_suggestions team insert" ON "public"."dashboard_suggestions";
CREATE POLICY "dashboard_suggestions team insert" ON "public"."dashboard_suggestions"
    FOR INSERT TO "authenticated"
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

GRANT INSERT ON TABLE "public"."dashboard_suggestions" TO "authenticated";
