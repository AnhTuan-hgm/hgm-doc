-- Brand-kit PDF storage for the client Onboarding Form (Brand kit question).
-- PDFs go to Storage and only the public URL is appended to the answer text —
-- never base64 in table rows. Folder links (Drive/Dropbox) need no storage.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brandkits',
    'brandkits',
    true,                -- public READ: the team opens the PDF straight from the answers review
    26214400,            -- 25 MB per file (enforced client-side too)
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "brandkits public read" ON storage.objects;
CREATE POLICY "brandkits public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'brandkits');

-- Clients fill the form on the anon key (no account), so uploads must be open to
-- both roles — the bucket's size + mime limits above still apply server-side.
DROP POLICY IF EXISTS "brandkits upload" ON storage.objects;
CREATE POLICY "brandkits upload" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'brandkits');

-- No UPDATE/DELETE: files are immutable once uploaded (removing one from the
-- answer just deletes the URL line).
