import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Briefcase01, Code02, SearchSm, Users01 } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { SearchModal } from "@/components/application/search-modal";
import { cx } from "@/utils/cx";

/** Department rail shown on every internal HiddenGem team page (not on client-facing pages). */
export const RAIL_ITEMS = [
    { id: "clients", short: "Clients", icon: Users01 },
    { id: "website", short: "Website", icon: Code02 },
    { id: "am", short: "AM", icon: Briefcase01 },
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
    const { theme } = useTheme();
    const [searchOpen, setSearchOpen] = useState(false);
    const isDark =
        theme === "dark" ||
        (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

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
                    src={isDark ? "/hgm logo/Favicon ON Dark.svg" : "/hgm logo/Favicon ON LIGHT.svg"}
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
