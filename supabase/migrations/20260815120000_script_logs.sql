-- AI summaries of client voice / video recordings (the /log-script page).
--
-- Clients already record answers to the narrative onboarding questions (see
-- media-answer.tsx and the `recordings` bucket). Nobody on the team could read those
-- without sitting through playback. An AM picks a recording here, it gets transcribed
-- and summarised, and the result is logged in this table.
--
-- ACCESS: this table is stricter than every other table in the app, deliberately.
-- Rows hold verbatim transcripts of a client speaking — more sensitive than the
-- dashboards, which are already too open (dashboard_pages is still readable by anon
-- with the public bundle key, share_password included). Do not copy that pattern here:
--   * anon gets NOTHING. Not even SELECT.
--   * authenticated gets SELECT/INSERT/DELETE, and only on an @hiddengem.media address.
--   * UPDATE is granted to NOBODY. Only the netlify/functions/generate-summary.mts
--     background function writes progress, and it holds the service-role key, which
--     bypasses RLS. That keeps the browser from being able to forge a transcript or a
--     summary onto someone else's row.
--
-- The AM's browser inserts the `queued` row (so created_by is a real session email,
-- not something the function was told to trust) and the function takes it from there.

CREATE TABLE IF NOT EXISTS "public"."script_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Storage folder the recording lives in, which is the onboarding page's own slug
    -- (e.g. "northstar-onboarding"). Not a clients.id: a recording exists whether or
    -- not anyone has filed the client on the roster yet.
    "client_slug" text NOT NULL,
    "client_name" text NOT NULL DEFAULT '',
    -- Path inside the `recordings` bucket. Kept so a summary can be traced back to the
    -- exact take, and so "regenerate" can re-run without the AM finding it again.
    "source_path" text NOT NULL,
    "source_label" text NOT NULL DEFAULT '',
    "media_kind" text NOT NULL DEFAULT '',
    -- Read off the transcription response, NOT the file: MediaRecorder writes WebM with
    -- no duration header, so the browser reports Infinity. See media-answer.tsx.
    "duration_seconds" integer,
    "status" text NOT NULL DEFAULT 'queued'
        CHECK ("status" IN ('queued', 'transcribing', 'summarising', 'done', 'error')),
    "error" text,
    -- Stored even though the summary is what the page leads with: Claude needs it to
    -- write the summary, text costs nothing to keep, it fills the long-empty
    -- `transcript` field on the PDF export, and re-summarising must never re-transcribe.
    "transcript" text,
    "summary" jsonb,
    "created_by" text NOT NULL DEFAULT '',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "script_logs_created_at_idx" ON "public"."script_logs" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "script_logs_client_slug_idx" ON "public"."script_logs" ("client_slug");

ALTER TABLE "public"."script_logs" ENABLE ROW LEVEL SECURITY;

-- Team-only, checked against the session's own JWT rather than anything the client
-- sends. Signing in with Google proves the address; this pattern-match is what limits
-- it to staff. Any Google account can authenticate, so "is signed in" is never enough.
DROP POLICY IF EXISTS "script_logs read" ON "public"."script_logs";
CREATE POLICY "script_logs read" ON "public"."script_logs"
    FOR SELECT TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

DROP POLICY IF EXISTS "script_logs insert" ON "public"."script_logs";
CREATE POLICY "script_logs insert" ON "public"."script_logs"
    FOR INSERT TO "authenticated"
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

-- DELETE exists so a run that never started (the function call failed to reach Netlify,
-- leaving the row stuck at `queued`) can be cleared by the AM. Without it a stuck row
-- would be permanent, because nothing in the browser is allowed to UPDATE.
DROP POLICY IF EXISTS "script_logs delete" ON "public"."script_logs";
CREATE POLICY "script_logs delete" ON "public"."script_logs"
    FOR DELETE TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

-- Table grants must agree with the policies above. Supabase grants anon and
-- authenticated everything on new public tables by default, so revoking first is the
-- only way to be sure — a policy is not a permission, and leaving the privilege in
-- place means one permissive policy is all that stands between a stranger and this data.
REVOKE ALL ON TABLE "public"."script_logs" FROM "anon";
REVOKE ALL ON TABLE "public"."script_logs" FROM "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "public"."script_logs" TO "authenticated";
