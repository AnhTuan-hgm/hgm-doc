-- Voice / video answers for the client Onboarding Form.
--
-- Hosts can answer the long narrative questions by recording instead of typing.
-- The media file goes to Storage and only its PATH is stored in the answer JSON —
-- never base64 in the row (a 90s video is megabytes; inlining it would bloat every
-- read of client_onboarding_pages).
--
-- Unlike the public `brandkits` bucket, this one is PRIVATE: these are recordings
-- of the client's own voice and face, not a logo pack. Playback goes through
-- createSignedUrl(), so links expire and nothing is directly reachable or
-- indexable from a guessed URL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recordings',
    'recordings',
    false,               -- private: read via short-lived signed URLs only
    52428800,            -- 50 MB per file (client-side caps keep real files far under this)
    ARRAY[
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'video/webm',
        'video/mp4',
        'video/quicktime'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Hosts fill the form on the anon key (no account), and the team reviews answers
-- on the same key, so both roles need read + insert. The bucket's size and mime
-- limits above still apply server-side.
DROP POLICY IF EXISTS "recordings read" ON storage.objects;
CREATE POLICY "recordings read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'recordings');

DROP POLICY IF EXISTS "recordings upload" ON storage.objects;
CREATE POLICY "recordings upload" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'recordings');

-- Re-recording replaces the answer's path with a new object rather than mutating
-- the old one, so there is deliberately no UPDATE policy. DELETE is allowed so a
-- host can remove a recording they are not happy with before submitting.
DROP POLICY IF EXISTS "recordings delete" ON storage.objects;
CREATE POLICY "recordings delete" ON storage.objects
    FOR DELETE TO anon, authenticated
    USING (bucket_id = 'recordings');
