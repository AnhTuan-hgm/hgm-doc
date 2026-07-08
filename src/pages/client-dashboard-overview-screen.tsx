import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpen01, Briefcase01, Check, CheckDone01, ChevronDown, ChevronUp, ClipboardCheck, Database01, FileCheck02, HelpCircle, Hourglass01, LayoutAlt01, Plus, Send01, Stars01, Trash01, Users01, Zap } from "@untitledui/icons";
import { PageBanner } from "@/components/application/page-banner";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";
import { HighlightPen, renderHighlights } from "@/utils/highlight";

/**
 * Living reference page for the Client Dashboard + Master Document project.
 * AnhTuan + Claude use it to track field decisions, permissions, open
 * questions and build progress. Content persists to sop_pages (slug below),
 * mirroring how /roadmap stores its data.
 */
const SLUG = "client-dashboard-overview";

/* ── Types ───────────────────────────────────────────────────────── */

type Stage = { label: string; detail: string };
type Todo = { id: string; text: string; done: boolean };
type QA = { id: string; question: string; answer: string; video?: string };
type LogEntry = { id: string; date: string; title: string; description: string; video?: string };

type DashData = {
    overview: string;
    bannerUrl?: string;
    stages: Stage[];
    fields: string[];
    workflow: string[];
    ownerFunctions: Todo[];
    guestFunctions: Todo[];
    todos: Todo[];
    questions: QA[];
    log: LogEntry[];
};

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

/** Owner/guest function lists shipped as plain strings before move/checkbox support — upgrade old rows in place. */
function normalizeFunctions(list: unknown): Todo[] {
    if (!Array.isArray(list)) return [];
    return list.map((item) => (typeof item === "string" ? { id: uid(), text: item, done: false } : { id: item.id ?? uid(), text: item.text ?? "", done: !!item.done }));
}

function seed(): DashData {
    return {
        overview:
            "The Client Dashboard is each client's home inside our docs site — and the place where the Master Document lives. " +
            "Clients and their AMs fill in and update everything about the property: FAQs, ideal-guest persona, tone of voice, amenities and links. " +
            "Anyone can update it anytime — the client from their side, an AM after a call. " +
            "That one document then powers everything downstream: the AM's Welcome Email Flow drafts, the AI chat widget on the client website, and any future AI feature. " +
            "Structured input in → smart output everywhere.",
        stages: [
            { label: "Client", detail: "Fills in / updates their info anytime" },
            { label: "Account Manager", detail: "Adds notes, FAQs & corrections" },
            { label: "Master Document", detail: "One source of truth in Supabase" },
            { label: "AI features", detail: "Welcome Flow drafts + website chat answers" },
        ],
        fields: [
            "Property basics — name, type, location, vibe",
            "Ideal guest persona — who books, why they come, what they care about",
            "FAQ bank — questions + answers, client & AM can both add",
            "Tone of voice — how the brand talks",
            "Amenities & house rules",
            "Local recommendations — food, activities, hidden gems",
            "Booking & upsell links",
            "… (not finalized — edit freely)",
        ],
        ownerFunctions: [],
        guestFunctions: [],
        workflow: [
            "Web team creates the client's dashboard from the template — the Master Document section comes with it.",
            "The client gets the link and fills in their property info, persona and FAQs.",
            "The AM reviews, fills gaps, and keeps it updated after client calls.",
            "The Welcome Email Flow builder reads the doc when drafting the 3 emails (with Claude).",
            "The website chat widget answers guests from the same doc.",
        ],
        todos: [
            { id: uid(), text: "Wireframe the Master Document section (fields above) — highest priority, everything downstream eats this data", done: false },
            { id: uid(), text: "Run supabase db push so dashboard create/save works (dashboard_pages migration is still pending)", done: false },
            { id: uid(), text: "Build the Master Document fields + Supabase persistence in the client dashboard", done: false },
            { id: uid(), text: "Decide edit permissions — what the client can edit vs AM-only", done: false },
            { id: uid(), text: "Connect the Welcome Flow builder to read from the Master Document", done: false },
            { id: uid(), text: "Connect the future chat-widget server function to read from it", done: false },
        ],
        questions: [
            {
                id: uid(),
                question: "Structured fields (separate inputs for persona / FAQs / tone) vs one free-text doc? Structured is far better for AI.",
                answer: "",
            },
            {
                id: uid(),
                question: "Can clients edit everything, or are some sections AM-only?",
                answer: "",
            },
            {
                id: uid(),
                question: "One Master Document per client, or one per property when a client has several?",
                answer: "",
            },
            {
                id: uid(),
                question: "Do we notify the AM when a client updates their doc?",
                answer: "",
            },
            {
                id: uid(),
                question: "Should real guest-chat questions later auto-suggest new FAQ entries?",
                answer: "",
            },
        ],
        log: [
            {
                id: uid(),
                date: "2026-07-04",
                title: "Project page created",
                description:
                    "Captured the vision: the Client Dashboard hosts each client's Master Document (personas, FAQ bank, tone of voice, amenities). Client + AM keep it updated; it feeds the Welcome Email Flow drafts and the AI chat widget.",
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
}) => (
    <div className={cx("rounded-2xl p-5 ring-1 ring-secondary", resolved ? "bg-secondary" : "bg-primary")}>
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2">
                {resolved && <Check className="mt-0.5 size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />}
                <span className="mt-0.5 shrink-0 text-sm font-semibold text-quaternary tabular-nums">{number}.</span>
                <div className="min-w-0 flex-1">
                    <EditLine value={q.question} editing={editing} onChange={onQuestion} placeholder="Question…" className="font-medium text-primary" />
                </div>
            </div>
            {editing && (
                <button type="button" title="Remove question" onClick={onRemove} className="shrink-0 text-fg-quaternary hover:text-fg-error-secondary">
                    <Trash01 className="size-4" />
                </button>
            )}
        </div>
        <div className={cx("mt-3 border-l-2 pl-3", resolved ? "border-success" : "border-brand")}>
            <EditArea value={q.answer} editing={editing} onChange={onAnswer} placeholder="Unanswered — type the decision here." rows={2} />
        </div>
        {editing ? <VideoAttach value={q.video} onChange={onVideo} className="mt-3" /> : q.video && <VideoEmbed url={q.video} className="mt-3" />}
    </div>
);

/* ── Page ────────────────────────────────────────────────────────── */

/** Sidebar is grouped (macOS System Settings style) with dividers between groups.
    Order here IS the scroll order — keep it matching the section DOM order below. */
const NAV_GROUPS = [
    [
        { id: "s-overview", label: "Overview", icon: BookOpen01 },
        { id: "s-flow", label: "How info flows", icon: Send01 },
        { id: "s-fields", label: "Master Document fields", icon: FileCheck02 },
        { id: "s-workflow", label: "How it's used", icon: Users01 },
        { id: "s-functions", label: "Dashboard Functions", icon: Zap },
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

const STAGE_ICONS = [Users01, Briefcase01, Database01, Stars01];

export const ClientDashboardOverviewScreen = () => {
    const [data, setData] = useState<DashData>(seed);
    const [editing, setEditing] = useState(false);
    const { collapsed: navCollapsed, toggle: toggleNav } = useNavCollapsed();
    const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
    const [showResolved, setShowResolved] = useState(false);
    const navigate = useNavigate();
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
                    if (error) console.error("[client-dashboard-overview save]", error);
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
                const d = row?.data as DashData | undefined;
                if (!error && d && Array.isArray(d.todos)) {
                    // Backfill fields added after this row was first saved, and migrate
                    // ownerFunctions/guestFunctions from plain strings to {id,text,done}.
                    setData({ ...d, ownerFunctions: normalizeFunctions(d.ownerFunctions), guestFunctions: normalizeFunctions(d.guestFunctions) });
                }
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
                    if (error) console.error("[client-dashboard-overview autosave]", error);
                });
        }, 1000);
        return () => clearTimeout(t);
    }, [data]);

    const update = (mutator: (draft: DashData) => void) =>
        setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as DashData;
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
    const setLine = (list: "workflow" | "fields", i: number, v: string) => update((d) => void (d[list][i] = v));
    const addLine = (list: "workflow" | "fields") => update((d) => void d[list].push(""));
    const rmLine = (list: "workflow" | "fields", i: number) => update((d) => void d[list].splice(i, 1));

    /* owner/guest function lists — id-based so move/checkbox/delete stay stable */
    type FnList = "ownerFunctions" | "guestFunctions";
    const addFunction = (list: FnList) => update((d) => void d[list].push({ id: uid(), text: "", done: false }));
    const setFunction = (list: FnList, id: string, patch: Partial<Todo>) =>
        update((d) => {
            const item = d[list].find((x) => x.id === id);
            if (item) Object.assign(item, patch);
        });
    const rmFunction = (list: FnList, id: string) => update((d) => void (d[list] = d[list].filter((x) => x.id !== id)));
    const moveFunction = (list: FnList, id: string, dir: -1 | 1) =>
        update((d) => {
            const arr = d[list];
            const i = arr.findIndex((x) => x.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= arr.length) return;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        });

    /* questions — edited by id so the open / resolved split stays stable across renders */
    const setQuestion = (id: string, patch: Partial<QA>) =>
        update((d) => {
            const q = d.questions.find((x) => x.id === id);
            if (q) Object.assign(q, patch);
        });
    const rmQuestion = (id: string) => update((d) => void (d.questions = d.questions.filter((x) => x.id !== id)));
    const addQuestion = () => update((d) => void d.questions.push({ id: uid(), question: "", answer: "" }));

    const isAnswered = (q: QA) => !!(q.answer || "").trim();
    const openQuestions = data.questions.filter((q) => !isAnswered(q));
    const resolvedQuestions = data.questions.filter(isAnswered);

    return (
        <AppShell
            highlightScope
            className="flex flex-col"
            rail={!navCollapsed && <IconRail activeDept="docs" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />}
        >
            <HighlightPen enabled={editing} />
            {navCollapsed && <CollapsedTopBar title="Client Dashboard" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">

            {/* Section nav */}
            {!navCollapsed && (
            <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">Client Dashboard</h2>
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
                        { label: "Client Dashboard" },
                    ]}
                    title="Client Dashboard — Overview"
                    subtitle="Master Document — project reference"
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
                            Living reference for the Client Dashboard + Master Document project. Field decisions, permissions and progress live here —
                            Claude reads this page when working on the feature.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <button
                                type="button"
                                onClick={() => navigate("/client-dashboard")}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                            >
                                <LayoutAlt01 className="size-4" aria-hidden="true" />
                                Open the master dashboard
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                            </button>
                            <span className="text-xs text-tertiary">
                                The master client dashboard template — the Master Document section will live in its side menu.
                            </span>
                        </div>
                    </div>

                    {/* 01 Overview */}
                    <section>
                        <SectionHeader id="s-overview" number="01" title="Overview" hint="What the Client Dashboard is and why the Master Document matters." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <EditArea value={data.overview} editing={editing} onChange={(v) => update((d) => void (d.overview = v))} rows={6} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ["Owned by", "Client + AM"],
                                ["Stored in", "Supabase (dashboard_pages)"],
                                ["Feeds", "Welcome Flow + AI Chat"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                    <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 02 How info flows */}
                    <section>
                        <SectionHeader id="s-flow" number="02" title="How info flows" hint="Client and AM feed one Master Document — every AI feature reads from it." />
                        <div className="mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                            {data.stages.map((s, i) => {
                                const StageIcon = STAGE_ICONS[i % STAGE_ICONS.length];
                                return (
                                    <div key={i} className="flex flex-1 flex-col gap-2 md:contents">
                                        <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-5 text-center ring-1 ring-secondary">
                                            <span className="flex size-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                                                <StageIcon className="size-4" aria-hidden="true" />
                                            </span>
                                            {editing ? (
                                                <>
                                                    <EditLine
                                                        value={s.label}
                                                        editing={editing}
                                                        onChange={(v) => update((d) => void (d.stages[i].label = v))}
                                                        placeholder="Stage…"
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
                                        {i < data.stages.length - 1 && (
                                            <div className="flex items-center justify-center md:px-1">
                                                <ArrowRight className="size-4 shrink-0 rotate-90 text-fg-quaternary md:rotate-0" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 03 Master Document fields */}
                    <section>
                        <SectionHeader
                            id="s-fields"
                            number="03"
                            title="Master Document fields"
                            hint="Proposed fields — NOT finalized. Structured fields beat one text blob: every downstream AI feature reads these."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ul className="flex flex-col gap-2">
                                {data.fields.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={item} editing={editing} onChange={(v) => setLine("fields", i, v)} placeholder="Field…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove field" onClick={() => rmLine("fields", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editing && (
                                <button type="button" onClick={() => addLine("fields")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add field
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 04 How it's used */}
                    <section>
                        <SectionHeader id="s-workflow" number="04" title="How it's used" hint="The intended end-to-end workflow once the Master Document ships." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ol className="flex flex-col gap-2.5">
                                {data.workflow.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700 tabular-nums dark:bg-brand-950/50 dark:text-brand-300">
                                            {i + 1}
                                        </span>
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="min-w-0 flex-1">
                                                <EditLine value={step} editing={editing} onChange={(v) => setLine("workflow", i, v)} placeholder="Step…" />
                                            </div>
                                            {editing && (
                                                <button type="button" title="Remove step" onClick={() => rmLine("workflow", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                    <Trash01 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        {editing && (
                            <button type="button" onClick={() => addLine("workflow")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                <Plus className="size-4" /> Add step
                            </button>
                        )}
                    </section>

                    {/* 05 Dashboard Functions */}
                    <section>
                        <SectionHeader id="s-functions" number="05" title="Dashboard Functions" hint="Any feature or capability idea for the dashboard — split by who it's for." />
                        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                            {(
                                [
                                    { list: "ownerFunctions", label: "For Owner" },
                                    { list: "guestFunctions", label: "For Guests" },
                                ] as const
                            ).map(({ list, label }) => (
                                <div key={list} className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                                    <h4 className="text-sm font-semibold text-secondary">{label}</h4>
                                    <div className="mt-3 flex flex-col gap-1.5">
                                        {data[list].length === 0 && !editing && (
                                            <p className="text-sm text-quaternary">Nothing listed yet.</p>
                                        )}
                                        {data[list].map((item, i) => (
                                            <div key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setFunction(list, item.id, { done: !item.done })}
                                                    title={item.done ? "Mark not done" : "Mark done"}
                                                    className={cx(
                                                        "flex size-5 shrink-0 items-center justify-center rounded-md border transition duration-100 ease-linear",
                                                        item.done ? "border-brand bg-brand-solid text-white" : "border-primary bg-primary hover:border-brand",
                                                    )}
                                                >
                                                    {item.done && <Check className="size-3.5" />}
                                                </button>
                                                <div className={cx("min-w-0 flex-1", item.done && "opacity-60")}>
                                                    <EditLine
                                                        value={item.text}
                                                        editing={editing}
                                                        onChange={(v) => setFunction(list, item.id, { text: v })}
                                                        placeholder="Function…"
                                                        className={item.done ? "line-through" : undefined}
                                                    />
                                                </div>
                                                {editing && (
                                                    <div className="flex shrink-0 items-center gap-0.5">
                                                        <button
                                                            type="button"
                                                            title="Move up"
                                                            disabled={i === 0}
                                                            onClick={() => moveFunction(list, item.id, -1)}
                                                            className="flex size-6 items-center justify-center rounded-md text-fg-quaternary hover:bg-secondary hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30"
                                                        >
                                                            <ChevronUp className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Move down"
                                                            disabled={i === data[list].length - 1}
                                                            onClick={() => moveFunction(list, item.id, 1)}
                                                            className="flex size-6 items-center justify-center rounded-md text-fg-quaternary hover:bg-secondary hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30"
                                                        >
                                                            <ChevronDown className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                        <button type="button" title="Remove" onClick={() => rmFunction(list, item.id)} className="flex size-6 items-center justify-center rounded-md text-fg-quaternary hover:bg-error-primary hover:text-fg-error-primary">
                                                            <Trash01 className="size-3.5" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {editing && (
                                        <button type="button" onClick={() => addFunction(list)} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                            <Plus className="size-4" /> Add function
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 06 To-dos */}
                    <section>
                        <SectionHeader id="s-todos" number="06" title="Build To-dos" hint="Checklist to ship the feature. Tick items as they land." />
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

                    {/* 07 Questions */}
                    <section>
                        <SectionHeader
                            id="s-questions"
                            number="07"
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
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>

                    {/* 08 Timeline */}
                    <section>
                        <SectionHeader id="s-log" number="08" title="Timeline" hint="Build log — updated as the feature progresses." />
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
