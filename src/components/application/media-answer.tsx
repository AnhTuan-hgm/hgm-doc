import { useEffect, useRef, useState } from "react";
import { Microphone01, RefreshCw01, Trash01, VideoRecorder, XClose } from "@untitledui/icons";
import { supabase } from "@/lib/supabase";

/**
 * Voice / video answer control for the onboarding form's narrative questions.
 *
 * Records in the browser with MediaRecorder, uploads the blob to the private
 * `recordings` bucket, and hands back the storage PATH — the caller stores that
 * in the answer, never the media itself. Playback resolves a short-lived signed
 * URL, since the bucket is deliberately not public.
 *
 * Recording never replaces typing: a host can type, record, or do both, and the
 * question counts as answered either way.
 */

const BUCKET = "recordings";

/** Hard caps. Video especially: an uncapped phone recording is tens of megabytes. */
const MAX_SECONDS = { audio: 180, video: 90 } as const;
const BITRATE = { audioBitsPerSecond: 64_000, videoBitsPerSecond: 1_200_000 };

export type MediaKind = "audio" | "video";

/**
 * Safari/iOS produces audio/mp4 and has no Opus support; Chrome and Firefox
 * prefer webm/opus. Feature-detect rather than assuming, or recording silently
 * fails on iPhone — which is where most hosts will do this.
 */
const pickMimeType = (kind: MediaKind): string => {
    const candidates =
        kind === "audio"
            ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
            : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
    return candidates.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) ?? "";
};

const extensionFor = (mime: string) => {
    if (mime.includes("mp4")) return "mp4";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("quicktime")) return "mov";
    return "webm";
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Player for a MediaRecorder file, with the WebM duration fix.
 *
 * MediaRecorder writes WebM as a live stream and never backfills the Duration
 * element, so browsers load the file with `duration === Infinity`, render
 * "0:00 / 0:00", and won't seek or scrub. The fix is to seek far past the end
 * once metadata is in: that forces the browser to scan to the real end and
 * compute the duration, after which we rewind to the start. Without this the
 * recording is stored perfectly but appears broken to whoever plays it back.
 */
export const RecordingPlayer = ({ src, kind, className }: { src: string; kind: MediaKind | ""; className?: string }) => {
    const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !src) return;

        const settle = () => {
            if (el.duration !== Infinity && !Number.isNaN(el.duration)) return;
            const onSeeked = () => {
                el.removeEventListener("timeupdate", onSeeked);
                el.currentTime = 0;
            };
            el.addEventListener("timeupdate", onSeeked);
            // Any absurdly large target works — the browser clamps to the true end.
            el.currentTime = 1e101;
        };

        if (el.readyState >= 1) settle();
        el.addEventListener("loadedmetadata", settle);
        return () => el.removeEventListener("loadedmetadata", settle);
    }, [src]);

    return kind === "video" ? (
        <video ref={ref} src={src} controls playsInline preload="metadata" className={className} />
    ) : (
        <audio ref={ref} src={src} controls preload="metadata" className={className} />
    );
};

/** Recording needs a secure context; on http:// (other than localhost) getUserMedia is absent. */
const canRecord = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export const MediaAnswer = ({
    slug,
    field,
    path,
    kind,
    onChange,
}: {
    /** Client slug — recordings are namespaced per client. Absent on the template. */
    slug?: string;
    field: string;
    /** Stored storage path, or "" when nothing is recorded yet. */
    path: string;
    kind: MediaKind | "";
    onChange: (path: string, kind: MediaKind | "") => void;
}) => {
    const [recording, setRecording] = useState<MediaKind | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [playbackUrl, setPlaybackUrl] = useState("");

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const previewRef = useRef<HTMLVideoElement>(null);
    /** Per-take cancellation flag. Deliberately NOT a shared ref: `onstop` fires
        asynchronously, so if the host cancels and immediately records again, a
        shared flag gets reset to false by the new take and the cancelled one
        uploads anyway — leaving an orphaned file behind. Each take closes over
        its own token, so a cancelled recorder can never change its mind. */
    const tokenRef = useRef<{ cancelled: boolean } | null>(null);
    /** Live mirror of the `path` prop. `upload()` resolves seconds after it was
        created, by which time the prop captured in its closure can be stale — and
        deleting a stale path orphans the file it was meant to replace. */
    const pathRef = useRef(path);
    useEffect(() => {
        pathRef.current = path;
    }, [path]);

    // Resolve a signed URL for whatever is stored. Re-runs when the path changes
    // (i.e. after a re-record) so the player never points at the previous take.
    useEffect(() => {
        let live = true;
        if (!path) {
            setPlaybackUrl("");
            return;
        }
        supabase.storage
            .from(BUCKET)
            .createSignedUrl(path, 60 * 60)
            .then(({ data }) => {
                if (live && data?.signedUrl) setPlaybackUrl(data.signedUrl);
            });
        return () => {
            live = false;
        };
    }, [path]);

    // Stop the camera/mic if the question is navigated away from mid-recording.
    useEffect(
        () => () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
        },
        [],
    );

    /**
     * Attach the camera feed AFTER the preview mounts. The <video> only renders
     * once `recording` is set, so assigning srcObject inside start() — which runs
     * before that state update — silently did nothing and left the host looking at
     * an empty box while they were being recorded.
     */
    useEffect(() => {
        if (recording !== "video") return;
        const el = previewRef.current;
        const stream = streamRef.current;
        if (!el || !stream) return;
        el.srcObject = stream;
        void el.play().catch(() => {});
    }, [recording]);

    useEffect(() => {
        if (!recording) return;
        const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => window.clearInterval(id);
    }, [recording]);

    // Auto-stop at the cap.
    useEffect(() => {
        if (recording && elapsed >= MAX_SECONDS[recording]) stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elapsed, recording]);

    const cleanupStream = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (previewRef.current) previewRef.current.srcObject = null;
    };

    const start = async (k: MediaKind) => {
        setError("");
        if (!slug) {
            setError("Recording is only available on your own form, not the preview.");
            return;
        }
        if (!canRecord()) {
            setError("Your browser can't record here — you can still type your answer.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia(k === "audio" ? { audio: true } : { audio: true, video: { facingMode: "user" } });
            streamRef.current = stream;
            const token = { cancelled: false };
            tokenRef.current = token;
            chunksRef.current = [];
            setElapsed(0);

            const mimeType = pickMimeType(k);
            const rec = new MediaRecorder(stream, mimeType ? { mimeType, ...BITRATE } : BITRATE);
            recorderRef.current = rec;
            rec.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            rec.onstop = () => {
                cleanupStream();
                if (token.cancelled) return;
                const type = rec.mimeType || mimeType || (k === "audio" ? "audio/webm" : "video/webm");
                void upload(new Blob(chunksRef.current, { type }), k, type);
            };
            rec.start();
            setRecording(k);
        } catch {
            cleanupStream();
            setError("We couldn't access your microphone or camera — check the browser permission and try again.");
        }
    };

    const stop = () => {
        recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
        setRecording(null);
    };

    const cancel = () => {
        if (tokenRef.current) tokenRef.current.cancelled = true;
        stop();
        setElapsed(0);
    };

    const upload = async (blob: Blob, k: MediaKind, mime: string) => {
        setBusy(true);
        try {
            const name = `${field}-${Date.now()}.${extensionFor(mime)}`;
            const target = `${slug}/${name}`;
            const replacing = pathRef.current;
            const { error: upErr } = await supabase.storage.from(BUCKET).upload(target, blob, { contentType: mime, cacheControl: "31536000" });
            if (upErr) throw upErr;
            // Only now that the new take is safely stored do we drop the old one, and
            // read the path from the ref so a stale closure can't delete the wrong file.
            // Best-effort: a leftover object is harmless, a lost answer is not.
            if (replacing && replacing !== target) void supabase.storage.from(BUCKET).remove([replacing]);
            onChange(target, k);
        } catch (e) {
            console.error("[media answer upload]", e);
            setError("That recording didn't upload — check your connection and try again.");
        } finally {
            setBusy(false);
        }
    };

    const remove = () => {
        if (pathRef.current) void supabase.storage.from(BUCKET).remove([pathRef.current]);
        onChange("", "");
        setElapsed(0);
    };

    /* ── Recording in progress ── */
    if (recording) {
        return (
            <div className="mt-5 flex max-w-xl flex-col gap-3 rounded-xl bg-secondary p-4">
                {recording === "video" && <video ref={previewRef} muted playsInline className="aspect-video w-full rounded-lg bg-primary object-cover" />}
                <div className="flex items-center gap-3">
                    <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-error-solid" aria-hidden="true" />
                    <span className="text-sm font-semibold text-primary tabular-nums">{mmss(elapsed)}</span>
                    <span className="text-xs text-tertiary">of {mmss(MAX_SECONDS[recording])} max</span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={cancel}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={stop}
                            className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
                        >
                            Stop & save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Uploading ── */
    if (busy) {
        return (
            <div className="mt-5 flex max-w-xl items-center gap-3 rounded-xl bg-secondary p-4 text-sm text-tertiary">
                <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
                Saving your recording…
            </div>
        );
    }

    /* ── Saved recording ── */
    if (path) {
        return (
            <div className="mt-5 flex max-w-xl flex-col gap-3 rounded-xl bg-secondary p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-secondary">
                    {kind === "video" ? <VideoRecorder className="size-4 text-fg-quaternary" aria-hidden="true" /> : <Microphone01 className="size-4 text-fg-quaternary" aria-hidden="true" />}
                    {kind === "video" ? "Video answer saved" : "Voice answer saved"}
                    <div className="ml-auto flex items-center gap-1">
                        {/* Re-record keeps the existing take until the new one has uploaded
                            (upload() removes the previous file only on success), so there is
                            never a moment where the host has deleted a good answer and has
                            nothing to replace it with. */}
                        <button
                            type="button"
                            onClick={() => start(kind === "video" ? "video" : "audio")}
                            title="Record a new take — your current one stays until the new one saves"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-primary"
                        >
                            <RefreshCw01 className="size-3.5" aria-hidden="true" />
                            Record again
                        </button>
                        <button
                            type="button"
                            onClick={remove}
                            title="Delete this recording"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-error-primary"
                        >
                            <Trash01 className="size-3.5" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                </div>
                {playbackUrl ? (
                    <RecordingPlayer
                        src={playbackUrl}
                        kind={kind}
                        className={kind === "video" ? "aspect-video w-full rounded-lg bg-primary" : "w-full"}
                    />
                ) : (
                    <p className="text-xs text-quaternary">Loading your recording…</p>
                )}
                {error && <p className="text-sm text-error-primary">{error}</p>}
            </div>
        );
    }

    /* ── Idle ── */
    return (
        <div className="mt-5 flex max-w-xl flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-tertiary">Prefer to talk it through?</span>
                <button
                    type="button"
                    onClick={() => start("audio")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                >
                    <Microphone01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                    Record voice
                </button>
                <button
                    type="button"
                    onClick={() => start("video")}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                >
                    <VideoRecorder className="size-4 text-fg-quaternary" aria-hidden="true" />
                    Record video
                </button>
            </div>
            {error && (
                <p className="flex items-start gap-1.5 text-sm text-error-primary">
                    <XClose className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
};
