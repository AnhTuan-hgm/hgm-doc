import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { IconRail } from "@/components/application/icon-rail";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BookOpen01, Briefcase01, Code02, Image01, Inbox01, LayoutAlt01, Lock01, LockUnlocked01, Mail01, MessageChatCircle, Plus, SearchSm, Send01, Share07, Star01, Trash01, Users01, XClose } from "@untitledui/icons";
import { supabase, type ChatWidgetPageData, type ClientPageData, type LeadCapturePageData, type OverviewCard, type OwnerGuideMeta, type OverviewTab } from "@/lib/supabase";
import { DocsRequestModal } from "@/components/application/docs-request-modal";
import { Avatar } from "@/components/base/avatar/avatar";
import { SettingsDialog } from "@/pages/settings-screen";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

const PASSWORDS = ["ANHTUAN", "HGTEAM"];
const ALLOWED_DOMAIN = "hiddengem.media";

/* Google "G" mark (official multicolor). */
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
);

/* ── Login gate — Google (@hiddengem.media) OR team password ──────── */

interface PasswordGateProps {
    onUnlock: () => void;
    onGoogle: () => void;
    googleError?: string;
    googleLoading?: boolean;
}

const PasswordGate = ({ onUnlock, onGoogle, googleError, googleLoading }: PasswordGateProps) => {
    const [value, setValue] = useState("");
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    const attempt = () => {
        if (PASSWORDS.includes(value)) {
            setSuccess(true);
            setTimeout(onUnlock, 600);
        } else {
            setError(true);
            setValue("");
        }
    };

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4">
            <div
                className={cx(
                    "w-full max-w-sm rounded-2xl bg-primary p-8 shadow-xl ring-1 ring-secondary transition-all duration-500",
                    success && "scale-95 opacity-0",
                )}
            >
                <img src="/hgm logo/Logo ON LIGHT.svg" alt="HiddenGem Media" className="h-14 dark:hidden" draggable={false} />
                <img src="/hgm logo/LOGO ON Dark.svg" alt="HiddenGem Media" className="hidden h-14 dark:block" draggable={false} />

                <div className="mt-6">
                    <h1 className="text-lg font-semibold text-primary">Dashboard Access</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        Sign in with your <span className="font-medium text-secondary">@{ALLOWED_DOMAIN}</span> Google account, or enter the team password.
                    </p>
                </div>

                {/* Option 1 — Google sign-in (domain-restricted) */}
                <button
                    type="button"
                    onClick={onGoogle}
                    disabled={googleLoading}
                    className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-secondary bg-primary px-4 py-2.5 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <GoogleIcon className="size-5" />
                    {googleLoading ? "Redirecting…" : "Continue with Google"}
                </button>
                {googleError && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error-primary">
                        <XClose className="size-3.5 shrink-0" />
                        {googleError}
                    </p>
                )}

                {/* Divider */}
                <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border-secondary" />
                    <span className="text-xs font-medium uppercase tracking-wide text-quaternary">or</span>
                    <span className="h-px flex-1 bg-border-secondary" />
                </div>

                {/* Option 2 — Team master password */}
                <div>
                    <input
                        type="password"
                        placeholder="Team password"
                        value={value}
                        onChange={(e) => { setValue(e.target.value); setError(false); }}
                        onKeyDown={(e) => e.key === "Enter" && attempt()}
                        className={cx(
                            "w-full rounded-lg border px-3 py-2.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear",
                            error
                                ? "border-error-primary ring-1 ring-error-primary"
                                : "border-secondary focus:border-brand focus:ring-1 focus:ring-brand",
                        )}
                    />
                    {error && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error-primary">
                            <XClose className="size-3.5" />
                            Incorrect password. Please try again.
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={attempt}
                    className="mt-4 w-full rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                >
                    {success ? "Unlocking…" : "Unlock with password"}
                </button>
            </div>
        </main>
    );
};

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(iso));
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

/* ── Sidebar ──────────────────────────────────────────────────────── */

interface DeptTab {
    id: string;
    label: string;
    icon: typeof Share07;
}

interface Department {
    id: string;
    short: string;
    header: string;
    icon: typeof Share07;
    sectionLabel: string;
    kind: "docs" | "cards" | "empty";
    tabs: DeptTab[];
}

const DEPARTMENTS: Department[] = [
    {
        id: "clients",
        short: "Clients",
        header: "Client Support",
        icon: Users01,
        sectionLabel: "Create Docs",
        kind: "docs",
        tabs: [
            { id: "meta-pixel", label: "Meta Pixel", icon: Share07 },
            { id: "popups", label: "Popups", icon: Mail01 },
            { id: "chat-widget", label: "Chat Widget", icon: MessageChatCircle },
            { id: "owner-guides", label: "Owner Guides", icon: BookOpen01 },
        ],
    },
    {
        id: "website",
        short: "Website",
        header: "Web Team",
        icon: Code02,
        sectionLabel: "Workflow",
        kind: "cards",
        tabs: [{ id: "overview", label: "Overview", icon: LayoutAlt01 }],
    },
    {
        id: "am",
        short: "AM",
        header: "Account Managers",
        icon: Briefcase01,
        sectionLabel: "Account Managers",
        kind: "cards",
        tabs: [{ id: "overview", label: "Overview", icon: LayoutAlt01 }],
    },
];

const SunIcon = () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
);
const MoonIcon = () => (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
);

/* ── Rail bottom controls (dashboard: lock + theme toggle) ────────── */

const RailBottom = ({ editing, onToggleEditing }: { editing: boolean; onToggleEditing: () => void }) => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuthUser();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const isDark =
        theme === "dark" ||
        (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const initials = (user?.name ?? "")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <>
            {/* Lock / unlock (edit mode) */}
            <button
                type="button"
                onClick={onToggleEditing}
                title={editing ? "Lock editing" : "Unlock editing"}
                className={cx(
                    "mb-2 flex size-10 items-center justify-center rounded-full border transition duration-100 ease-linear",
                    editing
                        ? "border-brand bg-brand-solid text-white hover:opacity-90"
                        : "border-secondary bg-primary text-secondary hover:bg-tertiary hover:text-primary",
                )}
            >
                {editing ? <LockUnlocked01 className="size-[18px]" /> : <Lock01 className="size-[18px]" />}
            </button>

            {/* Theme toggle */}
            <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex size-10 items-center justify-center rounded-full border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary"
            >
                {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Account avatar — opens settings popup */}
            {user && (
                <>
                    <span className="my-2 h-px w-8 bg-border-secondary" />
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        title="Settings"
                        aria-label="Open settings"
                        className="rounded-full outline-focus-ring transition duration-100 ease-linear hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Avatar size="md" src={user.avatarUrl} alt={user.name} initials={initials} />
                    </button>
                </>
            )}

            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
};

const Sidebar = ({
    department,
    tabs,
    activeSection,
    onSelect,
    editing,
    canEditTabs,
    customTabIds,
    onAddTab,
    onDeleteTab,
}: {
    department: Department;
    tabs: DeptTab[];
    activeSection: string;
    onSelect: (id: string) => void;
    editing: boolean;
    canEditTabs: boolean;
    customTabIds: string[];
    onAddTab: (label: string) => void;
    onDeleteTab: (id: string) => void;
}) => {
    const navigate = useNavigate();
    const [adding, setAdding] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [requestOpen, setRequestOpen] = useState(false);

    const submitTab = () => {
        if (newLabel.trim()) onAddTab(newLabel.trim());
        setNewLabel("");
        setAdding(false);
    };

    return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-secondary bg-primary">
        {/* Department header */}
        <div className="flex h-[73px] shrink-0 items-center border-b border-secondary px-5">
            <h2 className="text-md font-semibold text-primary">{department.header}</h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-quaternary">
                {department.sectionLabel}
            </p>
            <motion.div
                key={department.id}
                className="flex flex-col gap-0.5"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            >
                {tabs.map((item) => {
                    const isCustom = customTabIds.includes(item.id);
                    return (
                        <motion.div
                            key={item.id}
                            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } } }}
                            className={cx(
                                "group flex items-center gap-1 rounded-lg pr-1 transition-colors duration-100 ease-linear",
                                activeSection === item.id
                                    ? "bg-brand-50 dark:bg-brand-950/50"
                                    : "hover:bg-secondary",
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(item.id)}
                                className={cx(
                                    "flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition duration-100 ease-linear",
                                    activeSection === item.id
                                        ? "text-brand-700 dark:text-brand-300"
                                        : "text-secondary group-hover:text-primary",
                                )}
                            >
                                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                                <span className="truncate">{item.label}</span>
                            </button>
                            {editing && isCustom && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteTab(item.id)}
                                    title="Delete tab"
                                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-quaternary opacity-0 transition hover:bg-primary hover:text-error-primary group-hover:opacity-100"
                                >
                                    <Trash01 className="size-3.5" />
                                </button>
                            )}
                        </motion.div>
                    );
                })}

                {/* Add tab (edit mode, card departments) */}
                {editing && canEditTabs && (
                    adding ? (
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") submitTab(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
                            onBlur={submitTab}
                            placeholder="Tab name…"
                            autoFocus
                            className="mt-1 w-full rounded-lg border border-secondary bg-primary px-2.5 py-2 text-sm text-primary placeholder:text-placeholder outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            className="mt-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-primary px-2.5 py-2 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary"
                        >
                            <Plus className="size-4 shrink-0" aria-hidden="true" />
                            Add tab
                        </button>
                    )
                )}
            </motion.div>
        </nav>

        {/* Bottom */}
        <div className="flex flex-col gap-2 border-t border-secondary px-5 py-5">
            <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-primary"
            >
                <Send01 className="size-3.5 shrink-0" aria-hidden="true" />
                Send new docs request
            </button>
            <button
                type="button"
                onClick={() => navigate("/requests")}
                className="flex items-center gap-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-primary"
            >
                <Inbox01 className="size-3.5 shrink-0" aria-hidden="true" />
                Current requests
            </button>
        </div>

        <DocsRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </aside>
    );
};

/* ── Page row ─────────────────────────────────────────────────────── */

const PageRow = ({
    page,
    index,
    onStar,
    onDelete,
}: {
    page: ClientPageData & { created_at?: string };
    index: number;
    onStar: (slug: string, starred: boolean) => void;
    onDelete: (slug: string) => void;
}) => {
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const initials = getInitials(page.client_name || page.slug);

    const colors = [
        "bg-brand-100 text-brand-700",
        "bg-success-secondary text-success-primary",
        "bg-warning-secondary text-warning-primary",
        "bg-error-secondary text-error-primary",
    ];
    const colorClass = colors[index % colors.length];

    return (
        <motion.tr
            onClick={() => !confirmDelete && navigate(`/${page.slug}`)}
            className="group border-b border-secondary transition duration-100 ease-linear last:border-0 hover:bg-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Star indicator + client info */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    {page.starred && (
                        <Star01
                            className="size-3.5 shrink-0 fill-current text-yellow-400"
                            aria-hidden="true"
                        />
                    )}
                    <span
                        className={cx(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            colorClass,
                        )}
                    >
                        {initials || "?"}
                    </span>
                    <div className="min-w-0 cursor-pointer">
                        <p className="truncate text-sm font-medium text-primary">
                            {page.client_name || "(no name)"}
                        </p>
                        <p className="truncate text-xs text-tertiary">
                            {page.client_website || "—"}
                        </p>
                    </div>
                </div>
            </td>

            {/* URL */}
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs text-tertiary">
                    docs-hgm.netlify.app/{page.slug}
                </span>
            </td>

            {/* Date */}
            <td className="px-6 py-4 text-sm text-tertiary">
                {page.created_at ? formatDate(page.created_at) : "—"}
            </td>

            {/* Actions */}
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                {confirmDelete ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-tertiary">Delete?</span>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(page.slug)}
                            className="rounded-md bg-error-solid px-2 py-1 text-xs font-semibold text-white transition duration-100 ease-linear hover:bg-error-solid_hover"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 transition duration-100 ease-linear group-hover:opacity-100">
                        {/* Star */}
                        <button
                            type="button"
                            title={page.starred ? "Unstar" : "Star"}
                            onClick={() => onStar(page.slug, !page.starred)}
                            className={cx(
                                "flex size-7 items-center justify-center rounded-md transition duration-100 ease-linear hover:bg-primary",
                                page.starred ? "text-yellow-400" : "text-tertiary hover:text-yellow-400",
                            )}
                        >
                            <Star01
                                className={cx("size-3.5", page.starred && "fill-current")}
                                aria-hidden="true"
                            />
                        </button>

                        {/* Delete */}
                        <button
                            type="button"
                            title="Delete"
                            onClick={() => setConfirmDelete(true)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-error-primary"
                        >
                            <Trash01 className="size-3.5" aria-hidden="true" />
                        </button>

                        {/* Open */}
                        <button
                            type="button"
                            title="Open page"
                            onClick={() => navigate(`/${page.slug}`)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-brand-secondary"
                        >
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </td>
        </motion.tr>
    );
};

/* ── Main content ─────────────────────────────────────────────────── */

type PageRow = ClientPageData & { created_at?: string };

const MetaPixelContent = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<PageRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("client_pages")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setPages(data as PageRow[]);
                setLoading(false);
            });
    }, []);

    const handleStar = async (slug: string, starred: boolean) => {
        setPages((prev) =>
            prev.map((p) => (p.slug === slug ? { ...p, starred } : p)),
        );
        await supabase.from("client_pages").update({ starred }).eq("slug", slug);
    };

    const handleDelete = async (slug: string) => {
        setPages((prev) => prev.filter((p) => p.slug !== slug));
        await supabase.from("client_pages").delete().eq("slug", slug);
    };

    const sortedPages = [...pages].sort((a, b) => {
        if (a.starred === b.starred) return 0;
        return a.starred ? -1 : 1;
    });

    return (
        <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-secondary">
            {/* Top bar */}
            <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                <div>
                    <h1 className="text-md font-semibold text-primary">Meta Pixel Pages</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${pages.length} page${pages.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/metapixel")}
                        className="rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                    >
                        View Template
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/metapixel?create=1")}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New Page
                    </button>
                </div>
            </header>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[900px] px-6">
                {loading ? (
                    <div className="flex h-48 items-center justify-center">
                        <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                    </div>
                ) : pages.length === 0 ? (
                    <motion.div className="flex h-64 flex-col items-center justify-center gap-3 text-center"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}>
                        <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                            <Share07 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">No pages yet</p>
                            <p className="mt-0.5 text-sm text-tertiary">
                                Create your first Meta Pixel page to get started.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/metapixel?create=1")}
                            className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                        >
                            <Plus className="size-4" aria-hidden="true" />
                            New Page
                        </button>
                    </motion.div>
                ) : (
                    <div className="my-6 overflow-hidden rounded-xl bg-primary shadow-sm ring-1 ring-secondary">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-secondary bg-secondary">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                                        Page URL
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                                        Created
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPages.map((page, i) => (
                                    <PageRow
                                        key={page.slug}
                                        page={page}
                                        index={i}
                                        onStar={handleStar}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

/* ── Owner Guides content ─────────────────────────────────────────── */

const formatGuideDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const EyeToggle = ({ off }: { off: boolean }) =>
    off
        ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /></svg>
        : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

const OwnerGuideCard = ({ guide, index, onOpen, onDelete }: {
    guide: OwnerGuideMeta; index: number; onOpen: (slug: string) => void; onDelete: (slug: string) => void;
}) => {
    const [showPw, setShowPw] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
            className="group flex flex-col rounded-xl bg-primary p-4 shadow-sm ring-1 ring-secondary transition duration-100 ease-linear hover:ring-brand"
        >
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-fg-brand-primary dark:bg-brand-950/40">
                    <BookOpen01 className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-primary">{guide.client_name}</h3>
                    <p className="truncate text-xs text-tertiary">/owner-guide/{guide.slug}</p>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-tertiary">
                <span>Created {formatGuideDate(guide.created_at)}</span>
                {guide.share_password ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-tertiary">
                        {showPw ? guide.share_password : "••••"}
                        <button type="button" onClick={() => setShowPw(s => !s)} title={showPw ? "Hide" : "Show password"}
                            className="flex size-5 items-center justify-center rounded text-quaternary hover:text-primary">
                            <EyeToggle off={!showPw} />
                        </button>
                    </span>
                ) : (
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-quaternary">No password</span>
                )}
            </div>

            <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={() => onOpen(guide.slug)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
                    Open <ArrowUpRight className="size-3.5" />
                </button>
                {confirmDelete ? (
                    <>
                        <button type="button" onClick={() => onDelete(guide.slug)}
                            className="rounded-lg bg-error-solid px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-error-solid_hover">Delete</button>
                        <button type="button" onClick={() => setConfirmDelete(false)}
                            className="rounded-lg border border-secondary px-2.5 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary">Cancel</button>
                    </>
                ) : (
                    <button type="button" onClick={() => setConfirmDelete(true)} title="Delete guide"
                        className="flex size-8 items-center justify-center rounded-lg text-quaternary transition hover:bg-secondary hover:text-error-primary">
                        <Trash01 className="size-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const OwnerGuidesContent = () => {
    const navigate = useNavigate();
    const [guides, setGuides] = useState<OwnerGuideMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    useEffect(() => {
        supabase
            .from("owner_guides")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setGuides(data as OwnerGuideMeta[]);
                setLoading(false);
            });
    }, []);

    const openGuide = (slug: string) => {
        try { sessionStorage.setItem(`og_unlock_${slug}`, "1"); } catch { /* ignore */ }
        navigate(`/owner-guide/${slug}`);
    };

    const deleteGuide = async (slug: string) => {
        setGuides(prev => prev.filter(g => g.slug !== slug));
        await supabase.from("owner_guides").delete().eq("slug", slug);
    };

    const filtered = guides.filter(g => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return g.client_name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q);
    });

    return (
        <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-secondary">
            <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                <div>
                    <h1 className="text-md font-semibold text-primary">Owner Guides</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${guides.length} guide${guides.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate("/owner-guide")}
                        className="rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary">
                        View Template
                    </button>
                    <button type="button" onClick={() => navigate("/owner-guide?create=1")}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90">
                        <Plus className="size-4" aria-hidden="true" />
                        New Guide
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[900px] px-6">
                    {/* Category search */}
                    <div className="relative mt-6">
                        <SearchSm className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-quaternary" aria-hidden="true" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search owner guides by client name…"
                            className="w-full rounded-lg border border-secondary bg-primary py-2.5 pl-10 pr-3 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                    </div>

                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                        </div>
                    ) : guides.length === 0 ? (
                        <motion.div className="flex h-64 flex-col items-center justify-center gap-3 text-center"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                                <BookOpen01 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">No owner guides yet</p>
                                <p className="mt-0.5 text-sm text-tertiary">Create one from the template to share with a client.</p>
                            </div>
                            <button type="button" onClick={() => navigate("/owner-guide?create=1")}
                                className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90">
                                <Plus className="size-4" aria-hidden="true" /> New Guide
                            </button>
                        </motion.div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-sm font-medium text-secondary">No guides match “{query}”</p>
                        </div>
                    ) : (
                        <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {filtered.map((g, i) => (
                                <OwnerGuideCard key={g.slug} guide={g} index={i} onOpen={openGuide} onDelete={deleteGuide} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Popups content ───────────────────────────────────────────────── */

const PopupRow = ({
    page,
    index,
    onDelete,
}: {
    page: LeadCapturePageData;
    index: number;
    onDelete: (slug: string) => void;
}) => {
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const initials = getInitials(page.client_name || page.slug);

    const colors = [
        "bg-brand-100 text-brand-700",
        "bg-success-secondary text-success-primary",
        "bg-warning-secondary text-warning-primary",
        "bg-error-secondary text-error-primary",
    ];
    const colorClass = colors[index % colors.length];

    return (
        <motion.tr
            onClick={() => !confirmDelete && navigate(`/${page.slug}`)}
            className="group border-b border-secondary transition duration-100 ease-linear last:border-0 hover:bg-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", colorClass)}>
                        {initials || "?"}
                    </span>
                    <div className="min-w-0 cursor-pointer">
                        <p className="truncate text-sm font-medium text-primary">{page.client_name || "(no name)"}</p>
                        <p className="truncate text-xs text-tertiary">{page.client_website || "—"}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs text-tertiary">
                    docs-hgm.netlify.app/{page.slug}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-tertiary">
                {page.created_at ? formatDate(page.created_at) : "—"}
            </td>
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                {confirmDelete ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-tertiary">Delete?</span>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(page.slug)}
                            className="rounded-md bg-error-solid px-2 py-1 text-xs font-semibold text-white transition duration-100 ease-linear hover:bg-error-solid_hover"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 transition duration-100 ease-linear group-hover:opacity-100">
                        <button
                            type="button"
                            title="Delete"
                            onClick={() => setConfirmDelete(true)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-error-primary"
                        >
                            <Trash01 className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            title="Open page"
                            onClick={() => navigate(`/${page.slug}`)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-brand-secondary"
                        >
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </td>
        </motion.tr>
    );
};

const PopupsContent = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<LeadCapturePageData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("leadcapture_pages")
            .select("slug, client_name, client_website, created_at")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setPages(data as LeadCapturePageData[]);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (slug: string) => {
        setPages((prev) => prev.filter((p) => p.slug !== slug));
        await supabase.from("leadcapture_pages").delete().eq("slug", slug);
    };

    return (
        <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-secondary">
            <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                <div>
                    <h1 className="text-md font-semibold text-primary">Popup Pages</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${pages.length} popup${pages.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/popup")}
                        className="rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                    >
                        View Template
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/popup?create=1")}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New Popup
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[900px] px-6">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                        </div>
                    ) : pages.length === 0 ? (
                        <motion.div
                            className="flex h-64 flex-col items-center justify-center gap-3 text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                                <Mail01 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">No popups yet</p>
                                <p className="mt-0.5 text-sm text-tertiary">Create your first popup lead-capture page to get started.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/popup?create=1")}
                                className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                New Popup
                            </button>
                        </motion.div>
                    ) : (
                        <div className="my-6 overflow-hidden rounded-xl bg-primary shadow-sm ring-1 ring-secondary">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-secondary bg-secondary">
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Page URL</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Created</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {pages.map((page, i) => (
                                        <PopupRow key={page.slug} page={page} index={i} onDelete={handleDelete} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Chat Widget content ──────────────────────────────────────────── */

const ChatWidgetRow = ({
    page,
    index,
    onDelete,
}: {
    page: ChatWidgetPageData;
    index: number;
    onDelete: (slug: string) => void;
}) => {
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const initials = getInitials(page.client_name || page.slug);

    const colors = [
        "bg-brand-100 text-brand-700",
        "bg-success-secondary text-success-primary",
        "bg-warning-secondary text-warning-primary",
        "bg-error-secondary text-error-primary",
    ];
    const colorClass = colors[index % colors.length];

    return (
        <motion.tr
            onClick={() => !confirmDelete && navigate(`/${page.slug}`)}
            className="group border-b border-secondary transition duration-100 ease-linear last:border-0 hover:bg-secondary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", colorClass)}>
                        {initials || "?"}
                    </span>
                    <div className="min-w-0 cursor-pointer">
                        <p className="truncate text-sm font-medium text-primary">{page.client_name || "(no name)"}</p>
                        <p className="truncate text-xs text-tertiary">{page.client_website || "—"}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs text-tertiary">
                    docs-hgm.netlify.app/{page.slug}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-tertiary">{page.created_at ? formatDate(page.created_at) : "—"}</td>
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                {confirmDelete ? (
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-tertiary">Delete?</span>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-secondary transition duration-100 ease-linear hover:bg-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(page.slug)}
                            className="rounded-md bg-error-solid px-2 py-1 text-xs font-semibold text-white transition duration-100 ease-linear hover:bg-error-solid_hover"
                        >
                            Delete
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-1 opacity-0 transition duration-100 ease-linear group-hover:opacity-100">
                        <button
                            type="button"
                            title="Delete"
                            onClick={() => setConfirmDelete(true)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-error-primary"
                        >
                            <Trash01 className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            title="Open page"
                            onClick={() => navigate(`/${page.slug}`)}
                            className="flex size-7 items-center justify-center rounded-md text-tertiary transition duration-100 ease-linear hover:bg-primary hover:text-brand-secondary"
                        >
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </td>
        </motion.tr>
    );
};

const ChatWidgetContent = () => {
    const navigate = useNavigate();
    const [pages, setPages] = useState<ChatWidgetPageData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase
            .from("chatwidget_pages")
            .select("slug, client_name, client_website, created_at")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) setPages(data as ChatWidgetPageData[]);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (slug: string) => {
        setPages((prev) => prev.filter((p) => p.slug !== slug));
        await supabase.from("chatwidget_pages").delete().eq("slug", slug);
    };

    return (
        <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-secondary">
            <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                <div>
                    <h1 className="text-md font-semibold text-primary">Chat Widget Guides</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${pages.length} guide${pages.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/chat-widget")}
                        className="rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
                    >
                        View Template
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/chat-widget?create=1")}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New Guide
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[900px] px-6">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                        </div>
                    ) : pages.length === 0 ? (
                        <motion.div
                            className="flex h-64 flex-col items-center justify-center gap-3 text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50">
                                <MessageChatCircle className="size-5 text-fg-brand-primary" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary">No chat widget guides yet</p>
                                <p className="mt-0.5 text-sm text-tertiary">Create your first client chat widget guide to get started.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate("/chat-widget?create=1")}
                                className="mt-1 flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                New Guide
                            </button>
                        </motion.div>
                    ) : (
                        <div className="my-6 overflow-hidden rounded-xl bg-primary shadow-sm ring-1 ring-secondary">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-secondary bg-secondary">
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Client</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Page URL</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">Created</th>
                                        <th className="px-6 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {pages.map((page, i) => (
                                        <ChatWidgetRow key={page.slug} page={page} index={i} onDelete={handleDelete} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Overview cards ───────────────────────────────────────────────── */

/** Resolve a card link to an in-app path or external URL. */
function resolveLink(link: string): { external: boolean; to: string } {
    const raw = link.trim();
    if (raw.startsWith("/")) return { external: false, to: raw };
    try {
        const u = new URL(raw);
        if (u.hostname.includes("docs-hgm.netlify.app") || u.hostname === window.location.hostname) {
            return { external: false, to: u.pathname + u.search };
        }
        return { external: true, to: raw };
    } catch {
        return { external: false, to: "/" + raw.replace(/^\/+/, "") };
    }
}

/** Deterministic gradient cover generated from a title when no image is uploaded. */
function gradientFor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
    const h2 = (h + 40) % 360;
    return `linear-gradient(135deg, hsl(${h} 55% 55%), hsl(${h2} 60% 42%))`;
}

const OverviewCard = ({
    card,
    index,
    editing,
    onStar,
    onDelete,
}: {
    card: OverviewCard;
    index: number;
    editing: boolean;
    onStar: (id: string, starred: boolean) => void;
    onDelete: (id: string) => void;
}) => {
    const navigate = useNavigate();
    const open = () => {
        const { external, to } = resolveLink(card.link);
        if (external) window.open(to, "_blank", "noopener,noreferrer");
        else navigate(to);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4 }}
            onClick={open}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary transition-shadow duration-200 hover:shadow-xl"
        >
            {/* Cover */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
                {card.cover_url ? (
                    <img src={card.cover_url} alt={card.title} className="size-full object-cover transition duration-300 group-hover:scale-105" draggable={false} />
                ) : (
                    <div className="flex size-full items-center justify-center transition duration-300 group-hover:scale-105" style={{ background: gradientFor(card.title) }}>
                        <span className="text-4xl font-bold text-white/90">{card.title.charAt(0).toUpperCase()}</span>
                    </div>
                )}

                {/* Star (always shows if starred; toggle on hover in edit mode) */}
                {(card.starred || editing) && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onStar(card.id, !card.starred); }}
                        title={card.starred ? "Unstar" : "Star"}
                        className={cx(
                            "absolute right-3 top-3 flex size-8 items-center justify-center rounded-full backdrop-blur transition duration-100 ease-linear",
                            card.starred ? "bg-black/40 text-yellow-300" : "bg-black/40 text-white opacity-0 group-hover:opacity-100",
                        )}
                    >
                        <Star01 className={cx("size-4", card.starred && "fill-current")} />
                    </button>
                )}

                {/* Delete (edit mode) */}
                {editing && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                        title="Delete card"
                        className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition duration-100 ease-linear hover:bg-error-solid group-hover:opacity-100"
                    >
                        <Trash01 className="size-4" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 items-start gap-3 p-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-secondary">
                    <img src="/hgm logo/Favicon ON LIGHT.svg" alt="" className="size-6 dark:hidden" draggable={false} />
                    <img src="/hgm logo/Favicon ON Dark.svg" alt="" className="hidden size-6 dark:block" draggable={false} />
                </span>
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-primary">{card.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-tertiary">{card.description}</p>
                </div>
            </div>
        </motion.div>
    );
};

const AddCardModal = ({ onClose, onCreate }: { onClose: () => void; onCreate: (c: { title: string; description: string; link: string; cover: string }) => Promise<void> }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [cover, setCover] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const valid = title.trim() && description.trim() && link.trim();

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCover(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const submit = async () => {
        if (!valid) return;
        setSaving(true);
        setError("");
        try {
            await onCreate({ title: title.trim(), description: description.trim(), link: link.trim(), cover });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save — check your connection.");
        }
        setSaving(false);
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        >
            <motion.div
                className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary"
                initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-md font-semibold text-primary">Add Card</h3>
                        <p className="mt-1 text-sm text-tertiary">Link a page to this overview.</p>
                    </div>
                    <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-tertiary hover:bg-secondary">
                        <XClose className="size-4" />
                    </button>
                </div>

                <div className="mt-4 flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Cover image <span className="font-normal text-quaternary">(optional)</span></label>
                        {cover ? (
                            <div className="relative overflow-hidden rounded-lg ring-1 ring-secondary">
                                <img src={cover} alt="cover" className="aspect-[16/10] w-full object-cover" />
                                <button type="button" onClick={() => setCover("")} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80">
                                    <XClose className="size-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-secondary text-tertiary transition hover:border-brand hover:text-brand-secondary">
                                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                                <Image01 className="size-6" />
                                <span className="text-xs font-medium">Upload cover (auto-generated if empty)</span>
                            </label>
                        )}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Heading <span className="text-error-primary">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website AI Setup" autoFocus
                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Description <span className="text-error-primary">*</span> <span className="font-normal text-quaternary">(max 20 words)</span></label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Short description"
                            className="w-full resize-none rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-secondary">Page link <span className="text-error-primary">*</span></label>
                        <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs-hgm.netlify.app/…"
                            className="w-full rounded-lg border border-secondary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand" />
                    </div>
                </div>

                {error && <p className="mt-3 text-xs text-error-primary">{error}</p>}

                <div className="mt-5 flex gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={submit} disabled={!valid || saving} className="flex-1 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
                        {saving ? "Adding…" : "Add Card"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const OverviewContent = ({ department, tab, editing }: { department: Department; tab: string; editing: boolean }) => {
    const [cards, setCards] = useState<OverviewCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => {
        setLoading(true);
        supabase
            .from("overview_cards")
            .select("*")
            .eq("department", department.id)
            .eq("tab", tab)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (!error && data) setCards(data as OverviewCard[]);
                setLoading(false);
            });
    }, [department.id, tab]);

    const handleStar = async (id: string, starred: boolean) => {
        setCards((prev) => prev.map((c) => (c.id === id ? { ...c, starred } : c)));
        await supabase.from("overview_cards").update({ starred }).eq("id", id);
    };

    const handleDelete = async (id: string) => {
        setCards((prev) => prev.filter((c) => c.id !== id));
        await supabase.from("overview_cards").delete().eq("id", id);
    };

    const handleCreate = async (c: { title: string; description: string; link: string; cover: string }) => {
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const row: OverviewCard = {
            id,
            department: department.id,
            tab,
            title: c.title,
            description: c.description,
            link: c.link,
            cover_url: c.cover,
            starred: false,
        };
        const { error } = await supabase.from("overview_cards").insert(row);
        if (error) {
            console.error("[overview card insert] Supabase error:", error);
            throw new Error(error.message);
        }
        setCards((prev) => [...prev, row]);
        setShowAdd(false);
    };

    const sorted = [...cards].sort((a, b) => (a.starred === b.starred ? 0 : a.starred ? -1 : 1));

    return (
        <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-secondary">
            <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                <div>
                    <h1 className="text-md font-semibold text-primary">Overview</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${cards.length} ${cards.length === 1 ? "page" : "pages"}`}
                        {editing && " · editing"}
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1100px] px-6 py-6">
                    {loading ? (
                        <div className="flex h-48 items-center justify-center">
                            <div className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {sorted.map((card, i) => (
                                    <OverviewCard key={card.id} card={card} index={i} editing={editing} onStar={handleStar} onDelete={handleDelete} />
                                ))}
                            </AnimatePresence>

                            {editing && (
                                <motion.button
                                    layout
                                    type="button"
                                    onClick={() => setShowAdd(true)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    whileHover={{ y: -4 }}
                                    className="flex aspect-[16/10] min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary text-tertiary transition duration-100 ease-linear hover:border-brand hover:bg-brand-50 hover:text-brand-secondary dark:hover:bg-brand-950/30"
                                >
                                    <Plus className="size-7" />
                                    <span className="text-sm font-semibold">Add Card</span>
                                </motion.button>
                            )}
                        </div>
                    )}

                    {!loading && !editing && cards.length === 0 && (
                        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                            <p className="text-sm font-medium text-primary">No cards yet</p>
                            <p className="text-sm text-tertiary">Unlock editing (rail, bottom-left) to add cards.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onCreate={handleCreate} />}
            </AnimatePresence>
        </div>
    );
};

/* ── Dashboard layout ─────────────────────────────────────────────── */

const DashboardLayout = () => {
    const [searchParams] = useSearchParams();
    const initialDeptId = (() => {
        const p = searchParams.get("dept");
        return p && DEPARTMENTS.some((d) => d.id === p) ? p : "clients";
    })();
    const [department, setDepartment] = useState(initialDeptId);
    const [activeSection, setActiveSection] = useState(
        () => (DEPARTMENTS.find((d) => d.id === initialDeptId) ?? DEPARTMENTS[0]).tabs[0].id,
    );
    const [editing, setEditing] = useState(false);
    const [customTabs, setCustomTabs] = useState<OverviewTab[]>([]);
    const dept = DEPARTMENTS.find((d) => d.id === department) ?? DEPARTMENTS[0];

    // Load custom tabs for card departments.
    useEffect(() => {
        if (dept.kind !== "cards") {
            setCustomTabs([]);
            return;
        }
        supabase
            .from("overview_tabs")
            .select("*")
            .eq("department", dept.id)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (!error && data) setCustomTabs(data as OverviewTab[]);
                else setCustomTabs([]);
            });
    }, [dept.id, dept.kind]);

    const tabs: DeptTab[] =
        dept.kind === "cards"
            ? [...dept.tabs, ...customTabs.map((t) => ({ id: t.id, label: t.label, icon: LayoutAlt01 }))]
            : dept.tabs;

    const selectDept = (id: string) => {
        const d = DEPARTMENTS.find((x) => x.id === id) ?? DEPARTMENTS[0];
        setDepartment(id);
        setActiveSection(d.tabs[0].id);
    };

    const addTab = async (label: string) => {
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        const row: OverviewTab = { id, department: dept.id, label };
        setCustomTabs((prev) => [...prev, row]);
        setActiveSection(id);
        const { error } = await supabase.from("overview_tabs").insert(row);
        if (error) {
            console.error("[overview tab insert] Supabase error:", error);
            setCustomTabs((prev) => prev.filter((t) => t.id !== id));
            setActiveSection(dept.tabs[0].id);
            alert("Could not save tab: " + error.message);
        }
    };

    const deleteTab = async (id: string) => {
        setCustomTabs((prev) => prev.filter((t) => t.id !== id));
        if (activeSection === id) setActiveSection(dept.tabs[0].id);
        await supabase.from("overview_tabs").delete().eq("id", id);
        await supabase.from("overview_cards").delete().eq("department", dept.id).eq("tab", id);
    };

    return (
        <div className="flex h-dvh overflow-hidden">
            <IconRail
                activeDept={department}
                onSelectDept={selectDept}
                bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />}
            />
            <Sidebar
                department={dept}
                tabs={tabs}
                activeSection={activeSection}
                onSelect={setActiveSection}
                editing={editing}
                canEditTabs={dept.kind === "cards"}
                customTabIds={customTabs.map((t) => t.id)}
                onAddTab={addTab}
                onDeleteTab={deleteTab}
            />
            {dept.kind === "docs"
                ? activeSection === "popups"
                    ? <PopupsContent />
                    : activeSection === "chat-widget"
                        ? <ChatWidgetContent />
                        : activeSection === "owner-guides"
                            ? <OwnerGuidesContent />
                            : <MetaPixelContent />
                : <OverviewContent key={dept.id + ":" + activeSection} department={dept} tab={activeSection} editing={editing} />}
        </div>
    );
};

/* ── Page export ──────────────────────────────────────────────────── */

export const DashboardScreen = () => {
    const [unlocked, setUnlocked] = useState(
        () => sessionStorage.getItem("hgm_dashboard_unlocked") === "1",
    );
    const [googleError, setGoogleError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleUnlock = () => {
        sessionStorage.setItem("hgm_dashboard_unlocked", "1");
        setUnlocked(true);
    };

    // On load and on sign-in (incl. the async return from Google OAuth): if there's a
    // session, only let @hiddengem.media accounts in — otherwise sign out and show an
    // error. Subscribing to auth changes ensures we land on the dashboard as soon as
    // the OAuth session is ready, instead of only checking once on mount.
    useEffect(() => {
        const admit = (email: string | undefined) => {
            if (sessionStorage.getItem("hgm_dashboard_unlocked") === "1") return;
            const normalized = email?.toLowerCase() ?? "";
            if (!normalized) return;
            if (normalized.endsWith(`@${ALLOWED_DOMAIN}`)) {
                handleUnlock();
            } else {
                supabase.auth.signOut();
                setGoogleError(`That account isn't allowed. Use an @${ALLOWED_DOMAIN} Google account.`);
            }
        };

        supabase.auth.getSession().then(({ data }) => admit(data.session?.user?.email));

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            admit(session?.user?.email);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    const handleGoogle = async () => {
        setGoogleError("");
        setGoogleLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
                // hd hints Google to prefer the workspace domain; real enforcement is the check above.
                queryParams: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
            },
        });
        if (error) {
            setGoogleError("Couldn't start Google sign-in. Try again or use the team password.");
            setGoogleLoading(false);
        }
        // On success the browser redirects to Google, so no further handling here.
    };

    return unlocked ? (
        <DashboardLayout />
    ) : (
        <PasswordGate
            onUnlock={handleUnlock}
            onGoogle={handleGoogle}
            googleError={googleError}
            googleLoading={googleLoading}
        />
    );
};
