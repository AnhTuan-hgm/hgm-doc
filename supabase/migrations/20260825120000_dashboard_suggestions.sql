-- Client-proposed edits to the Master Brand Document ("suggestion mode").
--
-- Clients are `anon` to Supabase (they clear the app's own email/password gate, not
-- Supabase auth), so anon gets NOTHING here: clients go through
-- netlify/functions/dashboard-suggestions.mts, which holds the service-role key and
-- validates the caller's email against the dashboard row's allowed_emails on every call.
--
-- The team (authenticated @hiddengem.media) reviews: SELECT + UPDATE (accept/decline)
-- + DELETE (cleanup). No INSERT for any browser role — only the function creates rows,
-- so nothing with the public anon key can flood this table directly.
--
-- Suggestions are quarantined by design: a row here never changes dashboard_pages.data.
-- Only an AM pressing Accept + Save writes the value into the document, through the
-- same save path (and conflict guard) every other dashboard edit uses.

CREATE TABLE IF NOT EXISTS "public"."dashboard_suggestions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- dashboard_pages slug, always "{client}-dashboard"
    "slug" text NOT NULL,
    -- "hosts" | "taglines.0" | "personas.{rowId}.age" | ... (whitelisted at accept time)
    "field_key" text NOT NULL,
    -- human label captured at suggest time, so history reads well even if a row is deleted
    "field_label" text NOT NULL DEFAULT '',
    -- the value the client saw when suggesting — staleness detection at review time
    "current_value" text NOT NULL DEFAULT '',
    "suggested_value" text NOT NULL DEFAULT '',
    -- client email, validated against the row's allowed_emails by the function
    "suggested_by" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'accepted', 'declined')),
    "resolved_by" text NOT NULL DEFAULT '',
    "resolved_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "dashboard_suggestions_slug_status_idx"
    ON "public"."dashboard_suggestions" ("slug", "status");

ALTER TABLE "public"."dashboard_suggestions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_suggestions team read" ON "public"."dashboard_suggestions";
CREATE POLICY "dashboard_suggestions team read" ON "public"."dashboard_suggestions"
    FOR SELECT TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

DROP POLICY IF EXISTS "dashboard_suggestions team update" ON "public"."dashboard_suggestions";
CREATE POLICY "dashboard_suggestions team update" ON "public"."dashboard_suggestions"
    FOR UPDATE TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media')
    WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

DROP POLICY IF EXISTS "dashboard_suggestions team delete" ON "public"."dashboard_suggestions";
CREATE POLICY "dashboard_suggestions team delete" ON "public"."dashboard_suggestions"
    FOR DELETE TO "authenticated"
    USING (lower(coalesce(auth.jwt() ->> 'email', '')) LIKE '%@hiddengem.media');

REVOKE ALL ON TABLE "public"."dashboard_suggestions" FROM "anon";
REVOKE ALL ON TABLE "public"."dashboard_suggestions" FROM "authenticated";
GRANT SELECT, UPDATE, DELETE ON TABLE "public"."dashboard_suggestions" TO "authenticated";
