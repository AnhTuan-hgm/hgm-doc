import { createClient } from "@supabase/supabase-js";

/**
 * Marks a client's Kick-off Call step as booked.
 *
 * Why this exists as a function at all: the client reading their dashboard is `anon` to Supabase —
 * they cleared the app's own email/password gate, not Supabase auth — and `anon` has SELECT but no
 * UPDATE grant on dashboard_pages. The fix is NOT to grant anon UPDATE: `anon` is every
 * unauthenticated visitor on the internet, so that would let anyone rewrite any client's dashboard.
 * Instead the browser asks this function, which holds the service-role key and can only do the one
 * narrow thing below.
 *
 * Deliberately narrow: it adds "kickoff" to journey_done and touches nothing else. It cannot set
 * any other step, cannot remove one, and cannot write any other field — so the worst a caller can
 * do, even with a guessed slug, is show one step as done when it isn't, which an AM can untick.
 * Keep it that way: the moment this accepts a step id or a data blob from the caller, a guessable
 * endpoint turns into arbitrary dashboard editing.
 */

const STEP = "kickoff";

export default async (req: Request) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        return Response.json({ error: "Not configured — SUPABASE_SERVICE_ROLE_KEY is missing in Netlify." }, { status: 500 });
    }

    let slug: string;
    try {
        const body = await req.json();
        slug = String(body.slug ?? "").trim();
    } catch {
        return Response.json({ error: "Bad request." }, { status: 400 });
    }

    // Shape check before touching the database: these slugs are always "{client}-dashboard".
    if (!slug || slug.length > 120 || !/^[a-z0-9-]+-dashboard$/.test(slug)) {
        return Response.json({ error: "Bad slug." }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Read-modify-write against the row as it is right now, rather than trusting anything the
    // browser sends. A client's stale copy of `data` must never overwrite a team member's edits.
    const { data: row, error: readErr } = await supabaseAdmin.from("dashboard_pages").select("data").eq("slug", slug).single();
    if (readErr || !row) return Response.json({ error: "Not found." }, { status: 404 });

    const data = (row.data ?? {}) as Record<string, unknown>;
    const done = Array.isArray(data.journey_done) ? (data.journey_done as string[]) : [];
    if (done.includes(STEP)) return Response.json({ ok: true, alreadyDone: true });

    const { error: writeErr } = await supabaseAdmin
        .from("dashboard_pages")
        .update({ data: { ...data, journey_done: [...done, STEP] } })
        .eq("slug", slug);

    if (writeErr) {
        console.error("[mark-booked] update failed", writeErr);
        return Response.json({ error: "Could not save." }, { status: 500 });
    }

    return Response.json({ ok: true });
};
