


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."client_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "pixel_code" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."docs_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester" "text",
    "title" "text" NOT NULL,
    "request_for" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."docs_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leadcapture_pages" (
    "slug" "text" NOT NULL,
    "client_name" "text" DEFAULT ''::"text",
    "client_website" "text" DEFAULT ''::"text",
    "popup_code" "text" DEFAULT ''::"text",
    "inline_form_code" "text" DEFAULT ''::"text",
    "promo_header" "text" DEFAULT ''::"text",
    "promo_desc" "text" DEFAULT ''::"text",
    "before_img_1" "text" DEFAULT ''::"text",
    "after_img_1" "text" DEFAULT ''::"text",
    "before_img_2" "text" DEFAULT ''::"text",
    "after_img_2" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leadcapture_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overview_cards" (
    "id" "text" NOT NULL,
    "department" "text" NOT NULL,
    "tab" "text" DEFAULT 'overview'::"text",
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "link" "text" DEFAULT ''::"text",
    "cover_url" "text" DEFAULT ''::"text",
    "starred" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."overview_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."overview_tabs" (
    "id" "text" NOT NULL,
    "department" "text" NOT NULL,
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."overview_tabs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_guides" (
    "slug" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "share_password" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."owner_guides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_onboarding" (
    "session_id" "text" NOT NULL,
    "credentials" "jsonb" DEFAULT '{}'::"jsonb",
    "checklist" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."owner_onboarding" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sop_pages" (
    "slug" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sop_pages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."client_pages"
    ADD CONSTRAINT "client_pages_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."docs_requests"
    ADD CONSTRAINT "docs_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leadcapture_pages"
    ADD CONSTRAINT "leadcapture_pages_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."overview_cards"
    ADD CONSTRAINT "overview_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."overview_tabs"
    ADD CONSTRAINT "overview_tabs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_guides"
    ADD CONSTRAINT "owner_guides_pkey" PRIMARY KEY ("slug");



ALTER TABLE ONLY "public"."owner_onboarding"
    ADD CONSTRAINT "owner_onboarding_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."sop_pages"
    ADD CONSTRAINT "sop_pages_pkey" PRIMARY KEY ("slug");



CREATE POLICY "allow_all" ON "public"."leadcapture_pages" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all" ON "public"."overview_cards" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all" ON "public"."owner_onboarding" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all" ON "public"."sop_pages" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."docs_requests" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."overview_cards" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."overview_tabs" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."owner_guides" TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."client_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."docs_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leadcapture_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."overview_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."overview_tabs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owner_guides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_guides delete" ON "public"."owner_guides" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "owner_guides insert" ON "public"."owner_guides" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "owner_guides read" ON "public"."owner_guides" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "owner_guides update" ON "public"."owner_guides" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."owner_onboarding" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public insert" ON "public"."client_pages" FOR INSERT WITH CHECK (true);



CREATE POLICY "public read" ON "public"."client_pages" FOR SELECT USING (true);



CREATE POLICY "public update" ON "public"."client_pages" FOR UPDATE USING (true);



ALTER TABLE "public"."sop_pages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


























































































































































































GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";
























GRANT ALL ON TABLE "public"."client_pages" TO "anon";
GRANT ALL ON TABLE "public"."client_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."client_pages" TO "service_role";



GRANT ALL ON TABLE "public"."docs_requests" TO "anon";
GRANT ALL ON TABLE "public"."docs_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."docs_requests" TO "service_role";



GRANT ALL ON TABLE "public"."leadcapture_pages" TO "anon";
GRANT ALL ON TABLE "public"."leadcapture_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."leadcapture_pages" TO "service_role";



GRANT ALL ON TABLE "public"."overview_cards" TO "anon";
GRANT ALL ON TABLE "public"."overview_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."overview_cards" TO "service_role";



GRANT ALL ON TABLE "public"."overview_tabs" TO "anon";
GRANT ALL ON TABLE "public"."overview_tabs" TO "authenticated";
GRANT ALL ON TABLE "public"."overview_tabs" TO "service_role";



GRANT ALL ON TABLE "public"."owner_guides" TO "anon";
GRANT ALL ON TABLE "public"."owner_guides" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_guides" TO "service_role";



GRANT ALL ON TABLE "public"."owner_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."owner_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_onboarding" TO "service_role";



GRANT ALL ON TABLE "public"."sop_pages" TO "anon";
GRANT ALL ON TABLE "public"."sop_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."sop_pages" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































