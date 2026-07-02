-- Per-client dashboard pages (client hub).
-- One editable copy per client, keyed by slug (e.g. "acme-dashboard").
-- Heterogeneous section content (brand kit, IG highlights, GHL checklist,
-- revenue entries, quick links) lives in a single jsonb "data" column,
-- like sop_pages. client_name/client_website stay scalar for team listings.

CREATE TABLE IF NOT EXISTS "public"."dashboard_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."dashboard_pages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."dashboard_pages"
    ADD CONSTRAINT "dashboard_pages_pkey" PRIMARY KEY ("slug");

ALTER TABLE "public"."dashboard_pages" ENABLE ROW LEVEL SECURITY;

-- RLS covers BOTH anon (public client-facing pages) and authenticated
-- (signed-in dashboard team), for every operation. Matches chatwidget_pages.
CREATE POLICY "dashboard_pages read" ON "public"."dashboard_pages"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "dashboard_pages insert" ON "public"."dashboard_pages"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "dashboard_pages update" ON "public"."dashboard_pages"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "dashboard_pages delete" ON "public"."dashboard_pages"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."dashboard_pages" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_pages" TO "service_role";
