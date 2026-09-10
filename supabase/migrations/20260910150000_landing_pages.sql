-- Marketing → Landing page: the AM pastes a finished HTML file, the client reviews it
-- live, in-frame, and approves or asks for changes. One row per client dashboard slug;
-- data jsonb holds every published version (each one the full HTML, newest first) and
-- the client's current review state. Kept separate from dashboard_pages for the same
-- reason as welcome_flows: this is its own builder with its own save cadence, not a
-- field on the document.
--
-- Access model is the CURRENT one (see dashboard_suggestions), not welcome_flows'
-- earlier open anon+authenticated policy:
--   • Read: anon + authenticated — the client (anon) needs to see the live version and
--     its own review state.
--   • Insert/update: authenticated @hiddengem.media only — publishing and restoring a
--     version is a team action. A client is `anon` to Supabase (they clear the app's own
--     email/password gate, not Supabase auth) and never writes this table directly:
--     Approve / Request changes go through landing-page-review.mts, which holds the
--     service-role key and checks the caller's email against the dashboard row's
--     allowed_emails on every call — same reasoning as dashboard-suggestions.mts.

CREATE TABLE IF NOT EXISTS "public"."landing_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."landing_pages" OWNER TO "postgres";
ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("slug");
ALTER TABLE "public"."landing_pages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_pages read" ON "public"."landing_pages"
    FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "landing_pages team insert" ON "public"."landing_pages"
    FOR INSERT TO "authenticated"
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

CREATE POLICY "landing_pages team update" ON "public"."landing_pages"
    FOR UPDATE TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media')
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

-- No DELETE policy: versions are meant to accumulate as history. A row can still be
-- dropped with the service role if a client dashboard is ever deleted outright.

GRANT SELECT ON TABLE "public"."landing_pages" TO "anon";
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."landing_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."landing_pages" TO "service_role";
