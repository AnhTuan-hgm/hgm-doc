import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    BookOpen01,
    CheckCircle,
    CheckDone01,
    ChevronRight,
    Flag05,
    HelpCircle,
    Hourglass01,
    Image01,
    LinkExternal01,
    Plus,
    Rocket01,
    Trash01,
    XCircle,
    XClose,
    Zap,
} from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { IconRail, RailBottom } from "@/components/application/icon-rail";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { useEditShortcuts } from "@/hooks/use-edit-shortcuts";
import { readSopPage, writeSopPage } from "@/lib/db-sync";
import { cx } from "@/utils/cx";

const ROADMAP_SLUG = "roadmap";

type Tier = "in_progress" | "next" | "planned";

interface RoadmapItem {
    id: string;
    tier: Tier;
    title: string;
    description: string;
}

interface LogEntry {
    id: string;
    /** YYYY-MM-DD */
    date: string;
    title: string;
    description: string;
    /** Optional URL showing the shipped result. */
    link?: string;
}

interface TodoItem {
    id: string;
    text: string;
    done: boolean;
}

interface QuestionItem {
    id: string;
    question: string;
    answer: string;
    /** Optional screenshot/attachment, stored as a data URL (same pattern as owner-guide images). */
    image?: string;
}

interface FeatureItem {
    id: string;
    text: string;
    /** Detail panel fields (all optional so older saved rows still load). */
    about?: string;
    /** Comma-separated names, rendered as chips. */
    requestedBy?: string;
    ideation?: string;
    result?: string;
    approval?: "approved" | "rejected";
}

type FeatureCol = "internalFeatures" | "clientFeatures";

interface OverviewData {
    paragraph: string;
    internalFeatures: FeatureItem[];
    clientFeatures: FeatureItem[];
}

interface RoadmapData {
    overview: OverviewData;
    roadmap: RoadmapItem[];
    log: LogEntry[];
    todos: TodoItem[];
    questions: QuestionItem[];
}

const TIERS: { id: Tier; label: string; badgeColor: "success" | "blue" | "gray"; blurb: string }[] = [
    { id: "in_progress", label: "In progress", badgeColor: "success", blurb: "Actively being built right now." },
    { id: "next", label: "Next", badgeColor: "blue", blurb: "Queued up once in-progress work ships." },
    { id: "planned", label: "Planned", badgeColor: "gray", blurb: "On the radar, not yet scheduled." },
];

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

/** Format "2026-07-02" → "Jul 2, 2026" without timezone drift. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return `${MONTHS[m - 1]} ${d}, ${y}`;
};

const todayIso = () => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};

/** Seed content (real project history) shown until the team saves its own. */
const DEFAULT_DATA: RoadmapData = {
    overview: {
        paragraph:
            "hgm-doc is HiddenGem Media's client guide & documentation site. The team creates per-client setup guides — Meta Pixel, lead-capture popups, owner guides, chat widgets — from master templates, edits them in place, and shares them with clients via private URLs. Content persists to Supabase with a Firebase fallback, and the site auto-deploys to Netlify on every push to main.",
        internalFeatures: [
            { id: uid(), text: "Dashboard with department rails & client cards" },
            { id: uid(), text: "Sitewide search from the icon rail (Shift+F)" },
            { id: uid(), text: "Client requests queue (/requests)" },
            { id: uid(), text: "Design-system reference page (/designsystem)" },
            { id: uid(), text: "Settings with team login & theme defaults" },
            { id: uid(), text: "Progress & roadmap page (this page)" },
        ],
        clientFeatures: [
            { id: uid(), text: "Meta Pixel setup guide" },
            { id: uid(), text: "Lead-capture popup guide" },
            { id: uid(), text: "Owner guide with credentials & checklists" },
            { id: uid(), text: "Chat widget installation guide" },
            { id: uid(), text: "Private per-client page copies" },
            { id: uid(), text: "Light & dark mode" },
        ],
    },
    roadmap: [
        { id: uid(), tier: "in_progress", title: "Progress & roadmap page", description: "This page — a living build log for the docs site." },
        { id: uid(), tier: "next", title: "Code-split the JS bundle", description: "Main bundle is ~1.5 MB unminified; split routes with dynamic imports." },
        { id: uid(), tier: "next", title: "Supabase resource review", description: "Investigate the resource-exhaustion warnings and optimize queries." },
        { id: uid(), tier: "planned", title: "More per-client guide templates", description: "Extend the template system beyond Meta Pixel, popups and chat widget." },
    ],
    log: [
        { id: uid(), date: "2026-07-02", title: "Automated deploys via GitHub Actions", description: "Push to main now builds and deploys to Netlify automatically. Also fixed the root cause of every remote build failure (three lib files were never committed)." },
        { id: uid(), date: "2026-07-01", title: "Firebase fallback layer", description: "Editable content now dual-writes to Supabase and Firestore, so edits survive Supabase outages." },
        { id: uid(), date: "2026-06-26", title: "Chat Widget installation guides", description: "New guide template with per-client copies; content switched from WordPress to Wix." },
        { id: uid(), date: "2026-06-25", title: "Settings page + Supabase CLI baseline", description: "Account settings with theme defaults and owner-guide gating; schema now lives in versioned migrations." },
        { id: uid(), date: "2026-06-24", title: "Dashboard login", description: "Google + password login for the team dashboard, PRO icons, design-system token sync." },
        { id: uid(), date: "2026-06-22", title: "Icon-rail search & per-client owner guides", description: "Sitewide search from the rail (Shift+F), owner-guide copies per client, /designsystem page." },
        { id: uid(), date: "2026-06-21", title: "Requests page + Supabase persistence", description: "Docs request form and /requests queue; SOP and owner-guide edits now persist to Supabase instead of being lost." },
        { id: uid(), date: "2026-06-20", title: "Owner guide rebuilt + lead-capture popups", description: "Step content, credential forms, reordering, and the popup pages with the blue brand theme." },
        { id: uid(), date: "2026-06-19", title: "Site launched", description: "Meta Pixel setup guide live on docs-hgm.netlify.app.", link: "https://docs-hgm.netlify.app" },
    ],
    todos: [
        { id: uid(), text: "Code-split routes with dynamic imports — the JS bundle is ~1.5 MB and slows first load", done: false },
        { id: uid(), text: "Gate internal pages (/dashboard, /roadmap, /settings) behind the team login", done: false },
        { id: uid(), text: "Review Supabase usage and resolve the resource-exhaustion warnings", done: false },
        { id: uid(), text: "Add loading skeletons to Supabase-backed pages so content doesn't flash in", done: false },
        { id: uid(), text: "Run a Lighthouse pass: image compression, lazy loading, contrast in both modes", done: false },
    ],
    questions: [
        { id: uid(), question: "Which guide template should we build next — Google Analytics, SEO setup, or email/domain?", answer: "" },
        { id: uid(), question: "Should client-facing guide pages stay public-by-URL, or get a password/access code?", answer: "" },
        { id: uid(), question: "Who besides you needs edit access — do we need per-person accounts and roles?", answer: "" },
        { id: uid(), question: "Do you want a notification (email/Slack) when a client submits a request on /requests?", answer: "" },
        { id: uid(), question: "What's the next priority: performance (code-splitting) or new features?", answer: "" },
    ],
};

const SECTIONS = [
    { id: "overview", label: "Project Overview", icon: BookOpen01 },
    { id: "features", label: "Features", icon: Zap },
    { id: "todo", label: "To-do", icon: CheckDone01 },
    { id: "questions", label: "Questions", icon: HelpCircle },
    { id: "roadmap", label: "Roadmap", icon: Flag05 },
    { id: "timeline", label: "Timeline", icon: Hourglass01 },
];

const inputCls =
    "w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand focus:outline-none";

export const RoadmapScreen = () => {
    const [data, setData] = useState<RoadmapData>(DEFAULT_DATA);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [activeSection, setActiveSection] = useState("overview");
    const mainRef = useRef<HTMLDivElement>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Latest data for the Shift+S flush (the keydown listener is bound once).
    const dataRef = useRef(data);
    dataRef.current = data;

    useEffect(() => {
        let cancelled = false;
        readSopPage(ROADMAP_SLUG)
            .then((row: any) => {
                const stored = row?.data;
                if (!cancelled && stored?.roadmap && stored?.log) {
                    // Rows saved before newer sections existed fall back to the seed content.
                    setData({
                        ...stored,
                        overview: stored.overview ?? DEFAULT_DATA.overview,
                        todos: stored.todos ?? DEFAULT_DATA.todos,
                        questions: stored.questions ?? DEFAULT_DATA.questions,
                    });
                }
            })
            .catch(() => {
                /* No saved row yet — keep the seed content. */
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Shift+E toggles edit mode; Shift+S flushes the pending save and locks.
    useEditShortcuts({
        onToggle: () => setEditing((v) => !v),
        onSave: () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            setSaveState("saving");
            writeSopPage(ROADMAP_SLUG, dataRef.current)
                .then(() => setSaveState("saved"))
                .catch(() => setSaveState("error"));
            setEditing(false);
        },
    });

    /** Update state immediately, persist (debounced) to Supabase + Firebase. */
    const persist = (next: RoadmapData) => {
        setData(next);
        setSaveState("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            writeSopPage(ROADMAP_SLUG, next)
                .then(() => setSaveState("saved"))
                .catch(() => setSaveState("error"));
        }, 600);
    };

    // Overview ops
    const updateOverview = (patch: Partial<OverviewData>) => persist({ ...data, overview: { ...data.overview, ...patch } });
    const addFeature = (col: FeatureCol) => updateOverview({ [col]: [...data.overview[col], { id: uid(), text: "" }] });
    const updateFeature = (col: FeatureCol, id: string, patch: Partial<FeatureItem>) =>
        updateOverview({ [col]: data.overview[col].map((f) => (f.id === id ? { ...f, ...patch } : f)) });
    const deleteFeature = (col: FeatureCol, id: string) => updateOverview({ [col]: data.overview[col].filter((f) => f.id !== id) });

    // Feature detail panel
    const [openFeature, setOpenFeature] = useState<{ col: FeatureCol; id: string } | null>(null);
    const featureDetail = openFeature ? data.overview[openFeature.col].find((f) => f.id === openFeature.id) : null;

    // Roadmap item ops
    const addItem = (tier: Tier) => persist({ ...data, roadmap: [...data.roadmap, { id: uid(), tier, title: "", description: "" }] });
    const updateItem = (id: string, patch: Partial<RoadmapItem>) =>
        persist({ ...data, roadmap: data.roadmap.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
    const deleteItem = (id: string) => persist({ ...data, roadmap: data.roadmap.filter((it) => it.id !== id) });

    // Log entry ops
    const addEntry = () => persist({ ...data, log: [{ id: uid(), date: todayIso(), title: "", description: "" }, ...data.log] });
    const updateEntry = (id: string, patch: Partial<LogEntry>) =>
        persist({ ...data, log: data.log.map((en) => (en.id === id ? { ...en, ...patch } : en)) });
    const deleteEntry = (id: string) => persist({ ...data, log: data.log.filter((en) => en.id !== id) });

    // Todo ops (checking off works even when locked; text edits need unlock)
    const toggleTodo = (id: string, done: boolean) => persist({ ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, done } : t)) });
    const updateTodo = (id: string, text: string) => persist({ ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, text } : t)) });
    const addTodo = () => persist({ ...data, todos: [...data.todos, { id: uid(), text: "", done: false }] });
    const deleteTodo = (id: string) => persist({ ...data, todos: data.todos.filter((t) => t.id !== id) });

    // Question ops
    const updateQuestion = (id: string, patch: Partial<QuestionItem>) =>
        persist({ ...data, questions: data.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
    const addQuestion = () => persist({ ...data, questions: [...data.questions, { id: uid(), question: "", answer: "" }] });
    const deleteQuestion = (id: string) => persist({ ...data, questions: data.questions.filter((q) => q.id !== id) });
    const handleQuestionImage = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => updateQuestion(id, { image: reader.result as string });
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const scrollTo = (id: string) => {
        setActiveSection(id);
        // Scroll ONLY the content container — scrollIntoView would also scroll the
        // overflow-hidden page root and drag the icon rail / side menu out of view.
        const el = document.getElementById(`roadmap-section-${id}`);
        const container = mainRef.current;
        if (!el || !container) return;
        const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 24;
        container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    // Timeline grouped by date, newest first
    const sortedLog = [...data.log].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const logByDate = sortedLog.reduce<Record<string, LogEntry[]>>((acc, en) => {
        (acc[en.date] ??= []).push(en);
        return acc;
    }, {});
    const shippedCount = data.log.length;
    const doneCount = data.todos.filter((t) => t.done).length;
    const answeredCount = data.questions.filter((q) => q.answer?.trim()).length;

    return (
        <div className="flex h-dvh overflow-hidden">
            <IconRail activeDept="website" bottom={<RailBottom editing={editing} onToggleEditing={() => setEditing((e) => !e)} />} />

            {/* Side menu */}
            <aside className="flex w-[240px] shrink-0 flex-col border-r border-secondary bg-primary">
                <div className="flex h-[73px] shrink-0 items-center border-b border-secondary px-5">
                    <h2 className="text-md font-semibold text-primary">Website</h2>
                </div>
                <motion.nav
                    className="flex flex-col gap-0.5 p-3"
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                >
                    {SECTIONS.map((s) => (
                        <motion.div
                            key={s.id}
                            variants={{
                                hidden: { opacity: 0, x: -10 },
                                show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => scrollTo(s.id)}
                                className={cx(
                                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition duration-100 ease-linear",
                                    activeSection === s.id ? "bg-secondary_hover text-primary" : "text-secondary hover:bg-primary_hover hover:text-primary",
                                )}
                            >
                                <s.icon className="size-4 text-fg-quaternary" aria-hidden="true" />
                                {s.label}
                            </button>
                        </motion.div>
                    ))}
                </motion.nav>
            </aside>

            {/* Main content */}
            <main className="flex min-w-0 flex-1 flex-col bg-secondary">
                <header className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-6">
                    <div>
                        <h1 className="text-md font-semibold text-primary">Project Management</h1>
                        <p className="text-sm text-tertiary">
                            {loading ? "Loading…" : `${shippedCount} update${shippedCount !== 1 ? "s" : ""} shipped`}
                        </p>
                    </div>
                    {saveState !== "idle" && (
                        <Badge size="md" type="pill-color" color={saveState === "error" ? "error" : saveState === "saving" ? "gray" : "success"}>
                            {saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}
                        </Badge>
                    )}
                </header>

                <div ref={mainRef} className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-3xl px-6 py-10">
                        {/* ——— Project Overview ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-overview" className="scroll-mt-6">
                            <div className="flex items-center gap-2.5">
                                <BookOpen01 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                <h2 className="text-display-xs font-semibold text-primary">Project Overview</h2>
                            </div>

                            <div className="mt-5 rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                                {editing ? (
                                    <textarea
                                        className={cx(inputCls, "resize-none")}
                                        rows={6}
                                        value={data.overview.paragraph}
                                        placeholder="What is this project? Who is it for? How does it work?"
                                        onChange={(e) => updateOverview({ paragraph: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm leading-6 whitespace-pre-line text-tertiary">{data.overview.paragraph}</p>
                                )}
                            </div>

                        </motion.section>

                        {/* ——— Features ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-features" className="mt-16 scroll-mt-6">
                            <div className="flex items-center gap-2.5">
                                <Zap className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                <h2 className="text-display-xs font-semibold text-primary">Features</h2>
                            </div>
                            <p className="mt-1 text-sm text-tertiary">Everything the site does — click a feature for details & approval.</p>

                            <div className="mt-6 grid grid-cols-2 gap-6 max-md:grid-cols-1">
                                {(
                                    [
                                        { col: "internalFeatures", title: "Internal Dashboard Features" },
                                        { col: "clientFeatures", title: "Client Dashboard Features" },
                                    ] as const
                                ).map(({ col, title }) => (
                                    <div key={col}>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-secondary">{title}</h4>
                                            {editing && (
                                                <button
                                                    type="button"
                                                    onClick={() => addFeature(col)}
                                                    className="flex items-center gap-1 text-xs font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                                >
                                                    <Plus className="size-3.5" aria-hidden="true" /> Add
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-2 rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                                            <div className="flex flex-col gap-2.5">
                                                {data.overview[col].length === 0 && !editing && (
                                                    <p className="text-sm text-quaternary">Nothing listed yet.</p>
                                                )}
                                                {data.overview[col].map((f) =>
                                                    editing ? (
                                                        <div key={f.id} className="flex items-center gap-2">
                                                            <input
                                                                className={cx(inputCls, "px-2.5 py-1.5 text-xs")}
                                                                value={f.text}
                                                                placeholder="Feature"
                                                                onChange={(e) => updateFeature(col, f.id, { text: e.target.value })}
                                                            />
                                                            <button
                                                                type="button"
                                                                title="Open details"
                                                                onClick={() => setOpenFeature({ col, id: f.id })}
                                                                className="flex size-7 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary"
                                                            >
                                                                <ChevronRight className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete feature"
                                                                onClick={() => deleteFeature(col, f.id)}
                                                                className="flex size-7 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                            >
                                                                <Trash01 className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            key={f.id}
                                                            type="button"
                                                            onClick={() => setOpenFeature({ col, id: f.id })}
                                                            className={cx(
                                                                "group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition duration-100 ease-linear",
                                                                f.approval === "approved" ? "bg-success-primary hover:opacity-80" : "hover:bg-primary_hover",
                                                            )}
                                                        >
                                                            {f.approval === "rejected" ? (
                                                                <XCircle className="mt-0.5 size-4 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                                                            ) : (
                                                                <CheckCircle
                                                                    className={cx(
                                                                        "mt-0.5 size-4 shrink-0",
                                                                        f.approval === "approved" ? "text-fg-success-primary" : "text-fg-quaternary",
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <span
                                                                className={cx(
                                                                    "flex-1 text-sm",
                                                                    f.approval === "approved" ? "text-quaternary line-through" : "text-secondary",
                                                                )}
                                                            >
                                                                {f.text || "Untitled"}
                                                            </span>
                                                            <ChevronRight
                                                                className="mt-0.5 size-4 shrink-0 text-fg-quaternary opacity-0 transition duration-100 ease-linear group-hover:opacity-100"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* ——— To-do ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-todo" className="mt-16 scroll-mt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckDone01 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                        <h2 className="text-display-xs font-semibold text-primary">To-do</h2>
                                        <Badge size="md" type="pill-color" color={doneCount === data.todos.length && data.todos.length > 0 ? "success" : "gray"}>
                                            {doneCount}/{data.todos.length} done
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-tertiary">Concrete actions to improve this site. Check them off as they ship.</p>
                                </div>
                                {editing && (
                                    <Button size="sm" color="secondary" iconLeading={Plus} onClick={addTodo}>
                                        Add
                                    </Button>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-2">
                                {data.todos.map((todo) => (
                                    <div key={todo.id} className="flex items-start gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                                        <Checkbox size="md" isSelected={todo.done} onChange={(v) => toggleTodo(todo.id, v)} />
                                        {editing ? (
                                            <>
                                                <textarea
                                                    className={cx(inputCls, "resize-none")}
                                                    rows={2}
                                                    value={todo.text}
                                                    placeholder="What needs doing?"
                                                    onChange={(e) => updateTodo(todo.id, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    title="Delete to-do"
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            </>
                                        ) : (
                                            <p className={cx("text-sm leading-6", todo.done ? "text-quaternary line-through" : "text-secondary")}>
                                                {todo.text || "Untitled"}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* ——— Questions to move forward ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-questions" className="mt-16 scroll-mt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <HelpCircle className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                        <h2 className="text-display-xs font-semibold text-primary">Questions to move forward</h2>
                                        <Badge
                                            size="md"
                                            type="pill-color"
                                            color={answeredCount === data.questions.length && data.questions.length > 0 ? "success" : "gray"}
                                        >
                                            {answeredCount}/{data.questions.length} answered
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-tertiary">Decisions we need from you before the next round of work. Unlock to answer.</p>
                                </div>
                                {editing && (
                                    <Button size="sm" color="secondary" iconLeading={Plus} onClick={addQuestion}>
                                        Add
                                    </Button>
                                )}
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                {data.questions.map((q, i) => (
                                    <div key={q.id} className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                                        {editing ? (
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-1 flex-col gap-2">
                                                    <input
                                                        className={inputCls}
                                                        value={q.question}
                                                        placeholder="Question"
                                                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                                    />
                                                    <textarea
                                                        className={cx(inputCls, "resize-none")}
                                                        rows={2}
                                                        value={q.answer}
                                                        placeholder="Your answer…"
                                                        onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                                                    />
                                                    {q.image ? (
                                                        <div className="relative w-fit">
                                                            <img src={q.image} alt="Attached" className="max-h-64 rounded-lg border border-secondary" />
                                                            <button
                                                                type="button"
                                                                title="Remove image"
                                                                onClick={() => updateQuestion(q.id, { image: undefined })}
                                                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-secondary bg-primary text-fg-quaternary shadow-xs transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                            >
                                                                <XClose className="size-3.5" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary px-3 py-1.5 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:border-brand hover:text-brand-secondary">
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImage(q.id, e)} />
                                                            <Image01 className="size-4" aria-hidden="true" />
                                                            Add image
                                                        </label>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    title="Delete question"
                                                    onClick={() => deleteQuestion(q.id)}
                                                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                >
                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-sm font-semibold text-primary">
                                                    {i + 1}. {q.question || "Untitled question"}
                                                </h3>
                                                <p className={cx("mt-1.5 text-sm", q.answer ? "text-tertiary" : "text-placeholder italic")}>
                                                    {q.answer || "No answer yet — unlock to answer"}
                                                </p>
                                                {q.image && <img src={q.image} alt="Attached" className="mt-3 max-h-64 rounded-lg border border-secondary" />}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                        {/* ——— Roadmap ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-roadmap" className="mt-16 scroll-mt-6">
                            <div className="flex items-center gap-2.5">
                                <Flag05 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                <h2 className="text-display-xs font-semibold text-primary">Roadmap</h2>
                            </div>
                            <p className="mt-1 text-sm text-tertiary">What we're building for this site, in priority order.</p>

                            <div className="mt-8 flex flex-col gap-10">
                                {TIERS.map((tier) => {
                                    const items = data.roadmap.filter((it) => it.tier === tier.id);
                                    return (
                                        <div key={tier.id}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <BadgeWithDot color={tier.badgeColor} type="pill-color" size="md">
                                                        {tier.label}
                                                    </BadgeWithDot>
                                                    <span className="text-sm text-quaternary">{tier.blurb}</span>
                                                </div>
                                                {editing && (
                                                    <Button size="sm" color="secondary" iconLeading={Plus} onClick={() => addItem(tier.id)}>
                                                        Add
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="mt-3 flex flex-col gap-3">
                                                {items.length === 0 && !editing && (
                                                    <p className="rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-quaternary">
                                                        Nothing here yet.
                                                    </p>
                                                )}
                                                {items.map((item) => (
                                                    <div key={item.id} className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                                                        {editing ? (
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex flex-1 flex-col gap-2">
                                                                    <input
                                                                        className={inputCls}
                                                                        value={item.title}
                                                                        placeholder="Title"
                                                                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                                                    />
                                                                    <textarea
                                                                        className={cx(inputCls, "resize-none")}
                                                                        rows={2}
                                                                        value={item.description}
                                                                        placeholder="Short description"
                                                                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    title="Delete item"
                                                                    onClick={() => deleteItem(item.id)}
                                                                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                                >
                                                                    <Trash01 className="size-4" aria-hidden="true" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <h3 className="text-sm font-semibold text-primary">{item.title || "Untitled"}</h3>
                                                                {item.description && <p className="mt-1 text-sm text-tertiary">{item.description}</p>}
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.section>

                        {/* ——— Timeline ——— */}
                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            id="roadmap-section-timeline" className="mt-16 scroll-mt-6 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <Rocket01 className="size-5 text-fg-brand-primary" aria-hidden="true" />
                                        <h2 className="text-display-xs font-semibold text-primary">Timeline</h2>
                                    </div>
                                    <p className="mt-1 text-sm text-tertiary">Everything shipped on this site, newest first.</p>
                                </div>
                                {editing && (
                                    <Button size="sm" color="secondary" iconLeading={Plus} onClick={addEntry}>
                                        Add entry
                                    </Button>
                                )}
                            </div>

                            <div className="relative mt-8 flex flex-col gap-10 border-l border-secondary pl-8">
                                {Object.entries(logByDate).map(([date, entries]) => (
                                    <div key={date} className="relative">
                                        {/* Dot on the timeline */}
                                        <span className="absolute top-1 -left-[37.5px] flex size-5 items-center justify-center rounded-full bg-brand-secondary">
                                            <span className="size-2 rounded-full bg-brand-solid" />
                                        </span>
                                        <h3 className="text-sm font-semibold text-secondary">{formatDate(date)}</h3>
                                        <div className="mt-3 flex flex-col gap-3">
                                            {entries.map((entry) => (
                                                <div key={entry.id} className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                                                    {editing ? (
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex flex-1 flex-col gap-2">
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="date"
                                                                        className={cx(inputCls, "w-40")}
                                                                        value={entry.date}
                                                                        onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                                                                    />
                                                                    <input
                                                                        className={inputCls}
                                                                        value={entry.title}
                                                                        placeholder="What shipped?"
                                                                        onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                                                                    />
                                                                </div>
                                                                <textarea
                                                                    className={cx(inputCls, "resize-none")}
                                                                    rows={2}
                                                                    value={entry.description}
                                                                    placeholder="Details (optional)"
                                                                    onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                                                                />
                                                                <input
                                                                    className={inputCls}
                                                                    type="url"
                                                                    value={entry.link ?? ""}
                                                                    placeholder="Link to the result (optional) — https://…"
                                                                    onChange={(e) => updateEntry(entry.id, { link: e.target.value })}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                title="Delete entry"
                                                                onClick={() => deleteEntry(entry.id)}
                                                                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-error-primary hover:text-fg-error-primary"
                                                            >
                                                                <Trash01 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-3">
                                                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-primary" aria-hidden="true" />
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-primary">{entry.title || "Untitled"}</h4>
                                                                {entry.description && <p className="mt-1 text-sm text-tertiary">{entry.description}</p>}
                                                                {entry.link?.trim() && (
                                                                    <Button
                                                                        href={entry.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        color="link-color"
                                                                        size="sm"
                                                                        iconTrailing={LinkExternal01}
                                                                        className="mt-1.5"
                                                                    >
                                                                        View result
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>

                    </div>
                </div>
            </main>

            {/* ——— Feature detail slide-in panel ——— */}
            <AnimatePresence>
                {openFeature && featureDetail && (
                    <motion.div
                        key="feature-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setOpenFeature(null)}
                        className="fixed inset-0 z-40 bg-overlay/40"
                    />
                )}
                {openFeature && featureDetail && (
                    <motion.aside
                        key="feature-panel"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-full flex-col border-l border-secondary bg-primary shadow-xl"
                    >
                        <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-secondary bg-primary px-5">
                            <div className="min-w-0">
                                <h3 className="truncate text-md font-semibold text-primary">{featureDetail.text || "Untitled"}</h3>
                                <p className="text-sm text-tertiary">About this feature</p>
                            </div>
                            <button
                                type="button"
                                title="Close"
                                onClick={() => setOpenFeature(null)}
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary"
                            >
                                <XClose className="size-5" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-secondary p-4">
                            {/* Group 1 — About & Request by */}
                            <div className="divide-y divide-secondary rounded-xl border border-secondary bg-primary shadow-xs">
                                <div className="p-4">
                                    <h4 className="text-xs font-semibold tracking-wide text-quaternary uppercase">About</h4>
                                    {editing ? (
                                        <textarea
                                            className={cx(inputCls, "mt-2 resize-none")}
                                            rows={4}
                                            value={featureDetail.about ?? ""}
                                            placeholder="What is this feature and why does it exist?"
                                            onChange={(e) => updateFeature(openFeature.col, openFeature.id, { about: e.target.value })}
                                        />
                                    ) : (
                                        <p className={cx("mt-1.5 text-sm leading-6", featureDetail.about ? "text-secondary" : "text-placeholder italic")}>
                                            {featureDetail.about || "No description yet — unlock to edit"}
                                        </p>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Request by</h4>
                                    {editing ? (
                                        <input
                                            className={cx(inputCls, "mt-2")}
                                            value={featureDetail.requestedBy ?? ""}
                                            placeholder="Names, separated by commas"
                                            onChange={(e) => updateFeature(openFeature.col, openFeature.id, { requestedBy: e.target.value })}
                                        />
                                    ) : featureDetail.requestedBy?.trim() ? (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {featureDetail.requestedBy
                                                .split(",")
                                                .map((n) => n.trim())
                                                .filter(Boolean)
                                                .map((name) => (
                                                    <Badge key={name} size="sm" type="pill-color" color="gray">
                                                        {name}
                                                    </Badge>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="mt-1.5 text-sm text-placeholder italic">No one yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Group 2 — Ideation, Result & Approval */}
                            <div className="divide-y divide-secondary rounded-xl border border-secondary bg-primary shadow-xs">
                                <div className="p-4">
                                    <h4 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Ideation</h4>
                                    {editing ? (
                                        <textarea
                                            className={cx(inputCls, "mt-2 resize-none")}
                                            rows={5}
                                            value={featureDetail.ideation ?? ""}
                                            placeholder="Ideas, approaches, sketches…"
                                            onChange={(e) => updateFeature(openFeature.col, openFeature.id, { ideation: e.target.value })}
                                        />
                                    ) : (
                                        <p
                                            className={cx(
                                                "mt-1.5 text-sm leading-6 whitespace-pre-line",
                                                featureDetail.ideation ? "text-secondary" : "text-placeholder italic",
                                            )}
                                        >
                                            {featureDetail.ideation || "Nothing yet"}
                                        </p>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Result</h4>
                                    {editing ? (
                                        <textarea
                                            className={cx(inputCls, "mt-2 resize-none")}
                                            rows={3}
                                            value={featureDetail.result ?? ""}
                                            placeholder="What was the outcome?"
                                            onChange={(e) => updateFeature(openFeature.col, openFeature.id, { result: e.target.value })}
                                        />
                                    ) : (
                                        <p
                                            className={cx(
                                                "mt-1.5 text-sm leading-6 whitespace-pre-line",
                                                featureDetail.result ? "text-secondary" : "text-placeholder italic",
                                            )}
                                        >
                                            {featureDetail.result || "Nothing yet"}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <h4 className="text-xs font-semibold tracking-wide text-quaternary uppercase">Approve?</h4>
                                    {editing ? (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                color={featureDetail.approval === "approved" ? "primary" : "secondary"}
                                                iconLeading={CheckCircle}
                                                onClick={() =>
                                                    updateFeature(openFeature.col, openFeature.id, {
                                                        approval: featureDetail.approval === "approved" ? undefined : "approved",
                                                    })
                                                }
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                color={featureDetail.approval === "rejected" ? "primary-destructive" : "secondary"}
                                                iconLeading={XClose}
                                                onClick={() =>
                                                    updateFeature(openFeature.col, openFeature.id, {
                                                        approval: featureDetail.approval === "rejected" ? undefined : "rejected",
                                                    })
                                                }
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <BadgeWithDot
                                            size="md"
                                            type="pill-color"
                                            color={featureDetail.approval === "approved" ? "success" : featureDetail.approval === "rejected" ? "error" : "gray"}
                                        >
                                            {featureDetail.approval === "approved" ? "Approved" : featureDetail.approval === "rejected" ? "Rejected" : "Pending"}
                                        </BadgeWithDot>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
};
