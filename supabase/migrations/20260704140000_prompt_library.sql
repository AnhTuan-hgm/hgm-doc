-- Personal Prompt & Pattern Library (/prompt-library) — a PRIVATE vault for
-- anhtuan@hiddengem.media only. Unlike the rest of the app (anon-open), this
-- table is locked to the owner's authenticated Supabase session: the public
-- anon key cannot read or write it, and no other team member can either.

CREATE TABLE IF NOT EXISTS "public"."prompt_library" (
    "id" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text",
    "type" "text" DEFAULT 'prompt'::"text",   -- 'prompt' | 'pattern'
    "category" "text" DEFAULT ''::"text",
    "body" "text" DEFAULT ''::"text",
    "when_to_use" "text" DEFAULT ''::"text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."prompt_library" OWNER TO "postgres";
ALTER TABLE ONLY "public"."prompt_library"
    ADD CONSTRAINT "prompt_library_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."prompt_library" ENABLE ROW LEVEL SECURITY;

-- Owner-only: every operation requires an authenticated session whose email is
-- the owner. No anon policy and no anon grant → the public key is fully blocked.
CREATE POLICY "prompt_library owner" ON "public"."prompt_library"
    FOR ALL TO "authenticated"
    USING (("auth"."jwt"() ->> 'email') = 'anhtuan@hiddengem.media')
    WITH CHECK (("auth"."jwt"() ->> 'email') = 'anhtuan@hiddengem.media');

GRANT ALL ON TABLE "public"."prompt_library" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_library" TO "service_role";
