-- Per-client Chat Widget installation guides.
-- Mirrors leadcapture_pages: one editable copy per client, keyed by slug
-- (e.g. "acme-chatwidget"). The only client-specific value is the widget_id.

CREATE TABLE IF NOT EXISTS "public"."chatwidget_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "widget_id" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."chatwidget_pages" OWNER TO "postgres";

ALTER TABLE ONLY "public"."chatwidget_pages"
    ADD CONSTRAINT "chatwidget_pages_pkey" PRIMARY KEY ("slug");

ALTER TABLE "public"."chatwidget_pages" ENABLE ROW LEVEL SECURITY;

-- RLS covers BOTH anon (public client-facing pages) and authenticated
-- (signed-in dashboard team), for every operation. Matches owner_guides.
CREATE POLICY "chatwidget_pages read" ON "public"."chatwidget_pages"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "chatwidget_pages insert" ON "public"."chatwidget_pages"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "chatwidget_pages update" ON "public"."chatwidget_pages"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "chatwidget_pages delete" ON "public"."chatwidget_pages"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."chatwidget_pages" TO "anon";
GRANT ALL ON TABLE "public"."chatwidget_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."chatwidget_pages" TO "service_role";
