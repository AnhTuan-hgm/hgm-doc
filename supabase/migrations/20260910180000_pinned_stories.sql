-- Marketing → Pinned Stories: the AM imports a Canva design (or uploads its exported
-- pages), arranges the pages into Instagram highlights, and publishes the set for the
-- client to play back in a phone mockup and comment on, slide by slide. One row per
-- client dashboard slug; data jsonb holds the team's working draft, every published
-- version (newest first, each carrying its own client review), nothing else.
--
-- Same access model as landing_pages (see 20260910150000_landing_pages):
--   • Read: anon + authenticated — the client (anon) plays the live version and sees its
--     own comments.
--   • Insert/update: authenticated @hiddengem.media only — importing, arranging and
--     publishing are team actions. A client is `anon` to Supabase (they clear the app's
--     own email/password gate, not Supabase auth) and never writes this table directly:
--     Approve / comment go through pinned-stories-review.mts, which holds the service-role
--     key and checks the caller's email against the dashboard row's allowed_emails.

CREATE TABLE IF NOT EXISTS "public"."pinned_stories" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."pinned_stories" OWNER TO "postgres";
ALTER TABLE ONLY "public"."pinned_stories"
    ADD CONSTRAINT "pinned_stories_pkey" PRIMARY KEY ("slug");
ALTER TABLE "public"."pinned_stories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pinned_stories read" ON "public"."pinned_stories"
    FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "pinned_stories team insert" ON "public"."pinned_stories"
    FOR INSERT TO "authenticated"
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

CREATE POLICY "pinned_stories team update" ON "public"."pinned_stories"
    FOR UPDATE TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media')
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

-- No DELETE policy: versions accumulate as history, like landing_pages.

GRANT SELECT ON TABLE "public"."pinned_stories" TO "anon";
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."pinned_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."pinned_stories" TO "service_role";

-- ── Storage: the exported story pages ─────────────────────────────────────────
--
-- A highlight set is 15–25 full-screen 9:16 pages. As base64 in the jsonb row that would
-- be 2–3 MB per client read on every dashboard load, so the pages go to Storage (like
-- `videos` and `brandkits`) and only their public URLs are kept in pinned_stories.data.
--
-- Uploads are TEAM-ONLY, unlike those two buckets: clients never upload here. The Canva
-- import function writes with the service role; the manual "upload exported pages"
-- fallback writes as the signed-in AM.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'stories',
    'stories',
    true,                -- public READ: the client plays the pages from their dashboard
    52428800,            -- 50 MB per file — covers a 15s 1080p story video
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "stories public read" ON storage.objects;
CREATE POLICY "stories public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "stories team upload" ON storage.objects;
CREATE POLICY "stories team upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'stories' AND lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

-- No UPDATE/DELETE: pages are immutable once uploaded. Re-importing writes a new folder;
-- a version that is removed from the row simply stops being referenced.
