import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BarChartSquare02, Camera01, Check, CheckDone01, ChevronDown, ClipboardCheck, FilterFunnel01, HelpCircle, Home02, Hourglass01, LayoutAlt01, Lightbulb01, PenTool01, Plus, Rocket02, Settings01, Trash01, Users01 } from "@untitledui/icons";
import { PageBanner } from "@/components/application/page-banner";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { PriorityFlag, type QuestionPriority } from "@/components/application/priority-flag";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";
import { HighlightPen, renderHighlights } from "@/utils/highlight";

/**
 * Living reference page for the Homepage project — the company-wide home
 * screen (HOME icon on the icon rail) showing clients by tier, the onboarding
 * pipeline across Phases 0–5, offboarding, Account Manager workload and Web
 * Team projects. Content persists to sop_pages (slug below), mirroring the
 * other project-log pages.
 */
const SLUG = "homepage-overview";

/* ── Types ───────────────────────────────────────────────────────── */

type Stage = { label: string; detail: string };
type Todo = { id: string; text: string; done: boolean };
type QA = { id: string; question: string; answer: string; video?: string; resolved?: boolean; priority?: QuestionPriority };
type LogEntry = { id: string; date: string; title: string; description: string; video?: string };

type HomeData = {
    overview: string;
    bannerUrl?: string;
    /** The stat blocks the homepage will show (v1 idea). */
    shows: string[];
    /** Onboarding phases — Phase number = position in this list (0-based). */
    stages: Stage[];
    /** Client roster — existing + onboarding. */
    clients: string[];
    todos: Todo[];
    questions: QA[];
    log: LogEntry[];
};

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function seed(): HomeData {
    return {
        overview:
            "The Homepage is a new landing view for the whole team — the first screen you open, with the company at a glance. " +
            "It shows how many existing clients we serve (split by tier), how many clients are onboarding and where each sits in the 6 onboarding phases, " +
            "who is offboarding, how the client load is spread across Account Managers, and which website projects the Web Team is building and who manages each. " +
            "It gets its own HOME icon at the top of the department icon rail. The roster currently counts 47 clients (existing + onboarding).",
        shows: [
            "Existing clients — total count split by tier (Tier 0 / Tier 1 / Tier 2 / Mastermind, matching the dashboard Client List)",
            "Onboarding clients — how many, and where each sits across the 6 phases (Phase 0–5)",
            "Offboarding clients — how many are currently leaving",
            "Client load per Account Manager — how many clients each AM handles",
            "Web Team projects — which website projects are in flight and who manages each",
        ],
        stages: [
            { label: "Signing On", detail: "New client signs on with HGM" },
            { label: "Marketing Strategy 🧠", detail: "Strategy defined with the client" },
            { label: "Technical Setup ⚙️", detail: "Accounts, systems & website set up" },
            { label: "Content Creation 📸", detail: "Photos, copy & assets produced" },
            { label: "Funnel Setup 🎨", detail: "Funnels, popups & emails built" },
            { label: "Marketing Launch 🚀", detail: "Campaigns go live" },
        ],
        clients: [
            "Evergreen Cabins",
            "Hillside Amble",
            "Stay With Branch",
            "The Cohost Company",
            "FLOHOM",
            "Treetop Escapes",
            "Paradise Pointe",
            "Asheville River Cabins",
            "Green Springs Inn",
            "Myrinn",
            "Parker Reserve",
            "Three Suns Cabins",
            "Stay Different",
            "Nature Nooks Acadia",
            "Raven Rock Mountain",
            "Wanderin' Star Farms",
            "Starlight Haven Hot Springs",
            "Starlight Haven Weiss Lake",
            "Inspired Retreats",
            "Stay Saluda NC",
            "Hiawassee Glamping",
            "Big Moon Ranch",
            "Abode Luxury Rentals**",
            "Away2PA",
            "StayLuxe",
            "Home Base",
            "Reflections Resorts",
            "Endless Stays",
            "Stay On 30A",
            "AwayFrames",
            "Red White & Blue Views",
            "Bison Ridge Retreat",
            "American River Resort",
            "Canopy at Moody Moon",
            "Tàberg Falls",
            "Ponderosa Pines Resort",
            "Stay Southern Illinois",
            "Oak & Ember",
            "The Outpost",
            "Selah Place",
            "Columbia Gorge Getaways",
            "Best Texas Travel",
            "Sunapee Stays",
            "Tuxedo Falls",
            "Little River Marina",
            "Ridge & Falls",
            "The Riv at Zion",
        ],
        todos: [
            { id: uid(), text: "Decide the client data model — where the roster lives (new clients table with tier / status / phase / AM / web project, vs. extending the dashboard Client List)", done: false },
            { id: uid(), text: "Enter all 47 clients with their tier, status (existing / onboarding / offboarding), onboarding phase and Account Manager", done: false },
            { id: uid(), text: "Design the homepage layout — tier stat cards, onboarding pipeline by phase, offboarding, AM workload, Web Team projects", done: false },
            { id: uid(), text: "Build the homepage route + page", done: false },
            { id: uid(), text: "Add the HOME icon to the top of the department icon rail, linking to the homepage", done: false },
            { id: uid(), text: "Wire the dashboard Client List tiers to the same data so the homepage counts never drift from the Client List", done: false },
        ],
        questions: [
            {
                id: uid(),
                question:
                    "Where should the client data live — a new Supabase clients table (name, tier, status, onboarding phase, Account Manager, web project), or extend the dashboard Client List? A real table makes every homepage count automatic.",
                answer: "",
                priority: "high",
            },
            {
                id: uid(),
                question:
                    "Homepage idea #3 says 'how many clients handled by different clients' — did you mean per Account Manager? If so, who are the AMs to track?",
                answer: "",
                priority: "high",
            },
            {
                id: uid(),
                question:
                    "Which URL should the homepage live at — replace the current '/' landing page, a new /home route, or become the default view of /dashboard?",
                answer: "",
                priority: "high",
            },
            {
                id: uid(),
                question: "Of the 47 clients, which are existing vs. onboarding — and what tier / phase is each one in? (the Client List currently only has 2 clients filed, both Tier 0)",
                answer: "",
                priority: "medium",
            },
            {
                id: uid(),
                question: "What does the ** on 'Abode Luxury Rentals' mean — and are any clients offboarding right now that should count on day one?",
                answer: "",
                priority: "medium",
            },
        ],
        log: [
            {
                id: uid(),
                date: "2026-07-12",
                title: "Project kicked off — log page created",
                description:
                    "AnhTuan shared the vision: a company-wide homepage showing existing clients by tier, the onboarding pipeline across Phases 0–5, offboarding, client load per Account Manager, and which website projects the Web Team handles — plus a new HOME icon on the icon rail. The 47-client roster was recorded. Log page created first; the homepage build follows once the data-model questions are answered.",
            },
        ],
    };
}

/* ── Small editable primitives ───────────────────────────────────── */

const EditArea = ({
    value,
    editing,
    onChange,
    placeholder,
    rows = 4,
    mono = false,
}: {
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    mono?: boolean;
}) =>
    editing ? (
        <textarea
            value={value}
            rows={rows}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(
                "w-full resize-y rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand",
                mono && "font-mono text-xs leading-relaxed",
            )}
        />
    ) : value ? (
        <p className={cx("whitespace-pre-wrap text-sm text-tertiary", mono && "font-mono text-xs leading-relaxed")}>{renderHighlights(value)}</p>
    ) : (
        <p className="text-sm italic text-quaternary">{placeholder ?? "Empty — unlock editing to fill this in."}</p>
    );

const EditLine = ({
    value,
    editing,
    onChange,
    placeholder,
    className,
}: {
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}) =>
    editing ? (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(
                "w-full rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand",
                className,
            )}
        />
    ) : (
        <span className={cx("text-sm text-secondary", !value && "italic text-quaternary", className)}>{value ? renderHighlights(value) : placeholder}</span>
    );

const SectionHeader = ({ id, number, title, hint }: { id: string; number: string; title: string; hint?: string }) => (
    <div id={id} className="scroll-mt-6">
        <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-brand-solid text-xs font-semibold text-white tabular-nums">{number}</span>
            <span className="h-px flex-1 bg-border-secondary" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        {hint && <p className="mt-1 text-sm text-tertiary">{hint}</p>}
    </div>
);

/** A single question card — reused for both Open and Resolved/History lists. */
const QuestionCard = ({
    q,
    number,
    editing,
    resolved,
    onQuestion,
    onAnswer,
    onVideo,
    onRemove,
    onToggleResolved,
    onPriority,
}: {
    q: QA;
    /** Position in the full questions array (1-based) — stable across the Open/Resolved
     * split and across new questions appended later, so numbering never gets reused. */
    number: number;
    editing: boolean;
    resolved?: boolean;
    onQuestion: (v: string) => void;
    onAnswer: (v: string) => void;
    onVideo: (v: string | undefined) => void;
    onRemove: () => void;
    /** Explicit resolve toggle — typing an answer no longer auto-resolves, so a
        half-formed idea can sit in Open until it's actually checked off. */
    onToggleResolved: (v: boolean) => void;
    onPriority: (v: QuestionPriority | undefined) => void;
}) => (
    <div className={cx("rounded-2xl p-5 ring-1 ring-secondary", resolved ? "bg-secondary" : "bg-primary")}>
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
                <button type="button" title={resolved ? "Mark as unresolved" : "Mark as resolved"}
                    onClick={() => onToggleResolved(!resolved)}
                    className={cx(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition duration-100 ease-linear",
                        resolved ? "border-success bg-success-solid text-white" : "border-secondary bg-primary hover:border-brand",
                    )}>
                    {resolved && <Check className="size-3" aria-hidden="true" />}
                </button>
                <span className="mt-0.5 shrink-0 text-sm font-semibold text-quaternary tabular-nums">{number}.</span>
                <div className="min-w-0 flex-1">
                    <EditLine value={q.question} editing={editing} onChange={onQuestion} placeholder="Question…" className="font-medium text-primary" />
                </div>
            </div>
            <PriorityFlag value={q.priority} onChange={onPriority} />
            {editing && (
                <button type="button" title="Remove question" onClick={onRemove} className="shrink-0 text-fg-quaternary hover:text-fg-error-secondary">
                    <Trash01 className="size-4" />
                </button>
            )}
        </div>
        <div className={cx("mt-3 border-l-2 pl-3", resolved ? "border-success" : "border-brand")}>
            <EditArea value={q.answer} editing={editing} onChange={onAnswer} placeholder="Type your notes/decision here — check the box above when it's actually resolved." rows={2} />
        </div>
        {editing ? <VideoAttach value={q.video} onChange={onVideo} className="mt-3" /> : q.video && <VideoEmbed url={q.video} className="mt-3" />}
    </div>
);

/* ── Page ────────────────────────────────────────────────────────── */

/** Sidebar is grouped (macOS System Settings style) with dividers between groups.
    Order here IS the scroll order — keep it matching the section DOM order below. */
const NAV_GROUPS = [
    [
        { id: "s-overview", label: "Overview", icon: Home02 },
        { id: "s-shows", label: "What it shows", icon: BarChartSquare02 },
        { id: "s-phases", label: "Onboarding phases", icon: Rocket02 },
        { id: "s-clients", label: "Client roster", icon: Users01 },
    ],
    [
        { id: "s-todos", label: "Build To-dos", icon: CheckDone01 },
        { id: "s-questions", label: "Open Questions", icon: HelpCircle },
    ],
    [
        { id: "s-log", label: "Timeline", icon: Hourglass01 },
    ],
];
const SECTIONS = NAV_GROUPS.flat();

const PHASE_ICONS = [PenTool01, Lightbulb01, Settings01, Camera01, FilterFunnel01, Rocket02];

export const HomepageOverviewScreen = () => {
    const [data, setData] = useState<HomeData>(seed);
    const [editing, setEditing] = useState(false);
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [showResolved, setShowResolved] = useState(false);
    const mainRef = useRef<HTMLElement>(null);
    const hydratedRef = useRef(false);

    // Shift+E toggles edit mode; Shift+S saves immediately and locks — same
    // shortcuts as /roadmap (the hook reads fresh callbacks each render, so
    // `data` here is always current).
    useEditShortcuts({
        onToggle: () => setEditing((e) => !e),
        onSave: () => {
            supabase
                .from("sop_pages")
                .upsert({ slug: SLUG, data, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => {
                    if (error) console.error("[homepage-overview save]", error);
                });
            setEditing(false);
        },
    });

    // Load the saved row; fall back to the seed for a fresh page.
    useEffect(() => {
        supabase
            .from("sop_pages")
            .select("data")
            .eq("slug", SLUG)
            .maybeSingle()
            .then(({ data: row, error }) => {
                const d = row?.data as HomeData | undefined;
                if (!error && d && Array.isArray(d.todos)) setData(d);
                hydratedRef.current = true;
            });
    }, []);

    // Debounced autosave so edits are never trapped in one browser.
    useEffect(() => {
        if (!hydratedRef.current) return;
        const t = setTimeout(() => {
            supabase
                .from("sop_pages")
                .upsert({ slug: SLUG, data, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => {
                    if (error) console.error("[homepage-overview autosave]", error);
                });
        }, 1000);
        return () => clearTimeout(t);
    }, [data]);

    const update = (mutator: (draft: HomeData) => void) =>
        setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as HomeData;
            mutator(next);
            return next;
        });

    const goTo = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Scroll-spy: as the page scrolls, highlight the table-of-contents item for the
    // section currently in view (the last heading above the top ~40% of the pane;
    // at the very bottom the final section wins so it's reachable even when short).
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

    /* list helpers */
    const setLine = (list: "shows" | "clients", i: number, v: string) => update((d) => void (d[list][i] = v));
    const addLine = (list: "shows" | "clients") => update((d) => void d[list].push(""));
    const rmLine = (list: "shows" | "clients", i: number) => update((d) => void d[list].splice(i, 1));

    /* questions — edited by id so the open / resolved split stays stable across renders */
    const setQuestion = (id: string, patch: Partial<QA>) =>
        update((d) => {
            const q = d.questions.find((x) => x.id === id);
            if (q) Object.assign(q, patch);
        });
    const rmQuestion = (id: string) => update((d) => void (d.questions = d.questions.filter((x) => x.id !== id)));
    const addQuestion = () => update((d) => void d.questions.push({ id: uid(), question: "", answer: "", resolved: false }));

    // Explicit `resolved` flag is the source of truth; questions saved before this
    // field existed fall back to "has an answer" so their current Resolved/Open
    // placement doesn't change until someone touches the checkbox.
    const isAnswered = (q: QA) => q.resolved ?? !!(q.answer || "").trim();
    const openQuestions = data.questions.filter((q) => !isAnswered(q));
    const resolvedQuestions = data.questions.filter(isAnswered);

    return (
        <AppShell
            highlightScope
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />}
            breadcrumb={[
                { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                { label: "Project Logs", to: "/dashboard?dept=docs&tab=project-logs", icon: ClipboardCheck },
                { label: "Homepage" },
            ]}
        >
            <HighlightPen enabled={editing} />
            {navCollapsed && <CollapsedTopBar title="Homepage" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">

            {/* Section nav */}
            {!navCollapsed && (
            <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">Homepage</h2>
                    <NavCollapseButton onClick={toggleNav} />
                </div>
                <motion.nav
                    className="flex-1 overflow-y-auto px-3 py-4"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                    {NAV_GROUPS.map((group, gi) => (
                        <div key={gi}>
                            {/* Divider between groups (macOS System Settings style) */}
                            {gi > 0 && <div className="mx-3 my-2.5 h-px bg-border-secondary" />}
                            {group.map((s) => (
                                <motion.button
                                    key={s.id}
                                    type="button"
                                    onClick={() => goTo(s.id)}
                                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                                    className={cx(
                                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition duration-100 ease-linear",
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
            </aside>
            )}

            {/* Content */}
            <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden rounded-lg bg-primary shadow-sm">
                <PageBanner
                    breadcrumb={[
                        { label: "Dashboard", to: "/dashboard", icon: LayoutAlt01 },
                        { label: "Project Logs", to: "/dashboard?dept=docs&tab=project-logs", icon: ClipboardCheck },
                        { label: "Homepage" },
                    ]}
                    title="Homepage — Overview"
                    subtitle="Company-wide home screen — clients, onboarding pipeline & team assignments"
                    imageUrl={data.bannerUrl}
                    editing={editing}
                    onImageChange={(url) => update((d) => void (d.bannerUrl = url || undefined))}
                    actions={
                        <span
                            className={cx(
                                "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap backdrop-blur",
                                editing ? "border-white/40 bg-white/15 text-white" : "border-white/25 bg-white/10 text-white/90",
                            )}
                        >
                            {editing ? "Editing — autosaves" : "Locked — read only"}
                        </span>
                    }
                />
                <div className="mx-auto flex max-w-[840px] flex-col gap-14 px-6 py-10 pb-24 md:px-10">
                    {/* Intro */}
                    <div>
                        <p className="text-md text-tertiary">
                            Living reference for the Homepage project. The idea, the client roster, open questions and build progress live here —
                            Claude reads this page when working on the feature. The homepage itself isn't built yet; answering the data-model
                            questions below unblocks the build.
                        </p>
                    </div>

                    {/* 01 Overview */}
                    <section>
                        <SectionHeader id="s-overview" number="01" title="Overview" hint="What the Homepage is and why it exists." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <EditArea value={data.overview} editing={editing} onChange={(v) => update((d) => void (d.overview = v))} rows={6} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ["Clients", "47 (existing + onboarding)"],
                                ["Onboarding phases", "6 (Phase 0–5)"],
                                ["Entry point", "HOME icon on the icon rail"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                    <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 02 What it shows */}
                    <section>
                        <SectionHeader
                            id="s-shows"
                            number="02"
                            title="What the homepage shows (v1)"
                            hint="AnhTuan's first idea — the general-information blocks, in priority order."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ul className="flex flex-col gap-2">
                                {data.shows.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={item} editing={editing} onChange={(v) => setLine("shows", i, v)} placeholder="Stat block…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove item" onClick={() => rmLine("shows", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editing && (
                                <button type="button" onClick={() => addLine("shows")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add item
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 03 Onboarding phases */}
                    <section>
                        <SectionHeader
                            id="s-phases"
                            number="03"
                            title="Onboarding phases"
                            hint="Every onboarding client moves through these 6 phases — the homepage shows where each client sits."
                        />
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {data.stages.map((s, i) => {
                                const PhaseIcon = PHASE_ICONS[i % PHASE_ICONS.length];
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-5 text-center ring-1 ring-secondary">
                                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                            <PhaseIcon className="size-4" aria-hidden="true" />
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-quaternary">Phase {i}</span>
                                        {editing ? (
                                            <>
                                                <EditLine
                                                    value={s.label}
                                                    editing={editing}
                                                    onChange={(v) => update((d) => void (d.stages[i].label = v))}
                                                    placeholder="Phase…"
                                                    className="text-center font-semibold"
                                                />
                                                <EditLine
                                                    value={s.detail}
                                                    editing={editing}
                                                    onChange={(v) => update((d) => void (d.stages[i].detail = v))}
                                                    placeholder="Detail…"
                                                    className="text-center text-xs"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-semibold text-primary">{renderHighlights(s.label)}</p>
                                                <p className="text-xs text-tertiary">{renderHighlights(s.detail)}</p>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 04 Client roster */}
                    <section>
                        <SectionHeader
                            id="s-clients"
                            number="04"
                            title={`Client roster (${data.clients.length})`}
                            hint="Existing + onboarding clients, as shared on 2026-07-12. Tier / status / phase / AM per client is still to be filed (see To-dos)."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                                {data.clients.map((name, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums dark:bg-brand-950/50 dark:text-brand-300">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={name} editing={editing} onChange={(v) => setLine("clients", i, v)} placeholder="Client…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove client" onClick={() => rmLine("clients", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ol>
                            {editing && (
                                <button type="button" onClick={() => addLine("clients")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add client
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 05 To-dos */}
                    <section>
                        <SectionHeader id="s-todos" number="05" title="Build To-dos" hint="Checklist to get the homepage shipped. Tick items as they land." />
                        <div className="mt-4 flex flex-col gap-1.5">
                            {data.todos.map((t, i) => (
                                <div key={t.id} className="flex items-center gap-3 rounded-xl bg-primary px-4 py-2.5 ring-1 ring-secondary">
                                    <button
                                        type="button"
                                        onClick={() => update((d) => void (d.todos[i].done = !d.todos[i].done))}
                                        className={cx(
                                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition duration-100 ease-linear",
                                            t.done ? "border-brand bg-brand-solid text-white" : "border-primary bg-primary hover:border-brand",
                                        )}
                                        title={t.done ? "Mark not done" : "Mark done"}
                                    >
                                        {t.done && <Check className="size-3.5" />}
                                    </button>
                                    <div className={cx("min-w-0 flex-1", t.done && "opacity-60")}>
                                        <EditLine
                                            value={t.text}
                                            editing={editing}
                                            onChange={(v) => update((d) => void (d.todos[i].text = v))}
                                            placeholder="To-do…"
                                            className={t.done ? "line-through" : undefined}
                                        />
                                    </div>
                                    {editing && (
                                        <button type="button" title="Remove to-do" onClick={() => update((d) => void d.todos.splice(i, 1))} className="text-fg-quaternary hover:text-fg-error-secondary">
                                            <Trash01 className="size-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {editing && (
                            <button
                                type="button"
                                onClick={() => update((d) => void d.todos.push({ id: uid(), text: "", done: false }))}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                            >
                                <Plus className="size-4" /> Add to-do
                            </button>
                        )}
                    </section>

                    {/* 06 Questions */}
                    <section>
                        <SectionHeader
                            id="s-questions"
                            number="06"
                            title="Open Questions"
                            hint="Answer inline — decisions live here so nothing gets lost in chat. Answered questions move to Resolved / History below (nothing is deleted)."
                        />
                        <div className="mt-4 flex flex-col gap-4">
                            {openQuestions.length === 0 ? (
                                <p className="rounded-2xl bg-primary p-5 text-sm italic text-quaternary ring-1 ring-secondary">
                                    No open questions right now — everything's been answered.
                                </p>
                            ) : (
                                openQuestions.map((q) => (
                                    <QuestionCard
                                        key={q.id}
                                        q={q}
                                        number={data.questions.findIndex((x) => x.id === q.id) + 1}
                                        editing={editing}
                                        onQuestion={(v) => setQuestion(q.id, { question: v })}
                                        onAnswer={(v) => setQuestion(q.id, { answer: v })}
                                        onVideo={(v) => setQuestion(q.id, { video: v })}
                                        onRemove={() => rmQuestion(q.id)}
                                        onToggleResolved={(v) => setQuestion(q.id, { resolved: v })}
                                        onPriority={(v) => setQuestion(q.id, { priority: v })}
                                    />
                                ))
                            )}
                        </div>
                        {editing && (
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
                            >
                                <Plus className="size-4" /> Add question
                            </button>
                        )}

                        {/* Resolved / History — answered questions collapse here so the open list stays focused. */}
                        {resolvedQuestions.length > 0 && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowResolved((s) => !s)}
                                    aria-expanded={showResolved || editing}
                                    className="flex w-full items-center gap-2.5 rounded-xl bg-secondary px-4 py-3 text-left text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                                >
                                    <ChevronDown
                                        className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-200", (showResolved || editing) && "rotate-180")}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1">Resolved / History</span>
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-tertiary tabular-nums ring-1 ring-secondary">
                                        {resolvedQuestions.length}
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {(showResolved || editing) && (
                                        <motion.div
                                            key="resolved"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-3 flex flex-col gap-4">
                                                {resolvedQuestions.map((q) => (
                                                    <QuestionCard
                                                        key={q.id}
                                                        q={q}
                                                        number={data.questions.findIndex((x) => x.id === q.id) + 1}
                                                        editing={editing}
                                                        resolved
                                                        onQuestion={(v) => setQuestion(q.id, { question: v })}
                                                        onAnswer={(v) => setQuestion(q.id, { answer: v })}
                                                        onVideo={(v) => setQuestion(q.id, { video: v })}
                                                        onRemove={() => rmQuestion(q.id)}
                                                        onToggleResolved={(v) => setQuestion(q.id, { resolved: v })}
                                                        onPriority={(v) => setQuestion(q.id, { priority: v })}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>

                    {/* 07 Timeline */}
                    <section>
                        <SectionHeader id="s-log" number="07" title="Timeline" hint="Build log — updated as the project progresses." />
                        <div className="mt-4 flex flex-col gap-3">
                            <AnimatePresence>
                                {data.log.map((e) => (
                                    <motion.div key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{e.date}</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{renderHighlights(e.title)}</p>
                                        <p className="mt-1 text-sm text-tertiary">{renderHighlights(e.description)}</p>
                                        {e.video && <VideoEmbed url={e.video} className="mt-3" />}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </main>
            </div>
        </AppShell>
    );
};
