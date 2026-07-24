import { useEffect, useRef, useState, type FC, type ReactNode } from "react";
import { motion } from "motion/react";
import {
    ArrowUp,
    BookOpen01,
    Check,
    CheckSquare,
    ClipboardCheck,
    Code02,
    Cube01,
    CursorClick01,
    Home02,
    LayoutAlt01,
    Mail01,
    Moon01,
    Palette,
    PenTool01,
    Plus,
    Settings01,
    Sun,
    Tag01,
    Trash01,
    Type01,
    User01,
    Users01,
} from "@untitledui/icons";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, useNavCollapsed } from "@/components/application/icon-rail";
import { MilestonesPanel, type Milestone, type WaitingItem } from "@/components/application/milestones-panel";
import { PageBanner } from "@/components/application/page-banner";
import { PriorityFlag, type QuestionPriority } from "@/components/application/priority-flag";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

/**
 * Design System (/designsystem) — the living reference for how this app looks
 * and is built. Everything below renders the REAL components from src/, so the
 * page can never drift out of date: if a component changes, this page changes.
 * Replaces the old pre-compiled iframe bundle (whose source no longer exists).
 */

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

const SECTIONS = [
    { id: "s-overview", label: "Overview", icon: Home02 },
    { id: "s-colors", label: "Colors", icon: Palette },
    { id: "s-typography", label: "Typography", icon: Type01 },
    { id: "s-buttons", label: "Buttons", icon: CursorClick01 },
    { id: "s-badges", label: "Badges", icon: Tag01 },
    { id: "s-forms", label: "Form controls", icon: CheckSquare },
    { id: "s-avatars", label: "Avatars & icons", icon: User01 },
    { id: "s-app", label: "App components", icon: Cube01 },
    { id: "s-conventions", label: "Conventions", icon: BookOpen01 },
];
const NAV_GROUPS = [SECTIONS.slice(0, 3), SECTIONS.slice(3, 8), SECTIONS.slice(8)];

/* ── Small page-local building blocks ────────────────────────────── */

const SectionHeader = ({ id, number, title, hint }: { id: string; number: string; title: string; hint?: string }) => (
    <div id={id} className="scroll-mt-6">
        <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm font-semibold text-brand-secondary">{number}</span>
            <h2 className="text-display-xs font-semibold text-primary">{title}</h2>
        </div>
        {hint && <p className="mt-1 text-sm text-tertiary">{hint}</p>}
    </div>
);

/** Readable container every demo sits in (project convention). */
const DemoCard = ({ title, children, className }: { title?: string; children: ReactNode; className?: string }) => (
    <div className={cx("rounded-2xl bg-primary p-5 ring-1 ring-secondary", className)}>
        {title && <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-quaternary">{title}</p>}
        {children}
    </div>
);

/** One-line import path shown under a demo. */
const ImportPath = ({ children }: { children: string }) => (
    <p className="mt-4 overflow-x-auto whitespace-nowrap rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-tertiary">{children}</p>
);

const Swatch = ({ cls, label }: { cls: string; label: string }) => (
    <div className="flex flex-col gap-1.5">
        <div className={cx("h-12 rounded-lg ring-1 ring-inset ring-secondary", cls)} />
        <p className="truncate font-mono text-xs text-tertiary" title={label}>
            {label}
        </p>
    </div>
);

const DoDont = ({ good, bad }: { good: string; bad: string }) => (
    <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg bg-success-primary px-3 py-2">
            <Check className="size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />
            <code className="font-mono text-xs text-success-primary">{good}</code>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-error-primary px-3 py-2">
            <Trash01 className="size-4 shrink-0 text-fg-error-secondary" aria-hidden="true" />
            <code className="font-mono text-xs text-error-primary line-through">{bad}</code>
        </div>
    </div>
);

/* ── Static token data (full literal class names so Tailwind emits them) ── */

const BRAND_SCALE = [
    { cls: "bg-brand-25", label: "25" },
    { cls: "bg-brand-50", label: "50" },
    { cls: "bg-brand-100", label: "100" },
    { cls: "bg-brand-200", label: "200" },
    { cls: "bg-brand-300", label: "300" },
    { cls: "bg-brand-400", label: "400" },
    { cls: "bg-brand-500", label: "500" },
    { cls: "bg-brand-600", label: "600" },
    { cls: "bg-brand-700", label: "700" },
    { cls: "bg-brand-800", label: "800" },
    { cls: "bg-brand-900", label: "900" },
    { cls: "bg-brand-950", label: "950" },
];

const TEXT_TOKENS = [
    "text-primary",
    "text-secondary",
    "text-tertiary",
    "text-quaternary",
    "text-brand-primary",
    "text-brand-secondary",
    "text-error-primary",
    "text-warning-primary",
    "text-success-primary",
];

const BG_TOKENS = [
    { cls: "bg-primary", label: "bg-primary" },
    { cls: "bg-secondary", label: "bg-secondary" },
    { cls: "bg-tertiary", label: "bg-tertiary" },
    { cls: "bg-quaternary", label: "bg-quaternary" },
    { cls: "bg-brand-secondary", label: "bg-brand-secondary" },
    { cls: "bg-brand-solid", label: "bg-brand-solid" },
    { cls: "bg-error-secondary", label: "bg-error-secondary" },
    { cls: "bg-warning-secondary", label: "bg-warning-secondary" },
    { cls: "bg-success-secondary", label: "bg-success-secondary" },
];

const BORDER_TOKENS = [
    { cls: "border-primary", label: "border-primary" },
    { cls: "border-secondary", label: "border-secondary" },
    { cls: "border-tertiary", label: "border-tertiary" },
    { cls: "border-brand", label: "border-brand" },
    { cls: "border-error", label: "border-error" },
];

const FG_TOKENS = [
    { cls: "text-fg-primary", label: "fg-primary" },
    { cls: "text-fg-secondary", label: "fg-secondary" },
    { cls: "text-fg-tertiary", label: "fg-tertiary" },
    { cls: "text-fg-quaternary", label: "fg-quaternary" },
    { cls: "text-fg-brand-primary", label: "fg-brand-primary" },
    { cls: "text-fg-error-primary", label: "fg-error-primary" },
    { cls: "text-fg-warning-primary", label: "fg-warning-primary" },
    { cls: "text-fg-success-primary", label: "fg-success-primary" },
];

const DISPLAY_SCALE = [
    { cls: "text-display-lg", label: "text-display-lg", sample: "Display LG" },
    { cls: "text-display-md", label: "text-display-md", sample: "Display MD" },
    { cls: "text-display-sm", label: "text-display-sm", sample: "Display SM" },
    { cls: "text-display-xs", label: "text-display-xs", sample: "Display XS — section headings" },
];

const TEXT_SCALE = [
    { cls: "text-xl", label: "text-xl", sample: "Text XL — hero supporting copy" },
    { cls: "text-lg", label: "text-lg", sample: "Text LG — key context" },
    { cls: "text-md", label: "text-md", sample: "Text MD — body default, main content text" },
    { cls: "text-sm", label: "text-sm", sample: "Text SM — labels, buttons, secondary copy" },
    { cls: "text-xs", label: "text-xs", sample: "Text XS — captions & meta info" },
];

const BUTTON_COLORS = ["primary", "secondary", "tertiary", "link-gray", "link-color"] as const;
const BUTTON_DESTRUCTIVE = ["primary-destructive", "secondary-destructive", "tertiary-destructive", "link-destructive"] as const;
const BUTTON_SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const BADGE_COLORS = ["gray", "brand", "error", "warning", "success", "blue", "indigo", "purple", "pink", "orange"] as const;

const FEATURED_THEMES = ["light", "gradient", "dark", "outline"] as const;
const FEATURED_COLORS = ["brand", "gray", "error", "warning", "success"] as const;

const ICON_SAMPLES: { icon: FC<{ className?: string }>; name: string }[] = [
    { icon: Home02, name: "Home02" },
    { icon: Users01, name: "Users01" },
    { icon: Code02, name: "Code02" },
    { icon: BookOpen01, name: "BookOpen01" },
    { icon: Settings01, name: "Settings01" },
    { icon: PenTool01, name: "PenTool01" },
    { icon: ClipboardCheck, name: "ClipboardCheck" },
    { icon: Mail01, name: "Mail01" },
];

const CONVENTIONS: { title: string; body: string; code: string }[] = [
    {
        title: "Semantic color tokens only",
        body: "Raw Tailwind palette utilities are fixed values that break dark mode. Semantic tokens adapt automatically. Full list in .claude/rules/colors.md.",
        code: 'text-primary  bg-secondary  ring-secondary   // never text-gray-900 / bg-blue-700',
    },
    {
        title: "React Aria imports — Aria* prefix",
        body: "Everything from react-aria-components is aliased so it can't collide with our own components.",
        code: 'import { Button as AriaButton } from "react-aria-components";',
    },
    {
        title: "File naming — kebab-case",
        body: "Components, ts/js, css, tests, configs — all kebab-case, no exceptions.",
        code: "date-picker.tsx   api-client.ts   // never DatePicker.tsx",
    },
    {
        title: "Disabled states — opacity-50",
        body: "One consistent pattern; do not use the old v7 disabled tokens.",
        code: "disabled:cursor-not-allowed disabled:opacity-50",
    },
    {
        title: "Image uploads — compress to WebP",
        body: "Every upload handler goes through compressImageFile() (≤1600px, WebP ~0.82). Images live as base64 in Supabase, so raw originals bloat every page load.",
        code: 'import { compressImageFile } from "@/utils/compress-image";',
    },
    {
        title: "Transitions — fast and linear",
        body: "Default micro-interaction timing for hovers and state changes.",
        code: "transition duration-100 ease-linear",
    },
    {
        title: "Readable container",
        body: "Bare sections and paragraphs that are hard to read get wrapped in a background card — the pattern every demo on this page sits in.",
        code: "rounded-2xl bg-primary p-5 ring-1 ring-secondary",
    },
    {
        title: "Sidebar nav — stagger animation",
        body: "Sidebar nav items always stagger in at 0.05s per item (icon rails don't).",
        code: 'variants={{ show: { transition: { staggerChildren: 0.05 } } }}',
    },
    {
        title: "Persistence — Supabase first",
        body: "Editable page content saves to Supabase (Firebase Firestore as the outage fallback via db-sync) — never localStorage-only.",
        code: 'import { readSopPage, writeSopPage } from "@/lib/db-sync";',
    },
    {
        title: "New components — Untitled UI CLI",
        body: "Add missing Untitled UI components with the CLI (PRO auth is saved on this machine) instead of hand-writing them.",
        code: "npx untitledui@latest add <component>",
    },
];

/* ── Page ────────────────────────────────────────────────────────── */

export const DesignSystemScreen = () => {
    const { theme, setTheme } = useTheme();
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const isDark =
        theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const mainRef = useRef<HTMLElement>(null);

    /* live demo state */
    const [checked, setChecked] = useState(true);
    const [toggled, setToggled] = useState(true);
    const [priority, setPriority] = useState<QuestionPriority | undefined>("high");
    const [demoEditing, setDemoEditing] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>([
        { id: uid(), label: "M1 · Ship the first version", status: "done" },
        { id: uid(), label: "M2 · Collect team feedback", status: "progress" },
        { id: uid(), label: "M3 · Polish & hand off", status: "next" },
    ]);
    const [waiting, setWaiting] = useState<WaitingItem[]>([{ id: uid(), text: "Example: waiting on client to confirm the copy" }]);

    const goTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Scroll-spy: highlight the nav item for the section currently in view.
    useEffect(() => {
        const main = mainRef.current;
        if (!main) return;
        const onScroll = () => {
            let current = SECTIONS[0].id;
            if (main.scrollTop + main.clientHeight >= main.scrollHeight - 8) {
                current = SECTIONS[SECTIONS.length - 1].id;
            } else {
                const mainTop = main.getBoundingClientRect().top;
                for (const s of SECTIONS) {
                    const el = document.getElementById(s.id);
                    if (el && el.getBoundingClientRect().top - mainTop <= main.clientHeight * 0.4) current = s.id;
                }
            }
            setActiveSection(current);
        };
        main.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => main.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <AppShell className="flex flex-col" rail={!navCollapsed && <IconRail activeDept="" />}>
            {navCollapsed && <CollapsedTopBar title="Design System" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">
                {/* Section nav */}
                {!navCollapsed && (
                    <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                        <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                            <h2 className="text-md font-semibold text-primary">Design System</h2>
                            <NavCollapseButton onClick={toggleNav} />
                        </div>
                        <motion.nav
                            className="flex-1 overflow-y-auto px-3 py-4"
                            initial="hidden"
                            animate="show"
                            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {NAV_GROUPS.map((group, gi) => (
                                <div key={gi} className="space-y-1">
                                    {gi > 0 && <div className="mx-3 my-3 h-px bg-border-secondary" />}
                                    {group.map((s) => (
                                        <motion.button
                                            key={s.id}
                                            type="button"
                                            onClick={() => goTo(s.id)}
                                            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                                            className={cx(
                                                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition duration-100 ease-linear",
                                                activeSection === s.id
                                                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                                                    : "text-secondary hover:bg-secondary_hover hover:text-primary",
                                            )}
                                        >
                                            <s.icon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                            {s.label}
                                        </motion.button>
                                    ))}
                                </div>
                            ))}
                        </motion.nav>
                        {/* Theme toggle — this page doubles as the light/dark contrast check */}
                        <div className="flex items-center justify-between border-t border-secondary px-5 py-3">
                            <span className="text-xs text-quaternary">Check both modes</span>
                            <button
                                type="button"
                                onClick={() => setTheme(isDark ? "light" : "dark")}
                                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                                className="flex size-9 items-center justify-center rounded-full border border-secondary bg-primary text-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-primary"
                            >
                                {isDark ? <Sun className="size-[18px]" /> : <Moon01 className="size-[18px]" />}
                            </button>
                        </div>
                    </aside>
                )}

                {/* Content */}
                <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-primary shadow-sm">
                    <PageBanner
                        breadcrumb={[{ label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 }, { label: "Design System" }]}
                        title="Design System"
                        subtitle="Tokens, type & components — rendered live from the real code, so it's always current"
                        actions={
                            <span className="inline-flex shrink-0 items-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-white/90 backdrop-blur">
                                Live — renders real components
                            </span>
                        }
                    />
                    <div className="mx-auto flex max-w-[920px] flex-col gap-14 px-6 py-10 pb-24 md:px-10">
                        {/* 01 Overview */}
                        <section>
                            <SectionHeader
                                id="s-overview"
                                number="01"
                                title="Overview"
                                hint="What this app is built with, and why this page never goes stale."
                            />
                            <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                <p className="text-md text-tertiary">
                                    Every swatch, heading and control on this page is the real thing — imported from{" "}
                                    <code className="rounded bg-secondary px-1 font-mono text-sm text-secondary">src/components</code> and rendered live.
                                    When a component or token changes in code, this reference updates with it. Use the theme toggle in the sidebar to
                                    verify everything holds up in light <em>and</em> dark mode.
                                </p>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    ["Framework", "React 19 + TypeScript"],
                                    ["Styling", "Tailwind CSS v4 tokens"],
                                    ["Behavior & a11y", "React Aria Components"],
                                    ["Component kit", "Untitled UI React"],
                                ].map(([k, v]) => (
                                    <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                        <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 02 Colors */}
                        <section>
                            <SectionHeader
                                id="s-colors"
                                number="02"
                                title="Colors"
                                hint="Semantic tokens only — they adapt to light/dark automatically. Rebrand by editing --color-brand-* in src/styles/theme.css."
                            />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="Brand scale (25 → 950)">
                                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-12">
                                        {BRAND_SCALE.map((s) => (
                                            <Swatch key={s.label} cls={s.cls} label={s.label} />
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Text tokens">
                                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {TEXT_TOKENS.map((t) => (
                                            <div key={t} className="flex items-baseline justify-between gap-3">
                                                <span className={cx("text-lg font-semibold", t)}>Aa</span>
                                                <code className="font-mono text-xs text-tertiary">{t}</code>
                                            </div>
                                        ))}
                                    </div>
                                </DemoCard>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <DemoCard title="Background tokens">
                                        <div className="grid grid-cols-3 gap-3">
                                            {BG_TOKENS.map((s) => (
                                                <Swatch key={s.label} cls={s.cls} label={s.label} />
                                            ))}
                                        </div>
                                    </DemoCard>
                                    <DemoCard title="Border & foreground tokens">
                                        <div className="grid grid-cols-3 gap-3">
                                            {BORDER_TOKENS.map((s) => (
                                                <div key={s.label} className="flex flex-col gap-1.5">
                                                    <div className={cx("h-12 rounded-lg border-2 bg-primary", s.cls)} />
                                                    <p className="truncate font-mono text-xs text-tertiary" title={s.label}>
                                                        {s.label}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-4">
                                            {FG_TOKENS.map((s) => (
                                                <div key={s.label} className="flex flex-col items-center gap-1" title={s.label}>
                                                    <Settings01 className={cx("size-5", s.cls)} aria-hidden="true" />
                                                    <span className="font-mono text-[10px] text-quaternary">{s.label.replace("fg-", "")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DemoCard>
                                </div>
                                <DemoCard title="The rule">
                                    <DoDont good="text-primary · bg-error-secondary" bad="text-gray-900 · bg-red-50" />
                                </DemoCard>
                            </div>
                        </section>

                        {/* 03 Typography */}
                        <section>
                            <SectionHeader id="s-typography" number="03" title="Typography" hint="Inter, always — no serif or display font swaps." />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="Display scale">
                                    <div className="flex flex-col gap-4">
                                        {DISPLAY_SCALE.map((t) => (
                                            <div key={t.cls} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                                <span className={cx("font-semibold text-primary", t.cls)}>{t.sample}</span>
                                                <code className="font-mono text-xs text-quaternary">{t.label}</code>
                                            </div>
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Text scale">
                                    <div className="flex flex-col gap-3">
                                        {TEXT_SCALE.map((t) => (
                                            <div key={t.cls} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                                <span className={cx("text-secondary", t.cls)}>{t.sample}</span>
                                                <code className="font-mono text-xs text-quaternary">{t.label}</code>
                                            </div>
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Weights">
                                    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
                                        {[
                                            ["font-normal", "Regular 400"],
                                            ["font-medium", "Medium 500"],
                                            ["font-semibold", "Semibold 600"],
                                            ["font-bold", "Bold 700"],
                                        ].map(([cls, label]) => (
                                            <span key={cls} className={cx("text-lg text-primary", cls)}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </DemoCard>
                            </div>
                        </section>

                        {/* 04 Buttons */}
                        <section>
                            <SectionHeader id="s-buttons" number="04" title="Buttons" hint="One Button component covers actions AND links (pass href)." />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="Sizes">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {BUTTON_SIZES.map((size) => (
                                            <Button key={size} size={size}>
                                                Size {size}
                                            </Button>
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Colors">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {BUTTON_COLORS.map((color) => (
                                            <Button key={color} size="md" color={color}>
                                                {color}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        {BUTTON_DESTRUCTIVE.map((color) => (
                                            <Button key={color} size="md" color={color}>
                                                {color.replace("-destructive", "")}
                                            </Button>
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Icons & states">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button size="md" iconLeading={Plus}>
                                            Icon leading
                                        </Button>
                                        <Button size="md" color="secondary" iconTrailing={ArrowUp}>
                                            Icon trailing
                                        </Button>
                                        <Button size="md" isLoading showTextWhileLoading>
                                            Saving…
                                        </Button>
                                        <Button size="md" isDisabled>
                                            Disabled
                                        </Button>
                                        <Button size="md" color="primary-destructive" iconLeading={Trash01}>
                                            Delete
                                        </Button>
                                    </div>
                                </DemoCard>
                                <ImportPath>{'import { Button } from "@/components/base/buttons/button";'}</ImportPath>
                            </div>
                        </section>

                        {/* 05 Badges */}
                        <section>
                            <SectionHeader id="s-badges" number="05" title="Badges" hint="Badge, BadgeWithDot and BadgeWithIcon across the color set." />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="Colors (pill)">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {BADGE_COLORS.map((color) => (
                                            <Badge key={color} color={color} size="md">
                                                {color}
                                            </Badge>
                                        ))}
                                    </div>
                                </DemoCard>
                                <DemoCard title="Variants">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <BadgeWithDot color="success" size="md">
                                            Active
                                        </BadgeWithDot>
                                        <BadgeWithDot color="warning" size="md">
                                            Pending
                                        </BadgeWithDot>
                                        <BadgeWithDot color="gray" size="md">
                                            Offline
                                        </BadgeWithDot>
                                        <BadgeWithIcon color="success" size="md" iconLeading={ArrowUp}>
                                            12%
                                        </BadgeWithIcon>
                                        <Badge color="gray" size="md" type="modern">
                                            modern
                                        </Badge>
                                        <Badge color="brand" size="md" type="color">
                                            color
                                        </Badge>
                                    </div>
                                </DemoCard>
                                <ImportPath>{'import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";'}</ImportPath>
                            </div>
                        </section>

                        {/* 06 Form controls */}
                        <section>
                            <SectionHeader
                                id="s-forms"
                                number="06"
                                title="Form controls"
                                hint="React Aria under the hood — keyboard & screen-reader support comes built in."
                            />
                            <div className="mt-4 flex flex-col gap-4">
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <DemoCard title="Input">
                                        <div className="flex flex-col gap-4">
                                            <Input label="Email" placeholder="olivia@hiddengem.media" icon={Mail01} />
                                            <Input label="Email" placeholder="olivia@hiddengem" isInvalid hint="Please enter a valid email address." />
                                            <Input label="Disabled" placeholder="Can't touch this" isDisabled />
                                        </div>
                                    </DemoCard>
                                    <DemoCard title="Select · Checkbox · Toggle">
                                        <div className="flex flex-col gap-4">
                                            <Select
                                                label="Department"
                                                placeholder="Pick a department"
                                                items={[
                                                    { id: "web", label: "Web Team" },
                                                    { id: "am", label: "Account Management" },
                                                    { id: "docs", label: "Docs" },
                                                ]}
                                            >
                                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                            </Select>
                                            <Checkbox label="Notify the team" hint="Posts an update to the questions inbox." isSelected={checked} onChange={setChecked} />
                                            <Toggle label="Edit mode" isSelected={toggled} onChange={setToggled} />
                                        </div>
                                    </DemoCard>
                                </div>
                                <ImportPath>{'import { Input } from "@/components/base/input/input";  // select/, checkbox/, toggle/ alongside'}</ImportPath>
                            </div>
                        </section>

                        {/* 07 Avatars & icons */}
                        <section>
                            <SectionHeader id="s-avatars" number="07" title="Avatars & icons" hint="Avatar sizes and states; FeaturedIcon themes; @untitledui/icons usage." />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="Avatar — sizes, initials & status">
                                    <div className="flex flex-wrap items-end gap-4">
                                        {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
                                            <div key={size} className="flex flex-col items-center gap-1.5">
                                                <Avatar size={size} initials="AT" alt={`Avatar ${size}`} />
                                                <span className="font-mono text-xs text-quaternary">{size}</span>
                                            </div>
                                        ))}
                                        <div className="flex flex-col items-center gap-1.5">
                                            <Avatar size="lg" initials="GM" alt="Online avatar" status="online" />
                                            <span className="font-mono text-xs text-quaternary">online</span>
                                        </div>
                                    </div>
                                </DemoCard>
                                <DemoCard title="FeaturedIcon — themes × colors">
                                    <div className="flex flex-col gap-3">
                                        {FEATURED_THEMES.map((themeName) => (
                                            <div key={themeName} className="flex flex-wrap items-center gap-3">
                                                <span className="w-16 font-mono text-xs text-quaternary">{themeName}</span>
                                                {FEATURED_COLORS.map((color) => (
                                                    <FeaturedIcon key={color} icon={Check} size="md" color={color} theme={themeName} />
                                                ))}
                                            </div>
                                        ))}
                                        <p className="text-xs text-quaternary">The modern / modern-neue themes also exist but are gray-only.</p>
                                    </div>
                                </DemoCard>
                                <DemoCard title="Icons — @untitledui/icons">
                                    <div className="flex flex-wrap items-center gap-5">
                                        {ICON_SAMPLES.map(({ icon: Icon, name }) => (
                                            <div key={name} className="flex flex-col items-center gap-1.5">
                                                <Icon className="size-5 text-fg-quaternary" aria-hidden="true" />
                                                <span className="font-mono text-[10px] text-quaternary">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-sm text-tertiary">
                                        Named imports only (tree-shakeable); sizes <code className="font-mono text-xs">size-4/5/6</code>; color via semantic{" "}
                                        <code className="font-mono text-xs">text-fg-*</code> tokens; decorative icons get{" "}
                                        <code className="font-mono text-xs">aria-hidden</code>.
                                    </p>
                                </DemoCard>
                            </div>
                        </section>

                        {/* 08 App components */}
                        <section>
                            <SectionHeader
                                id="s-app"
                                number="08"
                                title="App components"
                                hint="Shared application-level pieces. The icon rail, sidebar and page banner on this very page are three more."
                            />
                            <div className="mt-4 flex flex-col gap-4">
                                <DemoCard title="MilestonesPanel — live demo (try edit mode)">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <p className="text-sm text-tertiary">Shared by all project-log pages; arrays persist inside each page's sop_pages row.</p>
                                        <Button size="sm" color="secondary" onClick={() => setDemoEditing((e) => !e)}>
                                            {demoEditing ? "Done" : "Edit"}
                                        </Button>
                                    </div>
                                    <MilestonesPanel
                                        milestones={milestones}
                                        waiting={waiting}
                                        editing={demoEditing}
                                        onMilestones={setMilestones}
                                        onWaiting={setWaiting}
                                    />
                                </DemoCard>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <DemoCard title="PriorityFlag — click to change">
                                        <div className="flex items-center gap-3">
                                            <PriorityFlag value={priority} onChange={setPriority} />
                                            <span className="text-sm text-tertiary">Current: {priority ?? "none"} — used on /questions and overview-page question lists.</span>
                                        </div>
                                    </DemoCard>
                                    <DemoCard title="Tooltip">
                                        <Tooltip title="Tooltips use React Aria" description="300ms delay by default." arrow>
                                            <Button size="md" color="secondary">
                                                Hover me
                                            </Button>
                                        </Tooltip>
                                    </DemoCard>
                                </div>
                                <ImportPath>{'import { MilestonesPanel } from "@/components/application/milestones-panel";'}</ImportPath>
                            </div>
                        </section>

                        {/* 09 Conventions */}
                        <section>
                            <SectionHeader
                                id="s-conventions"
                                number="09"
                                title="Conventions"
                                hint="The house rules — the full versions live in CLAUDE.md and .claude/rules/."
                            />
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                {CONVENTIONS.map((c) => (
                                    <DemoCard key={c.title}>
                                        <p className="text-sm font-semibold text-primary">{c.title}</p>
                                        <p className="mt-1 text-sm text-tertiary">{c.body}</p>
                                        <pre className="mt-3 overflow-x-auto rounded-lg bg-secondary px-3 py-2 font-mono text-xs leading-relaxed text-secondary">{c.code}</pre>
                                    </DemoCard>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </AppShell>
    );
};
