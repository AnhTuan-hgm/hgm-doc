import { useEffect, useState } from "react";
import {
    Announcement01,
    BarChart01,
    Browser,
    ChevronDown,
    Film01,
    Grid01,
    Laptop01,
    LayersThree01,
    Monitor01,
    Phone01,
    Tablet01,
} from "@untitledui-pro/icons/line";
import { cx } from "@/utils/cx";

/**
 * The page's contents navigation — a trimmed port of hiddengem-media's
 * `BackdropNav` (`(site)/background/backdrop-nav.tsx`).
 *
 * WHAT WAS KEPT: the two renderings of one list. From xl, a fixed rail down the
 * left — identity block pinned above a scrolling list, collapsible family
 * groups with right-aligned mono counts, children hung off a hairline connector
 * whose segment turns brand at the active row, and a pinned "Unlisted ·
 * noindex" footer. Below xl, a sticky horizontal chip strip. An
 * IntersectionObserver tracks whatever section is crossing the reading line
 * (a thin band near the top of the viewport, not ratios — ratios flicker
 * between equal neighbours).
 *
 * WHAT WAS DROPPED, deliberately: the outer 72px dashboard icon rail (it
 * indexes the marketing site's own workbench routes, which do not exist here).
 *
 * DRAG-TO-RESIZE came back (same idiom as the client dashboard's side menu):
 * the hairline doubles as the handle, shows a brand line on hover, drags to
 * widen, arrow keys nudge, double-click resets, width persists. The rail
 * publishes its width as `--contents-rail` on the root so the page can pad
 * with `xl:pl-[var(--contents-rail,14rem)]` instead of a hardcoded class.
 */

const RAIL_ICONS = {
    announce: Announcement01,
    "bar-chart": BarChart01,
    browser: Browser,
    film: Film01,
    grid: Grid01,
    laptop: Laptop01,
    layers: LayersThree01,
    monitor: Monitor01,
    phone: Phone01,
    tablet: Tablet01,
} as const;

export type RailIcon = keyof typeof RAIL_ICONS;

export type RailItem = { id: string; name: string; family: string; number: string };

/* Clamp measured on this rail: 224 is the width it was drawn at (names like
   "Insights and enquiries" fit on one line); past 400 the reading column on a
   1280px laptop loses more than the rail gains. */
const RAIL_DEFAULT = 224;
const RAIL_MIN = 224;
const RAIL_MAX = 400;
const RAIL_KEY = "hgm_contents_rail_width";
const clampRail = (v: number) => Math.min(RAIL_MAX, Math.max(RAIL_MIN, Math.round(v)));

/** One fixed-width right-aligned mono slot, so counts read as a column. */
const countClasses = "w-4 shrink-0 text-right font-mono text-[0.625rem] tabular-nums text-tertiary";

/** The gutter every child row hangs its label off. */
const gutterClasses = "w-4 shrink-0 font-mono text-[0.625rem] leading-5 tabular-nums";

export const ContentsRail = ({ items, label, title, icons }: { items: RailItem[]; label: string; title: string; icons?: Record<string, RailIcon> }) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [railWidth, setRailWidth] = useState(RAIL_DEFAULT);
    const [dragging, setDragging] = useState(false);

    const toggle = (family: string) => setCollapsed((current) => ({ ...current, [family]: !current[family] }));

    // Read after mount only, never during render, and tolerate a blocked/empty store.
    useEffect(() => {
        try {
            const saved = Number(localStorage.getItem(RAIL_KEY));
            if (Number.isFinite(saved) && saved > 0) setRailWidth(clampRail(saved));
        } catch {
            /* private browsing — the default width is correct, just not remembered */
        }
    }, []);

    // The page pads against this var; rail and content cannot drift apart.
    useEffect(() => {
        document.documentElement.style.setProperty("--contents-rail", `${railWidth}px`);
        return () => {
            document.documentElement.style.removeProperty("--contents-rail");
        };
    }, [railWidth]);

    /* Listeners on the WINDOW, not the handle — a lost pointer capture would
       otherwise leave the drag stuck. Both torn down in the same effect. */
    useEffect(() => {
        if (!dragging) return;
        // Rail is fixed to the left edge, so clientX IS the width.
        const onMove = (e: PointerEvent) => setRailWidth(clampRail(e.clientX));
        const stop = () => {
            setDragging(false);
            setRailWidth((w) => {
                try {
                    localStorage.setItem(RAIL_KEY, String(w));
                } catch {
                    /* nothing to do — the width still applies for this session */
                }
                return w;
            });
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, [dragging]);

    const nudgeRail = (delta: number) => {
        setRailWidth((w) => {
            const next = clampRail(w + delta);
            try {
                localStorage.setItem(RAIL_KEY, String(next));
            } catch {
                /* not persisted; still applied */
            }
            return next;
        });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                }
            },
            { rootMargin: "-18% 0px -72% 0px" },
        );

        const sections = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [items]);

    // Preserve the order families first appear in, so the rail matches the page.
    const families = items.reduce<string[]>((acc, item) => (acc.includes(item.family) ? acc : [...acc, item.family]), []);

    return (
        <>
            {/* Rail — xl and up. Width is state, not a class: `w-56` would be a
                lie the moment anyone dragged the divider. */}
            <nav
                aria-label={label}
                style={{ width: railWidth }}
                className="fixed top-0 left-0 z-20 hidden h-dvh flex-col border-r border-secondary bg-secondary xl:flex"
            >
                {/* The divider doubles as the drag handle: a 12px invisible hit strip
                    centred on the 1px border, so the grab target is generous while the
                    thing you see stays a hairline. Brand line on hover, solid while
                    dragging — same treatment as the dashboard side menu. */}
                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize contents rail"
                    aria-valuenow={railWidth}
                    aria-valuemin={RAIL_MIN}
                    aria-valuemax={RAIL_MAX}
                    tabIndex={0}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDoubleClick={() => {
                        setRailWidth(RAIL_DEFAULT);
                        try {
                            localStorage.setItem(RAIL_KEY, String(RAIL_DEFAULT));
                        } catch {
                            /* not persisted; still applied */
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            nudgeRail(-16);
                        }
                        if (e.key === "ArrowRight") {
                            e.preventDefault();
                            nudgeRail(16);
                        }
                    }}
                    className={cx(
                        "absolute top-0 -right-1.5 z-20 h-full w-3 cursor-col-resize",
                        "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-0",
                        "after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:transition after:duration-100 after:ease-linear",
                        dragging ? "after:bg-brand-solid" : "after:bg-transparent hover:after:bg-border-brand",
                    )}
                />

                <div className="flex shrink-0 items-center gap-3 border-b border-secondary px-4 py-5">
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid">
                        <span className="size-2.5 rotate-45 bg-primary-solid" />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-primary">{title}</span>
                        <span className="block truncate font-mono text-[0.625rem] tracking-[0.14em] text-tertiary uppercase">{items.length} sections</span>
                    </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                    {families.map((family) => {
                        const inFamily = items.filter((item) => item.family === family);
                        const iconKey = icons?.[family];
                        const Icon = iconKey ? RAIL_ICONS[iconKey] : undefined;
                        const isCollapsed = collapsed[family] === true;
                        const holdsActive = inFamily.some((item) => item.id === activeId);

                        return (
                            <div key={family} className="mt-0.5 first:mt-0">
                                <button
                                    type="button"
                                    onClick={() => toggle(family)}
                                    aria-expanded={!isCollapsed}
                                    aria-controls={`rail-${family}`}
                                    className={cx(
                                        "group/row flex w-full items-center gap-2.5 rounded-lg py-2 pr-2 pl-2.5 text-sm outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
                                        holdsActive
                                            ? "bg-primary font-medium text-primary shadow-xs ring-1 ring-secondary"
                                            : "text-secondary group-hover/row:text-primary hover:bg-secondary_hover",
                                    )}
                                >
                                    {Icon ? (
                                        <Icon
                                            aria-hidden="true"
                                            className={cx("size-4 shrink-0", holdsActive ? "text-fg-brand-primary" : "text-fg-quaternary")}
                                        />
                                    ) : (
                                        <span aria-hidden="true" className="size-4 shrink-0" />
                                    )}
                                    <span className="flex-1 truncate text-left">{family}</span>
                                    {/* Collapsing hides the highlighted item, so the group says it holds it. */}
                                    {isCollapsed && holdsActive && <span aria-hidden="true" className="size-1 shrink-0 rotate-45 bg-border-brand" />}
                                    <span className={countClasses}>{inFamily.length}</span>
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={cx(
                                            "size-4 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear",
                                            isCollapsed && "-rotate-90",
                                        )}
                                    />
                                </button>
                                {/* The 0fr/1fr grid trick — a disclosure has to animate its own
                                    height and `height: auto` is not animatable. `inert` rather
                                    than `hidden` keeps it out of tab order while still letting
                                    it transition. */}
                                <div
                                    className={cx(
                                        "grid transition-[grid-template-rows] duration-100 ease-linear motion-reduce:transition-none",
                                        isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                                    )}
                                >
                                    <ul id={`rail-${family}`} inert={isCollapsed} className="ml-4 flex flex-col overflow-hidden border-l border-primary">
                                        {inFamily.map((item) => {
                                            const isActive = activeId === item.id;

                                            return (
                                                <li key={item.id} className="relative">
                                                    {isActive && (
                                                        <span aria-hidden="true" className="absolute inset-y-1 -left-px w-0.5 rounded-full bg-border-brand" />
                                                    )}
                                                    <a
                                                        href={`#${item.id}`}
                                                        aria-current={isActive ? "true" : undefined}
                                                        className={cx(
                                                            "flex items-start gap-2 rounded-md py-1.5 pr-2 pl-3 text-sm outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2",
                                                            isActive ? "font-medium text-primary" : "text-tertiary hover:bg-secondary_hover hover:text-primary",
                                                        )}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className={cx(gutterClasses, isActive ? "text-brand-secondary" : "text-tertiary")}
                                                        >
                                                            {item.number}
                                                        </span>
                                                        <span className="line-clamp-2 leading-5">{item.name}</span>
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="shrink-0 border-t border-secondary px-4 py-4">
                    <p className="font-mono text-[0.625rem] tracking-[0.14em] text-tertiary uppercase">Unlisted · noindex</p>
                </div>
            </nav>

            {/* Strip — below xl */}
            <nav aria-label={label} className="sticky top-0 z-20 border-b border-secondary bg-primary/85 backdrop-blur-md xl:hidden">
                <div className="mx-auto flex w-full max-w-[1152px] gap-7 overflow-x-auto px-5 py-3 md:px-6">
                    {families.map((family) => (
                        <div key={family} className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-[0.625rem] tracking-[0.14em] text-tertiary uppercase">{family}</span>
                            {items
                                .filter((item) => item.family === family)
                                .map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        aria-current={activeId === item.id ? "true" : undefined}
                                        className={cx(
                                            "rounded-full border px-3 py-1 text-sm whitespace-nowrap outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                                            activeId === item.id
                                                ? "border-brand bg-secondary font-medium text-primary"
                                                : "border-secondary text-secondary hover:border-brand hover:text-primary",
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cx(
                                                "mr-1.5 font-mono text-[0.625rem] tabular-nums",
                                                activeId === item.id ? "text-brand-secondary" : "text-tertiary",
                                            )}
                                        >
                                            {item.number}
                                        </span>
                                        {item.name}
                                    </a>
                                ))}
                        </div>
                    ))}
                </div>
            </nav>
        </>
    );
};
