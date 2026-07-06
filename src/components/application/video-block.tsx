import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { PlayCircle, UploadCloud02, XClose } from "@untitledui/icons";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

/**
 * Video support for guide/project pages — one value, three sources:
 *
 *  1. Loom link    → embedded inline player (loom.com/embed iframe). Zero
 *     storage cost; the viewer never leaves our page.
 *  2. YouTube link → embedded inline player (youtube.com/embed iframe). Same
 *     zero-storage-cost deal as Loom.
 *  3. mp4 upload   → Supabase Storage bucket "videos" (≤ 50 MB), played with a
 *     native <video> tag. Only the public URL is stored in page content —
 *     video bytes NEVER go into table rows (unlike images, they're too big
 *     for base64, and browsers can't practically re-encode video client-side).
 *
 * The saved value is a plain URL string, so any jsonb content shape can adopt
 * it as an optional `video?: string` field with no migration.
 *
 *  - <VideoEmbed url={...} />   → read-only inline player (locked pages)
 *  - <VideoAttach value onChange /> → edit-mode attach/replace/remove UI
 */

const LOOM_RE = /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-f0-9]{16,64})\b/i;
const YOUTUBE_RE = /^https?:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})\b/i;
const FILE_RE = /^https:\/\/\S+\.(mp4|webm|mov)(\?\S*)?$/i;
const STORAGE_RE = /^https:\/\/\S+\/storage\/v1\/object\/public\/videos\//i;

export type ParsedVideo = { kind: "loom"; embed: string } | { kind: "youtube"; embed: string } | { kind: "file"; src: string };

/** Strictly parse a video URL — only Loom/YouTube embeds and https video files pass. */
export function parseVideoUrl(raw: string | undefined | null): ParsedVideo | null {
    const url = (raw ?? "").trim();
    if (!url) return null;
    // Rebuild the iframe src from the captured id only — never embed arbitrary URLs.
    const loom = LOOM_RE.exec(url);
    if (loom) return { kind: "loom", embed: `https://www.loom.com/embed/${loom[1]}` };
    const youtube = YOUTUBE_RE.exec(url);
    if (youtube) return { kind: "youtube", embed: `https://www.youtube.com/embed/${youtube[1]}` };
    if (STORAGE_RE.test(url) || FILE_RE.test(url)) return { kind: "file", src: url };
    return null;
}

/** Inline player — Loom/YouTube iframe or native <video>. Renders nothing for invalid URLs. */
export const VideoEmbed = ({ url, className }: { url: string; className?: string }) => {
    const parsed = parseVideoUrl(url);
    if (!parsed) return null;
    if (parsed.kind === "loom" || parsed.kind === "youtube") {
        return (
            <div className={cx("aspect-video w-full overflow-hidden rounded-xl bg-primary-solid ring-1 ring-secondary", className)}>
                <iframe
                    src={parsed.embed}
                    title="Video"
                    allow="fullscreen"
                    allowFullScreen
                    className="size-full border-0"
                />
            </div>
        );
    }
    return (
        <video
            controls
            preload="metadata"
            src={parsed.src}
            className={cx("aspect-video w-full rounded-xl bg-primary-solid ring-1 ring-secondary", className)}
        />
    );
};

const MAX_BYTES = 50 * 1024 * 1024; // keep in sync with the bucket's file_size_limit

/** Upload an mp4/webm/mov to the "videos" bucket and return its public URL. */
async function uploadVideo(file: File): Promise<string> {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-80);
    const path = `${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
        .from("videos")
        .upload(path, file, { contentType: file.type || "video/mp4", cacheControl: "31536000" });
    if (error) throw error;
    return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
}

/**
 * Edit-mode video field. Shows an attach row (paste Loom link / upload mp4)
 * when empty, or an inline preview with a remove button when set.
 */
export const VideoAttach = ({
    value,
    onChange,
    className,
}: {
    value: string | undefined;
    onChange: (url: string | undefined) => void;
    className?: string;
}) => {
    const [link, setLink] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const attachLink = () => {
        if (!parseVideoUrl(link)) {
            setError("That doesn't look like a Loom, YouTube, or video link (mp4/webm/mov).");
            return;
        }
        setError(null);
        onChange(link.trim());
        setLink("");
    };

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_BYTES) {
            setError("Video is over 50 MB — trim it, or record it with Loom and paste the link instead.");
            return;
        }
        setError(null);
        setBusy(true);
        try {
            onChange(await uploadVideo(file));
        } catch {
            setError("Upload failed — check the connection (and that the videos bucket migration has been run).");
        } finally {
            setBusy(false);
        }
    };

    if (value) {
        return (
            <div className={cx("relative", className)}>
                <VideoEmbed url={value} />
                <button
                    type="button"
                    title="Remove video"
                    onClick={() => onChange(undefined)}
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-secondary bg-primary text-fg-quaternary shadow-xs transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                >
                    <XClose className="size-3.5" aria-hidden="true" />
                </button>
            </div>
        );
    }

    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-dashed border-primary px-2.5 py-1.5 transition duration-100 ease-linear focus-within:border-brand">
                    <PlayCircle className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <input
                        type="text"
                        value={link}
                        placeholder="Paste a Loom, YouTube, or video link…"
                        onChange={(e) => setLink(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && attachLink()}
                        className="min-w-0 flex-1 bg-transparent text-xs text-primary placeholder:text-placeholder outline-none"
                    />
                    {link.trim() && (
                        <button
                            type="button"
                            onClick={attachLink}
                            className="shrink-0 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                        >
                            Attach
                        </button>
                    )}
                </div>
                <label
                    className={cx(
                        "flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary px-3 py-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary",
                        busy && "pointer-events-none opacity-50",
                    )}
                >
                    <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFile} disabled={busy} />
                    <UploadCloud02 className={cx("size-4", busy && "animate-pulse")} aria-hidden="true" />
                    {busy ? "Uploading…" : "Upload video"}
                </label>
            </div>
            <p className="text-[11px] text-quaternary">Loom and YouTube links play right on the page (recommended) · uploads up to 50 MB.</p>
            {error && <p className="text-xs text-error-primary">{error}</p>}
        </div>
    );
};
