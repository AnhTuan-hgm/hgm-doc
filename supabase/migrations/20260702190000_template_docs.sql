-- Documents created from the /template-1 master (the "Copy this template" flow).
-- Each row is one document with its own free-form slug (no forced prefix), so it
-- lives at /{slug}. Kept in its own table (not sop_pages) so template docs never
-- collide with roadmap / ai-website-setup and can use any slug the team wants.

CREATE TABLE IF NOT EXISTS "public"."template_docs" (
    "slug" "text" NOT NULL,
    "name" "text" DEFAULT ''::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."template_docs" OWNER TO "postgres";

ALTER TABLE ONLY "public"."template_docs"
    ADD CONSTRAINT "template_docs_pkey" PRIMARY KEY ("slug");

ALTER TABLE "public"."template_docs" ENABLE ROW LEVEL SECURITY;

-- Reads are public (anon + authenticated) so a shared document link opens for anyone.
-- Writes are restricted to authenticated Supabase sessions (team Google sign-in) so the
-- public anon key can't create/edit/delete documents. NOTE: this diverges from the other
-- tables in this app, which allow anon writes; template docs were deliberately locked down.
CREATE POLICY "template_docs read" ON "public"."template_docs"
    FOR SELECT TO "authenticated", "anon" USING (true);
CREATE POLICY "template_docs insert" ON "public"."template_docs"
    FOR INSERT TO "authenticated" WITH CHECK (true);
CREATE POLICY "template_docs update" ON "public"."template_docs"
    FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
CREATE POLICY "template_docs delete" ON "public"."template_docs"
    FOR DELETE TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."template_docs" TO "anon";
GRANT ALL ON TABLE "public"."template_docs" TO "authenticated";
GRANT ALL ON TABLE "public"."template_docs" TO "service_role";
