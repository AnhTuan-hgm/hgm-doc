import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Mail01, MessageChatCircle, Plus, Share07, Star01, Trash01, XClose } from "@untitledui/icons";
import { supabase, type ClientPageData, type LeadCapturePageData } from "@/lib/supabase";
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
                <img
                    src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                    alt="HiddenGem Media"
                    className="h-8"
                    draggable={false}
                />

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

const NAV_ITEMS = [
    { id: "meta-pixel", label: "Meta Pixel", icon: Share07 },
    { id: "popups", label: "Popups", icon: Mail01 },
];

const Sidebar = ({ activeSection, onSelect }: { activeSection: string; onSelect: (id: string) => void }) => (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-secondary bg-primary">
        {/* Logo */}
        <div className="border-b border-secondary px-5 py-5">
            <img
                src="/hgm logo/Logo WIth Word Mark(Style 1).svg"
                alt="HiddenGem Media"
                className="h-7 opacity-80"
                draggable={false}
            />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-quaternary">
                Pages
            </p>
            <div className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={cx(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition duration-100 ease-linear",
                            activeSection === item.id
                                ? "bg-brand-50 text-brand-700"
                                : "text-secondary hover:bg-secondary hover:text-primary",
                        )}
                    >
                        <item.icon className="size-4 shrink-0" aria-hidden="true" />
                        {item.label}
                    </button>
                ))}
            </div>
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
            <header className="flex shrink-0 items-center justify-between border-b border-secondary bg-primary px-6 py-4">
                <div>
                    <h1 className="text-md font-semibold text-primary">Meta Pixel Pages</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${pages.length} page${pages.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/template")}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                >
                    <Plus className="size-4" aria-hidden="true" />
                    New Page
                </button>
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
                            onClick={() => navigate("/template")}
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
            <header className="flex shrink-0 items-center justify-between border-b border-secondary bg-primary px-6 py-4">
                <div>
                    <h1 className="text-md font-semibold text-primary">Popup Pages</h1>
                    <p className="text-sm text-tertiary">
                        {loading ? "Loading…" : `${pages.length} popup${pages.length !== 1 ? "s" : ""} created`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/popup")}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3.5 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                >
                    <Plus className="size-4" aria-hidden="true" />
                    New Popup
                </button>
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
                                onClick={() => navigate("/popup")}
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

/* ── Dashboard layout ─────────────────────────────────────────────── */

const DashboardLayout = () => {
    const [activeSection, setActiveSection] = useState("meta-pixel");
    return (
        <div className="flex h-dvh overflow-hidden">
            <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
            {activeSection === "popups" ? <PopupsContent /> : <MetaPixelContent />}
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
