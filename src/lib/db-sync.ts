import { dbLogger } from "@/lib/db-logger";
import { supabase } from "@/lib/supabase";

/**
 * Read/write helpers for the `sop_pages` table (owner guides, templates and the
 * project-log pages).
 *
 * These wrapped `supabase.from("sop_pages")` calls in a Firebase Firestore
 * fallback until 2026-08-06. The fallback was removed: Firestore's rules denied
 * reads and writes for the anon client, so every fallback read failed and every
 * backup write was silently swallowed — it could not have served a request.
 * Supabase is the single source of truth.
 *
 * The helpers are kept (rather than inlining the queries at each call site) so
 * the table name, row shape and error handling live in one place.
 */

/**
 * Fetch one `sop_pages` row by slug.
 *
 * Throws when the row is missing (`.single()` treats no-rows as an error) —
 * callers rely on that to fall back to seed content or a master template, so
 * don't soften it into a `null` return.
 */
export async function readSopPage(slug: string) {
    const { data, error } = await supabase.from("sop_pages").select("*").eq("slug", slug).single();

    if (error) {
        dbLogger.error(`Read failed for sop_pages:${slug}`, error as unknown as Error);
        throw error;
    }
    return data;
}

/**
 * Upsert one `sop_pages` row.
 *
 * Throws on failure. Callers surface that as an "error"/unsaved state, so a
 * swallowed rejection here would render as a successful save.
 */
export async function writeSopPage(slug: string, data: unknown) {
    const { error } = await supabase.from("sop_pages").upsert({ slug, data, updated_at: new Date().toISOString() });

    if (error) {
        dbLogger.error(`Write failed for sop_pages:${slug}`, error as unknown as Error);
        throw error;
    }
    dbLogger.success(`sop_pages:${slug} written to Supabase`);
}
