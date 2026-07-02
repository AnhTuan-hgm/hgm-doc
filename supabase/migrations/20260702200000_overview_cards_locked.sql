-- Per-card protection for the dashboard overview cards (Website / AM).
-- When locked = true, the UI only lets the owner (anhtuan@hiddengem.media) delete the
-- card; other team members can still view/edit but not delete it. This is a UI-level
-- guard — see the commented DELETE policy below to enforce it at the database too.

ALTER TABLE "public"."overview_cards"
    ADD COLUMN IF NOT EXISTS "locked" boolean DEFAULT false;

-- OPTIONAL DB-LEVEL ENFORCEMENT (not applied by default):
-- Replace the existing anon/authenticated DELETE policy so a locked card can only be
-- deleted by the owner's authenticated session. Uncomment to enforce at the DB layer.
--
-- DROP POLICY IF EXISTS "overview_cards delete" ON "public"."overview_cards";
-- CREATE POLICY "overview_cards delete" ON "public"."overview_cards"
--     FOR DELETE TO "authenticated", "anon"
--     USING (locked = false OR (auth.jwt() ->> 'email') = 'anhtuan@hiddengem.media');
