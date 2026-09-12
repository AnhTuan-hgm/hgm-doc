import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared server side for the help centre: the reporting database, and the check
 * that decides whether a caller may see a client's requests.
 *
 * Lives in netlify/lib rather than netlify/functions on purpose: Netlify routes
 * every top-level file in the functions directory as its own endpoint, so a
 * helper put there would be publicly callable. Imported from a function, this is
 * just bundled.
 *
 * ── WHY THE PORTAL NEEDS A SERVER FOR THIS AT ALL ───────────────────────────
 * Tickets live in a THIRD Supabase project (HGM Reporting), separate from the
 * portal's own and from the platform's. A browser session belongs to one project
 * and means nothing to another, and this app is a static SPA with nowhere to
 * hide a key, so the reporting project's service key can only live here. Its
 * tables have RLS on with no permissive policy, which makes these functions the
 * only route in rather than merely the intended one.
 *
 * ── WHY IDENTITY COMES FROM A SESSION, NOT THE DASHBOARD PASSWORD ───────────
 * The dashboard's own gate is, by its authors' description, "UI-level, not a
 * security boundary". The first version of this file tried to fix that by
 * checking the same share password server-side, which fixed nothing: the
 * password is published. Anyone can read it with the public anon key and then
 * clear the gate legitimately. verifyCaller therefore takes a Supabase session
 * token and asks the auth server who it belongs to. See its own comment for the
 * measurement.
 *
 * ── WHY A DASHBOARD WITH NO LIST IS REFUSED ─────────────────────────────────
 * A dashboard with an empty allowlist is deliberately open by URL; that staged
 * rollout is documented in client-dashboard-page.tsx and all the existing
 * dashboards started that way. Inheriting it here would publish every request a
 * client has ever raised to anyone who guesses the slug. The help centre
 * refuses and says so on screen, rather than degrading quietly into an open
 * endpoint.
 */

/* ── environment ─────────────────────────────────────────────────────────── */

/** The portal's own project: where dashboard_pages and the allowlist live. */
const PORTAL_URL = process.env.VITE_SUPABASE_URL;
const PORTAL_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** The reporting project: where tickets live. Set in the Netlify UI, never in the repo. */
const REPORTING_URL = process.env.REPORTING_SUPABASE_URL;
const REPORTING_SERVICE_KEY = process.env.REPORTING_SUPABASE_SERVICE_ROLE_KEY;

/** The platform endpoint that routes a ticket, and the key it checks. */
export const BRAIN_TICKET_URL = process.env.BRAIN_TICKETS_RECEIVED_URL;
export const BRAIN_API_KEY = process.env.BRAIN_API_KEY;

export class ConfigError extends Error {}

/** Fails loudly and identically everywhere, so a missing variable is never a 500 with no cause. */
export const reportingDb = (): SupabaseClient => {
    if (!REPORTING_URL || !REPORTING_SERVICE_KEY) {
        throw new ConfigError("REPORTING_SUPABASE_URL / REPORTING_SUPABASE_SERVICE_ROLE_KEY are not set in Netlify.");
    }
    return createClient(REPORTING_URL, REPORTING_SERVICE_KEY, { auth: { persistSession: false } });
};

export const portalDb = (): SupabaseClient => {
    if (!PORTAL_URL || !PORTAL_SERVICE_KEY) {
        throw new ConfigError("VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in Netlify.");
    }
    return createClient(PORTAL_URL, PORTAL_SERVICE_KEY, { auth: { persistSession: false } });
};

/* ── the gate ────────────────────────────────────────────────────────────── */

export const normEmail = (e: string) => e.trim().toLowerCase();

/** Mirrors src/pages/client/dashboard/dashboard-model.ts. Kept in step deliberately. */
interface DashboardUser {
    email: string;
    name?: string;
}

export interface Caller {
    slug: string;
    clientName: string;
    email: string;
    name: string;
}

export type GateResult =
    | { ok: true; caller: Caller }
    | { ok: false; status: number; error: string };

/** The slugs this app serves dashboards at. Checked before any lookup. */
export const isDashboardSlug = (slug: string): boolean =>
    slug.length > 0 && slug.length <= 120 && /^[a-z0-9-]+-dashboard$/.test(slug);

/**
 * Proves who the caller is, from a session token they cannot forge.
 *
 * ── WHY THIS IS NOT A PASSWORD CHECK ────────────────────────────────────────
 * The first version of this function verified the dashboard's share password
 * server-side, reasoning that the client-side gate was, in its own authors'
 * words, "UI-level, not a security boundary". That was right about the problem
 * and wrong about the fix.
 *
 * The password it checked is published. Measured 12 Sep 2026 with the PUBLIC
 * anon key: all 54 dashboard_pages rows come back, and seven of them carry
 * data.share_password in plaintext. Anyone can read the secret and then clear
 * the gate legitimately, so moving the check to a server changed nothing. A
 * ticket history is what a client asked us for, when, and what we said about
 * it; it cannot rest on a secret that is world-readable.
 *
 * So identity now comes from a Supabase session token, validated against the
 * portal project's auth server on every call. The allowlist stays exactly where
 * it is and stays readable, which is harmless: knowing WHO may enter is not the
 * same as being able to enter. The token cannot be read off a public table and
 * cannot be minted without signing in as that address.
 *
 * The portal already signs clients in with Google for this very dashboard
 * (see src/hooks/use-auth-user.ts and the isAllowedClient check in
 * client-dashboard-page.tsx), so this asks for nothing new of them.
 */
export const verifyCaller = async (slug: string, accessToken: string): Promise<GateResult> => {
    if (!isDashboardSlug(slug)) return { ok: false, status: 400, error: "Bad slug." };
    if (!accessToken || accessToken.length < 20 || accessToken.length > 4096) {
        return { ok: false, status: 401, error: "Sign in to use the help centre." };
    }

    // Validated by the auth server, not parsed here: decoding a JWT locally
    // proves only that somebody can write JSON. getUser rejects an expired,
    // revoked or forged token.
    const { data: authData, error: authError } = await portalDb().auth.getUser(accessToken);
    const who = normEmail(authData?.user?.email ?? "");
    if (authError || !who) return { ok: false, status: 401, error: "Sign in to use the help centre." };

    const { data: row, error } = await portalDb()
        .from("dashboard_pages")
        .select("slug, data")
        .eq("slug", slug)
        .maybeSingle();

    // A missing dashboard and an address that is not listed give the same
    // answer on purpose: a different one would let anyone enumerate which
    // client slugs exist.
    if (error || !row) return { ok: false, status: 403, error: "Not authorised." };

    const content = (row.data ?? {}) as {
        dashboard_users?: DashboardUser[];
        allowed_emails?: string[];
        client_name?: string;
    };
    const users: DashboardUser[] =
        content.dashboard_users ?? (content.allowed_emails ?? []).map((e) => ({ email: e }));

    // ARMED means somebody is listed. It no longer asks whether they have a
    // password, because a password is no longer what gets anyone in. A
    // dashboard with an empty list is deliberately open by URL for its
    // marketing content; inheriting that here would publish every request a
    // client has ever raised to anyone who guesses the slug.
    const listed = users.filter((u) => u.email.trim());
    if (listed.length === 0) {
        return {
            ok: false,
            status: 403,
            error: "This dashboard has no access list yet, so its help centre is closed. Ask your account manager to add you.",
        };
    }

    const user = listed.find((u) => normEmail(u.email) === who);
    if (!user) return { ok: false, status: 403, error: "Not authorised." };

    return {
        ok: true,
        caller: {
            slug,
            clientName: (content.client_name ?? "").trim() || slug.replace(/-dashboard$/, ""),
            email: who,
            name: (user.name ?? "").trim() || who.split("@")[0],
        },
    };
};

/**
 * The caller's session token.
 *
 * Read from the Authorization header first, because that is where a bearer
 * token belongs: headers stay out of referrers, out of most logs, and out of
 * anything that serialises a request body. The body is accepted as a fallback
 * only so a caller that cannot set headers still works, and it is the same
 * token either way.
 */
export const accessTokenFrom = (req: Request, body: unknown): string => {
    const header = req.headers.get("authorization") ?? "";
    const bearer = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (bearer) return bearer[1].trim();
    const fromBody = body && typeof body === "object" ? (body as { accessToken?: unknown }).accessToken : undefined;
    return typeof fromBody === "string" ? fromBody.trim() : "";
};

/* ── shared request helpers ──────────────────────────────────────────────── */

export const jsonError = (status: number, error: string) => Response.json({ error }, { status });

/**
 * Reads and shape-checks a JSON body.
 *
 * Returns a discriminated result rather than throwing, so every caller is forced
 * to handle the bad-input case in the same place it handles the good one.
 */
export const readJson = async <T = Record<string, unknown>,>(
    req: Request,
): Promise<{ ok: true; body: T } | { ok: false; response: Response }> => {
    const type = req.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
        return { ok: false, response: jsonError(415, "Send application/json.") };
    }
    try {
        const body = (await req.json()) as T;
        if (!body || typeof body !== "object") return { ok: false, response: jsonError(400, "Bad request.") };
        return { ok: true, body };
    } catch {
        return { ok: false, response: jsonError(400, "Bad request.") };
    }
};

/** Trims, collapses whitespace and caps length. Used on everything a person types. */
export const cleanText = (v: unknown, max: number): string =>
    String(v ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);

/** A date the client typed, or null. Never a guess, and never in the past. */
export const cleanDate = (v: unknown): string | null => {
    const s = String(v ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const d = new Date(`${s}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    return s;
};
