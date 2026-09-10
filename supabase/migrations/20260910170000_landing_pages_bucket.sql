-- Marketing → Landing page: the published HTML moves out of landing_pages.data and into
-- Storage. Each version is one immutable object at {slug}/{version-id}.html and the row
-- keeps only its path plus metadata.
--
-- Why: the first cut stored every version's full HTML inline in the jsonb row with a 2 MB
-- cap. Real exports carry their images as base64 and land well over that, and because
-- the section reads the whole row on open, ten versions of a 2 MB page meant a 20 MB
-- fetch before anything rendered. Same reasoning as the recordings bucket: bytes in
-- Storage, paths in the row.
--
-- Public READ, like brandkits: the preview iframe and "Open full page" load the object
-- by URL, and landing_pages itself is already anon-readable, so this exposes nothing the
-- table didn't. Objects are addressed by a random version id under the slug, not
-- guessable names.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-pages',
    'landing-pages',
    true,                -- public read: preview iframe + Open full page load by URL
    26214400,            -- 25 MB per file (client-side cap matches)
    ARRAY['text/html']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "landing-pages public read" ON storage.objects;
CREATE POLICY "landing-pages public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'landing-pages');

-- Publishing is a team action, exactly as on the landing_pages table: authenticated
-- @hiddengem.media only. The client is anon and never writes here.
DROP POLICY IF EXISTS "landing-pages team upload" ON storage.objects;
CREATE POLICY "landing-pages team upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'landing-pages'
        AND lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media'
    );

-- No UPDATE/DELETE: versions are history. Restore points a new version at the same
-- object rather than copying it, so nothing is ever rewritten in place.
