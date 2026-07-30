// GoHighLevel Media Library proxy — team-only.
//
// The browser can never hold a GHL Private Integration token (they live in the
// server-only ghl_integrations table; see its migration). This function is the
// one place the two meet: it verifies the caller is a signed-in @hiddengem.media
// user, looks up the client's PIT with the service role, calls the GHL Media
// Library, and returns a trimmed image list. Location IDs are not needed —
// location-scoped PITs infer their own location when altId is omitted
// (verified against the live API 2026-07-29).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE = 24;

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    try {
        const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        // Gate: only signed-in HGM team members may browse client media.
        const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
        const { data: userData } = await supa.auth.getUser(token);
        const email = userData?.user?.email?.toLowerCase() ?? "";
        if (!email.endsWith("@hiddengem.media")) return json({ error: "Team sign-in required" }, 401);

        const { client, query = "", offset = 0 } = await req.json().catch(() => ({}));
        if (!client || typeof client !== "string") return json({ error: "Missing client name" }, 400);

        // ilike with no wildcards = case-insensitive exact match, so dashboard
        // names like "Flohom" still hit the stored row "FLOHOM".
        const { data: row } = await supa
            .from("ghl_integrations")
            .select("pit")
            .ilike("client_name", client.trim())
            .maybeSingle();
        if (!row?.pit) return json({ error: `No GHL Private Integration stored for "${client.trim()}"` }, 404);

        const params = new URLSearchParams({
            altType: "location",
            sortBy: "createdAt",
            sortOrder: "desc",
            type: "file",
            limit: String(PAGE_SIZE),
            offset: String(Number(offset) || 0),
        });
        if (typeof query === "string" && query.trim()) params.set("query", query.trim());

        const ghl = await fetch(`https://services.leadconnectorhq.com/medias/files?${params}`, {
            headers: { Authorization: `Bearer ${row.pit}`, Version: "2021-07-28" },
        });
        if (!ghl.ok) return json({ error: `GoHighLevel responded ${ghl.status}` }, 502);

        const body = await ghl.json();
        const all = Array.isArray(body.files) ? body.files : [];
        const files = all
            .filter((f: { contentType?: string }) => (f.contentType ?? "").startsWith("image/"))
            .map((f: { name?: string; url?: string; width?: number; height?: number }) => ({
                name: f.name ?? "",
                url: f.url ?? "",
                width: f.width,
                height: f.height,
            }))
            .filter((f: { url: string }) => f.url);
        return json({ files, hasMore: all.length === PAGE_SIZE });
    } catch (e) {
        return json({ error: String(e) }, 500);
    }
});
