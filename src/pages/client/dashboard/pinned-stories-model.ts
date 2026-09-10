/**
 * Marketing → Pinned Stories — the pure model.
 *
 * The shapes stored in `pinned_stories.data`, the North Star sample the team can load to
 * see the section working before a client's own design exists, and the small helpers the
 * section and the Netlify functions share (Canva link parsing, arranging pages into
 * highlights). No JSX and no React, so a script can import it without pulling in the UI.
 *
 * Vocabulary, matching Instagram's: a HIGHLIGHT is one circle pinned to the profile, with
 * a COVER image and an ordered run of SLIDES. A Canva "Story Highlights" design is one
 * file holding several highlights, conventionally as [cover, slides…, cover, slides…], so
 * the AM's job after import is to say which page is which.
 */
import { uid } from "@/pages/client/dashboard/dashboard-model";

export interface StorySlide {
    id: string;
    kind: "image" | "video";
    /** Public URL — Supabase Storage, or a /public path for the sample. */
    url: string;
    /** 1-based page number in the source design, kept so the team can cross-reference Canva. */
    page: number;
}

export interface StoryHighlight {
    id: string;
    title: string;
    /** Cover image URL. Empty falls back to the first slide. */
    cover: string;
    slides: StorySlide[];
}

export interface StorySource {
    via: "canva" | "upload" | "sample";
    canvaUrl: string;
    designId: string;
    designTitle: string;
    importedAt: string;
    importedBy: string;
}

export interface StoryComment {
    id: string;
    /** Empty when the note is about the whole set rather than one slide. */
    highlightId: string;
    slideId: string;
    text: string;
    by: string;
    at: string;
    /** Ticked by the team once handled — stays visible so the client sees it was read. */
    resolved?: boolean;
}

export interface StoryReview {
    status: "pending" | "approved" | "changes";
    respondedAt?: string;
    respondedBy?: string;
    comments: StoryComment[];
}

export interface StoryVersion {
    id: string;
    highlights: StoryHighlight[];
    source: StorySource;
    publishedAt: string;
    publishedBy: string;
    /** Each version carries its own review, so feedback on v1 survives publishing v2. */
    review: StoryReview;
}

/** The team's working copy — imported but not yet shown to the client. */
export interface StoryDraft {
    highlights: StoryHighlight[];
    /** Imported pages not yet placed in a highlight. */
    unassigned: StorySlide[];
    source: StorySource;
}

export interface PinnedStoriesData {
    draft: StoryDraft | null;
    /** Newest first — versions[0] is what the client sees. */
    versions: StoryVersion[];
}

export const EMPTY_PINNED_STORIES: PinnedStoriesData = { draft: null, versions: [] };

export const EMPTY_REVIEW: StoryReview = { status: "pending", comments: [] };

/** Seconds an image slide stays up before the player advances — Instagram's own timing. */
export const IMAGE_SLIDE_SECONDS = 5;

/** Merge whatever an older row holds over the empty shape so no renderer meets undefined. */
export const mergePinnedStories = (partial?: Partial<PinnedStoriesData> | null): PinnedStoriesData => ({
    draft: partial?.draft ?? null,
    versions: Array.isArray(partial?.versions)
        ? partial.versions.map((v) => ({ ...v, review: { ...EMPTY_REVIEW, ...v.review, comments: v.review?.comments ?? [] } }))
        : [],
});

/* ── Canva links ─────────────────────────────────────────────────────────── */

/** Canva links are parsed by parseCanvaUrl in dashboard-model.ts — shared with Pinned Posts. */
export const canvaEditUrl = (designId: string) => `https://www.canva.com/design/${designId}/edit`;

/* ── Arranging pages ─────────────────────────────────────────────────────── */

/** A draft straight after import: one highlight holding every page, first page as cover. */
export const draftFromPages = (pages: StorySlide[], source: StorySource): StoryDraft => ({
    highlights: pages.length ? [{ id: uid(), title: source.designTitle || "Highlight 1", cover: "", slides: pages }] : [],
    unassigned: [],
    source,
});

export const emptyHighlight = (n: number): StoryHighlight => ({ id: uid(), title: `Highlight ${n}`, cover: "", slides: [] });

/** The image a highlight's circle shows — its cover, else its first slide. */
export const coverOf = (h: StoryHighlight): string => h.cover || h.slides.find((s) => s.kind === "image")?.url || h.slides[0]?.url || "";

/** Publishable = at least one highlight with at least one slide. */
export const draftPublishable = (d: StoryDraft | null): boolean => !!d && d.highlights.some((h) => h.slides.length > 0);

export const totalSlides = (highlights: StoryHighlight[]) => highlights.reduce((n, h) => n + h.slides.length, 0);

/* ── The sample ──────────────────────────────────────────────────────────── */

/**
 * North Star Lodge (Killington, VT), exported from the team's own Canva file
 * "North Star Story Highlights" (DAHSwF8HKF8) — the 20 pages live in
 * /public/pinned-stories-sample so the section can be shown working on any dashboard
 * before that client's design exists. Page numbers are the Canva page numbers; the file
 * follows the [cover, slides…] convention, which is why covers are pages 1, 3, 7, 9, 16.
 */
const samplePage = (n: number): StorySlide => ({
    id: `sample-${n}`,
    kind: "image",
    url: `/pinned-stories-sample/page-${String(n).padStart(2, "0")}.jpg`,
    page: n,
});

export const SAMPLE_CANVA_URL = "https://www.canva.com/design/DAHSwF8HKF8/AbLwOWABn26fc82W03Kfnw/edit";

export const sampleDraft = (importedBy: string): StoryDraft => ({
    highlights: [
        { id: "sample-location", title: "Location", cover: samplePage(1).url, slides: [samplePage(2)] },
        { id: "sample-welcome", title: "Welcome", cover: samplePage(3).url, slides: [samplePage(4), samplePage(5), samplePage(6)] },
        { id: "sample-newsletter", title: "Save 10%", cover: samplePage(7).url, slides: [samplePage(8)] },
        { id: "sample-faq", title: "FAQ", cover: samplePage(9).url, slides: [10, 11, 12, 13, 14, 15].map(samplePage) },
        { id: "sample-reviews", title: "Reviews", cover: samplePage(16).url, slides: [17, 18, 19, 20].map(samplePage) },
    ],
    unassigned: [],
    source: {
        via: "sample",
        canvaUrl: SAMPLE_CANVA_URL,
        designId: "DAHSwF8HKF8",
        designTitle: "North Star Story Highlights",
        importedAt: new Date().toISOString(),
        importedBy,
    },
});
