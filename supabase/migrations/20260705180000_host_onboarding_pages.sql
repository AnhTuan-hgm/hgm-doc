-- Per-client Host Onboarding Form — the in-app version of the team's "Brand Vision
-- Form" Google Form. One editable copy per new host, keyed by slug (e.g.
-- "oceanview-cottage-hostonboarding"). Answers live in `data` jsonb since the form
-- is many checkbox-group + free-text questions, not a handful of flat columns.

CREATE TABLE IF NOT EXISTS "public"."host_onboarding_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."host_onboarding_pages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."host_onboarding_pages"
    ADD CONSTRAINT "host_onboarding_pages_pkey" PRIMARY KEY ("slug");

ALTER TABLE "public"."host_onboarding_pages" ENABLE ROW LEVEL SECURITY;

-- RLS covers BOTH anon (the new host filling in their own form, no account needed)
-- and authenticated (signed-in dashboard team), for every operation. Matches
-- chatwidget_pages / leadcapture_pages.
CREATE POLICY "host_onboarding_pages read" ON "public"."host_onboarding_pages"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "host_onboarding_pages insert" ON "public"."host_onboarding_pages"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "host_onboarding_pages update" ON "public"."host_onboarding_pages"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "host_onboarding_pages delete" ON "public"."host_onboarding_pages"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."host_onboarding_pages" TO "anon";
GRANT ALL ON TABLE "public"."host_onboarding_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."host_onboarding_pages" TO "service_role";
