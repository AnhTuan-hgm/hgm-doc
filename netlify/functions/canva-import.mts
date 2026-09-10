import { createClient } from "@supabase/supabase-js";
import { CANVA_API, getCanvaAccessToken } from "../lib/canva.mts";
import { NOT_CONFIGURED, callerEmail, isDashboardSlug, isTeamEmail, readAuthEnv } from "../lib/client-sources.mts";

/**
 * Pulls the pages of a Canva design into Supabase Storage for Marketing → Pinned Stories.
 *
 * The AM pastes a Canva link on the dashboard; this is the "platform fetches the design"
 * half. It talks to the Canva Connect API (the same export the Canva MCP tools use) and
 * writes the exported pages into the `stories` bucket, returning public URLs the section
 * stores in pinned_stories.data.
 *
 * TEAM ONLY. The browser sends the AM's Supabase access token; a client never reaches
 * this. Verified with the publishable key (callerEmail), the storage write uses the
 * service role.
 *
 * STAGED, not one call: a 20-page export takes Canva several seconds and downloading +
 * re-uploading 20 files takes more, so the browser drives three short steps that each fit
 * comfortably inside Netlify's synchronous function timeout:
 *   { action: "start",  designId }                       → { jobId, title, pageCount }
 *   { action: "status", jobId }                          → { status: "in_progress" | "success", urls? }
 *   { action: "store",  slug, designId, urls, firstPage } → { pages: [{ page, url }] }   (≤ STORE_BATCH urls)
 *
 * The Canva token comes from ../lib/canva.mts: the pair the team stored by pressing
 * "Connect Canva" (canva-auth.mts), refreshed there when it is near its 4-hour expiry.
 * Nothing connected — or a refresh Canva refuses — returns `code: "canva_not_configured"`,
 * the section offers Connect Canva, and the AM can still upload the pages Canva exports
 * (Share → Download) for the identical result: the pages, in Storage, arranged on the
 * dashboard.
 *
 * Images only. Canva exports a multi-page design's video as one MP4, not one per page,
 * so video slides are uploaded per page by the AM for now.
 */

const STORE_BATCH = 5;
const MAX_URLS = 60;
// 1.5× the phone screen the client sees them on; a 1080-wide JPG would be ~3× heavier
// for no visible gain inside a 402pt mockup.
const EXPORT_WIDTH = 810;
const EXPORT_HEIGHT = 1440;

const isDesignId = (s: string) => /^D[A-Za-z0-9_-]{10}$/.test(s);

const canvaFetch = async (token: string, path: string, init?: RequestInit) => {
    const res = await fetch(`${CANVA_API}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
        json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
        /* non-JSON error page */
    }
    return { ok: res.ok, status: res.status, json };
};

export default async (req: Request) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const auth = readAuthEnv();
    if (!auth) return Response.json({ error: NOT_CONFIGURED }, { status: 500 });
    if (!isTeamEmail(await callerEmail(req, auth.supabaseUrl, auth.anonKey))) {
        return Response.json({ error: "Team sign-in required." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = (await req.json()) as Record<string, unknown>;
    } catch {
        return Response.json({ error: "Bad request." }, { status: 400 });
    }
    const action = String(body.action ?? "");

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return Response.json({ error: NOT_CONFIGURED }, { status: 500 });
    const admin = createClient(auth.supabaseUrl, serviceKey);

    const tokenResult = await getCanvaAccessToken(admin);
    if ("error" in tokenResult) {
        const error =
            tokenResult.error === "not_connected"
                ? "Canva isn't connected to the portal yet — press Connect Canva, or upload the exported pages instead."
                : `The portal's Canva connection stopped working (${tokenResult.detail ?? "refresh refused"}) — connect it again.`;
        return Response.json({ error, code: "canva_not_configured" }, { status: 501 });
    }
    const token = tokenResult.token;

    /* ── start: confirm the design and kick off the export ── */
    if (action === "start") {
        const designId = String(body.designId ?? "");
        if (!isDesignId(designId)) return Response.json({ error: "That doesn't look like a Canva design link." }, { status: 400 });

        const meta = await canvaFetch(token, `/designs/${designId}`);
        if (meta.status === 401 || meta.status === 403) {
            return Response.json({ error: "Canva refused the portal's token — connect Canva again.", code: "canva_not_configured" }, { status: 501 });
        }
        if (meta.status === 404)
            return Response.json({ error: "Canva can't find that design. Is it shared with the HiddenGem team account?" }, { status: 404 });
        if (!meta.ok) return Response.json({ error: "Canva didn't answer — try again in a moment." }, { status: 502 });
        const design = (meta.json.design ?? {}) as { title?: string; page_count?: number };

        const started = await canvaFetch(token, "/exports", {
            method: "POST",
            body: JSON.stringify({ design_id: designId, format: { type: "jpg", quality: 85, width: EXPORT_WIDTH, height: EXPORT_HEIGHT } }),
        });
        const job = (started.json.job ?? {}) as { id?: string; status?: string; urls?: string[] };
        if (!started.ok || !job.id) return Response.json({ error: "Canva refused to export this design." }, { status: 502 });

        return Response.json({ jobId: job.id, title: design.title ?? "", pageCount: design.page_count ?? 0, status: job.status, urls: job.urls });
    }

    /* ── status: poll the export job ── */
    if (action === "status") {
        const jobId = String(body.jobId ?? "");
        if (!/^[A-Za-z0-9_-]{8,80}$/.test(jobId)) return Response.json({ error: "Bad job." }, { status: 400 });
        const res = await canvaFetch(token, `/exports/${jobId}`);
        const job = (res.json.job ?? {}) as { status?: string; urls?: string[]; error?: { message?: string } };
        if (!res.ok) return Response.json({ error: "Couldn't check the export." }, { status: 502 });
        if (job.status === "failed") return Response.json({ error: job.error?.message || "Canva's export failed." }, { status: 502 });
        return Response.json({ status: job.status, urls: job.urls });
    }

    /* ── store: copy a batch of exported files into the stories bucket ── */
    if (action === "store") {
        const slug = String(body.slug ?? "").trim();
        const designId = String(body.designId ?? "");
        const urls = Array.isArray(body.urls) ? (body.urls as unknown[]).map(String) : [];
        const firstPage = Number(body.firstPage ?? 1);
        if (!isDashboardSlug(slug) || !isDesignId(designId)) return Response.json({ error: "Bad request." }, { status: 400 });
        if (!urls.length || urls.length > STORE_BATCH || !Number.isInteger(firstPage) || firstPage < 1 || firstPage > MAX_URLS) {
            return Response.json({ error: "Bad batch." }, { status: 400 });
        }
        // Only Canva's own export host — never an arbitrary URL handed in by the browser.
        if (!urls.every((u) => /^https:\/\/export-download\.canva\.com\//.test(u))) return Response.json({ error: "Bad URL." }, { status: 400 });

        const folder = `${slug}/${designId}/${String(body.batchId ?? Date.now())
            .replace(/[^a-zA-Z0-9-]/g, "")
            .slice(0, 32)}`;

        const pages: { page: number; url: string }[] = [];
        for (let i = 0; i < urls.length; i++) {
            const page = firstPage + i;
            const dl = await fetch(urls[i]);
            if (!dl.ok) return Response.json({ error: `Couldn't download page ${page} from Canva.` }, { status: 502 });
            const type = dl.headers.get("content-type")?.split(";")[0] || "image/jpeg";
            const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
            const path = `${folder}/page-${String(page).padStart(2, "0")}.${ext}`;
            const bytes = new Uint8Array(await dl.arrayBuffer());
            const { error } = await admin.storage.from("stories").upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: true });
            if (error) return Response.json({ error: `Couldn't store page ${page}.` }, { status: 500 });
            pages.push({ page, url: admin.storage.from("stories").getPublicUrl(path).data.publicUrl });
        }
        return Response.json({ pages });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
};
