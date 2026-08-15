import { supabase } from "@/lib/supabase";

/**
 * Types and queries for `script_logs` — AI summaries of client voice / video recordings.
 *
 * Kept out of supabase.ts (which is shared with client-facing pages) because everything
 * here is team-only: the table denies anon entirely, so importing these helpers into a
 * client page would only ever produce empty results and confusing errors.
 *
 * Nothing here can write progress. Status, transcript and summary are set exclusively by
 * netlify/functions/generate-summary.mts using the service-role key — see the migration
 * 20260815120000_script_logs.sql for why the browser is deliberately locked out.
 */

export const SCRIPT_LOG_BUCKET = "recordings";

export type ScriptLogStatus = "queued" | "transcribing" | "summarising" | "done" | "error";

/** The shape the model is forced to return. Mirrors SUMMARY_TOOL in the function. */
export interface RecordingSummary {
    /** One line an AM can scan in a list — what this recording is actually about. */
    headline: string;
    /** Two or three sentences of context. */
    context: string;
    key_points: string[];
    /** What the AM has to go and do. The reason this feature exists. */
    action_items: string[];
    /** Verbatim pull-quotes, for whoever writes copy later. */
    quotes: string[];
    /** Requests, worries, or anything that contradicts what we have on file. */
    flags: string[];
}

export interface ScriptLog {
    id: string;
    client_slug: string;
    client_name: string;
    source_path: string;
    source_label: string;
    media_kind: "audio" | "video" | "";
    duration_seconds: number | null;
    status: ScriptLogStatus;
    error: string | null;
    transcript: string | null;
    summary: RecordingSummary | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

/** Statuses where the background function is still expected to do something. */
export const IN_FLIGHT: ScriptLogStatus[] = ["queued", "transcribing", "summarising"];
export const isInFlight = (log: ScriptLog) => IN_FLIGHT.includes(log.status);

/**
 * A run that was queued but never picked up — the function call didn't reach Netlify, or
 * the function died before its first status write.
 *
 * Derived from the timestamp rather than stored, because storing it would need an UPDATE
 * grant in the browser, and that grant is exactly what keeps a forged transcript out of
 * this table. Five minutes is comfortably past a cold start plus the longest transcription
 * we'd expect from a 3-minute cap.
 */
export const isStalled = (log: ScriptLog) =>
    isInFlight(log) && Date.now() - new Date(log.updated_at).getTime() > 5 * 60 * 1000;

export async function listScriptLogs(): Promise<ScriptLog[]> {
    const { data, error } = await supabase.from("script_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data ?? []) as ScriptLog[];
}

/**
 * Queue a run and hand it to the background function.
 *
 * The row is inserted here rather than by the function so `created_by` comes from a real
 * session instead of a field the caller could set to anyone. Returns the new row so the
 * page can show it as `queued` immediately — the function replies 202 and reports nothing.
 */
export async function queueSummary(input: {
    clientSlug: string;
    clientName: string;
    sourcePath: string;
    sourceLabel: string;
    mediaKind: "audio" | "video" | "";
    createdBy: string;
}): Promise<ScriptLog> {
    const { data, error } = await supabase
        .from("script_logs")
        .insert({
            client_slug: input.clientSlug,
            client_name: input.clientName,
            source_path: input.sourcePath,
            source_label: input.sourceLabel,
            media_kind: input.mediaKind,
            created_by: input.createdBy,
        })
        .select()
        .single();

    if (error) throw error;
    const row = data as ScriptLog;

    // Fire-and-forget by design: a background function answers 202 the moment it is
    // accepted and reports its real outcome by writing status to the row. Awaiting a
    // result here would hang, and treating a slow response as failure would mark a run
    // dead while it is still working. The page watches the row instead.
    void fetch("/.netlify/functions/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
    }).catch((err) => console.error("[script-logs] could not reach generate-summary", err));

    return row;
}

/**
 * The newest summary for each of the given recordings, keyed by storage path.
 *
 * One query for a whole answers panel rather than one per recording — a submitted form can
 * carry a dozen recordings, and a dozen round trips would be visible on every page load.
 *
 * Call this ONLY for a team viewer. The table denies anon outright and restricts
 * `authenticated` to @hiddengem.media, so a client would get a 42501 rather than an empty
 * result, and an error is a worse thing to render than nothing.
 */
export async function listSummariesForPaths(paths: string[]): Promise<Record<string, ScriptLog>> {
    if (!paths.length) return {};
    const { data, error } = await supabase
        .from("script_logs")
        .select("*")
        .in("source_path", paths)
        .order("created_at", { ascending: false });
    if (error) throw error;

    // Newest wins. Rows are already sorted newest-first, so the first one seen for a path is
    // the one to keep — a recording summarised twice should show the latest attempt, not the
    // first, or a successful retry would stay hidden behind the failure it replaced.
    const byPath: Record<string, ScriptLog> = {};
    for (const row of (data ?? []) as ScriptLog[]) {
        if (!byPath[row.source_path]) byPath[row.source_path] = row;
    }
    return byPath;
}

/** Re-poke the function for a row that stalled or failed. Safe to call repeatedly — the
 *  function ignores anything already finished or still legitimately running. */
export async function retrySummary(id: string): Promise<void> {
    await fetch("/.netlify/functions/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
}

export async function deleteScriptLog(id: string): Promise<void> {
    const { error } = await supabase.from("script_logs").delete().eq("id", id);
    if (error) throw error;
}

/* ── Reading the recordings bucket ──────────────────────────────────── */

export interface RecordingFolder {
    /** Folder name = the onboarding page's slug, e.g. "northstar-onboarding". */
    slug: string;
    /** Resolved from the onboarding tables; falls back to the slug when unfiled. */
    clientName: string;
}

export interface RecordingFile {
    path: string;
    name: string;
    /** The question field the recording answers, humanised for display. */
    label: string;
    kind: "audio" | "video" | "";
    createdAt: string | null;
    sizeBytes: number | null;
}

/** Files are named `${field}-${Date.now()}.${ext}` by media-answer.tsx. Recover the
 *  field and make it readable: "toneOfVoice-1754…​.webm" → "Tone of voice". */
function labelFor(fileName: string): string {
    const field = fileName.replace(/-\d{10,}\.[a-z0-9]+$/i, "").replace(/\.[a-z0-9]+$/i, "");
    const spaced = field.replace(/[-_]+/g, " ").replace(/([a-z\d])([A-Z])/g, "$1 $2");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const kindFor = (fileName: string): "audio" | "video" | "" => {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    if (["mp4", "webm", "mov"].includes(ext)) return "video"; // refined below by mime when present
    if (["ogg", "mp3", "m4a", "wav"].includes(ext)) return "audio";
    return "";
};

/**
 * Every client folder in the `recordings` bucket, with a real name where we have one.
 *
 * Storage has no client names in it, so the two onboarding tables are read to translate
 * slugs. A folder with no matching row still appears — an orphaned recording is exactly
 * the kind of thing this page should surface, not hide.
 */
export async function listRecordingFolders(): Promise<RecordingFolder[]> {
    const [{ data: objects, error }, clientForms, hostForms] = await Promise.all([
        supabase.storage.from(SCRIPT_LOG_BUCKET).list("", { limit: 500, sortBy: { column: "name", order: "asc" } }),
        supabase.from("client_onboarding_pages").select("slug,client_name"),
        supabase.from("host_onboarding_pages").select("slug,client_name"),
    ]);
    if (error) throw error;

    const names = new Map<string, string>();
    for (const row of [...(clientForms.data ?? []), ...(hostForms.data ?? [])]) {
        if (row?.slug && row?.client_name) names.set(row.slug as string, row.client_name as string);
    }

    // Storage returns folders with a null id; real objects at the root are not expected
    // (media-answer.tsx always namespaces by slug) but would be skipped if any appeared.
    return (objects ?? [])
        .filter((o) => o.id === null)
        .map((o) => ({ slug: o.name, clientName: names.get(o.name) ?? o.name }));
}

export async function listRecordingsIn(slug: string): Promise<RecordingFile[]> {
    const { data, error } = await supabase.storage
        .from(SCRIPT_LOG_BUCKET)
        .list(slug, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;

    return (data ?? [])
        .filter((o) => o.id !== null)
        .map((o) => {
            const mime = (o.metadata?.mimetype as string | undefined) ?? "";
            const kind = mime.startsWith("audio/") ? "audio" : mime.startsWith("video/") ? "video" : kindFor(o.name);
            return {
                path: `${slug}/${o.name}`,
                name: o.name,
                label: labelFor(o.name),
                kind: kind as "audio" | "video" | "",
                createdAt: o.created_at ?? null,
                sizeBytes: (o.metadata?.size as number | undefined) ?? null,
            };
        });
}
