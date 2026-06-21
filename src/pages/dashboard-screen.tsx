import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { IconRail } from "@/components/application/icon-rail";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Briefcase01, Code02, Image01, LayoutAlt01, Lock01, LockUnlocked01, Mail01, MessageChatCircle, Plus, Share07, Star01, Trash01, Users01, XClose } from "@untitledui/icons";
import { supabase, type ClientPageData, type LeadCapturePageData, type OverviewCard, type OverviewTab } from "@/lib/supabase";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

const PASSWORDS = ["ANHTUAN", "HGTEAM"];

/* ── Password gate ────────────────────────────────────────────────── */

const PasswordGate = ({ onUnlock }: { onUnlock: () => void }) => {
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
                    <p className="mt-1 text-sm text-tertiary">Enter the team password to continue.</p>
                </div>

                <div className="mt-5">
                    <input
                        type="password"
                        placeholder="Password"
                        value={value}
                        autoFocus
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
                    {success ? "Unlocking…" : "Unlock"}
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

const WORKFLOW_MAILTO =
    "mailto:anhtuan@hiddengem.media?subject=New%20Workflow%20Request&body=Hi%20AnhTuan%2C%0A%0AI%27d%20like%20to%20request%20a%20new%20workflow%3A%0A%0A";

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
    const isDark =
        theme === "dark" ||
        (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
    const [adding, setAdding] = useState(false);
    const [newLabel, setNewLabel] = useState("");

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
        <div className="border-t border-secondary px-5 py-5">
            <p className="text-xs font-medium text-secondary">Created by AnhTuan</p>
            <a
                href={WORKFLOW_MAILTO}
                className="mt-2 flex items-center gap-1.5 text-xs text-brand-secondary transition duration-100 ease-linear hover:text-brand-primary"
            >
                <MessageChatCircle className="size-3.5 shrink-0" aria-hidden="true" />
                Send new workflow request
            </a>
        </div>
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

    const handleUnlock = () => {
        sessionStorage.setItem("hgm_dashboard_unlocked", "1");
        setUnlocked(true);
    };

    return unlocked ? <DashboardLayout /> : <PasswordGate onUnlock={handleUnlock} />;
};
