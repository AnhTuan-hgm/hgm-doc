import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpen01, Check, CheckDone01, ChevronDown, ChevronUp, ClipboardCheck, Database01, Edit02, HelpCircle, Hourglass01, Image01, LayoutAlt01, Lock01, LockUnlocked01, MessageChatCircle, Plus, Send01, Stars01, Trash01, Zap } from "@untitledui/icons";
import { PageBanner } from "@/components/application/page-banner";
import { AppShell, CollapsedTopBar, IconRail, NavCollapseButton, RailBottom, useNavCollapsed } from "@/components/application/icon-rail";
import { VideoAttach, VideoEmbed } from "@/components/application/video-block";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { supabase } from "@/lib/supabase";
import { compressImageFile } from "@/utils/compress-image";
import { cx } from "@/utils/cx";
import { HighlightPen, renderHighlights } from "@/utils/highlight";

/**
 * Living reference page for the AI Chat Widget project.
 * AnhTuan + Claude use it to track the architecture, decisions,
 * open questions and build progress. Content persists to sop_pages (slug below),
 * mirroring how /roadmap stores its data.
 */
const SLUG = "chat-widget-overview";

/* ── Types ───────────────────────────────────────────────────────── */

type Todo = { id: string; text: string; done: boolean };
type QA = { id: string; question: string; answer: string; video?: string };
type LogEntry = { id: string; date: string; title: string; description: string; video?: string };
type Note = { id: string; title: string; description: string; image?: string; video?: string; locked?: boolean };

type ChatData = {
    overview: string;
    bannerUrl?: string;
    stages: { label: string; detail: string }[];
    workflow: string[];
    reads: string[];
    todos: Todo[];
    questions: QA[];
    notes: Note[];
    log: LogEntry[];
};

const uid = () => "id" + Math.random().toString(36).slice(2, 9);

function seed(): ChatData {
    return {
        overview:
            "An AI chat widget that lives on every client's website and answers guest questions automatically — powered by Claude. " +
            "Its knowledge source is the client's Master Document, filled in on the Client Dashboard: FAQs, ideal-guest persona, tone of voice, amenities, house rules and local tips. " +
            "The client or their AM updates the dashboard; the chat always answers from the same up-to-date info. " +
            "The widget ships inside the client websites (built separately in Next.js) — this docs site is where the knowledge lives, and a server function is the bridge that keeps the Claude API key off the browser.",
        stages: [
            { label: "Client Dashboard", detail: "Client / AM fills in the Master Document" },
            { label: "Supabase", detail: "Master doc stored per client" },
            { label: "Server function", detail: "Netlify or Supabase Edge — holds the Claude API key" },
            { label: "Claude API", detail: "Writes the answer from the master doc" },
            { label: "Chat widget", detail: "Guest gets the reply on the client website" },
        ],
        workflow: [
            "A guest opens the chat on the client's website and asks a question.",
            "The widget sends the question + client id to our server function — never straight to Claude, so the API key stays server-side.",
            "The function loads that client's Master Document from Supabase.",
            "Claude answers using only the Master Document as source of truth, in the client's tone of voice.",
            "The reply streams back into the widget; questions the doc can't answer hand off to the AM / contact form.",
        ],
        reads: [
            "Property basics — name, type, location, vibe",
            "Ideal guest persona — who books, why they come, what they care about",
            "FAQ bank — questions + answers, client & AM can both add",
            "Tone of voice — how the brand talks",
            "Amenities & house rules",
            "Local recommendations — food, activities, hidden gems",
            "Booking & upsell links",
        ],
        todos: [
            { id: uid(), text: "Wireframe the Master Document section of the Client Dashboard (shared with the Client Dashboard project)", done: false },
            { id: uid(), text: "Decide where the server function lives — Netlify Function vs Supabase Edge Function", done: false },
            { id: uid(), text: "Set up the Anthropic API key in server env (never in browser code)", done: false },
            { id: uid(), text: "Build the function: fetch master doc → call Claude → stream the reply", done: false },
            { id: uid(), text: "Build / adapt the chat widget UI on the client websites (Next.js)", done: false },
            { id: uid(), text: "Fallback behavior for questions the doc can't answer (AM handoff / contact form)", done: false },
            { id: uid(), text: "Pilot with one client before rolling out", done: false },
        ],
        questions: [
            {
                id: uid(),
                question: "Which client is the pilot for the first AI chat?",
                answer: "",
            },
            {
                id: uid(),
                question: "Should the chat answer booking-price / availability questions, or always hand those to the AM?",
                answer: "",
            },
            {
                id: uid(),
                question: "Tone: follow each client's brand voice closely, or one standard friendly HGM tone?",
                answer: "",
            },
            {
                id: uid(),
                question: "Do we log chat conversations so AMs can review them and improve the Master Document from real questions?",
                answer: "",
            },
            {
                id: uid(),
                question: "Rate limit / monthly Claude API budget per client?",
                answer: "",
            },
        ],
        notes: [],
        log: [
            {
                id: uid(),
                date: "2026-07-04",
                title: "Project page created",
                description:
                    "Captured the concept: a Claude-powered chat widget on client websites answering from each client's Master Document, via a server function that holds the API key. Architecture agreed: Client Dashboard → Supabase → server function → Claude → widget.",
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

/** A personal scratch note — title, description, optional image/video, lockable, reorderable. */
const NoteCard = ({
    note,
    editing,
    isFirst,
    isLast,
    onChange,
    onImage,
    onDelete,
    onToggleLock,
    onMoveUp,
    onMoveDown,
}: {
    note: Note;
    editing: boolean;
    isFirst: boolean;
    isLast: boolean;
    onChange: (patch: Partial<Note>) => void;
    onImage: (e: ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    onToggleLock: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) => (
    <div className="rounded-2xl bg-primary p-5 ring-1 ring-secondary">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <EditLine value={note.title} editing={editing} onChange={(v) => onChange({ title: v })} placeholder="Note title…" className="font-semibold text-primary" />
            </div>
            {editing && (
                <div className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Move up" disabled={isFirst} onClick={onMoveUp} className="flex size-7 items-center justify-center rounded-md text-fg-quaternary hover:bg-secondary hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30">
                        <ChevronUp className="size-4" aria-hidden="true" />
                    </button>
                    <button type="button" title="Move down" disabled={isLast} onClick={onMoveDown} className="flex size-7 items-center justify-center rounded-md text-fg-quaternary hover:bg-secondary hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-30">
                        <ChevronDown className="size-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        title={note.locked ? "Unlock note (allow delete)" : "Lock note (protect from delete)"}
                        onClick={onToggleLock}
                        className={cx("flex size-7 items-center justify-center rounded-md", note.locked ? "text-brand-600 hover:bg-brand-50 dark:text-brand-400" : "text-fg-quaternary hover:bg-secondary hover:text-fg-secondary")}
                    >
                        {note.locked ? <Lock01 className="size-4" aria-hidden="true" /> : <LockUnlocked01 className="size-4" aria-hidden="true" />}
                    </button>
                    {!note.locked && (
                        <button type="button" title="Delete note" onClick={onDelete} className="flex size-7 items-center justify-center rounded-md text-fg-quaternary hover:bg-error-primary hover:text-fg-error-primary">
                            <Trash01 className="size-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            )}
            {!editing && note.locked && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-tertiary">
                    <Lock01 className="size-3" aria-hidden="true" /> Protected
                </span>
            )}
        </div>

        <div className="mt-2">
            <EditArea value={note.description} editing={editing} onChange={(v) => onChange({ description: v })} placeholder="Write your note…" rows={3} />
        </div>

        {note.image ? (
            <div className="relative mt-3 w-fit">
                <img src={note.image} alt="Attached" className="max-h-64 rounded-lg border border-secondary" />
                {editing && (
                    <button
                        type="button"
                        title="Remove image"
                        onClick={() => onChange({ image: undefined })}
                        className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-secondary bg-primary text-fg-quaternary shadow-xs hover:bg-error-primary hover:text-fg-error-primary"
                    >
                        <Trash01 className="size-3.5" aria-hidden="true" />
                    </button>
                )}
            </div>
        ) : (
            editing && (
                <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary px-3 py-1.5 text-xs font-medium text-tertiary hover:border-brand hover:text-brand-secondary">
                    <input type="file" accept="image/*" className="hidden" onChange={onImage} />
                    <Image01 className="size-4" aria-hidden="true" />
                    Add image
                </label>
            )
        )}

        {editing ? (
            <VideoAttach value={note.video} onChange={(v) => onChange({ video: v })} className="mt-3" />
        ) : (
            note.video && <VideoEmbed url={note.video} className="mt-3" />
        )}
    </div>
);

/* ── Page ────────────────────────────────────────────────────────── */

/** Sidebar is grouped (macOS System Settings style) with dividers between groups.
    Order here IS the scroll order — keep it matching the section DOM order below. */
const NAV_GROUPS = [
    [
        { id: "s-overview", label: "Overview", icon: BookOpen01 },
        { id: "s-how", label: "How it works", icon: Zap },
        { id: "s-flow", label: "End-to-end flow", icon: Send01 },
        { id: "s-reads", label: "What the chat reads", icon: Database01 },
    ],
    [
        { id: "s-todos", label: "Build To-dos", icon: CheckDone01 },
        { id: "s-questions", label: "Open Questions", icon: HelpCircle },
        { id: "s-notes", label: "My Note", icon: Edit02 },
    ],
    [
        { id: "s-log", label: "Timeline", icon: Hourglass01 },
    ],
];
const SECTIONS = NAV_GROUPS.flat();

/** One verified icon per pipeline stage (cycles if more stages get added). */
const STAGE_ICONS = [LayoutAlt01, Database01, Zap, Stars01, MessageChatCircle];

export const ChatWidgetOverviewScreen = () => {
    const [data, setData] = useState<ChatData>(seed);
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
                    if (error) console.error("[chat-widget save]", error);
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
                const d = row?.data as ChatData | undefined;
                if (!error && d && Array.isArray(d.todos)) {
                    // Backfill fields added after this row was first saved.
                    setData({ ...d, notes: d.notes ?? [] });
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
                    if (error) console.error("[chat-widget autosave]", error);
                });
        }, 1000);
        return () => clearTimeout(t);
    }, [data]);

    const update = (mutator: (draft: ChatData) => void) =>
        setData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as ChatData;
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
    const setLine = (list: "workflow" | "reads", i: number, v: string) => update((d) => void (d[list][i] = v));
    const addLine = (list: "workflow" | "reads") => update((d) => void d[list].push(""));
    const rmLine = (list: "workflow" | "reads", i: number) => update((d) => void d[list].splice(i, 1));

    /* questions — edited by id so the open / resolved split stays stable across renders */
    const setQuestion = (id: string, patch: Partial<QA>) =>
        update((d) => {
            const q = d.questions.find((x) => x.id === id);
            if (q) Object.assign(q, patch);
        });
    const rmQuestion = (id: string) => update((d) => void (d.questions = d.questions.filter((x) => x.id !== id)));
    const addQuestion = () => update((d) => void d.questions.push({ id: uid(), question: "", answer: "" }));

    /* notes — id-based like questions, plus lock + reorder */
    const addNote = () => update((d) => void d.notes.push({ id: uid(), title: "", description: "" }));
    const setNote = (id: string, patch: Partial<Note>) =>
        update((d) => {
            const n = d.notes.find((x) => x.id === id);
            if (n) Object.assign(n, patch);
        });
    const deleteNote = (id: string) =>
        update((d) => {
            if (d.notes.find((x) => x.id === id)?.locked) return; // protected — unlock before deleting
            d.notes = d.notes.filter((x) => x.id !== id);
        });
    const moveNote = (id: string, dir: -1 | 1) =>
        update((d) => {
            const i = d.notes.findIndex((x) => x.id === id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= d.notes.length) return;
            [d.notes[i], d.notes[j]] = [d.notes[j], d.notes[i]];
        });
    const handleNoteImage = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void compressImageFile(file).then((img) => setNote(id, { image: img }));
        e.target.value = "";
    };

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
            {navCollapsed && <CollapsedTopBar title="AI Chat Widget" onExpand={toggleNav} />}
            <div className="flex min-h-0 flex-1 gap-2 bg-secondary p-2">

            {/* Section nav */}
            {!navCollapsed && (
            <aside className="hidden h-full w-60 shrink-0 flex-col overflow-hidden rounded-lg bg-primary shadow-sm md:flex">
                <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">AI Chat Widget</h2>
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
                        { label: "AI Chat Widget" },
                    ]}
                    title="AI Chat Widget — Overview"
                    subtitle="Claude-powered chat — project reference"
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
                            Living reference for the Claude-powered chat on client websites. Architecture, decisions and progress live here — Claude
                            reads this page when working on the feature.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <button
                                type="button"
                                onClick={() => navigate("/client-dashboard-overview")}
                                className="inline-flex items-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                            >
                                <MessageChatCircle className="size-4" aria-hidden="true" />
                                Master Document project
                                <ArrowUpRight className="size-4" aria-hidden="true" />
                            </button>
                            <span className="text-xs text-tertiary">
                                The chat answers from the Master Document — that project page lives here.
                            </span>
                        </div>
                    </div>

                    {/* 01 Overview */}
                    <section>
                        <SectionHeader id="s-overview" number="01" title="Overview" hint="What this feature is and the decisions made so far." />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <EditArea value={data.overview} editing={editing} onChange={(v) => update((d) => void (d.overview = v))} rows={6} />
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ["Serves", "Website guests + AMs"],
                                ["Answers from", "Client Master Document"],
                                ["Powered by", "Claude API"],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-primary px-4 py-3 ring-1 ring-secondary">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-quaternary">{k}</p>
                                    <p className="mt-1 text-sm font-medium text-primary">{v}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 02 How it works */}
                    <section>
                        <SectionHeader id="s-how" number="02" title="How it works" hint="The pipeline — from the client's Master Document to the guest's answer." />
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

                    {/* 03 End-to-end flow */}
                    <section>
                        <SectionHeader id="s-flow" number="03" title="End-to-end flow" hint="How a guest question travels through the system, step by step." />
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

                    {/* 04 What the chat reads */}
                    <section>
                        <SectionHeader
                            id="s-reads"
                            number="04"
                            title="What the chat reads"
                            hint="The Master Document fields the chat uses as its only source of truth. Defined in the Client Dashboard project."
                        />
                        <div className="mt-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
                            <ul className="flex flex-col gap-2">
                                {data.reads.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="size-1.5 shrink-0 rounded-full bg-brand-solid" />
                                        <div className="min-w-0 flex-1">
                                            <EditLine value={item} editing={editing} onChange={(v) => setLine("reads", i, v)} placeholder="Field…" />
                                        </div>
                                        {editing && (
                                            <button type="button" title="Remove item" onClick={() => rmLine("reads", i)} className="text-fg-quaternary hover:text-fg-error-secondary">
                                                <Trash01 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editing && (
                                <button type="button" onClick={() => addLine("reads")} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                    <Plus className="size-4" /> Add item
                                </button>
                            )}
                        </div>
                    </section>

                    {/* 05 To-dos */}
                    <section>
                        <SectionHeader id="s-todos" number="05" title="Build To-dos" hint="Checklist to ship the feature. Tick items as they land." />
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

                    {/* 07 My Note */}
                    <section>
                        <SectionHeader id="s-notes" number="07" title="My Note" hint="Personal scratch notes for this project — title, description, an optional image or video link." />
                        <div className="mt-4 flex flex-col gap-4">
                            {data.notes.length === 0 && !editing && (
                                <p className="rounded-2xl bg-primary p-5 text-sm italic text-quaternary ring-1 ring-secondary">No notes yet.</p>
                            )}
                            {data.notes.map((note, i) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    editing={editing}
                                    isFirst={i === 0}
                                    isLast={i === data.notes.length - 1}
                                    onChange={(patch) => setNote(note.id, patch)}
                                    onImage={(e) => handleNoteImage(note.id, e)}
                                    onDelete={() => deleteNote(note.id)}
                                    onToggleLock={() => setNote(note.id, { locked: !note.locked })}
                                    onMoveUp={() => moveNote(note.id, -1)}
                                    onMoveDown={() => moveNote(note.id, 1)}
                                />
                            ))}
                        </div>
                        {editing && (
                            <button type="button" onClick={addNote} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline">
                                <Plus className="size-4" /> Add note
                            </button>
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
