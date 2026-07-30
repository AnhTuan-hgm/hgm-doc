-- GoHighLevel Private Integration tokens, one row per client sub-account.
-- Used by server-side Edge Functions (media-library proxy, "Push to GHL")
-- via the service_role key, which bypasses RLS.
--
-- SECURITY — deliberately NO anon/authenticated policies and NO grants:
-- these are live API secrets. Anything readable through the anon key is
-- effectively public (the key ships in the browser bundle), so unlike every
-- other table in this project, browsers must never be able to read this one.
-- Do NOT "fix" this by adding the usual anon/authenticated RLS policies.

CREATE TABLE IF NOT EXISTS "public"."ghl_integrations" (
    "client_name" "text" NOT NULL,
    "pit" "text" NOT NULL,
    "note" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."ghl_integrations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."ghl_integrations"
    ADD CONSTRAINT "ghl_integrations_pkey" PRIMARY KEY ("client_name");

ALTER TABLE "public"."ghl_integrations" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: revoke the PostgREST roles' default schema grants too,
-- so even a mistakenly-added policy can't expose rows on its own.
REVOKE ALL ON TABLE "public"."ghl_integrations" FROM "anon";
REVOKE ALL ON TABLE "public"."ghl_integrations" FROM "authenticated";
GRANT ALL ON TABLE "public"."ghl_integrations" TO "service_role";
