-- Video storage for guide/tutorial clips (VideoAttach component).
-- Videos are NEVER stored as base64 in table rows (they're 20-100 MB) — they go
-- to this Storage bucket and only the public URL is saved in page content.
-- Loom links need no storage at all (embedded straight from loom.com).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    true,                -- public READ: guide pages are shared with clients by URL
    52428800,            -- 50 MB hard cap per file (enforced client-side too)
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Read: anyone with the page URL can stream the video.
CREATE POLICY "videos public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'videos');

-- Insert: page editing runs on the anon key (same posture as the content tables),
-- so uploads must be allowed for both roles. The bucket's size + mime limits above
-- still apply server-side.
CREATE POLICY "videos upload" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'videos');

-- No UPDATE/DELETE policies: files are immutable once uploaded (removing a video
-- from a page just clears the URL). Orphaned files can be cleaned up from the
-- Supabase dashboard if storage ever fills up.
