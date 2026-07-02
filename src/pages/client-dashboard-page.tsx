import { type ReactNode, useEffect, useState } from "react";
// Functional UI icons — Untitled UI PRO, line style (drop-in for the free set).
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    Check,
    Image01,
    LinkExternal01,
    Lock01,
    LockUnlocked01,
    MessageChatCircle,
    Plus,
    Trash01,
    XClose,
} from "@untitledui-pro/icons/line";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { ProgressBarCircle } from "@/components/base/progress-indicators/progress-circles";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Instagram } from "@/components/foundations/social-icons";
import { ChartTooltipContent } from "@/components/application/charts/charts-base";
import { Reveal } from "@/components/shared-assets/reveal";
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
};

/** Fresh content for a newly created client copy — no sample numbers. */
const createDefaultContent = (base: string): DashboardContent => ({
    ...TEMPLATE_CONTENT,
    status: "Onboarding",
    revenue: { currency: "USD", months: [] },
    ghl: { ...TEMPLATE_CONTENT.ghl, items: DEFAULT_GHL_ITEMS.map((i) => ({ ...i })) },
    links: defaultLinks(base),
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
});

const SectionEyebrow = ({ number }: { number: string }) => (
    <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-xs font-semibold text-white tabular-nums">
            {number}
        </span>
        <span className="h-px flex-1 bg-border-secondary" />
    </div>
);

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

    // Editable content
    const [clientName, setClientName] = useState(initialClientName);
    const [clientWebsite, setClientWebsite] = useState(initialClientWebsite);
    const [content, setContent] = useState<DashboardContent>(() => mergeContent(initialData));

    // Lock state
    const [isLocked, setIsLocked] = useState(true);

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

    const updateColor = (i: number, patch: Partial<BrandColor>) =>
        patchBrand({ colors: content.brand.colors.map((col, j) => (j === i ? { ...col, ...patch } : col)) });
    const updateHighlight = (i: number, patch: Partial<Highlight>) =>
        patchInstagram({ highlights: content.instagram.highlights.map((h, j) => (j === i ? { ...h, ...patch } : h)) });
    const updateGhlItem = (i: number, patch: Partial<GhlItem>) =>
        patchGhl({ items: content.ghl.items.map((item, j) => (j === i ? { ...item, ...patch } : item)) });
    const updateMonth = (i: number, patch: Partial<RevenueMonth>) =>
        patchRevenue({ months: content.revenue.months.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
    const updateLink = (i: number, patch: Partial<QuickLink>) =>
        setContent((c) => ({ ...c, links: c.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

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

    const websiteHref = clientWebsite && (clientWebsite.startsWith("http") ? clientWebsite : `https://${clientWebsite}`);

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
        setPlusStep("password");
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
        <main className="min-h-dvh bg-secondary px-4 py-8 md:px-8 md:py-14">
            <motion.article
                className="mx-auto max-w-5xl rounded-2xl bg-primary shadow-xl ring-1 ring-secondary md:rounded-3xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="px-6 py-8 md:px-14 md:py-12">
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

                    {/* ── Hero ── */}
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

                    {/* ── Section 01 — Brand Kit ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="01" />
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

                    {/* ── Section 02 — Instagram Highlights ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="02" />
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

                    {/* ── Section 03 — GoHighLevel Setup ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="03" />
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

                    {/* ── Section 04 — Revenue & Results ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="04" />
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

                    {/* ── Section 05 — Your Pages ── */}
                    <Reveal className="mt-14">
                        <SectionEyebrow number="05" />
                        <SectionHeading>Your Pages</SectionHeading>
                        <p className="mt-3 text-md text-tertiary">
                            Guides and tools we've prepared for your business — all in one place.
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {content.links.map((link, i) =>
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
                                            <input type="text" placeholder="Title" value={link.title} onChange={(e) => updateLink(i, { title: e.target.value })} className={editInput("font-semibold")} />
                                            <button
                                                type="button"
                                                title="Remove link"
                                                onClick={() => setContent((c) => ({ ...c, links: c.links.filter((_, j) => j !== i) }))}
                                                className={removeButton}
                                            >
                                                <Trash01 className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <input type="text" placeholder="Description" value={link.description} onChange={(e) => updateLink(i, { description: e.target.value })} className={editInput("text-xs")} />
                                        <input type="text" placeholder="/acme-metapixel or https://…" value={link.url} onChange={(e) => updateLink(i, { url: e.target.value })} className={editInput("font-mono text-xs")} />
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

                    {/* ── Still need support? ── */}
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

                    {/* ── Footer ── */}
                    <footer className="mt-14 flex justify-center border-t border-secondary pt-6">
                        <a href="https://hiddengem.media/" target="_blank" rel="noopener noreferrer">
                            <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-14 opacity-60 transition duration-100 ease-linear hover:opacity-90 dark:hidden" draggable={false} />
                            <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-14 opacity-70 transition duration-100 ease-linear hover:opacity-100 dark:block" draggable={false} />
                        </a>
                    </footer>
                </div>
            </motion.article>

            {/* ── Fixed bottom-right action buttons ── */}
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
        </main>
    );
};
