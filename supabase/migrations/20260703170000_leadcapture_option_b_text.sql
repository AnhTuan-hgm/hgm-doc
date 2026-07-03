-- Option B (replace an existing form) intro paragraph + step list are editable
-- per client page. Text supports **bold** markers rendered as highlighted
-- keywords. Empty/null falls back to the built-in defaults in popup-page.tsx.

ALTER TABLE "public"."leadcapture_pages"
    ADD COLUMN IF NOT EXISTS "option_b_intro" "text" DEFAULT ''::"text",
    ADD COLUMN IF NOT EXISTS "option_b_steps" "jsonb";
