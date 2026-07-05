import type { FC } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface BreadcrumbItem {
    label: string;
    /** Internal path to navigate to. Omit for the current (last) page. */
    to?: string;
    icon?: FC<{ className?: string }>;
}

/**
 * Compact breadcrumb trail shown at the top of internal project / log pages so the
 * team can see where a page sits (e.g. Dashboard › Project Logs › Welcome Email
 * Flow) and jump back up a level. The last item renders as the current page and is
 * not a link. Mirrors the Untitled UI breadcrumb pattern.
 */
export const PageBreadcrumb = ({
    items,
    className,
    tone = "default",
}: {
    items: BreadcrumbItem[];
    className?: string;
    /** "onImage" switches to white text for use over a dark banner / cover image. */
    tone?: "default" | "onImage";
}) => {
    const navigate = useNavigate();
    const onImage = tone === "onImage";

    return (
        <nav aria-label="Breadcrumb" className={cx("flex flex-wrap items-center gap-1.5 text-sm", className)}>
            {items.map((item, i) => {
                const last = i === items.length - 1;
                const Icon = item.icon;
                const iconColor = onImage ? "text-white/70" : "text-fg-quaternary";
                return (
                    <div key={item.label} className="flex items-center gap-1.5">
                        {item.to && !last ? (
                            <button
                                type="button"
                                onClick={() => navigate(item.to!)}
                                className={cx(
                                    "flex items-center gap-1.5 rounded-md font-medium outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                                    onImage ? "text-white/75 hover:text-white" : "text-tertiary hover:text-primary",
                                )}
                            >
                                {Icon && <Icon className={cx("size-4 shrink-0", iconColor)} aria-hidden="true" />}
                                {item.label}
                            </button>
                        ) : (
                            <span
                                aria-current={last ? "page" : undefined}
                                className={cx(
                                    "flex items-center gap-1.5 font-semibold",
                                    last ? (onImage ? "text-white" : "text-primary") : onImage ? "text-white/75" : "text-tertiary",
                                )}
                            >
                                {Icon && <Icon className={cx("size-4 shrink-0", iconColor)} aria-hidden="true" />}
                                {item.label}
                            </span>
                        )}
                        {!last && <ChevronRight className={cx("size-4 shrink-0", onImage ? "text-white/50" : "text-fg-quaternary")} aria-hidden="true" />}
                    </div>
                );
            })}
        </nav>
    );
};
