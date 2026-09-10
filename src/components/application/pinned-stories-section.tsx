import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Image03,
    LinkExternal01,
    MessageChatCircle,
    Plus,
    Star01,
    Trash01,
    XClose,
} from "@untitledui/icons";
import { FileUploadDropZone } from "@/components/application/file-upload/file-upload-base";
import { PROFILE, StoryPlayer, type StoryPosition } from "@/components/application/story-player";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { PhoneFrame } from "@/components/shared-assets/phone-frame";
import { supabase } from "@/lib/supabase";
import { type PinnedPost, parseCanvaUrl, uid } from "@/pages/client/dashboard/dashboard-model";
import { type PinnedProfileInputs, buildProfile } from "@/pages/client/dashboard/pinned-posts";
import {
    EMPTY_PINNED_STORIES,
    EMPTY_REVIEW,
    type PinnedStoriesData,
    type StoryComment,
    type StoryDraft,
    type StoryHighlight,
    type StoryReview,
    type StorySlide,
    type StoryVersion,
    canvaEditUrl,
    coverOf,
    draftFromPages,
    draftPublishable,
    emptyHighlight,
    mergePinnedStories,
    sampleDraft,
    totalSlides,
} from "@/pages/client/dashboard/pinned-stories-model";
import { compressImageFile } from "@/utils/compress-image";
import { cx } from "@/utils/cx";

/**
 * Marketing → Pinned Stories.
 *
 * The workflow, end to end:
 *   1. The AM pastes the Canva link (or uploads the pages Canva exports). The pages land
 *      in the `stories` bucket and become a DRAFT only the team sees.
 *   2. The AM arranges the pages into highlights — which page is a cover, what each circle
 *      is called, what order the slides play in — watching the phone update as they go.
 *   3. Publish. The set becomes the live version; the client's dashboard now plays it in
 *      the same phone, and they leave notes on individual slides or approve the lot.
 *   4. Notes come back here as a list the AM works through; a new import + publish sends
 *      v2 back for review while v1's notes stay on v1.
 *
 * Persistence: pinned_stories (see the 20260910180000 migration). Team writes go straight
 * to Supabase under the team-only policy; the client's notes/approval go through
 * pinned-stories-review.mts, the same shape as the landing page and suggestion flows. The
 * Canva half goes through canva-import.mts.
 */

const REVIEW_ENDPOINT = "/.netlify/functions/pinned-stories-review";
const IMPORT_ENDPOINT = "/.netlify/functions/canva-import";
const STORE_BATCH = 5;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // keep in sync with the bucket's file_size_limit

const shortDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const inputCls =
    "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

/** A thumbnail of one slide — image or the first frame of a video. */
const SlideThumb = ({ slide, className }: { slide: StorySlide; className?: string }) =>
    slide.kind === "video" ? (
        <video src={slide.url} muted playsInline preload="metadata" className={cx("pointer-events-none size-full object-cover", className)} />
    ) : (
        <img src={slide.url} alt="" className={cx("size-full object-cover", className)} draggable={false} />
    );

const REVIEW_BADGE: Record<StoryReview["status"], { color: "warning" | "success" | "gray"; text: string }> = {
    pending: { color: "warning", text: "Awaiting review" },
    approved: { color: "success", text: "Approved" },
    changes: { color: "gray", text: "Notes from the client" },
};

export const PinnedStoriesSection = ({
    slug,
    clientName,
    profile,
    pinnedPosts,
    isTeam,
    isLocked,
    isTemplate,
    teamName,
    clientEmail,
}: {
    slug?: string;
    clientName: string;
    /** The Instagram account the phone shows — the same inputs Pinned Posts renders, so both mockups agree. */
    profile: PinnedProfileInputs;
    /** The published pinned carousels, so the profile's grid matches the Pinned Posts section next door. */
    pinnedPosts: PinnedPost[];
    isTeam: boolean;
    isLocked: boolean;
    isTemplate: boolean;
    /** Signed-in AM's display name — attributed on imports and publishes. */
    teamName: string;
    /** The client's own identity email; empty for team / an anonymous unlock, which hides the review controls. */
    clientEmail: string;
}) => {
    const [data, setData] = useState<PinnedStoriesData>(EMPTY_PINNED_STORIES);
    const [position, setPosition] = useState<StoryPosition>(PROFILE);
    /** Which set the phone plays for the team. Clients only ever see "live". */
    const [view, setView] = useState<"live" | "draft">("live");

    const [canvaLink, setCanvaLink] = useState("");
    const [importing, setImporting] = useState<string | null>(null);
    const [importErr, setImportErr] = useState("");
    const [canvaOffline, setCanvaOffline] = useState(false);
    const [showImport, setShowImport] = useState(false);

    const [publishing, setPublishing] = useState(false);
    const [saveErr, setSaveErr] = useState("");

    const [noteFor, setNoteFor] = useState<{ highlightId: string; slideId: string } | null>(null);
    const [noteText, setNoteText] = useState("");
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewErr, setReviewErr] = useState("");

    const canEdit = isTeam && !isLocked && !isTemplate;

    /* ── Load ── */
    useEffect(() => {
        if (isTemplate) {
            // The shared template shows the sample as though it were live, so the section
            // can be demonstrated without a client row and without writing anything.
            const d = sampleDraft("HiddenGem");
            setData({
                draft: null,
                versions: [
                    {
                        id: "sample",
                        highlights: d.highlights,
                        source: d.source,
                        publishedAt: new Date().toISOString(),
                        publishedBy: "HiddenGem",
                        review: EMPTY_REVIEW,
                    },
                ],
            });
            return;
        }
        if (!slug) return;
        supabase
            .from("pinned_stories")
            .select("data")
            .eq("slug", slug)
            .maybeSingle()
            .then(({ data: row, error }) => {
                if (error) return;
                const merged = mergePinnedStories(row?.data as Partial<PinnedStoriesData> | null);
                setData(merged);
                if (merged.draft && !merged.versions.length) setView("draft");
            });
    }, [slug, isTemplate]);

    const live = data.versions[0];
    const draft = data.draft;
    const shownHighlights = isTeam && view === "draft" && draft ? draft.highlights : (live?.highlights ?? []);
    const review = live?.review ?? EMPTY_REVIEW;
    /* The same account Pinned Posts renders (its carousels in the grid), with the tray swapped
       for whichever story set the phone is playing — the player does that swap itself. */
    const igProfile = buildProfile(profile, pinnedPosts);
    const tagOf = (i: number) => `v${data.versions.length - i}`;

    // Keep the phone on a highlight that exists in whichever set is showing.
    useEffect(() => {
        if (position.highlightId && !shownHighlights.some((h) => h.id === position.highlightId)) setPosition(PROFILE);
    }, [shownHighlights, position.highlightId]);

    /* ── Team persistence ── */
    const persist = useCallback(
        async (next: PinnedStoriesData) => {
            setData(next);
            if (!slug || isTemplate) return true;
            setSaveErr("");
            const { error } = await supabase
                .from("pinned_stories")
                .upsert({ slug, client_name: clientName, data: next, updated_at: new Date().toISOString() }, { onConflict: "slug" });
            if (error) setSaveErr("Couldn't save — check your connection and try again.");
            return !error;
        },
        [slug, isTemplate, clientName],
    );

    const setDraft = (fn: (d: StoryDraft) => StoryDraft) => {
        if (!draft) return;
        void persist({ ...data, draft: fn(draft) });
    };

    const publish = async () => {
        if (!draft || !draftPublishable(draft)) return;
        setPublishing(true);
        const version: StoryVersion = {
            id: uid(),
            highlights: draft.highlights.filter((h) => h.slides.length > 0),
            source: draft.source,
            publishedAt: new Date().toISOString(),
            publishedBy: teamName,
            review: EMPTY_REVIEW,
        };
        const ok = await persist({ draft: null, versions: [version, ...data.versions] });
        setPublishing(false);
        if (ok) {
            setView("live");
            setPosition(PROFILE);
        }
    };

    const discardDraft = () => void persist({ ...data, draft: null }).then(() => setView("live"));

    /** Start a draft from the live set, so titles and order can change without a re-import. */
    const editLive = () => {
        if (!live) return;
        void persist({
            ...data,
            draft: {
                highlights: live.highlights.map((h) => ({ ...h, id: uid(), slides: h.slides.map((s) => ({ ...s })) })),
                unassigned: [],
                source: live.source,
            },
        });
        setView("draft");
        setPosition(PROFILE);
    };

    const startDraftWith = (pages: StorySlide[], source: StoryDraft["source"]) => {
        // A second import while a draft is open adds to it (that's how a video page joins an
        // image set) rather than throwing the AM's arrangement away.
        const next: StoryDraft = draft ? { ...draft, unassigned: [...draft.unassigned, ...pages], source: draft.source } : draftFromPages(pages, source);
        void persist({ ...data, draft: next });
        setView("draft");
        setPosition(PROFILE);
        setShowImport(false);
    };

    /* ── Import: Canva ── */
    const importFromCanva = async () => {
        const designId = parseCanvaUrl(canvaLink)?.id ?? null;
        setImportErr("");
        if (!designId) {
            setImportErr(
                /canva\.com\/d\/|canva\.link\//.test(canvaLink)
                    ? "That's a Canva shortlink. In Canva use Share → Copy link, which gives the full canva.com/design/… address."
                    : "Paste the design's link from Canva — it looks like canva.com/design/D…/…/edit.",
            );
            return;
        }
        if (!slug) return;
        setImporting("Checking the design…");
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) throw new Error("Your sign-in has expired — reload and sign in again.");
            const call = async (body: Record<string, unknown>) => {
                const res = await fetch(IMPORT_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body),
                });
                const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                if (res.status === 501 && json.code === "canva_not_configured") {
                    setCanvaOffline(true);
                    throw new Error(String(json.error));
                }
                if (!res.ok) throw new Error(String(json.error ?? "Something went wrong."));
                return json;
            };

            const started = (await call({ action: "start", designId })) as { jobId: string; title: string; status?: string; urls?: string[] };
            let urls = started.status === "success" && started.urls ? started.urls : null;
            for (let attempt = 0; !urls && attempt < 40; attempt++) {
                setImporting(`Exporting from Canva… (${attempt + 1})`);
                await new Promise((r) => setTimeout(r, 1500));
                const st = (await call({ action: "status", jobId: started.jobId })) as { status?: string; urls?: string[] };
                if (st.status === "success" && st.urls) urls = st.urls;
            }
            if (!urls) throw new Error("Canva is taking too long — try again in a minute.");

            const batchId = `${Date.now()}`;
            const pages: StorySlide[] = [];
            for (let i = 0; i < urls.length; i += STORE_BATCH) {
                setImporting(`Saving pages ${Math.min(i + STORE_BATCH, urls.length)} of ${urls.length}…`);
                const stored = (await call({ action: "store", slug, designId, urls: urls.slice(i, i + STORE_BATCH), firstPage: i + 1, batchId })) as {
                    pages: { page: number; url: string }[];
                };
                pages.push(...stored.pages.map((p) => ({ id: uid(), kind: "image" as const, url: p.url, page: p.page })));
            }
            startDraftWith(pages, {
                via: "canva",
                canvaUrl: canvaLink.trim(),
                designId,
                designTitle: started.title,
                importedAt: new Date().toISOString(),
                importedBy: teamName,
            });
            setCanvaLink("");
        } catch (e) {
            setImportErr(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setImporting(null);
        }
    };

    /* ── Import: the AM uploads Canva's exported pages ── */
    const uploadPages = async (list: FileList) => {
        if (!slug) return;
        // Canva names exports "…-01.jpg", "…-02.jpg", so filename order is page order.
        const files = Array.from(list).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        setImportErr("");
        setImporting(`Uploading 1 of ${files.length}…`);
        try {
            const folder = `${slug}/upload/${Date.now()}`;
            const startPage = (draft?.unassigned.length ?? 0) + totalSlides(draft?.highlights ?? []);
            const pages: StorySlide[] = [];
            for (let i = 0; i < files.length; i++) {
                setImporting(`Uploading ${i + 1} of ${files.length}…`);
                const f = files[i];
                const isVideo = f.type.startsWith("video/");
                if (isVideo && f.size > MAX_VIDEO_BYTES) throw new Error(`${f.name} is over 50 MB — export the story video at 1080p.`);
                let blob: Blob = f;
                let ext = f.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
                if (!isVideo) {
                    // The house rule: every uploaded image is compressed to WebP first.
                    blob = await dataUrlToBlob(await compressImageFile(f));
                    ext = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
                }
                const path = `${folder}/page-${String(startPage + i + 1).padStart(2, "0")}.${ext}`;
                const { error } = await supabase.storage.from("stories").upload(path, blob, { contentType: blob.type || f.type, cacheControl: "31536000" });
                if (error) throw new Error(`Couldn't upload ${f.name}.`);
                pages.push({
                    id: uid(),
                    kind: isVideo ? "video" : "image",
                    url: supabase.storage.from("stories").getPublicUrl(path).data.publicUrl,
                    page: startPage + i + 1,
                });
            }
            const designId = parseCanvaUrl(canvaLink)?.id ?? "";
            startDraftWith(pages, {
                via: "upload",
                canvaUrl: designId ? canvaLink.trim() : "",
                designId,
                designTitle: "",
                importedAt: new Date().toISOString(),
                importedBy: teamName,
            });
        } catch (e) {
            setImportErr(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setImporting(null);
        }
    };

    const loadSample = () => {
        void persist({ ...data, draft: sampleDraft(teamName) });
        setView("draft");
        setPosition(PROFILE);
        setShowImport(false);
    };

    /* ── Arranging the draft ── */
    const updateHighlight = (id: string, patch: Partial<StoryHighlight>) =>
        setDraft((d) => ({ ...d, highlights: d.highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
    const addHighlight = () => setDraft((d) => ({ ...d, highlights: [...d.highlights, emptyHighlight(d.highlights.length + 1)] }));
    const removeHighlight = (id: string) =>
        setDraft((d) => {
            const h = d.highlights.find((x) => x.id === id);
            return { ...d, highlights: d.highlights.filter((x) => x.id !== id), unassigned: [...d.unassigned, ...(h?.slides ?? [])] };
        });
    const moveSlide = (hId: string, index: number, dir: -1 | 1) =>
        updateHighlight(hId, {
            slides: (() => {
                const h = draft?.highlights.find((x) => x.id === hId);
                if (!h) return [];
                const s = [...h.slides];
                const j = index + dir;
                if (j < 0 || j >= s.length) return s;
                [s[index], s[j]] = [s[j], s[index]];
                return s;
            })(),
        });
    const unassignSlide = (hId: string, slideId: string) =>
        setDraft((d) => {
            const h = d.highlights.find((x) => x.id === hId);
            const s = h?.slides.find((x) => x.id === slideId);
            if (!h || !s) return d;
            return {
                ...d,
                highlights: d.highlights.map((x) => (x.id === hId ? { ...x, slides: x.slides.filter((y) => y.id !== slideId) } : x)),
                unassigned: [...d.unassigned, s],
            };
        });
    /** Use this slide's image as the circle, and take it out of the run — a cover isn't a story. */
    const makeCover = (hId: string, slideId: string) =>
        setDraft((d) => {
            const h = d.highlights.find((x) => x.id === hId);
            const s = h?.slides.find((x) => x.id === slideId);
            if (!h || !s || s.kind !== "image") return d;
            return { ...d, highlights: d.highlights.map((x) => (x.id === hId ? { ...x, cover: s.url, slides: x.slides.filter((y) => y.id !== slideId) } : x)) };
        });
    const assignSlide = (slideId: string, hId: string) =>
        setDraft((d) => {
            const s = d.unassigned.find((x) => x.id === slideId);
            if (!s) return d;
            return {
                ...d,
                unassigned: d.unassigned.filter((x) => x.id !== slideId),
                highlights: d.highlights.map((h) => (h.id === hId ? { ...h, slides: [...h.slides, s] } : h)),
            };
        });
    const newHighlightFromCover = (slideId: string) =>
        setDraft((d) => {
            const s = d.unassigned.find((x) => x.id === slideId);
            if (!s) return d;
            return {
                ...d,
                unassigned: d.unassigned.filter((x) => x.id !== slideId),
                highlights: [...d.highlights, { ...emptyHighlight(d.highlights.length + 1), cover: s.kind === "image" ? s.url : "" }],
            };
        });
    const deleteUnassigned = (slideId: string) => setDraft((d) => ({ ...d, unassigned: d.unassigned.filter((x) => x.id !== slideId) }));

    /* ── Review ── */
    const respond = async (body: Record<string, unknown>) => {
        if (!slug || !clientEmail) return;
        setReviewBusy(true);
        setReviewErr("");
        try {
            const res = await fetch(REVIEW_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...body, slug, email: clientEmail }),
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string; review?: StoryReview };
            if (!res.ok || !json.review) {
                setReviewErr(json.error || "Something went wrong — try again.");
                return;
            }
            setData((d) => ({ ...d, versions: d.versions.map((v, i) => (i === 0 ? { ...v, review: json.review! } : v)) }));
            setNoteFor(null);
            setNoteText("");
        } catch {
            setReviewErr("Something went wrong — try again.");
        } finally {
            setReviewBusy(false);
        }
    };

    const toggleResolved = (c: StoryComment) => {
        if (!live) return;
        const next = { ...live, review: { ...review, comments: review.comments.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)) } };
        void persist({ ...data, versions: [next, ...data.versions.slice(1)] });
    };

    const commentCountFor = (slideId: string) => (view === "live" || !isTeam ? review.comments.filter((c) => c.slideId === slideId).length : 0);

    /** "Slide 3 of 6 · FAQ" for a note, from the live set. */
    const describe = (c: { highlightId: string; slideId: string }) => {
        const h = live?.highlights.find((x) => x.id === c.highlightId);
        const i = h?.slides.findIndex((s) => s.id === c.slideId) ?? -1;
        if (!h || i < 0) return { label: "Whole set", slide: null as StorySlide | null };
        return { label: `Slide ${i + 1} of ${h.slides.length} · ${h.title || "Untitled"}`, slide: h.slides[i] };
    };

    const jumpTo = (c: { highlightId: string; slideId: string }) => {
        const h = live?.highlights.find((x) => x.id === c.highlightId);
        const i = h?.slides.findIndex((s) => s.id === c.slideId) ?? -1;
        if (h && i >= 0) {
            setView("live");
            setPosition({ highlightId: h.id, slide: i });
        }
    };

    const openNote = (highlightId: string, slideId: string) => {
        if (isTeam) return;
        setNoteFor({ highlightId, slideId });
    };

    /* ── Copy ── */
    const subtitle = isTeam
        ? "Paste the Canva link, arrange the pages into highlights, publish. The client plays them in this phone and leaves notes slide by slide."
        : live
          ? "The highlights that will sit at the top of your Instagram profile. Tap a circle to play it, then tell us what to change or approve the set."
          : "The story highlights pinned to the top of your Instagram profile.";

    const rv = REVIEW_BADGE[review.status];
    const nothingYet = !live && !draft;
    const hasSomething = shownHighlights.length > 0;
    const notePos = noteFor ? describe(noteFor) : null;

    return (
        <div>
            <div>
                <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Pinned Stories</h2>
                <p className="mt-1.5 max-w-2xl text-md text-pretty text-tertiary">{subtitle}</p>
            </div>

            {/* ── Client, nothing published yet ── */}
            {!isTeam && !live && (
                <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-primary px-8 py-16 text-center ring-1 ring-secondary">
                    <FeaturedIcon icon={Image03} color="gray" theme="light" size="lg" className="mb-2" />
                    <p className="text-md font-semibold text-primary">Your story highlights are on their way</p>
                    <p className="max-w-md text-sm text-pretty text-tertiary">
                        We're designing them from your Master Brand and Brand Kit. Once they're ready you'll play them right here, exactly as they'll look on
                        your profile, and tell us anything you'd like changed.
                    </p>
                </div>
            )}

            {/* ── Team: import panel (first import, or a new version) ── */}
            {isTeam && (nothingYet || showImport) && (
                <div className="mt-6 flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                    <div className="flex items-start justify-between gap-4 border-b border-secondary px-6 py-5">
                        <div>
                            <p className="text-md font-semibold text-primary">{draft ? "Add pages to the draft" : "Import the story highlights"}</p>
                            <p className="mt-0.5 text-sm text-pretty text-tertiary">
                                Paste the Canva design link and the portal pulls every page in. If Canva isn't connected, export the pages from Canva (Share →
                                Download → JPG) and drop them here instead — same result.
                            </p>
                        </div>
                        {!draft && !live && (
                            <Badge color="gray" size="md" type="pill-color">
                                Not published
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 px-6 py-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-secondary" htmlFor="canva-link">
                                Canva link
                            </label>
                            <div className="flex flex-wrap gap-3">
                                <input
                                    id="canva-link"
                                    value={canvaLink}
                                    onChange={(e) => setCanvaLink(e.target.value)}
                                    disabled={!canEdit || !!importing}
                                    placeholder="https://www.canva.com/design/DAHSwF8HKF8/…/edit"
                                    className={cx(inputCls, "min-w-60 flex-1 font-mono text-xs")}
                                    spellCheck={false}
                                />
                                <Button
                                    size="md"
                                    isDisabled={!canEdit || !canvaLink.trim() || canvaOffline}
                                    isLoading={!!importing}
                                    showTextWhileLoading
                                    onClick={() => void importFromCanva()}
                                >
                                    {importing ?? "Import from Canva"}
                                </Button>
                            </div>
                            {canvaOffline && (
                                <p className="text-xs text-quaternary">
                                    The link is kept with the import so the team can open the design later — the pages themselves come from the upload below.
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-medium text-quaternary uppercase">
                            <span className="h-px flex-1 bg-border-secondary" />
                            or upload the exported pages
                            <span className="h-px flex-1 bg-border-secondary" />
                        </div>

                        <FileUploadDropZone
                            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                            allowsMultiple
                            isDisabled={!canEdit || !!importing}
                            hint="JPG or PNG per page, MP4 for video pages · named in page order · videos under 50 MB"
                            onDropFiles={(files) => void uploadPages(files)}
                        />

                        {importErr && (
                            <div role="alert" className="flex items-start gap-3 rounded-xl bg-error-primary p-3.5 ring-1 ring-error_subtle">
                                <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                                <p className="text-sm text-primary">{importErr}</p>
                            </div>
                        )}
                        {saveErr && <p className="text-sm text-error-primary">{saveErr}</p>}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {!draft && !isTemplate ? (
                                <Button color="link-color" size="sm" isDisabled={!canEdit} onClick={loadSample}>
                                    Load the North Star sample to see the section working
                                </Button>
                            ) : (
                                <span />
                            )}
                            {showImport && (
                                <Button color="tertiary" size="sm" onClick={() => setShowImport(false)}>
                                    Close
                                </Button>
                            )}
                        </div>
                        {isLocked && !isTemplate && <p className="text-xs text-quaternary">Unlock the dashboard to import and publish.</p>}
                    </div>
                </div>
            )}

            {/* ── The phone + its side panel ── */}
            {(live || (isTeam && draft)) && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
                    {/* Phone */}
                    <div className="flex flex-col items-center gap-4">
                        {isTeam && live && draft && (
                            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                                {(["live", "draft"] as const).map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => {
                                            setView(v);
                                            setPosition(PROFILE);
                                        }}
                                        className={cx(
                                            "rounded-md px-3 py-1.5 text-xs font-semibold transition duration-100 ease-linear",
                                            view === v ? "bg-primary text-primary shadow-xs ring-1 ring-secondary" : "text-tertiary hover:text-primary",
                                        )}
                                    >
                                        {v === "live" ? `Live · ${tagOf(0)}` : "Draft"}
                                    </button>
                                ))}
                            </div>
                        )}
                        <PhoneFrame label="Pinned stories" className="w-[248px] sm:w-[280px]">
                            <StoryPlayer
                                highlights={shownHighlights}
                                position={position}
                                onPosition={setPosition}
                                profile={igProfile}
                                onReply={!isTeam && live && review.status !== "approved" && clientEmail ? openNote : undefined}
                                replyLabel="Leave a note on this slide"
                                commentCountFor={commentCountFor}
                            />
                        </PhoneFrame>
                        <p className="max-w-[300px] text-center text-xs text-pretty text-quaternary">
                            {position.highlightId
                                ? "Tap the right side to go forward, the left to go back. Hold to pause."
                                : "Tap a highlight circle to play it."}
                        </p>
                    </div>

                    {/* Side panel */}
                    <div className="flex min-w-0 flex-col gap-6">
                        {/* Team: state strip */}
                        {isTeam && (
                            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-primary px-5 py-4 ring-1 ring-secondary">
                                {live ? (
                                    <>
                                        <BadgeWithDot color="success" size="sm" type="pill-color">
                                            Live
                                        </BadgeWithDot>
                                        <span className="text-sm text-tertiary">
                                            {tagOf(0)} · {live.highlights.length} highlight{live.highlights.length === 1 ? "" : "s"},{" "}
                                            {totalSlides(live.highlights)} slides · Published {shortDate(live.publishedAt)}
                                            {live.publishedBy ? ` by ${live.publishedBy}` : ""}
                                        </span>
                                        <BadgeWithDot color={rv.color} size="sm" type="pill-color">
                                            {rv.text}
                                        </BadgeWithDot>
                                    </>
                                ) : (
                                    <>
                                        <Badge color="gray" size="sm" type="pill-color">
                                            Draft
                                        </Badge>
                                        <span className="text-sm text-tertiary">Not shown to the client until you publish.</span>
                                    </>
                                )}
                                <div className="ml-auto flex flex-wrap gap-2">
                                    {(view === "draft" ? draft?.source : live?.source)?.designId && (
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={LinkExternal01}
                                            href={canvaEditUrl((view === "draft" ? draft?.source : live?.source)!.designId)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open in Canva
                                        </Button>
                                    )}
                                    {canEdit && live && !draft && (
                                        <>
                                            <Button color="secondary" size="sm" onClick={editLive}>
                                                Make changes
                                            </Button>
                                            <Button color="secondary" size="sm" onClick={() => setShowImport(true)}>
                                                Import new version
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Team: arrange the draft */}
                        {isTeam && draft && view === "draft" && (
                            <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-5 py-4">
                                    <div>
                                        <p className="text-md font-semibold text-primary">Arrange the highlights</p>
                                        <p className="text-sm text-pretty text-tertiary">
                                            Name each circle, pick its cover, and order the slides. Canva story files usually run cover, slides, cover, slides.
                                        </p>
                                    </div>
                                    {canEdit && (
                                        <Button color="secondary" size="sm" iconLeading={Plus} onClick={addHighlight}>
                                            Add highlight
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-col divide-y divide-border-secondary">
                                    {draft.highlights.map((h, hi) => (
                                        <div key={h.id} className="flex flex-col gap-3 px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => h.slides.length && setPosition({ highlightId: h.id, slide: 0 })}
                                                    className="flex size-12 shrink-0 items-center justify-center rounded-full ring-1 ring-primary ring-offset-2 ring-offset-bg-primary"
                                                    aria-label={`Play ${h.title}`}
                                                >
                                                    <span className="size-11 overflow-hidden rounded-full bg-secondary">
                                                        {coverOf(h) && <img src={coverOf(h)} alt="" className="size-full object-cover" />}
                                                    </span>
                                                </button>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    {canEdit ? (
                                                        <input
                                                            value={h.title}
                                                            onChange={(e) => updateHighlight(h.id, { title: e.target.value })}
                                                            placeholder={`Highlight ${hi + 1}`}
                                                            aria-label="Highlight name"
                                                            maxLength={24}
                                                            className={cx(inputCls, "max-w-60 py-1.5 font-semibold")}
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-semibold text-primary">{h.title}</p>
                                                    )}
                                                    <p className="text-xs text-quaternary">
                                                        {h.slides.length} slide{h.slides.length === 1 ? "" : "s"}
                                                        {!h.cover &&
                                                            h.slides.length > 0 &&
                                                            " · cover: first slide (hover a slide and press the star to choose one)"}
                                                        {h.slides.length === 0 && " · empty highlights aren't published"}
                                                    </p>
                                                </div>
                                                {canEdit && (
                                                    <Button
                                                        color="tertiary"
                                                        size="sm"
                                                        iconLeading={Trash01}
                                                        onClick={() => removeHighlight(h.id)}
                                                        aria-label="Remove highlight"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                {h.slides.map((s, si) => {
                                                    const active = position.highlightId === h.id && position.slide === si;
                                                    return (
                                                        <div key={s.id} className="group relative w-[62px] shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPosition({ highlightId: h.id, slide: si })}
                                                                className={cx(
                                                                    "block aspect-9/16 w-full overflow-hidden rounded-lg bg-secondary ring-1 transition duration-100 ease-linear",
                                                                    active ? "ring-2 ring-brand" : "ring-secondary hover:ring-primary",
                                                                )}
                                                                aria-label={`Slide ${si + 1}`}
                                                            >
                                                                <SlideThumb slide={s} />
                                                            </button>
                                                            <span className="pointer-events-none absolute top-1 left-1 rounded bg-primary-solid/70 px-1 text-[10px] font-semibold text-white tabular-nums">
                                                                {si + 1}
                                                            </span>
                                                            {canEdit && (
                                                                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 rounded-b-lg bg-primary-solid/70 py-0.5 opacity-0 transition duration-100 ease-linear group-focus-within:opacity-100 group-hover:opacity-100">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveSlide(h.id, si, -1)}
                                                                        className="rounded p-0.5 text-white hover:bg-white/20"
                                                                        aria-label="Move earlier"
                                                                    >
                                                                        <ChevronLeft className="size-3.5" />
                                                                    </button>
                                                                    {s.kind === "image" && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => makeCover(h.id, s.id)}
                                                                            className="rounded p-0.5 text-white hover:bg-white/20"
                                                                            aria-label="Use as cover"
                                                                        >
                                                                            <Star01 className="size-3.5" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => unassignSlide(h.id, s.id)}
                                                                        className="rounded p-0.5 text-white hover:bg-white/20"
                                                                        aria-label="Remove from highlight"
                                                                    >
                                                                        <XClose className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveSlide(h.id, si, 1)}
                                                                        className="rounded p-0.5 text-white hover:bg-white/20"
                                                                        aria-label="Move later"
                                                                    >
                                                                        <ChevronRight className="size-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {h.slides.length === 0 && (
                                                    <p className="py-3 text-xs text-quaternary">Add slides from the unplaced pages below.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pages not yet in a highlight */}
                                {draft.unassigned.length > 0 && (
                                    <div className="flex flex-col gap-3 border-t border-secondary bg-secondary px-5 py-4">
                                        <p className="text-sm font-semibold text-primary">
                                            Unplaced pages <span className="font-normal text-quaternary">· {draft.unassigned.length}</span>
                                        </p>
                                        <div className="flex gap-3 overflow-x-auto pb-1">
                                            {draft.unassigned.map((s) => (
                                                <div key={s.id} className="flex w-[92px] shrink-0 flex-col gap-1.5">
                                                    <div className="relative aspect-9/16 overflow-hidden rounded-lg bg-primary ring-1 ring-secondary">
                                                        <SlideThumb slide={s} />
                                                        <span className="absolute top-1 left-1 rounded bg-primary-solid/70 px-1 text-[10px] font-semibold text-white tabular-nums">
                                                            p{s.page}
                                                        </span>
                                                    </div>
                                                    {canEdit && (
                                                        <>
                                                            <select
                                                                aria-label="Add to highlight"
                                                                value=""
                                                                onChange={(e) => {
                                                                    if (e.target.value === "__new") newHighlightFromCover(s.id);
                                                                    else if (e.target.value) assignSlide(s.id, e.target.value);
                                                                }}
                                                                className={cx(inputCls, "px-1.5 py-1 text-xs")}
                                                            >
                                                                <option value="">Add to…</option>
                                                                {draft.highlights.map((h) => (
                                                                    <option key={h.id} value={h.id}>
                                                                        {h.title || "Untitled"}
                                                                    </option>
                                                                ))}
                                                                {s.kind === "image" && <option value="__new">New highlight (as cover)</option>}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteUnassigned(s.id)}
                                                                className="text-xs text-quaternary transition duration-100 ease-linear hover:text-error-primary"
                                                            >
                                                                Discard
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {canEdit && (
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-5 py-4">
                                        <p className="text-sm text-quaternary">
                                            {draft.source.via === "canva" &&
                                                `Imported from Canva${draft.source.designTitle ? ` · ${draft.source.designTitle}` : ""} · ${shortDate(draft.source.importedAt)}`}
                                            {draft.source.via === "upload" && `Uploaded ${shortDate(draft.source.importedAt)}`}
                                            {draft.source.via === "sample" &&
                                                "North Star sample — replace it with the client's own design before publishing to a real client."}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button color="secondary" size="md" onClick={() => setShowImport(true)}>
                                                Add pages
                                            </Button>
                                            <Button color="tertiary" size="md" onClick={discardDraft}>
                                                Discard draft
                                            </Button>
                                            <Button
                                                size="md"
                                                isDisabled={!draftPublishable(draft)}
                                                isLoading={publishing}
                                                showTextWhileLoading
                                                onClick={() => void publish()}
                                            >
                                                {publishing ? "Publishing…" : live ? `Publish as ${tagOf(-1)}` : "Publish to client"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {saveErr && <p className="px-5 pb-4 text-sm text-error-primary">{saveErr}</p>}
                            </div>
                        )}

                        {/* Team: the live set's highlights, read-only, and the client's notes */}
                        {isTeam && live && view === "live" && (
                            <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                                <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-4">
                                    <p className="text-md font-semibold text-primary">Client notes</p>
                                    <span className="text-sm text-quaternary">
                                        {review.comments.length} note{review.comments.length === 1 ? "" : "s"} on {tagOf(0)}
                                    </span>
                                </div>
                                <div className="px-5 py-4">
                                    <p className="text-sm text-pretty text-tertiary">
                                        {review.status === "pending" &&
                                            "The client hasn't responded yet. They'll see a note bar on every slide and an Approve button under the phone."}
                                        {review.status === "approved" &&
                                            `${review.respondedBy ?? "The client"} approved ${tagOf(0)}${review.respondedAt ? ` on ${shortDate(review.respondedAt)}` : ""}. Pin these to the profile.`}
                                        {review.status === "changes" &&
                                            "Work through the notes, tick each as you handle it, then import or arrange a new version and publish it back for review."}
                                    </p>
                                </div>
                                {review.comments.length > 0 && (
                                    <ul className="flex flex-col divide-y divide-border-secondary border-t border-secondary">
                                        {review.comments.map((c) => {
                                            const d = describe(c);
                                            return (
                                                <li key={c.id} className={cx("flex gap-3 px-5 py-3", c.resolved && "opacity-60")}>
                                                    <button
                                                        type="button"
                                                        onClick={() => jumpTo(c)}
                                                        className="aspect-9/16 w-9 shrink-0 overflow-hidden rounded-md bg-secondary ring-1 ring-secondary"
                                                        aria-label="Show this slide"
                                                    >
                                                        {d.slide ? (
                                                            <SlideThumb slide={d.slide} />
                                                        ) : (
                                                            <Image03 className="m-auto mt-3 size-4 text-fg-quaternary" />
                                                        )}
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-tertiary">{d.label}</p>
                                                        <p className={cx("mt-0.5 text-sm text-pretty text-primary", c.resolved && "line-through")}>{c.text}</p>
                                                        <p className="mt-0.5 text-xs text-quaternary">
                                                            {c.by} · {shortDate(c.at)}
                                                        </p>
                                                    </div>
                                                    {canEdit && (
                                                        <Button
                                                            color={c.resolved ? "tertiary" : "secondary"}
                                                            size="sm"
                                                            iconLeading={c.resolved ? undefined : Check}
                                                            onClick={() => toggleResolved(c)}
                                                        >
                                                            {c.resolved ? "Reopen" : "Done"}
                                                        </Button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Team: versions */}
                        {isTeam && data.versions.length > 1 && (
                            <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                                    <p className="text-md font-semibold text-primary">Versions</p>
                                    <span className="text-sm text-quaternary">{data.versions.length} versions</span>
                                </div>
                                {data.versions.map((v, i) => (
                                    <div key={v.id} className="flex items-center gap-3 border-b border-secondary px-5 py-3 last:border-b-0">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-medium text-tertiary">
                                            {tagOf(i)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-primary">
                                                {v.highlights.length} highlights · {totalSlides(v.highlights)} slides
                                            </p>
                                            <p className="text-sm text-quaternary">
                                                {shortDate(v.publishedAt)}
                                                {v.publishedBy ? ` · ${v.publishedBy}` : ""} · {REVIEW_BADGE[v.review.status].text}
                                                {v.review.comments.length ? ` · ${v.review.comments.length} notes` : ""}
                                            </p>
                                        </div>
                                        {i === 0 && (
                                            <BadgeWithDot color="success" size="sm" type="pill-color">
                                                Live
                                            </BadgeWithDot>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Client: review */}
                        {!isTeam && live && (
                            <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                                {review.status !== "approved" ? (
                                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                                        <div className="min-w-60 flex-1">
                                            <p className="text-md font-semibold text-primary">Do these look right to you?</p>
                                            <p className="text-sm text-pretty text-tertiary">
                                                Play each highlight. To change something, tap “Leave a note on this slide” while it's on screen. Happy with all
                                                of it? Approve, and we'll pin them to your profile.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                color="secondary"
                                                size="md"
                                                iconLeading={MessageChatCircle}
                                                isDisabled={!clientEmail || reviewBusy}
                                                onClick={() =>
                                                    setNoteFor({
                                                        highlightId: position.highlightId ?? "",
                                                        slideId: position.highlightId
                                                            ? (shownHighlights.find((h) => h.id === position.highlightId)?.slides[position.slide]?.id ?? "")
                                                            : "",
                                                    })
                                                }
                                            >
                                                {position.highlightId ? "Note on this slide" : "General note"}
                                            </Button>
                                            <Button
                                                size="md"
                                                iconLeading={CheckCircle}
                                                isDisabled={!clientEmail}
                                                isLoading={reviewBusy && !noteFor}
                                                onClick={() => void respond({ action: "approve" })}
                                            >
                                                Approve all
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 px-6 py-5">
                                        <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden="true" />
                                        <div>
                                            <p className="text-sm font-semibold text-primary">Approved</p>
                                            <p className="text-sm text-tertiary">
                                                Thanks. Your Account Manager will pin these to your Instagram profile and let you know in Google Chat when
                                                they're up.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {noteFor && review.status !== "approved" && (
                                    <div className="flex flex-col gap-3 border-t border-secondary bg-secondary px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            {notePos?.slide && (
                                                <span className="aspect-9/16 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-secondary">
                                                    <SlideThumb slide={notePos.slide} />
                                                </span>
                                            )}
                                            <p className="text-sm font-semibold text-primary">{notePos?.label}</p>
                                        </div>
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            autoFocus
                                            placeholder="What would you like changed on this slide? Wording, a photo, colours — be as specific as you can."
                                            className={cx(inputCls, "min-h-[100px] resize-y")}
                                        />
                                        {reviewErr && <p className="text-sm text-error-primary">{reviewErr}</p>}
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                color="tertiary"
                                                size="md"
                                                onClick={() => {
                                                    setNoteFor(null);
                                                    setNoteText("");
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="md"
                                                isDisabled={!noteText.trim()}
                                                isLoading={reviewBusy}
                                                showTextWhileLoading
                                                onClick={() => void respond({ action: "comment", text: noteText.trim(), ...noteFor })}
                                            >
                                                Send to your team
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {reviewErr && !noteFor && <p className="px-6 pb-4 text-sm text-error-primary">{reviewErr}</p>}
                                {!clientEmail && review.status !== "approved" && (
                                    <p className="px-6 pb-5 text-sm text-quaternary">Sign in with your own email to leave notes or approve.</p>
                                )}

                                {review.comments.length > 0 && (
                                    <div className="border-t border-secondary">
                                        <p className="px-6 pt-4 text-sm font-semibold text-primary">Your notes</p>
                                        <ul className="flex flex-col divide-y divide-border-secondary">
                                            {review.comments.map((c) => {
                                                const d = describe(c);
                                                return (
                                                    <li key={c.id} className="flex gap-3 px-6 py-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => jumpTo(c)}
                                                            className="aspect-9/16 w-9 shrink-0 overflow-hidden rounded-md bg-secondary ring-1 ring-secondary"
                                                            aria-label="Show this slide"
                                                        >
                                                            {d.slide ? (
                                                                <SlideThumb slide={d.slide} />
                                                            ) : (
                                                                <Image03 className="m-auto mt-3 size-4 text-fg-quaternary" />
                                                            )}
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-tertiary">{d.label}</p>
                                                            <p className="mt-0.5 text-sm text-pretty text-primary">{c.text}</p>
                                                            <p className="mt-0.5 text-xs text-quaternary">
                                                                {shortDate(c.at)}
                                                                {c.resolved ? " · handled by your team" : " · with your team"}
                                                            </p>
                                                        </div>
                                                        {c.resolved && <Check className="mt-1 size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        <p className="px-6 py-4 text-sm text-quaternary">We'll publish an updated set here once your notes are in.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasSomething && isTeam && draft && view === "draft" && draft.highlights.length === 0 && draft.unassigned.length === 0 && (
                            <p className="text-sm text-quaternary">Nothing imported yet.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
