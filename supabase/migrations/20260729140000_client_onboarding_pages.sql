-- Per-client Host Onboarding Form — the FIRST form a new client fills in
-- (before the Brand Vision Form). In-app version of the team's "Host Onboarding
-- Form" Google Form (6 sections, all free-text incl. account logins). One copy
-- per client, keyed by slug (e.g. "oceanview-cottage-onboarding"); answers live
-- in `data` jsonb ({ answers: {field: text}, submittedAt }).

CREATE TABLE IF NOT EXISTS "public"."client_onboarding_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."client_onboarding_pages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."client_onboarding_pages"
    ADD CONSTRAINT "client_onboarding_pages_pkey" PRIMARY KEY ("slug");

ALTER TABLE "public"."client_onboarding_pages" ENABLE ROW LEVEL SECURITY;

-- RLS covers BOTH anon (the new client filling in their own form, no account
-- needed) and authenticated (signed-in team) — matches host_onboarding_pages.
CREATE POLICY "client_onboarding_pages read" ON "public"."client_onboarding_pages"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "client_onboarding_pages insert" ON "public"."client_onboarding_pages"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "client_onboarding_pages update" ON "public"."client_onboarding_pages"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "client_onboarding_pages delete" ON "public"."client_onboarding_pages"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."client_onboarding_pages" TO "anon";
GRANT ALL ON TABLE "public"."client_onboarding_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."client_onboarding_pages" TO "service_role";
