-- Client List records for the internal dashboard "Clients" page.
-- Each row is one client, grouped in the UI by tier (tier-0/1/2/mastermind)
-- and by account manager (am). Managed in-page (New Client + edit mode),
-- same access model as the other dashboard tables.

CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "text" NOT NULL,
    "name" "text" DEFAULT ''::"text",
    "tier" "text" DEFAULT 'tier-0'::"text",
    "am" "text" DEFAULT ''::"text",
    "location" "text" DEFAULT ''::"text",
    "cover_url" "text" DEFAULT ''::"text",
    "link" "text" DEFAULT ''::"text",
    "starred" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."clients" OWNER TO "postgres";

ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- RLS covers BOTH anon and authenticated for every operation, matching
-- chatwidget_pages / dashboard_pages (CLAUDE.md requires both roles).
CREATE POLICY "clients read" ON "public"."clients"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "clients insert" ON "public"."clients"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "clients update" ON "public"."clients"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "clients delete" ON "public"."clients"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";
