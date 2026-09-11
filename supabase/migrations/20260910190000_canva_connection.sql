-- Canva Connect API credentials for the portal's one-click import (Marketing → Pinned
-- Stories, canva-import.mts), obtained once through canva-auth.mts's OAuth flow.
--
-- Canva issues short-lived access tokens (4 h) and single-use refresh tokens that rotate
-- on every refresh, so the pair has to live somewhere a server can read AND update — not
-- in a static Netlify environment variable, which would die the same afternoon. One row,
-- id 'team': the HiddenGem team account that owns the story designs.
--
-- SECURITY — same posture as ghl_integrations: NO anon/authenticated policies and NO
-- grants. These are live API secrets; anything the anon key can read is effectively
-- public. Only the service role (the Netlify functions) touches these tables.

CREATE TABLE IF NOT EXISTS "public"."canva_connection" (
    "id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "scope" "text" DEFAULT ''::"text",
    "connected_by" "text" DEFAULT ''::"text",
    "connected_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."canva_connection" OWNER TO "postgres";
ALTER TABLE ONLY "public"."canva_connection"
    ADD CONSTRAINT "canva_connection_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."canva_connection" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."canva_connection" FROM "anon";
REVOKE ALL ON TABLE "public"."canva_connection" FROM "authenticated";
GRANT ALL ON TABLE "public"."canva_connection" TO "service_role";

-- In-flight OAuth handshakes: the PKCE verifier and where to send the AM back, keyed by
-- the `state` Canva echoes to the callback. Rows are deleted when the callback lands and
-- are worthless after ten minutes either way; the function prunes stale ones on start.
CREATE TABLE IF NOT EXISTS "public"."canva_oauth_states" (
    "state" "text" NOT NULL,
    "code_verifier" "text" NOT NULL,
    "started_by" "text" DEFAULT ''::"text",
    "return_to" "text" DEFAULT '/'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."canva_oauth_states" OWNER TO "postgres";
ALTER TABLE ONLY "public"."canva_oauth_states"
    ADD CONSTRAINT "canva_oauth_states_pkey" PRIMARY KEY ("state");
ALTER TABLE "public"."canva_oauth_states" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."canva_oauth_states" FROM "anon";
REVOKE ALL ON TABLE "public"."canva_oauth_states" FROM "authenticated";
GRANT ALL ON TABLE "public"."canva_oauth_states" TO "service_role";
