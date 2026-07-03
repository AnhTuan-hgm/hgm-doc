import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { BookOpen01, Briefcase01, Code02, LayoutLeft, Lock01, LockUnlocked01, Moon01, SearchSm, Sun, Users01 } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { SearchModal } from "@/components/application/search-modal";
import { cx } from "@/utils/cx";

/**
 * Bottom controls for the icon rail: an edit lock toggle and a light/dark theme
 * toggle. Shared so every internal team page (dashboard, web team) renders the
 * same chrome. Pass it to <IconRail bottom={...} />.
 */
export const RailBottom = ({ editing, onToggleEditing }: { editing: boolean; onToggleEditing: () => void }) => {
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
                {isDark ? <Sun className="size-[18px]" /> : <Moon01 className="size-[18px]" />}
            </button>
        </>
    );
};

/* ── Collapsible navigation (hide/show the icon rail + side menu) ──
   Shared across all internal pages; the preference persists in localStorage
   so a hidden nav stays hidden everywhere until expanded again. */

const NAV_COLLAPSED_KEY = "hgm_nav_collapsed";

export const useNavCollapsed = () => {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(NAV_COLLAPSED_KEY) === "1"; } catch { return false; }
    });
    const toggle = () =>
        setCollapsed((v) => {
            const next = !v;
            try { localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        });
    return { collapsed, toggle };
};

/** Panel toggle — place in a side-menu header (hide) or the collapsed top bar (show). */
export const NavCollapseButton = ({ onClick, label = "Hide menu" }: { onClick: () => void; label?: string }) => (
    <button
        type="button"
        title={label}
        onClick={onClick}
        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
    >
        <LayoutLeft className="size-[18px]" aria-hidden="true" />
    </button>
);

/** Slim replacement header shown while the rail + side menu are hidden. */
export const CollapsedTopBar = ({ title, onExpand }: { title: string; onExpand: () => void }) => (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-secondary bg-primary pl-2 pr-4">
        <img src="/hgm logo/Favicon ON LIGHT.svg" alt="HiddenGem" className="size-9" draggable={false} />
        <h2 className="text-md font-semibold text-primary">{title}</h2>
        <NavCollapseButton onClick={onExpand} label="Show menu" />
    </div>
);

/** Department rail shown on every internal HiddenGem team page (not on client-facing pages). */
export const RAIL_ITEMS = [
    { id: "clients", short: "Clients", icon: Users01 },
    { id: "website", short: "Website", icon: Code02 },
    { id: "am", short: "AM", icon: Briefcase01 },
    { id: "docs", short: "Docs", icon: BookOpen01 },
];

export const IconRail = ({
    activeDept,
    onSelectDept,
    bottom,
}: {
    /** Which rail item is highlighted. */
    activeDept: string;
    /** In-page department switch (dashboard). When omitted, items navigate to /dashboard?dept=id. */
    onSelectDept?: (id: string) => void;
    /** Optional bottom controls (e.g. dashboard lock + theme toggle). */
    bottom?: ReactNode;
}) => {
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);

    // Global shortcut: Shift + F opens search (ignored while typing in a field).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (e.shiftKey && (e.key === "F" || e.key === "f") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handle = (id: string) => {
        if (onSelectDept) onSelectDept(id);
        else navigate(`/dashboard?dept=${id}`);
    };

    return (
        <>
        <aside className="flex h-dvh w-[88px] shrink-0 flex-col items-center border-r border-secondary bg-secondary pb-4">
            {/* Favicon — same header height as the side menu + main content headers */}
            <div className="flex h-[73px] w-full shrink-0 items-center justify-center border-b border-secondary">
                <img
                    src="/hgm logo/Favicon ON LIGHT.svg"
                    alt="HiddenGem"
                    className="size-9"
                    draggable={false}
                />
            </div>

            {/* Search — sits above the departments with a distinct elevated chip. */}
            <button
                type="button"
                onClick={() => setSearchOpen(true)}
                title="Search (Shift + F)"
                className="group mt-4 flex w-full flex-col items-center gap-1 px-1"
            >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-fg-secondary shadow-xs ring-1 ring-secondary transition duration-100 ease-linear group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand dark:group-hover:bg-brand-950/50 dark:group-hover:text-brand-300">
                    <SearchSm className="size-5" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold text-tertiary">Search</span>
            </button>

            <span className="mt-4 h-px w-8 bg-border-secondary" />

            {/* Departments */}
            <div className="mt-4 flex flex-1 flex-col items-center gap-1">
                {RAIL_ITEMS.map((d) => {
                    const active = activeDept === d.id;
                    return (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => handle(d.id)}
                            title={d.short}
                            className="group flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5"
                        >
                            <span
                                className={cx(
                                    "flex size-11 items-center justify-center rounded-xl border transition duration-100 ease-linear",
                                    active
                                        ? "border-brand bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                        : "border-transparent text-tertiary group-hover:bg-primary group-hover:text-secondary",
                                )}
                            >
                                <d.icon className="size-5" aria-hidden="true" />
                            </span>
                            <span className={cx("text-[11px] font-semibold", active ? "text-primary" : "text-tertiary")}>{d.short}</span>
                        </button>
                    );
                })}
            </div>

            {bottom}
        </aside>

        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
};
