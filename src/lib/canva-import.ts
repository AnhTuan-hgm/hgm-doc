/**
 * The browser side of the portal's Canva connection — shared by Pinned Stories and
 * Pinned Posts so both sections drive canva-auth.mts and canva-import.mts the same way.
 *
 * Everything here is TEAM ONLY: each call carries the signed-in AM's Supabase access token
 * and the functions refuse anything else. A client never reaches this code path.
 *
 * The export is staged (see canva-import.mts): start the job, poll until Canva has
 * rendered the pages, then either copy them into Storage (`storeCanvaPages`, for sections
 * that keep files in a bucket) or pull them back as Files (`fetchCanvaPagesAsFiles`, for
 * sections that compress and keep them in the dashboard row).
 */
import { supabase } from "@/lib/supabase";

const AUTH_ENDPOINT = "/.netlify/functions/canva-auth";
const IMPORT_ENDPOINT = "/.netlify/functions/canva-import";
/** Pages per store/fetch call — small enough that each call stays well inside the function timeout. */
const BATCH = 5;

/** What canva-auth.mts reports about the portal's Canva connection. */
export interface CanvaStatus {
    /** Client id/secret present in Netlify — without them nothing can connect. */
    configured: boolean;
    connected: boolean;
    connectedBy: string;
    expiresAt: string | null;
    redirectUri: string | null;
}

/** Thrown when the functions say Canva isn't connected (or its token stopped working). */
export class CanvaNotConnectedError extends Error {}

/** POST to a team-only function with the signed-in AM's Supabase token. */
export const teamCall = async (endpoint: string, body: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Your sign-in has expired — reload and sign in again.");
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { res, json };
};

const importCall = async (body: Record<string, unknown>) => {
    const { res, json } = await teamCall(IMPORT_ENDPOINT, body);
    if (res.status === 501 && json.code === "canva_not_configured") throw new CanvaNotConnectedError(String(json.error));
    if (!res.ok) throw new Error(String(json.error ?? "Something went wrong."));
    return json;
};

/* ── Connection ─────────────────────────────────────────────────────────── */

/** null when not signed in as team, or when the functions aren't reachable (plain `npm run dev`). */
export const fetchCanvaStatus = async (): Promise<CanvaStatus | null> => {
    try {
        const { res, json } = await teamCall(AUTH_ENDPOINT, { action: "status" });
        return res.ok ? (json as unknown as CanvaStatus) : null;
    } catch {
        return null;
    }
};

/** Returns the Canva authorisation URL to navigate to. `returnTo` is where Canva sends the AM back. */
export const startCanvaConnect = async (returnTo: string): Promise<string> => {
    const { res, json } = await teamCall(AUTH_ENDPOINT, { action: "start", returnTo });
    if (!res.ok || typeof json.url !== "string") throw new Error(String(json.error ?? "Couldn't start the Canva connection."));
    return json.url;
};

export const disconnectCanva = () => teamCall(AUTH_ENDPOINT, { action: "disconnect" });

/**
 * The `?canva=connected|error` outcome canva-auth.mts appends when it sends the AM back,
 * read once and stripped from the address bar so a reload doesn't repeat the message.
 */
export const readCanvaOutcome = (): { kind: "ok" | "err"; text: string } | null => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("canva");
    if (!outcome) return null;
    const note =
        outcome === "connected"
            ? { kind: "ok" as const, text: "Canva is connected. Paste a design link to import it." }
            : { kind: "err" as const, text: params.get("reason") || "Canva didn't connect." };
    params.delete("canva");
    params.delete("reason");
    const q = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`);
    return note;
};

/* ── Export ──────────────────────────────────────────────────────────────── */

/**
 * Export every page of a design as JPG at `width` px (height follows the design's own
 * aspect ratio) and return Canva's short-lived download URLs, in page order.
 */
export const exportCanvaDesign = async (
    designId: string,
    opts: { width: number; onProgress?: (msg: string) => void },
): Promise<{ title: string; urls: string[] }> => {
    const progress = opts.onProgress ?? (() => {});
    progress("Checking the design…");
    const started = (await importCall({ action: "start", designId, width: opts.width })) as { jobId: string; title: string; status?: string; urls?: string[] };
    let urls = started.status === "success" && started.urls ? started.urls : null;
    for (let attempt = 0; !urls && attempt < 40; attempt++) {
        progress(`Exporting from Canva… (${attempt + 1})`);
        await new Promise((r) => setTimeout(r, 1500));
        const st = (await importCall({ action: "status", jobId: started.jobId })) as { status?: string; urls?: string[] };
        if (st.status === "success" && st.urls) urls = st.urls;
    }
    if (!urls) throw new Error("Canva is taking too long — try again in a minute.");
    return { title: started.title, urls };
};

/** Copy exported pages into the `stories` bucket under this dashboard; returns their public URLs. */
export const storeCanvaPages = async (
    slug: string,
    designId: string,
    urls: string[],
    onProgress?: (msg: string) => void,
): Promise<{ page: number; url: string }[]> => {
    const batchId = `${Date.now()}`;
    const pages: { page: number; url: string }[] = [];
    for (let i = 0; i < urls.length; i += BATCH) {
        onProgress?.(`Saving pages ${Math.min(i + BATCH, urls.length)} of ${urls.length}…`);
        const stored = (await importCall({ action: "store", slug, designId, urls: urls.slice(i, i + BATCH), firstPage: i + 1, batchId })) as {
            pages: { page: number; url: string }[];
        };
        pages.push(...stored.pages);
    }
    return pages;
};

/**
 * Pull exported pages back into the browser as Files, ready for compressImageFile — for
 * sections that keep slides in the dashboard row rather than in Storage. Goes through the
 * function because Canva's download host sends no CORS headers, so the browser can't fetch
 * the URLs itself.
 */
export const fetchCanvaPagesAsFiles = async (urls: string[], onProgress?: (msg: string) => void): Promise<File[]> => {
    const files: File[] = [];
    for (let i = 0; i < urls.length; i += BATCH) {
        onProgress?.(`Fetching pages ${Math.min(i + BATCH, urls.length)} of ${urls.length}…`);
        const got = (await importCall({ action: "fetch", urls: urls.slice(i, i + BATCH) })) as { pages: { dataUrl: string }[] };
        for (const [j, p] of got.pages.entries()) {
            const blob = await (await fetch(p.dataUrl)).blob();
            const ext = blob.type === "image/png" ? "png" : "jpg";
            files.push(new File([blob], `page-${String(i + j + 1).padStart(2, "0")}.${ext}`, { type: blob.type }));
        }
    }
    return files;
};
