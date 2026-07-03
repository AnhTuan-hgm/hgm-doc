-- Welcome Email Flow builder (AM tool inside each client dashboard).
-- One row per client dashboard slug; data jsonb holds the 3 emails
-- (subject + ordered content blocks) and wait timing. Kept separate from
-- dashboard_pages so client-facing comments can attach to flows later.

CREATE TABLE IF NOT EXISTS "public"."welcome_flows" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."welcome_flows" OWNER TO "postgres";
ALTER TABLE ONLY "public"."welcome_flows"
    ADD CONSTRAINT "welcome_flows_pkey" PRIMARY KEY ("slug");
ALTER TABLE "public"."welcome_flows" ENABLE ROW LEVEL SECURITY;

-- Same access model as the other dashboard tables (anon + authenticated).
CREATE POLICY "welcome_flows read" ON "public"."welcome_flows"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "welcome_flows insert" ON "public"."welcome_flows"
    FOR INSERT TO "authenticated", "anon" WITH CHECK (true);
CREATE POLICY "welcome_flows update" ON "public"."welcome_flows"
    FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);
CREATE POLICY "welcome_flows delete" ON "public"."welcome_flows"
    FOR DELETE TO "authenticated", "anon" USING (true);

GRANT ALL ON TABLE "public"."welcome_flows" TO "anon";
GRANT ALL ON TABLE "public"."welcome_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."welcome_flows" TO "service_role";

-- Client suggestions on a shared flow ("Suggest for changes" panel).
-- Read is public (the thread shows on the share view); writing requires a
-- signed-in session ("Sign in to comment" — decided 2026-07-03).
CREATE TABLE IF NOT EXISTS "public"."flow_comments" (
    "id" "text" NOT NULL,
    "flow_slug" "text" NOT NULL,
    "author_name" "text" DEFAULT ''::"text",
    "author_email" "text" DEFAULT ''::"text",
    "text" "text" DEFAULT ''::"text",
    "loom_url" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."flow_comments" OWNER TO "postgres";
ALTER TABLE ONLY "public"."flow_comments"
    ADD CONSTRAINT "flow_comments_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."flow_comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flow_comments read" ON "public"."flow_comments"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "flow_comments insert" ON "public"."flow_comments"
    FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "flow_comments delete" ON "public"."flow_comments"
    FOR DELETE TO "authenticated" USING (true);

GRANT SELECT ON TABLE "public"."flow_comments" TO "anon";
GRANT ALL ON TABLE "public"."flow_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."flow_comments" TO "service_role";
