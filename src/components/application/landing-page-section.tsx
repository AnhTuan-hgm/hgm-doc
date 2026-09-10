import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Code02, Globe01, LinkExternal01, MessageChatCircle, Monitor01, Phone01 } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { supabase } from "@/lib/supabase";
import { uid } from "@/pages/client/dashboard/dashboard-model";
import { cx } from "@/utils/cx";

/**
 * Marketing → Landing page — an AM pastes the finished HTML, the client reviews it live
 * in-frame and approves or asks for changes. Persists to landing_pages (see the
 * 20260910150000_landing_pages migration): one row per dashboard slug, holding every
 * published version (newest first) and the client's current review state.
 *
 * Team writes (publish / restore) go straight to Supabase under the team-only RLS policy.
 * The client is `anon` to Supabase, so Approve / Request changes go through
 * landing-page-review.mts instead, which checks the caller's email against the
 * dashboard's allowed_emails on every call — same shape as the suggestion flow.
 *
 * Deliberately NOT wired into JOURNEY_STEPS this pass: the review state lives here,
 * ready for a future step to read, but adding one touches the Overview page's own large
 * step list and felt like a separate change.
 */

interface LandingPageVersion {
    id: string;
    html: string;
    /** What changed, or the file's own <title> when nothing was typed — shown next to
     *  the version in the list, never required to publish. */
    note: string;
    publishedAt: string;
    publishedBy: string;
}

interface LandingPageReview {
    status: "pending" | "approved" | "changes";
    /** The client's requested changes — set only when status is "changes". */
    note?: string;
    respondedAt?: string;
    respondedBy?: string;
}

interface LandingPageData {
    /** Newest first — versions[0] is what's live. */
    versions: LandingPageVersion[];
    review: LandingPageReview;
}

const EMPTY_DATA: LandingPageData = { versions: [], review: { status: "pending" } };
const ENDPOINT = "/.netlify/functions/landing-page-review";
// A generous cap: real landing pages in this table run 15–25 KB. This just keeps one
// pasted file from ballooning the jsonb row.
const MAX_HTML_BYTES = 2_000_000;

const looksLikeAPage = (html: string) => /<html[\s>]/i.test(html) || /<body[\s>]/i.test(html);
const kb = (html: string) => (new Blob([html]).size / 1024).toFixed(1);
const titleOf = (html: string) => html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
const shortDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

/** Same trick the design used: write the file into a blank tab so it renders exactly as
 *  the client will eventually see it hosted, without the app having its own preview route. */
const openInNewTab = (html: string) => {
    const w = window.open("about:blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
};

const inputCls =
    "w-full resize-y rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";
const monoInputCls =
    "w-full min-h-[220px] resize-y rounded-lg border bg-secondary px-3.5 py-3 font-mono text-xs leading-5 text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";

export const LandingPageSection = ({
    slug,
    clientName,
    isTeam,
    isLocked,
    isTemplate,
    teamName,
    clientEmail,
}: {
    slug?: string;
    clientName: string;
    isTeam: boolean;
    isLocked: boolean;
    isTemplate: boolean;
    /** Signed-in AM's display name — attributed on every version this session publishes. */
    teamName: string;
    /** The client's own identity email (see identityEmail in client-dashboard-page.tsx).
     *  Empty for team / an anonymous unlock, in which case Approve / Request changes stay hidden. */
    clientEmail: string;
}) => {
    const [data, setData] = useState<LandingPageData>(EMPTY_DATA);
    const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

    const [draft, setDraft] = useState("");
    const [draftError, setDraftError] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishErr, setPublishErr] = useState("");
    const [showReplace, setShowReplace] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const [changesOpen, setChangesOpen] = useState(false);
    const [reviewNote, setReviewNote] = useState("");
    const [reviewBusy, setReviewBusy] = useState(false);
    const [reviewErr, setReviewErr] = useState("");

    // Load the published landing page for this client.
    useEffect(() => {
        if (!slug || isTemplate) return;
        supabase
            .from("landing_pages")
            .select("data")
            .eq("slug", slug)
            .maybeSingle()
            .then(({ data: row, error }) => {
                const d = row?.data as Partial<LandingPageData> | undefined;
                if (!error && d && Array.isArray(d.versions)) setData({ versions: d.versions, review: d.review ?? { status: "pending" } });
            });
    }, [slug, isTemplate]);

    const versions = data.versions;
    const live = versions[0];
    const canEdit = isTeam && !isLocked && !isTemplate;
    const tagOf = (i: number) => `v${versions.length - i}`;

    const persist = async (next: LandingPageData) => {
        if (!slug) return false;
        const { error } = await supabase
            .from("landing_pages")
            .upsert({ slug, client_name: clientName, data: next, updated_at: new Date().toISOString() }, { onConflict: "slug" });
        return !error;
    };

    const publish = async () => {
        if (!draft.trim()) return;
        if (!looksLikeAPage(draft)) {
            setDraftError(true);
            setPublishErr("");
            return;
        }
        if (new Blob([draft]).size > MAX_HTML_BYTES) {
            setPublishErr("That file is too large — keep a single landing page under 2 MB.");
            return;
        }
        setDraftError(false);
        setPublishErr("");
        setPublishing(true);
        const version: LandingPageVersion = {
            id: uid(),
            html: draft,
            note: titleOf(draft),
            publishedAt: new Date().toISOString(),
            publishedBy: teamName,
        };
        const next: LandingPageData = { versions: [version, ...versions], review: { status: "pending" } };
        const ok = await persist(next);
        setPublishing(false);
        if (!ok) {
            setPublishErr("Couldn't publish — try again.");
            return;
        }
        setData(next);
        setDraft("");
        setShowReplace(false);
    };

    const restore = async (v: LandingPageVersion, tag: string) => {
        setRestoringId(v.id);
        const version: LandingPageVersion = { id: uid(), html: v.html, note: `Restored ${tag}`, publishedAt: new Date().toISOString(), publishedBy: teamName };
        const next: LandingPageData = { versions: [version, ...versions], review: { status: "pending" } };
        const ok = await persist(next);
        setRestoringId(null);
        if (ok) setData(next);
    };

    const respond = async (action: "approve" | "request_changes", note?: string) => {
        if (!slug || !clientEmail) return;
        setReviewBusy(true);
        setReviewErr("");
        try {
            const res = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, slug, email: clientEmail, note }),
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string; review?: LandingPageReview };
            if (!res.ok || !json.review) {
                setReviewErr(json.error || "Something went wrong — try again.");
                return;
            }
            setData((d) => ({ ...d, review: json.review! }));
            setChangesOpen(false);
            setReviewNote("");
        } catch {
            setReviewErr("Something went wrong — try again.");
        } finally {
            setReviewBusy(false);
        }
    };

    const subtitle = isTeam
        ? "Paste the finished HTML and it renders here for the client. Every publish is kept as a version you can restore."
        : live
          ? "Your direct-booking page, ready for review. Try it on desktop and mobile, then let us know."
          : "The page that turns visitors into direct bookings.";

    const reviewCopy: Record<LandingPageReview["status"], { color: "warning" | "success" | "gray"; text: string }> = {
        pending: { color: "warning", text: "Awaiting review" },
        approved: { color: "success", text: "Approved" },
        changes: { color: "gray", text: "Changes requested" },
    };
    const rv = reviewCopy[data.review.status];

    return (
        <div>
            <div>
                <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Landing page</h2>
                <p className="mt-1.5 max-w-2xl text-md text-tertiary text-pretty">{subtitle}</p>
            </div>

            {/* ── Client, nothing published yet — reassurance, not a dead end ── */}
            {!isTeam && !live && (
                <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-primary px-8 py-16 text-center ring-1 ring-secondary">
                    <FeaturedIcon icon={Globe01} color="gray" theme="light" size="lg" className="mb-2" />
                    <p className="text-md font-semibold text-primary">Your landing page is on its way</p>
                    <p className="max-w-md text-sm text-tertiary text-pretty">
                        We're building it from your Master Brand and Brand Kit. Once it's ready you'll review it right here and tell us anything you'd like
                        changed.
                    </p>
                </div>
            )}

            {/* ── Team, nothing published yet — the paste composer ── */}
            {isTeam && !live && (
                <div className="mt-6 flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                    <div className="flex items-start justify-between gap-4 border-b border-secondary px-6 py-5">
                        <div>
                            <p className="text-md font-semibold text-primary">Paste the landing page HTML</p>
                            <p className="mt-0.5 text-sm text-tertiary text-pretty">
                                Paste the complete file, including the head and any inline styles. It renders exactly as the client will see it. Clients see
                                "on its way" until you publish.
                            </p>
                        </div>
                        <Badge color="gray" size="md" type="pill-color">
                            Not published
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-3 px-6 py-5">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            spellCheck={false}
                            disabled={!canEdit}
                            placeholder="Paste the full page here — from the opening html tag to the closing one."
                            className={cx(monoInputCls, draftError ? "border-error-primary" : "border-secondary")}
                        />
                        {draftError && (
                            <div role="alert" className="flex items-start gap-3 rounded-xl bg-error-primary p-3.5 ring-1 ring-error_subtle">
                                <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-semibold text-primary">Couldn't publish this file</p>
                                    <p className="text-sm text-tertiary">It doesn't look like a complete page. Make sure it has an html or body tag and nothing was cut off when copying.</p>
                                </div>
                            </div>
                        )}
                        {publishErr && !draftError && <p className="text-sm text-error-primary">{publishErr}</p>}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-quaternary">{draft.trim() ? `${kb(draft)} KB · ${titleOf(draft) ? `Title: ${titleOf(draft)}` : "No title tag found"}` : "Nothing pasted yet"}</p>
                            <div className="flex gap-3">
                                <Button color="secondary" size="md" isDisabled={!draft.trim() || !canEdit} onClick={() => openInNewTab(draft)}>
                                    Preview
                                </Button>
                                <Button size="md" isDisabled={!draft.trim() || !canEdit} isLoading={publishing} showTextWhileLoading onClick={() => void publish()}>
                                    {publishing ? "Publishing…" : "Publish to client"}
                                </Button>
                            </div>
                        </div>
                        {isLocked && <p className="text-xs text-quaternary">Unlock the dashboard to paste and publish.</p>}
                    </div>
                </div>
            )}

            {/* ── A version exists — the live preview, for team and client alike ── */}
            {live && (
                <div className="mt-6 flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                    <div className="flex flex-wrap items-center gap-3 border-b border-secondary px-4 py-3">
                        <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
                            <BadgeWithDot color="success" size="sm" type="pill-color">
                                Live
                            </BadgeWithDot>
                            <span className="text-sm text-tertiary">
                                {tagOf(0)} · Published {shortDate(live.publishedAt)}
                                {live.publishedBy ? ` by ${live.publishedBy}` : ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                            {(
                                [
                                    { id: "desktop", icon: Monitor01, label: "Desktop" },
                                    { id: "mobile", icon: Phone01, label: "Mobile" },
                                ] as const
                            ).map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setDevice(v.id)}
                                    className={cx(
                                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition duration-100 ease-linear",
                                        device === v.id ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" : "text-tertiary hover:text-primary",
                                    )}
                                >
                                    <v.icon className="size-3.5" aria-hidden="true" />
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-1 justify-end gap-2">
                            {canEdit && (
                                <Button color="secondary" size="sm" iconLeading={Code02} onClick={() => setShowReplace((v) => !v)}>
                                    Replace HTML
                                </Button>
                            )}
                            <Button color="secondary" size="sm" iconLeading={LinkExternal01} onClick={() => openInNewTab(live.html)}>
                                Open full page
                            </Button>
                        </div>
                    </div>

                    {canEdit && showReplace && (
                        <div className="flex flex-col gap-3 border-b border-secondary bg-secondary px-4 py-4">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                spellCheck={false}
                                placeholder="Paste the new HTML here. Publishing creates a new version — the current one stays in the list below."
                                className={cx(monoInputCls, "min-h-[180px] bg-primary", draftError ? "border-error-primary" : "border-secondary")}
                            />
                            {draftError && <p className="text-sm text-error-primary">It doesn't look like a complete page — make sure it has an html or body tag.</p>}
                            {publishErr && !draftError && <p className="text-sm text-error-primary">{publishErr}</p>}
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-quaternary">{draft.trim() ? `${kb(draft)} KB` : "Nothing pasted yet"}</p>
                                <div className="flex gap-3">
                                    <Button
                                        color="tertiary"
                                        size="md"
                                        onClick={() => {
                                            setShowReplace(false);
                                            setDraft("");
                                            setDraftError(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button size="md" isDisabled={!draft.trim()} isLoading={publishing} showTextWhileLoading onClick={() => void publish()}>
                                        {publishing ? "Publishing…" : `Publish as ${tagOf(-1)}`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={cx("flex justify-center bg-tertiary", device === "mobile" ? "p-8" : "p-0")}>
                        <div
                            className={cx("relative overflow-hidden bg-primary transition-[width] duration-200 ease-linear", device === "mobile" && "rounded-3xl border border-secondary shadow-lg")}
                            style={{ width: device === "mobile" ? 390 : "100%", maxWidth: "100%", height: device === "mobile" ? 760 : 640 }}
                        >
                            <iframe title="Landing page preview" srcDoc={live.html} sandbox="allow-same-origin" className="size-full border-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Team panels: versions + review summary ── */}
            {isTeam && live && (
                <div className="mt-6 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
                    <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                            <p className="text-md font-semibold text-primary">Versions</p>
                            <span className="text-sm text-quaternary">
                                {versions.length} version{versions.length === 1 ? "" : "s"}
                            </span>
                        </div>
                        {versions.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-3 border-b border-secondary px-5 py-3 last:border-b-0">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-medium text-tertiary">{tagOf(i)}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-primary">{v.note || "Landing page update"}</p>
                                    <p className="text-sm text-quaternary">
                                        {shortDate(v.publishedAt)}
                                        {v.publishedBy ? ` · ${v.publishedBy}` : ""} · {kb(v.html)} KB
                                    </p>
                                </div>
                                {i === 0 ? (
                                    <BadgeWithDot color="success" size="sm" type="pill-color">
                                        Live
                                    </BadgeWithDot>
                                ) : (
                                    canEdit && (
                                        <Button color="tertiary" size="sm" isLoading={restoringId === v.id} onClick={() => void restore(v, tagOf(i))}>
                                            Restore
                                        </Button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                        <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-4">
                            <p className="text-md font-semibold text-primary">Client review</p>
                            <BadgeWithDot color={rv.color} size="sm" type="pill-color">
                                {rv.text}
                            </BadgeWithDot>
                        </div>
                        <div className="flex flex-col gap-3 px-5 py-4">
                            <p className="text-sm text-tertiary text-pretty">
                                {data.review.status === "pending" && `The client hasn't reviewed ${tagOf(0)} yet. They'll see Approve and Request changes under the preview.`}
                                {data.review.status === "approved" && `${data.review.respondedBy ?? "The client"} approved ${tagOf(0)}${data.review.respondedAt ? ` on ${shortDate(data.review.respondedAt)}` : ""}.`}
                                {data.review.status === "changes" && `${data.review.respondedBy ?? "The client"} asked for changes${data.review.respondedAt ? ` on ${shortDate(data.review.respondedAt)}` : ""}. Publish a new version to send it back for review.`}
                            </p>
                            {data.review.status === "changes" && data.review.note && (
                                <div className="border-l-2 border-secondary py-1 pl-3.5">
                                    <p className="text-sm text-secondary text-pretty">{data.review.note}</p>
                                </div>
                            )}
                            <p className="text-sm text-quaternary">The client can approve this from their own dashboard, or ask for changes.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Client review controls — only once a version is live ── */}
            {!isTeam && live && (
                <div className="mt-6 flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
                    {data.review.status !== "approved" && (
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                            <div className="min-w-60 flex-1">
                                <p className="text-md font-semibold text-primary">Does this look right to you?</p>
                                <p className="text-sm text-tertiary text-pretty">Approve it and we'll connect it to your domain. Or tell us what to change and we'll send a new version.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button color="secondary" size="md" isDisabled={!clientEmail || reviewBusy} onClick={() => setChangesOpen((v) => !v)}>
                                    Request changes
                                </Button>
                                <Button size="md" iconLeading={CheckCircle} isDisabled={!clientEmail} isLoading={reviewBusy} onClick={() => void respond("approve")}>
                                    Approve
                                </Button>
                            </div>
                        </div>
                    )}
                    {data.review.status !== "approved" && changesOpen && (
                        <div className="flex flex-col gap-3 px-6 pb-6">
                            <textarea
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                placeholder="What would you like changed? Be as specific as you can — colours, wording, photos, the order of sections."
                                className={cx(inputCls, "min-h-[120px]")}
                            />
                            {reviewErr && <p className="text-sm text-error-primary">{reviewErr}</p>}
                            <div className="flex justify-end gap-3">
                                <Button color="tertiary" size="md" onClick={() => setChangesOpen(false)}>
                                    Cancel
                                </Button>
                                <Button size="md" isDisabled={!reviewNote.trim()} isLoading={reviewBusy} showTextWhileLoading onClick={() => void respond("request_changes", reviewNote.trim())}>
                                    Send to your team
                                </Button>
                            </div>
                        </div>
                    )}
                    {data.review.status === "approved" && (
                        <div className="flex items-start gap-3 px-6 py-5">
                            <CheckCircle className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden="true" />
                            <div>
                                <p className="text-sm font-semibold text-primary">Approved</p>
                                <p className="text-sm text-tertiary">Thanks. Your Account Manager will connect this page to your domain and let you know in Google Chat when it's live.</p>
                            </div>
                        </div>
                    )}
                    {data.review.status === "changes" && (
                        <div className="flex items-start gap-3 border-t border-secondary px-6 py-5">
                            <MessageChatCircle className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-semibold text-primary">Changes requested</p>
                                <p className="text-sm text-secondary text-pretty">{data.review.note}</p>
                                <p className="text-sm text-quaternary">We'll publish a new version here once it's updated.</p>
                            </div>
                        </div>
                    )}
                    {!clientEmail && data.review.status === "pending" && <p className="px-6 pb-5 text-sm text-quaternary">Sign in with your own email to approve or request changes.</p>}
                </div>
            )}
        </div>
    );
};
