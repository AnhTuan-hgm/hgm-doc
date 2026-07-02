-- Which Task-2 option(s) a lead-capture page shows the client:
--   'both' (default) — show Option A (new 2-column section) and Option B (replace an existing form)
--   'a'              — show only Option A
--   'b'              — show only Option B
-- Edited in-page via the lock/unlock edit mode; persists per client page.

ALTER TABLE "public"."leadcapture_pages"
    ADD COLUMN IF NOT EXISTS "form_option" "text" DEFAULT 'both'::"text";
