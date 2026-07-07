import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { BookOpen01, Briefcase01, ChevronLeft, ChevronRight, Code02, LayoutLeft, Lock01, LockUnlocked01, Moon01, Sun, Users01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { useAuthUser } from "@/hooks/use-auth-user";
import { SettingsDialog } from "@/pages/settings-screen";
import { useTheme } from "@/providers/theme-provider";
import { HelpMenu } from "@/components/application/help-menu";
import { SearchBar } from "@/components/application/search-modal";
import { cx } from "@/utils/cx";

/**
 * Account avatar — opens the settings popup. Lives in the search-bar row
 * (top-right), not the icon rail, so it renders on any page that passes
 * `headerRight` to <AppShell>. Returns null while signed out.
 */
export const HeaderAvatar = () => {
    const { user } = useAuthUser();
    const [settingsOpen, setSettingsOpen] = useState(false);
    if (!user) return null;

    const initials = (user.name ?? "")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <>
            <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                aria-label="Open settings"
                className="rounded-full outline-focus-ring transition duration-100 ease-linear hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <Avatar size="md" src={user.avatarUrl} alt={user.name} initials={initials} />
            </button>
            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
};

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

            {/* Help menu — docked here (not floating) so the AI chat widget can take the bottom-right corner. */}
            <HelpMenu variant="rail" />
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
    const toggle = useCallback(() =>
        setCollapsed((v) => {
            const next = !v;
            try { localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        }), []);

    // Global shortcut: Shift + B shows/hides the menu (same convention as Shift + F
    // search / Shift + E edit — ignored while typing and when Cmd/Ctrl/Alt are held).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (e.shiftKey && (e.key === "B" || e.key === "b") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [toggle]);

    return { collapsed, toggle };
};

/* ── Collapsible department icon rail (hide/show just the left icon strip) ──
   Independent of useNavCollapsed: Shift + B hides the whole menu (rail + side
   menu), Shift + R hides only the icon rail. Owned by AppShell so no page needs
   to wire it up. Persists in localStorage. */

const RAIL_COLLAPSED_KEY = "hgm_rail_collapsed";

export const useRailCollapsed = () => {
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem(RAIL_COLLAPSED_KEY) === "1"; } catch { return false; }
    });
    const toggle = useCallback(() =>
        setCollapsed((v) => {
            const next = !v;
            try { localStorage.setItem(RAIL_COLLAPSED_KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        }), []);

    // Global shortcut: Shift + R shows/hides the department icon rail.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (e.shiftKey && (e.key === "R" || e.key === "r") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [toggle]);

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

/**
 * Floating app shell — wraps a page's side menu + content in one rounded card
 * sitting on the page canvas, like a native macOS window (Finder, System
 * Settings): margin around the edges, one continuous rounded shape instead of
 * a flush square panel touching the browser edges.
 *
 * The department icon rail is deliberately kept OUTSIDE the rounded card (pass
 * it as `rail`) — folding it in made the whole shell read as one busy block.
 * It renders as a bare strip directly on the canvas (no background, no card
 * margins): when a rail is present the shell drops its left padding and the
 * rail sits flush against the viewport edge, left of the card.
 *
 * `className` carries the card's own inner layout (e.g. "flex flex-col" so a
 * CollapsedTopBar can stack above the row, or "flex md:flex-row" for a
 * side-menu-only client page) — AppShell only owns the canvas + card chrome.
 */
export const AppShell = ({
    children,
    rail,
    className,
    highlightScope,
    headerRight,
}: {
    children: ReactNode;
    /** The department icon rail (or any left-of-shell rail) — rendered outside the rounded card. */
    rail?: ReactNode;
    className?: string;
    /** Marks the card as the highlight-pen's field scope (see utils/highlight.tsx). */
    highlightScope?: boolean;
    /** Optional right-aligned content in the search-bar row (e.g. account avatar). */
    headerRight?: ReactNode;
}) => {
    const navigate = useNavigate();
    // Shift + R hides just the icon rail. The search/back-forward row still shows on
    // pages that HAVE a rail (gated on `rail`); only the left icon strip toggles, and
    // the card reclaims its left padding when the strip is hidden.
    const { collapsed: railCollapsed } = useRailCollapsed();
    const showRail = !!rail && !railCollapsed;
    return (
    <div className={cx("flex h-dvh gap-2.5 overflow-hidden bg-tertiary pt-1 pr-2.5 pb-2.5 sm:gap-3 sm:pr-3 sm:pb-3", showRail ? "pl-0" : "pl-2.5 sm:pl-3")}>
        {showRail && rail}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 sm:gap-3">
            {/* Global search + back/forward — only on pages with the department rail.
                Row height matches the rail's favicon header (73px) so the two line up. */}
            {rail && (
                <div className="flex h-[73px] shrink-0 items-center gap-1 px-1">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        title="Back"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-fg-quaternary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                    >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(1)}
                        title="Forward"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-fg-quaternary ring-1 ring-secondary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                    >
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                    <SearchBar />
                    {headerRight && <div className="ml-2 flex shrink-0 items-center gap-2 pr-1">{headerRight}</div>}
                </div>
            )}
            <div
                {...(highlightScope ? { "data-highlight-scope": true } : {})}
                className={cx("min-h-0 flex-1 overflow-hidden rounded-2xl shadow-xl ring-1 ring-secondary", className)}
            >
                {children}
            </div>
        </div>
    </div>
    );
};

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

    const handle = (id: string) => {
        if (onSelectDept) onSelectDept(id);
        else navigate(`/dashboard?dept=${id}`);
    };

    return (
        <aside className="flex h-full w-[88px] shrink-0 flex-col items-center pb-4">
            {/* Favicon — same header height as the side menu + main content headers */}
            <div className="flex h-[73px] w-full shrink-0 items-center justify-center">
                <img
                    src="/hgm logo/Favicon ON LIGHT.svg"
                    alt="HiddenGem"
                    className="size-9"
                    draggable={false}
                />
            </div>

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
    );
};
