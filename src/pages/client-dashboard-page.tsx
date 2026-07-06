import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
// Functional UI icons — Untitled UI PRO, line style (drop-in for the free set).
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    Camera01,
    Check,
    ChevronLeft,
    ChevronRight,
    FileCheck02,
    Globe01,
    HelpCircle,
    Image01,
    LayoutAlt01,
    LinkExternal01,
    Lock01,
    LockUnlocked01,
    Mail01,
    MessageChatCircle,
    PlayCircle,
    Plus,
    SearchLg,
    Target04,
    Trash01,
    TrendUp01,
    XClose,
} from "@untitledui-pro/icons/line";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { ProgressBarCircle } from "@/components/base/progress-indicators/progress-circles";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Instagram } from "@/components/foundations/social-icons";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { Reveal } from "@/components/shared-assets/reveal";
import { AppShell } from "@/components/application/icon-rail";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { WelcomeFlowSection } from "@/components/application/welcome-flow";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cx } from "@/utils/cx";
import { supabase, type DashboardContent } from "@/lib/supabase";

const PASSWORD = "ANHTUAN";
const SUPPORT_EMAIL = "anhtuan@hiddengem.media";
const CONTACT_SUBJECT = "Client Dashboard — I'd like some help";
const CONTACT_BODY = `Hi HiddenGem Team,

I have a question about my client dashboard.

• What I'd like to know / update:
• Anything else you should know:

Thanks!`;
const CONTACT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}&body=${encodeURIComponent(CONTACT_BODY)}`;

type BrandColor = DashboardContent["brand"]["colors"][number];
type Highlight = DashboardContent["instagram"]["highlights"][number];
type GhlItem = DashboardContent["ghl"]["items"][number];
type RevenueMonth = DashboardContent["revenue"]["months"][number];
type QuickLink = DashboardContent["links"][number];
type VideoGuide = NonNullable<DashboardContent["videos"]>[number];
type FaqItem = NonNullable<DashboardContent["foundation"]>["faqs"][number];

const STATUS_OPTIONS = ["Onboarding", "Active", "Paused"] as const;

const statusColor = (status: string) =>
    status === "Active" ? "success" : status === "Paused" ? "warning" : "brand";

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

const DEFAULT_FOUNDATION: NonNullable<DashboardContent["foundation"]> = {
    propertyBasics: "",
    persona: "",
    toneOfVoice: "",
    amenities: "",
    localRecommendations: "",
    bookingLinks: "",
    faqs: [],
};

const DEFAULT_GHL_ITEMS: GhlItem[] = [
    { label: "Domain & website connected", done: false },
    { label: "Business phone number", done: false },
    { label: "Calendar & online booking", done: false },
    { label: "Sales pipeline", done: false },
    { label: "Automations & follow-up workflows", done: false },
    { label: "Review requests", done: false },
    { label: "Email & SMS templates", done: false },
    { label: "Mobile app installed", done: false },
];

/** Default page links for a client, derived from the shared slug base. */
const defaultLinks = (base: string): QuickLink[] => [
    { title: "Meta Pixel Setup Guide", description: "Install your tracking pixel step by step.", url: `/${base}-metapixel` },
    { title: "Lead Capture Popup", description: "Your website popup & inline form setup.", url: `/${base}-leadcapture` },
    { title: "Chat Widget", description: "Add the website chat widget to your site.", url: `/${base}-chatwidget` },
];

const TEMPLATE_CONTENT: DashboardContent = {
    status: "Active",
    logo_url: "",
    brand: {
        colors: [
            { name: "Primary", hex: "#7F56D9" },
            { name: "Secondary", hex: "#101828" },
            { name: "Accent", hex: "#F4EBFF" },
            { name: "Neutral", hex: "#FAFAFA" },
        ],
        fonts: "Inter",
        folder_link: "",
    },
    instagram: { profile_url: "", highlights: [] },
    ghl: { login_url: "https://app.gohighlevel.com", items: DEFAULT_GHL_ITEMS },
    revenue: {
        currency: "USD",
        months: [
            { month: "Jan", revenue: 8200, leads: 34, appointments: 18 },
            { month: "Feb", revenue: 9400, leads: 41, appointments: 22 },
            { month: "Mar", revenue: 11800, leads: 52, appointments: 27 },
            { month: "Apr", revenue: 10900, leads: 47, appointments: 25 },
            { month: "May", revenue: 13600, leads: 61, appointments: 33 },
            { month: "Jun", revenue: 15200, leads: 68, appointments: 37 },
        ],
    },
    links: defaultLinks("yourclient"),
    videos: [],
    foundation: DEFAULT_FOUNDATION,
};

/** Fresh content for a newly created client copy — no sample numbers. */
const createDefaultContent = (base: string): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    status: "Onboarding",
    revenue: { currency: "USD", months: [] },
    ghl: { ...TEMPLATE_CONTENT.ghl, items: DEFAULT_GHL_ITEMS.map((i) => ({ ...i })) },
    links: defaultLinks(base),
    foundation: { ...DEFAULT_FOUNDATION, faqs: [] },
    videos: [],
});

/** Merge a partial jsonb blob from the DB over the defaults so old rows never crash new sections. */
const mergeContent = (partial?: Partial<DashboardContent> | null): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    ...partial,
    brand: { ...TEMPLATE_CONTENT.brand, ...partial?.brand },
    instagram: { ...TEMPLATE_CONTENT.instagram, ...partial?.instagram },
    ghl: { ...TEMPLATE_CONTENT.ghl, ...partial?.ghl },
    revenue: { ...TEMPLATE_CONTENT.revenue, ...partial?.revenue },
    links: partial?.links ?? TEMPLATE_CONTENT.links,
    videos: partial?.videos ?? [],
    foundation: { ...DEFAULT_FOUNDATION, ...partial?.foundation, faqs: partial?.foundation?.faqs ?? [] },
});

/** Which stage of the HiddenGem funnel a section belongs to — every section shows its
 * stage badge so clients build the same Foundation → Top → Middle → Bottom mental model
 * Dustin walks them through on the onboarding call, every time they open the dashboard. */
const FUNNEL_STAGES = {
    foundation: { label: "Foundation", bg: "bg-secondary", text: "text-secondary" },
    top: { label: "Top of funnel", bg: "bg-brand-secondary", text: "text-brand-secondary" },
    middle: { label: "Middle of funnel", bg: "bg-warning-secondary", text: "text-warning-primary" },
    bottom: { label: "Bottom of funnel", bg: "bg-success-secondary", text: "text-success-primary" },
} as const;
type FunnelStageId = keyof typeof FUNNEL_STAGES;

const SectionEyebrow = ({ stage }: { stage: FunnelStageId }) => {
    const s = FUNNEL_STAGES[stage];
    return (
        <div className="flex items-center gap-3">
            <span className={cx("inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide", s.bg, s.text)}>
                {s.label}
            </span>
            <span className="h-px flex-1 bg-border-secondary" />
        </div>
    );
};

const SectionHeading = ({ children }: { children: ReactNode }) => (
    <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">{children}</h2>
);

const StatTile = ({ label, value, change }: { label: string; value: string; change?: ReactNode }) => (
    <div className="rounded-xl p-5 ring-1 ring-secondary">
        <p className="text-sm font-medium text-tertiary">{label}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
            <p className="text-display-xs font-semibold text-primary md:text-display-sm">{value}</p>
            {change}
        </div>
    </div>
);

/** Side-menu taxonomy — mirrors the funnel Dustin walks every client through on the
 * onboarding call: Foundation (the Master Document everything else reads from) feeds
 * Top of funnel (get seen) → Middle of funnel (nurture + capture) → Bottom of funnel
 * (convert to a direct booking). Module scope so the array isn't rebuilt every render. */
type SectionId = "overview" | "foundation" | "brand" | "videos" | "comms" | "website" | "instagram" | "flow" | "chatwidget" | "ghl" | "revenue";

/** Sits above the funnel groups — not a funnel stage itself, just "home" (hero + the funnel explainer). */
const OVERVIEW_ITEM = { id: "overview" as const, label: "Overview", icon: LayoutAlt01 };

const NAV_GROUPS: { label: string; stage: FunnelStageId; items: { id: SectionId; label: string; icon: typeof LayoutAlt01; soon?: boolean }[] }[] = [
    {
        label: "Foundation",
        stage: "foundation",
        items: [
            { id: "foundation", label: "Master Document", icon: FileCheck02 },
            { id: "brand", label: "Brand Kit", icon: Image01 },
            { id: "videos", label: "Video Guides", icon: PlayCircle },
            { id: "comms", label: "Communication Log", icon: MessageChatCircle, soon: true },
        ],
    },
    {
        label: "Top of funnel",
        stage: "top",
        items: [
            { id: "website", label: "Website", icon: Globe01 },
            { id: "instagram", label: "Instagram", icon: Camera01 },
        ],
    },
    {
        label: "Middle of funnel",
        stage: "middle",
        items: [
            { id: "flow", label: "Welcome Flow Email", icon: Mail01 },
            { id: "chatwidget", label: "Chat Widget", icon: MessageChatCircle },
        ],
    },
    {
        label: "Bottom of funnel",
        stage: "bottom",
        items: [
            { id: "ghl", label: "GoHighLevel Setup", icon: Target04 },
            { id: "revenue", label: "Revenue & Results", icon: TrendUp01 },
        ],
    },
];
/** Flattened for lookups (active-section checks, deep links) — order matches the sidebar. */
const SECTIONS = [OVERVIEW_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];

type SearchHit = { id: SectionId; label: string; sub?: string };

/**
 * Header search — client-scoped, NOT the internal team's sitewide search. It only
 * searches this one client's own sidebar sections, links and FAQs (passed in as
 * `hits`) — never other clients, internal team pages, or admin routes. Purely local
 * filtering over already-loaded props; no network calls.
 */
const ClientSearchBar = ({ hits, onSelect }: { hits: SearchHit[]; onSelect: (id: SectionId) => void }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener("mousedown", onDown);
        return () => window.removeEventListener("mousedown", onDown);
    }, [open]);

    const q = query.trim().toLowerCase();
    const results = q ? hits.filter((h) => h.label.toLowerCase().includes(q) || h.sub?.toLowerCase().includes(q)) : hits;

    const go = (id: SectionId) => {
        onSelect(id);
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center px-1">
            <div
                className={cx(
                    "flex w-full max-w-md items-center gap-2.5 rounded-full border bg-primary px-4 py-2 transition duration-100 ease-linear",
                    open ? "border-brand ring-2 ring-brand/15" : "border-secondary hover:border-primary",
                )}
            >
                <SearchLg className={cx("size-4 shrink-0 transition duration-100 ease-linear", open ? "text-fg-brand-primary" : "text-quaternary")} aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && results[0]) go(results[0].id);
                        else if (e.key === "Escape") {
                            setOpen(false);
                            inputRef.current?.blur();
                        }
                    }}
                    placeholder="Search your dashboard…"
                    className="min-w-0 flex-1 bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                />
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        className="absolute left-1/2 top-full z-30 mt-2 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-primary shadow-2xl ring-1 ring-secondary"
                    >
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {results.length === 0 ? (
                                <p className="px-4 py-6 text-center text-sm text-tertiary">No matches for “{query}”</p>
                            ) : (
                                results.map((h, i) => (
                                    <button
                                        key={`${h.id}-${i}`}
                                        type="button"
                                        onClick={() => go(h.id)}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                                    >
                                        <span className="flex-1 truncate">{h.label}</span>
                                        {h.sub && <span className="shrink-0 truncate text-xs text-quaternary">{h.sub}</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export interface ClientDashboardPageProps {
    /** Page slug — when set, locking persists edits to dashboard_pages (shared). */
    slug?: string;
    initialClientName?: string;
    initialClientWebsite?: string;
    initialData?: Partial<DashboardContent> | null;
    /** Only the template page (/client-dashboard) shows the “+” create button. */
    isTemplate?: boolean;
}

export const ClientDashboardPage = ({
    slug,
    initialClientName = "",
    initialClientWebsite = "",
    initialData,
    isTemplate = false,
}: ClientDashboardPageProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Team detection — the lock/create controls are only visible to signed-in
    // @hiddengem.media members; clients see a clean read-only dashboard.
    const { user } = useAuthUser();
    const isTeam = !!user?.email && user.email.toLowerCase().endsWith("@hiddengem.media");

    // Editable content
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [content, setContent] = useState<DashboardContent>(() => mergeContent(initialData));

    // Lock state
    const [isLocked, setIsLocked] = useState(true);

    // Side-menu section — grouped by funnel stage (NAV_GROUPS, module scope above).
    const [activeSection, setActiveSection] = useState<SectionId>("overview");

    // Deep-link support: /client-dashboard#flow (or #overview) opens that side-menu
    // section on load — used by the Welcome Email Flow overview page's "live builder" link.
    useEffect(() => {
        const h = window.location.hash.replace("#", "");
        if (h && SECTIONS.some((s) => s.id === h)) setActiveSection(h as SectionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Unlock modal
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState("");
    const [unlockError, setUnlockError] = useState(false);

    // Plus wizard
    const [showPlusModal, setShowPlusModal] = useState(false);
    const [plusStep, setPlusStep] = useState<"password" | "details">("password");
    const [plusPassword, setPlusPassword] = useState("");
    const [plusPasswordError, setPlusPasswordError] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientWebsite, setNewClientWebsite] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Auto-open the create wizard when arriving via "+ New Page" (?create=1).
    useEffect(() => {
        if (searchParams.get("create") === "1") {
            setShowPlusModal(true);
            setPlusStep("details");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lock background scroll while a modal is open.
    useEffect(() => {
        const open = showPlusModal || showUnlockModal;
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [showPlusModal, showUnlockModal]);

    /* ── Content updaters ── */
    const patchBrand = (patch: Partial<DashboardContent["brand"]>) =>
        setContent((c) => ({ ...c, brand: { ...c.brand, ...patch } }));
    const patchInstagram = (patch: Partial<DashboardContent["instagram"]>) =>
        setContent((c) => ({ ...c, instagram: { ...c.instagram, ...patch } }));
    const patchGhl = (patch: Partial<DashboardContent["ghl"]>) =>
        setContent((c) => ({ ...c, ghl: { ...c.ghl, ...patch } }));
    const patchRevenue = (patch: Partial<DashboardContent["revenue"]>) =>
        setContent((c) => ({ ...c, revenue: { ...c.revenue, ...patch } }));
    const patchFoundation = (patch: Partial<NonNullable<DashboardContent["foundation"]>>) =>
        setContent((c) => ({ ...c, foundation: { ...DEFAULT_FOUNDATION, ...c.foundation, ...patch } }));

    const foundation = content.foundation ?? DEFAULT_FOUNDATION;
    const updateFaq = (i: number, patch: Partial<FaqItem>) =>
        patchFoundation({ faqs: foundation.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

    const updateColor = (i: number, patch: Partial<BrandColor>) =>
        patchBrand({ colors: content.brand.colors.map((col, j) => (j === i ? { ...col, ...patch } : col)) });
    const updateHighlight = (i: number, patch: Partial<Highlight>) =>
        patchInstagram({ highlights: content.instagram.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
    const updateGhlItem = (i: number, patch: Partial<GhlItem>) =>
        patchGhl({ items: content.ghl.items.map((item, j) => (j === i ? { ...item, ...patch } : item)) });
    const updateMonth = (i: number, patch: Partial<RevenueMonth>) =>
        patchRevenue({ months: content.revenue.months.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
    // By object reference, not index — this array now renders as two filtered views
    // (Website / Chat Widget), so a positional index from one view can't safely
    // address the full array.
    const updateLink = (link: QuickLink, patch: Partial<QuickLink>) =>
        setContent((c) => ({ ...c, links: c.links.map((l) => (l === link ? { ...l, ...patch } : l)) }));
    const removeLink = (link: QuickLink) =>
        setContent((c) => ({ ...c, links: c.links.filter((l) => l !== link) }));
    const updateVideo = (i: number, patch: Partial<VideoGuide>) =>
        setContent((c) => ({ ...c, videos: (c.videos ?? []).map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

    /* ── Derived metrics ── */
    const months = content.revenue.months;
    const fmtMoney = (v: number) => {
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: content.revenue.currency || "USD",
                maximumFractionDigits: 0,
            }).format(v);
        } catch {
            return `$${Math.round(v).toLocaleString()}`;
        }
    };
    const fmtCompact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v);
    const totalRevenue = months.reduce((s, m) => s + (m.revenue || 0), 0);
    const totalLeads = months.reduce((s, m) => s + (m.leads || 0), 0);
    const totalAppointments = months.reduce((s, m) => s + (m.appointments || 0), 0);
    const latest = months[months.length - 1];
    const prev = months[months.length - 2];
    const momChange = latest && prev && prev.revenue > 0 ? ((latest.revenue - prev.revenue) / prev.revenue) * 100 : null;

    const ghlDone = content.ghl.items.filter((i) => i.done).length;
    const ghlTotal = content.ghl.items.length;

    const videoGuides = content.videos ?? [];

    const websiteHref = clientWebsite && (clientWebsite.startsWith("http") ? clientWebsite : `https://${clientWebsite}`);

    // Split the shared `links` array by which funnel section it belongs on. The chat
    // widget's own setup guide is Middle of funnel (it's what nurtures/answers guests);
    // everything else (pixel tracking, lead-capture popup, and any custom link a team
    // member adds) is a Top-of-funnel, on-site tool — same array, two filtered views,
    // so nothing about the underlying data shape needs to change.
    const chatWidgetLinks = content.links.filter((l) => l.url.includes("-chatwidget"));
    const websiteLinks = content.links.filter((l) => !l.url.includes("-chatwidget"));

    // Client-scoped search index — sidebar sections, this client's own links, and their
    // FAQ questions. Nothing here reaches outside this one client's own content.
    const searchHits = useMemo<SearchHit[]>(() => {
        const navHits = SECTIONS.filter((s) => !("soon" in s && s.soon)).map((s) => ({ id: s.id, label: s.label }));
        const linkHits = content.links.map((l) => ({ id: (l.url.includes("-chatwidget") ? "chatwidget" : "website") as SectionId, label: l.title || "Untitled link", sub: "Link" }));
        const faqHits = foundation.faqs.filter((f) => f.question.trim()).map((f) => ({ id: "foundation" as SectionId, label: f.question, sub: "FAQ" }));
        return [...navHits, ...linkHits, ...faqHits];
    }, [content.links, foundation.faqs]);

    const clientInitials = (clientName || "Client")
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();

    /* ── Lock / save ── */
    const handleLockClick = async () => {
        if (isLocked) {
            setShowUnlockModal(true);
            setUnlockPassword("");
            setUnlockError(false);
            return;
        }
        // Locking → persist edits to the shared dashboard_pages row.
        if (slug && !isTemplate) {
            const { error } = await supabase
                .from("dashboard_pages")
                .upsert(
                    { slug, client_name: clientName.trim(), client_website: clientWebsite.trim(), data: content },
                    { onConflict: "slug" },
                );
            if (error) console.error("[client dashboard save] Supabase error:", error);
        }
        setIsLocked(true);
    };

    const handleUnlock = () => {
        if (unlockPassword === PASSWORD) {
            setIsLocked(false);
            setShowUnlockModal(false);
            setUnlockPassword("");
            setUnlockError(false);
        } else {
            setUnlockError(true);
        }
    };

    /* ── Create flow ── */
    const handlePlusClick = () => {
        setShowPlusModal(true);
        // Signed-in @hiddengem.media users are already authenticated — skip the password gate.
        setPlusStep(isTeam ? "details" : "password");
        setPlusPassword("");
        setPlusPasswordError(false);
        setNewClientName("");
        setNewClientWebsite("");
        setCreateError("");
    };

    const handlePlusPassword = () => {
        if (plusPassword === PASSWORD) {
            setPlusPasswordError(false);
            setPlusStep("details");
        } else {
            setPlusPasswordError(true);
        }
    };

    const handleCreatePage = async () => {
        const base = slugify(newClientName);
        if (!base) return;
        const newSlug = `${base}-dashboard`;
        setIsCreating(true);
        setCreateError("");
        const { error } = await supabase.from("dashboard_pages").upsert({
            slug: newSlug,
            client_name: newClientName.trim(),
            client_website: newClientWebsite.trim(),
            data: createDefaultContent(base),
        });
        setIsCreating(false);
        if (error) {
            setCreateError("Could not save — check your connection and try again.");
            return;
        }
        setShowPlusModal(false);
        navigate(`/${newSlug}`);
    };

    const editInput = (extra?: string) =>
        cx(
            "w-full rounded-lg border border-secondary bg-transparent px-2.5 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand",
            extra,
        );

    const removeButton = "flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary";

    return (
        <AppShell className="flex flex-col">
            {/* ── Header — back/forward, client-scoped search, client identity badge.
                Not AppShell's built-in row (that one's gated on the internal department
                rail, and its search indexes every client + internal page — wrong for a
                page clients themselves open). Hand-built here, client-safe only. ── */}
            <div className="flex h-[73px] shrink-0 items-center gap-3 border-b border-secondary bg-primary px-4 md:px-5">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    title="Back"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-quaternary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => navigate(1)}
                    title="Forward"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-quaternary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                >
                    <ChevronRight className="size-4" aria-hidden="true" />
                </button>

                <ClientSearchBar hits={searchHits} onSelect={setActiveSection} />

                {/* Client identity badge — this client's own logo/initials, not a team login */}
                <button
                    type="button"
                    onClick={() => setActiveSection("overview")}
                    title={clientName || "Client"}
                    className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                >
                    {content.logo_url ? (
                        <img src={content.logo_url} alt={`${clientName || "Client"} logo`} className="size-full object-cover" draggable={false} />
                    ) : (
                        clientInitials || <Image01 className="size-4 text-fg-quaternary" aria-hidden="true" />
                    )}
                </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* ── Client side menu (no icon rail — client-facing) ── */}
            <aside className="flex w-full shrink-0 flex-col border-b border-secondary bg-primary md:h-full md:w-64 md:border-b-0 md:border-r">
                {/* Client identity */}
                <div className="flex items-center gap-3 border-b border-secondary px-4 py-4 md:px-5">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-secondary">
                        {content.logo_url ? (
                            <img src={content.logo_url} alt={`${clientName || "Client"} logo`} className="size-full object-contain p-1" draggable={false} />
                        ) : (
                            <Image01 className="size-5 text-fg-quaternary" aria-hidden="true" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">{clientName || "Client Name"}</p>
                        <BadgeWithDot color={statusColor(content.status)} size="sm" type="pill-color">
                            {content.status}
                        </BadgeWithDot>
                    </div>
                </div>

                {/* Overview — sits above the funnel groups, not a funnel stage itself */}
                <div className="p-3 pb-0 md:pb-0">
                    <button
                        type="button"
                        onClick={() => setActiveSection("overview")}
                        className={cx(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-100 ease-linear",
                            activeSection === "overview"
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                : "text-secondary hover:bg-secondary hover:text-primary",
                        )}
                    >
                        <OVERVIEW_ITEM.icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{OVERVIEW_ITEM.label}</span>
                    </button>
                </div>

                {/* Funnel groups — Foundation → Top → Middle → Bottom, the same mental model
                    Dustin walks every client through on the onboarding call. */}
                <motion.nav
                    className="flex-1 overflow-y-auto p-3 md:overflow-y-auto"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                >
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} className="mt-4 first:mt-1">
                            <p className={cx("mb-1 px-3 text-[11px] font-bold uppercase tracking-wide", FUNNEL_STAGES[group.stage].text)}>{group.label}</p>
                            <div className="flex flex-col gap-0.5">
                                {group.items.map((s) => (
                                    <motion.button
                                        key={s.id}
                                        type="button"
                                        onClick={() => !s.soon && setActiveSection(s.id)}
                                        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                                        className={cx(
                                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-100 ease-linear",
                                            activeSection === s.id
                                                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                : s.soon
                                                  ? "cursor-not-allowed text-quaternary opacity-60"
                                                  : "text-secondary hover:bg-secondary hover:text-primary",
                                        )}
                                    >
                                        <s.icon className="size-4 shrink-0" aria-hidden="true" />
                                        <span className="flex-1">{s.label}</span>
                                        {s.soon && <span className="text-[10px] font-semibold uppercase text-quaternary">Soon</span>}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))}
                </motion.nav>

                {/* Website link */}
                {websiteHref && (
                    <div className="hidden border-t border-secondary p-4 md:block">
                        <Button href={websiteHref} target="_blank" rel="noopener noreferrer" color="secondary" size="sm" iconTrailing={LinkExternal01} className="w-full">
                            Visit website
                        </Button>
                    </div>
                )}
            </aside>

            {/* ── Main (scrolls) ── */}
            <div className="min-w-0 flex-1 overflow-y-auto">
            {/* The flow builder gets the full width while editing; everything else keeps the reading width. */}
            <div className={cx("mx-auto w-full px-4 py-6 md:px-8 md:py-10", activeSection === "flow" && !isLocked ? "max-w-[1500px]" : "max-w-4xl")}>
            <motion.article
                className="w-full rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={cx("px-6 py-8", activeSection === "flow" && !isLocked ? "md:px-8 md:py-10" : "md:px-12 md:py-12")}>
                    {/* ── Template banner — prompts the team to spin up a client copy. ── */}
                    {isTemplate && (
                        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-50 px-4 py-3 dark:bg-brand-950/30">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                                    Template
                                </span>
                                <p className="text-[13px] font-medium text-brand-800 dark:text-brand-200">
                                    This is the master template. Create a private copy to share with a client.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handlePlusClick}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                Create dashboard for the client
                            </button>
                        </div>
                    )}

                    {/* ── Hero (Client Overview only — the side menu carries identity elsewhere) ── */}
                    {activeSection === "overview" && (
                    <>
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            {/* Logo */}
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary ring-1 ring-secondary md:size-16">
                                {content.logo_url ? (
                                    <img src={content.logo_url} alt={`${clientName || "Client"} logo`} className="size-full object-contain p-1.5" draggable={false} />
                                ) : (
                                    <Image01 className="size-6 text-fg-quaternary" aria-hidden="true" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {isLocked ? (
                                        <h1 className="truncate text-display-xs font-semibold tracking-tight text-primary md:text-display-sm">
                                            {clientName || "Client Name"}
                                        </h1>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Client Name"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className={editInput("max-w-60 text-md font-semibold")}
                                        />
                                    )}
                                    <BadgeWithDot color={statusColor(content.status)} size="md" type="pill-color">
                                        {content.status}
                                    </BadgeWithDot>
                                </div>
                                <p className="mt-1 text-sm text-tertiary">Your business hub — prepared by the HiddenGem Team.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isLocked ? (
                                websiteHref && (
                                    <Button href={websiteHref} target="_blank" rel="noopener noreferrer" color="secondary" size="sm" iconTrailing={LinkExternal01}>
                                        Visit website
                                    </Button>
                                )
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Client Website"
                                    value={clientWebsite}
                                    onChange={(e) => setClientWebsite(e.target.value)}
                                    className={editInput("max-w-52")}
                                />
                            )}
                        </div>
                    </header>

                    {/* Edit-only hero controls: logo URL + status */}
                    {!isLocked && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-secondary p-3">
                            <input
                                type="text"
                                placeholder="Logo image URL"
                                value={content.logo_url}
                                onChange={(e) => setContent((c) => ({ ...c, logo_url: e.target.value }))}
                                className={editInput("max-w-80")}
                            />
                            <div className="flex items-center gap-1.5">
                                {STATUS_OPTIONS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setContent((c) => ({ ...c, status: s }))}
                                        className={cx(
                                            "rounded-full px-3 py-1 text-xs font-medium transition duration-100 ease-linear",
                                            content.status === s
                                                ? "bg-brand-solid text-white"
                                                : "bg-primary text-tertiary ring-1 ring-secondary hover:text-secondary",
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* How we grow your bookings — the same funnel Dustin walks every client
                        through on the onboarding call. Foundation feeds Top → Middle → Bottom;
                        clicking a card jumps straight to that stage's first section. */}
                    <div className="mt-10">
                        <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-border-secondary" />
                            <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-quaternary">How we grow your bookings</p>
                            <span className="h-px flex-1 bg-border-secondary" />
                        </div>
                        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-tertiary">
                            Everything below fits one funnel — start with your Foundation, then work top to bottom.
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { stage: "foundation" as const, title: "Your Master Document", body: "Persona, tone, FAQs, amenities — the source everything else reads from." },
                                { stage: "top" as const, title: "Get seen", body: "Your website and Instagram bring new guests in." },
                                { stage: "middle" as const, title: "Nurture", body: "Welcome emails and chat build trust and answer questions." },
                                { stage: "bottom" as const, title: "Convert", body: "GoHighLevel and your results — turning interest into direct bookings." },
                            ].map((card) => {
                                const targetId = card.stage === "foundation" ? "foundation" : NAV_GROUPS.find((g) => g.stage === card.stage)!.items[0].id;
                                return (
                                    <button
                                        key={card.stage}
                                        type="button"
                                        onClick={() => setActiveSection(targetId)}
                                        className="rounded-xl p-5 text-left ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                    >
                                        <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", FUNNEL_STAGES[card.stage].bg, FUNNEL_STAGES[card.stage].text)}>
                                            {FUNNEL_STAGES[card.stage].label}
                                        </span>
                                        <p className="mt-3 text-sm font-semibold text-primary">{card.title}</p>
                                        <p className="mt-1 text-xs text-tertiary">{card.body}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    </>
                    )}

                    {/* ── Section content (driven by the side menu) ── */}
                    <div className="mt-10">
                        <div className="min-w-0">
                            {activeSection === "flow" && (
                                <WelcomeFlowSection slug={slug} clientName={clientName} isLocked={isLocked} isTemplate={isTemplate} />
                            )}

                            {/* ── Master Document — the Foundation everything downstream reads from ── */}
                            {activeSection === "foundation" && (
                                <Reveal>
                                    <SectionEyebrow stage="foundation" />
                                    <SectionHeading>Master Document</SectionHeading>
                                    <p className="mt-3 text-md text-tertiary">
                                        This is where it starts. Everyone — you, your team, and ours — keeps this updated. It's what your
                                        Welcome Emails, chat widget, and every future AI feature read from, so the more complete it is,
                                        the smarter everything downstream gets.
                                    </p>

                                    <div className="mt-6 flex flex-col gap-6">
                                        {(
                                            [
                                                { key: "propertyBasics", label: "Property basics", hint: "Name, type, location, vibe.", placeholder: "e.g. Oceanview Cottage — a 3-bed boutique rental on the Big Sur coast, rustic-luxury vibe." },
                                                { key: "persona", label: "Ideal guest persona", hint: "Who books, why they come, what they care about.", placeholder: "e.g. Couples celebrating an anniversary, mid-30s to 50s, want privacy + a view, not big groups." },
                                                { key: "toneOfVoice", label: "Tone of voice", hint: "How your brand talks.", placeholder: "e.g. Warm and personal, a little playful — never corporate." },
                                                { key: "amenities", label: "Amenities & house rules", hint: "What's included, what's not allowed.", placeholder: "e.g. Hot tub, full kitchen, pet-friendly. No parties, quiet hours after 10pm." },
                                                { key: "localRecommendations", label: "Local recommendations", hint: "Food, activities, hidden gems.", placeholder: "e.g. Nepenthe for sunset dinner, McWay Falls trail, Big Sur Bakery for breakfast." },
                                                { key: "bookingLinks", label: "Booking & upsell links", hint: "Where guests book, and anything you'd like to upsell.", placeholder: "e.g. Book direct at oceanviewcottage.com/book — ask about our late-checkout add-on." },
                                            ] as const
                                        ).map((f) => (
                                            <div key={f.key}>
                                                <p className="text-sm font-semibold text-primary">{f.label}</p>
                                                <p className="mt-0.5 text-xs text-tertiary">{f.hint}</p>
                                                {isLocked ? (
                                                    foundation[f.key] ? (
                                                        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-secondary px-4 py-3 text-sm text-secondary">{foundation[f.key]}</p>
                                                    ) : (
                                                        <p className="mt-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm italic text-quaternary">Not filled in yet.</p>
                                                    )
                                                ) : (
                                                    <textarea
                                                        rows={2}
                                                        placeholder={f.placeholder}
                                                        value={foundation[f.key]}
                                                        onChange={(e) => patchFoundation({ [f.key]: e.target.value })}
                                                        className={cx(editInput(), "mt-2 resize-y")}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* FAQ bank — client & AM can both add */}
                                    <div className="mt-8 border-t border-secondary pt-6">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="size-4 text-fg-quaternary" aria-hidden="true" />
                                            <p className="text-sm font-semibold text-primary">FAQ bank</p>
                                        </div>
                                        <p className="mt-0.5 text-xs text-tertiary">Questions guests ask often — the chat widget answers straight from this list.</p>

                                        <div className="mt-4 flex flex-col gap-3">
                                            {foundation.faqs.length === 0 && isLocked && (
                                                <p className="rounded-xl border border-dashed border-secondary px-4 py-3 text-sm italic text-quaternary">No FAQs yet.</p>
                                            )}
                                            {foundation.faqs.map((f, i) =>
                                                isLocked ? (
                                                    <div key={f.id} className="rounded-xl p-4 ring-1 ring-secondary">
                                                        <p className="text-sm font-semibold text-primary">{f.question || "Untitled question"}</p>
                                                        <p className="mt-1 text-sm text-tertiary">{f.answer || "No answer yet."}</p>
                                                    </div>
                                                ) : (
                                                    <div key={f.id} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                                        <div className="flex items-center gap-1.5">
                                                            <input type="text" placeholder="Question" value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} className={editInput("font-semibold")} />
                                                            <button type="button" title="Remove FAQ" onClick={() => patchFoundation({ faqs: foundation.faqs.filter((_, j) => j !== i) })} className={removeButton}>
                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                        <textarea rows={2} placeholder="Answer" value={f.answer} onChange={(e) => updateFaq(i, { answer: e.target.value })} className={cx(editInput(), "resize-y text-xs")} />
                                                    </div>
                                                ),
                                            )}
                                            {!isLocked && (
                                                <button
                                                    type="button"
                                                    onClick={() => patchFoundation({ faqs: [...foundation.faqs, { id: uid(), question: "", answer: "" }] })}
                                                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                                >
                                                    <Plus className="size-4" aria-hidden="true" />
                                                    Add FAQ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Reveal>
                            )}

                            {/* ── Brand Kit ── */}
                            {activeSection === "brand" && (
                    <Reveal>
                        <SectionEyebrow stage="foundation" />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <SectionHeading>Brand Kit</SectionHeading>
                            {isLocked ? (
                                content.brand.folder_link && (
                                    <Button
                                        href={content.brand.folder_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="link-color"
                                        size="md"
                                        iconTrailing={LinkExternal01}
                                    >
                                        Open brand folder
                                    </Button>
                                )
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Brand folder link (Drive / Canva)"
                                    value={content.brand.folder_link}
                                    onChange={(e) => patchBrand({ folder_link: e.target.value })}
                                    className={editInput("max-w-80")}
                                />
                            )}
                        </div>
                        <p className="mt-3 text-md text-tertiary">
                            Your official colors and typography. Use these everywhere so your brand stays consistent.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {content.brand.colors.map((color, i) => (
                                <div key={i} className="overflow-hidden rounded-xl ring-1 ring-secondary">
                                    <div className="h-20" style={{ backgroundColor: color.hex }} />
                                    <div className="p-3">
                                        {isLocked ? (
                                            <>
                                                <p className="text-sm font-semibold text-primary">{color.name}</p>
                                                <p className="mt-0.5 font-mono text-xs uppercase text-tertiary">{color.hex}</p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col gap-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={color.name}
                                                    onChange={(e) => updateColor(i, { name: e.target.value })}
                                                    className={editInput("px-2 py-1 text-xs")}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="text"
                                                        placeholder="#000000"
                                                        value={color.hex}
                                                        onChange={(e) => updateColor(i, { hex: e.target.value })}
                                                        className={editInput("px-2 py-1 font-mono text-xs")}
                                                    />
                                                    <button
                                                        type="button"
                                                        title="Remove color"
                                                        onClick={() => patchBrand({ colors: content.brand.colors.filter((_, j) => j !== i) })}
                                                        className={removeButton}
                                                    >
                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!isLocked && (
                                <button
                                    type="button"
                                    onClick={() => patchBrand({ colors: [...content.brand.colors, { name: "New color", hex: "#888888" }] })}
                                    className="flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                >
                                    <Plus className="size-5" aria-hidden="true" />
                                    Add color
                                </button>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                            <span className="text-sm font-medium text-secondary">Fonts:</span>
                            {isLocked ? (
                                <span className="text-sm text-tertiary">{content.brand.fonts || "—"}</span>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="e.g. Inter, Playfair Display"
                                    value={content.brand.fonts}
                                    onChange={(e) => patchBrand({ fonts: e.target.value })}
                                    className={editInput("max-w-72")}
                                />
                            )}
                        </div>
                    </Reveal>
                            )}

                            {/* ── Instagram Highlights ── */}
                            {activeSection === "instagram" && (
                    <Reveal>
                        <SectionEyebrow stage="top" />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <SectionHeading>Instagram Highlights</SectionHeading>
                            {isLocked ? (
                                content.instagram.profile_url && (
                                    <Button
                                        href={content.instagram.profile_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="link-color"
                                        size="md"
                                        iconTrailing={LinkExternal01}
                                    >
                                        View profile
                                    </Button>
                                )
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Instagram profile URL"
                                    value={content.instagram.profile_url}
                                    onChange={(e) => patchInstagram({ profile_url: e.target.value })}
                                    className={editInput("max-w-80")}
                                />
                            )}
                        </div>
                        <p className="mt-3 text-md text-tertiary">
                            Your highlight covers, ready to download and add to your Instagram profile.
                        </p>

                        {content.instagram.highlights.length === 0 && isLocked ? (
                            <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary px-4 py-5">
                                <Instagram className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                <p className="text-sm text-tertiary">Highlight covers are on the way — the HiddenGem team will add them here.</p>
                            </div>
                        ) : (
                            <div className="mt-6 flex flex-wrap gap-5">
                                {content.instagram.highlights.map((h, i) => (
                                    <div key={i} className="flex w-24 flex-col items-center gap-2">
                                        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-secondary p-0.5 ring-2 ring-secondary">
                                            {h.image_url ? (
                                                <img src={h.image_url} alt={h.title} className="size-full rounded-full object-cover" draggable={false} />
                                            ) : (
                                                <Image01 className="size-6 text-fg-quaternary" aria-hidden="true" />
                                            )}
                                        </div>
                                        {isLocked ? (
                                            <p className="w-full truncate text-center text-xs font-medium text-secondary">{h.title}</p>
                                        ) : (
                                            <div className="flex w-full flex-col gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="Title"
                                                    value={h.title}
                                                    onChange={(e) => updateHighlight(i, { title: e.target.value })}
                                                    className={editInput("px-2 py-1 text-center text-xs")}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Image URL"
                                                    value={h.image_url}
                                                    onChange={(e) => updateHighlight(i, { image_url: e.target.value })}
                                                    className={editInput("px-2 py-1 text-xs")}
                                                />
                                                <button
                                                    type="button"
                                                    title="Remove highlight"
                                                    onClick={() => patchInstagram({ highlights: content.instagram.highlights.filter((_, j) => j !== i) })}
                                                    className={cx(removeButton, "self-center")}
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!isLocked && (
                                    <button
                                        type="button"
                                        onClick={() => patchInstagram({ highlights: [...content.instagram.highlights, { title: "New", image_url: "" }] })}
                                        className="flex size-20 items-center justify-center rounded-full border border-dashed border-secondary text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                        title="Add highlight"
                                    >
                                        <Plus className="size-5" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}
                    </Reveal>
                            )}

                            {/* ── GoHighLevel Setup ── */}
                            {activeSection === "ghl" && (
                    <Reveal>
                        <SectionEyebrow stage="bottom" />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <SectionHeading>GoHighLevel Setup</SectionHeading>
                            {isLocked ? (
                                content.ghl.login_url && (
                                    <Button
                                        href={content.ghl.login_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        color="link-color"
                                        size="md"
                                        iconTrailing={LinkExternal01}
                                    >
                                        Log in to GoHighLevel
                                    </Button>
                                )
                            ) : (
                                <input
                                    type="text"
                                    placeholder="GHL login URL"
                                    value={content.ghl.login_url}
                                    onChange={(e) => patchGhl({ login_url: e.target.value })}
                                    className={editInput("max-w-80")}
                                />
                            )}
                        </div>
                        <p className="mt-3 text-md text-tertiary">
                            Everything we're configuring in your CRM. Ticked items are live.
                        </p>

                        <div className="mt-6 flex flex-col items-center gap-8 rounded-xl p-6 ring-1 ring-secondary md:flex-row md:items-start">
                            <div className="shrink-0 pt-1">
                                <ProgressBarCircle
                                    value={ghlDone}
                                    max={Math.max(ghlTotal, 1)}
                                    size="xs"
                                    label="Setup progress"
                                    valueFormatter={(_, pct) => `${pct}%`}
                                />
                                <p className="mt-2 text-center text-xs font-medium text-tertiary">
                                    {ghlDone} of {ghlTotal} complete
                                </p>
                            </div>

                            <ul className="grid w-full gap-2.5 md:grid-cols-2">
                                {content.ghl.items.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            disabled={isLocked}
                                            onClick={() => updateGhlItem(i, { done: !item.done })}
                                            title={isLocked ? undefined : "Toggle status"}
                                            className={cx(
                                                "flex size-5 shrink-0 items-center justify-center rounded-full transition duration-100 ease-linear",
                                                item.done ? "bg-brand-solid text-white" : "ring-1 ring-inset ring-primary text-transparent",
                                                isLocked ? "cursor-default" : "cursor-pointer hover:opacity-80",
                                            )}
                                        >
                                            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                                        </button>
                                        {isLocked ? (
                                            <span className={cx("text-sm", item.done ? "text-primary" : "text-tertiary")}>{item.label}</span>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => updateGhlItem(i, { label: e.target.value })}
                                                    className={editInput("px-2 py-1 text-sm")}
                                                />
                                                <button
                                                    type="button"
                                                    title="Remove item"
                                                    onClick={() => patchGhl({ items: content.ghl.items.filter((_, j) => j !== i) })}
                                                    className={removeButton}
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                                {!isLocked && (
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => patchGhl({ items: [...content.ghl.items, { label: "New setup item", done: false }] })}
                                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                        >
                                            <Plus className="size-4" aria-hidden="true" />
                                            Add item
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </Reveal>
                            )}

                            {/* ── Revenue & Results ── */}
                            {activeSection === "revenue" && (
                    <Reveal>
                        <SectionEyebrow stage="bottom" />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <SectionHeading>Revenue &amp; Results</SectionHeading>
                            {!isLocked && (
                                <input
                                    type="text"
                                    placeholder="Currency (e.g. USD)"
                                    value={content.revenue.currency}
                                    onChange={(e) => patchRevenue({ currency: e.target.value.toUpperCase() })}
                                    className={editInput("max-w-36 uppercase")}
                                />
                            )}
                        </div>
                        <p className="mt-3 text-md text-tertiary">
                            Results from your campaigns, updated monthly by the HiddenGem team.
                        </p>

                        {months.length === 0 && isLocked ? (
                            <div className="mt-6 rounded-xl bg-secondary px-4 py-6 text-center">
                                <p className="text-sm text-tertiary">No results yet — your first month's numbers will appear here.</p>
                            </div>
                        ) : (
                            <>
                                {/* Stat tiles */}
                                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                                    <StatTile
                                        label="This month"
                                        value={latest ? fmtMoney(latest.revenue) : "—"}
                                        change={
                                            momChange !== null ? (
                                                <BadgeWithIcon
                                                    iconLeading={momChange >= 0 ? ArrowUp : ArrowDown}
                                                    color={momChange >= 0 ? "success" : "error"}
                                                    size="md"
                                                >
                                                    {`${Math.abs(momChange).toFixed(0)}%`}
                                                </BadgeWithIcon>
                                            ) : undefined
                                        }
                                    />
                                    <StatTile label="Total revenue" value={fmtMoney(totalRevenue)} />
                                    <StatTile label="Leads captured" value={totalLeads.toLocaleString()} />
                                    <StatTile label="Appointments booked" value={totalAppointments.toLocaleString()} />
                                </div>

                                {/* Revenue bar chart — single series, brand hue, tooltip on hover */}
                                {months.length > 0 && (
                                    <div className="mt-6 rounded-xl p-5 ring-1 ring-secondary">
                                        <p className="text-sm font-semibold text-primary">Monthly revenue</p>
                                        <div className="mt-4 h-72 w-full text-quaternary">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                                    <CartesianGrid vertical={false} stroke="currentColor" className="text-border-tertiary" />
                                                    <XAxis
                                                        dataKey="month"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: "currentColor", fontSize: 12 }}
                                                        dy={6}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={44}
                                                        tick={{ fill: "currentColor", fontSize: 12 }}
                                                        tickFormatter={(v: number) => fmtCompact(v)}
                                                    />
                                                    <RechartsTooltip
                                                        cursor={{ fill: "currentColor", opacity: 0.06 }}
                                                        content={
                                                            <ChartTooltipContent
                                                                formatter={(value) => fmtMoney(Number(value))}
                                                            />
                                                        }
                                                    />
                                                    <Bar
                                                        dataKey="revenue"
                                                        name="Revenue"
                                                        className="fill-utility-brand-600"
                                                        radius={[4, 4, 0, 0]}
                                                        maxBarSize={32}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Edit-only data table */}
                                {!isLocked && (
                                    <div className="mt-6 overflow-x-auto rounded-xl p-4 ring-1 ring-secondary">
                                        <div className="grid min-w-120 grid-cols-[1fr_1fr_1fr_1fr_2.5rem] items-center gap-2">
                                            {["Month", "Revenue", "Leads", "Appointments", ""].map((h) => (
                                                <span key={h} className="px-1 text-xs font-semibold text-quaternary">{h}</span>
                                            ))}
                                            {months.map((m, i) => (
                                                <div key={i} className="col-span-5 grid grid-cols-subgrid items-center">
                                                    <input type="text" placeholder="Jul" value={m.month} onChange={(e) => updateMonth(i, { month: e.target.value })} className={editInput()} />
                                                    <input type="number" value={m.revenue} onChange={(e) => updateMonth(i, { revenue: Number(e.target.value) || 0 })} className={editInput()} />
                                                    <input type="number" value={m.leads} onChange={(e) => updateMonth(i, { leads: Number(e.target.value) || 0 })} className={editInput()} />
                                                    <input type="number" value={m.appointments} onChange={(e) => updateMonth(i, { appointments: Number(e.target.value) || 0 })} className={editInput()} />
                                                    <button type="button" title="Remove month" onClick={() => patchRevenue({ months: months.filter((_, j) => j !== i) })} className={removeButton}>
                                                        <Trash01 className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => patchRevenue({ months: [...months, { month: "", revenue: 0, leads: 0, appointments: 0 }] })}
                                            className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-brand-secondary"
                                        >
                                            <Plus className="size-4" aria-hidden="true" />
                                            Add month
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </Reveal>
                            )}

                            {/* ── Website — top-of-funnel tools embedded on your own site ── */}
                            {activeSection === "website" && (
                    <Reveal>
                        <SectionEyebrow stage="top" />
                        <SectionHeading>Website</SectionHeading>
                        <p className="mt-3 text-md text-tertiary">
                            Your site is the first real impression — these are the tools we've set up on it to turn visitors into leads.
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {websiteLinks.map((link, i) =>
                                isLocked ? (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target={link.url.startsWith("/") ? undefined : "_blank"}
                                        rel={link.url.startsWith("/") ? undefined : "noopener noreferrer"}
                                        className="group rounded-xl p-5 ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <FeaturedIcon icon={ArrowUpRight} size="sm" color="brand" theme="light" />
                                            <ArrowUpRight className="size-4 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover:opacity-100" aria-hidden="true" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-primary">{link.title}</p>
                                        <p className="mt-1 text-sm text-tertiary">{link.description}</p>
                                    </a>
                                ) : (
                                    <div key={i} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                        <div className="flex items-center gap-1.5">
                                            <input type="text" placeholder="Title" value={link.title} onChange={(e) => updateLink(link, { title: e.target.value })} className={editInput("font-semibold")} />
                                            <button type="button" title="Remove link" onClick={() => removeLink(link)} className={removeButton}>
                                                <Trash01 className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <input type="text" placeholder="Description" value={link.description} onChange={(e) => updateLink(link, { description: e.target.value })} className={editInput("text-xs")} />
                                        <input type="text" placeholder="/acme-metapixel or https://…" value={link.url} onChange={(e) => updateLink(link, { url: e.target.value })} className={editInput("font-mono text-xs")} />
                                    </div>
                                ),
                            )}
                            {!isLocked && (
                                <button
                                    type="button"
                                    onClick={() => setContent((c) => ({ ...c, links: [...c.links, { title: "New page", description: "", url: "" }] }))}
                                    className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                >
                                    <Plus className="size-5" aria-hidden="true" />
                                    Add link
                                </button>
                            )}
                        </div>
                    </Reveal>
                            )}

                            {/* ── Chat Widget — middle-of-funnel, answers guest questions from the Master Document ── */}
                            {activeSection === "chatwidget" && (
                    <Reveal>
                        <SectionEyebrow stage="middle" />
                        <SectionHeading>Chat Widget</SectionHeading>
                        <p className="mt-3 text-md text-tertiary">
                            An AI chat on your website that answers guest questions instantly, straight from your Master Document's
                            FAQ bank — so no question goes unanswered while you're offline.
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {chatWidgetLinks.length === 0 && isLocked && (
                                <p className="rounded-xl border border-dashed border-secondary px-4 py-5 text-sm italic text-quaternary sm:col-span-2">
                                    Your chat widget setup guide will appear here once it's ready.
                                </p>
                            )}
                            {chatWidgetLinks.map((link, i) =>
                                isLocked ? (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target={link.url.startsWith("/") ? undefined : "_blank"}
                                        rel={link.url.startsWith("/") ? undefined : "noopener noreferrer"}
                                        className="group rounded-xl p-5 ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <FeaturedIcon icon={MessageChatCircle} size="sm" color="brand" theme="light" />
                                            <ArrowUpRight className="size-4 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover:opacity-100" aria-hidden="true" />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-primary">{link.title}</p>
                                        <p className="mt-1 text-sm text-tertiary">{link.description}</p>
                                    </a>
                                ) : (
                                    <div key={i} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                        <div className="flex items-center gap-1.5">
                                            <input type="text" placeholder="Title" value={link.title} onChange={(e) => updateLink(link, { title: e.target.value })} className={editInput("font-semibold")} />
                                            <button type="button" title="Remove link" onClick={() => removeLink(link)} className={removeButton}>
                                                <Trash01 className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <input type="text" placeholder="Description" value={link.description} onChange={(e) => updateLink(link, { description: e.target.value })} className={editInput("text-xs")} />
                                        <input type="text" placeholder="/acme-chatwidget" value={link.url} onChange={(e) => updateLink(link, { url: e.target.value })} className={editInput("font-mono text-xs")} />
                                    </div>
                                ),
                            )}
                            {!isLocked && (
                                <button
                                    type="button"
                                    onClick={() => setContent((c) => ({ ...c, links: [...c.links, { title: "Chat Widget", description: "", url: slug ? `/${slug}-chatwidget` : "" }] }))}
                                    className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                >
                                    <Plus className="size-5" aria-hidden="true" />
                                    Add link
                                </button>
                            )}
                        </div>
                    </Reveal>
                            )}

                            {/* ── Video Guides ── */}
                            {activeSection === "videos" && (
                        <Reveal>
                            <SectionEyebrow stage="foundation" />
                            <SectionHeading>Video Guides</SectionHeading>
                            <p className="mt-3 text-md text-tertiary">
                                Short walkthrough videos recorded for you by the HiddenGem team.
                            </p>

                            {isLocked ? (
                                videoGuides.some((v) => v.url) ? (
                                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                        {videoGuides
                                            .filter((v) => v.url)
                                            .map((v) => (
                                                <div key={v.id}>
                                                    <p className="text-sm font-semibold text-primary">{v.title}</p>
                                                    <VideoEmbed url={v.url} className="mt-3" />
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="mt-6 rounded-xl border border-dashed border-secondary px-4 py-5 text-sm italic text-quaternary">No videos yet.</p>
                                )
                            ) : (
                                <div className="mt-6 flex flex-col gap-4">
                                    {videoGuides.map((v, i) => (
                                        <div key={v.id} className="flex flex-col gap-1.5 rounded-xl p-4 ring-1 ring-secondary">
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    placeholder="Video title"
                                                    value={v.title}
                                                    onChange={(e) => updateVideo(i, { title: e.target.value })}
                                                    className={editInput("font-semibold")}
                                                />
                                                <button
                                                    type="button"
                                                    title="Remove video"
                                                    onClick={() => setContent((c) => ({ ...c, videos: (c.videos ?? []).filter((_, j) => j !== i) }))}
                                                    className={removeButton}
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                            <VideoAttach value={v.url || undefined} onChange={(url) => updateVideo(i, { url: url ?? "" })} />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setContent((c) => ({
                                                ...c,
                                                videos: [...(c.videos ?? []), { id: crypto.randomUUID(), title: "", url: "" }],
                                            }))
                                        }
                                        className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-secondary text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                                    >
                                        <Plus className="size-5" aria-hidden="true" />
                                        Add video
                                    </button>
                                </div>
                            )}
                        </Reveal>
                    )}

                            {/* ── Communication Log — not built yet, nav item is disabled ── */}
                            {activeSection === "comms" && (
                                <Reveal>
                                    <SectionEyebrow stage="foundation" />
                                    <SectionHeading>Communication Log</SectionHeading>
                                    <p className="mt-3 text-md text-tertiary">Coming soon — a shared log of calls and updates between you and your Account Manager.</p>
                                </Reveal>
                            )}

                            {/* ── Still need support? (Overview only) ── */}
                            {activeSection === "overview" && (
                    <Reveal className="mt-16">
                        <div className="flex items-center gap-3">
                            <FeaturedIcon icon={MessageChatCircle} size="sm" color="brand" theme="dark" />
                            <span className="h-px flex-1 bg-border-secondary" />
                        </div>
                        <h2 className="mt-4 text-display-xs font-semibold text-primary md:text-display-sm">
                            Questions about your dashboard?
                        </h2>

                        <div className="mt-5 rounded-2xl bg-secondary px-6 py-8 text-center md:px-10 md:py-10">
                            <h3 className="text-lg font-semibold text-primary">Contact us</h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-tertiary">
                                Our team is here to help. Reach out to HiddenGem about your brand, setup, or results anytime.
                            </p>
                            <div className="mt-5 flex justify-center">
                                <Button href={CONTACT_MAILTO} size="lg" color="primary" iconTrailing={ArrowRight}>
                                    Contact HiddenGem Team
                                </Button>
                            </div>
                        </div>
                    </Reveal>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <footer className="mt-14 flex justify-center border-t border-secondary pt-6">
                        <a href="https://hiddengem.media/" target="_blank" rel="noopener noreferrer">
                            <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-14 opacity-60 transition duration-100 ease-linear hover:opacity-90 dark:hidden" draggable={false} />
                            <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-14 opacity-70 transition duration-100 ease-linear hover:opacity-100 dark:block" draggable={false} />
                        </a>
                    </footer>
                </div>
            </motion.article>
            </div>
            </div>
            </div>

            {/* ── Fixed bottom-right action buttons — HGM team only (clients never see these) ── */}
            {isTeam && (
            <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-2">
                {/* Plus — only on the template page (/client-dashboard) */}
                {isTemplate && (
                    <button
                        type="button"
                        onClick={handlePlusClick}
                        title="Create new client dashboard"
                        className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                    </button>
                )}

                {/* Lock / Unlock */}
                <button
                    type="button"
                    onClick={handleLockClick}
                    title={isLocked ? "Unlock content" : "Lock content"}
                    className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-secondary text-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                >
                    {isLocked ? (
                        <Lock01 className="size-4" aria-hidden="true" />
                    ) : (
                        <LockUnlocked01 className="size-4" aria-hidden="true" />
                    )}
                </button>
            </div>
            )}

            {/* ═══════════════════════════════════════════════
                Unlock Modal
            ════════════════════════════════════════════════ */}
            {showUnlockModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowUnlockModal(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-md font-semibold text-primary">Unlock Content</h3>
                                <p className="mt-1 text-sm text-tertiary">Enter the password to edit this dashboard.</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setShowUnlockModal(false)}
                                className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                            >
                                <XClose className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <input
                                type="password"
                                placeholder="Password"
                                value={unlockPassword}
                                onChange={(e) => {
                                    setUnlockPassword(e.target.value);
                                    setUnlockError(false);
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                                ref={(el) => el?.focus({ preventScroll: true })}
                                className={cx(
                                    "w-full rounded-lg border px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
                                    unlockError
                                        ? "border-error-primary ring-1 ring-error-primary"
                                        : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                                )}
                            />
                            {unlockError && (
                                <p className="mt-1.5 text-xs text-error-primary">Incorrect password. Please try again.</p>
                            )}
                        </div>

                        <div className="mt-4 flex gap-3">
                            <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowUnlockModal(false)}>
                                Cancel
                            </Button>
                            <Button color="primary" size="sm" className="flex-1" onClick={handleUnlock}>
                                Unlock
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                Plus Wizard Modal
            ════════════════════════════════════════════════ */}
            {showPlusModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    onClick={(e) => e.target === e.currentTarget && setShowPlusModal(false)}
                >
                    <div className="w-full max-w-sm rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary">
                        {/* Step 1 — Password */}
                        {plusStep === "password" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Dashboard</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the admin password to continue.</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={plusPassword}
                                        onChange={(e) => {
                                            setPlusPassword(e.target.value);
                                            setPlusPasswordError(false);
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handlePlusPassword()}
                                        ref={(el) => el?.focus({ preventScroll: true })}
                                        className={cx(
                                            "w-full rounded-lg border px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
                                            plusPasswordError
                                                ? "border-error-primary ring-1 ring-error-primary"
                                                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                                        )}
                                    />
                                    {plusPasswordError && (
                                        <p className="mt-1.5 text-xs text-error-primary">
                                            Incorrect password. Please try again.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button color="primary" size="sm" className="flex-1" onClick={handlePlusPassword}>
                                        Continue
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2 — Client details */}
                        {plusStep === "details" && (
                            <>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-md font-semibold text-primary">Create Client Dashboard</h3>
                                        <p className="mt-1 text-sm text-tertiary">Enter the client details. Sections can be filled in after.</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setShowPlusModal(false)}
                                        className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary"
                                    >
                                        <XClose className="size-4" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-col gap-3">
                                    <div>
                                        <label htmlFor="new-dashboard-client-name" className="mb-1.5 block text-sm font-medium text-secondary">Client Name</label>
                                        <input
                                            id="new-dashboard-client-name"
                                            type="text"
                                            placeholder="e.g. Acme Corp"
                                            value={newClientName}
                                            onChange={(e) => setNewClientName(e.target.value)}
                                            autoFocus
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="new-dashboard-client-website" className="mb-1.5 block text-sm font-medium text-secondary">Client Website URL</label>
                                        <input
                                            id="new-dashboard-client-website"
                                            type="text"
                                            placeholder="e.g. acmecorp.com"
                                            value={newClientWebsite}
                                            onChange={(e) => setNewClientWebsite(e.target.value)}
                                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                                        />
                                    </div>
                                    {newClientName.trim() && (
                                        <p className="text-xs text-tertiary">
                                            Page URL:{" "}
                                            <span className="font-medium text-brand-secondary">
                                                docs-hgm.netlify.app/{slugify(newClientName)}-dashboard
                                            </span>
                                        </p>
                                    )}
                                    {createError && <p className="text-xs text-error-primary">{createError}</p>}
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Button color="secondary" size="sm" className="flex-1" onClick={() => setShowPlusModal(false)} isDisabled={isCreating}>
                                        Cancel
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={handleCreatePage}
                                        isDisabled={!newClientName.trim()}
                                        isLoading={isCreating}
                                        showTextWhileLoading
                                    >
                                        {isCreating ? "Creating…" : "Create Dashboard"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </AppShell>
    );
};
