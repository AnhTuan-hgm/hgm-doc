import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Briefcase01, Code02, Users01 } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
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
    const isDark =
        theme === "dark" ||
        (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const handle = (id: string) => {
        if (onSelectDept) onSelectDept(id);
        else navigate(`/dashboard?dept=${id}`);
    };

    return (
        <aside className="flex h-dvh w-[88px] shrink-0 flex-col items-center border-r border-secondary bg-secondary py-4">
            {/* Favicon */}
            <img
                src={isDark ? "/hgm logo/Favicon ON Dark.svg" : "/hgm logo/Favicon ON LIGHT.svg"}
                alt="HiddenGem"
                className="size-9"
                draggable={false}
            />
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
